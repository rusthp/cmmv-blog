"""
article_validator.py — Automated safety/fact-check gate for ContentMind.

Open-topic articles publish automatically with no human review (status=
"cron" in cmmv_publisher), so this module is the only check standing
between a generated draft and a live post. It must fail closed: any doubt
means the article is NOT published, only logged.

Two checks, run in order:
  1. Sensitive-claim corroboration — claims about death, injury, arrest,
     crime, abuse or hospitalization require at least 2 INDEPENDENT sources
     (different feeds) reporting the same claim. A single outlet's
     clickbait headline ("Fulano morreu?") is not enough to publish
     something as fact — this is exactly the "Kai Cenat morreu" case.
  2. Grounding — an LLM-judged check that every factual claim in the
     generated article traces back to the source news_items the writer
     prompt was given (same safeguard content_generator's prompt already
     asks for, verified independently here instead of trusting the writer
     call graded its own homework).
"""
import json
import logging
import re
import unicodedata
from dataclasses import dataclass

from config import GROQ_API_KEY, GROQ_MODEL
from content_generator import GeneratedArticle, _parse_groq_json
from trend_scanner import TrendData

logger = logging.getLogger("content-mind.validator")

_SENSITIVE_PATTERNS = [
    r"\bmorr\w*", r"\bfaleceu\w*", r"\bmorte\w*", r"\bmorto\w*", r"\bmorta\w*",
    r"\bpres[oa]\w*", r"\bprisa\w*", r"\bacusad[oa]\w*", r"\bacusac\w*",
    r"\bestupr\w*", r"\babus\w*", r"\bcrime\w*", r"\bhospitaliz\w*",
    r"\binternad[oa]\w*", r"\bsuicid\w*", r"\bassassin\w*",
]
_SENSITIVE_RE = re.compile("|".join(_SENSITIVE_PATTERNS), re.IGNORECASE)


@dataclass
class ValidationResult:
    is_valid: bool
    reason: str = ""


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    return text.encode("ascii", "ignore").decode("ascii").lower()


def _has_sensitive_claim(text: str) -> bool:
    return bool(_SENSITIVE_RE.search(_normalize(text)))


def _check_corroboration(article: GeneratedArticle, trend: TrendData) -> ValidationResult:
    combined = article.title + " " + article.content
    if not _has_sensitive_claim(combined):
        return ValidationResult(True)

    corroborating_sources = {
        item.source for item in trend.news_items
        if _has_sensitive_claim(item.title + " " + item.summary)
    }
    if len(corroborating_sources) < 2:
        return ValidationResult(
            False,
            "Sensitive claim (death/arrest/health/crime) with only "
            f"{len(corroborating_sources)} independent source(s) reporting it "
            "— needs 2+ before publishing as fact.",
        )
    return ValidationResult(True)


def _check_grounding(article: GeneratedArticle, trend: TrendData) -> ValidationResult:
    if not GROQ_API_KEY:
        return ValidationResult(False, "GROQ_API_KEY not set — cannot run grounding check (fail-closed)")

    try:
        from groq import Groq
    except ImportError:
        return ValidationResult(False, "groq package not installed (fail-closed)")

    sources_text = "\n".join(
        f"- [{item.source}] {item.title}: {item.summary[:200]}"
        for item in trend.news_items[:8]
    )

    prompt = f"""Você é um editor de fact-checking. Abaixo estão (1) as notícias-fonte reais e (2) um artigo gerado a partir delas.

FONTES:
{sources_text}

ARTIGO GERADO:
Título: {article.title}
Conteúdo: {article.content[:3000]}

Sua tarefa é achar FATOS INVENTADOS — não achar toda frase que não seja uma citação literal da fonte.

Considere "ungrounded" (não respaldado) APENAS quando o artigo:
- Inventa um evento, número, data, nome, citação ou resultado que não está nas fontes
- Afirma como fato confirmado algo que as fontes tratam como boato/rumor/especulação não confirmada
- Descreve uma ação/decisão específica (ex: "o jogador deve fazer X") que as fontes não afirmam ter
  acontecido — quando a fonte só levanta a possibilidade como pergunta em aberto

NÃO considere "ungrounded" — isso é jornalismo normal, não invenção:
- Comentário/análise/opinião do autor sobre o significado ou impacto de um fato real já confirmado
  (ex: "isso pode atrair novos assinantes", "isso é considerado rápido pelo mercado") — desde que
  o FATO BASE por trás da opinião esteja nas fontes
- Contextualização geral, comparações, ou conclusões razoáveis derivadas logicamente dos fatos reais
- Parágrafo de fechamento com opinião/análise, que é prática editorial esperada, não fabricação

Se o artigo inventou o fato-base de uma afirmação, isso é ungrounded. Se o artigo só opinou/analisou
em cima de um fato-base real, isso NÃO é ungrounded.

Retorne APENAS um JSON, sem markdown: {{"grounded": true/false, "issues": ["lista de FATOS inventados, se houver — não liste opiniões/análises"]}}"""

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=2048,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    except Exception as exc:
        logger.error("Grounding check request failed: %s", exc)
        return ValidationResult(False, f"Grounding check request failed (fail-closed): {exc}")

    # Reuse content_generator's multi-strategy JSON parser (handles the same
    # Groq output quirks the article-generation call already deals with).
    data = _parse_groq_json(raw, article.title)
    if data is None:
        logger.error("Grounding check: could not parse Groq response: %r", raw[:300])
        return ValidationResult(False, "Grounding check response unparseable (fail-closed)")

    if not data.get("grounded", False):
        return ValidationResult(False, f"Ungrounded claims detected: {data.get('issues', [])}")
    return ValidationResult(True)


def validate_article(article: GeneratedArticle, trend: TrendData) -> ValidationResult:
    """Run all gates in order, short-circuiting on the first failure."""
    if len(article.content) < 100:
        return ValidationResult(False, "Content too short")

    corroboration = _check_corroboration(article, trend)
    if not corroboration.is_valid:
        return corroboration

    return _check_grounding(article, trend)
