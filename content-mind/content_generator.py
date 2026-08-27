"""
content_generator.py — Generate gaming articles from trend data using Groq.

Produces a full HTML article in Brazilian Portuguese suitable for
ProPlay News, with SEO metadata.
"""
import json
import logging
import re
import unicodedata
from dataclasses import dataclass
from typing import Optional

from config import GROQ_API_KEY, GROQ_MODEL
from trend_scanner import TrendData, fetch_og_image

logger = logging.getLogger("content-mind.generator")


@dataclass
class GeneratedArticle:
    title: str
    slug: str
    content: str                  # HTML
    excerpt: str
    meta_title: str
    meta_description: str
    meta_keywords: str
    feature_image: str = ""


# How many of the top news items to try the og:image fallback on before
# giving up — capped so a run with no RSS/Steam images doesn't hammer several
# source sites with extra requests.
_OG_IMAGE_FALLBACK_ATTEMPTS = 3


def _pick_feature_image(trend: TrendData) -> str:
    # Prefer an image the scanner already found for free (RSS enclosure/media,
    # Steam contents) — no extra network request needed.
    for item in trend.news_items:
        if item.image_url:
            return item.image_url

    # Fall back to scraping og:image from a few candidate source pages.
    attempts = 0
    for item in trend.news_items:
        if not item.url:
            continue
        attempts += 1
        if attempts > _OG_IMAGE_FALLBACK_ATTEMPTS:
            break
        image = fetch_og_image(item.url)
        if image:
            return image

    return ""


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:80]


def _parse_groq_json(raw: str, game_name: str) -> Optional[dict]:
    """
    Robustly parse the JSON envelope returned by Groq.

    Groq sometimes embeds the HTML content with literal newlines/tabs that
    are invalid inside a JSON string. Strategy:
      1. Direct parse (fast path, works when output is clean).
      2. Extract the outermost {...} block and try again.
      3. Field-by-field extraction via regex as last resort.
    """
    # Fast path
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strip control characters that are illegal inside JSON strings
    # (keeps \n \t that are between keys, removes embedded bare ones)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Extract outermost {...}
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Last resort: pull fields individually. Regex extraction grabs the raw
    # substring as-is — it does NOT perform JSON string unescaping the way
    # json.loads would, so \n / \t / \\ sequences the model wrote as valid
    # JSON escapes (per the prompt's own instructions) must be unescaped here
    # manually, or they show up as literal backslash-n text on the page.
    def _extract(field: str) -> str:
        m = re.search(rf'"{field}"\s*:\s*"(.*?)"(?=\s*[,}}])', cleaned, re.DOTALL)
        if not m:
            return ""
        value = m.group(1)
        value = value.replace('\\n', '\n').replace('\\t', ' ').replace('\\"', '"').replace('\\\\', '\\')
        return value

    title = _extract("title")
    content = _extract("content")
    if title and content:
        logger.warning("Used regex fallback for JSON parsing (%s)", game_name)
        return {
            "title": title,
            "content": content,
            "excerpt": _extract("excerpt"),
            "meta_title": _extract("meta_title"),
            "meta_description": _extract("meta_description"),
            "meta_keywords": _extract("meta_keywords"),
        }

    logger.error("All JSON parse strategies failed for %s", game_name)
    return None


