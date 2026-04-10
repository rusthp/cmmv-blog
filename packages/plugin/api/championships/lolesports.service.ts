import { Service, Logger, Cron } from '@cmmv/core';
import { Repository } from '@cmmv/repository';

const LOL_API_BASE = 'https://esports-api.lolesports.com/persisted/gw';
const LOL_API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';
const LOL_STATIC_BASE = 'http://static.lolesports.com';

// All major LoL leagues we want to track
const TRACKED_LEAGUES = [
    { id: '98767991310872058', slug: 'lck', name: 'LCK', region: 'APAC' },
    { id: '98767991302996019', slug: 'lec', name: 'LEC', region: 'EU' },
    { id: '98767991299243165', slug: 'lcs', name: 'LCS', region: 'NA' },
    { id: '98767991314006698', slug: 'lpl', name: 'LPL', region: 'APAC' },
    { id: '98767991332355509', slug: 'cblol-brazil', name: 'CBLOL', region: 'BR' },
    { id: '113476371197627891', slug: 'lcp', name: 'LCP', region: 'APAC' },
    { id: '98767975604431411', slug: 'worlds', name: 'Worlds', region: 'global' },
    { id: '98767991325878492', slug: 'msi', name: 'MSI', region: 'global' },
    { id: '113464388705111224', slug: 'first_stand', name: 'First Stand', region: 'global' },
    { id: '116096325848746167', slug: 'americas_cup', name: 'Americas Cup', region: 'SA' },
];

@Service('blog_lolesports')
export class LolEsportsService {
    private static readonly logger = new Logger('LolEsportsService');

    static log(msg: string) {
        try { LolEsportsService.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { LolEsportsService.logger.log(`[WARN] ${msg}`); } catch {}
    }

    private get headers() {
        return {
            'x-api-key': LOL_API_KEY,
            'Accept': 'application/json',
        };
    }

    @Cron('0 */4 * * *')
    async cronSync() {
        await this.syncAll();
    }

    async syncAll(): Promise<{ tournaments: number; matches: number }> {
        const stats = { tournaments: 0, matches: 0 };
        LolEsportsService.log('[lolesports] Starting sync...');

        for (const league of TRACKED_LEAGUES) {
            try {
                const { tournaments, matches } = await this.syncLeague(league);
                stats.tournaments += tournaments;
                stats.matches += matches;
            } catch (e: any) {
                LolEsportsService.warn(`[lolesports] Failed syncing league ${league.slug}: ${e.message}`);
            }
        }

        LolEsportsService.log(`[lolesports] Sync done: ${JSON.stringify(stats)}`);
        return stats;
    }

    private async syncLeague(league: { id: string; slug: string; name: string; region: string }): Promise<{ tournaments: number; matches: number }> {
        const stats = { tournaments: 0, matches: 0 };

        // Get tournaments for this league
        const tourData = await this.apiGet(`/getTournamentsForLeague?hl=pt-BR&leagueId=${league.id}`);
        const leagueTournaments: any[] = tourData?.data?.leagues?.[0]?.tournaments || [];

        // Only sync recent/current tournaments (last 2)
        const recent = leagueTournaments.slice(0, 2);

        for (const t of recent) {
            try {
                const synced = await this.syncTournament(t, league);
                stats.tournaments++;
                stats.matches += synced;
            } catch (e: any) {
                LolEsportsService.warn(`[lolesports] Failed syncing tournament ${t.slug}: ${e.message}`);
            }
        }

        return stats;
    }

    private async syncTournament(t: any, league: { slug: string; name: string; region: string }): Promise<number> {
        const { EsportsTournamentEntity } = this.getEntities();
        if (!EsportsTournamentEntity) return 0;

        const now = new Date();
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);

        let status = 'upcoming';
        if (now >= start && now <= end) status = 'ongoing';
        else if (now > end) status = 'finished';

        const slug = `lol-${t.slug}`;
        const tournamentData = {
            externalId: t.id,
            game: 'lol',
            name: t.slug.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            slug,
            status,
            startDate: t.startDate,
            endDate: t.endDate,
            prizePool: '',
            location: '',
            online: true,
            tier: league.slug === 'worlds' || league.slug === 'msi' ? 's' : 'a',
            logoUrl: '',
            bannerUrl: '',
            leagueName: league.name,
            leagueLogo: '',
            serieName: '',
            teamsJson: '[]',
            region: league.region,
            numberOfTeams: 0,
            featured: ['worlds', 'msi', 'first_stand', 'lck', 'lec'].includes(league.slug),
        };

        const existing = await Repository.findOne(EsportsTournamentEntity, { externalId: t.id });
        if (existing) {
            await Repository.update(EsportsTournamentEntity, { id: (existing as any).id }, tournamentData);
        } else {
            await Repository.insert(EsportsTournamentEntity, tournamentData);
        }

        // Sync bracket/standings for this tournament
        return await this.syncTournamentBracket(t.id, slug);
    }

