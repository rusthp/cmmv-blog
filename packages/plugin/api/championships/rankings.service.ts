import { Service, Logger, Cron } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { LogoScraperService } from './logo-scraper.utils';

const REGIONS = ['global', 'americas', 'europe', 'asia'] as const;
type Region = typeof REGIONS[number];

const GITHUB_BASE =
    'https://raw.githubusercontent.com/ValveSoftware/counter-strike_regional_standings/main/live';

const LOOKBACK_MONTHS = 6;
const INITIAL_SYNC_DELAY_MS = 15_000; // 15s after server starts

// Player nationality mapping — ISO 3166-1 alpha-2 country codes
// Used to determine team nationality (3+ players from same country)
const PLAYER_COUNTRY: Record<string, string> = {
    // Brazil
    'fer': 'BR', 'fnx': 'BR', 'taco': 'BR', 'drop': 'BR', 'trk': 'BR',
    'heat': 'BR', 'qck': 'BR', 'nython': 'BR', 'bzka': 'BR', 'lukxo': 'BR',
    'dtxz': 'BR', 'spike': 'BR', 'khalil': 'BR', 'raafa': 'BR', 'jzz': 'BR',
    'pilot': 'BR', 'murizzum': 'BR', 'n3k4y': 'BR', 'v$': 'BR', 'hardzao': 'BR',
    'zevy': 'BR', 'mazin': 'BR', 'chelo': 'BR', 'crisby': 'BR', 'tuyz': 'BR',
    'mwzera': 'BR', 'nbl': 'BR', 'shz': 'BR', 'dgzin': 'BR', 'fastdrawn': 'BR',
    'pax': 'BR', 'nqz': 'BR', 'raizen': 'BR', 'dav1de': 'BR', 'hnt': 'BR',
    'n0rb3r7': 'BR', 'boltz': 'BR', 'nak': 'BR', 's1m': 'BR', 'zequepl4y': 'BR',
    // Denmark
    'zonic': 'DK', 'device': 'DK', 'magisk': 'DK', 'blamef': 'DK', 'karrigan': 'DK',
    'br0': 'DK', 'jabbi': 'DK', 'stavn': 'DK', 'nicoodoz': 'DK', 'sjuush': 'DK',
    'farlig': 'DK', 'roej': 'DK', 'b1n0': 'DK', 'kyxsan': 'DK', 'gla1ve': 'DK',
    'dev1ce': 'DK', 'aaron': 'DK', 'tiziaN': 'DK', 'gade': 'DK', 'hoox': 'DK',
    // France
    'apoka': 'FR', 'shox': 'FR', 'kioresh': 'FR', 'xms': 'FR', 'bodyy': 'FR',
    'z3hr': 'FR', 'misutaaa': 'FR', 'r3salt': 'FR', 's1ren': 'FR', 'm0NESY': 'FR',
    'mezii': 'FR', 'flameZ': 'FR', 'afro': 'FR', 'vsm': 'FR', 'blix': 'FR',
    'xertioN': 'FR', 'dumau': 'FR', 'penn': 'FR', 'nK': 'FR', 'hAdji': 'FR',
    'dav cost': 'FR', 'kylar': 'FR', 'woro2k': 'FR', 'to1nou': 'FR', 'tex': 'FR',
    'sixer': 'FR', 'eksem': 'FR', 'm1ku': 'FR', 'neki': 'FR', 'sl3nd': 'FR',
    // Germany
    'syrsoN': 'DE', 'krimbo': 'DE', 'tiziaN': 'DE', 'prosus': 'DE', 'cmzn': 'DE',
    'reecky': 'DE', 'deq': 'DE', 'deko': 'DE', 'blowzy': 'DE', 'gob b': 'DE',
    'nex': 'DE', 'denis': 'DE', 'syndr1': 'DE', 'fASHlON': 'DE', 'lsm': 'DE',
    'tabseN': 'DE', 's1n': 'DE', 'starix': 'DE', 'iceberg': 'DE', 'isak': 'DE',
    // United Kingdom
    'harry': 'GB', 'imoRR': 'GB', 'hades': 'GB', 'f0rest': 'GB',
    // Poland
    'furlan': 'PL', 'mwlky': 'PL', 'innocent': 'PL', 'siuhy': 'PL',
    'karol': 'PL', 'mynio': 'PL', 'michu': 'PL', 'kapsien': 'PL',
    'phr': 'PL', 'zedo': 'PL', 'reiko': 'PL', 'dycha': 'PL',
    'keiko': 'PL', 'nawrot': 'PL', 'gryzhyn': 'PL', 'davuuf': 'PL',
    // Sweden
    'friberg': 'SE', 'twist': 'SE', 'leX': 'SE', 's3pt3ri0n': 'SE', 'phzy': 'SE',
    'nicoo': 'SE', 'plopski': 'SE', 'headtr1ck': 'SE', 'zet': 'SE', 'isak': 'SE',
    'peppzor': 'SE', 'f1n': 'SE', 'n3z': 'SE', 'h4rn': 'SE', 'znic': 'SE',
    // Russia
    'sh1ro': 'RU', 'ax1Le': 'RU', 'perfecto': 'RU', 'electroNic': 'RU', 'nafany': 'RU',
    'interz': 'RU', 'fame': 'RU', 'flamus': 'RU', 'jame': 'RU', 'buster': 'RU',
    'qikert': 'RU', 'zorte': 'RU', 'norwi': 'RU', 'fame': 'RU', 'dabast': 'RU',
    'forester': 'RU', 'r3salt': 'RU', 's0me': 'RU', 'zont1x': 'RU', 'dima': 'RU',
    'rmn': 'RU', '17petrov': 'RU', 'kinq': 'RU', 's1leNt': 'RU', 'deko': 'RU',
    'notineki': 'RU', 'lollipop21k': 'RU', 'moriiSky': 'RU', 'k23': 'RU', 'chopper': 'RU',
    // Ukraine
    'b1t': 'UA', 'npl': 'UA', 'demho': 'UA', 'w0nderful': 'UA', 'ducha': 'UA',
    'kapacho': 'UA', 'anarkez': 'UA', 'kade0': 'UA', 'krizzeN': 'UA', 'kvik': 'UA',
    '777': 'UA', 'bondik': 'UA', 'kory': 'UA', 'kizZz': 'UA', 'shadiy': 'UA',
    'sp3ktre': 'UA', 'arba': 'UA', 'k1to': 'UA', 's1n': 'UA', 'magixx': 'UA',
    // Belarus
    'prophecy': 'BY', 'g3nism': 'BY', 'v4lk': 'BY',
    // Kazakhstan
    'buster': 'KZ', 'fame': 'KZ', 'aff1N1ty': 'KZ', 'seized': 'KZ', 'buster': 'KZ',
    // Serbia/Ex-YU
    'hugo': 'RS', 'LETN1': 'RS', 's1NNer': 'RS', 'torres': 'RS', 'd0c': 'RS',
    'k1ll': 'RS', 's1n': 'RS', 'nex': 'RS',
    // Czech
    'nbK': 'CZ', 'forsyy': 'CZ', 'beastik': 'CZ', 'daviducko': 'CZ',
    'lack1': 'CZ', 'kioShiMa': 'CZ', 'oskarshamn': 'CZ',
    // Finland
    'allu': 'FI', 'sergej': 'FI', 'suNny': 'FI', 'zehN': 'FI', 'k1to': 'FI',
    // Austria
    'starxo': 'AT', 'zero': 'AT', 'cromen': 'AT',
    // Netherlands
    'devoduveka': 'NL', 'vexite': 'NL', 'jayzhard': 'NL', 'denis': 'NL',
    // Belgium
    'exeter': 'BE',
    // Norway
    'jkaem': 'NO', 'k0nfig': 'NO', 'rain': 'NO', 'torben': 'NO',
    // Latvia
    'snatchie': 'LV', 'deko': 'LV', 'twist': 'LV',
    // Lithuania
    'nuko': 'LT', 'nukkye': 'LT',
    // Portugal
    'forjj': 'PT', 'suspicious': 'PT', 'zeek': 'PT', 's1nnfer': 'PT',
    'exp': 'PT', 's1n': 'PT', 'sicko': 'PT', 'cortez': 'PT',
    // Spain
    'alex': 'ES', 'mixwell': 'ES', 'koldamenta': 'ES', 'suNny': 'ES',
    'starxo': 'ES', 'sheyo': 'ES', 'krimbo': 'ES', 'barbarr': 'ES',
    // Turkey
    'woxic': 'TR', 'calm': 'TR', 'ruxic': 'TR',
    // Estonia
    'n3z': 'EE', 'r1cky': 'EE',
    // Australia
    'liazz': 'AU', 'vexite': 'AU', 'jkaem': 'AU', 'hazrd': 'AU', 'sico': 'AU',
    'aliStair': 'AU', 'pan': 'AU', 'dexter': 'AU', 'gratisfaction': 'AU', 'insight': 'AU',
    // New Zealand
    'dexter': 'NZ',
    // USA
    'stanislaw': 'US', 'shahZaM': 'US', 'autimatic': 'US', 'reltuC': 'US',
    'Brehze': 'US', 'oSee': 'US', 'viz': 'US', 'crashies': 'US',
    'Foxy': 'US', 'leaf': 'US', 'daps': 'US', 'marved': 'US',
    // Canada
    'nafoo': 'CA', 'EZ': 'CA', 'FASHR': 'CA',
    // Argentina
    'nqz': 'AR', 'dgt': 'AR', 'malbs': 'AR', 'bravinn': 'AR', 'jks': 'AR',
    'rigo': 'AR', 'n1k3n': 'AR',
    // Chile
    'kiNgg': 'CL',
    // Colombia
    'krii': 'CO',
    // Mongolia
    'bLaz1ng': 'MN', 'techno4k': 'MN', '910': 'MN', 'adik': 'MN', 'seized': 'MN',
    'sk0R': 'MN', 'shine': 'MN', 'bodya': 'MN', 's1ren': 'MN', 'pure': 'MN',
    // Japan
    'Meiy': 'JP', 'StyuN': 'JP', 'Astar': 'JP',
    // China
    'advent': 'CN', 'qzr': 'CN', 'somebody': 'CN', 'danking': 'CN', 'summer': 'CN',
    'kaze': 'CN', 'tb': 'CN', 'mercury': 'CN', 'z4kr': 'CN',
    // Australia
    'insight': 'AU',
    // Slovakia
    'oskar': 'SK', 'zero': 'SK',
    // Israel
    'r1cky': 'IL',
    // Georgia
    'hooch': 'GE', 'buster': 'GE',
    // Romania
    'h1gg3r': 'RO',
} as const;

