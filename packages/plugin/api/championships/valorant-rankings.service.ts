import { Service, Logger, Cron } from '@cmmv/core';
import { Repository } from '@cmmv/repository';

const VLR_BASE = 'https://www.vlr.gg';
const INITIAL_SYNC_DELAY_MS = 20_000;

const VCT_REGIONS = [
    { slug: 'north-america', key: 'americas',  label: 'Americas' },
    { slug: 'emea',          key: 'emea',      label: 'EMEA' },
    { slug: 'pacific',       key: 'pacific',   label: 'Pacific' },
    { slug: 'china',         key: 'china',     label: 'China' },
] as const;

type VctRegion = typeof VCT_REGIONS[number]['key'];

@Service('blog_valorant_rankings')
export class ValorantRankingsService {
    private static readonly logger = new Logger('ValorantRankingsService');
    private static initialSyncDone = false;

    static log(msg: string) {
        try { ValorantRankingsService.logger.log(msg); } catch {}
    }
    static warn(msg: string) {
        try { ValorantRankingsService.logger.log(`[WARN] ${msg}`); } catch {}
    }

    constructor() {
        setTimeout(() => {
            this.initialSync().catch(() => {});
        }, INITIAL_SYNC_DELAY_MS);
    }

    private async initialSync() {
        if (ValorantRankingsService.initialSyncDone) return;
        ValorantRankingsService.initialSyncDone = true;

        const entity = Repository.getEntity('ValorantRankingsEntity');
        if (!entity) return;

        try {
            const existing = await Repository.findAll(entity, { region: 'americas', limit: 1 });
            if (!existing?.data?.length) {
                ValorantRankingsService.log('[vlr-rankings] No data — starting initial sync...');
                await this.syncAll();
            }
        } catch (e: any) {
            ValorantRankingsService.warn(`[vlr-rankings] Initial sync failed: ${e.message}`);
        }
    }

    @Cron('30 6 * * *')
    async cronSync() {
        await this.syncAll();
    }

    async syncAll(): Promise<{ region: string; count: number }[]> {
        const stats: { region: string; count: number }[] = [];

        for (const r of VCT_REGIONS) {
            try {
                const count = await this.syncRegion(r.slug, r.key);
                stats.push({ region: r.key, count });
                ValorantRankingsService.log(`[vlr-rankings] synced ${count} for ${r.key}`);
            } catch (e: any) {
                ValorantRankingsService.warn(`[vlr-rankings] failed ${r.key}: ${e.message}`);
                stats.push({ region: r.key, count: 0 });
            }
        }

        return stats;
    }

    async getRankings(region: string = 'americas', limit = 30): Promise<any[]> {
        const entity = Repository.getEntity('ValorantRankingsEntity');
        if (!entity) return [];

        const snapshot = await this.getLatestSnapshot(region);
        if (!snapshot) return [];

        const results = await Repository.findAll(entity, {
            region,
            snapshotDate: snapshot,
            limit,
            sortBy: 'standing',
            sort: 'ASC',
        });

        return results?.data || [];
    }

    async getAvailableRegions(): Promise<string[]> {
        return VCT_REGIONS.map(r => r.key);
    }

    async getSyncStatus(): Promise<{ hasData: boolean; regions: { region: string; count: number; snapshot: string | null }[] }> {
        const entity = Repository.getEntity('ValorantRankingsEntity');
        if (!entity) return { hasData: false, regions: [] };

        const regions: { region: string; count: number; snapshot: string | null }[] = [];

        for (const r of VCT_REGIONS) {
            try {
                const snapshot = await this.getLatestSnapshot(r.key);
                const results = await Repository.findAll(entity, { region: r.key, limit: 1 });
                regions.push({ region: r.key, count: results?.count || 0, snapshot });
            } catch {
                regions.push({ region: r.key, count: 0, snapshot: null });
            }
        }

        return { hasData: regions.some(r => r.count > 0), regions };
    }

    private async syncRegion(slug: string, key: string): Promise<number> {
        const html = await this.httpGet(`${VLR_BASE}/rankings/${slug}`);
        if (!html) throw new Error(`No HTML for region ${slug}`);

        const entries = this.parseRankingsHtml(html, key);
        if (entries.length === 0) {
            ValorantRankingsService.warn(`[vlr-rankings] parsed 0 entries for ${slug}`);
            return 0;
        }

        const entity = Repository.getEntity('ValorantRankingsEntity');
        if (!entity) return 0;

        const today = this.todaySnapshot();

        await Repository.deleteMany(entity, { region: key }).catch(() => {});

        let inserted = 0;
        for (const entry of entries) {
            try {
                const result = await Repository.insert(entity, { ...entry, snapshotDate: today });
                if (result?.success) inserted++;
            } catch {}
        }

        return inserted;
    }

