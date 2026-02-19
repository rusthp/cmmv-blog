import {
    Service, Logger,
    Config, Cron,
    CronExpression,
    Application
} from "@cmmv/core";

import {
    Repository, IsNull,
    MoreThanOrEqual, LessThanOrEqual
} from "@cmmv/repository";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";
//@ts-ignore
import { PromptsServiceTools } from "@cmmv/blog/prompts/prompts.service";

// Pipeline states for FeedRaw items
const PIPELINE_STATE = {
    PENDING: 'pending',
    CLASSIFYING: 'classifying',
    CLASSIFIED: 'classified',
    GENERATING: 'generating',
    GENERATED: 'generated',
    POSTING: 'posting',
    DONE: 'done',
    FAILED: 'failed',
    REJECTED: 'rejected',
} as const;

@Service()
export class AutoPipelineService {
    private static readonly logger = new Logger("AutoPipelineService");
    private static activeAIJobs = 0;
    private static isClassifying = false;
    private static isGenerating = false;
    private static isPosting = false;

    constructor(
        private readonly aiContentService: AIContentService
    ) { }

    // ─── Kill Switch ──────────────────────────────────────────
    private isEnabled(): boolean {
        return Config.get<boolean>("blog.autoPipelineEnabled", false);
    }

    private getMaxConcurrentAI(): number {
        return Config.get<number>("blog.autoPipelineMaxConcurrentAI", 2);
    }

    private getMaxAttempts(): number {
        return Config.get<number>("blog.autoPipelineMaxAttempts", 3);
    }

    private getRelevanceThreshold(): number {
        return Config.get<number>("blog.autoPipelineRelevanceThreshold", 70);
    }

    private getMaxPostsPerCycle(): number {
        return Config.get<number>("blog.autoPipelineMaxPostsPerCycle", 3);
    }

    // ─── Adaptive Scheduling Config ──────────────────────────
    private getBaseIntervalMinutes(): number {
        return Config.get<number>("blog.autoPipelineBaseIntervalMinutes", 60);
    }

    private getMinIntervalMinutes(): number {
        return Config.get<number>("blog.autoPipelineMinIntervalMinutes", 20);
    }

    private getBacklogFactor(): number {
        return Config.get<number>("blog.autoPipelineBacklogFactor", 5);
    }

    private getDefaultAuthor(): string {
        return Config.get<string>("blog.autoPipelineDefaultAuthor", "");
    }

    private getDefaultCategories(): string[] {
        return Config.get<string[]>("blog.autoPipelineDefaultCategories", []);
    }

    private getPromptId(): string {
        return Config.get<string>("blog.autoPipelinePromptId", "");
    }

    private getSiteName(): string {
        return Config.get<string>("blog.autoPipelineSiteName", "CMMV");
    }

    // ─── Logging Helper ───────────────────────────────────────
    private pipelineLog(rawId: string, message: string) {
        AutoPipelineService.logger.log(`[pipeline][${rawId}] ${message}`);
    }

    private pipelineError(rawId: string, message: string) {
        AutoPipelineService.logger.error(`[pipeline][${rawId}] ${message}`);
    }

    // ─── State Transition ─────────────────────────────────────
    private async transitionState(
        rawId: string,
        fromState: string,
        toState: string,
        extraData?: Record<string, any>
    ): Promise<boolean> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");

        const raw = await Repository.findOne(FeedRawEntity, {
            id: rawId,
            pipelineState: fromState
        });

        if (!raw) {
            this.pipelineError(rawId, `State transition failed: expected '${fromState}' but item not found in that state`);
            return false;
        }

        const updateData: any = {
            pipelineState: toState,
            ...extraData
        };

        await Repository.updateOne(
            FeedRawEntity,
            Repository.queryBuilder({ id: rawId }),
            updateData
        );