// Map of country codes to fallback region
const REGION_OF_COUNTRY: Record<string, string> = {
    'BR': 'americas', 'US': 'americas', 'CA': 'americas', 'AR': 'americas',
    'CL': 'americas', 'CO': 'americas',
    'DK': 'europe', 'FR': 'europe', 'DE': 'europe', 'GB': 'europe', 'PL': 'europe',
    'SE': 'europe', 'RU': 'europe', 'UA': 'europe', 'BY': 'europe', 'KZ': 'europe',
    'RS': 'europe', 'CZ': 'europe', 'FI': 'europe', 'AT': 'europe', 'NL': 'europe',
    'BE': 'europe', 'NO': 'europe', 'LV': 'europe', 'LT': 'europe', 'PT': 'europe',
    'ES': 'europe', 'TR': 'europe', 'EE': 'europe', 'SK': 'europe', 'IL': 'europe',
    'GE': 'europe', 'RO': 'europe',
    'MN': 'asia', 'JP': 'asia', 'CN': 'asia', 'AU': 'asia', 'NZ': 'asia',
};

// Determine team nationality from roster — requires majority (3+ of same country)
function determineTeamNationality(roster: string): { countryCode: string | null } {
    if (!roster) return { countryCode: null };
    const players = roster.split(',').map(p => p.trim()).filter(Boolean);
    const countryCounts: Record<string, number> = {};
    for (const player of players) {
        const code = PLAYER_COUNTRY[player];
        if (code) countryCounts[code] = (countryCounts[code] || 0) + 1;
    }
    let bestCode: string | null = null;
    let bestCount = 0;
    for (const [code, count] of Object.entries(countryCounts)) {
        if (count >= 3 && (count > bestCount || (count === bestCount && (!bestCode || code < bestCode)))) {
            bestCode = code;
            bestCount = count;
        }
    }
    return { countryCode: bestCode };
}

