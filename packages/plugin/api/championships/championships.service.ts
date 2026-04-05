import {
    Service, Logger, Config, Cron
} from "@cmmv/core";

import { Repository } from "@cmmv/repository";

const PANDASCORE_BASE = 'https://api.pandascore.co';

@Service('blog_championships')
export class ChampionshipsService {
    private readonly logger = new Logger('ChampionshipsService');
    private syncing = false;

    private get apiToken(): string {
        return Config.get<string>('blog.pandascoreToken', '');
    }

    private get headers() {
        return {
            'Authorization': `Bearer ${this.apiToken}`,
            'Accept': 'application/json',
        };
    }

    // ─── Cron Jobs ────────────────────────────────────────────────

    @Cron('0 */6 * * *') // every 6 hours — full tournament sync
    async cronSyncTournaments() {
        if (!this.apiToken) return;
        await this.syncTournaments();
    }

    @Cron('*/30 * * * *') // every 30 min — update live/recent matches
    async cronSyncMatches() {
        if (!this.apiToken) return;
        await this.syncRunningMatches();
    }

    // ─── Public Methods ───────────────────────────────────────────

    async syncAll(): Promise<{ tournaments: number; matches: number; teams: number }> {
        const stats = { tournaments: 0, matches: 0, teams: 0 };
        if (!this.apiToken) {
            this.logger.warn('[championships] No PandaScore token configured (blog.pandascoreToken)');
            return stats;
        }
        this.logger.log('[championships] Starting full sync...');
        stats.tournaments = await this.syncTournaments();
        stats.matches = await this.syncAllMatches();
        stats.teams = await this.syncTopTeams();
        this.logger.log(`[championships] Sync done: ${JSON.stringify(stats)}`);
        return stats;
    }

    async getTournaments(status?: string): Promise<any[]> {
        try {
            const { Cs2TournamentEntity } = await this.getEntities();
            if (!Cs2TournamentEntity) return [];

            const where: any = {};
            if (status && status !== 'all') where.status = status;

            const results = await Repository.findAll(Cs2TournamentEntity, {
                where,
                order: { startDate: 'DESC' },
                limit: 100,
            });

            return (results?.data || []).map((t: any) => ({
                ...t,
                teams: this.parseJson(t.teamsJson),
            }));
        } catch (e: any) {
            this.logger.error(`[championships] getTournaments error: ${e.message}`);
            return [];
        }
    }

    async getTournamentBySlug(slug: string): Promise<any | null> {
        try {
            const { Cs2TournamentEntity } = await this.getEntities();
            if (!Cs2TournamentEntity) return null;

            const tournament = await Repository.findOne(Cs2TournamentEntity, { slug });
            if (!tournament) return null;

            return { ...tournament, teams: this.parseJson(tournament.teamsJson) };
        } catch (e: any) {
            this.logger.error(`[championships] getTournamentBySlug error: ${e.message}`);
            return null;
        }
    }

    async getTournamentMatches(slug: string, status?: string): Promise<any[]> {
        try {
            const { Cs2MatchEntity } = await this.getEntities();
            if (!Cs2MatchEntity) return [];

            const where: any = { tournamentSlug: slug };
            if (status && status !== 'all') where.status = status;

            const results = await Repository.findAll(Cs2MatchEntity, {
                where,
                order: { scheduledAt: 'ASC' },
                limit: 200,
            });

            return results?.data || [];
        } catch (e: any) {
            this.logger.error(`[championships] getTournamentMatches error: ${e.message}`);
            return [];
        }
    }

    async getUpcomingMatches(limit = 20): Promise<any[]> {
        try {
            const { Cs2MatchEntity } = await this.getEntities();
            if (!Cs2MatchEntity) return [];

            const results = await Repository.findAll(Cs2MatchEntity, {
                where: { status: 'not_started' },
                order: { scheduledAt: 'ASC' },
                limit,
            });

            return results?.data || [];
        } catch (e: any) {
            this.logger.error(`[championships] getUpcomingMatches error: ${e.message}`);
            return [];
        }
    }

    async getRecentResults(limit = 20): Promise<any[]> {
        try {
            const { Cs2MatchEntity } = await this.getEntities();
            if (!Cs2MatchEntity) return [];

            const results = await Repository.findAll(Cs2MatchEntity, {
                where: { status: 'finished' },
                order: { endedAt: 'DESC' },
                limit,
            });

            return results?.data || [];
        } catch (e: any) {
            this.logger.error(`[championships] getRecentResults error: ${e.message}`);
            return [];
        }
    }

