"""
config.py — ContentMind configuration from environment variables.
Auto-loads .env from the same directory as this file (no external deps).
"""
import os
from pathlib import Path

# Load .env manually — avoids python-dotenv dependency
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _key, _, _val = _line.partition("=")
            os.environ.setdefault(_key.strip(), _val.strip())

# cmmv-blog API
PROPLAY_API_URL = os.getenv("PROPLAY_API_URL", "http://localhost:5000")
PROPLAY_USERNAME = os.getenv("PROPLAY_USERNAME", "")
PROPLAY_PASSWORD = os.getenv("PROPLAY_PASSWORD", "")

# AI
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Scanning
REDDIT_POSTS_PER_GAME = int(os.getenv("REDDIT_POSTS_PER_GAME", "5"))
YOUTUBE_VIDEOS_PER_GAME = int(os.getenv("YOUTUBE_VIDEOS_PER_GAME", "5"))
SCAN_PERIOD = os.getenv("SCAN_PERIOD", "week")  # hour, day, week, month, year

# Scheduling
GAMES_PER_RUN = int(os.getenv("GAMES_PER_RUN", "3"))  # how many games per cron run
RUN_HOUR = int(os.getenv("RUN_HOUR", "9"))             # UTC hour to run daily
