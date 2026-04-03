/**
 * ContentModerationUtils
 *
 * Scans post content for competitor / third-party brand mentions.
 * When violations are found, uses AI to rewrite the affected fields
 * so the post can be saved without manual intervention.
 *
 * To add new terms: append to COMPETITOR_BLOCKLIST below.
 */

export const COMPETITOR_BLOCKLIST: string[] = [
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

export interface ModerationFixResult {
    fixed: boolean;
    violations: string[];
    title: string;
    content: string;
    excerpt: string;
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

/**
 * Uses AI to rewrite fields that contain competitor mentions.
 * Preserves HTML structure — only rewrites the plain text portions.
 * Falls back to simple redaction if AI is unavailable.
 */
export async function fixContentWithAI(
    fields: { title: string; content: string; excerpt: string },
    violations: string[],
    aiContentService: { generateContent: (prompt: string) => Promise<any> }
): Promise<ModerationFixResult> {
    const violationList = violations.join(', ');

    async function rewriteField(fieldName: string, value: string): Promise<string> {
        if (!value) return value;

        const plain = stripHtml(value);
        const hasViolation = violations.some(v => plain.toLowerCase().includes(v.toLowerCase()));
        if (!hasViolation) return value;

        const isHtml = /<[a-z][\s\S]*>/i.test(value);

        const prompt = isHtml
            ? `You are an editorial assistant. The following HTML article ${fieldName} contains references to competitor media outlets (${violationList}). ` +
              `Rewrite ONLY the text content, keeping all HTML tags exactly as-is. ` +
              `Replace competitor mentions with neutral phrasing (e.g. "a leading esports outlet", "industry sources", "reports indicate"). ` +
              `Do NOT add explanations. Return only the corrected HTML.\n\n${value}`
            : `You are an editorial assistant. The following ${fieldName} mentions competitor media outlets (${violationList}). ` +
              `Rewrite it removing those references and replacing with neutral phrasing. ` +
              `Do NOT add explanations. Return only the corrected text.\n\n${value}`;

        try {
            const result = await aiContentService.generateContent(prompt);
            const text: string = typeof result === 'string'
                ? result
                : result?.content ?? result?.text ?? result?.choices?.[0]?.message?.content ?? '';

            return text.trim() || fallbackRedact(value, violations);
        } catch {
            return fallbackRedact(value, violations);
        }
    }

    const [title, content, excerpt] = await Promise.all([
        rewriteField('title', fields.title),
        rewriteField('content', fields.content),
        rewriteField('excerpt', fields.excerpt),
    ]);

    return { fixed: true, violations, title, content, excerpt };
}

/** Simple regex redaction used when AI is unavailable */
function fallbackRedact(text: string, violations: string[]): string {
    let result = text;
    for (const term of violations) {
        result = result.replace(new RegExp(term, 'gi'), 'a leading esports outlet');
    }
    return result;
}
