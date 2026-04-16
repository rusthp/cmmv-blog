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
from trend_scanner import TrendData

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


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:80]


def _build_prompt(trend: TrendData, game_slug: str) -> str:
    reddit_section = ""
    for i, post in enumerate(trend.reddit_posts[:5], 1):
        reddit_section += f"{i}. [{post.subreddit}] {post.title} (score: {post.score})\n"
        if post.selftext:
            reddit_section += f"   {post.selftext[:200]}\n"

    yt_section = ""
    for i, v in enumerate(trend.yt_videos[:4], 1):
        yt_section += f"{i}. {v.title} — {v.uploader} ({v.view_count:,} views)\n"
        if v.description:
            yt_section += f"   {v.description[:150]}\n"

    return f"""Você é um jornalista de games para o site ProPlay News (proplaynews.com.br), escrevendo em Português Brasileiro.

Com base nas tendências desta semana para **{trend.game_name}**, escreva um artigo completo para o blog.

## Tendências Reddit (esta semana):
{reddit_section or "(sem dados)"}

## Tendências YouTube (esta semana):
{yt_section or "(sem dados)"}

## Instruções do artigo:

1. **Título**: criativo, atraente, em português, máximo 80 caracteres
2. **Conteúdo HTML**: artigo completo com pelo menos 600 palavras usando tags HTML (h2, h3, p, ul, li, strong, em)
   - Introdução que contextualiza as tendências da semana
   - Seção sobre destaques da comunidade (baseado no Reddit)
   - Seção sobre conteúdo em vídeo (baseado no YouTube)
   - Análise/opinião sobre o cenário atual do jogo
   - Conclusão com call-to-action para os leitores
3. **Excerpt**: resumo de 1-2 frases (máximo 160 caracteres)
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

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        # Try to extract JSON from the response
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except json.JSONDecodeError:
                logger.error("Failed to parse Groq JSON for %s: %s", trend.game_name, exc)
                return None
        else:
            logger.error("No JSON found in Groq response for %s", trend.game_name)
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
    )
