"""
game_registry.py — Games tracked by ContentMind for ProPlay News.

Each entry defines: display name, subreddits to scan, YouTube search
queries, Brazilian Portuguese tags, and categories.
"""
from dataclasses import dataclass, field
from typing import List


@dataclass
class GameEntry:
    name: str                   # display name
    slug: str                   # URL-safe identifier
    subreddits: List[str]       # Reddit communities
    yt_queries: List[str]       # YouTube search terms (pt or en)
    tags: List[str]             # cmmv-blog tags
    categories: List[str]       # cmmv-blog categories (IDs or slugs)
    lang_hint: str = "pt-BR"    # article language


GAMES: List[GameEntry] = [
    GameEntry(
        name="League of Legends",
        slug="league-of-legends",
        subreddits=["leagueoflegends", "leagueoflegendsbrasil"],
        yt_queries=[
            "league of legends highlights semana",
            "lol patch notes 2025 resumo",
        ],
        tags=["league-of-legends", "lol", "moba", "riot-games"],
        categories=[],
    ),
    GameEntry(
        name="Valorant",
        slug="valorant",
        subreddits=["VALORANT", "ValorantBrasil"],
        yt_queries=[
            "valorant highlights semana",
            "valorant patch notes 2025",
        ],
        tags=["valorant", "fps", "riot-games"],
        categories=[],
    ),
    GameEntry(
        name="CS2",
        slug="cs2",
        subreddits=["GlobalOffensive", "cs2"],
        yt_queries=[
            "cs2 highlights 2025",
            "counter-strike 2 update patch",
        ],
        tags=["cs2", "counter-strike", "fps", "valve"],
        categories=[],
    ),
    GameEntry(
        name="Free Fire",
        slug="free-fire",
        subreddits=["freefire", "GarenaFreeFire"],
        yt_queries=[
            "free fire melhores momentos semana",
            "free fire atualização 2025",
        ],
        tags=["free-fire", "garena", "battle-royale", "mobile"],
        categories=[],
    ),
    GameEntry(
        name="Fortnite",
        slug="fortnite",
        subreddits=["FortNiteBR"],
        yt_queries=[
            "fortnite highlights 2025",
            "fortnite update nova temporada",
        ],
        tags=["fortnite", "battle-royale", "epic-games"],
        categories=[],
    ),
    GameEntry(
        name="Apex Legends",
        slug="apex-legends",
        subreddits=["apexlegends"],
        yt_queries=[
            "apex legends highlights semana",
            "apex legends patch notes 2025",
        ],
        tags=["apex-legends", "battle-royale", "fps", "ea-games"],
        categories=[],
    ),
    GameEntry(
        name="Dota 2",
        slug="dota-2",
        subreddits=["DotA2"],
        yt_queries=[
            "dota 2 highlights 2025",
            "dota 2 patch update",
        ],
        tags=["dota-2", "moba", "valve"],
        categories=[],
    ),
    GameEntry(
        name="PUBG Mobile",
        slug="pubg-mobile",
        subreddits=["PUBGMobile"],
        yt_queries=[
            "pubg mobile highlights 2025",
            "pubg mobile atualização brasil",
        ],
        tags=["pubg-mobile", "battle-royale", "mobile"],
        categories=[],
    ),
    GameEntry(
        name="Minecraft",
        slug="minecraft",
        subreddits=["Minecraft", "MinecraftBrasil"],
        yt_queries=[
            "minecraft highlights semana",
            "minecraft update novidades 2025",
        ],
        tags=["minecraft", "sandbox", "mojang"],
        categories=[],
    ),
    GameEntry(
        name="EA Sports FC 25",
        slug="ea-sports-fc-25",
        subreddits=["EASportsFC"],
        yt_queries=[
            "fc25 fut moments highlights",
            "ea fc 25 ultimate team melhores jogadas",
        ],
        tags=["ea-sports-fc", "futebol", "ultimate-team"],
        categories=[],
    ),
]


def get_game(slug: str) -> GameEntry | None:
    for g in GAMES:
        if g.slug == slug:
            return g
    return None


def get_all_slugs() -> List[str]:
    return [g.slug for g in GAMES]
