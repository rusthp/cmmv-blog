"""
hunting_bridge.py — Turn an approved hunting result into a ContentMind draft.

The hunting queue (packages/rss-aggregation) collects news found on Google
News RSS for editorial keywords and lets a human approve the ones worth
covering. When a result is approved, cmmv-blog's HuntingArticleGeneratorService
invokes `content_mind.py --hunting-result` and pipes the approved item here as
JSON on stdin.

Difference from the game/open-topic flows:
  - Input is a single, human-approved news item (title/link/source) plus the
    keyword that found it, instead of a scanned trend batch.
  - The post is created as status="draft", never "cron". A human already chose
    the subject, but the generated text still has to be reviewed and published
    by hand — this path must never put anything live on its own.
  - article_validator is deliberately NOT run: it is the fail-closed gate for
    the open-topic flow *because that flow publishes with no human review*, and
    its grounding check would reject nearly every single-source item. Here the
    editorial review of the draft is the gate.
"""
import json
import logging
import sys

from content_generator import generate_article
from cmmv_publisher import publish_draft
from game_registry import GameEntry
from trend_scanner import NewsItem, TrendData

logger = logging.getLogger("content-mind.hunting")

# Marker so the caller can pick the machine-readable payload out of stdout even
# if something else in the process writes there.
RESULT_MARKER = "CONTENTMIND_RESULT"


def _slug_hint(keyword: str, title: str) -> str:
    """Topic slug used only for logging/prompt context — the real post slug is
    derived from the generated title by content_generator."""
    base = (keyword or title or "hunting").strip().lower()
    return base.replace(" ", "-").replace("|", "-")[:60] or "hunting"


def process_hunting_result(payload: dict) -> dict:
    """
    Generate and store a DRAFT article for one approved hunting result.

    Args:
        payload: {"title", "link", "source", "keyword", "summary"?}

    Returns:
        {"success": bool, "postId": str|None, "title": str|None, "error": str|None}
    """
    title = (payload.get("title") or "").strip()
    link = (payload.get("link") or "").strip()

    if not title:
        return {"success": False, "postId": None, "title": None, "error": "Missing 'title' in hunting payload"}

    source = (payload.get("source") or "").strip() or "Google News"
    keyword = (payload.get("keyword") or "").strip()
    summary = (payload.get("summary") or "").strip()

    # The keyword is the editorial theme the human was hunting for ("prefeitura
    # counter-strike evento"); it is a better topic label for the prompt than
    # the headline itself, which content_generator already receives as a fact.
    topic = keyword or title
    slug = _slug_hint(keyword, title)

    trend = TrendData(
        game_name=topic,
        news_items=[
            NewsItem(
                title=title,
                summary=summary,
                url=link,
                source=source,
            )
        ],
    )

    logger.info("Generating draft for approved hunting result: %r (source: %s)", title, source)

    article = generate_article(trend, slug)

    if not article:
        return {"success": False, "postId": None, "title": None, "error": "Article generation returned None"}

    # Synthetic entry: the hunting queue has no game registry entry, and tags
    # are left empty so the human reviewer classifies the draft themselves.
    entry = GameEntry(
        name=topic,
        slug=slug,
        subreddits=[],
        yt_queries=[],
        tags=[],
        categories=[],
    )

    try:
        # status="draft" is mandatory here — see module docstring.
        response = publish_draft(article, entry, status="draft")
    except Exception as exc:
        logger.error("Failed to create draft for %r: %s", title, exc)
        return {"success": False, "postId": None, "title": article.title, "error": str(exc)}

    inner = response.get("result", response)
    post_id = str(inner.get("id") or inner.get("_id") or "") or None

    logger.info("Draft created for hunting result %r — post id: %s", title, post_id)

    return {"success": True, "postId": post_id, "title": article.title, "error": None}


def run_from_stdin() -> int:
    """CLI entry point: read the payload from stdin, print the result payload."""
    raw = sys.stdin.read()

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        result = {"success": False, "postId": None, "title": None, "error": f"Invalid JSON on stdin: {exc}"}
        print(f"{RESULT_MARKER} {json.dumps(result)}")
        return 1

    if not isinstance(payload, dict):
        result = {"success": False, "postId": None, "title": None, "error": "Payload must be a JSON object"}
        print(f"{RESULT_MARKER} {json.dumps(result)}")
        return 1

    try:
        result = process_hunting_result(payload)
    except Exception as exc:  # never let a traceback be the only output
        logger.exception("Unexpected error processing hunting result")
        result = {"success": False, "postId": None, "title": None, "error": str(exc)}

    print(f"{RESULT_MARKER} {json.dumps(result)}")

    return 0 if result.get("success") else 1
