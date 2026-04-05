import {
    Service, Logger, Config, Cron
} from "@cmmv/core";

import { Repository } from "@cmmv/repository";

const PANDASCORE_BASE = 'https://api.pandascore.co';

// PandaScore uses /csgo/ prefix for CS2 (legacy slug: cs-go)
// Correct endpoints: /csgo/tournaments/running|upcoming|past  (NOT filter[status])
// Match endpoints:   /csgo/matches/running|upcoming|past

@Service('blog_championships')
export class ChampionshipsService {
    private readonly logger = new Logger('ChampionshipsService');

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
            this.logger.warn('[championships] No PandaScore token — set blog.pandascoreToken in settings');
            return stats;
        }

        this.logger.log('[championships] Full sync starting...');
        stats.tournaments = await this.syncTournaments();
        stats.matches = await this.syncAllMatchesFromOngoing();
        stats.teams = await this.syncTeams();
        this.logger.log(`[championships] Sync done: ${JSON.stringify(stats)}`);
        return stats;
    }

    async getTournaments(status?: string): Promise<any[]> {
        const { Cs2TournamentEntity } = this.getEntities();
        if (!Cs2TournamentEntity) return [];

        const where: any = {};
        if (status && status !== 'all') where.status = status;

        const results = await Repository.findAll(Cs2TournamentEntity, {
            where,
            order: { startDate: 'DESC' },
            limit: 200,
        });

        return (results?.data || []).map((t: any) => ({
            ...t,
            teams: this.parseJson(t.teamsJson),
        }));
    }

    async getTournamentBySlug(slug: string): Promise<any | null> {
        const { Cs2TournamentEntity } = this.getEntities();
        if (!Cs2TournamentEntity) return null;

        const t = await Repository.findOne(Cs2TournamentEntity, { slug });
        if (!t) return null;
        return { ...t, teams: this.parseJson(t.teamsJson) };
    }

    async getTournamentMatches(slug: string, status?: string): Promise<any[]> {
        const { Cs2MatchEntity } = this.getEntities();
        if (!Cs2MatchEntity) return [];

        const where: any = { tournamentSlug: slug };
        if (status && status !== 'all') where.status = status;

        const results = await Repository.findAll(Cs2MatchEntity, {
            where,
            order: { scheduledAt: 'ASC' },
            limit: 200,
        });

        return results?.data || [];
    }

    async getUpcomingMatches(limit = 20): Promise<any[]> {
        const { Cs2MatchEntity } = this.getEntities();
        if (!Cs2MatchEntity) return [];

        const results = await Repository.findAll(Cs2MatchEntity, {
            where: { status: 'not_started' },
            order: { scheduledAt: 'ASC' },
            limit,
        });

        return results?.data || [];
    }

    async getRecentResults(limit = 20): Promise<any[]> {
        const { Cs2MatchEntity } = this.getEntities();
        if (!Cs2MatchEntity) return [];

        const results = await Repository.findAll(Cs2MatchEntity, {
            where: { status: 'finished' },
            order: { endedAt: 'DESC' },
            limit,
        });

        return results?.data || [];
    }

    async getTeams(limit = 50): Promise<any[]> {
        const { Cs2TeamEntity } = this.getEntities();
        if (!Cs2TeamEntity) return [];

        const results = await Repository.findAll(Cs2TeamEntity, {
            order: { ranking: 'ASC' },
            limit,
        });

        return results?.data || [];
    }

    // ─── Sync: Tournaments ────────────────────────────────────────

    private async syncTournaments(): Promise<number> {
        let total = 0;

        // PandaScore uses path-based status, not query param
        for (const endpoint of ['running', 'upcoming', 'past']) {
            try {
                const data = await this.pandascoreGet(
                    `/csgo/tournaments/${endpoint}?page[size]=50&sort=-begin_at`
                );
                if (!Array.isArray(data)) continue;

                for (const t of data) {
                    await this.upsertTournament(t, endpoint);
                    total++;
                }
            } catch (e: any) {
                this.logger.warn(`[championships] syncTournaments/${endpoint}: ${e.message}`);
            }
        }

        return total;
    }

    private async syncAllMatchesFromOngoing(): Promise<number> {
        const { Cs2TournamentEntity } = this.getEntities();
        if (!Cs2TournamentEntity) return 0;

        const ongoing = await Repository.findAll(Cs2TournamentEntity, {
            where: { status: 'ongoing' },
            limit: 50,
        });

        let total = 0;
        for (const t of (ongoing?.data || [])) {
            try {
                const data = await this.pandascoreGet(
                    `/csgo/tournaments/${t.externalId}/matches?page[size]=100`
                );
                if (!Array.isArray(data)) continue;
                for (const m of data) {
                    await this.upsertMatch(m, t.slug);
                    total++;
                }
            } catch (e: any) {
                this.logger.warn(`[championships] syncMatches for ${t.slug}: ${e.message}`);
            }
        }

        return total;
    }

    private async syncRunningAndUpcomingMatches(): Promise<void> {
        for (const endpoint of ['running', 'upcoming']) {
            try {
                const size = endpoint === 'upcoming' ? 30 : 20;
                const data = await this.pandascoreGet(
                    `/csgo/matches/${endpoint}?page[size]=${size}&sort=scheduled_at`
                );
                if (!Array.isArray(data)) continue;
                for (const m of data) {
                    await this.upsertMatch(m);
                }
            } catch (e: any) {
                this.logger.warn(`[championships] syncMatches/${endpoint}: ${e.message}`);
            }
        }
    }

    private async syncTeams(): Promise<number> {
        try {
            const data = await this.pandascoreGet('/csgo/teams?page[size]=100&sort=modified_at');
            if (!Array.isArray(data)) return 0;

            for (const t of data) {
                await this.upsertTeam(t);
            }

            return data.length;
        } catch (e: any) {
            this.logger.warn(`[championships] syncTeams: ${e.message}`);
            return 0;
        }
    }

    // ─── Upsert Helpers ───────────────────────────────────────────

    private async upsertTournament(t: any, endpointStatus: string): Promise<void> {
        const { Cs2TournamentEntity } = this.getEntities();
        if (!Cs2TournamentEntity) return;

        const existing = await Repository.findOne(Cs2TournamentEntity, {
            externalId: String(t.id)
        });

        // t.type = 'online' | 'lan' | etc (direct field from PandaScore)
        const isOnline = t.type === 'online' || (t.live_supported && !t.country);

        // Location: country field or league location
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
            await Repository.update(Cs2TournamentEntity, { id: existing.id }, data);
        } else {
            await Repository.insert(Cs2TournamentEntity, data);
        }
    }

    private async upsertMatch(m: any, tournamentSlug?: string): Promise<void> {
        const { Cs2MatchEntity } = this.getEntities();
        if (!Cs2MatchEntity) return;

        const existing = await Repository.findOne(Cs2MatchEntity, {
            externalId: String(m.id)
        });

        const opponents = m.opponents || [];
        const results: Array<{ score: number; team_id: number }> = m.results || [];

        const team1 = opponents[0]?.opponent;
        const team2 = opponents[1]?.opponent;

        // results is [{ score, team_id }] — match by team_id
        const score1 = results.find(r => r.team_id === team1?.id)?.score ?? 0;
        const score2 = results.find(r => r.team_id === team2?.id)?.score ?? 0;

        // tournament slug: prefer passed arg, then from match.tournament object
        const slug = tournamentSlug
            || m.tournament?.slug
            || String(m.tournament_id || '');

        // Stream: prefer pt-BR, fallback to main or en
        const streams: any[] = m.streams_list || [];
        const stream = streams.find(s => s.language === 'pt')
            || streams.find(s => s.main)
            || streams.find(s => s.language === 'en')
            || null;
        const streamUrl = stream?.raw_url || '';

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
            winnerExternalId: m.winner_id ? String(m.winner_id) : '',
            streamUrl,
        };

        if (existing) {
            await Repository.update(Cs2MatchEntity, { id: existing.id }, data);
        } else {
            await Repository.insert(Cs2MatchEntity, data);
        }
    }

    private async upsertTeam(t: any): Promise<void> {
        const { Cs2TeamEntity } = this.getEntities();
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
            nationality: t.location || t.nationality || '',
            region: t.location || '',
            ranking: 0,
        };

        if (existing) {
            await Repository.update(Cs2TeamEntity, { id: existing.id }, data);
        } else {
            await Repository.insert(Cs2TeamEntity, data);
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
            Cs2TournamentEntity: Repository.getEntity("Cs2TournamentEntity"),
            Cs2MatchEntity: Repository.getEntity("Cs2MatchEntity"),
            Cs2TeamEntity: Repository.getEntity("Cs2TeamEntity"),
        };
    }
}
