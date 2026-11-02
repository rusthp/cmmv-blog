/**
 * Deterministic content hygiene for rewritten articles.
 *
 * The AI rewrite sometimes carries over the SOURCE outlet's own promotion — social
 * follow CTAs, "confira as produções da ...", a trailing "Fonte:/Source:" line — and
 * dumps the raw lowercase SEO keyword into the body. The generation prompt asks the
 * model to omit these, but a prompt is not a guarantee, so we also strip them with
 * code before saving (and the theme strips the same patterns at render, which cleans
 * already-published posts). Keep both copies in sync.
 */

const SOCIAL = /(twitter|instagram|threads|bluesky|facebook|tiktok|youtube|spotify|nas redes)/i;
const CTA = /(siga|seguindo|acompanhe|confira as produções|fique por dentro)/i;

/** Remove whole <p> blocks that are source self-promotion or a "Fonte:/Source:" line. */
export function stripSourcePromo(html: string): string {
    if (!html) return html;
    // A trailing source credit is often malformed HTML — a <p> opened for the "Fonte:"
    // line while the previous <p> was never closed — so the per-<p> pass below would
    // swallow the body with it and not recognize it. Remove the Fonte paragraph (and any
    // <br> spacing before it) directly first.
    html = html.replace(
        /(?:<br\s*\/?>\s*)*<p\b[^>]*>\s*(?:<strong>\s*)?[^<\w]*(?:Fonte|Source)\s*:[\s\S]*?<\/p>/gi,
        ''
    );
    return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (block) => {
        const text = block.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
        // Allow a leading emoji / symbol before the label, e.g. "📸 Fonte:".
        const lead = text.replace(/^[^\p{L}]+/u, '');
        if (/^(Fonte|Source)\s*:/i.test(lead)) return '';
        if (CTA.test(text) && SOCIAL.test(text)) return '';
        return block;
    });
}

/**
 * Remove the filler <p> that dumped the raw lowercase SEO keyword verbatim
 * (e.g. "Para os fãs que acompanham o liquid g2 game changers championship 2026 ...").
 * Only acts on a multi-word keyword matched verbatim in lowercase — natural prose
 * capitalizes team/event names, so an exact lowercase hit is the SEO artifact, not copy.
 */
export function stripKeywordFiller(html: string, keyword?: string | null): string {
    if (!html || !keyword) return html;
    const kw = keyword.trim().toLowerCase();
    if (kw.split(/\s+/).length < 3) return html;
    return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (block) => {
        const text = block.replace(/<[^>]+>/g, ' ').toLowerCase();
        return text.includes(kw) ? '' : block;
    });
}

/** Full hygiene pass used by both the generation worker and the cleanup endpoint. */
export function sanitizeArticleContent(html: string, keyword?: string | null): string {
    return stripKeywordFiller(stripSourcePromo(html), keyword);
}
