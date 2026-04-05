import { Service, Logger, Cron } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

const REGIONS = ['global', 'americas', 'europe', 'asia'] as const;
type Region = typeof REGIONS[number];

const GITHUB_BASE =
    'https://raw.githubusercontent.com/ValveSoftware/counter-strike_regional_standings/main/live';

const LOOKBACK_MONTHS = 3;

@Service('blog_cs2_rankings')
export class RankingsService {
    private readonly logger = new Logger('RankingsService');

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
                this.logger.log(`[rankings] synced ${count} entries for ${region}`);
            } catch (e: any) {
                this.logger.log(`[rankings] failed ${region}: ${e.message}`);
                stats.push({ region, count: 0 });
            }
        }

        return stats;
    }

    async getRankings(region: string = 'global', limit = 200): Promise<any[]> {
        const entity = Repository.getEntity("Cs2RankingEntity");
        if (!entity) return [];

        const latest = await this.getLatestSnapshot(region);
        if (!latest) return [];

        const results = await Repository.findAll(entity, {
            where: { region, snapshotDate: latest },
            order: { standing: 'ASC' },
            limit,
        });

        return results?.data || [];
    }

    async getLatestSnapshotDate(region: string = 'global'): Promise<string | null> {
        return this.getLatestSnapshot(region);
    }

    private async syncRegion(region: Region): Promise<number> {
        const { date, content } = await this.fetchLatestFile(region);
        const entries = this.parseMarkdown(content, region, date);

        const entity = Repository.getEntity("Cs2RankingEntity");
        if (!entity) {
            this.logger.log(`[rankings] Cs2RankingEntity not found — table may not exist yet`);
            return 0;
        }

        try {
            await Repository.delete(entity, { region, snapshotDate: date });
        } catch {}

        for (const entry of entries) {
            await Repository.insert(entity, entry);
        }

        return entries.length;
    }

    private async fetchLatestFile(region: Region): Promise<{ date: string; content: string }> {
        const now = new Date();
        const candidates: string[] = [];

        for (let i = 0; i < LOOKBACK_MONTHS * 2; i++) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - Math.floor(i / 2));

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');

            for (const day of ['02', '01', '03', '04', '05']) {
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
                const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
                if (res.ok) {
                    const content = await res.text();
                    this.logger.log(`[rankings] fetched ${region} @ ${date} (${content.length} bytes)`);
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

            entries.push({
                standing,
                points,
                teamName,
                roster,
                region,
                snapshotDate,
                logoUrl: '',
                detailsSlug,
            });
        }

        return entries;
    }

    private async getLatestSnapshot(region: string): Promise<string | null> {
        const entity = Repository.getEntity("Cs2RankingEntity");
        if (!entity) return null;

        const results = await Repository.findAll(entity, {
            where: { region },
            order: { snapshotDate: 'DESC' },
            limit: 1,
            select: ['snapshotDate'],
        });

        return results?.data?.[0]?.snapshotDate || null;
    }
}
