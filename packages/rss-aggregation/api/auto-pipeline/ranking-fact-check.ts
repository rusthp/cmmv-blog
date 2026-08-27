import { Application, Logger } from "@cmmv/core";

//@ts-ignore
import { RankingsService } from "@cmmv/blog/championships/rankings.service";

/**
 * Deterministic safety net for CS2 ranking/standing claims in AI-generated articles.
 * The generation prompts already instruct the model not to invent rankings, but this
 * cross-checks whatever it actually wrote against the real Valve regional standings
 * (synced by RankingsService) instead of just trusting prompt compliance.
 */

const logger = new Logger("RankingFactCheck");

export interface FactCheckResult {
    flagged: boolean;
    notes?: string;
}

const CS2_INDICATOR = /\bcs2\b|counter-strike|counter strike/i;

// Only patterns that unambiguously frame a number as a ranking/standing position —
// deliberately excludes bare "#N" or generic numbers, which collide with round scores,
// map picks, patch numbers, etc. and would cause false positives.
const POSITION_PATTERNS: RegExp[] = [
    /\btop\s?(\d{1,2})\b/gi,
    /\brank(?:ing)?\s*#?\s*(\d{1,2})\b/gi,
    /\bposi[cç][aã]o\s*#?\s*(\d{1,2})\b/gi,
    /\bposition\s*#?\s*(\d{1,2})\b/gi,
    /\bcolocaç[aã]o\s*#?\s*(\d{1,2})\b/gi,
];

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ');
}

function splitSentences(text: string): string[] {
    return text.split(/(?<=[.!?\n])\s+/).filter(s => s.trim().length > 0);
}

/**
 * Checks a generated CS2 article's title+content for ranking/standing claims about
 * known teams, and flags it if a claimed position doesn't match the real, currently
 * synced Valve global standing for that team.
 *
 * Fails OPEN (never flags) if the rankings data/service itself is unavailable — a
 * missing dependency shouldn't block the whole content pipeline. Only fails CLOSED
 * (flags for manual review) when it can positively confirm a mismatch.
 */
export async function checkRankingFacts(params: {
    title: string;
    content: string;
    category: string;
}): Promise<FactCheckResult> {
    const { title, content, category } = params;
    const haystackForTopic = `${category} ${title}`;

    if (!CS2_INDICATOR.test(haystackForTopic))
        return { flagged: false };

    const plainText = stripHtml(`${title}. ${content}`);

    // Cheap short-circuit: skip the rankings fetch entirely if nothing in the text
    // even looks like a ranking/position claim.
    if (!POSITION_PATTERNS.some(rx => { rx.lastIndex = 0; return rx.test(plainText); }))
        return { flagged: false };

    let rankingsService: any;
    try {
        rankingsService = Application.resolveProvider(RankingsService);
    } catch (err) {
        logger.warn(`Could not resolve RankingsService, skipping ranking fact-check: ${err instanceof Error ? err.message : err}`);
        return { flagged: false };
    }

    let rankings: Array<{ teamName: string; standing: number }>;
    try {
        rankings = await rankingsService.getRankings('global', 30);
    } catch (err) {
        logger.warn(`Could not fetch CS2 rankings, skipping ranking fact-check: ${err instanceof Error ? err.message : err}`);
        return { flagged: false };
    }

    if (!rankings || rankings.length === 0)
        return { flagged: false };

    const sentences = splitSentences(plainText);
    const mismatches = new Set<string>();

    for (const sentence of sentences) {
        for (const team of rankings) {
            if (!team.teamName || typeof team.standing !== 'number') continue;

            const teamRx = new RegExp(`(?<![\\w])${escapeRegex(team.teamName)}(?![\\w])`, 'i');
            if (!teamRx.test(sentence)) continue;

            for (const pattern of POSITION_PATTERNS) {
                pattern.lastIndex = 0;
                let posMatch: RegExpExecArray | null;
                while ((posMatch = pattern.exec(sentence)) !== null) {
                    const claimed = parseInt(posMatch[1], 10);
                    if (claimed >= 1 && claimed <= 30 && claimed !== team.standing) {
                        mismatches.add(
                            `"${team.teamName}" citado com posição/ranking ${claimed}, mas o ranking oficial Valve (global) atual é #${team.standing}.`
                        );
                    }
                }
            }
        }
    }

    if (mismatches.size === 0)
        return { flagged: false };

    return {
        flagged: true,
        notes: Array.from(mismatches).join(' | '),
    };
}