@Service('blog_cs2_rankings')
export class RankingsService {
    private static readonly logger = new Logger('RankingsService');
    private static initialSyncDone = false;
    private logoScraper = new LogoScraperService();

    static log(msg: string) {
        try { RankingsService.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { RankingsService.logger.warning(msg); } catch {}
    }

    constructor() {
        // Schedule initial sync after server startup
        setTimeout(() => {
            this.initialSync().catch(() => {});
        }, INITIAL_SYNC_DELAY_MS);
    }

    private async initialSync() {
        if (RankingsService.initialSyncDone) return;
        RankingsService.initialSyncDone = true;

        RankingsService.log('[rankings] Checking if initial sync is needed...');

        try {
            const existing = await this.getRankings('global', 1);

            if (existing.length === 0) {
                RankingsService.log('[rankings] No data found — starting initial sync...');
                await this.syncAll();
                RankingsService.log('[rankings] Initial sync complete.');
            } else {
                // Check if data is stale (older than 25 days)
                const snapshot = existing[0]?.snapshotDate;
                if (snapshot && this.isSnapshotStale(snapshot)) {
                    RankingsService.log('[rankings] Data is stale — re-syncing...');
                    await this.syncAll();
                } else {
                    RankingsService.log('[rankings] Data is up-to-date. Skipping sync.');
                }
            }
        } catch (e: any) {
            RankingsService.warn(`[rankings] Initial sync failed: ${e.message}`);
        }
    }

    @Cron('0 6 * * *')
    async cronSync() {
        await this.syncAll();
    }

    async syncAll(): Promise<{ region: string; count: number }[]> {
        const stats: { region: string; count: number }[] = [];

        for (const region of REGIONS) {
            try {
                const count = await this.syncRegion(region);
                stats.push({ region, count });
                RankingsService.log(`[rankings] synced ${count} entries for ${region}`);
            } catch (e: any) {
                RankingsService.warn(`[rankings] failed ${region}: ${e.message}`);
                stats.push({ region, count: 0 });
            }
        }

        return stats;
    }

    async getRankings(region: string = 'global', limit = 200): Promise<any[]> {
        const entity = Repository.getEntity("Cs2RankingsEntity");
        if (!entity) return [];

        const latest = await this.getLatestSnapshot(region);
        if (!latest) return [];

        const results = await Repository.findAll(entity, {
            region,
            snapshotDate: latest,
            limit,
            sortBy: 'standing',
            sort: 'ASC',
        });

        return results?.data || [];
    }

    async getLatestSnapshotDate(region: string = 'global'): Promise<string | null> {
        return this.getLatestSnapshot(region);
    }

    async getSyncStatus(): Promise<{
        hasData: boolean;
        regions: { region: string; count: number; latestSnapshot: string | null }[];
    }> {
        const entity = Repository.getEntity("Cs2RankingsEntity");
        if (!entity) return { hasData: false, regions: [] };

        const regions: { region: string; count: number; latestSnapshot: string | null }[] = [];

        for (const region of REGIONS) {
            let count = 0;
            let snapshot: string | null = null;

            try {
                const results = await Repository.findAll(entity, {
                    region,
                    limit: 1,
                    sortBy: 'snapshotDate',
                    sort: 'DESC',
                });
                count = results?.count || 0;
                snapshot = results?.data?.[0]?.snapshotDate || null;
            } catch {}

            regions.push({ region, count, latestSnapshot: snapshot });
        }

        const hasData = regions.some(r => r.count > 0);
        return { hasData, regions };
    }

    private isSnapshotStale(snapshotDate: string): boolean {
        const parts = snapshotDate.split('_');
        if (parts.length !== 3) return true;

        const snapshotTime = new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
        ).getTime();

        const now = Date.now();
        const daysDiff = (now - snapshotTime) / (1000 * 60 * 60 * 24);
        return daysDiff > 25;
    }