    async getTeams(limit = 50): Promise<any[]> {
        try {
            const { Cs2TeamEntity } = await this.getEntities();
            if (!Cs2TeamEntity) return [];

            const results = await Repository.findAll(Cs2TeamEntity, {
                order: { ranking: 'ASC' },
                limit,
            });

            return results?.data || [];
        } catch (e: any) {
            this.logger.error(`[championships] getTeams error: ${e.message}`);
            return [];
        }
    }

    // ─── PandaScore Sync ──────────────────────────────────────────

    private async syncTournaments(): Promise<number> {
        try {
            const statuses = ['running', 'upcoming', 'past'];
            let total = 0;

            for (const status of statuses) {
                const data = await this.pandascoreGet(
                    `/csgo/tournaments?filter[status]=${status}&page[size]=50&sort=-begin_at`
                );
                if (!Array.isArray(data)) continue;

                for (const t of data) {
                    await this.upsertTournament(t);
                    total++;
                }
            }

            return total;
        } catch (e: any) {
            this.logger.error(`[championships] syncTournaments error: ${e.message}`);
            return 0;
        }
    }

    private async syncAllMatches(): Promise<number> {
        try {
            const { Cs2TournamentEntity } = await this.getEntities();
            if (!Cs2TournamentEntity) return 0;

            const ongoing = await Repository.findAll(Cs2TournamentEntity, {
                where: { status: 'ongoing' },
                limit: 50,
            });

            let total = 0;
            for (const t of (ongoing?.data || [])) {
                const count = await this.syncMatchesForTournament(t.externalId, t.slug);
                total += count;
            }

            return total;
        } catch (e: any) {
            this.logger.error(`[championships] syncAllMatches error: ${e.message}`);
            return 0;
        }
    }

    private async syncRunningMatches(): Promise<void> {
        try {
            const running = await this.pandascoreGet('/csgo/matches/running?page[size]=20');
            if (!Array.isArray(running)) return;

            for (const m of running) {
                await this.upsertMatch(m);
            }

            const upcoming = await this.pandascoreGet('/csgo/matches/upcoming?page[size]=30&sort=scheduled_at');
            if (Array.isArray(upcoming)) {
                for (const m of upcoming) {
                    await this.upsertMatch(m);
                }
            }
        } catch (e: any) {
            this.logger.error(`[championships] syncRunningMatches error: ${e.message}`);
        }
    }

    private async syncMatchesForTournament(externalId: string, slug: string): Promise<number> {
        try {
            const data = await this.pandascoreGet(
                `/csgo/tournaments/${externalId}/matches?page[size]=100`
            );
            if (!Array.isArray(data)) return 0;

            for (const m of data) {
                await this.upsertMatch(m, slug);
            }

            return data.length;
        } catch (e: any) {
            this.logger.error(`[championships] syncMatchesForTournament error: ${e.message}`);
            return 0;
        }
    }

    private async syncTopTeams(): Promise<number> {
        try {
            const data = await this.pandascoreGet('/csgo/teams?sort=id&page[size]=100');
            if (!Array.isArray(data)) return 0;

            const rankings = await this.pandascoreGet('/csgo/teams/rankings?page[size]=30');
            const rankMap = new Map<string, number>();
            if (Array.isArray(rankings)) {
                rankings.forEach((r: any, i: number) => {
                    if (r.team?.id) rankMap.set(String(r.team.id), i + 1);
                });
            }

            for (const t of data) {
                await this.upsertTeam(t, rankMap.get(String(t.id)));
            }

            return data.length;
        } catch (e: any) {
            this.logger.error(`[championships] syncTopTeams error: ${e.message}`);
            return 0;
        }
    }

    // ─── Upsert Helpers ───────────────────────────────────────────

    private async upsertTournament(t: any): Promise<void> {
        const { Cs2TournamentEntity } = await this.getEntities();
        if (!Cs2TournamentEntity) return;

        const existing = await Repository.findOne(Cs2TournamentEntity, {
            externalId: String(t.id)
        });

        const teams = (t.teams || []).map((team: any) => ({
            id: String(team.id),
            name: team.name,
            acronym: team.acronym || '',
            logoUrl: team.image_url || '',
        }));

        const data = {
            externalId: String(t.id),
            name: t.name || '',
            slug: t.slug || String(t.id),
            status: this.mapTournamentStatus(t.status),
            startDate: t.begin_at || null,
            endDate: t.end_at || null,
            prizePool: t.prizepool || '',
            location: t.location || '',
            online: !!t.live_supported,
            tier: t.tier || '',
            logoUrl: t.league?.image_url || '',
            bannerUrl: t.serie?.image_url || '',
            leagueName: t.league?.name || '',
            leagueLogo: t.league?.image_url || '',
            serieName: t.serie?.full_name || t.serie?.name || '',
            teamsJson: JSON.stringify(teams),
            featured: (t.tier === 's' || t.tier === 'a'),
        };

        if (existing) {
            await Repository.update(Cs2TournamentEntity, { id: existing.id }, data);
        } else {
            await Repository.insert(Cs2TournamentEntity, data);
        }
    }

