import { Service, Logger, Cron } from '@cmmv/core';
import { Repository } from '@cmmv/repository';
import { mergeTournaments, mergeExternalIds, isSameTournament, TournamentData } from './tournament-merger.utils';

const LIQUIPEDIA_BASE = 'https://liquipedia.net';
const USER_AGENT = 'cmmv-blog/1.0 (allyfreitas11@gmail.com)';
const REQUEST_DELAY_MS = 1200; // Liquipedia ToU: 1 req/s

const GAME_WIKI: Record<string, string> = {
    csgo: 'counterstrike',
    dota2: 'dota2',
    lol: 'leagueoflegends',
    valorant: 'valorant',
    r6siege: 'rainbowsix',
};

const MONTHS: Record<string, string> = {
    January: '01', February: '02', March: '03', April: '04',
    May: '05', June: '06', July: '07', August: '08',
    September: '09', October: '10', November: '11', December: '12',
    // Abbreviated forms used in Liquipedia HTML tables
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

const SUPPORTED_GAMES = ['csgo', 'dota2', 'lol', 'valorant'];

@Service('blog_liquipedia')
export class LiquipediaService {
    private static readonly logger = new Logger('LiquipediaService');

    static log(msg: string) {
        try { LiquipediaService.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { LiquipediaService.logger.log(`[WARN] ${msg}`); } catch {}
    }

    @Cron('0 */4 * * *')
    async cronSync() {
        LiquipediaService.log('[liquipedia] Starting scheduled sync...');
        for (const game of SUPPORTED_GAMES) {
            await this.syncTournaments(game);
            await this.sleep(REQUEST_DELAY_MS);
        }
    }

    async syncTournaments(game: string): Promise<number> {
        const wiki = GAME_WIKI[game];
        if (!wiki) return 0;

        LiquipediaService.log(`[liquipedia] Syncing tournaments for ${game} (wiki: ${wiki})`);

        let html: string;
        try {
            html = await this.fetchWikiPage(wiki, 'Portal:Tournaments');
        } catch (e: any) {
            LiquipediaService.warn(`[liquipedia] Failed to fetch Portal:Tournaments for ${wiki}: ${e.message}`);
            return 0;
        }

        const rows = this.parseTournamentRows(html, game);
        LiquipediaService.log(`[liquipedia] Parsed ${rows.length} tournament rows for ${game}`);

        let upserted = 0;
        const { EsportsTournamentEntity } = this.getEntities();
        if (!EsportsTournamentEntity) return 0;

        for (const row of rows) {
            try {
                await this.upsertTournament(EsportsTournamentEntity, row, game);
                upserted++;
            } catch (e: any) {
                LiquipediaService.warn(`[liquipedia] Failed to upsert ${row.name}: ${e.message}`);
            }
        }

        LiquipediaService.log(`[liquipedia] Upserted ${upserted} tournaments for ${game}`);
        return upserted;
    }

    async syncMatches(tournamentSlug: string, game: string): Promise<number> {
        const wiki = GAME_WIKI[game];
        if (!wiki) return 0;

        LiquipediaService.log(`[liquipedia] Syncing matches for ${tournamentSlug}`);

        let html: string;
        try {
            html = await this.fetchWikiPage(wiki, tournamentSlug);
        } catch (e: any) {
            LiquipediaService.warn(`[liquipedia] Failed to fetch tournament page ${tournamentSlug}: ${e.message}`);
            return 0;
        }

        const matches = this.parseMatchRows(html, tournamentSlug, game);
        LiquipediaService.log(`[liquipedia] Parsed ${matches.length} matches for ${tournamentSlug}`);

        let upserted = 0;
        const { EsportsMatchEntity } = this.getEntities();
        if (!EsportsMatchEntity) return 0;

        for (const match of matches) {
            try {
                const existing = await Repository.findOne(EsportsMatchEntity, { externalId: match.externalId });
                if (existing) {
                    await Repository.update(EsportsMatchEntity, { id: (existing as any).id }, match);
                } else {
                    await Repository.insert(EsportsMatchEntity, match);
                }
                upserted++;
            } catch (e: any) {
                LiquipediaService.warn(`[liquipedia] Failed to upsert match ${match.externalId}: ${e.message}`);
            }
        }

        return upserted;
    }

    // ─── Parsing ─────────────────────────────────────────────────

    private parseTournamentRows(html: string, game: string): TournamentData[] {
        const results: TournamentData[] = [];
        // Find all table body rows
        const rowRegex = /<tr[^>]*class="[^"]*table2__row--body[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
        let m: RegExpExecArray | null;

        while ((m = rowRegex.exec(html)) !== null) {
            const row = m[1];
            const data = this.parseTableRow(row, game);
            if (data) results.push(data);
        }

        return results;
    }

    private parseTableRow(row: string, game: string): TournamentData | null {
        // Extract tournament name and slug from column__tournament cell or data-sort-value
        const nameMatch = row.match(/class="column__tournament"[^>]*>[\s\S]*?href="\/[^/]+\/([^"]+)"[^>]*>([^<]+)/);
        if (!nameMatch) return null;

        const pagePath = nameMatch[1].replace(/&amp;/g, '&');
        const name = nameMatch[2].trim();
        if (!name || name.length < 2) return null;

        // Slug: normalize page path
        const slug = pagePath.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Dates: "Apr 29 – May 03, 2026" or "May 09–17, 2026" or "Dec 28, 2025 – Jan 04, 2026"
        const dateCell = row.match(/data-nowrap="">([A-Z][a-z]{2,8}\s[\s\S]*?\d{4})</);
        const { startDate, endDate } = dateCell ? this.parseDateRange(dateCell[1]) : { startDate: null, endDate: null };

        // Prize pool
        const prizeMatch = row.match(/data-align="right"[^>]*data-nowrap="">\$([0-9,]+)/);
        const prizePool = prizeMatch ? `$${prizeMatch[1]}` : '';

        // Location: city from flag cell
        const locationMatch = row.match(/title="([^"]+)"[^>]*><\/a><\/span>&#160;([^<]+)<\/span>/);
        const location = locationMatch ? locationMatch[2].trim() : '';

        // Number of teams
        const teamsMatch = row.match(/data-align="right"[^>]*data-nowrap="">(\d+)<\/td>/);
        const numberOfTeams = teamsMatch ? parseInt(teamsMatch[1], 10) : 0;

        // Tier from first cell href
        const tierMatch = row.match(/href="\/[^/]+\/([SA])-Tier_Tournaments"/i);
        const tier = tierMatch ? tierMatch[1].toLowerCase() : 'b';

        // Logo URL — stored via /liquipedia-images/ proxy to avoid Liquipedia hotlink block
        const logoMatch = row.match(/class="league-icon-small-image[\s\S]*?src="([^"]+)"/);
        const logoUrl = logoMatch ? `/liquipedia-images${logoMatch[1].replace('/commons/images', '')}` : '';

        const externalId = `liq_${slug}`;

        // Determine status from dates
        const now = Date.now();
        const start = startDate ? new Date(startDate).getTime() : null;
        const end = endDate ? new Date(endDate).getTime() : null;
        let status = 'upcoming';
        if (start && end) {
            if (now > end) status = 'finished';
            else if (now >= start) status = 'ongoing';
        }

        return {
            externalId,
            externalIds: JSON.stringify([{ source: 'liquipedia', id: pagePath }]),
            dataSource: 'liquipedia',
            game,
            name,
            slug,
            status,
            startDate,
            endDate,
            prizePool,
            location,
            online: false,
            tier,
            logoUrl,
            bannerUrl: logoUrl,
            leagueName: '',
            serieName: name,
            numberOfTeams,
            featured: tier === 's' || tier === 'a',
        };
    }

    private parseMatchRows(html: string, tournamentSlug: string, game: string): any[] {
        const results: any[] = [];

        // Find round headers and their following matches
        const roundHeaderRegex = /<div class="brkts-matchlist-header"[^>]*>([\s\S]*?)<\/div>([\s\S]*?)(?=<div class="brkts-matchlist-header"|<\/div>\s*<\/div>\s*<\/div>)/g;
        let roundNum = 0;
        let rh: RegExpExecArray | null;

        while ((rh = roundHeaderRegex.exec(html)) !== null) {
            roundNum++;
            const roundName = rh[1].replace(/<[^>]+>/g, '').trim();
            const roundBlock = rh[2];

            const matchRegex = /<div class="brkts-matchlist-match[^"]*">([\s\S]*?)(?=<div class="brkts-matchlist-match|$)/g;
            let mm: RegExpExecArray | null;

            while ((mm = matchRegex.exec(roundBlock)) !== null) {
                const matchHtml = mm[1];
                const match = this.parseSingleMatch(matchHtml, tournamentSlug, game, roundNum, roundName);
                if (match) results.push(match);
            }
        }

        return results;
    }

    private parseSingleMatch(html: string, tournamentSlug: string, game: string, roundNum: number, roundName: string): any | null {
        // Extract opponents via aria-label on brkts-matchlist-opponent
        const opponentRegex = /class="brkts-matchlist-(?:cell )?brkts-matchlist-opponent([^"]*)"[^>]*aria-label="([^"]+)"/g;
        const opponents: Array<{ name: string; isWinner: boolean }> = [];
        let om: RegExpExecArray | null;
        while ((om = opponentRegex.exec(html)) !== null) {
            opponents.push({
                name: om[2].trim(),
                isWinner: om[1].includes('slot-winner'),
            });
        }
        if (opponents.length < 2) return null;

        const team1 = opponents[0];
        const team2 = opponents[1];

        // Extract scores from brkts-matchlist-score cells
        const scoreRegex = /<div class="brkts-matchlist-cell brkts-matchlist-score[^"]*"[^>]*>\s*<div class="brkts-matchlist-cell-content">(\d+)<\/div>/g;
        const scores: number[] = [];
        let sm: RegExpExecArray | null;
        while ((sm = scoreRegex.exec(html)) !== null) {
            scores.push(parseInt(sm[1], 10));
        }
        const score1 = scores[0] ?? 0;
        const score2 = scores[1] ?? 0;

        // Extract timestamp
        const tsMatch = html.match(/data-timestamp="(\d+)"/);
        const timestamp = tsMatch ? parseInt(tsMatch[1], 10) : null;
        const scheduledAt = timestamp ? new Date(timestamp * 1000).toISOString() : null;

        // Status
        const isFinished = html.includes('data-finished="finished"');
        const status = isFinished ? 'finished' : (timestamp && timestamp * 1000 < Date.now() ? 'running' : 'not_started');

        const team1Id = `liq_${team1.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const team2Id = `liq_${team2.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const externalId = `liq_${tournamentSlug}_r${roundNum}_${team1Id}_${team2Id}`;

        // Phase from round name
        let phase = 'group_stage';
        const rn = roundName.toLowerCase();
        if (rn.includes('final') && rn.includes('grand')) phase = 'grand_final';
        else if (rn.includes('final') || rn.includes('playoff') || rn.includes('semi')) phase = 'playoffs';
        else if (rn.includes('qualifier')) phase = 'qualifier';

        return {
            externalId,
            game,
            tournamentExternalId: `liq_${tournamentSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            tournamentSlug,
            name: `${team1.name} vs ${team2.name}`,
            status,
            scheduledAt,
            numberOfGames: Math.max(score1 + score2, 1),
            phase,
            team1ExternalId: team1Id,
            team1Name: team1.name,
            team1Score: score1,
            team2ExternalId: team2Id,
            team2Name: team2.name,
            team2Score: score2,
            winnerExternalId: team1.isWinner ? team1Id : (team2.isWinner ? team2Id : null),
            roundNumber: roundNum,
            dataSource: 'liquipedia',
        };
    }

    // ─── Date Parsing ─────────────────────────────────────────────

    private parseDateRange(raw: string): { startDate: string | null; endDate: string | null } {
        // Strip HTML tags
        const text = raw.replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').trim();

        // Patterns:
        // "May 09–17, 2026"
        // "May 09 – June 02, 2026"
        // "December 28, 2025 – January 04, 2026"

        const sep = text.includes('–') ? '–' : '-';
        const parts = text.split(sep).map(p => p.trim());

        const yearMatch = text.match(/(\d{4})$/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

        let startDate: string | null = null;
        let endDate: string | null = null;

        if (parts.length === 1) {
            startDate = this.parseDate(parts[0], year);
            endDate = startDate;
        } else if (parts.length === 2) {
            const endPart = parts[1].trim();
            endDate = this.parseDate(endPart, year);

            // If start part has no month, inherit from end
            const startPart = parts[0].trim();
            if (/^\d{1,2}$/.test(startPart)) {
                const endDateObj = endDate ? new Date(endDate) : null;
                if (endDateObj) {
                    const mm = String(endDateObj.getMonth() + 1).padStart(2, '0');
                    const yr = String(endDateObj.getFullYear());
                    startDate = `${yr}-${mm}-${startPart.padStart(2, '0')}`;
                }
            } else {
                startDate = this.parseDate(startPart, year);
            }
        }

        return { startDate, endDate };
    }

    private parseDate(text: string, fallbackYear: string): string | null {
        // "May 09, 2026" or "May 09" or "09" or "December 28, 2025"
        text = text.replace(/,/g, '').trim();
        const parts = text.split(/\s+/);

        let month: string | undefined;
        let day: string | undefined;
        let year = fallbackYear;

        for (const p of parts) {
            if (MONTHS[p]) month = MONTHS[p];
            else if (/^\d{4}$/.test(p)) year = p;
            else if (/^\d{1,2}$/.test(p)) day = p.padStart(2, '0');
        }

        if (!month || !day) return null;
        return `${year}-${month}-${day}`;
    }

    // ─── HTTP ──────────────────────────────────────────────────────

    private async fetchWikiPage(wiki: string, page: string): Promise<string> {
        const url = `${LIQUIPEDIA_BASE}/${wiki}/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Encoding': 'gzip',
                'Accept': 'application/json',
            },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

        const data: any = await res.json();
        if (data.error) throw new Error(`Liquipedia API error: ${data.error.info || JSON.stringify(data.error)}`);

        const html = data.parse?.text?.['*'] || '';
        // Liquipedia encodes underscores in CSS class names as &#95; — decode before parsing
        return html.replace(/&#95;/g, '_');
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─── DB ────────────────────────────────────────────────────────

    private async upsertTournament(entity: any, incoming: TournamentData, game: string): Promise<void> {
        // Look up by externalId first (Liquipedia ID)
        let existing = await Repository.findOne(entity, { externalId: incoming.externalId });

        // Fallback: search by slug
        if (!existing && incoming.slug) {
            existing = await Repository.findOne(entity, { slug: incoming.slug } as any);
        }

        // Fallback: search by game+name if no slug match
        if (!existing && incoming.name) {
            const candidates = await Repository.findAll(entity, {
                game,
                name: incoming.name,
                limit: '3',
            });
            const list: any[] = candidates?.data || [];
            existing = list.find(t => isSameTournament(t, incoming)) || null;
        }

        if (existing) {
            // Same-source re-sync: overwrite directly (no trust check needed).
            // Detect by externalId prefix since dataSource column may not be in entity schema yet.
            const isSameSource = String((existing as any).externalId || '').startsWith('liq_');
            const update = isSameSource
                ? incoming
                : mergeTournaments(existing as TournamentData, incoming, 'liquipedia');
            await Repository.update(entity, { id: (existing as any).id }, update);
        } else {
            await Repository.insert(entity, incoming);
        }
    }

    private getEntities(): Record<string, any> {
        return {
            EsportsTournamentEntity: Repository.getEntity('EsportsTournamentsEntity'),
            EsportsMatchEntity: Repository.getEntity('EsportsMatchesEntity'),
        };
    }
}