    private parseRankingsHtml(html: string, region: string): Omit<any, 'snapshotDate'>[] {
        // Split on outer rank-item containers (class="rank-item wf-card ...")
        const blocks = html.split(/<div[^>]*class="rank-item wf-card[^"]*"[^>]*>/);
        const entries: any[] = [];

        for (let i = 1; i < blocks.length; i++) {
            const parsed = this.parseRankRow(blocks[i], i, region);
            if (parsed) entries.push(parsed);
        }

        if (entries.length === 0) {
            return this.parseRankingsTable(html, region);
        }

        return entries;
    }

    private parseRankRow(block: string, standing: number, region: string): any | null {
        // Standing: <div class="rank-item-rank-num">1</div>
        const rankMatch = block.match(/class="rank-item-rank-num"[^>]*>\s*(\d+)\s*</);
        if (rankMatch) standing = parseInt(rankMatch[1], 10);

        // Team code: data-sort-value on <a class="rank-item-team ...">
        const teamLinkMatch = block.match(/<a[^>]*data-sort-value="([^"]+)"[^>]*class="[^"]*rank-item-team[^"]*"/);
        const teamCode = teamLinkMatch?.[1]?.trim() || '';

        // Team name: first text node inside .ge-text, before any child element
        const geTextMatch = block.match(/class="ge-text"[^>]*>\s*([^<\n]+?)\s*(?:<|\n)/);
        if (!geTextMatch) return null;
        const teamName = geTextMatch[1].trim();
        if (!teamName || teamName === '#' || teamName === 'Team') return null;

        // Circuit points: data-sort-value on <div class="rank-item-rating">
        const pointsMatch = block.match(/<div[^>]*data-sort-value="(\d+)"[^>]*class="rank-item-rating"/);
        const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

        // Logo: first <img src> inside the team link block
        const logoMatch = block.match(/<img\s+src="([^"]+)"/);
        const rawSrc = logoMatch?.[1] || '';
        const logoUrl = rawSrc
            ? (rawSrc.startsWith('http') ? rawSrc : `https:${rawSrc.startsWith('//') ? rawSrc : `//${rawSrc}`}`)
            : '';

        return { standing, teamName, teamCode, points, region, logoUrl };
    }

    private parseRankingsTable(html: string, region: string): any[] {
        // Fallback: look for wf-table rows
        const entries: any[] = [];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        let match: RegExpExecArray | null;
        let standing = 1;

        while ((match = rowRegex.exec(html)) !== null) {
            const row = match[1];
            // Skip header rows
            if (row.includes('<th')) continue;

            const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => {
                const text = m[1].replace(/<[^>]+>/g, '').trim();
                return text;
            });

            if (cells.length < 2) continue;

            // cells[0] = rank, cells[1] = team, last numeric = points
            const rankNum = parseInt(cells[0], 10);
            if (isNaN(rankNum)) continue;

            const teamName = cells[1]?.trim();
            if (!teamName) continue;

            const pointsCell = cells.find(c => /^\d[\d,]*$/.test(c.replace(/\s/g, '')));
            const points = pointsCell ? parseInt(pointsCell.replace(/,/g, ''), 10) : 0;

            // Logo from img in this row
            const logoMatch = match[0].match(/src="([^"]+)"/);
            const logoUrl = logoMatch ? (logoMatch[1].startsWith('http') ? logoMatch[1] : `${VLR_BASE}${logoMatch[1]}`) : '';

            entries.push({ standing: rankNum || standing, teamName, teamCode: '', points, region, logoUrl });
            standing++;
        }

        return entries;
    }

    private async getLatestSnapshot(region: string): Promise<string | null> {
        const entity = Repository.getEntity('ValorantRankingsEntity');
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

    private todaySnapshot(): string {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}_${m}_${day}`;
    }

    private async httpGet(url: string): Promise<string | null> {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                },
                signal: AbortSignal.timeout(25000),
            });
            if (!res.ok) return null;
            return await res.text();
        } catch {
            return null;
        }
    }
}
