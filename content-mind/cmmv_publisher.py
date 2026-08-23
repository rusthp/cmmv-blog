"""
cmmv_publisher.py — Authenticate with cmmv-blog and publish draft posts.

Auth flow:
  POST /auth/login  → { token, refreshToken }
  POST /blog/posts  → create draft (Authorization: Bearer <token>)
"""
import json
import logging
import time
import urllib.request
import urllib.error
from dataclasses import dataclass
from typing import List, Optional

from config import PROPLAY_API_URL, PROPLAY_USERNAME, PROPLAY_PASSWORD
from content_generator import GeneratedArticle
from game_registry import GameEntry

logger = logging.getLogger("content-mind.publisher")

_token: Optional[str] = None
_token_acquired_at: float = 0.0
TOKEN_TTL = 3600 * 6  # treat token as valid for 6h (refresh proactively)


def _api(method: str, path: str, body: Optional[dict] = None, token: Optional[str] = None, timeout: int = 20) -> dict:
    url = f"{PROPLAY_API_URL}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode(errors="replace")
        logger.error("HTTP %s %s → %d: %s", method, path, exc.code, body_text[:300])
        raise
    except urllib.error.URLError as exc:
        logger.error("URL error %s %s: %s", method, path, exc)
        raise


def _get_token() -> str:
    global _token, _token_acquired_at

    if _token and (time.time() - _token_acquired_at) < TOKEN_TTL:
        return _token

    if not PROPLAY_USERNAME or not PROPLAY_PASSWORD:
        raise RuntimeError(
            "PROPLAY_USERNAME and PROPLAY_PASSWORD must be set in environment. "
            "These are the cmmv-blog admin credentials."
        )

    logger.info("Authenticating with cmmv-blog as '%s'...", PROPLAY_USERNAME)
    result = _api("POST", "/auth/login", {"username": PROPLAY_USERNAME, "password": PROPLAY_PASSWORD})

    # cmmv-blog wraps the payload as {"status", "result": {"token", "refreshToken"}}
    # rather than returning the token at the top level.
    inner = result.get("result", result)
    token = inner.get("token") or inner.get("accessToken") or inner.get("access_token")
    if not token:
        raise RuntimeError(f"Login failed — no token in response: {result}")

    _token = token
    _token_acquired_at = time.time()
    logger.info("Authenticated successfully.")
    return _token


def publish_draft(
    article: GeneratedArticle,
    game: GameEntry,
    status: str = "draft",
) -> dict:
    """
    Create a draft post in cmmv-blog.

    Args:
        article: Generated article content.
        game: Game entry (for tags/categories).
        status: "draft" or "cron" (scheduled). Default: "draft".

    Returns:
        API response dict.
    """
    token = _get_token()

    post_payload = {
        "post": {
            "title": article.title,
            "content": article.content,
            "slug": article.slug,
            "tags": game.tags,
            "categories": game.categories,
            "status": status,
            "visibility": "public",
            "type": "post",
            "author": "",
            "authors": [],
            "metaTitle": article.meta_title,
            "metaDescription": article.meta_description,
            "metaKeywords": article.meta_keywords,
            "featured": False,
            "pushNotification": False,
        },
        "meta": {
            "post": "",
            "metaTitle": article.meta_title,
            "metaDescription": article.meta_description,
            "metaKeywords": article.meta_keywords,
        },
    }

    logger.info("Publishing draft: '%s'", article.title)
    # Observed taking up to ~75s server-side (content moderation checks run
    # synchronously) — a short client timeout caused false-negative failures
    # even though the draft was actually created (verified against the DB).
    result = _api("POST", "/blog/posts", post_payload, token=token, timeout=120)
    inner = result.get("result", result)
    logger.info("Draft created — id: %s", inner.get("id") or inner.get("_id") or "?")
    return result


@dataclass
class PublishResult:
    game_slug: str
    game_name: str
    success: bool
    post_id: Optional[str] = None
    title: Optional[str] = None
    error: Optional[str] = None


def publish_game_content(game: GameEntry, article: GeneratedArticle) -> PublishResult:
    """Publish article for a game, return result with success/error info."""
    try:
        response = publish_draft(article, game)
        inner = response.get("result", response)
        post_id = str(inner.get("id") or inner.get("_id") or "")
        return PublishResult(
            game_slug=game.slug,
            game_name=game.name,
            success=True,
            post_id=post_id,
            title=article.title,
        )
    except Exception as exc:
        logger.error("Failed to publish for %s: %s", game.name, exc)
        return PublishResult(
            game_slug=game.slug,
            game_name=game.name,
            success=False,
            error=str(exc),
        )