    private async syncRegion(region: Region): Promise<number> {
        const { date, content } = await this.fetchLatestFile(region);
        const entries = this.parseMarkdown(content, region, date);

        const entity = Repository.getEntity("Cs2RankingsEntity");
        if (!entity) {
            RankingsService.log(`[rankings] Cs2RankingsEntity not found — table may not exist yet`);
            return 0;
        }

        // Pre-fetch PandaScore teams to use as logo fallbacks
        const teamMap = new Map<string, string>();
        const teamEntity = Repository.getEntity("EsportsTeamsEntity");
        if (teamEntity) {
            try {
                const allTeams = await Repository.findAll(teamEntity, { game: 'csgo', limit: '1000' });
                if (allTeams?.data) {
                    for (const t of allTeams.data) {
                        if (t.logoUrl) {
                            teamMap.set(t.name.toLowerCase().trim(), t.logoUrl);
                            if (t.acronym) teamMap.set(t.acronym.toLowerCase().trim(), t.logoUrl);
                        }
                    }
                }
            } catch (e: any) {
                RankingsService.warn(`[rankings] Failed to pre-fetch teams: ${e.message}`);
            }
        }

        RankingsService.log(`[rankings] parsed ${entries.length} entries for ${region} @ ${date}`);

        // Clean old data for this region + snapshot
        try {
            await Repository.deleteMany(entity, { region, snapshotDate: date });
            RankingsService.log(`[rankings] cleaned old entries for ${region}/${date}`);
        } catch (e: any) {
            RankingsService.warn(`[rankings] delete failed: ${e.message}`);
        }

        // Phase 1: Insert all entries first (fast path — no blocking logo downloads)
        let inserted = 0;
        let firstError = '';

        for (const entry of entries) {
            // Use teamMap logo as initial fallback (already in memory)
            const fallbackUrl = teamMap.get(entry.teamName.toLowerCase().trim());
            if (fallbackUrl) entry.logoUrl = fallbackUrl;

            try {
                const result = await Repository.insert(entity, entry);
                if (result?.success) {
                    inserted++;
                } else {
                    if (!firstError) firstError = result?.message || 'unknown';
                }
            } catch (e: any) {
                if (!firstError) firstError = e.message;
            }
        }

        if (firstError) {
            RankingsService.warn(`[rankings] insert errors for ${region}: ${firstError}`);
        }

        RankingsService.log(`[rankings] synced ${inserted}/${entries.length} entries for ${region}`);

        // Phase 2: Download and cache logos for Top 50 in background (non-blocking)
        setImmediate(async () => {
            const top50 = entries.filter(e => e.standing <= 50);
            for (const entry of top50) {
                try {
                    const fallbackUrl = teamMap.get(entry.teamName.toLowerCase().trim());
                    const logo = await this.logoScraper.findAndDownloadLogo(entry.teamName, fallbackUrl);
                    if (logo && logo !== entry.logoUrl) {
                        await Repository.updateOne(entity, { region, snapshotDate: entry.snapshotDate, standing: entry.standing }, { logoUrl: logo });
                    }
                } catch { /* logo download failures are non-critical */ }
            }
            RankingsService.log(`[rankings] background logo download complete for ${region} top 50`);
        });

        return inserted;
    }

