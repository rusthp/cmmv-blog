import { Service, Logger, Config, Cron } from '@cmmv/core';

import { Repository } from '@cmmv/repository';

const PANDASCORE_BASE = 'https://api.pandascore.co';

const SUPPORTED_GAMES = ['csgo', 'dota2', 'valorant', 'r6siege', 'lol'];

@Service('blog_championships')
export class ChampionshipsService {
  private static readonly logger = new Logger('ChampionshipsService');

  static warn(msg: string) {
    try {
      ChampionshipsService.logger.log(msg);
    } catch {}
  }
  static log(msg: string) {
    try {
      ChampionshipsService.logger.log(msg);
    } catch {}
  }

  private get apiToken(): string {
    return Config.get<string>(
      'blog.pandascoreToken',
      'nUO1wT0wR9Vpvv1B4n_G9TGVqjPPr4wtIzN-mRxV0B4hmHR83SY'
    );
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      Accept: 'application/json',
    };
  }

  // ─── Cron Jobs ────────────────────────────────────────────────

  @Cron('0 */2 * * *')
  async cronSyncTournaments() {
    if (!this.apiToken) return;
    await this.syncTournaments();
    await this.fixStaleTournamentStatuses();
  }

  @Cron('0 * * * *')
  async cronSyncOngoingTournaments() {
    if (!this.apiToken) return;
    await this.syncOngoingTournamentMatches();
    await this.fixStaleTournamentStatuses();
  }

  @Cron('*/15 * * * *')
  async cronSyncMatches() {
    if (!this.apiToken) return;
    await this.syncRunningAndUpcomingMatches();
  }

  // ─── Public API ───────────────────────────────────────────────

  async syncAll(): Promise<{ tournaments: number; matches: number; teams: number }> {
    const stats = { tournaments: 0, matches: 0, teams: 0 };

    if (!this.apiToken) {
      ChampionshipsService.warn(
        '[championships] No PandaScore token — set blog.pandascoreToken in settings'
      );
      return stats;
    }

    ChampionshipsService.log('[championships] Full sync starting...');
    stats.tournaments = await this.syncTournaments();
    await this.fixStaleTournamentStatuses();
    stats.matches = await this.syncAllMatchesFromOngoing();
    stats.teams = await this.syncTeams();
    ChampionshipsService.log(`[championships] Sync done: ${JSON.stringify(stats)}`);
    return stats;
  }

  async syncStale(): Promise<{ fixed: number; matches: number }> {
    const fixed = await this.fixStaleTournamentStatuses();
    const matches = await this.syncOngoingTournamentMatches();
    return { fixed, matches };
  }

  async syncMissingTeams(): Promise<{ updated: number }> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return { updated: 0 };

    // Fetch ongoing + upcoming separately to avoid limit gaps across 7k+ total entries
    const [ongoing, upcoming] = await Promise.all([
      Repository.findAll(EsportsTournamentEntity, { status: 'ongoing', limit: '500' }),
      Repository.findAll(EsportsTournamentEntity, { status: 'upcoming', limit: '500' }),
    ]);

    const allActive = [
      ...((ongoing?.data || []) as any[]),
      ...((upcoming?.data || []) as any[]),
    ];

    const entries = allActive.filter(e => {
      if (e.numberOfTeams !== 0 && e.numberOfTeams !== null) return false;
      const sub = e.subTournamentsJson;
      // Must have actual sub-tournament ids (not empty array, not null/empty string)
      try {
        const parsed = JSON.parse(sub || '[]');
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    });

    let updated = 0;
    for (const entry of entries) {
      const subTournaments: Array<{ id: string; slug: string; name: string }> = this.parseJson(
        entry.subTournamentsJson
      );
      if (subTournaments.length === 0) continue;

      const teamsMap: Record<string, any> = {};
      const serieId = entry.serieExternalId || entry.externalId.replace('serie_', '');

      try {
        const allSubs = await this.pandascoreGet(
          `/${entry.game}/tournaments?filter[serie_id]=${serieId}&page[size]=50`
        );
        if (Array.isArray(allSubs)) {
          for (const sub of allSubs) {
            const src = (sub.teams && sub.teams.length > 0)
              ? sub.teams
              : (sub.expected_roster || []).map((r: any) => r.team).filter(Boolean);
            for (const team of src) {
              if (!team?.id) continue;
              teamsMap[String(team.id)] = {
                id: String(team.id),
                name: team.name,
                acronym: team.acronym || '',
                logoUrl: team.image_url || '',
                location: team.location || '',
              };
            }
          }
        }
      } catch (e: any) {
        ChampionshipsService.warn(
          `[championships] syncMissingTeams ${entry.game}/${serieId}: ${e.message}`
        );
      }

      if (Object.keys(teamsMap).length > 0) {
        const teams = Object.values(teamsMap);
        await Repository.update(
          EsportsTournamentEntity,
          { id: entry.id },
          { teamsJson: JSON.stringify(teams), numberOfTeams: teams.length }
        );
        updated++;
      }
    }

    ChampionshipsService.log(`[championships] syncMissingTeams: updated ${updated}/${entries.length}`);
    return { updated };
  }

  async migrateToSeries(): Promise<{ deleted: number; synced: number; matches: number }> {
    const { EsportsTournamentEntity, EsportsMatchEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return { deleted: 0, synced: 0, matches: 0 };

    ChampionshipsService.log('[championships] Migrating to serie-level entries...');

    // Delete all old tournament-level entries (those without serie_ prefix) — paginate to cover all
    let deleted = 0;
    let page = 1;
    while (true) {
      const batch = await Repository.findAll(EsportsTournamentEntity, { limit: '500', page: String(page) });
      const rows: any[] = batch?.data || [];
      if (rows.length === 0) break;
      for (const entry of rows) {
        if (!entry.externalId?.startsWith('serie_')) {
          await Repository.delete(EsportsTournamentEntity, { id: entry.id });
          deleted++;
        }
      }
      if (rows.length < 500) break;
      page++;
    }

    // Delete all existing matches (will be re-synced under serie slugs)
    if (EsportsMatchEntity) {
      const allMatches = await Repository.findAll(EsportsMatchEntity, { limit: '5000' });
      for (const m of (allMatches?.data || []) as any[]) {
        await Repository.delete(EsportsMatchEntity, { id: m.id });
      }
    }

    ChampionshipsService.log(`[championships] Deleted ${deleted} old tournament entries`);

    // Re-sync everything at serie level
    const synced = await this.syncTournaments();
    await this.fixStaleTournamentStatuses();
    const matches = await this.syncAllMatchesFromOngoing();

    ChampionshipsService.log(`[championships] Migration done: ${synced} series, ${matches} matches`);
    return { deleted, synced, matches };
  }

  async getTournaments(status?: string, game?: string, region?: string): Promise<any[]> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return [];

    const queries: any = { limit: '200' };
    if (status && status !== 'all') queries.status = status;
    if (game && game !== 'all') queries.game = game;
    if (region && region !== 'all') queries.region = region;

    const results = await Repository.findAll(EsportsTournamentEntity, queries);

    const tournaments = (results?.data || []).map((t: any) => ({
      ...t,
      teams: this.parseJson(t.teamsJson),
    }));

    return tournaments.sort((a: any, b: any) => {
      const da = a.startDate || '9999';
      const db = b.startDate || '9999';
      return db > da ? 1 : db < da ? -1 : 0;
    });
  }

  async getTournamentsWithCount(
    status?: string,
    game?: string,
    region?: string
  ): Promise<{ data: any[]; total: number }> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return { data: [], total: 0 };

    const queries: any = { limit: '200' };
    if (status && status !== 'all') queries.status = status;
    if (game && game !== 'all') queries.game = game;
    if (region && region !== 'all') queries.region = region;

    const results = await Repository.findAll(EsportsTournamentEntity, queries);

    const tournaments = (results?.data || []).map((t: any) => ({
      ...t,
      teams: this.parseJson(t.teamsJson),
    }));

    const sorted = tournaments.sort((a: any, b: any) => {
      const da = a.startDate || '9999';
      const db = b.startDate || '9999';
      return db > da ? 1 : db < da ? -1 : 0;
    });

    return {
      data: sorted,
      total: results?.count || tournaments.length,
    };
  }

  async getStatusCounts(
    game?: string,
    region?: string
  ): Promise<{ all: number; ongoing: number; upcoming: number; finished: number }> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return { all: 0, ongoing: 0, upcoming: 0, finished: 0 };

    const baseFilter: any = {};
    if (game && game !== 'all') baseFilter.game = game;
    if (region && region !== 'all') baseFilter.region = region;

    const [allResults, ongoingResults, upcomingResults, finishedResults] = await Promise.all([
      Repository.findAll(EsportsTournamentEntity, { ...baseFilter, limit: '1000' }),
      Repository.findAll(EsportsTournamentEntity, { ...baseFilter, status: 'ongoing', limit: '1000' }),
      Repository.findAll(EsportsTournamentEntity, {
        ...baseFilter,
        status: 'upcoming',
        limit: '1000',
      }),
      Repository.findAll(EsportsTournamentEntity, {
        ...baseFilter,
        status: 'finished',
        limit: '1000',
      }),
    ]);

    return {
      all: (allResults?.data || []).length,
      ongoing: (ongoingResults?.data || []).length,
      upcoming: (upcomingResults?.data || []).length,
      finished: (finishedResults?.data || []).length,
    };
  }

  async getTournamentBySlug(slug: string): Promise<any | null> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return null;

    const t = (await Repository.findOne(EsportsTournamentEntity, { slug })) as any;
    if (!t) return null;

    // Return tournament data immediately without blocking on PandaScore
    // Standings/brackets will be fetched asynchronously if needed
    return { ...t, teams: this.parseJson(t.teamsJson) };
  }

  async getTournamentMatches(slug: string, status?: string): Promise<any[]> {
    const { EsportsMatchEntity } = this.getEntities();
    if (!EsportsMatchEntity) return [];

    const queries: any = { tournamentSlug: slug, limit: '200', sortBy: 'scheduledAt', sort: 'ASC' };
    if (status && status !== 'all') queries.status = status;

    const results = await Repository.findAll(EsportsMatchEntity, queries);
    return results?.data || [];
  }

  async getUpcomingMatches(game?: string, limit = 20): Promise<any[]> {
    const { EsportsMatchEntity } = this.getEntities();
    if (!EsportsMatchEntity) return [];

    const queries: any = {
      status: 'not_started',
      limit: String(limit),
      sortBy: 'scheduledAt',
      sort: 'ASC',
    };
    if (game && game !== 'all') queries.game = game;

    const results = await Repository.findAll(EsportsMatchEntity, queries);
    return results?.data || [];
  }

  async getRecentResults(game?: string, limit = 20): Promise<any[]> {
    const { EsportsMatchEntity } = this.getEntities();
    if (!EsportsMatchEntity) return [];

    const queries: any = { status: 'finished', limit: String(limit) };
    if (game && game !== 'all') queries.game = game;

    const results = await Repository.findAll(EsportsMatchEntity, queries);
    const matches = results?.data || [];
    return matches.sort((a: any, b: any) => {
      const da = a.endedAt || '';
      const db = b.endedAt || '';
      return db > da ? 1 : db < da ? -1 : 0;
    });
  }

  async getTournamentBrackets(slug: string): Promise<{
    phases: string[];
    brackets: Record<string, any[]>;
    hasPlayoffs: boolean;
  }> {
    const { EsportsMatchEntity } = this.getEntities();
    if (!EsportsMatchEntity) return { phases: [], brackets: {}, hasPlayoffs: false };

    const results = await Repository.findAll(EsportsMatchEntity, {
      tournamentSlug: slug,
      limit: '200',
      sortBy: 'scheduledAt',
      sort: 'ASC',
    });

    const matches: any[] = results?.data || [];

    // Phase display order
    const PHASE_ORDER = [
      'qualifier',
      'group_stage',
      'quarter_final',
      'semi_final',
      'playoffs',
      'grand_final',
    ];

    // Group matches by phase
    const grouped: Record<string, any[]> = {};
    for (const m of matches) {
      const phase = m.phase || 'group_stage';
      if (!grouped[phase]) grouped[phase] = [];
      grouped[phase].push(m);
    }

    // Sort phases by display order
    const phases = Object.keys(grouped).sort((a, b) => {
      const ia = PHASE_ORDER.indexOf(a);
      const ib = PHASE_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const playoffPhases = ['quarter_final', 'semi_final', 'playoffs', 'grand_final'];
    const hasPlayoffs = phases.some(p => playoffPhases.includes(p));

    return { phases, brackets: grouped, hasPlayoffs };
  }

  async getTeams(game?: string, limit = 50): Promise<any[]> {
    const { EsportsTeamEntity } = this.getEntities();
    if (!EsportsTeamEntity) return [];

    const queries: any = { limit: String(limit), sortBy: 'ranking', sort: 'ASC' };
    if (game && game !== 'all') queries.game = game;

    const results = await Repository.findAll(EsportsTeamEntity, queries);
    return results?.data || [];
  }

  // ─── Sync: Group tournaments by serie_id ─────────────────────

  private async syncTournaments(): Promise<number> {
    let total = 0;

    for (const game of SUPPORTED_GAMES) {
      for (const endpoint of ['running', 'upcoming', 'past']) {
        // Collect all tournaments, group by serie_id
        const serieMap = new Map<string, any[]>(); // serieId -> tournament[]

        let page = 1;
        while (true) {
          try {
            const data = await this.pandascoreGet(
              `/${game}/tournaments/${endpoint}?page[size]=100&page[number]=${page}&sort=-begin_at`
            );
            if (!Array.isArray(data) || data.length === 0) break;

            for (const t of data) {
              const serieId = String(t.serie_id || t.serie?.id || t.id);
              if (!serieMap.has(serieId)) serieMap.set(serieId, []);
              serieMap.get(serieId)!.push(t);
            }

            if (data.length < 100) break;
            page++;
          } catch (e: any) {
            ChampionshipsService.warn(
              `[championships] syncTournaments/${game}/${endpoint} page ${page}: ${e.message}`
            );
            break;
          }
        }

        // Upsert one entry per serie, aggregating all sub-tournaments
        for (const [, tournaments] of serieMap.entries()) {
          await this.upsertSerie(tournaments, endpoint, game);
          total++;
        }
      }
    }

    return total;
  }

  // tournaments[] = all sub-tournaments sharing the same serie_id (already have teams from /tournaments endpoint)
  private async upsertSerie(tournaments: any[], endpointStatus: string, game: string): Promise<void> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return;

    const first = tournaments[0];
    const serie = first.serie || {};
    const serieId = String(first.serie_id || serie.id || first.id);
    const externalId = `serie_${serieId}`;

    const existing = await Repository.findOne(EsportsTournamentEntity, { externalId });

    // Aggregate teams from all sub-tournaments (tournaments endpoint includes teams)
    const teamsMap: Record<string, any> = {};
    const subTournaments: Array<{ id: string; slug: string; name: string }> = [];

    for (const t of tournaments) {
      subTournaments.push({ id: String(t.id), slug: t.slug || String(t.id), name: t.name || '' });

      const teamsSource = (t.teams && t.teams.length > 0)
        ? t.teams
        : (t.expected_roster || []).map((r: any) => r.team).filter(Boolean);

      for (const team of teamsSource) {
        if (!team?.id) continue;
        teamsMap[String(team.id)] = {
          id: String(team.id),
          name: team.name,
          acronym: team.acronym || '',
          logoUrl: team.image_url || '',
          location: team.location || '',
        };
      }
    }

    // Fallback: bulk listing endpoints (e.g. /valorant/tournaments/upcoming) often return
    // empty teams arrays. Use filter[serie_id] to get ALL sub-tournaments for this serie
    // including those in other status buckets (e.g. group stage is finished, playoffs upcoming).
    if (Object.keys(teamsMap).length === 0) {
      try {
        const allSubs = await this.pandascoreGet(
          `/${game}/tournaments?filter[serie_id]=${serieId}&page[size]=50`
        );
        if (Array.isArray(allSubs)) {
          for (const sub of allSubs) {
            const src = (sub.teams && sub.teams.length > 0)
              ? sub.teams
              : (sub.expected_roster || []).map((r: any) => r.team).filter(Boolean);
            for (const team of src) {
              if (!team?.id) continue;
              teamsMap[String(team.id)] = {
                id: String(team.id),
                name: team.name,
                acronym: team.acronym || '',
                logoUrl: team.image_url || '',
                location: team.location || '',
              };
            }
          }
        }
      } catch (e: any) {
        ChampionshipsService.warn(
          `[championships] fetchTeams by serie_id fallback ${game}/${serieId}: ${e.message}`
        );
      }
    }

    const teams = Object.values(teamsMap);
    const numberOfTeams = teams.length || 0;

    // Serie metadata from first tournament's serie field
    const serieName = serie.full_name || serie.name || first.name || '';
    const serieSlug = serie.slug || `serie-${serieId}`;
    const startDate = tournaments.map(t => t.begin_at).filter(Boolean).sort()[0] || null;
    const endDate = tournaments.map(t => t.end_at).filter(Boolean).sort().reverse()[0] || null;

    const rawPrize = tournaments.map(t => t.prizepool).find(Boolean) || '';
    const prizePool = rawPrize || (
      serieName.toLowerCase().match(/slot|qualifier|vaga|berth|qualificat/)
        ? 'Vaga em torneio' : ''
    );

    const region = first.region || '';
    const isOnline = tournaments.every(t => t.type === 'online');
    const location = first.country || region || '';
    const tier = first.tier || '';
    const league = first.league || {};

    const statusMap: Record<string, string> = {
      running: 'ongoing',
      upcoming: 'upcoming',
      past: 'finished',
    };

    const data = {
      externalId,
      serieExternalId: serieId,
      game,
      name: serieName,
      slug: serieSlug,
      status: statusMap[endpointStatus] || 'upcoming',
      startDate,
      endDate,
      prizePool,
      location,
      online: isOnline,
      tier,
      logoUrl: league.image_url || '',
      bannerUrl: league.image_url || '',
      leagueName: league.name || '',
      leagueLogo: league.image_url || '',
      serieName,
      teamsJson: JSON.stringify(teams),
      subTournamentsJson: JSON.stringify(subTournaments),
      region,
      numberOfTeams,
      featured: tier === 's' || tier === 'a',
    };

    if (existing) {
      await Repository.update(EsportsTournamentEntity, { id: (existing as any).id }, data);
    } else {
      const result = await Repository.insert(EsportsTournamentEntity, data);
      if (!result.success) {
        ChampionshipsService.warn(
          `[championships] Failed to insert serie ${serieSlug}: ${result.message}`
        );
      }
    }
  }

  private async syncAllMatchesFromOngoing(): Promise<number> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return 0;

    const [ongoing, upcoming, finished] = await Promise.all([
      Repository.findAll(EsportsTournamentEntity, { status: 'ongoing', limit: '100' }),
      Repository.findAll(EsportsTournamentEntity, { status: 'upcoming', limit: '50' }),
      Repository.findAll(EsportsTournamentEntity, { status: 'finished', limit: '50' }),
    ]);

    const allTournaments = [
      ...(ongoing?.data || []),
      ...(upcoming?.data || []),
      ...(finished?.data || []),
    ];

    let total = 0;
    for (const t of allTournaments) {
      total += await this.syncMatchesForEntry(t);
    }

    return total;
  }

  private async fixStaleTournamentStatuses(): Promise<number> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return 0;

    const now = new Date().toISOString();
    let fixed = 0;

    const staleOngoing = await Repository.findAll(EsportsTournamentEntity, {
      status: 'ongoing',
      limit: '200',
    });
    for (const t of (staleOngoing?.data || []) as any[]) {
      if (t.endDate && t.endDate < now) {
        await Repository.update(EsportsTournamentEntity, { id: t.id }, { status: 'finished' });
        fixed++;
      }
    }

    const staleUpcoming = await Repository.findAll(EsportsTournamentEntity, {
      status: 'upcoming',
      limit: '200',
    });
    for (const t of (staleUpcoming?.data || []) as any[]) {
      if (t.endDate && t.endDate < now) {
        await Repository.update(EsportsTournamentEntity, { id: t.id }, { status: 'finished' });
        fixed++;
      } else if (t.startDate && t.startDate <= now && (!t.endDate || t.endDate >= now)) {
        await Repository.update(EsportsTournamentEntity, { id: t.id }, { status: 'ongoing' });
        fixed++;
      }
    }

    if (fixed > 0) {
      ChampionshipsService.log(`[championships] Fixed ${fixed} stale tournament statuses`);
    }

    return fixed;
  }

  private async syncOngoingTournamentMatches(): Promise<number> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return 0;

    const ongoing = await Repository.findAll(EsportsTournamentEntity, {
      status: 'ongoing',
      limit: '100',
    });

    const tournaments: any[] = ongoing?.data || [];
    let total = 0;

    for (const t of tournaments) {
      total += await this.syncMatchesForEntry(t);
    }

    return total;
  }

  // Unified match sync: uses /series/{id}/matches when serieExternalId is set,
  // falls back to /tournaments/{id}/matches for legacy entries
  private async syncMatchesForEntry(t: any): Promise<number> {
    let total = 0;

    const serieId = t.serieExternalId;

    if (serieId) {
      // Serie-based entry: /series/{id}/matches has no game prefix in PandaScore API
      try {
        const data = await this.pandascoreGet(
          `/series/${serieId}/matches?page[size]=100`
        );
        if (Array.isArray(data)) {
          for (const m of data) {
            await this.upsertMatch(m, t.game, t.slug);
            total++;
          }
        }
      } catch (e: any) {
        ChampionshipsService.warn(
          `[championships] syncMatches serie ${t.slug} (${t.game}): ${e.message}`
        );
      }
    } else {
      // Legacy tournament-level entry
      const subTournaments: Array<{ id: string; slug: string }> = this.parseJson(t.subTournamentsJson || '[]');
      const ids = subTournaments.length > 0
        ? subTournaments.map(st => st.id)
        : [t.externalId];

      for (const tid of ids) {
        try {
          const data = await this.pandascoreGet(
            `/${t.game}/tournaments/${tid}/matches?page[size]=100`
          );
          if (!Array.isArray(data)) continue;
          for (const m of data) {
            await this.upsertMatch(m, t.game, t.slug);
            total++;
          }
        } catch (e: any) {
          ChampionshipsService.warn(
            `[championships] syncMatches tournament ${tid} (${t.game}): ${e.message}`
          );
        }
      }
    }

    return total;
  }

  private async syncRunningAndUpcomingMatches(): Promise<void> {
    for (const game of SUPPORTED_GAMES) {
      for (const endpoint of ['running', 'upcoming']) {
        try {
          const size = endpoint === 'upcoming' ? 30 : 20;
          const data = await this.pandascoreGet(
            `/${game}/matches/${endpoint}?page[size]=${size}&sort=scheduled_at`
          );
          if (!Array.isArray(data)) continue;
          for (const m of data) {
            await this.upsertMatch(m, game);
          }
        } catch (e: any) {
          ChampionshipsService.warn(
            `[championships] syncMatches/${game}/${endpoint}: ${e.message}`
          );
        }
      }
    }
  }

  private async syncTeams(): Promise<number> {
    let total = 0;
    for (const game of SUPPORTED_GAMES) {
      try {
        const data = await this.pandascoreGet(`/${game}/teams?page[size]=100&sort=modified_at`);
        if (!Array.isArray(data)) continue;

        for (const t of data) {
          await this.upsertTeam(t, game);
        }

        total += data.length;
      } catch (e: any) {
        ChampionshipsService.warn(`[championships] syncTeams/${game}: ${e.message}`);
      }
    }
    return total;
  }

  // ─── Upsert Helpers ───────────────────────────────────────────

  private async upsertTournament(t: any, endpointStatus: string, game: string): Promise<void> {
    const { EsportsTournamentEntity } = this.getEntities();
    if (!EsportsTournamentEntity) return;

    const existing = await Repository.findOne(EsportsTournamentEntity, {
      externalId: String(t.id),
    });

    const isOnline = t.type === 'online' || (t.live_supported && !t.country);
    const location = t.country || t.region || '';

    // Use expected_roster when teams array is empty (more complete data)
    const teamsSource = (t.teams && t.teams.length > 0)
      ? t.teams
      : (t.expected_roster || []).map((r: any) => r.team).filter(Boolean);

    const teams = teamsSource.map((team: any) => ({
      id: String(team.id),
      name: team.name,
      acronym: team.acronym || '',
      logoUrl: team.image_url || '',
      location: team.location || '',
    }));

    const numberOfTeams = teams.length || t.participants_count || 0;

    // Inherit prize pool from serie/league if not set on tournament level
    const rawPrize = t.prizepool || t.serie?.prizepool || t.league?.prizepool || '';
    const nameForDetection = (t.name || t.serie?.name || t.serie?.full_name || '').toLowerCase();
    const prizePool = rawPrize || (
      nameForDetection.match(/slot|qualifier|vaga|berth|qualificat/)
        ? 'Vaga em torneio' : ''
    );

    // Extract region from PandaScore data
    const region = t.region || '';

    const statusMap: Record<string, string> = {
      running: 'ongoing',
      upcoming: 'upcoming',
      past: 'finished',
    };

    const data = {
      externalId: String(t.id),
      game: game,
      name: t.name || '',
      slug: t.slug || String(t.id),
      status: statusMap[endpointStatus] || 'upcoming',
      startDate: t.begin_at || null,
      endDate: t.end_at || null,
      prizePool,
      location,
      online: isOnline,
      tier: t.tier || '',
      logoUrl: t.league?.image_url || t.serie?.image_url || '',
      bannerUrl: t.serie?.image_url || t.league?.image_url || t.full_image_url || t.image_url || '',
      leagueName: t.league?.name || '',
      leagueLogo: t.league?.image_url || '',
      serieName: t.serie?.full_name || t.serie?.name || '',
      teamsJson: JSON.stringify(teams),
      region,
      numberOfTeams,
      featured: t.tier === 's' || t.tier === 'a',
    };

    if (existing) {
      await Repository.update(EsportsTournamentEntity, { id: (existing as any).id }, data);
    } else {
      const result = await Repository.insert(EsportsTournamentEntity, data);
      if (!result.success) {
        const fs = require('fs');
        fs.appendFileSync(
          'debug.txt',
          `[championships] Failed to insert tournament ${t.slug}: ${result.message}\n`
        );
        ChampionshipsService.warn(
          `[championships] Failed to insert tournament ${t.slug}: ${result.message}`
        );
      }
    }
  }

  private async upsertMatch(m: any, game: string, tournamentSlug?: string): Promise<void> {
    const { EsportsMatchEntity } = this.getEntities();
    if (!EsportsMatchEntity) return;

    const existing = await Repository.findOne(EsportsMatchEntity, {
      externalId: String(m.id),
    });

    const opponents = m.opponents || [];
    const results: Array<{ score: number; team_id: number }> = m.results || [];

    const team1 = opponents[0]?.opponent;
    const team2 = opponents[1]?.opponent;

    const score1 = results.find((r) => r.team_id === team1?.id)?.score ?? 0;
    const score2 = results.find((r) => r.team_id === team2?.id)?.score ?? 0;

    const slug = tournamentSlug || m.tournament?.slug || String(m.tournament_id || '');

    const streams: any[] = m.streams_list || [];
    const stream =
      streams.find((s) => s.language === 'pt') ||
      streams.find((s) => s.main) ||
      streams.find((s) => s.language === 'en') ||
      null;
    const streamUrl = stream?.raw_url || '';

    const data = {
      externalId: String(m.id),
      game: game,
      tournamentExternalId: String(m.tournament_id || m.tournament?.id || ''),
      tournamentSlug: slug,
      name: m.name || '',
      status: this.mapMatchStatus(m.status),
      scheduledAt: m.scheduled_at || m.begin_at || null,
      endedAt: m.end_at || null,
      numberOfGames: m.number_of_games || 1,
      phase: this.extractPhase(m),
      team1ExternalId: team1 ? String(team1.id) : '',
      team1Name: team1?.name || 'TBA',
      team1Logo: team1?.image_url || '',
      team1Acronym: team1?.acronym || '',
      team1Score: score1,
      team2ExternalId: team2 ? String(team2.id) : '',
      team2Name: team2?.name || 'TBA',
      team2Logo: team2?.image_url || '',
      team2Acronym: team2?.acronym || '',
      team2Score: score2,
      winnerExternalId: m.winner_id ? String(m.winner_id) : '',
      streamUrl,
    };

    if (existing) {
      await Repository.update(EsportsMatchEntity, { id: (existing as any).id }, data);
    } else {
      const result = await Repository.insert(EsportsMatchEntity, data);
      if (!result.success) {
        ChampionshipsService.warn(
          `[championships] Failed to insert match ${m.slug}: ${result.message}`
        );
      }
    }
  }

  private async upsertTeam(t: any, game: string): Promise<void> {
    const { EsportsTeamEntity } = this.getEntities();
    if (!EsportsTeamEntity) return;

    const existing = await Repository.findOne(EsportsTeamEntity, {
      externalId: String(t.id),
    });

    const data = {
      externalId: String(t.id),
      game: game,
      name: t.name || '',
      slug: t.slug || String(t.id),
      acronym: t.acronym || '',
      logoUrl: t.image_url || '',
      nationality: t.location || t.nationality || '',
      region: t.location || '',
      ranking: 0,
    };

    if (existing) {
      await Repository.update(EsportsTeamEntity, { id: (existing as any).id }, data);
    } else {
      const result = await Repository.insert(EsportsTeamEntity, data);
      if (!result.success) {
        ChampionshipsService.warn(
          `[championships] Failed to insert team ${t.slug}: ${result.message}`
        );
      }
    }
  }

  // ─── Utilities ────────────────────────────────────────────────

  private async pandascoreGet(path: string, retries = 2): Promise<any> {
    const url = `${PANDASCORE_BASE}${path}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: this.headers,
          signal: AbortSignal.timeout(15000),
        });

        // Handle rate limiting (429 or 500 with "Resource Limit Reached")
        if (response.status === 429 || response.status === 500) {
          const body = await response.text().catch(() => '');
          if (body.includes('Resource Limit') || response.status === 429) {
            const waitTime = (attempt + 1) * 2000; // 2s, 4s, 6s
            ChampionshipsService.warn(
              `[championships] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`PandaScore ${response.status} ${path}: ${body.substring(0, 200)}`);
        }

        return await response.json();
      } catch (error: any) {
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
      }
    }

    throw new Error(`PandaScore request failed after ${retries} retries: ${path}`);
  }

  private mapMatchStatus(status: string): string {
    const map: Record<string, string> = {
      not_started: 'not_started',
      running: 'running',
      finished: 'finished',
      canceled: 'canceled',
      cancelled: 'canceled',
      postponed: 'not_started',
    };
    return map[status] || 'not_started';
  }

  private extractPhase(match: any): string {
    const name = (match.name || '').toLowerCase();
    if (name.includes('grand final') || name.includes('grande final')) return 'grand_final';
    if (name.includes('semifinal') || name.includes('semi-final')) return 'semi_final';
    if (name.includes('quarter') || name.includes('quarta')) return 'quarter_final';
    if (name.includes('playoff') || name.includes('eliminat')) return 'playoffs';
    if (name.includes('group') || name.includes('grupo')) return 'group_stage';
    if (name.includes('qualifier') || name.includes('qualif')) return 'qualifier';
    if (name.includes('decider')) return 'playoffs';
    if (name.includes('upper') || name.includes('lower')) return 'playoffs';
    return 'group_stage';
  }

  private parseJson(json: string): any[] {
    try {
      return JSON.parse(json || '[]');
    } catch {
      return [];
    }
  }

  private getEntities(): Record<string, any> {
    return {
      EsportsTournamentEntity: Repository.getEntity('EsportsTournamentsEntity'),
      EsportsMatchEntity: Repository.getEntity('EsportsMatchesEntity'),
      EsportsTeamEntity: Repository.getEntity('EsportsTeamsEntity'),
    };
  }
}
