"""
trend_scanner.py — Collects trending content for a game from multiple sources.

Sources (all public, no auth, work from VPS):
  - Steam News API: GetNewsForApp (games available on Steam)
  - Riot Games public data: LoL patch notes + Valorant patch notes
  - Brazilian gaming RSS feeds: Voxel, The Enemy, Level Up
  - Game-specific RSS/news feeds

Reddit and YouTube are blocked on VPS datacenter IPs — not used.
"""
import json
import logging
import re
import time
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import List, Optional

from config import REDDIT_POSTS_PER_GAME, YOUTUBE_VIDEOS_PER_GAME
from game_registry import GameEntry

logger = logging.getLogger("content-mind.scanner")

_HEADERS = {
    "User-Agent": "ContentMind/1.0 ProPlayNews (+https://proplaynews.com.br/)",
    "Accept": "application/json, text/xml, application/rss+xml, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}


@dataclass
class NewsItem:
    title: str
    summary: str
    url: str
    source: str
    date: str = ""
    image_url: str = ""


@dataclass
class TrendData:
    game_name: str
    news_items: List[NewsItem] = field(default_factory=list)
    # Legacy aliases kept for compatibility with content_generator.py
    reddit_posts: List[NewsItem] = field(default_factory=list)
    yt_videos: List[NewsItem] = field(default_factory=list)


def _fetch_url(url: str, accept_json: bool = True, timeout: int = 15) -> Optional[bytes]:
    headers = dict(_HEADERS)
    if accept_json:
        headers["Accept"] = "application/json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.URLError as exc:
        logger.warning("Fetch failed for %s: %s", url, exc)
        return None
    except Exception as exc:
        logger.warning("Error fetching %s: %s", url, exc)
        return None


_IMAGE_EXT_RE = re.compile(r'\.(?:jpe?g|png|webp|gif)(?:\?[^\s\]"\'<>]*)?$', re.IGNORECASE)


def _steam_contents_image(contents: str) -> str:
    """Steam news 'contents' is BBCode-ish text that often embeds [img]url[/img]
    or a raw image URL. Best-effort extraction, not guaranteed to find one."""
    m = re.search(r'\[img\](https?://[^\[\]]+)\[/img\]', contents, re.IGNORECASE)
    if m:
        return m.group(1)
    m = re.search(r'https?://\S+', contents)
    if m and _IMAGE_EXT_RE.search(m.group(0)):
        return m.group(0)
    return ""


def fetch_og_image(page_url: str) -> str:
    """
    Fallback when a source has no image of its own: fetch the article page and
    extract its og:image / twitter:image meta tag. Used sparingly (only for the
    handful of news items actually picked as the article's feature image
    candidate), never for every scanned item.
    """
    if not page_url:
        return ""
    data = _fetch_url(page_url, accept_json=False, timeout=10)
    if not data:
        return ""
    try:
        html = data.decode("utf-8", errors="ignore")
    except Exception:
        return ""

    for pattern in (
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']',
    ):
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            return m.group(1)
    return ""


# ── Steam News API ───────────────────────────────────────────────────────────

def _steam_news(app_id: int, count: int = 5) -> List[NewsItem]:
    url = (
        f"https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/"
        f"?appid={app_id}&count={count}&maxlength=300&format=json"
    )
    data = _fetch_url(url)
    if not data:
        return []
    try:
        parsed = json.loads(data)
        items = []
        for item in parsed.get("appnews", {}).get("newsitems", []):
            contents = item.get("contents", "")
            items.append(NewsItem(
                title=item.get("title", ""),
                summary=contents[:300],
                url=item.get("url", ""),
                source=f"Steam ({item.get('feedlabel', 'news')})",
                date=str(item.get("date", "")),
                image_url=_steam_contents_image(contents),
            ))
        return items
    except Exception as exc:
        logger.warning("Steam news parse error (appid=%d): %s", app_id, exc)
        return []


# ── RSS Feed Parser ───────────────────────────────────────────────────────────

def _parse_rss(data: bytes, source_name: str, limit: int = 5) -> List[NewsItem]:
    try:
        root = ET.fromstring(data)
    except ET.ParseError as exc:
        logger.warning("RSS parse error from %s: %s", source_name, exc)
        return []

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "media": "http://search.yahoo.com/mrss/",
    }
    items = []

    def _item_image(item_el) -> str:
        # <enclosure url="..." type="image/...">
        enclosure = item_el.find("enclosure")
        if enclosure is not None:
            enc_type = enclosure.get("type", "")
            enc_url = enclosure.get("url", "")
            if enc_url and (not enc_type or enc_type.startswith("image/")):
                return enc_url
        # Media RSS: <media:thumbnail url="..."/> or <media:content url="..." medium="image"/>
        thumb = item_el.find("media:thumbnail", ns)
        if thumb is not None and thumb.get("url"):
            return thumb.get("url")
        media_content = item_el.find("media:content", ns)
        if media_content is not None and media_content.get("url"):
            medium = media_content.get("medium", "")
            mtype = media_content.get("type", "")
            if medium == "image" or mtype.startswith("image/") or not (medium or mtype):
                return media_content.get("url")
        return ""

    # Standard RSS 2.0
    for item in root.findall(".//item")[:limit]:
        title = (item.findtext("title") or "").strip()
        desc = (item.findtext("description") or "")[:300].strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        image_url = _item_image(item)
        if title:
            items.append(NewsItem(title=title, summary=desc, url=link, source=source_name, date=pub, image_url=image_url))

    # Atom feeds
    if not items:
        for entry in root.findall(".//atom:entry", ns)[:limit]:
            title = (entry.findtext("atom:title", namespaces=ns) or "").strip()
            summary = (entry.findtext("atom:summary", namespaces=ns) or "")[:300].strip()
            link_el = entry.find("atom:link", ns)
            url = (link_el.get("href") if link_el is not None else "") or ""
            updated = (entry.findtext("atom:updated", namespaces=ns) or "").strip()
            image_url = _item_image(entry)
            if title:
                items.append(NewsItem(title=title, summary=summary, url=url, source=source_name, date=updated, image_url=image_url))

    return items


