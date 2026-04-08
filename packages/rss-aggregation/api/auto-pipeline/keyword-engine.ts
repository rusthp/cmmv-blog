import { Logger, Config, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { PIPELINE_STATE } from "./pipeline-constants";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

export interface KeywordResult {
    mainKeyword: string;
    variations: string[];
    seoScore: number;
}

/**
 * KeywordEngineWorker — runs after classification, before generation.
 *
 * For each CLASSIFIED item, generates:
 *   - mainKeyword: primary long-tail keyword (3-5 words, specific)
 *   - variations: 3-4 keyword variations for content depth
 *   - seoScore: estimated ranking difficulty 0-100 (lower = easier to rank)
 *
 * Items transition: CLASSIFIED → KEYWORD_PENDING → KEYWORD_DONE
 * Generation worker reads KEYWORD_DONE instead of CLASSIFIED.
 */
export class KeywordEngineWorker {
    private static readonly logger = new Logger("KeywordEngineWorker");
    private static isRunning = false;

    async run(): Promise<void> {
        if (KeywordEngineWorker.isRunning) {
            KeywordEngineWorker.logger.log("[pipeline] keywordEngine already running, skipping");
            return;
        }

        KeywordEngineWorker.isRunning = true;

        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const language = Config.get<string>("blog.language", "pt-BR");
            const maxPerCycle = Config.get<number>("blog.autoPipelineMaxPostsPerCycle", 10);
            const maxAttempts = Config.get<number>("blog.autoPipelineMaxAttempts", 3);

            KeywordEngineWorker.logger.log("[pipeline] keywordEngine: Starting keyword cycle");

            const items = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.CLASSIFIED,
                rejected: false,
                limit: maxPerCycle,
                sortBy: "relevance",
                sort: "DESC",
            });

            if (!items || items.data.length === 0) {
                KeywordEngineWorker.logger.log("[pipeline] keywordEngine: No classified items");
                return;
            }

            KeywordEngineWorker.logger.log(`[pipeline] keywordEngine: Processing ${items.data.length} items`);

            const aiContentService: any = Application.resolveProvider(AIContentService);

            // Process in batches of 5 for efficiency
            const batchSize = 5;
            for (let i = 0; i < items.data.length; i += batchSize) {
                const batch = items.data.slice(i, i + batchSize);

                // Lock batch
                for (const item of batch) {
                    await Repository.updateOne(
                        FeedRawEntity,
                        Repository.queryBuilder({ id: item.id }),
                        { pipelineState: PIPELINE_STATE.KEYWORD_PENDING }
                    );
                }

                const batchInput = batch.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    category: item.category || "",
                    description: (item.content || "").substring(0, 200),
                }));

                const prompt = `You are an SEO keyword strategist for an eSports news site covering CS2, League of Legends, Valorant, DOTA 2, and other competitive games.

For each article below, generate targeted SEO keywords in ${language}.

RULES:
- mainKeyword: 3-5 words, long-tail, specific. Include game name + event/patch/player/date when available.
  GOOD: "cs2 atualização abril 2026 mirage", "loud furia vct 2026 resultado"
  BAD: "cs2 update", "notícias esports"
- variations: 3 alternative keyword phrasings of the mainKeyword (different word order, synonyms, search intent)
- seoScore: 0-100. Lower = easier to rank. Estimate based on how niche/specific the keyword is.
  - 0-30: very specific (player name + match + date) → easy to rank
  - 31-60: moderately specific (game + patch + change) → medium
  - 61-100: generic (just game name or broad topic) → hard

Return ONLY a valid JSON array, no extra text:
[
  {
    "id": "item-id",
    "mainKeyword": "primary keyword here",
    "variations": ["variation 1", "variation 2", "variation 3"],
    "seoScore": 25
  }
]

Articles:
${JSON.stringify(batchInput)}`;

                try {
                    const response = await aiContentService.generateContent(prompt);
                    if (!response) throw new Error("No AI response");

                    let results: Array<{ id: string; mainKeyword: string; variations: string[]; seoScore: number }>;

                    try {
                        const jsonMatch = response.match(/\[[\s\S]*\]/);
                        if (!jsonMatch) throw new Error("No JSON array in response");
                        results = JSON.parse(jsonMatch[0]);
                    } catch {
                        throw new Error(`Failed to parse keyword response: ${response.substring(0, 200)}`);
                    }

                    const resultMap = new Map(results.map(r => [r.id, r]));

                    for (const item of batch) {
                        const kw = resultMap.get(item.id);

                        if (kw && kw.mainKeyword) {
                            await Repository.updateOne(
                                FeedRawEntity,
                                Repository.queryBuilder({ id: item.id }),
                                {
                                    pipelineState: PIPELINE_STATE.KEYWORD_DONE,
                                    seoMainKeyword: kw.mainKeyword.trim().substring(0, 100),
                                    seoKeywordVariations: (kw.variations || []).slice(0, 4),
                                    seoScore: kw.seoScore ?? 50,
                                }
                            );
                            this.log(item.id, `keywords: "${kw.mainKeyword}" (score: ${kw.seoScore})`);
                        } else {
                            // No keyword generated — skip to generation without it
                            await Repository.updateOne(
                                FeedRawEntity,
                                Repository.queryBuilder({ id: item.id }),
                                { pipelineState: PIPELINE_STATE.KEYWORD_DONE }
                            );
                            this.log(item.id, "no keyword generated, passing through");
                        }
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    KeywordEngineWorker.logger.error(`[pipeline] keywordEngine batch error: ${msg}`);

                    // Revert batch to CLASSIFIED so generation can still pick them up
                    for (const item of batch) {
                        const raw = await Repository.findOne(FeedRawEntity, { id: item.id });
                        if (!raw) continue;
                        const attempts = (raw.aiAttempts || 0) + 1;
                        if (attempts >= maxAttempts) {
                            await Repository.updateOne(
                                FeedRawEntity,
                                Repository.queryBuilder({ id: item.id }),
                                { pipelineState: PIPELINE_STATE.CLASSIFIED, aiAttempts: attempts }
                            );
                        } else {
                            await Repository.updateOne(
                                FeedRawEntity,
                                Repository.queryBuilder({ id: item.id }),
                                { pipelineState: PIPELINE_STATE.CLASSIFIED, aiAttempts: attempts }
                            );
                        }
                    }
                }
            }

            KeywordEngineWorker.logger.log("[pipeline] keywordEngine: Cycle complete");
        } catch (error) {
            KeywordEngineWorker.logger.error(
                `[pipeline] keywordEngine: Unexpected error: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            KeywordEngineWorker.isRunning = false;
        }
    }

    private log(id: string, msg: string) {
        KeywordEngineWorker.logger.log(`[pipeline][${id}] ${msg}`);
    }
}
