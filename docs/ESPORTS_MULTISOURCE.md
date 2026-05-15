# Esports Multi-Source Data Integration

This document describes the multi-source integration that powers the
esports tournaments and matches in `@cmmv/blog`.

## Why

`PandaScore` was previously the only source of tournament data. That
created a single point of failure:

- Major events (e.g. PGL Astana 2026) appeared days or weeks late.
- Regional and lower-tier events were not covered at all.
- Token expiration disabled the entire feature.

The blog now reads from multiple sources and merges them through a
trust-prioritised coverage layer so the database is always populated
with the most accurate fields available.

## Sources

| Source       | Coverage                                | Cron          | Type             |
|--------------|------------------------------------------|---------------|------------------|
| `pandascore` | CS2, Dota2, LoL, Valorant, R6            | every 2h      | REST API         |
| `liquipedia` | CS2, Dota2, LoL, Valorant (Tier S/A/B)   | every 4h      | Wiki HTML API    |
| `hltv`       | CS2 (canonical, fastest signal)          | every 6h      | RSS feed scraper |
| `draft5`     | CS2 BR scene                             | (existing)    | HTML scraper     |
| `vlr`        | Valorant                                 | (existing)    | HTML scraper     |

## Trust Priority (`SOURCE_TRUST`)

`hltv (3) > liquipedia (2) > pandascore (1) > draft5/vlr (0)`

Defined in `packages/plugin/api/championships/tournament-merger.utils.ts`.

Coverage rule:

- A source with higher trust may overwrite existing fields when it
  reports a non-empty value.
- A source with lower or equal trust may only **fill empty fields**
  (it never overwrites data set by a more trusted source).

## Schema Changes

`packages/plugin/contracts/esports-tournament.contract.ts` adds:

- `externalIds: string` — JSON array `[{source, id}]` listing every
  external ID known for the tournament. The legacy `externalId` is
  retained for backward compatibility (used as fallback lookup).
- `dataSource: string` — the source that owns the record (defaults
  to `pandascore`).

## Merge Layer

`tournament-merger.utils.ts` exports:

- `isSameTournament(a, b)` — dedup by normalised slug, or by
  `game + name + dates within ±7 days`.
- `mergeExternalIds(existingJson, newEntry)` — upserts an entry in
  the `externalIds` JSON array.
- `mergeTournaments(existing, incoming, source)` — applies the
  coverage rule field by field. Teams are merged by max count.

Every source service calls `mergeTournaments` (directly or via
`mergeExternalIds`) when upserting so multiple writers stay
consistent.

## Services

### `LiquipediaService` (`liquipedia.service.ts`)

- `syncTournaments(game)` parses Liquipedia `Portal:Tournaments`
  pages for `csgo`, `dota2`, `lol`, and `valorant`. Stored under
  `dataSource: 'liquipedia'` with `externalIds[].source = 'liquipedia'`.
- `syncMatches(slug, game)` parses the bracket / match-list HTML for
  a specific tournament page.
- HTTP uses Liquipedia's `api.php?action=parse` MediaWiki endpoint
  with a 1.2 s request delay per Liquipedia's Terms of Use.
- Cron: tournaments `0 */4 * * *`, matches `30 */2 * * *`.

### `HltvService` (`hltv.service.ts`)

- `syncFromRss()` reads `https://www.hltv.org/rss/news`, detects
  tournament references via curated `TOURNAMENT_PATTERNS`, and
  extracts match results (`Team A VERB Team B`) for upsert into
  `EsportsMatchEntity`.
- Marks tournaments as `ongoing` when fresh news (`<48 h`) mentions
  them and the DB record is still `upcoming`.
- Cron: `0 */6 * * *`.

## Controller Endpoints

Defined in `championships.controller.ts`:

| Endpoint                              | Description                              |
|---------------------------------------|------------------------------------------|
| `GET /esports/sync-liquipedia`        | Sync all 4 supported games (or `?game=`) |
| `GET /esports/sync-liquipedia-matches`| Match sync for a single tournament slug  |
| `GET /esports/sync-hltv`              | Trigger HLTV RSS sync                    |

## `ChampionshipsService.syncAll()`

`syncAll()` now runs PandaScore first (canonical source) and then
chains Liquipedia (per game) and HLTV. Failures in any single source
are caught and logged so they do not break the rest of the pipeline.

## Tests

See `tests/esports-multisource.test.ts`:

- `mergeExternalIds` — add / update / append / invalid input.
- `isSameTournament` — slug, slug normalisation, game+name+date,
  negative cases (different name, dates too far apart).
- `mergeTournaments` — coverage rule (low trust does not overwrite),
  high trust overwrites, external-ID merging, team-list preference.
- LiquipediaService date parsing (pure helpers).
- HltvService match result detection (verb regex + team extraction).

Run with: `node node_modules/vitest/vitest.mjs --run tests/esports-multisource.test.ts`
