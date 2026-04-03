/**
 * ContentModerationUtils
 *
 * Scans post content for competitor / third-party brand mentions
 * that must not appear in published articles.
 *
 * To add new terms: append to COMPETITOR_BLOCKLIST below.
 */

const COMPETITOR_BLOCKLIST: string[] = [
    // Esports media / news competitors
    'thespike',
    'the spike',
    'vlr.gg',
    'liquipedia',
    'dot esports',
    'dot.esports',
    'dotesports',
    'win.gg',
    'jaxon.gg',
    'oneesports',
    'one esports',
    'upcomer',
    'estnn',
    'hltv',
    'dbltap',
    'dbl tap',
    'tracker.gg',
    'blastesports',
    'blast esports',
    // General media
    'gamespot',
    'ign.com',
    'polygon.com',
];

export interface ModerationResult {
    approved: boolean;
    violations: string[];
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ');
}

export function moderateContent(fields: Record<string, string | undefined>): ModerationResult {
    const violations: string[] = [];

    for (const [, value] of Object.entries(fields)) {
        if (!value) continue;
        const plain = stripHtml(value).toLowerCase();

        for (const term of COMPETITOR_BLOCKLIST) {
            if (plain.includes(term.toLowerCase()) && !violations.includes(term)) {
                violations.push(term);
            }
        }
    }

    return { approved: violations.length === 0, violations };
}