def _fetch_rss(url: str, source_name: str, limit: int = 5) -> List[NewsItem]:
    data = _fetch_url(url, accept_json=False)
    if not data:
        return []
    return _parse_rss(data, source_name, limit)


# ── General Gaming Aggregator Feeds ──────────────────────────────────────────
# No dedicated feed exists for every game (Riot/Epic/Garena don't publish RSS),
# so these broad aggregators are filtered by game-name keywords instead.
# Verified reachable FROM THE VM's IP (2026-07) — dotesports.com and esports.gg
# also looked fine from a residential IP but return 403 from this datacenter IP,
# so they're deliberately left out here.
BR_GAMING_FEEDS = [
    ("https://br.ign.com/feed.xml", "IGN Brasil"),
    ("https://www.dexerto.com/feed", "Dexerto"),
    ("https://www.pcgamesn.com/feed", "PCGamesN"),
]

# Stopwords stripped from game names before keyword-matching an article —
# without this, "League of Legends" would match any article containing "of".
_KEYWORD_STOPWORDS = {"of", "the", "a", "an", "2", "25"}


def _br_gaming_news(game_name: str, limit: int = 3) -> List[NewsItem]:
    """
    Fetch from general gaming RSS aggregators and filter by game name.
    """
    results: List[NewsItem] = []
    keywords = [kw for kw in game_name.lower().split() if kw not in _KEYWORD_STOPWORDS]

    for feed_url, feed_name in BR_GAMING_FEEDS:
        items = _fetch_rss(feed_url, feed_name, limit=20)
        for item in items:
            text = (item.title + " " + item.summary).lower()
            # Require ALL significant keywords present — a lone "league" or
            # "legends" matches too much unrelated content on general feeds.
            if keywords and all(kw in text for kw in keywords):
                results.append(item)
        time.sleep(0.3)

    return results[:limit]


# ── Source Registry per Game ─────────────────────────────────────────────────

# Steam App IDs for games available on Steam
STEAM_APP_IDS = {
    "cs2": 730,
    "dota-2": 570,
    "apex-legends": 1172470,
    "ea-sports-fc-25": 2669320,
    "pubg-mobile": None,    # mobile only
    "fortnite": None,       # Epic only
    "free-fire": None,      # mobile only
    "league-of-legends": None,  # Riot only
    "valorant": None,           # Riot only
    "minecraft": None,          # Microsoft/Mojang
}

# Specific RSS feeds per game (verified working)
GAME_FEEDS: dict = {
    # vlr.gg is a dedicated Valorant esports feed — no keyword filtering needed,
    # every item is already on-topic.
    "valorant": [("https://www.vlr.gg/rss", "VLR.gg")],
}


def scan_game(game: GameEntry) -> TrendData:
    """Collect news/trending content for a single game from all available sources."""
    all_news: List[NewsItem] = []

    # 1. Steam News (if app ID known)
    app_id = STEAM_APP_IDS.get(game.slug)
    if app_id:
        steam_items = _steam_news(app_id, count=5)
        all_news.extend(steam_items)
        logger.debug("Steam: %d items for %s", len(steam_items), game.name)
        time.sleep(0.5)

    # 2. Game-specific official feeds
    for feed_url, feed_name in GAME_FEEDS.get(game.slug, []):
        feed_items = _fetch_rss(feed_url, feed_name, limit=5)
        all_news.extend(feed_items)
        logger.debug("Feed %s: %d items", feed_name, len(feed_items))
        time.sleep(0.3)

    # 3. Brazilian gaming aggregator feeds (filtered by game name)
    br_items = _br_gaming_news(game.name, limit=5)
    all_news.extend(br_items)
    logger.debug("BR gaming: %d items for %s", len(br_items), game.name)

    # Deduplicate by title prefix
    seen: set[str] = set()
    unique: List[NewsItem] = []
    for item in all_news:
        key = item.title[:50].lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(item)

    top_news = unique[:max(REDDIT_POSTS_PER_GAME, YOUTUBE_VIDEOS_PER_GAME)]
    logger.info(
        "Scan complete for %s: %d news items from %d sources",
        game.name, len(top_news), len(set(n.source for n in top_news))
    )

    trend = TrendData(game_name=game.name, news_items=top_news)
    # Populate legacy aliases so content_generator.py works without changes
    trend.reddit_posts = top_news
    trend.yt_videos = []
    return trend
