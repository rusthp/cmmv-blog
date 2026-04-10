import { Service, Logger, Cron } from '@cmmv/core';
import { Repository } from '@cmmv/repository';

const VLR_BASE = 'https://www.vlr.gg';

@Service('blog_vlr')
export class VlrService {
    private static readonly logger = new Logger('VlrService');

    static log(msg: string) {
        try { VlrService.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { VlrService.logger.log(`[WARN] ${msg}`); } catch {}
    }

    @Cron('15 */4 * * *')
    async cronSync() {
        await this.syncAll();
    }

    async syncAll(): Promise<{ tournaments: number; matches: number }> {
        const stats = { tournaments: 0, matches: 0 };
        VlrService.log('[vlr] Starting sync...');

        try {
            const { EsportsTournamentEntity } = this.getEntities();
            if (!EsportsTournamentEntity) return stats;

            const results = await Repository.findAll(EsportsTournamentEntity, {
                game: 'valorant',
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
                    VlrService.warn(`[vlr] Failed syncing ${tournament.slug}: ${e.message}`);
                }
            }
        } catch (e: any) {
            VlrService.warn(`[vlr] Sync error: ${e.message}`);
        }

        VlrService.log(`[vlr] Sync done: ${JSON.stringify(stats)}`);
        return stats;
    }

    async syncTournamentBracket(tournament: any): Promise<number> {
        // Search VLR.gg for this event
        const query = encodeURIComponent(tournament.name || '');
        const searchUrl = `${VLR_BASE}/search/?q=${query}&type=events`;
        const searchHtml = await this.httpGet(searchUrl);
        if (!searchHtml) return 0;

        // Find event link from search results
        const eventHref = this.extractFirstEventLink(searchHtml);
        if (!eventHref) return 0;

        const eventId = this.extractEventId(eventHref);
        if (!eventId) return 0;

        return await this.syncEventBracket(eventId, tournament.slug);
    }

    async syncEventBracketById(vlrEventId: string, tournamentSlug: string): Promise<number> {
        return await this.syncEventBracket(vlrEventId, tournamentSlug);
    }

    private async syncEventBracket(eventId: string, tournamentSlug: string): Promise<number> {
        const bracketUrl = `${VLR_BASE}/event/brackets/${eventId}`;
        const html = await this.httpGet(bracketUrl);
        if (!html) return 0;

        const matches = this.parseBracketHtml(html, tournamentSlug);
        if (matches.length === 0) return 0;

        for (const matchData of matches) {
            await this.upsertVlrMatch(matchData, tournamentSlug);
        }

        return matches.length;
    }

    private parseBracketHtml(html: string, tournamentSlug: string): any[] {
        const matches: any[] = [];

        // Extract bracket columns
        // VLR bracket HTML: <div class="bracket-col"> contains <div class="bracket-col-label"> and bracket items
        const colRegex = /<div[^>]*class="[^"]*bracket-col[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*bracket-col|<\/div>)/g;
        const itemRegex = /<div[^>]*class="[^"]*bracket-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*bracket-item|<\/div>)/g;

        // Use simpler regex to parse round labels and match items
        const roundLabelRegex = /class="bracket-col-label[^"]*"[^>]*>\s*([^<]+)\s*</g;
        const roundLabels: string[] = [];
        let labelMatch;
        while ((labelMatch = roundLabelRegex.exec(html)) !== null) {
            roundLabels.push(labelMatch[1].trim());
        }

        // Parse each bracket-item: teams, scores, result
        const bracketItemRegex = /class="bracket-item[^"]*"[^>]*>([\s\S]*?)(?=class="bracket-item|class="bracket-col(?!-label)|$)/g;
        let itemIndex = 0;
        let roundIndex = 0;
        let itemInRound = 0;

        // Count items per round by scanning for bracket-col structure
        const colHtml = html.split(/class="bracket-col[^"]*"/g);
        const roundMatchCounts: number[] = [];

        for (let i = 1; i < colHtml.length; i++) {
            const col = colHtml[i];
            const count = (col.match(/class="bracket-item/g) || []).length;
            roundMatchCounts.push(count);
        }

        // Parse all bracket items in order
        const allItemRegex = /class="bracket-item(?:-container)?[^"]*"[^>]*>([\s\S]*?)(?=class="bracket-item(?:-container)?|<\/div>\s*<\/div>\s*(?=<div[^>]*class="bracket-col))/g;

        let itemContent;
        const rawItems: string[] = [];

        // Simpler approach: split by bracket-item occurrences
        const itemSections = html.split('bracket-item');
        // Skip first (before any bracket-item), start from 1
        for (let idx = 1; idx < itemSections.length; idx++) {
            rawItems.push(itemSections[idx]);
        }

        let currentRound = 0;
        let processedInRound = 0;

        for (let idx = 0; idx < rawItems.length; idx++) {
            const raw = rawItems[idx];

            // Skip if this is just a class suffix, not an actual item open
            if (!raw.startsWith('"') && !raw.startsWith('-')) continue;

            // Advance round tracking
            if (roundMatchCounts.length > 0 && processedInRound >= roundMatchCounts[currentRound]) {
                currentRound++;
                processedInRound = 0;
            }

            const parsed = this.parseBracketItemSection(raw);
            if (parsed) {
                const externalId = `vlr-${tournamentSlug}-r${currentRound + 1}-m${processedInRound + 1}`;
                matches.push({
                    externalId,
                    roundNumber: currentRound + 1,
                    label: roundLabels[currentRound] || `Round ${currentRound + 1}`,
                    ...parsed,
                });
                processedInRound++;
            }
        }

        return matches;
    }

    private parseBracketItemSection(raw: string): {
        team1Name: string; team1Score: number; team1Logo: string;
        team2Name: string; team2Score: number; team2Logo: string;
        status: string; winnerTeam: number;
    } | null {
        // Extract team names
        const teamNameRegex = /class="bracket-item-team-name[^"]*"[^>]*>\s*([^<\n]+?)\s*</g;
        const teamNames: string[] = [];
        let m;
        while ((m = teamNameRegex.exec(raw)) !== null) {
            const name = m[1].trim();
            if (name) teamNames.push(name);
        }

        if (teamNames.length < 2) return null;

        // Extract scores
        const scoreRegex = /class="bracket-item-team-score[^"]*"[^>]*>\s*(\d+|-|–)\s*</g;
        const scores: number[] = [];
        while ((m = scoreRegex.exec(raw)) !== null) {
            const s = m[1].trim();
            scores.push(s === '-' || s === '–' ? 0 : parseInt(s, 10));
        }

        // Extract logos
        const logoRegex = /class="bracket-item-team-logo[^"]*"[\s\S]*?src="([^"]+)"/g;
        const logos: string[] = [];
        while ((m = logoRegex.exec(raw)) !== null) {
            logos.push(m[1]);
        }

        // Determine winner
        const winnerRegex = /bracket-item-team\s+mod-win/;
        let winnerTeam = 0;
        const winRegex = /bracket-item-team\s+mod-win/g;
        const winMatches = raw.match(winRegex);
        if (winMatches && winMatches.length > 0) {
            // First team win?
            const firstTeamIdx = raw.indexOf('bracket-item-team');
            const firstWinIdx = raw.indexOf('bracket-item-team mod-win');
            winnerTeam = firstTeamIdx === firstWinIdx ? 1 : 2;
        }

        // Status: if scores exist and one team won → finished, else not_started
        const hasScores = scores.some(s => s > 0);
        const status = winnerTeam > 0 ? 'finished' : (hasScores ? 'running' : 'not_started');

        return {
            team1Name: teamNames[0] || 'TBA',
            team1Score: scores[0] ?? 0,
            team1Logo: logos[0] ? `${VLR_BASE}${logos[0]}` : '',
            team2Name: teamNames[1] || 'TBA',
            team2Score: scores[1] ?? 0,
            team2Logo: logos[1] ? `${VLR_BASE}${logos[1]}` : '',
            status,
            winnerTeam,
        };
    }

    private async upsertVlrMatch(matchData: any, tournamentSlug: string): Promise<void> {
        const { EsportsMatchEntity } = this.getEntities();
        if (!EsportsMatchEntity) return;

        const winnerExternalId = matchData.winnerTeam === 1
            ? matchData.externalId + '-t1'
            : matchData.winnerTeam === 2
                ? matchData.externalId + '-t2'
                : '';

        const data: any = {
            externalId: matchData.externalId,
            game: 'valorant',
            tournamentExternalId: tournamentSlug,
            tournamentSlug,
            name: `${matchData.team1Name} vs ${matchData.team2Name}`,
            status: matchData.status,
            scheduledAt: null,
            endedAt: matchData.status === 'finished' ? new Date().toISOString() : null,
            numberOfGames: 1,
            phase: 'playoffs',
            team1ExternalId: matchData.externalId + '-t1',
            team1Name: matchData.team1Name,
            team1Logo: matchData.team1Logo,
            team1Acronym: '',
            team1Score: matchData.team1Score,
            team2ExternalId: matchData.externalId + '-t2',
            team2Name: matchData.team2Name,
            team2Logo: matchData.team2Logo,
            team2Acronym: '',
            team2Score: matchData.team2Score,
            winnerExternalId,
            streamUrl: '',
            roundNumber: matchData.roundNumber,
            nextMatchId: '',
            bracketSection: 'upper',
            dataSource: 'vlr',
        };

        const existing = await Repository.findOne(EsportsMatchEntity, { externalId: matchData.externalId });
        if (existing) {
            await Repository.update(EsportsMatchEntity, { id: (existing as any).id }, data);
        } else {
            await Repository.insert(EsportsMatchEntity, data);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private extractFirstEventLink(html: string): string | null {
        const regex = /href="(\/event\/[^"]+)"/;
        const m = html.match(regex);
        return m?.[1] || null;
    }

    private extractEventId(href: string): string | null {
        // /event/brackets/1234/event-name → 1234
        // /event/1234/event-name → 1234
        const m = href.match(/\/event(?:\/brackets)?\/(\d+)/);
        return m?.[1] || null;
    }

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

    private getEntities(): Record<string, any> {
        return {
            EsportsTournamentEntity: Repository.getEntity('EsportsTournamentsEntity'),
            EsportsMatchEntity: Repository.getEntity('EsportsMatchesEntity'),
        };
    }
}