def _build_prompt(trend: TrendData, game_slug: str) -> str:
    news_section = ""
    for i, item in enumerate(trend.news_items[:8], 1):
        news_section += f"{i}. [{item.source}] {item.title}\n"
        if item.summary:
            news_section += f"   {item.summary[:200]}\n"

    return f"""Você é um jornalista de games para o site ProPlay News (proplaynews.com.br), escrevendo em Português Brasileiro.

Com base EXCLUSIVAMENTE nas notícias reais abaixo para **{trend.game_name}**, escreva um artigo completo para o blog.

## Notícias e tendências recentes (única fonte de fatos permitida):
{news_section or "(nenhuma notícia real encontrada nesta rodada)"}

## REGRA MAIS IMPORTANTE — NÃO INVENTE FATOS:
- Use SOMENTE as informações fornecidas acima. Não invente posts de Reddit, vídeos de YouTube,
  comentários de comunidade, citações, estatísticas ou eventos que não estejam explicitamente
  nas notícias listadas. Não existe dado de Reddit ou YouTube disponível — não escreva seções
  que finjam ter essa origem.
- Se as notícias acima forem poucas ou genéricas, escreva um artigo mais curto e honesto em vez
  de preencher com detalhes fabricados. É melhor um artigo verdadeiro e simples do que um artigo
  longo com informação inventada.
- Se não houver nenhuma notícia real (seção vazia acima), escreva um texto claramente genérico/
  atemporal sobre o jogo (curiosidades, guia, contexto geral) e NÃO alegue que é uma cobertura
  "desta semana" ou cite eventos, patches ou resultados específicos que você não tem confirmados.

## Instruções do artigo:

1. **Título**: criativo, atraente, em português, máximo 80 caracteres — refletindo o conteúdo real acima
2. **Conteúdo HTML**: artigo usando tags HTML (h2, p, strong, em — use h3/ul/li só se realmente ajudar,
   não por padrão), tamanho proporcional à quantidade de informação real disponível (não infle com
   conteúdo inventado)
   - ESTRUTURA: NÃO fragmente o artigo em muitos `<h2>` pequenos, um por notícia/fato isolado — isso lê
     como lista de tópicos gerada por IA, não como matéria jornalística. Agrupe as notícias relacionadas
     em **no máximo 2 ou 3 seções temáticas** (ex: "o que aconteceu" + "o que vem por aí", ou uma única
     seção corrida se as notícias forem poucas/conectadas), cada uma com 2-4 parágrafos bem desenvolvidos
     que conectam os fatos entre si (causa/consequência, comparação, contexto) — não um parágrafo curto
     e solto por notícia.
   - Comece com um parágrafo de abertura (sem h2) que já entrega o essencial, como uma lide de notícia.
   - Feche com um parágrafo de análise/opinião natural (dentro de uma das seções, não precisa de h2
     "Conclusão" dedicado) — deixando claro quando é opinião e não fato, com um gancho pro leitor.
3. **Excerpt**: resumo de 1-2 frases (máximo 160 caracteres), baseado nos fatos reais
4. **Meta**: para SEO

Retorne **exclusivamente** um JSON válido com esta estrutura:
{{
  "title": "string",
  "content": "string (HTML completo)",
  "excerpt": "string",
  "meta_title": "string (máx 60 chars)",
  "meta_description": "string (máx 160 chars)",
  "meta_keywords": "string (5-8 palavras-chave separadas por vírgula)"
}}

IMPORTANTE sobre o formato: retorne um JSON válido em UMA ÚNICA LINHA (sem quebras de linha
literais dentro dos valores). Onde o HTML do campo "content" precisar de quebra de linha,
use o caractere de escape \\n, nunca uma quebra de linha real dentro da string.
Não inclua markdown fora do JSON. Não use ```json```. Retorne apenas o JSON."""


def generate_article(trend: TrendData, game_slug: str) -> Optional[GeneratedArticle]:
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not set")
        return None

    try:
        from groq import Groq
    except ImportError:
        logger.error("groq package not installed. Run: pip install groq")
        return None

    prompt = _build_prompt(trend, game_slug)

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4096,
        )
        raw = response.choices[0].message.content.strip()
    except Exception as exc:
        logger.error("Groq API error for %s: %s", trend.game_name, exc)
        return None

    # Strip possible markdown code fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    data = _parse_groq_json(raw, trend.game_name)
    if data is None:
        return None

    title = data.get("title", f"Destaques da semana: {trend.game_name}")
    content = data.get("content", "")
    excerpt = data.get("excerpt", "")
    meta_title = data.get("meta_title", title[:60])
    meta_description = data.get("meta_description", excerpt[:160])
    meta_keywords = data.get("meta_keywords", "")

    if len(content) < 100:
        logger.error("Generated content too short for %s (%d chars)", trend.game_name, len(content))
        return None

    return GeneratedArticle(
        title=title,
        slug=_slugify(title),
        content=content,
        excerpt=excerpt,
        meta_title=meta_title,
        meta_description=meta_description,
        meta_keywords=meta_keywords,
        feature_image=_pick_feature_image(trend),
    )
