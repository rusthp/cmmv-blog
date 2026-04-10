import { Service, Logger, Cron } from '@cmmv/core';
import { Repository } from '@cmmv/repository';

const DRAFT5_BASE = 'https://draft5.gg';

@Service('blog_draft5')
export class Draft5Service {
    private static readonly logger = new Logger('Draft5Service');

    static log(msg: string) {
        try { Draft5Service.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { Draft5Service.logger.log(`[WARN] ${msg}`); } catch {}
    }

    @Cron('30 */4 * * *')
    async cronSync() {
        await this.syncAll();
    }

    async syncAll(): Promise<{ tournaments: number; matches: number }> {
        const stats = { tournaments: 0, matches: 0 };
        Draft5Service.log('[draft5] Starting sync...');

        try {
            const { EsportsTournamentEntity } = this.getEntities();
            if (!EsportsTournamentEntity) return stats;

            // Get ongoing/upcoming CS2 tournaments from our DB that came from pandascore
            const results = await Repository.findAll(EsportsTournamentEntity, {
                game: 'cs2',
                limit: '30',
            });

            const tournaments: any[] = results?.data || [];

            for (const tournament of tournaments) {
                if (!['ongoing', 'upcoming'].includes(tournament.status)) continue;
                try {
                    const synced = await this.syncTournamentBracket(tournament);
                    if (synced > 0) {
                        stats.tournaments++;
                        stats.matches += synced;
                    }
                } catch (e: any) {
                    Draft5Service.warn(`[draft5] Failed syncing ${tournament.slug}: ${e.message}`);
                }
            }
        } catch (e: any) {
            Draft5Service.warn(`[draft5] Sync error: ${e.message}`);
        }

        Draft5Service.log(`[draft5] Sync done: ${JSON.stringify(stats)}`);
        return stats;
    }

    async syncTournamentBracket(tournament: any): Promise<number> {
        // Search draft5.gg for this tournament by slug/name
        const slug = tournament.slug?.replace(/^cs2?-/, '');
        if (!slug) return 0;

        // Try to find the draft5 tournament page
        const searchUrl = `${DRAFT5_BASE}/campeonatos`;
        const html = await this.httpGet(searchUrl);
        if (!html) return 0;

        // Extract __NEXT_DATA__ from the page
        const nextData = this.extractNextData(html);
        if (!nextData) return 0;

        const championships: any[] = nextData?.props?.pageProps?.championships || [];
        const match = championships.find(
            (c: any) =>
                c.pandaScoreId === tournament.externalId ||
                c.slug?.toLowerCase().includes(slug.toLowerCase()) ||
                tournament.name?.toLowerCase().includes((c.nameShortened || c.name || '').toLowerCase())
        );

        if (!match) return 0;

        return await this.syncDraft5Tournament(match, tournament.slug);
    }

    async syncDraft5TournamentById(draft5Id: number, tournamentSlug: string): Promise<number> {
        const url = `${DRAFT5_BASE}/campeonatos/${draft5Id}`;
        const html = await this.httpGet(url);
        if (!html) return 0;

        const nextData = this.extractNextData(html);
        if (!nextData) return 0;

        const championship = nextData?.props?.pageProps?.championship;
        if (!championship) return 0;

        return await this.syncDraft5Tournament(championship, tournamentSlug);
    }

    private async syncDraft5Tournament(championship: any, tournamentSlug: string): Promise<number> {
        let total = 0;

        const stages: any[] = championship.stages || [];
        const bracketStages = stages.filter((s: any) =>
            s.substageType === 'Brackets' || s.stageType === 'bracket'
        );

        for (const stage of bracketStages) {
            const matches: any[] = stage.matches || [];

            // Build a map for next_match_id resolution
            const matchMap = new Map<number, any>();
            for (const m of matches) {
                matchMap.set(m.id, m);
            }

            for (let i = 0; i < matches.length; i++) {
                const m = matches[i];
                await this.upsertDraft5Match(m, tournamentSlug, stage, matches, i);
                total++;
            }
        }

        return total;
    }

    private async upsertDraft5Match(
        m: any,
        tournamentSlug: string,
        stage: any,
        allMatches: any[],
        index: number
    ): Promise<void> {
        const { EsportsMatchEntity } = this.getEntities();
        if (!EsportsMatchEntity) return;

        const externalId = `draft5-${m.id}`;
        const team1 = m.teamA || m.team1 || {};
        const team2 = m.teamB || m.team2 || {};

        const statusMap: Record<string, string> = {
            finished: 'finished',
            running: 'running',
            upcoming: 'not_started',
            not_started: 'not_started',
        };
        const status = statusMap[m.status] || 'not_started';

        // Determine winner
        let winnerExternalId = '';
        if (m.winner === 'teamA' || m.winner === 'team1') winnerExternalId = String(team1.id || '');
        else if (m.winner === 'teamB' || m.winner === 'team2') winnerExternalId = String(team2.id || '');

        // Round inference from previousMatchIds or position
        const prevIds: number[] = m.previousMatchIds || [];
        const roundNumber = prevIds.length === 0 ? 1 : this.inferRound(index, allMatches);

        // Find next match
        const nextMatch = allMatches.find(
            (other: any) => (other.previousMatchIds || []).includes(m.id)
        );

        const data: any = {
            externalId,
            game: 'cs2',
            tournamentExternalId: tournamentSlug,
            tournamentSlug,
            name: `${team1.name || 'TBA'} vs ${team2.name || 'TBA'}`,
            status,
            scheduledAt: m.startTime || m.scheduledAt || null,
            endedAt: status === 'finished' ? (m.endTime || m.startTime) : null,
            numberOfGames: m.format?.bestOf || m.numberOfGames || 1,
            phase: 'playoffs',
            team1ExternalId: String(team1.id || ''),
            team1Name: team1.name || 'TBA',
            team1Logo: team1.imageUrl || team1.image || '',
            team1Acronym: team1.tag || team1.acronym || '',
            team1Score: m.scoreA ?? m.score1 ?? 0,
            team2ExternalId: String(team2.id || ''),
            team2Name: team2.name || 'TBA',
            team2Logo: team2.imageUrl || team2.image || '',
            team2Acronym: team2.tag || team2.acronym || '',
            team2Score: m.scoreB ?? m.score2 ?? 0,
            winnerExternalId,
            streamUrl: '',
            roundNumber,
            nextMatchId: nextMatch ? `draft5-${nextMatch.id}` : '',
            bracketSection: this.inferBracketSection(stage.slug || stage.name || '', index, allMatches.length),
            dataSource: 'draft5',
        };

        const existing = await Repository.findOne(EsportsMatchEntity, { externalId });
        if (existing) {
            await Repository.update(EsportsMatchEntity, { id: (existing as any).id }, data);
        } else {
            await Repository.insert(EsportsMatchEntity, data);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private async httpGet(url: string): Promise<string | null> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                },
                signal: AbortSignal.timeout(20000),
            });
            if (!response.ok) return null;
            return await response.text();
        } catch {
            return null;
        }
    }

    private extractNextData(html: string): any {
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!match?.[1]) return null;
        try {
            return JSON.parse(match[1]);
        } catch {
            return null;
        }
    }

    private inferRound(index: number, allMatches: any[]): number {
        const total = allMatches.length;
        if (total <= 1) return 1;
        if (total <= 3) return index < 2 ? 1 : 2;
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

    private getEntities(): Record<string, any> {
        return {
            EsportsTournamentEntity: Repository.getEntity('EsportsTournamentsEntity'),
            EsportsMatchEntity: Repository.getEntity('EsportsMatchesEntity'),
        };
    }
}
