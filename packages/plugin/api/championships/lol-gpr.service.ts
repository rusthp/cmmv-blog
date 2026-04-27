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
        // The page embeds GPR data in an Apollo SSR transport script tag as JSON.
        // Extract all push() calls and find the one containing teamGPR array.
        const marker = 'Symbol.for("ApolloSSRDataTransport")';
        let searchFrom = 0;

        while (true) {
            const markerIdx = html.indexOf(marker, searchFrom);
            if (markerIdx === -1) break;

            const pushStart = html.indexOf('{', markerIdx);
            if (pushStart === -1) break;

            const scriptEnd = html.indexOf('</script>', pushStart);
            if (scriptEnd === -1) break;

            let jsonStr = html.slice(pushStart, scriptEnd).trimEnd();
            if (jsonStr.endsWith(');')) jsonStr = jsonStr.slice(0, -2);
            else if (jsonStr.endsWith(')')) jsonStr = jsonStr.slice(0, -1);

            try {
                const payload = JSON.parse(jsonStr);
                const events: any[] = payload?.events ?? [];
                for (const ev of events) {
                    const teamGprList: any[] = ev?.value?.data?.teamGPR;
                    if (Array.isArray(teamGprList) && teamGprList.length > 0) {
                        return this.mapTeamGprList(teamGprList);
                    }
                }
            } catch { /* malformed JSON block, try next */ }

            searchFrom = markerIdx + marker.length;
        }

        return [];
    }

    private mapTeamGprList(teamGprList: any[]): GprEntry[] {
        const entries: GprEntry[] = [];
        for (const item of teamGprList) {
            const entry = this.mapTeamGpr(item);
            if (entry) entries.push(entry);
        }
        entries.sort((a, b) => a.rank - b.rank);
        return entries;
    }

    private mapTeamGpr(item: any): GprEntry | null {
        const current = item?.currentTeamGPR;
        const previous = item?.previousTeamGPR;
        const team = item?.team;
        const matchRec = item?.teamMatchRecord;
        const gameRec = item?.teamGameRecord;

        if (!current || !team?.code) return null;

        const rank: number = current.rank;
        const prevRank: number = previous?.rank ?? rank;

        return {
            rank,
            rankDelta: prevRank - rank,
            teamName: team.name ?? '',
            teamCode: team.code ?? '',
            teamSlug: team.slug ?? '',
            logoUrl: (team.image ?? '').replace(/^http:\/\//, 'https://'),
            leagueName: team.homeLeague?.name ?? '',
            leagueSlug: team.homeLeague?.slug ?? '',
            gprScore: current.gprScore ?? 0,
            matchWins: matchRec?.wins ?? 0,
            matchLosses: matchRec?.losses ?? 0,
            gameWins: gameRec?.wins ?? 0,
            gameLosses: gameRec?.losses ?? 0,
            updatedAt: current.dateCalculated ?? '',
        };
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
