import { Application, Logger } from "@cmmv/core";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

/**
 * Checks a generated article against the source it was written from, before publishing.
 *
 * 1. Deterministic: every score, rating/decimal, percentage and money amount in the
 *    article must also appear in the source.
 * 2. AI reviewer: a second model call lists article sentences the source does not
 *    support (names, teams, roles, results, quotes, events).
 *
 * Unsupported sentences are removed when they can be found verbatim in the HTML —
 * removing text cannot introduce anything new. Anything that can't be removed safely
 * (or a reviewer failure) flags the item for manual review instead of publishing.
 */

const logger = new Logger("SourceFactCheck");

export interface SourceCheckResult {
    content: string;
    flagged: boolean;
    notes?: string;
    removed: string[];
}

const ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' };

function decode(text: string): string {
    return text.replace(/&(nbsp|amp|quot|#39|lt|gt);/g, m => ENTITIES[m] || m);
}

function toText(html: string): string {
    return decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// Lowercase, no accents, decimal comma -> dot, so "1,85" and "1.85" compare equal.
function normalize(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/(\d),(\d)/g, '$1.$2');
}

function splitSentences(text: string): string[] {
    return text.split(/(?<=[.!?…])\s+(?=["“A-ZÀ-Ú0-9])/).map(s => s.trim()).filter(s => s.length > 0);
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SCORE = /\b(\d{1,2})\s*(?:a|x|×|-|–|:)\s*(\d{1,2})\b/g;
const DECIMAL = /\b\d+\.\d+\b/g;
const PERCENT = /\b(\d+(?:\.\d+)?)\s*%/g;
const MONEY = /(?:us\$|r\$|€|\$)\s*(\d[\d.]*)/g;

/** Numeric claims in `sentence` (normalized) that don't appear in `source` (normalized). */
function unsupportedNumbers(sentence: string, source: string): string[] {
    const missing: string[] = [];
    for (const m of sentence.matchAll(SCORE)) {
        const [a, b] = [m[1], m[2]];
        const near = (x: string, y: string) =>
            new RegExp(`(?<![\\d.])${x}(?![\\d.])[^0-9]{0,40}(?<![\\d.])${y}(?![\\d.])`).test(source);
        if (!near(a, b) && !near(b, a)) missing.push(m[0]);
    }
    const tokens = [
        ...[...sentence.matchAll(DECIMAL)].map(m => m[0]),
        ...[...sentence.matchAll(PERCENT)].map(m => m[1]),
        ...[...sentence.matchAll(MONEY)].map(m => m[1].replace(/\.$/, '')),
    ];
    for (const t of tokens) {
        if (!new RegExp(`(?<![\\d])${esc(t)}(?![\\d])`).test(source)) missing.push(t);
    }
    return missing;
}

async function askReviewer(articleText: string, sourceText: string): Promise<string[]> {
    const ai: any = Application.resolveProvider(AIContentService);
    const prompt = `
You are a fact-checker for an eSports news site. Compare the ARTICLE with its SOURCE.

List every sentence of the ARTICLE that states a fact NOT supported by the SOURCE:
names, which team a player/coach belongs to, roles, nationalities, results, scores,
placements, dates, prizes, quotes, specific plays or events, history of teams/players.
Translation or paraphrase of something the SOURCE says is supported.
Do NOT list opinion, commentary, predictions, rhetorical questions or generic analysis that
assert no concrete fact — e.g. "Sinceramente?", "Mas calma lá.", "Resta saber se…",
"A pressão nos playoffs é outra.", "Confesso que fiquei surpreso." Only list sentences that
state something concrete about the real world that the SOURCE does not back up.

Copy each listed sentence EXACTLY as it appears in the ARTICLE (verbatim, same punctuation).
Return ONLY JSON: {"unsupported": ["sentence 1", "sentence 2"]}. Empty list if everything is supported.

SOURCE:
${sourceText}

ARTICLE:
${articleText}
`;
    const response: string = await ai.generateContent(prompt);
    const json = (response || '').match(/\{[\s\S]*\}/);
    if (!json) throw new Error('reviewer returned no JSON');
    const parsed = JSON.parse(json[0]);
    if (!Array.isArray(parsed.unsupported)) throw new Error('reviewer JSON has no "unsupported" list');
    return parsed.unsupported.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim());
}

const QUOTES: Record<string, string> = { '“': '"', '”': '"', '„': '"', '‘': "'", '’': "'" };

/** Visible text of `html` (tags skipped, entities decoded, whitespace collapsed, quotes unified)
 *  with, for every text char, the [start, end) range it came from in the HTML. */
function textMap(html: string): { text: string; from: number[]; to: number[] } {
    let text = '';
    const from: number[] = [], to: number[] = [];
    const push = (ch: string, a: number, b: number) => {
        if (/\s/.test(ch)) {
            if (text.endsWith(' ') || text.length === 0) return;
            ch = ' ';
        }
        text += QUOTES[ch] || ch; from.push(a); to.push(b);
    };
    for (let i = 0; i < html.length;) {
        if (html[i] === '<') {
            const close = html.indexOf('>', i);
            const end = close < 0 ? html.length : close + 1;
            push(' ', i, end);
            i = end;
        } else if (html[i] === '&') {
            const m = html.slice(i).match(/^&(nbsp|amp|quot|#39|lt|gt);/);
            if (m) { push(ENTITIES[m[0]], i, i + m[0].length); i += m[0].length; }
            else { push('&', i, i + 1); i++; }
        } else { push(html[i], i, i + 1); i++; }
    }
    return { text, from, to };
}

const unify = (s: string) => s.replace(/\s+/g, ' ').replace(/[“”„‘’]/g, c => QUOTES[c]).trim();

/** Removes the visible text of `sentence` from the HTML, keeping every tag in the removed
 *  range so markup stays balanced (inline formatting / list items are fine). */
function removeSentence(html: string, sentence: string): string | null {
    const { text, from, to } = textMap(html);
    const target = unify(sentence);
    const i = text.indexOf(target);
    if (i < 0 || !target) return null;
    const start = from[i], end = to[i + target.length - 1];
    const keptTags = (html.slice(start, end).match(/<[^>]+>/g) || []).join('');
    return html.slice(0, start) + keptTags + html.slice(end);
}

// Drop elements left with no text after removals (repeat for nesting, e.g. <li><strong></strong></li>).
function cleanupEmpty(html: string): string {
    let prev = '';
    while (prev !== html) {
        prev = html;
        html = html.replace(/<(strong|em|b|i|a|span|p|li|blockquote|ul|ol)\b[^>]*>(\s|&nbsp;)*<\/\1>/g, '');
    }
    return html.replace(/<p>\s+/g, '<p>').replace(/\s+<\/p>/g, '</p>');
}

export async function checkAgainstSource(params: {
    title: string;
    content: string;
    source: string;
}): Promise<SourceCheckResult> {
    const { title, source } = params;
    let content = params.content;
    const sourceText = toText(source).substring(0, 15000);
    const sourceNorm = normalize(sourceText);
    const notes: string[] = [];
    const removed: string[] = [];
    let flagged = false;

    if (sourceText.length < 200) {
        return { content, flagged: true, notes: 'source text too short to verify the article', removed };
    }

    const titleMissing = unsupportedNumbers(normalize(title), sourceNorm);
    if (titleMissing.length) {
        flagged = true;
        notes.push(`title has numbers not in source: ${titleMissing.join(', ')}`);
    }

    // Layer 1 — deterministic numbers
    const toRemove = new Set<string>();
    for (const sentence of splitSentences(toText(content))) {
        const missing = unsupportedNumbers(normalize(sentence), sourceNorm);
        if (missing.length) toRemove.add(sentence);
    }

    // Layer 2 — AI reviewer (fails closed: an unverified article is not published)
    try {
        const articleText = toText(content);
        const visible = textMap(content).text;
        for (const s of await askReviewer(articleText, sourceText)) {
            if (visible.includes(unify(s))) toRemove.add(s);
            else notes.push(`reviewer flagged a sentence not found verbatim: "${s.substring(0, 80)}"`);
        }
    } catch (err: any) {
        flagged = true;
        notes.push(`AI reviewer failed: ${err?.message || err}`);
    }

    // A reviewer that rejects most of the article is unreliable (or the article is): keep it
    // intact for a human instead of shredding it, and don't publish.
    const totalSentences = splitSentences(toText(content)).length || 1;
    if (toRemove.size / totalSentences > 0.5) {
        return {
            content: params.content,
            flagged: true,
            notes: [`${toRemove.size}/${totalSentences} sentences unsupported by the source — sent to manual review`, ...notes].join(' | '),
            removed: [],
        };
    }

    for (const sentence of toRemove) {
        const next = removeSentence(content, sentence);
        if (next === null) {
            flagged = true;
            notes.push(`unsupported sentence could not be removed safely: "${sentence.substring(0, 80)}"`);
        } else {
            content = next;
            removed.push(sentence);
        }
    }

    // Unresolvable reviewer flags (not found verbatim) also block auto-publishing.
    if (notes.some(n => n.startsWith('reviewer flagged'))) flagged = true;

    content = cleanupEmpty(content);
    if (toText(content).length < 400) {
        flagged = true;
        notes.push('too little verified text left after removing unsupported sentences');
    }

    if (removed.length) logger.log(`removed ${removed.length} unsupported sentence(s)`);
    return { content, flagged, notes: notes.join(' | ') || undefined, removed };
}