        this.pipelineLog(rawId, `${fromState} → ${toState}`);
        return true;
    }

    // ─── Retry Helper ─────────────────────────────────────────
    private async handleFailure(rawId: string, currentState: string, error: string): Promise<void> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, { id: rawId });

        if (!raw) return;

        const attempts = (raw.aiAttempts || 0) + 1;
        const maxAttempts = this.getMaxAttempts();

        if (attempts >= maxAttempts) {
            await this.transitionState(rawId, currentState, PIPELINE_STATE.FAILED, {
                aiAttempts: attempts
            });
            this.pipelineError(rawId, `Max attempts (${maxAttempts}) reached. Marked as failed. Error: ${error}`);
        } else {
            // Reset to previous stable state for retry
            const retryState = currentState === PIPELINE_STATE.CLASSIFYING
                ? PIPELINE_STATE.PENDING
                : currentState === PIPELINE_STATE.GENERATING
                    ? PIPELINE_STATE.CLASSIFIED
                    : PIPELINE_STATE.GENERATED;

            await Repository.updateOne(
                FeedRawEntity,
                Repository.queryBuilder({ id: rawId }),
                {
                    pipelineState: retryState,
                    aiAttempts: attempts
                }
            );
            this.pipelineLog(rawId, `Attempt ${attempts}/${maxAttempts} failed, reset to '${retryState}' for retry. Error: ${error}`);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // WORKER 1: CLASSIFY
    // ═══════════════════════════════════════════════════════════

    @Cron(CronExpression.EVERY_2_HOURS)
    async classifyWorkerCron() {
        try {
            if (!this.isEnabled()) return;
            await this.classifyWorker();
        } catch (err) {
            console.error('[pipeline] classifyWorkerCron error:', err);
        }
    }

    async classifyWorker(): Promise<void> {
        if (AutoPipelineService.isClassifying) {
            AutoPipelineService.logger.log("[pipeline] classifyWorker already running, skipping");
            return;
        }

        AutoPipelineService.isClassifying = true;

        try {
            const classifyPrompt = Config.get("blog.classifyPrompt");
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");

            AutoPipelineService.logger.log("[pipeline] classifyWorker: Starting classification cycle");

            // Find items in 'pending' state that haven't been classified yet
            const rawItemsResponse = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.PENDING,
                rejected: false,
                postRef: IsNull(),
                limit: 20,
                sortBy: "pubDate",
                sort: "DESC"
            });

            if (!rawItemsResponse || rawItemsResponse.data.length === 0) {
                AutoPipelineService.logger.log("[pipeline] classifyWorker: No pending items to classify");
                return;
            }

            const rawItems = rawItemsResponse.data;
            AutoPipelineService.logger.log(`[pipeline] classifyWorker: Found ${rawItems.length} items to classify`);

            // Lock all items to 'classifying' state
            for (const item of rawItems) {
                await this.transitionState(item.id, PIPELINE_STATE.PENDING, PIPELINE_STATE.CLASSIFYING);
            }

            // Prepare items for AI classification
            const itemsForAI = rawItems.map((item: any) => ({
                id: item.id,
                title: item.title,
                description: item.content?.substring(0, 300) || '',
                category: item.category || ''
            }));

            const prompt = `
            You are a content classification system for a news aggregation blog.

            I'll provide you with a list of article titles, descriptions, and categories from various sources.

            Your task is to classify each article based on its relevance to:

            IMPORTANT: You must return ONLY a valid JSON array with no additional text or explanation.
            Each item in the array should contain:
            - id: the original ID
            - relevance: a score from 1-100 indicating relevance (higher = more relevant)
            - rejected: true if completely unrelated, false otherwise

            ${classifyPrompt || ''}

            Here are the items to classify:
            ${JSON.stringify(itemsForAI)}
            `;

            AutoPipelineService.logger.log("[pipeline] classifyWorker: Sending classification request to AI");
            const aiContentService: any = Application.resolveProvider(AIContentService);
            const aiResponse = await aiContentService.generateContent(prompt);

            if (!aiResponse) {
                // Mark all as failed
                for (const item of rawItems) {
                    await this.handleFailure(item.id, PIPELINE_STATE.CLASSIFYING, "No AI response for classification");
                }
                return;
            }

            let classificationResults: any[];

            try {
                try {
                    classificationResults = JSON.parse(aiResponse.trim());
                } catch {
                    const jsonMatch = aiResponse.match(/\[\s*\{.*\}\s*\]/s);
                    if (!jsonMatch)
                        throw new Error("No valid JSON array found in AI response");
                    classificationResults = JSON.parse(jsonMatch[0]);
                }

                if (!Array.isArray(classificationResults))
                    throw new Error("AI response is not an array");
            } catch (parseError) {
                AutoPipelineService.logger.error(`[pipeline] classifyWorker: Failed to parse AI response: ${parseError}`);
                for (const item of rawItems) {
                    await this.handleFailure(item.id, PIPELINE_STATE.CLASSIFYING, `Parse error: ${parseError}`);
                }
                return;
            }

            // Apply classification results
            const threshold = this.getRelevanceThreshold();

            for (const result of classificationResults) {
                try {
                    if (!result.id || typeof result.relevance !== 'number') continue;

                    const relevance = result.relevance;
                    const rejected = result.rejected === true || relevance < threshold;

                    const newState = rejected
                        ? PIPELINE_STATE.REJECTED
                        : PIPELINE_STATE.CLASSIFIED;

                    await Repository.updateOne(
                        FeedRawEntity,
                        Repository.queryBuilder({ id: result.id }),
                        {
                            pipelineState: newState,
                            relevance: relevance,
                            rejected: rejected
                        }
                    );

                    this.pipelineLog(result.id, `classified: relevance=${relevance}, ${rejected ? 'rejected' : 'accepted'}`);
                } catch (updateError) {
                    this.pipelineError(result.id, `Failed to update classification: ${updateError}`);
                }
            }

            // Handle items not in AI response (orphaned in 'classifying' state)
            const classifiedIds = new Set(classificationResults.map(r => r.id));
            for (const item of rawItems) {
                if (!classifiedIds.has(item.id)) {
                    await this.handleFailure(item.id, PIPELINE_STATE.CLASSIFYING, "Not included in AI classification response");
                }
            }

            AutoPipelineService.logger.log("[pipeline] classifyWorker: Classification cycle complete");
        } catch (error) {
            AutoPipelineService.logger.error(`[pipeline] classifyWorker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            AutoPipelineService.isClassifying = false;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // WORKER 2: GENERATE
    // ═══════════════════════════════════════════════════════════

    @Cron(CronExpression.EVERY_30_MINUTES)
    async generateWorkerCron() {
        try {
            if (!this.isEnabled()) return;
            await this.generateWorker();
        } catch (err) {
            console.error('[pipeline] generateWorkerCron error:', err);
        }
    }

    async generateWorker(): Promise<void> {
        if (AutoPipelineService.isGenerating) {
            AutoPipelineService.logger.log("[pipeline] generateWorker already running, skipping");
            return;
        }

        AutoPipelineService.isGenerating = true;

        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const maxConcurrent = this.getMaxConcurrentAI();
            const maxPerCycle = this.getMaxPostsPerCycle();
            const promptId = this.getPromptId();

            AutoPipelineService.logger.log("[pipeline] generateWorker: Starting generation cycle");

            // Find classified items ready for content generation
            const classifiedItems = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.CLASSIFIED,
                rejected: false,
                limit: maxPerCycle,
                sortBy: "relevance",
                sort: "DESC"
            });

            if (!classifiedItems || classifiedItems.data.length === 0) {
                AutoPipelineService.logger.log("[pipeline] generateWorker: No classified items to generate");
                return;
            }

            AutoPipelineService.logger.log(`[pipeline] generateWorker: Processing ${classifiedItems.data.length} items`);

            // Process items sequentially with rate limiting
            for (const raw of classifiedItems.data) {
                // Rate limiter check
                if (AutoPipelineService.activeAIJobs >= maxConcurrent) {
                    AutoPipelineService.logger.log(`[pipeline] generateWorker: Rate limit reached (${maxConcurrent} concurrent), stopping`);
                    break;
                }

                try {
                    // Lock state
                    const locked = await this.transitionState(
                        raw.id,
                        PIPELINE_STATE.CLASSIFIED,
                        PIPELINE_STATE.GENERATING,
                        { aiAttempts: (raw.aiAttempts || 0) }
                    );

                    if (!locked) continue;

                    AutoPipelineService.activeAIJobs++;

                    try {
                        const result = await this.generateContentForRaw(raw, promptId);

                        if (result) {
                            // Store generated content back in the raw item
                            await Repository.updateOne(
                                FeedRawEntity,
                                Repository.queryBuilder({ id: raw.id }),
                                {
                                    pipelineState: PIPELINE_STATE.GENERATED,
                                    title: result.title,
                                    content: result.content,
                                    suggestedTags: result.tags || [],
                                    suggestedCategories: result.categories || [],
                                }
                            );

                            this.pipelineLog(raw.id, `generated: title="${result.title?.substring(0, 50)}..."`);
                        } else {
                            await this.handleFailure(raw.id, PIPELINE_STATE.GENERATING, "AI returned no content");
                        }
                    } finally {
                        AutoPipelineService.activeAIJobs--;
                    }
                } catch (error) {
                    AutoPipelineService.activeAIJobs = Math.max(0, AutoPipelineService.activeAIJobs - 1);
                    await this.handleFailure(
                        raw.id,
                        PIPELINE_STATE.GENERATING,
                        error instanceof Error ? error.message : String(error)
                    );
                }
            }

            AutoPipelineService.logger.log("[pipeline] generateWorker: Generation cycle complete");
        } catch (error) {
            AutoPipelineService.logger.error(`[pipeline] generateWorker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            AutoPipelineService.isGenerating = false;
        }
    }

    /**
     * Generate AI content for a raw feed item (2-pass: generate + continue)
     */
    private async generateContentForRaw(
        raw: any,
        promptId: string
    ): Promise<{ title: string; content: string; tags: string[]; categories: string[] } | null> {
        const promptService: any = Application.resolveProvider(PromptsServiceTools);
        const aiContentService: any = Application.resolveProvider(AIContentService);
        const language = Config.get("blog.language");

        const contentToProcess = {
            title: raw.title,
            content: raw.content,
            category: raw.category
        };

        // ── Pass 1: Generate initial content ──
        const prompt = `
            You are a content generator for a news aggregation platform that uses the TipTap editor.

            Please transform the following content by:
            1. Translating it to ${language}
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
              "suggestedCategories": ["categoryName1", "categoryName2"]
            }`;

        this.pipelineLog(raw.id, `generating (attempt ${(raw.aiAttempts || 0) + 1}/${this.getMaxAttempts()})`);
        const generatedText = await aiContentService.generateContent(prompt);

        if (!generatedText)
            throw new Error('No content generated by AI (pass 1)');

        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : null;

        if (!jsonContent)
            throw new Error('No JSON content found in AI response (pass 1)');

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
            // Non-fatal: we still have pass 1 content
        }

        return {
            title: parsedContent.title,
            content: parsedContent.content,
            tags: parsedContent.suggestedTags || [],
            categories: parsedContent.suggestedCategories || []
        };
    }

    // ═══════════════════════════════════════════════════════════
    // WORKER 3: POST CREATOR
    // ═══════════════════════════════════════════════════════════

    @Cron(CronExpression.EVERY_10_MINUTES)
    async postWorkerCron() {
        try {
            if (!this.isEnabled()) return;
            await this.postWorker();
        } catch (err) {
            console.error('[pipeline] postWorkerCron error:', err);
        }
    }

    async postWorker(): Promise<void> {
        if (AutoPipelineService.isPosting) {
            AutoPipelineService.logger.log("[pipeline] postWorker already running, skipping");
            return;
        }

        AutoPipelineService.isPosting = true;

        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const PostsEntity = Repository.getEntity("PostsEntity");
            const MetaEntity = Repository.getEntity("MetaEntity");
            const CategoriesEntity = Repository.getEntity("CategoriesEntity");
            const maxPerCycle = this.getMaxPostsPerCycle();

            AutoPipelineService.logger.log("[pipeline] postWorker: Starting posting cycle");

            // Find generated items ready for post creation
            const generatedItems = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.GENERATED,
                limit: maxPerCycle,
                sortBy: "relevance",
                sort: "DESC"
            }, ['channel'] as any);

            if (!generatedItems || generatedItems.data.length === 0) {
                AutoPipelineService.logger.log("[pipeline] postWorker: No generated items to post");
                return;
            }

            const backlogCount = generatedItems.data.length;
            AutoPipelineService.logger.log(`[pipeline] postWorker: Creating ${backlogCount} posts (backlog=${backlogCount})`);

            for (const raw of generatedItems.data) {
                try {
                    // Lock state
                    const locked = await this.transitionState(
                        raw.id,
                        PIPELINE_STATE.GENERATED,
                        PIPELINE_STATE.POSTING
                    );

                    if (!locked) continue;

                    // Resolve author
                    const authorId = await this.resolveAuthor();
                    if (!authorId) {
                        await this.handleFailure(raw.id, PIPELINE_STATE.POSTING, "No author found");
                        continue;
                    }

                    // Adaptive scheduling
                    const publishAt = await this.getNextPublishTime(backlogCount);

                    // Resolve categories (fuzzy match + mapping)
                    const categories = await this.resolveCategories(
                        raw.suggestedCategories || [],
                        CategoriesEntity,
                        raw.title
                    );

                    // Generate slug
                    const slug = this.generateSlug(raw.title);

                    // Validate feature image
                    const validatedImage = await this.validateImage(raw.featureImage || '');

                    // Sanitize tags (dedup, min 3 chars, max 8, exclude category names)
                    const allCategoryNames = await this.getCategoryNames(categories, CategoriesEntity);
                    const tags = this.sanitizeTags(raw.suggestedTags || [], allCategoryNames);

                    // Build excerpt (clean HTML, max 140 chars, no word break)
                    const excerpt = this.buildExcerpt(raw.content, 140);

                    // Content Processing: Validate Images & Append Source
                    let processedContent = await this.validateContentImages(raw.content);

                    // Append Source Attribution
                    if (raw.link) {
                        const sourceName = raw?.channel?.name || this.getSiteName();
                        processedContent += `<br><br><p><strong>Fonte:</strong> <a href="${raw.link}" target="_blank" rel="noopener noreferrer">${sourceName}</a></p>`;
                    }

                    // Branded SEO title
                    const siteName = this.getSiteName();
                    const metaTitle = raw.title?.length > 85
                        ? raw.title.substring(0, 85) + '...'
                        : `${raw.title} | ${siteName}`;

                    // Create the post (always scheduled)
                    const postData: any = {
                        title: raw.title,
                        slug: slug,
                        content: processedContent,
                        status: 'cron',
                        type: 'post',
                        author: authorId,
                        authors: [authorId],
                        featureImage: validatedImage,
                        featureImageAlt: raw.title || '',
                        tags: tags,
                        categories: categories,
                        excerpt: excerpt,
                        metaTitle: metaTitle,
                        metaDescription: excerpt,
                        metaKeywords: tags.join(', '),
                        publishedAt: null,
                        autoPublishAt: publishAt,
                        pushNotification: false,
                        deleted: false,
                        visibility: 'public',
                    };

                    const post: any = await Repository.insert(PostsEntity, postData);

                    if (post && post.data) {
                        // Create full SEO meta entry (OG + Twitter)
                        await Repository.insert(MetaEntity, {
                            post: post.data.id,
                            metaTitle: metaTitle,
                            metaDescription: excerpt,
                            ogTitle: raw.title?.substring(0, 100),
                            ogDescription: excerpt,
                            ogImage: validatedImage,
                            twitterTitle: raw.title?.substring(0, 100),
                            twitterDescription: excerpt,
                            twitterImage: validatedImage,
                        });

                        // Mark raw as done with postRef
                        await Repository.updateOne(
                            FeedRawEntity,
                            Repository.queryBuilder({ id: raw.id }),
                            {
                                pipelineState: PIPELINE_STATE.DONE,
                                postRef: post.data.id
                            }
                        );

                        const publishDate = new Date(publishAt).toISOString();
                        this.pipelineLog(raw.id,
                            `done: postId=${post.data.id}, status=cron, publishAt=${publishDate}, categories=${categories.length}, tags=${tags.length}`
                        );
                    } else {
                        await this.handleFailure(raw.id, PIPELINE_STATE.POSTING, "Post creation returned no data");
                    }
                } catch (error) {
                    await this.handleFailure(
                        raw.id,
                        PIPELINE_STATE.POSTING,
                        error instanceof Error ? error.message : String(error)
                    );
                }
            }

            AutoPipelineService.logger.log("[pipeline] postWorker: Posting cycle complete");
        } catch (error) {
            AutoPipelineService.logger.error(`[pipeline] postWorker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            AutoPipelineService.isPosting = false;
        }
    }

    // ─── Adaptive Smart Scheduling ────────────────────────────
    private async getNextPublishTime(backlogCount: number = 0): Promise<number> {
        const PostsEntity = Repository.getEntity("PostsEntity");
        const baseInterval = this.getBaseIntervalMinutes();
        const minInterval = this.getMinIntervalMinutes();
        const factor = this.getBacklogFactor();
        const safetyWindow = 5 * 60 * 1000; // 5 minutes

        // Adaptive curve: interval shrinks with more backlog
        // interval = max(base - (backlog * factor), min)
        const adaptiveMinutes = Math.max(
            baseInterval - (backlogCount * factor),
            minInterval
        );
        const intervalMs = adaptiveMinutes * 60 * 1000;

        AutoPipelineService.logger.log(`[pipeline] scheduling: base=${baseInterval}m, backlog=${backlogCount}, adaptive=${adaptiveMinutes}m`);

        // Find the last scheduled post (queue continuity)
        const lastScheduled = await Repository.findAll(PostsEntity, {
            status: 'cron',
            limit: 1,
            sortBy: 'autoPublishAt',
            sort: 'DESC'
        });

        let nextTime: number;

        if (lastScheduled && lastScheduled.data.length > 0 && lastScheduled.data[0].autoPublishAt) {
            const lastTime = typeof lastScheduled.data[0].autoPublishAt === 'number'
                ? lastScheduled.data[0].autoPublishAt
                : new Date(lastScheduled.data[0].autoPublishAt).getTime();

            // Queue continuity: always after the last scheduled post
            nextTime = Math.max(
                lastTime + intervalMs,
                Date.now() + safetyWindow
            );
        } else {
            nextTime = Date.now() + safetyWindow;
        }

        return nextTime;
    }

    // ─── Author Resolution ────────────────────────────────────
    private async resolveAuthor(): Promise<string | null> {
        const configAuthor = this.getDefaultAuthor();

        if (configAuthor) return configAuthor;

        // Fallback: get first user from database
        const UserEntity = Repository.getEntity("UserEntity");
        const user = await Repository.findOne(UserEntity, {});
        return user ? user.id : null;
    }

    // ─── Image Validation ─────────────────────────────────────
    private async validateContentImages(content: string): Promise<string> {
        if (!content) return "";

        const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/g;
        let validatedContent = content;
        let match;

        // Collect all image sources
        const sources: string[] = [];
        while ((match = imgRegex.exec(content)) !== null) {
            sources.push(match[1]);
        }

        // Validate each source
        for (const src of sources) {
            const isValid = await this.validateImage(src);
            if (!isValid) {
                // Remove the image tag if validation fails
                // Escaping special characters in src for regex
                const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const tagRegex = new RegExp(`<img[^>]+src="${escapedSrc}"[^>]*>`, 'g');
                validatedContent = validatedContent.replace(tagRegex, '');
                AutoPipelineService.logger.log(`[pipeline] validateContentImages: Removed broken image ${src}`, 'warn');
            }
        }

        return validatedContent;
    }

    // ─── Category Resolution (Fuzzy Match) ────────────────────
    private normalizeForMatch(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/s$/, '')               // Remove trailing 's' (basic deplural)
            .trim();
    }

    private async resolveCategories(
        suggested: string[],
        CategoriesEntity: any,
        rawTitle?: string
    ): Promise<string[]> {
        const defaultCategories = this.getDefaultCategories();

        // Combine suggested + config defaults
        let candidates = [...new Set([...suggested, ...defaultCategories])];

        // Keyword Mapping for common terms
        const KEYWORD_MAP: Record<string, string> = {
            'vct': 'Valorant',
            'valorant': 'Valorant',
            'cs2': 'CS2',
            'cs:go': 'CS2',
            'counter-strike': 'CS2',
            'lol': 'League of Legends',
            'league of legends': 'League of Legends',
            'r6': 'Rainbow Six Siege',
            'rainbow six': 'Rainbow Six Siege',
            'fortnite': 'Fortnite',
            'dota': 'Dota 2',
            'dota 2': 'Dota 2',
            'rocket league': 'Rocket League',
            'overwatch': 'Overwatch 2'
        };

        // Add keywords from title if present
        if (rawTitle) {
            const lowerTitle = rawTitle.toLowerCase();
            for (const [key, categoryName] of Object.entries(KEYWORD_MAP)) {
                if (lowerTitle.includes(key)) {
                    candidates.push(categoryName);
                }
            }
        }

        candidates = [...new Set(candidates)];

        const validCategoryIds: string[] = [];
        // Fetch specific categories if needed or all (caching recommended but simple findAll OK for now)
        const allCategoriesResponse = await Repository.findAll(CategoriesEntity, { limit: 100 });
        const allCategories = allCategoriesResponse?.data || [];

        for (const candidate of candidates) {
            const normalizedCandidate = this.normalizeForMatch(candidate);

            // 1. Direct match (normalized)
            let match = allCategories.find((c: any) =>
                this.normalizeForMatch(c.name || c.label || "") === normalizedCandidate
            );

            // 2. Contains match
            if (!match) {
                match = allCategories.find((c: any) => {
                    const catName = this.normalizeForMatch(c.name || c.label || "");
                    return catName.includes(normalizedCandidate) || normalizedCandidate.includes(catName);
                });
            }

            if (match) {
                validCategoryIds.push(match.id);
            }
        }

        // Fallback: If no categories found, try to find "Games" or "Notícias"
        if (validCategoryIds.length === 0) {
            const fallback = allCategories.find((c: any) =>
                (c.name || c.label) === 'Games' || (c.name || c.label) === 'Notícias'
            );
            if (fallback) {
                validCategoryIds.push(fallback.id);
            } else if (allCategories.length > 0) {
                // Absolute fallback: first category
                validCategoryIds.push(allCategories[0].id);
            }
        }

        return [...new Set(validCategoryIds)];
    }


    // ─── Get Category Names (for tag filtering) ───────────────
    private async getCategoryNames(
        categoryIds: string[],
        CategoriesEntity: any
    ): Promise<string[]> {
        try {
            if (!categoryIds || categoryIds.length === 0) return [];
            const names: string[] = [];
            for (const id of categoryIds) {
                const cat: any = await Repository.findOne(CategoriesEntity, { id });
                if (cat) names.push(cat.name.toLowerCase());
            }
            return names;
        } catch {
            return [];
        }
    }

    // ─── Image Validation ─────────────────────────────────────
    private async validateImage(url: string): Promise<string> {
        if (!url || url.trim() === '') return '';

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            };

            let response = await fetch(url, {
                method: 'HEAD',
                headers,
                redirect: 'follow',
                signal: controller.signal,
            });

            // Some servers block HEAD, retry with GET
            if (!response.ok && (response.status === 405 || response.status === 403 || response.status === 404)) {
                response = await fetch(url, {
                    method: 'GET',
                    headers,
                    redirect: 'follow',
                    signal: controller.signal,
                });
            }

            clearTimeout(timeout);

            if (!response.ok) {
                AutoPipelineService.logger.log(`[pipeline][WARN] image validation failed (${response.status}): ${url}`);
                return '';
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.startsWith('image/')) {
                AutoPipelineService.logger.log(`[pipeline][WARN] image invalid content-type (${contentType}): ${url}`);
                return '';
            }

            const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
            if (contentLength > 0 && contentLength < 1000) {
                AutoPipelineService.logger.log(`[pipeline][WARN] image too small (${contentLength}b): ${url}`);
                return '';
            }

            return url;
        } catch (error) {
            AutoPipelineService.logger.log(`[pipeline][WARN] image validation error: ${url} — ${error instanceof Error ? error.message : String(error)}`);
            return '';
        }
    }

    // ─── Tag Sanitization ─────────────────────────────────────
    private sanitizeTags(tags: string[], categoryNames: string[]): string[] {
        if (!tags || tags.length === 0) return [];

        const seen = new Set<string>();
        const normalizedCategoryNames = categoryNames.map(c => c.toLowerCase().trim());

        return tags
            .map(tag => tag.toLowerCase().trim())
            .filter(tag => {
                // Min 3 chars
                if (tag.length < 3) return false;
                // No duplicates
                if (seen.has(tag)) return false;
                seen.add(tag);
                // Exclude tags that match category names
                if (normalizedCategoryNames.includes(tag)) return false;
                return true;
            })
            .slice(0, 8); // Max 8 tags
    }

    // ─── Excerpt Builder ──────────────────────────────────────
    private buildExcerpt(content: string, maxLength: number = 140): string {
        if (!content) return '';

        // Strip HTML
        let text = content.replace(/<[^>]*>/g, '').trim();
        // Remove multiple spaces
        text = text.replace(/\s+/g, ' ');
        // Remove emoji
        text = text.replace(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

        if (text.length <= maxLength) return text;

        // Cut at word boundary
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        return (lastSpace > maxLength * 0.6 ? truncated.substring(0, lastSpace) : truncated).trim() + '...';
    }

    // ─── Slug Generation ──────────────────────────────────────
    private generateSlug(title: string): string {
        if (!title) return `post-${Date.now()}`;

        let slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s-]/g, '')   // Remove special chars
            .replace(/\s+/g, '-')            // Spaces → hyphens
            .replace(/-+/g, '-')             // Multiple hyphens → single
            .replace(/^-|-$/g, '')           // Trim hyphens
            .substring(0, 95);

        // Add short unique suffix to prevent collisions
        const suffix = Date.now().toString(36).slice(-4);
        return `${slug}-${suffix}`;
    }
}
