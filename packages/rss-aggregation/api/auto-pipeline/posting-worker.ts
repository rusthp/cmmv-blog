import { Logger, Config, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { PIPELINE_STATE } from "./pipeline-constants";
import { ImagePipelineWorker } from "./image-pipeline";

/**
 * Worker responsible for creating blog posts from generated feed items.
 * Handles: category resolution, tag sanitization, slug generation,
 * adaptive scheduling, excerpt building, and post creation.
 */
export class PostingWorker {
    private static readonly logger = new Logger("PostingWorker");
    private static isRunning = false;

    constructor(private readonly imagePipeline: ImagePipelineWorker) {}

    async run(): Promise<void> {
        if (PostingWorker.isRunning) {
            PostingWorker.logger.log("[pipeline] postWorker already running, skipping");
            return;
        }

        PostingWorker.isRunning = true;

        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const PostsEntity = Repository.getEntity("PostsEntity");
            const MetaEntity = Repository.getEntity("MetaEntity");
            const CategoriesEntity = Repository.getEntity("CategoriesEntity");
            const maxPerCycle = Config.get<number>("blog.autoPipelineMaxPostsPerCycle", 3);
            const maxAttempts = Config.get<number>("blog.autoPipelineMaxAttempts", 3);
            const siteName = Config.get<string>("blog.autoPipelineSiteName", "CMMV");

            PostingWorker.logger.log("[pipeline] postWorker: Starting posting cycle");

            const generatedItems = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.GENERATED,
                limit: maxPerCycle,
                sortBy: "relevance",
                sort: "DESC"
            }, ['channel'] as any);

            if (!generatedItems || generatedItems.data.length === 0) {
                PostingWorker.logger.log("[pipeline] postWorker: No generated items to post");
                return;
            }

            const backlogCount = generatedItems.data.length;
            PostingWorker.logger.log(`[pipeline] postWorker: Creating ${backlogCount} posts (backlog=${backlogCount})`);

            for (const raw of generatedItems.data) {
                try {
                    const locked = await this.transitionState(
                        raw.id,
                        PIPELINE_STATE.GENERATED,
                        PIPELINE_STATE.POSTING
                    );

                    if (!locked) continue;

                    // Resolve author
                    const authorId = await this.resolveAuthor();
                    if (!authorId) {
                        await this.handleFailure(raw.id, PIPELINE_STATE.POSTING, "No author found", maxAttempts);
                        continue;
                    }

                    // Adaptive scheduling
                    const publishAt = await this.getNextPublishTime(backlogCount);

                    // Resolve categories
                    const categories = await this.resolveCategories(
                        raw.suggestedCategories || [],
                        CategoriesEntity,
                        raw.title
                    );

                    // Duplicate check (normalized title match)
                    const duplicatePost = await this.findDuplicatePost(PostsEntity, raw.title);

                    if (duplicatePost) {
                        PostingWorker.logger.log(
                            `[pipeline][WARN] Duplicate detected for "${raw.title}" (matched: "${duplicatePost.title}"). Skipping.`
                        );
                        await Repository.updateOne(
                            FeedRawEntity,
                            Repository.queryBuilder({ id: raw.id }),
                            { pipelineState: PIPELINE_STATE.DONE, postRef: duplicatePost.id }
                        );
                        continue;
                    }

                    // Generate slug (after dedup check to avoid unnecessary work)
                    const slug = this.generateSlug(raw.title);

                    // Validate feature image (always ensure a valid image or placeholder)
                    let validatedImage = '';
                    try {
                        validatedImage = await this.imagePipeline.validateAndResolveImage(
                            raw.featureImage || '', raw.title || ''
                        );
                    } catch (e: any) {
                        PostingWorker.logger.log(
                            `[pipeline][WARN] Failed to validate feature image for post ${raw.id}: ${e.message}`
                        );
                    }

                    // Fallback: if image is still empty, force a placeholder
                    if (!validatedImage) {
                        try {
                            validatedImage = await this.imagePipeline.createAndSavePlaceholder(raw.title || 'Post');
                        } catch {
                            PostingWorker.logger.log(
                                `[pipeline][WARN] Placeholder generation also failed for post ${raw.id}`
                            );
                        }
                    }

                    // Sanitize tags
                    const allCategoryNames = await this.getCategoryNames(categories, CategoriesEntity);
                    const tags = this.sanitizeTags(raw.suggestedTags || [], allCategoryNames);

                    // Build excerpt
                    const excerpt = this.buildExcerpt(raw.content, 140);

                    // Validate content images & append source
                    let processedContent = await this.imagePipeline.validateContentImages(raw.content);

                    if (raw.link) {
                        const sourceName = raw?.channel?.name || siteName;
                        processedContent += `<br><br><p><strong>Fonte:</strong> <a href="${raw.link}" target="_blank" rel="noopener noreferrer">${sourceName}</a></p>`;
                    }

                    // Branded SEO title
                    const metaTitle = raw.title?.length > 85
                        ? raw.title.substring(0, 85) + '...'
                        : `${raw.title} | ${siteName}`;

                    // Create post (always scheduled)
                    const postData: any = {
                        title: raw.title,
                        slug,
                        content: processedContent,
                        status: 'cron',
                        type: 'post',
                        author: authorId,
                        authors: [authorId],
                        featureImage: validatedImage,
                        featureImageAlt: raw.title || '',
                        tags,
                        categories,
                        excerpt,
                        metaTitle,
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
                        await Repository.insert(MetaEntity, {
                            post: post.data.id,
                            metaTitle,
                            metaDescription: excerpt,
                            ogTitle: raw.title?.substring(0, 100),
                            ogDescription: excerpt,
                            ogImage: validatedImage,
                            twitterTitle: raw.title?.substring(0, 100),
                            twitterDescription: excerpt,
                            twitterImage: validatedImage,
                        });

                        await Repository.updateOne(
                            FeedRawEntity,
                            Repository.queryBuilder({ id: raw.id }),
                            { pipelineState: PIPELINE_STATE.DONE, postRef: post.data.id }
                        );

                        const publishDate = new Date(publishAt).toISOString();
                        this.pipelineLog(raw.id,
                            `done: postId=${post.data.id}, status=cron, publishAt=${publishDate}, categories=${categories.length}, tags=${tags.length}`
                        );
                    } else {
                        await this.handleFailure(raw.id, PIPELINE_STATE.POSTING, "Post creation returned no data", maxAttempts);
                    }
                } catch (error) {
                    await this.handleFailure(
                        raw.id,
                        PIPELINE_STATE.POSTING,
                        error instanceof Error ? error.message : String(error),
                        maxAttempts
                    );
                }
            }

            PostingWorker.logger.log("[pipeline] postWorker: Posting cycle complete");
        } catch (error) {
            PostingWorker.logger.error(
                `[pipeline] postWorker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            PostingWorker.isRunning = false;
        }
    }

    // ─── Adaptive Smart Scheduling ────────────────────────────

    private async getNextPublishTime(backlogCount: number = 0): Promise<number> {
        const PostsEntity = Repository.getEntity("PostsEntity");
        const baseInterval = Config.get<number>("blog.autoPipelineBaseIntervalMinutes", 60);
        const minInterval = Config.get<number>("blog.autoPipelineMinIntervalMinutes", 20);
        const factor = Config.get<number>("blog.autoPipelineBacklogFactor", 5);
        const startHour = Config.get<number>("blog.autoPipelineScheduleStartHour", 7);
        const endHour = Config.get<number>("blog.autoPipelineScheduleEndHour", 1);
        const safetyWindow = 5 * 60 * 1000;

        const adaptiveMinutes = Math.max(baseInterval - backlogCount * factor, minInterval);
        const intervalMs = adaptiveMinutes * 60 * 1000;

        PostingWorker.logger.log(
            `[pipeline] scheduling: base=${baseInterval}m, backlog=${backlogCount}, adaptive=${adaptiveMinutes}m`
        );

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

            nextTime = Math.max(lastTime + intervalMs, Date.now() + safetyWindow);
        } else {
            nextTime = Date.now() + safetyWindow;
        }

        // Blackout period check
        const date = new Date(nextTime);
        const hour = date.getHours();
        if (hour >= endHour && hour < startHour) {
            date.setHours(startHour, 0, 0, 0);
            nextTime = date.getTime();
            PostingWorker.logger.log(
                `[pipeline] scheduling: hit blackout period (${endHour}h-${startHour}h), moved to ${date.toISOString()}`
            );
        }

        return nextTime;
    }

    // ─── Author Resolution ────────────────────────────────────

    private async resolveAuthor(): Promise<string | null> {
        const configAuthor = Config.get<string>("blog.autoPipelineDefaultAuthor", "");
        if (configAuthor) return configAuthor;

        const UserEntity = Repository.getEntity("UserEntity");
        const user = await Repository.findOne(UserEntity, {});
        return user ? user.id : null;
    }

    // ─── Category Resolution (Fuzzy Match) ────────────────────

    private normalizeForMatch(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/s$/, '')
            .trim();
    }

    private async resolveCategories(
        suggested: string[],
        CategoriesEntity: any,
        rawTitle?: string,
    ): Promise<string[]> {
        const defaultCategories = Config.get<string[]>("blog.autoPipelineDefaultCategories", []);

        let candidates = [...new Set([...suggested, ...defaultCategories])];

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
            'overwatch': 'Overwatch 2',
        };

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
        const allCategoriesResponse = await Repository.findAll(CategoriesEntity, { limit: 100 });
        const allCategories = allCategoriesResponse?.data || [];

        for (const candidate of candidates) {
            const normalizedCandidate = this.normalizeForMatch(candidate);

            let match = allCategories.find((c: any) =>
                this.normalizeForMatch(c.name || c.label || "") === normalizedCandidate
            );

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

        if (validCategoryIds.length === 0) {
            const fallback = allCategories.find((c: any) =>
                (c.name || c.label) === 'Games' || (c.name || c.label) === 'Notícias'
            );
            if (fallback) {
                validCategoryIds.push(fallback.id);
            } else if (allCategories.length > 0) {
                validCategoryIds.push(allCategories[0].id);
            }
        }

        return [...new Set(validCategoryIds)];
    }

    private async getCategoryNames(categoryIds: string[], CategoriesEntity: any): Promise<string[]> {
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

    // ─── Tag Sanitization ─────────────────────────────────────

    sanitizeTags(tags: string[], categoryNames: string[]): string[] {
        if (!tags || tags.length === 0) return [];

        const seen = new Set<string>();
        const normalizedCategoryNames = categoryNames.map(c => c.toLowerCase().trim());

        return tags
            .map(tag => tag.toLowerCase().trim())
            .filter(tag => {
                if (tag.length < 3) return false;
                if (seen.has(tag)) return false;
                seen.add(tag);
                if (normalizedCategoryNames.includes(tag)) return false;
                return true;
            })
            .slice(0, 8);
    }

    // ─── Excerpt Builder ──────────────────────────────────────

    buildExcerpt(content: string, maxLength: number = 140): string {
        if (!content) return '';

        let text = content.replace(/<[^>]*>/g, '').trim();
        text = text.replace(/\s+/g, ' ');
        text = text.replace(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

        if (text.length <= maxLength) return text;

        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        return (lastSpace > maxLength * 0.6 ? truncated.substring(0, lastSpace) : truncated).trim() + '...';
    }

    // ─── Slug Generation ──────────────────────────────────────

    generateSlug(title: string): string {
        if (!title) return `post-${Date.now()}`;

        let slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 95);

        const suffix = Date.now().toString(36).slice(-4);
        return `${slug}-${suffix}`;
    }

    // ─── Duplicate Detection ───────────────────────────────────

    /**
     * Normalizes a title for fuzzy comparison:
     * lowercase, strip accents, collapse whitespace, remove punctuation.
     */
    private normalizeTitle(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // strip accents
            .replace(/[^a-z0-9\s]/g, '')     // remove punctuation
            .replace(/\s+/g, ' ')            // collapse whitespace
            .trim();
    }

    /**
     * Finds a duplicate post by normalized title similarity.
     * Checks recent posts (last 200) for exact normalized match.
     */
    private async findDuplicatePost(PostsEntity: any, title: string): Promise<any | null> {
        if (!title) return null;

        const normalizedInput = this.normalizeTitle(title);

        // First: exact title match (fast DB query)
        const exactMatch = await Repository.findOne(PostsEntity, { title });
        if (exactMatch) return exactMatch;

        // Second: check recent posts for normalized title match
        const recentPosts = await Repository.findAll(PostsEntity, {
            limit: 200,
            sortBy: 'createdAt',
            sort: 'DESC',
        });

        if (recentPosts?.data) {
            for (const post of recentPosts.data) {
                if (this.normalizeTitle(post.title || '') === normalizedInput) {
                    return post;
                }
            }
        }

        return null;
    }

    // ─── Helpers ──────────────────────────────────────────────

    private pipelineLog(rawId: string, message: string) {
        PostingWorker.logger.log(`[pipeline][${rawId}] ${message}`);
    }

    private pipelineError(rawId: string, message: string) {
        PostingWorker.logger.error(`[pipeline][${rawId}] ${message}`);
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
            const retryState = PIPELINE_STATE.GENERATED;
            await Repository.updateOne(
                FeedRawEntity,
                Repository.queryBuilder({ id: rawId }),
                { pipelineState: retryState, aiAttempts: attempts }
            );
            this.pipelineLog(rawId, `Attempt ${attempts}/${maxAttempts} failed, reset to '${retryState}' for retry. Error: ${error}`);
        }
    }
}
