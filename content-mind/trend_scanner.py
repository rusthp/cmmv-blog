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
            items.append(NewsItem(
                title=item.get("title", ""),
                summary=item.get("contents", "")[:300],
                url=item.get("url", ""),
                source=f"Steam ({item.get('feedlabel', 'news')})",
                date=str(item.get("date", "")),
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

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = []

    # Standard RSS 2.0
    for item in root.findall(".//item")[:limit]:
        title = (item.findtext("title") or "").strip()
        desc = (item.findtext("description") or "")[:300].strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        if title:
            items.append(NewsItem(title=title, summary=desc, url=link, source=source_name, date=pub))

    # Atom feeds
    if not items:
        for entry in root.findall(".//atom:entry", ns)[:limit]:
            title = (entry.findtext("atom:title", namespaces=ns) or "").strip()
            summary = (entry.findtext("atom:summary", namespaces=ns) or "")[:300].strip()
            link_el = entry.find("atom:link", ns)
            url = (link_el.get("href") if link_el is not None else "") or ""
            updated = (entry.findtext("atom:updated", namespaces=ns) or "").strip()
            if title:
                items.append(NewsItem(title=title, summary=summary, url=url, source=source_name, date=updated))

    return items


def _fetch_rss(url: str, source_name: str, limit: int = 5) -> List[NewsItem]:
    data = _fetch_url(url, accept_json=False)
    if not data:
        return []
    return _parse_rss(data, source_name, limit)


# ── Brazilian Gaming RSS Feeds ────────────────────────────────────────────────
# Verified working from VPS (2026-04)

BR_GAMING_FEEDS = [
    ("https://br.ign.com/feed.xml", "IGN Brasil"),
]


def _br_gaming_news(game_name: str, limit: int = 3) -> List[NewsItem]:
    """
    Fetch from BR gaming RSS feeds and filter by game name.
    """
    results: List[NewsItem] = []
    keywords = game_name.lower().split()

    for feed_url, feed_name in BR_GAMING_FEEDS:
        items = _fetch_rss(feed_url, feed_name, limit=20)
        for item in items:
            text = (item.title + " " + item.summary).lower()
            if any(kw in text for kw in keywords):
                results.append(item)
        time.sleep(0.3)

    return results[:limit]


# ── Source Registry per Game ─────────────────────────────────────────────────

# Steam App IDs for games available on Steam
STEAM_APP_IDS = {
    "cs2": 730,
    "dota-2": 570,
    "apex-legends": 1172470,
    "ea-sports-fc-25": 2537770,
    "pubg-mobile": None,    # mobile only
    "fortnite": None,       # Epic only
    "free-fire": None,      # mobile only
    "league-of-legends": None,  # Riot only
    "valorant": None,           # Riot only
    "minecraft": None,          # Microsoft/Mojang
}

# Specific RSS feeds per game (verified working from VPS)
GAME_FEEDS: dict = {
    # No verified game-specific feeds at this time; IGN BR covers all major titles
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
