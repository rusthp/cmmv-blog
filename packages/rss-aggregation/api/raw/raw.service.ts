import {
    Service, Logger,
    Config, Application
} from "@cmmv/core";

import {
    Repository, MoreThanOrEqual,
    IsNull, LessThanOrEqual
} from "@cmmv/repository";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";
//@ts-ignore
import { PromptsServiceTools } from "@cmmv/blog/prompts/prompts.service";
import { ParserService } from "../parser/parser.service";

interface AIJob {
    id: string;
    rawId: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: any;
    error?: string;
    startTime: Date;
    customContent?: string;
    promptId?: string;
}

@Service()
export class RawService {
    private readonly logger = new Logger("RawService");
    private aiJobs: Map<string, AIJob> = new Map();

    constructor(
        private readonly aiContentService: AIContentService,
        private readonly parserService: ParserService
    ) {}

    /**
     * Get raw feed items
     * @param queries The queries to filter the raw feed items
     * @returns The raw feed items
     */
    async getRaws(queries: any) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");

        queries.rejected = false;
        queries.pubDate = MoreThanOrEqual(new Date(Date.now() - 1000 * 60 * 60 * 24 * 2));
        queries.postRef = IsNull();
        delete queries.sortBy;
        delete queries.sort;

        const raw = await Repository.findAll(FeedRawEntity, queries, [], {
            order: {
                relevance: "DESC",
                pubDate: "DESC"
            }
        });

