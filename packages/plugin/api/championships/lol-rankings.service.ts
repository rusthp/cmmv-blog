import { Service, Logger, Cron } from '@cmmv/core';
import { Repository } from '@cmmv/repository';

const LOL_API_BASE = 'https://esports-api.lolesports.com/persisted/gw';
const LOL_API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';
const INITIAL_SYNC_DELAY_MS = 25_000;

const TRACKED_LEAGUES = [
    { slug: 'lck',          name: 'LCK',     region: 'APAC' },
    { slug: 'lec',          name: 'LEC',     region: 'EU' },
    { slug: 'lcs',          name: 'LCS',     region: 'NA' },
    { slug: 'lpl',          name: 'LPL',     region: 'APAC' },
    { slug: 'cblol-brazil', name: 'CBLOL',   region: 'BR' },
    { slug: 'lcp',          name: 'LCP',     region: 'APAC' },
] as const;

@Service('blog_lol_rankings')
export class LolRankingsService {
    private static readonly logger = new Logger('LolRankingsService');
    private static initialSyncDone = false;

    static log(msg: string) {
        try { LolRankingsService.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { LolRankingsService.logger.log(`[WARN] ${msg}`); } catch {}
    }

    private get headers() {
        return {
            'x-api-key': LOL_API_KEY,
            'Accept': 'application/json',
        };
    }

    constructor() {
        setTimeout(() => {
            this.initialSync().catch(() => {});
        }, INITIAL_SYNC_DELAY_MS);
    }

    private async initialSync() {
        if (LolRankingsService.initialSyncDone) return;
        LolRankingsService.initialSyncDone = true;

        const entity = Repository.getEntity('LolRankingsEntity');
        if (!entity) return;

        try {
            const existing = await Repository.findAll(entity, { league: 'lck', limit: 1 });
            if (!existing?.data?.length) {
                LolRankingsService.log('[lol-rankings] No data — starting initial sync...');
                await this.syncAll();
            }
        } catch (e: any) {
            LolRankingsService.warn(`[lol-rankings] Initial sync failed: ${e.message}`);
        }
    }

    @Cron('45 6 * * *')
    async cronSync() {
        await this.syncAll();
    }

    async syncAll(): Promise<{ league: string; count: number }[]> {
        const stats: { league: string; count: number }[] = [];

        for (const league of TRACKED_LEAGUES) {
            try {
                const count = await this.syncLeague(league.slug, league.name, league.region);
                stats.push({ league: league.slug, count });
                LolRankingsService.log(`[lol-rankings] synced ${count} for ${league.slug}`);
            } catch (e: any) {
                LolRankingsService.warn(`[lol-rankings] failed ${league.slug}: ${e.message}`);
                stats.push({ league: league.slug, count: 0 });
            }
        }

        return stats;
    }

    async getRankings(league: string, limit = 20): Promise<any[]> {
        const entity = Repository.getEntity('LolRankingsEntity');
        if (!entity) return [];

        const snapshot = await this.getLatestSnapshot(league);
        if (!snapshot) return [];

        const results = await Repository.findAll(entity, {
            league,
            snapshotDate: snapshot,
            limit,
            sortBy: 'standing',
            sort: 'ASC',
        });

        return results?.data || [];
    }

    async getRankingsByRegion(region: string, limit = 40): Promise<Record<string, any[]>> {
        const result: Record<string, any[]> = {};

        const leagues = TRACKED_LEAGUES.filter(l => l.region === region || region === 'global');

        for (const league of leagues) {
            const entries = await this.getRankings(league.slug, limit);
            if (entries.length > 0) result[league.slug] = entries;
        }

        return result;
    }

    async getLeagues(): Promise<{ slug: string; name: string; region: string }[]> {
        return TRACKED_LEAGUES.map(l => ({ slug: l.slug, name: l.name, region: l.region }));
    }

    async getSyncStatus(): Promise<{ hasData: boolean; leagues: { league: string; count: number; snapshot: string | null }[] }> {
        const entity = Repository.getEntity('LolRankingsEntity');
        if (!entity) return { hasData: false, leagues: [] };

        const leagues: { league: string; count: number; snapshot: string | null }[] = [];

        for (const l of TRACKED_LEAGUES) {
            try {
                const snapshot = await this.getLatestSnapshot(l.slug);
                const results = await Repository.findAll(entity, { league: l.slug, limit: 1 });
                leagues.push({ league: l.slug, count: results?.count || 0, snapshot });
            } catch {
                leagues.push({ league: l.slug, count: 0, snapshot: null });
            }
        }

        return { hasData: leagues.some(l => l.count > 0), leagues };
    }

    private async syncLeague(leagueSlug: string, leagueName: string, region: string): Promise<number> {
        // Find the current (ongoing/recent) tournament for this league in our DB
        const tournamentEntity = Repository.getEntity('EsportsTournamentsEntity');
        if (!tournamentEntity) return 0;

        // Try ongoing first, fall back to most recently finished
        let tournament: any = null;

        const ongoing = await Repository.findAll(tournamentEntity, {
            game: 'lol',
            status: 'ongoing',
            leagueName,
            limit: 50,
        });
        if (ongoing?.data?.length) {
            const sorted = [...ongoing.data].sort((a: any, b: any) =>
                new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
            );
            // Prefer numeric Riot IDs over PandaScore serie_ IDs
            tournament = sorted.find((t: any) => /^\d+$/.test(t.externalId)) ?? sorted[0];
        }

        if (!tournament) {
            const recent = await Repository.findAll(tournamentEntity, {
                game: 'lol',
                leagueName,
                limit: 50,
            });
            if (recent?.data?.length) {
                const sorted = [...recent.data].sort((a: any, b: any) =>
                    new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
                );
                tournament = sorted.find((t: any) => /^\d+$/.test(t.externalId)) ?? sorted[0];
            }
        }

        if (!tournament?.externalId) {
            LolRankingsService.warn(`[lol-rankings] No tournament found for ${leagueSlug}`);
            return 0;
        }

        // Fetch standings from LoL Esports API
        const data = await this.apiGet(`/getStandings?hl=pt-BR&tournamentId=${tournament.externalId}`);
        const standings: any[] = data?.data?.standings || [];

        if (!standings.length) return 0;

        const entries = this.extractRankings(standings, leagueSlug, region);
        if (!entries.length) return 0;

        const entity = Repository.getEntity('LolRankingsEntity');
        if (!entity) return 0;

        const today = this.todaySnapshot();
        await Repository.deleteMany(entity, { league: leagueSlug }).catch(() => {});

        let inserted = 0;
        for (const entry of entries) {
            try {
                const result = await Repository.insert(entity, { ...entry, snapshotDate: today });
                if (result?.success) inserted++;
            } catch {}
        }

        return inserted;
    }

    private extractRankings(standings: any[], league: string, region: string): Omit<any, 'snapshotDate'>[] {
        const entries: any[] = [];

        for (const standing of standings) {
            const stages: any[] = standing.stages || [];

            // Prefer regular_season stage; fall back to any stage with rankings
            const stage =
                stages.find((s: any) => s.slug?.includes('regular') || s.slug?.includes('split')) ||
                stages.find((s: any) => (s.sections || []).some((sec: any) => sec.rankings?.length)) ||
                stages[0];

            if (!stage) continue;

            const sections: any[] = stage.sections || [];

            for (const section of sections) {
                const rankings: any[] = section.rankings || [];
                if (!rankings.length) continue;

                for (const row of rankings) {
                    const teams: any[] = row.teams || [];
                    if (!teams.length) continue;

                    const team = teams[0];
                    const record = team.record || row.record || {};
                    const wins = record.wins ?? 0;
                    const losses = record.losses ?? 0;

                    entries.push({
                        standing: row.ordinal ?? entries.length + 1,
                        wins,
                        losses,
                        teamName: team.name || 'TBA',
                        teamCode: team.code || '',
                        league,
                        region,
                        logoUrl: team.image || '',
                    });
                }

                // Only use first section with rankings (regular season standings)
                if (entries.length > 0) break;
            }

            if (entries.length > 0) break;
        }

        return entries;
    }

    private async getLatestSnapshot(league: string): Promise<string | null> {
        const entity = Repository.getEntity('LolRankingsEntity');
        if (!entity) return null;

        try {
            const results = await Repository.findAll(entity, {
                league,
                limit: 1,
                sortBy: 'snapshotDate',
                sort: 'DESC',
            });
            return results?.data?.[0]?.snapshotDate || null;
        } catch {
            return null;
        }
    }

    private todaySnapshot(): string {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}_${m}_${day}`;
    }

    private async apiGet(path: string): Promise<any> {
        try {
            const res = await fetch(`${LOL_API_BASE}${path}`, {
                headers: this.headers,
                signal: AbortSignal.timeout(20000),
            });
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }
}
