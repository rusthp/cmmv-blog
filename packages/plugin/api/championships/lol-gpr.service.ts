import { Service, Logger, Cron } from '@cmmv/core';

const GPR_URL = 'https://lolesports.com/pt-BR/gpr/2026/current';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

export interface GprEntry {
    rank: number;
    rankDelta: number;
    teamName: string;
    teamCode: string;
    teamSlug: string;
    logoUrl: string;
    leagueName: string;
    leagueSlug: string;
    gprScore: number;
    matchWins: number;
    matchLosses: number;
    gameWins: number;
    gameLosses: number;
    updatedAt: string;
}

@Service('blog_lol_gpr')
export class LolGprService {
    private static readonly logger = new Logger('LolGprService');
    private static cache: GprEntry[] | null = null;
    private static cacheTime = 0;

    static log(msg: string) {
        try { LolGprService.logger.log(msg); } catch {}
    }

    @Cron('0 */6 * * *')
    async cronRefresh() {
        await this.fetchAndParse(true);
    }

    async getGpr(): Promise<GprEntry[]> {
        const now = Date.now();
        if (LolGprService.cache && now - LolGprService.cacheTime < CACHE_TTL_MS) {
            return LolGprService.cache;
        }
        return this.fetchAndParse(false);
    }

    private async fetchAndParse(force: boolean): Promise<GprEntry[]> {
        try {
            const html = await this.httpGet(GPR_URL);
            if (!html) return LolGprService.cache || [];

            const entries = this.parse(html);
            if (entries.length > 0) {
                LolGprService.cache = entries;
                LolGprService.cacheTime = Date.now();
                LolGprService.log(`[lol-gpr] Parsed ${entries.length} entries`);
            }
            return entries.length > 0 ? entries : (LolGprService.cache || []);
        } catch (e: any) {
            LolGprService.log(`[lol-gpr] fetch failed: ${e.message}`);
            return LolGprService.cache || [];
        }
    }

    private parse(html: string): GprEntry[] {
        const entries: GprEntry[] = [];
        const seen = new Set<string>();

        // Each TeamGPR block is anchored by "averageOpponentGPR"
        // We scan all occurrences and extract the bounded block around each
        let searchFrom = 0;
        while (true) {
            const anchorIdx = html.indexOf('"averageOpponentGPR":', searchFrom);
            if (anchorIdx === -1) break;

            // Take a window of 4000 chars around the anchor to find all fields
            const blockStart = Math.max(0, anchorIdx - 100);
            const block = html.slice(blockStart, anchorIdx + 4000);

            const entry = this.parseBlock(block);
            if (entry && !seen.has(entry.teamSlug)) {
                seen.add(entry.teamSlug);
                entries.push(entry);
            }

            searchFrom = anchorIdx + 20;
        }

        // Sort by rank ascending
        entries.sort((a, b) => a.rank - b.rank);
        return entries;
    }

    private parseBlock(block: string): GprEntry | null {
        try {
            // teamMatchRecord wins/losses
            const matchRecord = block.match(/"teamMatchRecord":\{"__typename":"WinLoss","wins":(\d+),"losses":(\d+)\}/);
            if (!matchRecord) return null;
            const matchWins = parseInt(matchRecord[1]);
            const matchLosses = parseInt(matchRecord[2]);

            // teamGameRecord wins/losses
            const gameRecord = block.match(/"teamGameRecord":\{"__typename":"WinLoss","wins":(\d+),"losses":(\d+)\}/);
            const gameWins = gameRecord ? parseInt(gameRecord[1]) : 0;
            const gameLosses = gameRecord ? parseInt(gameRecord[2]) : 0;

            // currentTeamGPR
            const currentGpr = block.match(/"currentTeamGPR":\{"__typename":"GPR","gprScore":(\d+),"elo":\d+,"rank":(\d+),"dateCalculated":"([^"]+)"/);
            if (!currentGpr) return null;
            const gprScore = parseInt(currentGpr[1]);
            const rank = parseInt(currentGpr[2]);
            const updatedAt = currentGpr[3];

            // previousTeamGPR rank for delta
            const prevGpr = block.match(/"previousTeamGPR":\{"__typename":"GPR","gprScore":\d+,"elo":\d+,"rank":(\d+)/);
            const prevRank = prevGpr ? parseInt(prevGpr[1]) : rank;
            const rankDelta = prevRank - rank; // positive = moved up

            // Find the real team object — tournament standings embed minimal team entries
            // with no "code" field. Real teams always have "code":"ABC" (uppercase letters/digits).
            let teamBlockStart = -1;
            let teamSearch = 0;
            while (true) {
                const idx = block.indexOf('"team":{"__typename":"Team"', teamSearch);
                if (idx === -1) break;
                const candidate = block.slice(idx, idx + 1200);
                if (/"code":"[A-Z0-9]/.test(candidate)) {
                    teamBlockStart = idx;
                    break;
                }
                teamSearch = idx + 1;
            }
            if (teamBlockStart === -1) return null;
            const teamBlock = block.slice(teamBlockStart, teamBlockStart + 1200);

            const nameMatch = teamBlock.match(/"name":"([^"]+)"/);
            const codeMatch = teamBlock.match(/"code":"([^"]+)"/);
            const slugMatch = teamBlock.match(/"slug":"([^"]+)"/);
            const imageMatch = teamBlock.match(/"image":"(http[^"]+\/teams\/[^"]+)"/);
            const leagueNameMatch = teamBlock.match(/"homeLeague":\{[^}]*"name":"([^"]+)"/);
            const leagueSlugMatch = teamBlock.match(/"homeLeague":\{[^}]*"slug":"([^"]+)"/);

            if (!nameMatch || !codeMatch || !slugMatch) return null;

            return {
                rank,
                rankDelta,
                teamName: nameMatch[1],
                teamCode: codeMatch?.[1] || '',
                teamSlug: slugMatch[1],
                logoUrl: imageMatch?.[1] || '',
                leagueName: leagueNameMatch?.[1] || '',
                leagueSlug: leagueSlugMatch?.[1] || '',
                gprScore,
                matchWins,
                matchLosses,
                gameWins,
                gameLosses,
                updatedAt,
            };
        } catch {
            return null;
        }
    }

    private async httpGet(url: string): Promise<string | null> {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                },
                signal: AbortSignal.timeout(30000),
            });
            if (!res.ok) return null;
            return await res.text();
        } catch {
            return null;
        }
    }
}
