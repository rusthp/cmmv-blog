/**
 * Standalone script to sync Valve CS2 rankings into SQLite.
 * Run with: npx tsx packages/plugin/api/championships/sync-rankings.mts
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const REGIONS = ['global', 'americas', 'europe', 'asia'] as const;
const GITHUB_BASE = 'https://raw.githubusercontent.com/ValveSoftware/counter-strike_regional_standings/main/live';

// Find the database file
function findDb(): string {
    const candidates = [
        '/root/cmmv-blog/apps/api/database.sqlite',
        path.resolve(process.cwd(), 'apps/api/database.sqlite'),
        path.resolve(process.cwd(), 'database.sqlite'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('database.sqlite not found');
}

function generateUUID(): string {
    const h = () => Math.random().toString(16).slice(2, 10).padStart(8, '0');
    const s = () => Math.random().toString(16).slice(2, 6).padStart(4, '0');
    return `${h()}-${s()}-4${s().slice(1)}-${['8','9','a','b'][Math.floor(Math.random()*4)]}${s().slice(1)}-${h()}${s()}`;
}

async function fetchLatest(region: string): Promise<{ date: string; content: string }> {
    const now = new Date();
    const candidates: string[] = [];

    for (let i = 0; i < 6; i++) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - Math.floor(i / 2));
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        for (const day of ['02', '01', '03', '04', '05']) {
            candidates.push(`${year}_${month}_${day}`);
        }
    }

    const seen = new Set<string>();
    const unique = candidates.filter(c => !seen.has(c) && seen.add(c));

    for (const date of unique) {
        const year = date.substring(0, 4);
        const url = `${GITHUB_BASE}/${year}/standings_${region}_${date}.md`;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
            if (res.ok) {
                console.log(`  ✓ ${region} @ ${date}`);
                return { date, content: await res.text() };
            }
        } catch {}
    }
    throw new Error(`No file found for ${region}`);
}

function parseMarkdown(content: string, region: string, snapshotDate: string): any[] {
    const entries: any[] = [];
    for (const line of content.split('\n')) {
        const m = line.match(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
        if (!m) continue;
        const standing = parseInt(m[1], 10);
        const points = parseInt(m[2], 10);
        const teamName = m[3].trim();
        const roster = m[4].trim().split(',').map((p: string) => p.trim()).filter(Boolean).join(', ');
        if (isNaN(standing) || isNaN(points) || !teamName) continue;
        const dm = line.match(/\[details\]\(([^)]+)\)/);
        const detailsSlug = dm ? dm[1].replace('details/', '').replace('.md', '') : '';
        entries.push({ standing, points, teamName, roster, region, snapshotDate, logoUrl: '', detailsSlug });
    }
    return entries;
}

async function main() {
    const dbPath = findDb();
    console.log(`Database: ${dbPath}`);
    const db = new Database(dbPath);

    // Ensure table exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS blog_cs2_rankings (
            id TEXT PRIMARY KEY,
            standing INTEGER NOT NULL,
            points INTEGER NOT NULL,
            teamName TEXT NOT NULL,
            roster TEXT,
            region TEXT NOT NULL,
            snapshotDate TEXT NOT NULL,
            logoUrl TEXT,
            detailsSlug TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_cs2r_region ON blog_cs2_rankings(region);
        CREATE INDEX IF NOT EXISTS idx_cs2r_snap ON blog_cs2_rankings(snapshotDate);
        CREATE INDEX IF NOT EXISTS idx_cs2r_standing ON blog_cs2_rankings(standing);
    `);

    const insert = db.prepare(`
        INSERT INTO blog_cs2_rankings (id, standing, points, teamName, roster, region, snapshotDate, logoUrl, detailsSlug)
        VALUES (@id, @standing, @points, @teamName, @roster, @region, @snapshotDate, @logoUrl, @detailsSlug)
    `);
    const deleteOld = db.prepare(`DELETE FROM blog_cs2_rankings WHERE region = @region AND snapshotDate = @snapshotDate`);

    for (const region of REGIONS) {
        try {
            const { date, content } = await fetchLatest(region);
            const entries = parseMarkdown(content, region, date);
            console.log(`  Parsed ${entries.length} entries for ${region}`);

            const tx = db.transaction(() => {
                deleteOld.run({ region, snapshotDate: date });
                for (const e of entries) {
                    insert.run({ ...e, id: generateUUID() });
                }
            });
            tx();
            console.log(`  ✓ Inserted ${entries.length} rows for ${region}`);
        } catch (e: any) {
            console.error(`  ✗ ${region}: ${e.message}`);
        }
    }

    db.close();
    console.log('Done!');
}

main().catch(console.error);
