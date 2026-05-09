import { Service, Logger, Cron } from '@cmmv/core';
import { Repository } from '@cmmv/repository';
import { mergeExternalIds } from './tournament-merger.utils';

const HLTV_RSS_URL = 'https://www.hltv.org/rss/news';
const HLTV_UA = 'RSS/1.0 cmmv-blog/1.0 (allyfreitas11@gmail.com)';

// Match result verbs — "Team A VERB Team B" patterns
const WIN_VERBS = /\b(beat|defeat(?:ed)?|eliminate(?:d)?|move(?:d)? past|advance(?:d)? over|outclass(?:ed)?|oust(?:ed)?|knock(?:ed)? out|def\.|overpower(?:ed)?|crush(?:ed)?|outlast(?:ed)?|topped?)\b/i;

// Tournament name patterns to normalize to DB slugs
// Key: regex to match news title/description, value: tournament name keywords
const TOURNAMENT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /PGL\s+Astana\s*2026/i, name: 'PGL Astana 2026' },
    { pattern: /PGL\s+Cluj\s*2026/i, name: 'PGL Cluj 2026' },
    { pattern: /PGL\s+Bucharest\s*2026/i, name: 'PGL Bucharest 2026' },
    { pattern: /IEM\s+Cologne\s*2026/i, name: 'IEM Cologne 2026' },
    { pattern: /IEM\s+Krak[oó]w\s*2026/i, name: 'IEM Kraków 2026' },
    { pattern: /IEM\s+(?:Rio|Brazil)\s*2026/i, name: 'IEM Rio 2026' },
    { pattern: /IEM\s+Atlanta\s*2026/i, name: 'IEM Atlanta 2026' },
    { pattern: /BLAST\s+Open\s*2026/i, name: 'BLAST Open 2026' },
    { pattern: /BLAST\s+Bounty\s*2026/i, name: 'BLAST Bounty 2026' },
    { pattern: /BLAST\s+Rivals\s*2026/i, name: 'BLAST Rivals 2026' },
    { pattern: /ESL\s+Pro\s+League.*?2026/i, name: 'ESL Pro League 2026' },
];

interface RssItem {
    title: string;
    description: string;
    link: string;
    guid: string;
    pubDate: string;
    imageUrl: string;
}

@Service('blog_hltv')
export class HltvService {
    private static readonly logger = new Logger('HltvService');

