"""
trend_scanner.py — Collects trending content for a game from Reddit and YouTube.

Uses only public APIs:
  - Reddit: /r/{sub}/top.json (no auth required for public subreddits)
  - YouTube: yt-dlp with ytsearch (no API key, public results)
"""
import json
import logging
import subprocess
import time
import urllib.request
import urllib.error
from dataclasses import dataclass
from typing import List

from config import REDDIT_POSTS_PER_GAME, SCAN_PERIOD, YOUTUBE_VIDEOS_PER_GAME
from game_registry import GameEntry

logger = logging.getLogger("content-mind.scanner")

REDDIT_HEADERS = {
    "User-Agent": "ContentMind/1.0 (ProPlay News bot; contact:content@proplaynews.com.br)",
    "Accept": "application/json",
}


@dataclass
class RedditPost:
    title: str
    selftext: str
    score: int
    url: str
    subreddit: str
    permalink: str


@dataclass
class YouTubeVideo:
    title: str
    description: str
    uploader: str
    view_count: int
    url: str


@dataclass
class TrendData:
    game_name: str
    reddit_posts: List[RedditPost]
    yt_videos: List[YouTubeVideo]


def _reddit_top(subreddit: str, limit: int, period: str) -> List[RedditPost]:
    url = f"https://www.reddit.com/r/{subreddit}/top.json?t={period}&limit={limit}"
    req = urllib.request.Request(url, headers=REDDIT_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        posts = []
        for child in data.get("data", {}).get("children", []):
            p = child.get("data", {})
            posts.append(RedditPost(
                title=p.get("title", ""),
                selftext=p.get("selftext", "")[:500],
                score=p.get("score", 0),
                url=p.get("url", ""),
                subreddit=subreddit,
                permalink=f"https://reddit.com{p.get('permalink', '')}",
            ))
        return posts
    except urllib.error.URLError as exc:
        logger.warning("Reddit fetch failed for r/%s: %s", subreddit, exc)
        return []
    except Exception as exc:
        logger.warning("Reddit parse error for r/%s: %s", subreddit, exc)
        return []


def _yt_search(query: str, limit: int) -> List[YouTubeVideo]:
    """
    Uses yt-dlp to query YouTube search results without an API key.
    Falls back gracefully if yt-dlp is not installed.
    """
    try:
        result = subprocess.run(
            [
                "yt-dlp",
                f"ytsearch{limit}:{query}",
                "--dump-json",
                "--no-download",
                "--quiet",
                "--no-warnings",
                "--socket-timeout", "20",
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        videos = []
        for line in result.stdout.strip().splitlines():
            if not line.strip():
                continue
            try:
                info = json.loads(line)
                videos.append(YouTubeVideo(
                    title=info.get("title", ""),
                    description=(info.get("description") or "")[:400],
                    uploader=info.get("uploader", ""),
                    view_count=info.get("view_count") or 0,
                    url=info.get("webpage_url", ""),
                ))
            except json.JSONDecodeError:
                continue
        return videos
    except FileNotFoundError:
        logger.warning("yt-dlp not found; skipping YouTube scan. Install: pip install yt-dlp")
        return []
    except subprocess.TimeoutExpired:
        logger.warning("yt-dlp timed out for query: %s", query)
        return []
    except Exception as exc:
        logger.warning("yt-dlp error for query '%s': %s", query, exc)
        return []


def scan_game(game: GameEntry) -> TrendData:
    """Collect trending content for a single game."""
    reddit_posts: List[RedditPost] = []
    for sub in game.subreddits:
        posts = _reddit_top(sub, REDDIT_POSTS_PER_GAME, SCAN_PERIOD)
        reddit_posts.extend(posts)
        time.sleep(0.5)  # be polite to Reddit

    # Deduplicate by title similarity (keep top-scored)
    seen_titles: set[str] = set()
    unique_posts: List[RedditPost] = []
    for p in sorted(reddit_posts, key=lambda x: x.score, reverse=True):
        key = p.title[:40].lower()
        if key not in seen_titles:
            seen_titles.add(key)
            unique_posts.append(p)

    yt_videos: List[YouTubeVideo] = []
    for query in game.yt_queries[:2]:
        videos = _yt_search(query, YOUTUBE_VIDEOS_PER_GAME)
        yt_videos.extend(videos)
        time.sleep(1)

    return TrendData(
        game_name=game.name,
        reddit_posts=unique_posts[:REDDIT_POSTS_PER_GAME],
        yt_videos=yt_videos[:YOUTUBE_VIDEOS_PER_GAME],
    )
