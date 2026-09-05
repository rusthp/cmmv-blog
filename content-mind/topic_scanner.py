"""
topic_scanner.py — Discovers open (non-game-specific) trending topics for
ProPlay News: viral streamer news, gaming-culture drama, rumors — anything
the fixed game_registry doesn't cover (e.g. "Kai Cenat morreu?").

Reuses the same BR_GAMING_FEEDS aggregators as trend_scanner.py but WITHOUT
per-game keyword filtering, then groups items that look like the same story
(shared significant keywords) so a claim can be corroborated across
independent outlets before article_validator trusts it as fact.
"""
import json
import logging
import re
import time
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from trend_scanner import NewsItem, BR_GAMING_FEEDS, _fetch_rss

logger = logging.getLogger("content-mind.topics")

SEEN_FILE = Path(__file__).parent / ".seen_topics.json"
SEEN_MAX_AGE_DAYS = 30

# Generic connector words in both languages — feeds mix pt-BR (IGN Brasil)
# and en-US (Dexerto, PCGamesN) sources, so a keyword-overlap match on a
# word like "with"/"will"/"como" is coincidence, not the same story.
_STOPWORDS = {
    # pt-BR
    "para", "seus", "suas", "esta", "este", "essa", "esse", "pelo", "pela",
    "como", "mais", "sera", "após", "apos", "vai", "vem", "diz", "sobre",
    "quando", "tambem", "tambm", "depois", "antes", "onde", "porque",
    # en-US
    "with", "will", "back", "says", "over", "whether", "like", "could",
    "here", "make", "fall", "love", "think", "that", "this", "from",
    "have", "been", "were", "when", "what", "which", "their", "about",
    "after", "into", "more", "than", "they", "your", "just", "only",
    "still", "even", "does", "doesn", "isn", "it's", "there", "should",
    "would", "being", "going", "first", "great", "biggest", "possible",
}


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    return text.encode("ascii", "ignore").decode("ascii").lower()


def _keywords(title: str) -> set:
    norm = _normalize(title)
    words = re.findall(r"[a-z0-9]+", norm)
    return {w for w in words if len(w) > 4 and w not in _STOPWORDS}


def _topic_key(title: str) -> str:
    kws = sorted(_keywords(title))[:6]
    return "|".join(kws) if kws else _normalize(title)[:60]


def _load_seen() -> dict:
    if SEEN_FILE.exists():
        try:
            return json.loads(SEEN_FILE.read_text())
        except Exception:
            pass
    return {}


def _save_seen(seen: dict) -> None:
    cutoff = time.time() - SEEN_MAX_AGE_DAYS * 86400
    pruned = {k: v for k, v in seen.items() if v > cutoff}
    SEEN_FILE.write_text(json.dumps(pruned, indent=2))


@dataclass
class OpenTopic:
    name: str                          # best headline standing in for the topic
    slug_hint: str
    items: List[NewsItem] = field(default_factory=list)

    @property
    def source_count(self) -> int:
        return len(set(i.source for i in self.items))


def scan_open_topics(limit: int = 1, min_sources: int = 1) -> List[OpenTopic]:
    """
    Fetch the BR gaming aggregator feeds with no game-name filtering, group
    items that share significant keywords (likely the same story reported by
    multiple outlets), skip topics already selected in a previous run
    (tracked in .seen_topics.json), and return up to `limit` fresh topics —
    ranked by how many independent sources are covering them.
    """
    all_items: List[NewsItem] = []
    for feed_url, feed_name in BR_GAMING_FEEDS:
        items = _fetch_rss(feed_url, feed_name, limit=30)
        all_items.extend(items)
        time.sleep(0.3)

    logger.info("Open-topic scan: %d raw items from %d feeds", len(all_items), len(BR_GAMING_FEEDS))

    # Greedy keyword-overlap clustering — items sharing 2+ significant words
    # are treated as coverage of the same underlying story.
    groups: List[OpenTopic] = []
    for item in all_items:
        kws = _keywords(item.title)
        if not kws:
            continue
        placed = False
        for group in groups:
            if len(kws & _keywords(group.name)) >= 2:
                group.items.append(item)
                placed = True
                break
        if not placed:
            groups.append(OpenTopic(name=item.title, slug_hint=_topic_key(item.title), items=[item]))

    seen = _load_seen()
    now = time.time()
    fresh = [g for g in groups if g.slug_hint not in seen and g.source_count >= min_sources]

    # Topics corroborated by more independent outlets are both more likely
    # to be real news (not a single blog's clickbait) and easier to pass the
    # sensitive-claim corroboration check in article_validator.
    fresh.sort(key=lambda g: g.source_count, reverse=True)
    selected = fresh[:limit]

    for g in selected:
        seen[g.slug_hint] = now
    _save_seen(seen)

    logger.info(
        "Open-topic scan: %d candidate(s) selected (of %d fresh, %d groups total)",
        len(selected), len(fresh), len(groups),
    )
    return selected