        return raw;
    }

    /**
     * Start an asynchronous AI content generation job
     * @param id The ID of the raw feed item
     * @param customContent Optional custom content to process instead of the original
     * @param promptId Optional prompt ID to use for the AI job
     * @returns Job ID for tracking the processing status
     */
    async startAIJob(id: string, customContent?: string, promptId?: string): Promise<string> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, { id });

        if (!raw) {
            throw new Error(`Raw feed item with ID ${id} not found`);
        }

        // Generate unique job ID
        const jobId = `ai-job-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

        const job: AIJob = {
            id: jobId,
            rawId: id,
            status: 'pending',
            startTime: new Date(),
            customContent,
            promptId
        };

        this.aiJobs.set(jobId, job);
        setTimeout(() => this.processAIJob(jobId), 0);

        return jobId;
    }

    /**
     * Process an AI job asynchronously
     * @param jobId The ID of the job to process
     */
    private async processAIJob(jobId: string): Promise<void> {
        const job = this.aiJobs.get(jobId);
        if (!job) {
            this.logger.error(`Job ${jobId} not found`);
            return;
        }

        try {
            job.status = 'processing';
            this.aiJobs.set(jobId, job);

            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const raw = await Repository.findOne(FeedRawEntity, { id: job.rawId });

            if (!raw) {
                throw new Error(`Raw feed item with ID ${job.rawId} not found`);
            }

            const promptService: any = Application.resolveProvider(PromptsServiceTools);
            const language = Config.get("blog.language");

            const contentToProcess = {
                title: raw.title,
                content: job.customContent || raw.content,
                category: raw.category
            };

            const prompt = `
            You are a content generator for a news aggregation platform that uses the TipTap editor.

            Please transform the following content by:
            1. Translating it to ${language}
            ${await promptService.getDefaultPrompt(job.promptId)}

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

            this.logger.log(`Processing AI job ${jobId} for raw ${job.rawId}`);
            const generatedText = await this.aiContentService.generateContent(prompt);

            if (!generatedText)
                throw new Error('No content generated by AI');

            try {
                const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
                const jsonContent = jsonMatch ? jsonMatch[0] : null;

                if (!jsonContent)
                    throw new Error('No JSON content found in AI response');

                const parsedContent = JSON.parse(jsonContent);

                if (parsedContent.title && parsedContent.title.length > 100) {
                    parsedContent.title = parsedContent.title.substring(0, 97) + '...';
                    this.logger.log(`Title was truncated to 100 characters for raw feed item ${job.rawId}`);
                }

                this.logger.log(`Generating continuation text for raw feed item ${job.rawId}`);

                const continuationPrompt = `
                You are a content generator for a news aggregation platform that uses the TipTap editor.

                I've already generated part of the content below, but I need you to continue this article with more details, examples, or insights. Keep the same style and flow as the existing content.

                1. Translating it to ${language}

                - ONLY use images that exist in the original post - DO NOT create or generate new images that don't exist

                Original prompt:
                ${await promptService.getRandomPrompt(job.promptId)}

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

                const continuationText = await this.aiContentService.generateContent(continuationPrompt);

                if (!continuationText) {
                    this.logger.error(`No continuation text generated for raw feed item ${job.rawId}, using only the original text`);
                } else {
                    try {
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

                                this.logger.log(`Successfully combined original content with continuation for raw feed item ${job.rawId}`);
                            }
                        }
                    } catch (continuationError) {
                        this.logger.error(`Failed to parse continuation text: ${continuationError}`);
                        this.logger.error(`Using only the original text for raw feed item ${job.rawId}`);
                    }
                }

                const result = {
                    ...raw,
                    originalTitle: raw.title,
                    originalContent: raw.content,
                    title: parsedContent.title,
                    content: parsedContent.content,
                    suggestedTags: parsedContent.suggestedTags || [],
                    suggestedCategories: parsedContent.suggestedCategories || [],
                    aiProcessed: true,
                    processedAt: new Date()
                };

                job.result = result;
                job.status = 'completed';
                this.aiJobs.set(jobId, job);

                this.logger.log(`AI job ${jobId} completed successfully`);
            } catch (parseError) {
                this.logger.error(`Failed to parse AI generated content: ${parseError}`);
                job.status = 'error';
                job.error = `Failed to parse AI generated content`;
                this.aiJobs.set(jobId, job);
            }
        } catch (error) {
            this.logger.error(`Error processing AI job ${jobId}: ${error instanceof Error ? error.message : String(error)}`);
            job.status = 'error';
            job.error = error instanceof Error ? error.message : String(error);
            this.aiJobs.set(jobId, job);
        }
    }

    /**
     * Get the status and result of an AI job
     * @param jobId The ID of the job to check
     * @returns The current status and result (if available) of the job
     */
    async getAIJobStatus(jobId: string) {
        const job = this.aiJobs.get(jobId);

        if (!job)
            throw new Error(`Job ${jobId} not found`);

        this.cleanupOldJobs();

        if (job.status === 'completed') {
            return {
                status: job.status,
                result: job.result
            };
        } else if (job.status === 'error') {
            return {
                status: job.status,
                error: job.error
            };
        } else {
            return {
                status: job.status
            };
        }
    }

    /**
     * Clean up old completed/error jobs to prevent memory leaks
     */
    private cleanupOldJobs() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        for (const [jobId, job] of this.aiJobs.entries()) {
            if ((job.status === 'completed' || job.status === 'error') && job.startTime < oneHourAgo) {
                this.aiJobs.delete(jobId);
            }
        }
    }

    /**
     * Get AI processed raw feed item (DEPRECATED - use startAIJob and getAIJobStatus instead)
     * This method is kept for backward compatibility
     * @param id The ID of the raw feed item
     * @param customContent Optional custom content to process instead of the original
     * @returns The AI processed raw feed item
     */
    async getAIRaw(id: string, customContent?: string, promptId?: string) {
        try {
            const promptService:any = Application.resolveProvider(PromptsServiceTools);
            const language = Config.get("blog.language");
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const raw = await Repository.findOne(FeedRawEntity, {
                id: id
            });

            if (!raw)
                throw new Error(`Raw feed item with ID ${id} not found`);

            const contentToProcess = {
                title: raw.title,
                content: customContent || raw.content,
                category: raw.category
            };

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

            const generatedText = await this.aiContentService.generateContent(prompt);

            if (!generatedText)
                throw new Error('No content generated by AI');

            try {
                const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
                const jsonContent = jsonMatch ? jsonMatch[0] : null;

                if (!jsonContent)
                    throw new Error('No JSON content found in AI response');

                const parsedContent = JSON.parse(jsonContent);

                if (parsedContent.title && parsedContent.title.length > 100) {
                    parsedContent.title = parsedContent.title.substring(0, 97) + '...';
                    this.logger.log(`Title was truncated to 100 characters for raw feed item ${id}`);
                }

                // Generate continuation text
                this.logger.log(`Generating continuation text for raw feed item ${id}`);

                const continuationPrompt = `
                You are a content generator for a news aggregation platform that uses the TipTap editor.

                I've already generated part of the content below, but I need you to continue this article with more details, examples, or insights. Keep the same style and flow as the existing content.

                1. Translating it to ${language}

                Original prompt:
                ${await promptService.getDefaultPrompt(promptId)}

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

                const continuationText = await this.aiContentService.generateContent(continuationPrompt);

                if (!continuationText) {
                    this.logger.error(`No continuation text generated for raw feed item ${id}, using only the original text`);
                } else {
                    try {
                        const continuationJsonMatch = continuationText.match(/\{[\s\S]*\}/);
                        const continuationJsonContent = continuationJsonMatch ? continuationJsonMatch[0] : null;

                        if (continuationJsonContent) {
                            const parsedContinuation = JSON.parse(continuationJsonContent);

                            if (parsedContinuation.continuation) {
                                // Combine the original content with the continuation
                                // Find the last closing tag in the original content
                                const lastClosingTagMatch = parsedContent.content.match(/<\/[^>]+>$/);

                                if (lastClosingTagMatch) {
                                    // Insert the continuation before the last closing tag
                                    const insertPosition = parsedContent.content.lastIndexOf(lastClosingTagMatch[0]);
                                    parsedContent.content =
                                        parsedContent.content.substring(0, insertPosition) +
                                        parsedContinuation.continuation +
                                        parsedContent.content.substring(insertPosition);
                                } else {
                                    // Simply append if we can't find a closing tag
                                    parsedContent.content += parsedContinuation.continuation;
                                }

                                this.logger.log(`Successfully combined original content with continuation for raw feed item ${id}`);
                            }
                        }
                    } catch (continuationError) {
                        this.logger.error(`Failed to parse continuation text: ${continuationError}`);
                        this.logger.error(`Using only the original text for raw feed item ${id}`);
                    }
                }

                return {
                    ...raw,
                    originalTitle: raw.title,
                    originalContent: raw.content,
                    title: parsedContent.title,
                    content: parsedContent.content,
                    suggestedTags: parsedContent.suggestedTags || [],
                    suggestedCategories: parsedContent.suggestedCategories || [],
                    aiProcessed: true,
                    processedAt: new Date()
                };
            } catch (parseError) {
                this.logger.error(`Failed to parse AI generated content: ${parseError}`);
                throw new Error('Failed to parse AI generated content');
            }

        } catch (error: unknown) {
            this.logger.error(`Error in getAIRaw: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Update a raw feed item
     * @param id The ID of the raw feed item
     * @param data The data to update the raw feed item with
     * @returns The updated raw feed item
     */
    async updateRaw(id: string, data: any) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, {
            id: id
        });
        let updatedRaw = null;
        let updateData: any = {};

        if(data.postRef)
            updateData.postRef = data.postRef;

        if(data.rejected)
            updateData.rejected = data.rejected;

        if(data.featureImage)
            updateData.featureImage = data.featureImage;

        if (!raw)
            throw new Error(`Raw feed item with ID ${id} not found`);

        updatedRaw = await Repository.updateOne(FeedRawEntity, {
            id: id
        }, updateData);

        console.log("aki2")

        return {
            message: "Raw feed item updated successfully"
        };
    }

    /**
     * Reject a raw feed item
     * @param id The ID of the raw feed item
     * @returns The rejected raw feed item
     */
    async rejectRaw(id: string) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const raw = await Repository.findOne(FeedRawEntity, {
            id: id
        });

        if (!raw)
            throw new Error(`Raw feed item with ID ${id} not found`);

        await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({
            id: id
        }), { rejected: true });

        return {
            message: "Raw feed item rejected successfully"
        };
    }

    /**
     * Proxy image
     * @param imageUrl The URL of the image to proxy
     * @param res The response object
     * @returns The image
     */
    async proxyImage(imageUrl: string, res: any): Promise<any> {
        try {
            if (!imageUrl || typeof imageUrl !== 'string') {
                res.status(400).json({ error: 'URL inválida' });
                return;
            }

            const response = await fetch(imageUrl, {
                method: 'get',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok)
                throw new Error(`Error fetching image: ${response.status} ${response.statusText}`);

            const contentType = response.headers.get('content-type');
            res.setHeader('Content-Type', contentType || 'image/jpeg');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar imagem' });
        }
    }

    /**
     * Clean all raw feed items that are older than a specified period
     * @returns Information about the cleaning operation
     */
    async cleanAllRaws(): Promise<any> {
        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const deleteResult = await Repository.delete(FeedRawEntity, {});

            return {
                success: true,
                message: `Successfully cleaned raw feed items`,
                deletedCount: deleteResult || 0
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error cleaning raw feed items: ${errorMessage}`);
            throw new Error(`Failed to clean raw feed items: ${errorMessage}`);
        }
    }

    /**
     * Clean raw feed items for a specific channel that are older than a specified period
     * @param channelId The ID of the channel to clean raw items for
     * @returns Information about the cleaning operation
     */
    async cleanChannelRaws(channelId: string): Promise<any> {
        try {
            if (!channelId) {
                throw new Error("Channel ID is required");
            }

            const FeedRawEntity = Repository.getEntity("FeedRawEntity");

            const deleteResult = await Repository.delete(
                FeedRawEntity,
                Repository.queryBuilder({
                    channel: channelId
                })
            );

            return {
                success: true,
                message: `Successfully cleaned raw feed items for channel ${channelId}`,
                channelId: channelId,
                deletedCount: deleteResult || 0
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to clean raw feed items for channel: ${errorMessage}`);
        }
    }

    /**
     * Reprocess a raw feed item using the parser
     * @param id The ID of the raw feed item to reprocess
     * @returns A success message or an error
     */
    async reprocessRaw(id: string): Promise<any> {
        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

            const raw = await Repository.findOne(FeedRawEntity, {
                id: id
            });

            if (!raw)
                throw new Error(`Raw feed item with ID ${id} not found`);

            const channel = await Repository.findOne(FeedChannelsEntity, {
                id: raw.channel
            });

            if (!channel)
                throw new Error(`Channel with ID ${raw.channel} not found`);

            if (!raw.link)
                throw new Error(`Raw feed item with ID ${id} has no link`);

            try {
                const parseResult = await this.parserService.parseContent(null, raw.link);

                if (!parseResult || !parseResult.success || !parseResult.data) {
                    throw new Error(`Failed to parse content from ${raw.link}`);
                }

                const data = parseResult.data;

                const updateData: any = {
                    updatedAt: new Date()
                };

                if (data.title) updateData.title = data.title;
                if (data.content) updateData.content = data.content;
                if (data.featureImage) updateData.featureImage = data.featureImage;

                await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id: id }), updateData);

                return {
                    success: true,
                    message: "Raw feed item reprocessed successfully"
                };
            } catch (parseError) {
                this.logger.error(`Error parsing content from ${raw.link}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
                throw new Error(`Failed to parse content: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }
        } catch (error: unknown) {
            this.logger.error(`Error reprocessing raw feed item: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Automatically classify raw feed items based on game development relevance using AI
     * @returns Information about the classification operation
     */
    async classifyRawsWithAI() {
        try {
            const classifyPrompt = Config.get("blog.classifyPrompt");
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            this.logger.log("Starting AI classification of raw feed items...");

            const rawItemsResponse = await Repository.findAll(FeedRawEntity, {
                rejected: false,
                relevance: 0,
                postRef: IsNull(),
                limit: 20,
                sortBy: "pubDate",
                sort: "DESC"
            });

            if (!rawItemsResponse || rawItemsResponse.data.length === 0) {
                this.logger.log("No unclassified raw items found for AI classification");
                return;
            }
            else{
                this.logger.log(`Found ${rawItemsResponse.data.length} unclassified raw items for AI classification`);
            }

            const rawItems = rawItemsResponse.data;

            const itemsForAI = rawItems.map((item: any) => ({
                id: item.id,
                title: item.title
            }));

            const prompt = `
            You are a content classification system for a news aggregation blog.

            I'll provide you with a list of article titles, descriptions, and categories from various sources.

            Your task is to classify each article based on its relevance to:

            IMPORTANT: You must return ONLY a valid JSON array with no additional text or explanation.
            Each item in the array should contain:
            - id: the original ID
            - relevance: a score from 1-100 indicating relevance to game development (higher = more relevant)
            - rejected: true if completely unrelated to gaming or game development, false otherwise

            ${classifyPrompt}

            Here are the items to classify:
            ${JSON.stringify(itemsForAI)}
            `;

            this.logger.log("Sending classification request to AI service");
            const aiResponse = await this.aiContentService.generateContent(prompt);

            if (!aiResponse)
                throw new Error("No response received from AI classification service");

            let classificationResults;

            try {
                try {
                    classificationResults = JSON.parse(aiResponse.trim());
                } catch (directParseError) {
                    const jsonMatch = aiResponse.match(/\[\s*\{.*\}\s*\]/s);

                    if (!jsonMatch)
                        throw new Error("No valid JSON array found in AI response");

                    classificationResults = JSON.parse(jsonMatch[0]);
                }

                if (!Array.isArray(classificationResults))
                    throw new Error("AI response is not an array");

                classificationResults.forEach((result, index) => {
                    if (!result.id)
                        throw new Error(`Result at index ${index} is missing id field`);

                    if (typeof result.relevance !== 'number')
                        throw new Error(`Result at index ${index} has invalid relevance value`);

                    if (typeof result.rejected !== 'boolean')
                        throw new Error(`Result at index ${index} has invalid rejected value`);
                });

                this.logger.log(`Successfully parsed ${classificationResults.length} classification results`);
            } catch (parseError) {
                this.logger.error(`Failed to parse AI classification response: ${parseError}`);
                this.logger.error(`AI response was: ${aiResponse.substring(0, 500)}...`);
                throw new Error(`Failed to parse AI classification response: ${parseError}`);
            }

            let rejectedCount = 0;
            let classifiedCount = 0;
            let errorCount = 0;

            for (const result of classificationResults) {
                try {
                    const id = result.id;
                    const relevance = result.relevance;
                    const rejected = result.rejected;

                    // Validate item exists in database
                    const rawItem = await Repository.findOne(FeedRawEntity, { id });
                    if (!rawItem) {
                        this.logger.log(`Raw item with ID ${id} not found, skipping`);
                        errorCount++;
                        continue;
                    }

                    // Update the raw feed item
                    const updateData: any = {
                        relevance: relevance
                    };

                    if (rejected) {
                        updateData.rejected = true;
                        rejectedCount++;
                    } else {
                        classifiedCount++;
                    }

                    await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id }), updateData);
                    this.logger.log(`Updated raw item ${result.id} with relevance ${result.relevance} and rejected=${result.rejected}`);
                } catch (updateError) {
                    this.logger.error(`Error updating raw item ${result.id}: ${updateError}`);
                    errorCount++;
                }
            }

            return {
                success: true,
                message: "Raw feed items classified successfully",
                total: rawItems.length,
                classified: classifiedCount,
                rejected: rejectedCount,
                errors: errorCount
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error classifying raw feed items: ${errorMessage}`);
            throw new Error(`Failed to classify raw feed items: ${errorMessage}`);
        }
    }

    /**
     * Get raw feed items sorted by relevance
     * @param queries The queries to filter the raw feed items
     * @returns The raw feed items sorted by relevance
     */
    async getRelevantRaws(queries: any) {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");

        queries.rejected = false;
        queries.postRef = IsNull();

        const raw = await Repository.findAll(FeedRawEntity, queries, [], {
            order: {
                relevance: "DESC",
                pubDate: "DESC"
            }
        });

        return raw;
    }
}
