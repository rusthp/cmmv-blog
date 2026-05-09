export interface ExternalIdEntry {
    source: string;
    id: string;
}

export interface TournamentData {
    externalId?: string;
    externalIds?: string; // JSON: ExternalIdEntry[]
    dataSource?: string;
    game?: string;
    name?: string;
    slug?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    prizePool?: string;
    location?: string;
    online?: boolean;
    tier?: string;
    logoUrl?: string;
    bannerUrl?: string;
    leagueName?: string;
    leagueLogo?: string;
    serieName?: string;
    teamsJson?: string;
    subTournamentsJson?: string;
    serieExternalId?: string;
    region?: string;
    numberOfTeams?: number;
    featured?: boolean;
}

// Trust order: higher index = higher trust. Winner fills empty fields, never overwrites.
const SOURCE_TRUST: Record<string, number> = {
    draft5: 0,
    vlr: 0,
    pandascore: 1,
    liquipedia: 2,
    hltv: 3,
};

function trustOf(source: string): number {
    return SOURCE_TRUST[source] ?? 0;
}

function normalizeSlug(slug: string): string {
    return slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseDate(d: string | null | undefined): Date | null {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function datesOverlap(aStart: string | null | undefined, bStart: string | null | undefined, toleranceDays = 7): boolean {
    const a = parseDate(aStart);
    const b = parseDate(bStart);
    if (!a || !b) return false;
    return Math.abs(a.getTime() - b.getTime()) <= toleranceDays * 86400_000;
}

export function isSameTournament(a: TournamentData, b: TournamentData): boolean {
    if (a.slug && b.slug && normalizeSlug(a.slug) === normalizeSlug(b.slug)) return true;
    if (a.game === b.game && a.name && b.name) {
        const normA = normalizeSlug(a.name);
        const normB = normalizeSlug(b.name);
        if (normA === normB && datesOverlap(a.startDate, b.startDate)) return true;
    }
    return false;
}

export function mergeExternalIds(
    existingJson: string | null | undefined,
    newEntry: ExternalIdEntry
): ExternalIdEntry[] {
    let existing: ExternalIdEntry[] = [];
    try {
        if (existingJson) existing = JSON.parse(existingJson);
    } catch {}
    const idx = existing.findIndex(e => e.source === newEntry.source);
    if (idx >= 0) {
        existing[idx] = newEntry;
    } else {
        existing.push(newEntry);
    }
    return existing;
}

// Merge incoming data into existing record using coverage rule:
// incoming fills empty fields only, unless incoming source has higher trust.
export function mergeTournaments(
    existing: TournamentData,
    incoming: TournamentData,
    incomingSource: string
): TournamentData {
    const existingSource = existing.dataSource || 'pandascore';
    const incomingTrust = trustOf(incomingSource);
    const existingTrust = trustOf(existingSource);
    const incomingWins = incomingTrust > existingTrust;

    const merged: TournamentData = { ...existing };

    const incomingIds: ExternalIdEntry[] = [];
    try {
        if (incoming.externalIds) incomingIds.push(...JSON.parse(incoming.externalIds));
    } catch {}
    // Only fall back to raw externalId if that source isn't already covered by externalIds array
    if (incoming.externalId && !incomingIds.some(e => e.source === incomingSource)) {
        incomingIds.push({ source: incomingSource, id: incoming.externalId });
    }

    let mergedIds: ExternalIdEntry[] = [];
    try {
        if (existing.externalIds) mergedIds = JSON.parse(existing.externalIds);
    } catch {}
    for (const entry of incomingIds) {
        mergedIds = mergeExternalIds(JSON.stringify(mergedIds), entry);
    }
    merged.externalIds = JSON.stringify(mergedIds);

    // Coverage: fill empty, or overwrite if incoming has higher trust
    const fields: Array<keyof TournamentData> = [
        'name', 'slug', 'status', 'startDate', 'endDate', 'prizePool',
        'location', 'tier', 'logoUrl', 'bannerUrl', 'leagueName',
        'leagueLogo', 'serieName', 'region',
    ];

    for (const field of fields) {
        const cur = existing[field];
        const inc = incoming[field];
        if (!cur && inc) {
            (merged as any)[field] = inc;
        } else if (incomingWins && inc) {
            (merged as any)[field] = inc;
        }
    }

    // Teams: prefer the source with more teams
    const existingTeams = safeParseArray(existing.teamsJson);
    const incomingTeams = safeParseArray(incoming.teamsJson);
    if (incomingTeams.length > existingTeams.length) {
        merged.teamsJson = incoming.teamsJson;
        merged.numberOfTeams = incomingTeams.length;
    }

    if (!existing.online && incoming.online !== undefined) {
        merged.online = incoming.online;
    }
    if (!existing.featured && incoming.featured) {
        merged.featured = incoming.featured;
    }
    if (incomingWins && incoming.dataSource) {
        merged.dataSource = incoming.dataSource;
    }

    return merged;
}

function safeParseArray(json: string | undefined | null): any[] {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
