/**
 * Shared constants and types for the RSS aggregation pipeline.
 */

export const PIPELINE_STATE = {
    PENDING: 'pending',
    CLASSIFYING: 'classifying',
    CLASSIFIED: 'classified',
    KEYWORD_PENDING: 'keyword_pending',
    KEYWORD_DONE: 'keyword_done',
    GENERATING: 'generating',
    GENERATED: 'generated',
    NEEDS_REVIEW: 'needs_review',
    POSTING: 'posting',
    DONE: 'done',
    FAILED: 'failed',
    REJECTED: 'rejected',
} as const;

export type PipelineState = typeof PIPELINE_STATE[keyof typeof PIPELINE_STATE];

export interface PipelineLogger {
    log(rawId: string, message: string): void;
    error(rawId: string, message: string): void;
}

export interface GeneratedContent {
    title: string;
    content: string;
    tags: string[];
    categories: string[];
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
}

// ─── Posting priority ─────────────────────────────────────────────────────
// Esports news goes stale fast: a championship win or a roster move the day it
// happens must jump ahead of an older same-"relevance" preview still sitting in
// the backlog. The AI `relevance` (1-100) does not know event type or age, so we
// layer an event-type weight and a freshness boost on top of it. Both the
// generation and the posting selection sort by this, so a hot item is picked up
// end-to-end, not buried behind the queue.
//
// Weights are intentionally far larger than `relevance` (0-100): type and
// freshness drive the order, relevance only breaks near-ties.
export const PRIORITY_TYPE = {
    CHAMPION: 1000, // won a title / is champion / lifted the trophy
    ROSTER: 500,    // signing, transfer, benching, new lineup, roster announcement
    RESULT: 300,    // match win/loss, advanced, eliminated, reached a final
    OTHER: 0,       // player note, generic coverage
} as const;

const normalizeTitle = (title: string): string =>
    (title || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// A championship WIN, not mere tournament coverage. "campeonato" (tournament)
// must NOT match here — only "campeao/campea", "titulo", "conquista", etc.
const RE_CHAMPION = /\b(campea|campea[o]|bicampe|tricampe|tetracampe|conquist|levanta a taca|leva o titulo|fatura o titulo|e campe|sao campe|campeon(a|es) d)/;
const RE_ROSTER = /(contrata|anuncia|oficializ|e o novo|reforco|reforca|bench|banco de reservas|deixa[m]? a|sai d[ao]|sai para|roster|line ?up|free[ -]?agent|acerta com|fecha com|nova contratacao|novo integrante|retorna (a|para)|volta (a|para)|agora (sou|somos)|assina com)/;
const RE_RESULT = /(vence|venceu|derrota|elimina|avanca|classifica|atropela|bate |supera|semifina|finalist|vaga n[aà] final|chega (a|à|a ) final|estreia|enfrenta|empata)/;

export function priorityTypeScore(title: string): number {
    const t = normalizeTitle(title);
    if (RE_CHAMPION.test(t)) return PRIORITY_TYPE.CHAMPION;
    if (RE_ROSTER.test(t)) return PRIORITY_TYPE.ROSTER;
    if (RE_RESULT.test(t)) return PRIORITY_TYPE.RESULT;
    return PRIORITY_TYPE.OTHER;
}

export function freshnessScore(raw: any): number {
    const ts = new Date(raw?.truePubDate || raw?.pubDate || raw?.createdAt || 0).getTime();
    if (!ts) return 0;
    const ageH = (Date.now() - ts) / 3_600_000;
    if (ageH <= 24) return 800;
    if (ageH <= 48) return 400;
    if (ageH <= 72) return 150;
    if (ageH > 168) return -300; // older than a week: actively push down
    return 0;
}

// Higher = publish sooner. Compose type + freshness + base relevance.
export function computePriority(raw: any): number {
    const relevance = typeof raw?.relevance === 'number' ? raw.relevance : 0;
    return priorityTypeScore(raw?.title || '') + freshnessScore(raw) + relevance;
}
