"""
content_mind.py — ContentMind orchestrator for ProPlay News.

Runs as a standalone script (called by systemd timer or cron).
Each invocation processes GAMES_PER_RUN games from the registry,
rotating so all games are covered over time.

Usage:
  python content_mind.py              # process next batch of games
  python content_mind.py --game lol   # process a specific game slug
  python content_mind.py --all        # process all games (slow, use sparingly)
  python content_mind.py --list       # list registered games
"""
import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import List

from config import GAMES_PER_RUN
from game_registry import GAMES, GameEntry, get_game, get_all_slugs
from trend_scanner import scan_game
from content_generator import generate_article
from cmmv_publisher import publish_game_content, PublishResult

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("content-mind")

# ── State file: tracks which games were processed last ──────────────────────
STATE_FILE = Path(__file__).parent / ".state.json"


def _load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"last_index": 0, "runs": []}


def _save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))


def _next_games(count: int) -> List[GameEntry]:
    """Round-robin selection: pick `count` games starting from last_index."""
    state = _load_state()
    idx = state.get("last_index", 0) % len(GAMES)
    selected = []
    for i in range(count):
        selected.append(GAMES[(idx + i) % len(GAMES)])
    return selected, idx


def _advance_state(start_idx: int, count: int, results: List[PublishResult]) -> None:
    state = _load_state()
    state["last_index"] = (start_idx + count) % len(GAMES)
    state.setdefault("runs", []).append({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "games": [r.game_slug for r in results],
        "successes": sum(1 for r in results if r.success),
        "failures": sum(1 for r in results if not r.success),
    })
    # Keep last 30 run records
    state["runs"] = state["runs"][-30:]
    _save_state(state)


def process_game(game: GameEntry) -> PublishResult:
    logger.info("━━ Processing: %s ━━", game.name)

    logger.info("[1/3] Scanning trends...")
    trend = scan_game(game)
    logger.info(
        "  Reddit posts: %d | YouTube videos: %d",
        len(trend.reddit_posts),
        len(trend.yt_videos),
    )

    logger.info("[2/3] Generating article...")
    article = generate_article(trend, game.slug)
    if not article:
        logger.error("Article generation failed for %s", game.name)
        return PublishResult(
            game_slug=game.slug,
            game_name=game.name,
            success=False,
            error="Article generation returned None",
        )
    logger.info("  Title: %s (%d chars)", article.title, len(article.content))

    logger.info("[3/3] Publishing draft to ProPlay News...")
    result = publish_game_content(game, article)
    if result.success:
        logger.info("  Published: id=%s", result.post_id)
    else:
        logger.error("  Publish failed: %s", result.error)

    return result


def run_batch(games: List[GameEntry]) -> List[PublishResult]:
    results = []
    for i, game in enumerate(games):
        result = process_game(game)
        results.append(result)
        if i < len(games) - 1:
            time.sleep(3)  # brief pause between games
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="ContentMind — ProPlay News auto-content")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--game", metavar="SLUG", help="Process a single game by slug")
    group.add_argument("--all", action="store_true", help="Process all registered games")
    group.add_argument("--list", action="store_true", help="List all registered game slugs")
    args = parser.parse_args()

    if args.list:
        for g in GAMES:
            print(f"  {g.slug:30s}  {g.name}")
        return

    if args.game:
        game = get_game(args.game)
        if not game:
            logger.error("Unknown game slug '%s'. Use --list to see available games.", args.game)
            sys.exit(1)
        games_to_run = [game]
        start_idx = None
    elif args.all:
        games_to_run = GAMES[:]
        start_idx = None
    else:
        games_to_run, start_idx = _next_games(GAMES_PER_RUN)

    logger.info("ContentMind starting — %d game(s) to process", len(games_to_run))

    results = run_batch(games_to_run)

    # Advance state for round-robin (only for automatic batch runs)
    if start_idx is not None:
        _advance_state(start_idx, len(games_to_run), results)

    # Summary
    successes = sum(1 for r in results if r.success)
    failures = len(results) - successes
    logger.info("━━ Done: %d/%d succeeded ━━", successes, len(results))
    for r in results:
        status = "✓" if r.success else "✗"
        detail = r.title or r.error or ""
        logger.info("  %s %s — %s", status, r.game_name, detail)

    if failures > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
