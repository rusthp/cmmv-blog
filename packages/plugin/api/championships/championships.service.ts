import {
    Service, Logger, Config, Cron
} from "@cmmv/core";

import { Repository } from "@cmmv/repository";

const PANDASCORE_BASE = 'https://api.pandascore.co';

const SUPPORTED_GAMES = ['csgo', 'dota2', 'valorant', 'r6siege', 'lol'];

@Service('blog_championships')
export class ChampionshipsService {
    private static readonly logger = new Logger('ChampionshipsService');

    static warn(msg: string) {
        try { ChampionshipsService.logger.log(msg); } catch {}
    }
    static log(msg: string) {
        try { ChampionshipsService.logger.log(msg); } catch {}
    }

    private get apiToken(): string {
        return Config.get<string>('blog.pandascoreToken', 'nUO1wT0wR9Vpvv1B4n_G9TGVqjPPr4wtIzN-mRxV0B4hmHR83SY');
    }

    private get headers() {
        return {
            'Authorization': `Bearer ${this.apiToken}`,
            'Accept': 'application/json',
        };
    }

    // ─── Cron Jobs ────────────────────────────────────────────────

    @Cron('0 */6 * * *')
    async cronSyncTournaments() {
        if (!this.apiToken) return;
        await this.syncTournaments();
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
            ChampionshipsService.warn('[championships] No PandaScore token — set blog.pandascoreToken in settings');
            return stats;
        }

