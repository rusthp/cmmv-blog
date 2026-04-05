import { Service, Logger, Cron } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

const REGIONS = ['global', 'americas', 'europe', 'asia'] as const;
type Region = typeof REGIONS[number];

// GitHub raw base
const GITHUB_BASE =
    'https://raw.githubusercontent.com/ValveSoftware/counter-strike_regional_standings/main/live';

// Months to search back when looking for the latest snapshot
const LOOKBACK_MONTHS = 3;

@Service('blog_cs2_rankings')
export class RankingsService {
    private readonly logger = new Logger('RankingsService');

    @Cron('0 6 * * *') // daily at 06:00
    async cronSync() {
        await this.syncAll();
    }

    // ─── Public API ───────────────────────────────────────────────

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
        const entity = await this.getEntity();
        if (!entity) return [];

        // Get latest snapshot date for this region
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

    // ─── Sync Logic ───────────────────────────────────────────────

    private async syncRegion(region: Region): Promise<number> {
        const { date, content } = await this.fetchLatestFile(region);
        const entries = this.parseMarkdown(content, region, date);

        const entity = await this.getEntity();
        if (!entity) return 0;

        // Delete old entries for this region/date combo first
        // (simplest upsert: clear and re-insert)
        try {
            await Repository.delete(entity, { region, snapshotDate: date });
        } catch {}

        for (const entry of entries) {
            await Repository.insert(entity, entry);
        }

        return entries.length;
    }

    private async fetchLatestFile(region: Region): Promise<{ date: string; content: string }> {
        // Try most recent months
        const now = new Date();
        const candidates: string[] = [];

        for (let i = 0; i < LOOKBACK_MONTHS * 2; i++) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - Math.floor(i / 2));

            // Try day 1 and day 2 of each month (Valve usually posts on ~2nd)
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');

            for (const day of ['02', '01', '03', '04', '05']) {
                candidates.push(`${year}_${month}_${day}`);
            }
        }

        for (const date of candidates) {
            const year = date.substring(0, 4);
            const url = `${GITHUB_BASE}/${year}/standings_${region}_${date}.md`;

            try {
                const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
                if (res.ok) {
                    const content = await res.text();
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
            // Match table data rows: | 1 | 2029 | Vitality | ... |
            const match = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
            if (!match) continue;

            const standing = parseInt(match[1], 10);
            const points = parseInt(match[2], 10);
            const teamName = match[3].trim();
            const rosterRaw = match[4].trim();

            if (isNaN(standing) || isNaN(points) || !teamName) continue;

            // Roster: comma separated player names
            const roster = rosterRaw
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0)
                .join(', ');

            // Extract details slug from 5th column if present
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

    // ─── Helpers ──────────────────────────────────────────────────

    private async getLatestSnapshot(region: string): Promise<string | null> {
        const entity = await this.getEntity();
        if (!entity) return null;

        // Find newest snapshotDate for this region
        const results = await Repository.findAll(entity, {
            where: { region },
            order: { snapshotDate: 'DESC' },
            limit: 1,
            select: ['snapshotDate'],
        });

        return results?.data?.[0]?.snapshotDate || null;
    }

    private async getEntity(): Promise<any> {
        try {
            const mod = await import('../../.generated/entities/repository/cs2-ranking.entity');
            return mod['Cs2RankingEntity'];
        } catch {
            return null;
        }
    }
}