    private async syncTournamentBracket(tournamentId: string, tournamentSlug: string): Promise<number> {
        let total = 0;

        try {
            const standingsData = await this.apiGet(`/getStandings?hl=pt-BR&tournamentId=${tournamentId}`);
            const standings: any[] = standingsData?.data?.standings || [];

            for (const standing of standings) {
                const stages: any[] = standing.stages || [];

                for (const stage of stages) {
                    const sections: any[] = stage.sections || [];
                    const stageType = this.classifyStage(stage.slug || stage.name);

                    for (const section of sections) {
                        const matches: any[] = section.matches || [];

                        // Build a map of matchId → match for next_match_id resolution
                        const matchMap = new Map<string, any>();
                        for (const m of matches) {
                            matchMap.set(m.id, m);
                        }

                        // Process matches in order with round inference
                        for (let i = 0; i < matches.length; i++) {
                            const m = matches[i];
                            await this.upsertLolMatch(m, tournamentSlug, stage, stageType, matches, i);
                            total++;
                        }
                    }
                }
            }
        } catch (e: any) {
            LolEsportsService.warn(`[lolesports] Bracket sync failed for ${tournamentSlug}: ${e.message}`);
        }

        return total;
    }

    private async upsertLolMatch(
        m: any,
        tournamentSlug: string,
        stage: any,
        stageType: string,
        allMatches: any[],
        index: number
    ): Promise<void> {
        const { EsportsMatchEntity } = this.getEntities();
        if (!EsportsMatchEntity) return;

        const teams = m.teams || [];
        const team1 = teams[0];
        const team2 = teams[1];

        const status = this.mapLolStatus(m.state);
        const winner = teams.find((t: any) => t.result?.outcome === 'win');

        // Determine round number from previousMatchIds
        // If no previousMatchIds → round 1, if has them → later round
        const prevIds: string[] = m.previousMatchIds || [];
        const roundNumber = prevIds.length === 0 ? 1 : this.inferRound(index, allMatches);

        // Find next match (match that has this match in its previousMatchIds)
        const nextMatch = allMatches.find(
            (other: any) => (other.previousMatchIds || []).includes(m.id)
        );

        const data: any = {
            externalId: m.id,
            game: 'lol',
            tournamentExternalId: tournamentSlug,
            tournamentSlug,
            name: `${team1?.name || 'TBA'} vs ${team2?.name || 'TBA'}`,
            status,
            scheduledAt: m.startTime || null,
            endedAt: status === 'finished' ? m.startTime : null,
            numberOfGames: m.strategy?.count || 1,
            phase: stageType,
            team1ExternalId: team1?.id || '',
            team1Name: team1?.name || 'TBA',
            team1Logo: team1?.image || '',
            team1Acronym: team1?.code || '',
            team1Score: team1?.result?.gameWins ?? 0,
            team2ExternalId: team2?.id || '',
            team2Name: team2?.name || 'TBA',
            team2Logo: team2?.image || '',
            team2Acronym: team2?.code || '',
            team2Score: team2?.result?.gameWins ?? 0,
            winnerExternalId: winner?.id || '',
            streamUrl: '',
            roundNumber,
            nextMatchId: nextMatch?.id || '',
            bracketSection: this.inferBracketSection(stage.slug || '', index, allMatches.length),
            dataSource: 'lolesports',
        };

        const existing = await Repository.findOne(EsportsMatchEntity, { externalId: m.id });
        if (existing) {
            await Repository.update(EsportsMatchEntity, { id: (existing as any).id }, data);
        } else {
            await Repository.insert(EsportsMatchEntity, data);
        }
    }

    // ─── Bracket Query ────────────────────────────────────────────

    async getTournamentBracket(tournamentSlug: string): Promise<{
        rounds: BracketRound[];
        hasConnectivity: boolean;
    }> {
        const { EsportsMatchEntity } = this.getEntities();
        if (!EsportsMatchEntity) return { rounds: [], hasConnectivity: false };

        const results = await Repository.findAll(EsportsMatchEntity, {
            tournamentSlug,
            dataSource: 'lolesports',
            limit: '200',
        });

        const matches: any[] = results?.data || [];
        if (matches.length === 0) return { rounds: [], hasConnectivity: false };

        return this.buildBracketTree(matches);
    }