    private async upsertMatch(m: any, tournamentSlug?: string): Promise<void> {
        const { Cs2MatchEntity } = await this.getEntities();
        if (!Cs2MatchEntity) return;

        const existing = await Repository.findOne(Cs2MatchEntity, {
            externalId: String(m.id)
        });

        const opponents = m.opponents || [];
        const results = m.results || [];

        const team1 = opponents[0]?.opponent;
        const team2 = opponents[1]?.opponent;
        const score1 = results.find((r: any) => r.team_id === team1?.id)?.score || 0;
        const score2 = results.find((r: any) => r.team_id === team2?.id)?.score || 0;

        const slug = tournamentSlug || m.tournament?.slug || String(m.tournament?.id || '');

        const streams = m.streams_list || m.streams || [];
        const streamUrl = streams.find((s: any) => s.language === 'pt' || s.language === 'en')?.raw_url || '';

        const data = {
            externalId: String(m.id),
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
            winnerExternalId: m.winner?.id ? String(m.winner.id) : '',
            streamUrl,
        };

        if (existing) {
            await Repository.update(Cs2MatchEntity, { id: existing.id }, data);
        } else {
            await Repository.insert(Cs2MatchEntity, data);
        }
    }

    private async upsertTeam(t: any, ranking?: number): Promise<void> {
        const { Cs2TeamEntity } = await this.getEntities();
        if (!Cs2TeamEntity) return;

        const existing = await Repository.findOne(Cs2TeamEntity, {
            externalId: String(t.id)
        });

        const data = {
            externalId: String(t.id),
            name: t.name || '',
            slug: t.slug || String(t.id),
            acronym: t.acronym || '',
            logoUrl: t.image_url || '',
            nationality: t.nationality || '',
            region: t.location || '',
            ranking: ranking || 0,
        };

        if (existing) {
            await Repository.update(Cs2TeamEntity, { id: existing.id }, data);
        } else {
            await Repository.insert(Cs2TeamEntity, data);
        }
    }

    // ─── Utility ──────────────────────────────────────────────────

    private async pandascoreGet(path: string): Promise<any> {
        const url = `${PANDASCORE_BASE}${path}`;
        const response = await fetch(url, {
            headers: this.headers,
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            throw new Error(`PandaScore ${response.status}: ${path}`);
        }

        return response.json();
    }

    private mapTournamentStatus(status: string): string {
        const map: Record<string, string> = {
            running: 'ongoing',
            upcoming: 'upcoming',
            finished: 'finished',
            cancelled: 'cancelled',
        };
        return map[status] || status || 'upcoming';
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
        return map[status] || status || 'not_started';
    }

    private extractPhase(match: any): string {
        const name = (match.name || '').toLowerCase();
        if (name.includes('grand final') || name.includes('grande final')) return 'grand_final';
        if (name.includes('semifinal') || name.includes('semi-final')) return 'semi_final';
        if (name.includes('quarter') || name.includes('quarta')) return 'quarter_final';
        if (name.includes('playoff') || name.includes('eliminat')) return 'playoffs';
        if (name.includes('group') || name.includes('grupo')) return 'group_stage';
        if (name.includes('qualifier') || name.includes('qualif')) return 'qualifier';
        return match.tournament_round_number ? 'playoffs' : 'group_stage';
    }

    private parseJson(json: string): any[] {
        try { return JSON.parse(json || '[]'); }
        catch { return []; }
    }

    private async getEntities() {
        try {
            const { Repository: Repo } = await import('@cmmv/repository');
            const entities: any = {};

            try {
                const { Cs2TournamentEntity } = await import(
                    '../../.generated/entities/repository/cs2-tournament.entity'
                );
                entities.Cs2TournamentEntity = Cs2TournamentEntity;
            } catch {}

            try {
                const { Cs2MatchEntity } = await import(
                    '../../.generated/entities/repository/cs2-match.entity'
                );
                entities.Cs2MatchEntity = Cs2MatchEntity;
            } catch {}

            try {
                const { Cs2TeamEntity } = await import(
                    '../../.generated/entities/repository/cs2-team.entity'
                );
                entities.Cs2TeamEntity = Cs2TeamEntity;
            } catch {}

            return entities;
        } catch {
            return {};
        }
    }
}
