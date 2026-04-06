/**
 * Bootstrap & Sync Script
 *
 * 1. Ensures the blog_cs2_rankings table exists in the API database.
 * 2. Creates it if missing with proper schema & indexes.
 * 3. Calls the rankings sync endpoint to populate data.
 *
 * Usage:
 *   Run on server:  NODE_ENV=production npx tsx deploy-fix.mjs
 *   Or locally:     npx tsx deploy-fix.mjs
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────
function findDb(): string {
    const candidates = [
        '/root/cmmv-blog/apps/api/database.sqlite',
        path.resolve(process.cwd(), 'apps/api/database.sqlite'),
        path.resolve(process.cwd(), 'database.sqlite'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('database.sqlite not found — set DB_PATH env var');
}

function dbPath() {
    return process.env.DB_PATH || findDb();
}

function runSql(sql: string) {
    const db = dbPath();
    console.log(`[sql] running on ${db}`);
    execSync(`sqlite3 "${db}"`, { input: sql, stdio: ['pipe', 'pipe', 'pipe'] });
}

async function apiCall(method: string, url: string, headers: Record<string, string> = {}, body?: string): Promise<string> {
    const opts: RequestInit = { method, headers, signal: AbortSignal.timeout(30000) };
    if (body) opts.body = body;
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log(`[api] ${method} ${url} → ${res.status}`);
    console.log(`[api] ${text}`);
    return text;
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
    const db = dbPath();
    console.log(`Database: ${db}`);

    // Step 1: Create table and indexes
    console.log('\n[1/3] Ensuring blog_cs2_rankings table exists...');
    runSql(`
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

    // Step 2: Verify table and row count
    const count = execSync(`sqlite3 "${db}" "SELECT COUNT(*) FROM blog_cs2_rankings;"`)
        .toString().trim();
    console.log(`[2/3] Table exists — ${count} rows currently`);

    // Step 3: Try the rankings sync API
    console.log('\n[3/3] Triggering rankings sync...');
    try {
        await apiCall('POST', 'http://localhost:5000/api/cs2/sync/rankings', {
            'Authorization': 'Bearer 2c0397c1904cd4580595fc7fead6bf1c8cd50cf7c4e8468f32a45045570e319a',
            'Content-Type': 'application/json',
        });
    } catch (e: any) {
        console.warn(`[api] Sync request failed: ${e.message}`);
    }

    console.log('\n✅ Bootstrap complete.');
}

main().catch(console.error);