    private async fetchLatestFile(region: Region): Promise<{ date: string; content: string }> {
        const now = new Date();
        const candidates: string[] = [];

        for (let i = 0; i < LOOKBACK_MONTHS; i++) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');

            // Cover broader range — Valve uses varied days like 02, 05, etc.
            for (const day of ['02', '01', '03', '04', '05', '06', '07', '08', '09', '10']) {
                candidates.push(`${year}_${month}_${day}`);
            }
        }

        // Deduplicate
        const seen = new Set<string>();
        const unique = candidates.filter(c => !seen.has(c) && seen.add(c));

        for (const date of unique) {
            const year = date.substring(0, 4);
            const url = `${GITHUB_BASE}/${year}/standings_${region}_${date}.md`;

            try {
                const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
                if (res.ok) {
                    const content = await res.text();
                    RankingsService.log(`[rankings] fetched ${region} @ ${date} (${content.length} bytes)`);
                    return { date, content };
                }
            } catch {}
        }

        throw new Error(`No standings file found for region: ${region}`);
    }

    private parseMarkdown(content: string, region: string, snapshotDate: string): any[] {
        const entries: any[] = [];
        const lines = content.split('\n');

        for (const line of lines) {
            const match = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
            if (!match) continue;

            const standing = parseInt(match[1], 10);
            const points = parseInt(match[2], 10);
            const teamName = match[3].trim();
            const rosterRaw = match[4].trim();

            if (isNaN(standing) || isNaN(points) || !teamName) continue;

            const roster = rosterRaw
                .split(',')
                .map((p: string) => p.trim())
                .filter((p: string) => p.length > 0)
                .join(', ');

            const detailsMatch = line.match(/\[details\]\(([^)]+)\)/);
            const detailsSlug = detailsMatch
                ? detailsMatch[1].replace('details/', '').replace('.md', '')
                : '';

                const { countryCode } = determineTeamNationality(roster);

            entries.push({
                standing,
                points,
                teamName,
                roster,
                region,
                snapshotDate,
                logoUrl: '',
                detailsSlug: countryCode ? `${countryCode}/${detailsSlug || ''}` : detailsSlug,
            });
        }

        return entries;
    }

    private async getLatestSnapshot(region: string): Promise<string | null> {
        const entity = Repository.getEntity("Cs2RankingsEntity");
        if (!entity) return null;

        try {
            const results = await Repository.findAll(entity, {
                region,
                limit: 1,
                sortBy: 'snapshotDate',
                sort: 'DESC',
            });

            return results?.data?.[0]?.snapshotDate || null;
        } catch {
            return null;
        }
    }
}
