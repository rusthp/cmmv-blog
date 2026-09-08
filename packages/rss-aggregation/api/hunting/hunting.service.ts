import {
    Service, Cron,
    CronExpression, Logger
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import {
    ChannelsService
} from "../channels/channels.service";

import {
    HuntingArticleGeneratorService
} from "./hunting-article-generator.service";

interface HuntingFeedItem {
    link?: string;
    title?: string;
    pubDate?: string;
    source?: string | { _?: string, $?: { url?: string } };
}

@Service()
export class HuntingService {
    private static readonly logger = new Logger("HuntingService");

    private static readonly GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={KEYWORD}&hl=pt-BR&gl=BR&ceid=BR:pt-BR";

    constructor(
        private readonly channelsService: ChannelsService,
        private readonly articleGeneratorService: HuntingArticleGeneratorService
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async handleCronHunting() {
        return await this.processHunting.call(this, false);
    }

    /**
     * Build the Google News RSS search URL for a given keyword
     * @param keyword - The keyword to hunt for
     * @returns The search feed URL
     */
    buildSearchUrl(keyword: string): string {
        return HuntingService.GOOGLE_NEWS_RSS.replace("{KEYWORD}", encodeURIComponent(keyword));
    }

    /**
     * Process a single hunting keyword
     * @param keywordId - The ID of the keyword to process
     * @returns The result of the processing
     */
    async processKeyword(keywordId: string) {
        const HuntingKeywordsEntity = Repository.getEntity("HuntingKeywordsEntity");

        const keyword = await Repository.findOne(HuntingKeywordsEntity, {
            id: keywordId
        });

        if (!keyword)
            throw new Error(`Hunting keyword not found: ${keywordId}`);

        const inserted = await this.processSingleKeyword(keyword);

        return {
            success: true,
            message: `Hunt finished for "${keyword.keyword}" (${inserted} new results).`,
            inserted
        };
    }

    /**
     * Process all active hunting keywords
     * @param force - Force the processing ignoring the update interval
     * @returns The result of the processing
     */
    async processHunting(force: boolean = false) {
        const HuntingKeywordsEntity = Repository.getEntity("HuntingKeywordsEntity");

        try {
            const keywords = await Repository.findAll(HuntingKeywordsEntity, {
                active: true,
                limit: 1000
            }, [], {
                select: ["id", "keyword", "label", "intervalUpdate", "lastUpdate"]
            });

            if (!keywords || !keywords.data || keywords.data.length === 0) {
                return {
                    success: true,
                    message: "No hunting keywords found to process."
                };
            }

            const results: Array<{ keyword: string, success: boolean, inserted?: number, error?: string }> = [];

            for (const keyword of keywords.data) {
                const intervalUpdate = keyword.intervalUpdate || 1000 * 60 * 60 * 6;
                const lastUpdate = keyword.lastUpdate ? new Date(keyword.lastUpdate) : null;
                const isDue = !lastUpdate || lastUpdate < new Date(Date.now() - intervalUpdate);

                if (!isDue && !force)
                    continue;

                try {
                    const inserted = await Promise.race([
                        this.processSingleKeyword(keyword),
                        new Promise<number>((_, reject) => {
                            setTimeout(() => {
                                reject(new Error(`Timeout hunting keyword ${keyword.keyword}`));
                            }, 120000);
                        })
                    ]);

                    results.push({ keyword: keyword.keyword, success: true, inserted });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    results.push({ keyword: keyword.keyword, success: false, error: errorMessage });

                    try {
                        await Repository.update(HuntingKeywordsEntity, { id: keyword.id }, {
                            lastUpdate: new Date()
                        });
                    } catch (updateError) { }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const successes = results.filter(r => r.success).length;
            const failures = results.filter(r => !r.success).length;
            const inserted = results.reduce((total, r) => total + (r.inserted || 0), 0);

            return {
                success: true,
                message: `Hunted ${results.length} keywords (${successes} successful, ${failures} failed, ${inserted} new results)`,
                results
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            HuntingService.logger.error(`Error processing hunting keywords: ${errorMessage}`);

            return {
                success: false,
                message: errorMessage
            };
        }
    }

    /**
     * Fetch the Google News search feed for a keyword and store new results
     * @param keyword - The hunting keyword record
     * @returns The number of new results inserted
     */
    private async processSingleKeyword(keyword: any): Promise<number> {
        const HuntingKeywordsEntity = Repository.getEntity("HuntingKeywordsEntity");
        const searchUrl = this.buildSearchUrl(keyword.keyword);

        HuntingService.logger.log(`Hunting for "${keyword.keyword}" at ${searchUrl}`);

        const feedData: any = await this.channelsService.getFeed(searchUrl);
        const rawItems = feedData?.rss?.channel?.item;

        const items: HuntingFeedItem[] = !rawItems
            ? []
            : (Array.isArray(rawItems) ? rawItems : [rawItems]);

        let inserted = 0;

        for (const item of items) {
            try {
                const stored = await this.storeResult(item, keyword.id);

                if (stored)
                    inserted++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                HuntingService.logger.error(`Error storing hunting result for "${keyword.keyword}": ${errorMessage}`);
            }
        }

        await Repository.update(HuntingKeywordsEntity, { id: keyword.id }, {
            lastUpdate: new Date()
        });

        HuntingService.logger.log(`Hunt for "${keyword.keyword}" found ${items.length} items (${inserted} new)`);

        return inserted;
    }

    /**
     * Store a single feed item as a pending hunting result, deduplicating by link
     * @param item - The feed item
     * @param keywordId - The keyword that originated the finding
     * @returns True when a new result was inserted
     */
    private async storeResult(item: HuntingFeedItem, keywordId: string): Promise<boolean> {
        const HuntingResultsEntity = Repository.getEntity("HuntingResultsEntity");

        const link = typeof item.link === 'string' ? item.link.trim() : '';

        if (!link)
            return false;

        const existing = await Repository.findOne(HuntingResultsEntity, { link });

        if (existing)
            return false;

        const source = HuntingService.extractSource(item);
        const title = HuntingService.extractTitle(item, source);

        if (!title)
            return false;

        const parsedDate = item.pubDate ? new Date(item.pubDate) : null;
        const pubDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

        await Repository.insert(HuntingResultsEntity, {
            keyword: keywordId,
            link,
            title,
            source,
            pubDate,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    }

    /**
     * Extract the publisher name from the RSS <source> node
     * @param item - The feed item
     * @returns The publisher name or an empty string
     */
    private static extractSource(item: HuntingFeedItem): string {
        if (!item.source)
            return '';

        if (typeof item.source === 'string')
            return item.source.trim();

        return (item.source._ || '').trim();
    }

    /**
     * Extract the article title, removing the " - Publisher" suffix Google News appends
     * @param item - The feed item
     * @param source - The publisher name
     * @returns The cleaned title
     */
    private static extractTitle(item: HuntingFeedItem, source: string): string {
        const rawTitle = typeof item.title === 'string' ? item.title.trim() : '';

        if (!rawTitle || !source)
            return rawTitle;

        const suffix = ` - ${source}`;

        return rawTitle.endsWith(suffix)
            ? rawTitle.slice(0, -suffix.length).trim()
            : rawTitle;
    }

    /**
     * List hunting results, defaults to the pending validation queue
     * @param queries - The queries to filter the results
     * @returns The hunting results
     */
    async getResults(queries: any) {
        const HuntingResultsEntity = Repository.getEntity("HuntingResultsEntity");

        if (!queries.status)
            queries.status = 'PENDING';

        delete queries.sortBy;
        delete queries.sort;

        return await Repository.findAll(HuntingResultsEntity, queries, [], {
            order: {
                pubDate: "DESC"
            }
        });
    }

    /**
     * Change the validation status of a hunting result.
     * Approving also kicks off a ContentMind DRAFT generation for the news item —
     * the draft still requires manual editorial review, nothing is published.
     * @param id - The ID of the hunting result
     * @param status - The new status
     * @returns The result of the operation
     */
    async setResultStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
        const HuntingResultsEntity = Repository.getEntity("HuntingResultsEntity");

        const result = await Repository.findOne(HuntingResultsEntity, { id });

        if (!result)
            throw new Error(`Hunting result not found: ${id}`);

        const shouldGenerate = status === 'APPROVED'
            && !result.postRef
            && result.generationStatus !== 'PENDING';

        await Repository.update(HuntingResultsEntity, { id }, {
            status,
            ...(shouldGenerate ? { generationStatus: 'PENDING', generationError: null } : {}),
            updatedAt: new Date()
        });

        if (!shouldGenerate)
            return { success: true, message: `Hunting result marked as ${status}.` };

        // Generation takes minutes (AI call + post creation), so it runs detached
        // from the request. A failure here must never fail the approval itself.
        this.generateArticleDraft(id, result).catch((error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            HuntingService.logger.error(`Unhandled error generating draft for hunting result ${id}: ${errorMessage}`);
        });

        return {
            success: true,
            message: `Hunting result marked as ${status}. ContentMind draft generation started.`
        };
    }

    /**
     * Ask ContentMind for a draft article based on an approved hunting result
     * and persist the outcome on the result record.
     * @param id - The ID of the hunting result
     * @param result - The hunting result record
     */
    private async generateArticleDraft(id: string, result: any): Promise<void> {
        const HuntingResultsEntity = Repository.getEntity("HuntingResultsEntity");

        const keyword = await this.getKeywordLabel(result.keyword);

        const generation = await this.articleGeneratorService.generateDraft({
            title: result.title,
            link: result.link,
            source: result.source || '',
            keyword
        });

        if (generation.success) {
            HuntingService.logger.log(`ContentMind draft created for hunting result ${id} (post ${generation.postId}).`);

            await Repository.update(HuntingResultsEntity, { id }, {
                generationStatus: 'GENERATED',
                postRef: generation.postId,
                generationError: null,
                updatedAt: new Date()
            });

            return;
        }

        const errorMessage = generation.error || 'Unknown ContentMind failure';

        HuntingService.logger.error(`ContentMind draft generation failed for hunting result ${id}: ${errorMessage}`);

        await Repository.update(HuntingResultsEntity, { id }, {
            generationStatus: 'FAILED',
            generationError: errorMessage.slice(0, 1000),
            updatedAt: new Date()
        });
    }

    /**
     * Resolve the human-readable label of the keyword that found a result,
     * used as the editorial theme handed to ContentMind
     * @param keyword - The keyword id or the already resolved relation object
     * @returns The keyword label, or an empty string when unavailable
     */
    private async getKeywordLabel(keyword: any): Promise<string> {
        if (!keyword)
            return '';

        if (typeof keyword === 'object')
            return keyword.label || keyword.keyword || '';

        try {
            const HuntingKeywordsEntity = Repository.getEntity("HuntingKeywordsEntity");
            const record = await Repository.findOne(HuntingKeywordsEntity, { id: keyword });

            return record ? (record.label || record.keyword || '') : '';
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            HuntingService.logger.error(`Could not resolve hunting keyword ${keyword}: ${errorMessage}`);

            return '';
        }
    }
}