    static log(msg: string) {
        try { HltvService.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { HltvService.logger.log(`[WARN] ${msg}`); } catch {}
    }

    @Cron('0 */6 * * *')
    async cronSync() {
        HltvService.log('[hltv] Starting RSS sync...');
        await this.syncFromRss();
    }

    async syncFromRss(): Promise<{ tournaments: number; matches: number }> {
        const stats = { tournaments: 0, matches: 0 };

        let rssXml: string;
        try {
            rssXml = await this.fetchRss();
        } catch (e: any) {
            HltvService.warn(`[hltv] RSS fetch failed: ${e.message}`);
            return stats;
        }

        const items = this.parseRss(rssXml);
        HltvService.log(`[hltv] Parsed ${items.length} RSS items`);

        const { EsportsTournamentEntity, EsportsMatchEntity } = this.getEntities();
        if (!EsportsTournamentEntity) return stats;

        // Process each news item
        for (const item of items) {
            const tournamentName = this.detectTournament(item.title + ' ' + item.description);
            if (!tournamentName) continue;

            // Find tournament in DB by name keywords
            const tournament = await this.findTournamentByName(EsportsTournamentEntity, tournamentName);
            if (tournament) {
                // Mark tournament as ongoing if recent news about it
                const pubDate = new Date(item.pubDate);
                const hoursAgo = (Date.now() - pubDate.getTime()) / 3600_000;
                if (hoursAgo < 48 && (tournament as any).status === 'upcoming') {
                    await Repository.update(
                        EsportsTournamentEntity,
                        { id: (tournament as any).id },
                        { status: 'ongoing' }
                    );
                    stats.tournaments++;
                    HltvService.log(`[hltv] Marked ${tournamentName} as ongoing from RSS news`);
                }
            }

            // Extract match result from title
            if (EsportsMatchEntity) {
                const matchResult = this.extractMatchResult(item.title, tournamentName, item);
                if (matchResult) {
                    const existing = await Repository.findOne(EsportsMatchEntity, { externalId: matchResult.externalId });
                    if (!existing) {
                        await Repository.insert(EsportsMatchEntity, matchResult);
                        stats.matches++;
                    }
                }
            }
        }

        HltvService.log(`[hltv] RSS sync complete: ${stats.tournaments} tournament updates, ${stats.matches} new matches`);
        return stats;
    }

    // ─── Parsing ─────────────────────────────────────────────────

    private parseRss(xml: string): RssItem[] {
        const items: RssItem[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let m: RegExpExecArray | null;

        while ((m = itemRegex.exec(xml)) !== null) {
            const block = m[1];
            const title = this.extractXml(block, 'title');
            const description = this.extractXml(block, 'description');
            const link = this.extractXml(block, 'link');
            const guid = this.extractXml(block, 'guid');
            const pubDate = this.extractXml(block, 'pubDate');
            const imageMatch = block.match(/media:content url="([^"]*)"/);
            const imageUrl = imageMatch ? imageMatch[1] : '';

            if (title && link) {
                items.push({ title, description, link, guid, pubDate, imageUrl });
            }
        }

        return items;
    }

    private extractXml(xml: string, tag: string): string {
        const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}(?:\\s[^>]*)?>([^<]*)<\\/${tag}>`));
        if (!m) return '';
        return (m[1] || m[2] || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    }

    private detectTournament(text: string): string | null {
        for (const { pattern, name } of TOURNAMENT_PATTERNS) {
            if (pattern.test(text)) return name;
        }

        // Generic detection: "Astana" alone in context of CS news
        if (/\bAstana\b/i.test(text)) return 'PGL Astana 2026';
        if (/\bCologne\b.*\b2026\b/i.test(text)) return 'IEM Cologne 2026';

        return null;
    }

    private extractMatchResult(title: string, tournamentName: string, item: RssItem): any | null {
        // Pattern: "TEAM_A VERB TEAM_B" — extract winner and loser
        // Example: "Falcons move past K27 on karrigan's debut"
        // Example: "MOUZ debut with narrow win over Gentle Mates"

        const verbMatch = title.match(WIN_VERBS);
        if (!verbMatch) return null;

        const verbIndex = verbMatch.index!;

        // Team before verb
        const beforeVerb = title.substring(0, verbIndex).trim();
        // Team after verb (up to common separators like "on", "after", "as", "in", ":")
        const afterVerbFull = title.substring(verbIndex + verbMatch[0].length).trim();
        const afterVerb = afterVerbFull.split(/\s+(?:on|after|as|in|to|over|at|with|with a|for|;|,)\s+/i)[0].trim();

        if (!beforeVerb || !afterVerb || beforeVerb.length > 60 || afterVerb.length > 60) return null;

        // Normalize team names
        const team1Name = beforeVerb.replace(/^(The |A )/i, '').trim();
        const team2Name = afterVerb.replace(/^(The |A )/i, '').trim();

        if (team1Name.length < 2 || team2Name.length < 2) return null;

        const team1Id = `hltv_${team1Name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const team2Id = `hltv_${team2Name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const tournamentSlug = tournamentName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const pubTs = new Date(item.pubDate).getTime();

        const externalId = `hltv_${item.guid.replace(/[^a-z0-9]/gi, '_')}_${team1Id}_vs_${team2Id}`;

        return {
            externalId,
            game: 'csgo',
            tournamentExternalId: `liq_${tournamentSlug}`,
            tournamentSlug,
            name: `${team1Name} vs ${team2Name}`,
            status: 'finished',
            scheduledAt: new Date(item.pubDate).toISOString(),
            endedAt: new Date(item.pubDate).toISOString(),
            numberOfGames: 2,
            phase: 'group_stage',
            team1ExternalId: team1Id,
            team1Name,
            team1Score: 2,
            team2ExternalId: team2Id,
            team2Name,
            team2Score: 0,
            winnerExternalId: team1Id,
            dataSource: 'hltv',
        };
    }

    // ─── DB lookup ────────────────────────────────────────────────

    private async findTournamentByName(entity: any, name: string): Promise<any | null> {
        // Try exact name first
        const exact = await Repository.findOne(entity, { name });
        if (exact) return exact;

        // Search by year keywords
        const yearMatch = name.match(/\d{4}/);
        if (!yearMatch) return null;

        const allRecent = await Repository.findAll(entity, {
            game: 'csgo',
            limit: '50',
            sortBy: 'startDate',
            sort: 'DESC',
        });
        const list: any[] = allRecent?.data || [];

        const lowerName = name.toLowerCase();
        return list.find(t => {
            const tName = ((t as any).name || '').toLowerCase();
            const keywords = lowerName.split(/\s+/).filter(k => k.length > 2);
            return keywords.filter(k => tName.includes(k)).length >= 2;
        }) || null;
    }

    // ─── HTTP ──────────────────────────────────────────────────────

    private async fetchRss(): Promise<string> {
        const res = await fetch(HLTV_RSS_URL, {
            headers: {
                'User-Agent': HLTV_UA,
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
    }

    private getEntities(): Record<string, any> {
        return {
            EsportsTournamentEntity: Repository.getEntity('EsportsTournamentsEntity'),
            EsportsMatchEntity: Repository.getEntity('EsportsMatchesEntity'),
        };
    }
}
