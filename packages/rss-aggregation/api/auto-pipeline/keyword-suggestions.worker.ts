import { Logger } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { PIPELINE_STATE } from "./pipeline-constants";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
];

/**
 * KeywordSuggestionsWorker — enriches seoKeywordVariations using Google Autocomplete.
 *
 * Runs between keyword engine (:05/:35) and generation (:10/:40).
 * Picks items in KEYWORD_DONE state with a main keyword, fetches Google Suggest
 * results, and merges unique suggestions into seoKeywordVariations (max 8 total).
 *
 * Does NOT change pipelineState — runs in parallel to the pipeline.
 */
export class KeywordSuggestionsWorker {
    private static readonly logger = new Logger("KeywordSuggestionsWorker");
    private static isRunning = false;
    private static uaIndex = 0;

    async run(): Promise<void> {
        if (KeywordSuggestionsWorker.isRunning) {
            KeywordSuggestionsWorker.logger.log("[pipeline] keywordSuggestions already running, skipping");
            return;
        }

        KeywordSuggestionsWorker.isRunning = true;

        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");

            KeywordSuggestionsWorker.logger.log("[pipeline] keywordSuggestions: Starting enrichment cycle");

            // Find items with keywords but not yet enriched
            const items = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.KEYWORD_DONE,
                limit: 10,
                sortBy: "createdAt",
                sort: "DESC",
            });

            if (!items || items.data.length === 0) {
                KeywordSuggestionsWorker.logger.log("[pipeline] keywordSuggestions: No items to enrich");
                return;
            }

            // Filter to items that have a main keyword
            const eligible = items.data.filter((item: any) => item.seoMainKeyword);

            if (eligible.length === 0) {
                KeywordSuggestionsWorker.logger.log("[pipeline] keywordSuggestions: No items with seoMainKeyword");
                return;
            }

            KeywordSuggestionsWorker.logger.log(
                `[pipeline] keywordSuggestions: Enriching ${eligible.length} items`
            );

            let enrichedCount = 0;

            for (const item of eligible) {
                try {
                    const keyword = item.seoMainKeyword;
                    const currentVariations: string[] = item.seoKeywordVariations || [];

                    // Skip if already has 8+ variations
                    if (currentVariations.length >= 8) {
                        continue;
                    }

                    const suggestions = await this.fetchGoogleSuggestions(keyword);

                    if (suggestions.length === 0) {
                        continue;
                    }

                    // Merge and deduplicate
                    const existingLower = new Set(currentVariations.map(v => v.toLowerCase().trim()));
                    existingLower.add(keyword.toLowerCase().trim());

                    const newVariations = [...currentVariations];

                    for (const suggestion of suggestions) {
                        const normalized = suggestion.toLowerCase().trim();

                        if (existingLower.has(normalized)) continue;
                        if (normalized.length < 3 || normalized.length > 80) continue;

                        newVariations.push(suggestion.trim());
                        existingLower.add(normalized);

                        if (newVariations.length >= 8) break;
                    }

                    if (newVariations.length > currentVariations.length) {
                        await Repository.updateOne(
                            FeedRawEntity,
                            Repository.queryBuilder({ id: item.id }),
                            { seoKeywordVariations: newVariations }
                        );

                        enrichedCount++;
                        KeywordSuggestionsWorker.logger.log(
                            `[pipeline][${item.id}] keywordSuggestions: "${keyword}" → ${currentVariations.length} → ${newVariations.length} variations`
                        );
                    }

                    // Rate limiting: 1500ms delay between requests
                    await this.delay(1500);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    KeywordSuggestionsWorker.logger.log(
                        `[pipeline][${item.id}] keywordSuggestions: Error enriching: ${msg}`
                    );
                }
            }

            KeywordSuggestionsWorker.logger.log(
                `[pipeline] keywordSuggestions: Cycle complete. Enriched ${enrichedCount}/${eligible.length} items.`
            );
        } catch (error) {
            KeywordSuggestionsWorker.logger.error(
                `[pipeline] keywordSuggestions: Unexpected error: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            KeywordSuggestionsWorker.isRunning = false;
        }
    }

    /**
     * Fetch autocomplete suggestions from Google Suggest API.
     * Uses User-Agent rotation and returns an array of suggestion strings.
     */
    private async fetchGoogleSuggestions(keyword: string): Promise<string[]> {
        const encoded = encodeURIComponent(keyword);
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&q=${encoded}`;

        const ua = USER_AGENTS[KeywordSuggestionsWorker.uaIndex % USER_AGENTS.length];
        KeywordSuggestionsWorker.uaIndex++;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": ua,
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                KeywordSuggestionsWorker.logger.log(
                    `[pipeline] keywordSuggestions: Google Suggest returned ${response.status} for "${keyword}", skipping`
                );
                return [];
            }

            const data = await response.json() as [string, string[]];

            // Google Suggest returns [query, [suggestions]]
            if (!Array.isArray(data) || !Array.isArray(data[1])) {
                return [];
            }

            return data[1].filter(
                (s: string) => typeof s === "string" && s.length > 0
            );
        } catch (err) {
            clearTimeout(timeoutId);

            if (err instanceof Error && err.name === "AbortError") {
                KeywordSuggestionsWorker.logger.log(
                    `[pipeline] keywordSuggestions: Timeout fetching suggestions for "${keyword}"`
                );
            } else {
                const msg = err instanceof Error ? err.message : String(err);
                KeywordSuggestionsWorker.logger.log(
                    `[pipeline] keywordSuggestions: Fetch error for "${keyword}": ${msg}`
                );
            }

            return [];
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