        ChampionshipsService.log('[championships] Full sync starting...');
        stats.tournaments = await this.syncTournaments();
        stats.matches = await this.syncAllMatchesFromOngoing();
        stats.teams = await this.syncTeams();
        ChampionshipsService.log(`[championships] Sync done: ${JSON.stringify(stats)}`);
        return stats;
    }

    async getTournaments(status?: string, game?: string): Promise<any[]> {
        const { EsportsTournamentEntity } = this.getEntities();
        if (!EsportsTournamentEntity) return [];

        const queries: any = { limit: '200' };
        if (status && status !== 'all') queries.status = status;
        if (game && game !== 'all') queries.game = game;

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

    async getTournamentBySlug(slug: string): Promise<any | null> {
        const { EsportsTournamentEntity } = this.getEntities();
        if (!EsportsTournamentEntity) return null;

        const t = (await Repository.findOne(EsportsTournamentEntity, { slug })) as any;
        if (!t) return null;
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

        const queries: any = { status: 'not_started', limit: String(limit), sortBy: 'scheduledAt', sort: 'ASC' };
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

    async getTeams(game?: string, limit = 50): Promise<any[]> {
        const { EsportsTeamEntity } = this.getEntities();
        if (!EsportsTeamEntity) return [];

        const queries: any = { limit: String(limit), sortBy: 'ranking', sort: 'ASC' };
        if (game && game !== 'all') queries.game = game;

        const results = await Repository.findAll(EsportsTeamEntity, queries);
        return results?.data || [];
    }

    // ─── Sync: Tournaments ────────────────────────────────────────

    private async syncTournaments(): Promise<number> {
        let total = 0;

        for (const game of SUPPORTED_GAMES) {
            for (const endpoint of ['running', 'upcoming', 'past']) {
                try {
                    const data = await this.pandascoreGet(
                        `/${game}/tournaments/${endpoint}?page[size]=50&sort=-begin_at`
                    );
                    if (!Array.isArray(data)) continue;

                    for (const t of data) {
                        await this.upsertTournament(t, endpoint, game);
                        total++;
                    }
                } catch (e: any) {
                    ChampionshipsService.warn(`[championships] syncTournaments/${game}/${endpoint}: ${e.message}`);
                }
            }
        }

        return total;
    }

    private async syncAllMatchesFromOngoing(): Promise<number> {
        const { EsportsTournamentEntity } = this.getEntities();
        if (!EsportsTournamentEntity) return 0;

        const ongoing = await Repository.findAll(EsportsTournamentEntity, {
            status: 'ongoing',
            limit: '50',
        });

        let total = 0;
        for (const t of (ongoing?.data || [])) {
            try {
                // Determine game from t.game
                const data = await this.pandascoreGet(
                    `/${t.game}/tournaments/${t.externalId}/matches?page[size]=100`
                );
                if (!Array.isArray(data)) continue;
                for (const m of data) {
                    await this.upsertMatch(m, t.game, t.slug);
                    total++;
                }
            } catch (e: any) {
                ChampionshipsService.warn(`[championships] syncMatches for ${t.slug} (${t.game}): ${e.message}`);
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
                    ChampionshipsService.warn(`[championships] syncMatches/${game}/${endpoint}: ${e.message}`);
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
            externalId: String(t.id)
        });

        const isOnline = t.type === 'online' || (t.live_supported && !t.country);
        const location = t.country || t.region || '';

        const teams = (t.teams || []).map((team: any) => ({
            id: String(team.id),
            name: team.name,
            acronym: team.acronym || '',
            logoUrl: team.image_url || '',
            location: team.location || '',
        }));

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
            prizePool: t.prizepool || '',
            location,
            online: isOnline,
            tier: t.tier || '',
            logoUrl: t.league?.image_url || '',
            bannerUrl: t.serie?.image_url || t.league?.image_url || '',
            leagueName: t.league?.name || '',
            leagueLogo: t.league?.image_url || '',
            serieName: t.serie?.full_name || t.serie?.name || '',
            teamsJson: JSON.stringify(teams),
            featured: t.tier === 's' || t.tier === 'a',
        };

        if (existing) {
            await Repository.update(EsportsTournamentEntity, { id: (existing as any).id }, data);
        } else {
            const result = await Repository.insert(EsportsTournamentEntity, data);
            if (!result.success) {
                const fs = require('fs');
                fs.appendFileSync('debug.txt', `[championships] Failed to insert tournament ${t.slug}: ${result.message}\n`);
                ChampionshipsService.warn(`[championships] Failed to insert tournament ${t.slug}: ${result.message}`);
            }
        }
    }

    private async upsertMatch(m: any, game: string, tournamentSlug?: string): Promise<void> {
        const { EsportsMatchEntity } = this.getEntities();
        if (!EsportsMatchEntity) return;

        const existing = await Repository.findOne(EsportsMatchEntity, {
            externalId: String(m.id)
        });

        const opponents = m.opponents || [];
        const results: Array<{ score: number; team_id: number }> = m.results || [];

        const team1 = opponents[0]?.opponent;
        const team2 = opponents[1]?.opponent;

        const score1 = results.find(r => r.team_id === team1?.id)?.score ?? 0;
        const score2 = results.find(r => r.team_id === team2?.id)?.score ?? 0;

        const slug = tournamentSlug
            || m.tournament?.slug
            || String(m.tournament_id || '');

        const streams: any[] = m.streams_list || [];
        const stream = streams.find(s => s.language === 'pt')
            || streams.find(s => s.main)
            || streams.find(s => s.language === 'en')
            || null;
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
                ChampionshipsService.warn(`[championships] Failed to insert match ${m.slug}: ${result.message}`);
            }
        }
    }

    private async upsertTeam(t: any, game: string): Promise<void> {
        const { EsportsTeamEntity } = this.getEntities();
        if (!EsportsTeamEntity) return;

        const existing = await Repository.findOne(EsportsTeamEntity, {
            externalId: String(t.id)
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
                ChampionshipsService.warn(`[championships] Failed to insert team ${t.slug}: ${result.message}`);
            }
        }
    }

    // ─── Utilities ────────────────────────────────────────────────

    private async pandascoreGet(path: string): Promise<any> {
        const url = `${PANDASCORE_BASE}${path}`;
        const response = await fetch(url, {
            headers: this.headers,
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`PandaScore ${response.status} ${path}: ${body.substring(0, 200)}`);
        }

        return response.json();
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
        try { return JSON.parse(json || '[]'); }
        catch { return []; }
    }

    private getEntities(): Record<string, any> {
        return {
            EsportsTournamentEntity: Repository.getEntity("EsportsTournamentsEntity"),
            EsportsMatchEntity: Repository.getEntity("EsportsMatchesEntity"),
            EsportsTeamEntity: Repository.getEntity("EsportsTeamsEntity"),
        };
    }
}
