import { Logger, Config, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { PIPELINE_STATE, GeneratedContent } from "./pipeline-constants";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";
//@ts-ignore
import { PromptsServiceTools } from "@cmmv/blog/prompts/prompts.service";

/**
 * Worker responsible for generating AI content from classified feed items.
 * Uses a 2-pass approach: initial generation + continuation for depth.
 */
export class GenerationWorker {
    private static readonly logger = new Logger("GenerationWorker");
    private static isRunning = false;
    private static activeAIJobs = 0;

    async run(): Promise<void> {
        if (GenerationWorker.isRunning) {
            GenerationWorker.logger.log("[pipeline] generateWorker already running, skipping");
            return;
        }

        GenerationWorker.isRunning = true;

        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const maxConcurrent = Config.get<number>("blog.autoPipelineMaxConcurrentAI", 2);
            const maxPerCycle = Config.get<number>("blog.autoPipelineMaxPostsPerCycle", 3);
            const maxAttempts = Config.get<number>("blog.autoPipelineMaxAttempts", 3);
            const promptId = Config.get<string>("blog.autoPipelinePromptId", "");

            GenerationWorker.logger.log("[pipeline] generateWorker: Starting generation cycle");

            // Prefer KEYWORD_DONE items; fall back to CLASSIFIED if keyword engine hasn't run yet
            let classifiedItems = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.KEYWORD_DONE,
                rejected: false,
                limit: maxPerCycle,
                sortBy: "relevance",
                sort: "DESC"
            });

            if (!classifiedItems || classifiedItems.data.length === 0) {
                classifiedItems = await Repository.findAll(FeedRawEntity, {
                    pipelineState: PIPELINE_STATE.CLASSIFIED,
                    rejected: false,
                    limit: maxPerCycle,
                    sortBy: "relevance",
                    sort: "DESC"
                });
            }

            if (!classifiedItems || classifiedItems.data.length === 0) {
                GenerationWorker.logger.log("[pipeline] generateWorker: No items to generate");
                return;
            }

            GenerationWorker.logger.log(`[pipeline] generateWorker: Processing ${classifiedItems.data.length} items`);

            for (const raw of classifiedItems.data) {
                if (GenerationWorker.activeAIJobs >= maxConcurrent) {
                    GenerationWorker.logger.log(`[pipeline] generateWorker: Rate limit reached (${maxConcurrent} concurrent), stopping`);
                    break;
                }

                const fromState = raw.pipelineState === PIPELINE_STATE.KEYWORD_DONE
                    ? PIPELINE_STATE.KEYWORD_DONE
                    : PIPELINE_STATE.CLASSIFIED;

                try {
                    const locked = await this.transitionState(
                        raw.id,
                        fromState,
                        PIPELINE_STATE.GENERATING,
                        { aiAttempts: raw.aiAttempts || 0 }
                    );

                    if (!locked) continue;

                    GenerationWorker.activeAIJobs++;

                    try {
                        const result = await this.generateContentForRaw(raw, promptId);

                        if (result) {
                            const updatePayload: Record<string, any> = {
                                pipelineState: PIPELINE_STATE.GENERATED,
                                title: result.title,
                                content: result.content,
                                suggestedTags: result.tags || [],
                                suggestedCategories: result.categories || [],
                            };

                            if (result.metaTitle) updatePayload.seoMetaTitle = result.metaTitle;
                            if (result.metaDescription) updatePayload.seoMetaDescription = result.metaDescription;
                            if (result.slug) updatePayload.seoSlug = result.slug;

                            await Repository.updateOne(
                                FeedRawEntity,
                                Repository.queryBuilder({ id: raw.id }),
                                updatePayload
                            );

                            this.pipelineLog(raw.id, `generated: title="${result.title?.substring(0, 50)}..."`);
                        } else {
                            await this.handleFailure(raw.id, PIPELINE_STATE.GENERATING, "AI returned no content", maxAttempts);
                        }
                    } finally {
                        GenerationWorker.activeAIJobs--;
                    }
                } catch (error) {
                    GenerationWorker.activeAIJobs = Math.max(0, GenerationWorker.activeAIJobs - 1);
                    await this.handleFailure(
                        raw.id,
                        PIPELINE_STATE.GENERATING,
                        error instanceof Error ? error.message : String(error),
                        maxAttempts
                    );
                }
            }

            GenerationWorker.logger.log("[pipeline] generateWorker: Generation cycle complete");
        } catch (error) {
            GenerationWorker.logger.error(
                `[pipeline] generateWorker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            GenerationWorker.isRunning = false;
        }
    }

    /**
     * Generate AI content for a raw feed item (2-pass: generate + continue).
     */
    private async generateContentForRaw(
        raw: any,
        promptId: string,
    ): Promise<GeneratedContent | null> {
        const promptService: any = Application.resolveProvider(PromptsServiceTools);
        const aiContentService: any = Application.resolveProvider(AIContentService);
        const language = Config.get("blog.language");
        const maxAttempts = Config.get<number>("blog.autoPipelineMaxAttempts", 3);

        // Truncate content to ~2000 chars to stay within Groq TPM limits
        // The prompt template + defaultPrompt alone is ~10k tokens, so content must be small
        const MAX_CONTENT_CHARS = 2000;
        const contentToProcess = {
            title: raw.title,
            content: raw.content
                ? raw.content.length > MAX_CONTENT_CHARS
                    ? raw.content.substring(0, MAX_CONTENT_CHARS) + '...[truncated]'
                    : raw.content
                : '',
            category: raw.category,
        };

        // ── Inject keyword context if available ──
        const keywordContext = raw.seoMainKeyword
            ? `\n            TARGET SEO KEYWORD: "${raw.seoMainKeyword}"
            KEYWORD VARIATIONS: ${(raw.seoKeywordVariations || []).join(', ')}
            SEO SCORE: ${raw.seoScore ?? 50}/100 (lower = easier to rank — this is a ${(raw.seoScore ?? 50) < 40 ? 'high-opportunity, low-competition' : 'competitive'} keyword)

            IMPORTANT: Build this article around the target keyword above. Use it naturally in the title, first paragraph, and subheadings.
            The metaTitle MUST start with or include: "${raw.seoMainKeyword}"`
            : '';

        // ── Pass 1: Generate initial content ──
        const prompt = `
            You are a content generator for a news aggregation platform that uses the TipTap editor.

            Please transform the following content by:
            1. Translating it to ${language}
            ${keywordContext}
            ${await promptService.getDefaultPrompt(promptId)}

            IMPORTANT: DO NOT write any conclusion or summary paragraph. The article should feel unfinished and open-ended.
            It should not wrap up the discussion or provide closing thoughts. Avoid phrases like "In conclusion," "To summarize,"
            "Finally," or any language that suggests the article is ending.

            - ONLY use images that exist in the original post - DO NOT create or generate new images that don't exist

            Here is the content to transform:

            Title: ${contentToProcess.title}

            Category: ${contentToProcess.category || 'General'}

            Content: ${contentToProcess.content}

            Return the transformed content in JSON format with the following fields:
            {
              "title": "translated and rewritten title",
              "content": "HTML-formatted content with proper tags",
              "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
              "suggestedCategories": ["categoryName1", "categoryName2"],
              "metaTitle": "SEO title with primary long-tail keyword, max 60 characters, no brand suffix",
              "metaDescription": "Compelling meta description with primary keyword, 120-155 characters, includes a call-to-action or key insight",
              "slug": "url-friendly-slug-with-primary-keyword-in-kebab-case-max-60-chars"
            }

            SEO RULES for metaTitle, metaDescription, and slug:
            - metaTitle: Include the primary long-tail keyword near the start. Max 60 chars. No brand suffix. Be specific (e.g., "CS2 April 2026 Update: Mirage Changes and Recoil Fix" not "CS2 Update").
            - metaDescription: 120-155 chars. Include primary keyword naturally. End with a benefit or call-to-action ("Learn what changed", "See the full patch notes", "Find out who moved").
            - slug: lowercase, hyphens only, primary keyword first, max 60 chars, no stopwords (the, a, an, in, of, for). Example: "cs2-april-2026-update-mirage-changes" not "the-latest-cs2-update-from-valve".`;

        this.pipelineLog(raw.id, `generating (attempt ${(raw.aiAttempts || 0) + 1}/${maxAttempts})`);
        const generatedText = await aiContentService.generateContent(prompt);

        if (!generatedText) throw new Error('No content generated by AI (pass 1)');

        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : null;

        if (!jsonContent) throw new Error('No JSON content found in AI response (pass 1)');

        const parsedContent = JSON.parse(jsonContent);

        if (parsedContent.title && parsedContent.title.length > 100) {
            parsedContent.title = parsedContent.title.substring(0, 97) + '...';
        }

        // ── Pass 2: Generate continuation ──
        this.pipelineLog(raw.id, "generating continuation (pass 2)");

        const continuationPrompt = `
            You are a content generator for a news aggregation platform that uses the TipTap editor.

            I've already generated part of the content below, but I need you to continue this article with more details, examples, or insights. Keep the same style and flow as the existing content.

            1. Translating it to ${language}

            - ONLY use images that exist in the original post - DO NOT create or generate new images that don't exist

            Original prompt:
            ${await promptService.getRandomPrompt(promptId)}

            Original Title: ${contentToProcess.title}
            Category: ${contentToProcess.category || 'General'}

            Here's the content already generated:
            ${parsedContent.content}

            Please continue from where this left off, adding depth, details, and value. Make it feel like a natural extension.
            Your continuation should be at least as long as the original text.

            IMPORTANT: DO NOT write any conclusion or summary paragraph. The article should feel unfinished and open-ended.
            It should not wrap up the discussion or provide closing thoughts. Avoid phrases like "In conclusion," "To summarize,"
            "Finally," or any language that suggests the article is ending.

            Return only the continuation in JSON format with the following field:
            {
              "continuation": "HTML-formatted content with proper tags that continues the existing text"
            }
            `;

        try {
            const continuationText = await aiContentService.generateContent(continuationPrompt);

            if (continuationText) {
                const continuationJsonMatch = continuationText.match(/\{[\s\S]*\}/);
                const continuationJsonContent = continuationJsonMatch ? continuationJsonMatch[0] : null;

                if (continuationJsonContent) {
                    const parsedContinuation = JSON.parse(continuationJsonContent);

                    if (parsedContinuation.continuation) {
                        const lastClosingTagMatch = parsedContent.content.match(/<\/[^>]+>$/);

                        if (lastClosingTagMatch) {
                            const insertPosition = parsedContent.content.lastIndexOf(lastClosingTagMatch[0]);
                            parsedContent.content =
                                parsedContent.content.substring(0, insertPosition) +
                                parsedContinuation.continuation +
                                parsedContent.content.substring(insertPosition);
                        } else {
                            parsedContent.content += parsedContinuation.continuation;
                        }

                        this.pipelineLog(raw.id, "continuation merged successfully");
                    }
                }
            }
        } catch (continuationError) {
            this.pipelineLog(raw.id, `continuation failed (non-fatal): ${continuationError}`);
        }

        // Validate and trim SEO fields
        const metaTitle = typeof parsedContent.metaTitle === 'string'
            ? parsedContent.metaTitle.trim().substring(0, 60)
            : undefined;

        const metaDescription = typeof parsedContent.metaDescription === 'string'
            ? parsedContent.metaDescription.trim().substring(0, 155)
            : undefined;

        const slug = typeof parsedContent.slug === 'string'
            ? parsedContent.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').substring(0, 60)
            : undefined;

        return {
            title: parsedContent.title,
            content: parsedContent.content,
            tags: parsedContent.suggestedTags || [],
            categories: parsedContent.suggestedCategories || [],
            metaTitle,
            metaDescription,
            slug,
        };
    }

    // ─── Helpers ──────────────────────────────────────────────

    private pipelineLog(rawId: string, message: string) {
        GenerationWorker.logger.log(`[pipeline][${rawId}] ${message}`);
    }

    private pipelineError(rawId: string, message: string) {
        GenerationWorker.logger.error(`[pipeline][${rawId}] ${message}`);
    }

    private async transitionState(
        rawId: string,
        fromState: string,
        toState: string,
        extraData?: Record<string, any>,
    ): Promise<boolean> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, { id: rawId, pipelineState: fromState });

        if (!raw) {
            this.pipelineError(rawId, `State transition failed: expected '${fromState}' but item not found in that state`);
            return false;
        }

        await Repository.updateOne(
            FeedRawEntity,
            Repository.queryBuilder({ id: rawId }),
            { pipelineState: toState, ...extraData }
        );

        this.pipelineLog(rawId, `${fromState} → ${toState}`);
        return true;
    }

    private async handleFailure(rawId: string, currentState: string, error: string, maxAttempts: number): Promise<void> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, { id: rawId });
        if (!raw) return;

        const attempts = (raw.aiAttempts || 0) + 1;

        if (attempts >= maxAttempts) {
            await this.transitionState(rawId, currentState, PIPELINE_STATE.FAILED, { aiAttempts: attempts });
            this.pipelineError(rawId, `Max attempts (${maxAttempts}) reached. Marked as failed. Error: ${error}`);
        } else {
            // Retry to KEYWORD_DONE if keywords were already generated, otherwise CLASSIFIED
            const retryState = raw.seoMainKeyword ? PIPELINE_STATE.KEYWORD_DONE : PIPELINE_STATE.CLASSIFIED;
            await Repository.updateOne(
                FeedRawEntity,
                Repository.queryBuilder({ id: rawId }),
                { pipelineState: retryState, aiAttempts: attempts }
            );
            this.pipelineLog(rawId, `Attempt ${attempts}/${maxAttempts} failed, reset to '${retryState}' for retry. Error: ${error}`);
        }
    }
}