    private buildBracketTree(matches: any[]): { rounds: BracketRound[]; hasConnectivity: boolean } {
        // Group by roundNumber
        const byRound = new Map<number, any[]>();
        for (const m of matches) {
            const r = m.roundNumber || 1;
            if (!byRound.has(r)) byRound.set(r, []);
            byRound.get(r)!.push(m);
        }

        const sortedRounds = Array.from(byRound.entries())
            .sort(([a], [b]) => a - b)
            .map(([roundNumber, roundMatches]) => ({
                roundNumber,
                label: this.getRoundLabel(roundNumber, byRound.size),
                matches: roundMatches.map(m => ({
                    id: m.id,
                    externalId: m.externalId,
                    team1: { name: m.team1Name, logo: m.team1Logo, acronym: m.team1Acronym, score: m.team1Score, externalId: m.team1ExternalId },
                    team2: { name: m.team2Name, logo: m.team2Logo, acronym: m.team2Acronym, score: m.team2Score, externalId: m.team2ExternalId },
                    status: m.status,
                    winnerExternalId: m.winnerExternalId,
                    nextMatchId: m.nextMatchId,
                    scheduledAt: m.scheduledAt,
                    numberOfGames: m.numberOfGames,
                    bracketSection: m.bracketSection || 'upper',
                })),
            }));

        const hasConnectivity = matches.some(m => m.nextMatchId);
        return { rounds: sortedRounds, hasConnectivity };
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private async apiGet(path: string): Promise<any> {
        const url = `${LOL_API_BASE}${path}`;
        const response = await fetch(url, {
            headers: this.headers,
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(`LoL Esports API ${response.status}: ${path}`);
        return await response.json();
    }

    private mapLolStatus(state: string): string {
        const map: Record<string, string> = {
            completed: 'finished',
            inProgress: 'running',
            unstarted: 'not_started',
        };
        return map[state] || 'not_started';
    }

    private classifyStage(slug: string): string {
        const s = slug.toLowerCase();
        if (s.includes('final') && s.includes('grand')) return 'grand_final';
        if (s.includes('final')) return 'grand_final';
        if (s.includes('semi')) return 'semi_final';
        if (s.includes('quarter')) return 'quarter_final';
        if (s.includes('playoff') || s.includes('road') || s.includes('knockou')) return 'playoffs';
        if (s.includes('group') || s.includes('regular') || s.includes('league')) return 'group_stage';
        if (s.includes('qualifier') || s.includes('qualif')) return 'qualifier';
        return 'group_stage';
    }

    private inferRound(index: number, allMatches: any[]): number {
        const total = allMatches.length;
        // Single elimination: total matches = 2^n - 1
        // Round 1 has 2^(n-1) matches, etc.
        if (total <= 1) return 1;
        if (total <= 3) return index < 2 ? 1 : 2; // QF + SF pattern
        if (total <= 7) {
            if (index < 4) return 1;
            if (index < 6) return 2;
            return 3;
        }
        return Math.floor(index / Math.max(1, Math.floor(total / 3))) + 1;
    }

    private inferBracketSection(stageSlug: string, index: number, total: number): string {
        const s = stageSlug.toLowerCase();
        if (s.includes('lower') || s.includes('losers')) return 'lower';
        if (s.includes('upper') || s.includes('winners')) return 'upper';
        if (s.includes('grand')) return 'grand_final';
        return 'upper';
    }

    private getRoundLabel(round: number, totalRounds: number): string {
        const remaining = totalRounds - round + 1;
        if (remaining === 1) return 'Grande Final';
        if (remaining === 2) return 'Semifinal';
        if (remaining === 3) return 'Quartas de Final';
        return `Round ${round}`;
    }

    private getEntities(): Record<string, any> {
        return {
            EsportsTournamentEntity: Repository.getEntity('EsportsTournamentsEntity'),
            EsportsMatchEntity: Repository.getEntity('EsportsMatchesEntity'),
        };
    }
}

export interface BracketRound {
    roundNumber: number;
    label: string;
    matches: BracketMatch[];
}

export interface BracketMatch {
    id: string;
    externalId: string;
    team1: { name: string; logo: string; acronym: string; score: number; externalId: string };
    team2: { name: string; logo: string; acronym: string; score: number; externalId: string };
    status: string;
    winnerExternalId: string;
    nextMatchId: string;
    scheduledAt: string;
    numberOfGames: number;
    bracketSection: string;
}
