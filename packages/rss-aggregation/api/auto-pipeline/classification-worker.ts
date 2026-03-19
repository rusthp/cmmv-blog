import { Logger, Config, Application } from "@cmmv/core";
import { Repository, IsNull } from "@cmmv/repository";
import { PIPELINE_STATE } from "./pipeline-constants";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

/**
 * Worker responsible for classifying raw feed items via AI.
 * Sends batch of pending items → AI returns relevance scores → items are accepted or rejected.
 */
export class ClassificationWorker {
    private static readonly logger = new Logger("ClassificationWorker");
    private static isRunning = false;

    async run(): Promise<void> {
        if (ClassificationWorker.isRunning) {
            ClassificationWorker.logger.log("[pipeline] classifyWorker already running, skipping");
            return;
        }

        ClassificationWorker.isRunning = true;

        try {
            const classifyPrompt = Config.get("blog.classifyPrompt");
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const maxAttempts = Config.get<number>("blog.autoPipelineMaxAttempts", 3);
            const threshold = Config.get<number>("blog.autoPipelineRelevanceThreshold", 70);

            ClassificationWorker.logger.log("[pipeline] classifyWorker: Starting classification cycle");

            const rawItemsResponse = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.PENDING,
                rejected: false,
                postRef: IsNull(),
                limit: 20,
                sortBy: "pubDate",
                sort: "DESC"
            });

            if (!rawItemsResponse || rawItemsResponse.data.length === 0) {
                ClassificationWorker.logger.log("[pipeline] classifyWorker: No pending items to classify");
                return;
            }

            const rawItems = rawItemsResponse.data;
            ClassificationWorker.logger.log(`[pipeline] classifyWorker: Found ${rawItems.length} items to classify`);

            // Lock all items to 'classifying' state
            for (const item of rawItems) {
                await this.transitionState(item.id, PIPELINE_STATE.PENDING, PIPELINE_STATE.CLASSIFYING);
            }

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

            ClassificationWorker.logger.log("[pipeline] classifyWorker: Sending classification request to AI");
            const aiContentService: any = Application.resolveProvider(AIContentService);
            const aiResponse = await aiContentService.generateContent(prompt);

            if (!aiResponse) {
                for (const item of rawItems) {
                    await this.handleFailure(item.id, PIPELINE_STATE.CLASSIFYING, "No AI response for classification", maxAttempts);
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
                ClassificationWorker.logger.error(`[pipeline] classifyWorker: Failed to parse AI response: ${parseError}`);
                for (const item of rawItems) {
                    await this.handleFailure(item.id, PIPELINE_STATE.CLASSIFYING, `Parse error: ${parseError}`, maxAttempts);
                }
                return;
            }

            // Apply classification results
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

            // Handle orphaned items not in AI response
            const classifiedIds = new Set(classificationResults.map(r => r.id));
            for (const item of rawItems) {
                if (!classifiedIds.has(item.id)) {
                    await this.handleFailure(item.id, PIPELINE_STATE.CLASSIFYING, "Not included in AI classification response", maxAttempts);
                }
            }

            ClassificationWorker.logger.log("[pipeline] classifyWorker: Classification cycle complete");
        } catch (error) {
            ClassificationWorker.logger.error(
                `[pipeline] classifyWorker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            ClassificationWorker.isRunning = false;
        }
    }

    // ─── Helpers ──────────────────────────────────────────────

    private pipelineLog(rawId: string, message: string) {
        ClassificationWorker.logger.log(`[pipeline][${rawId}] ${message}`);
    }

    private pipelineError(rawId: string, message: string) {
        ClassificationWorker.logger.error(`[pipeline][${rawId}] ${message}`);
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
            const retryState = PIPELINE_STATE.PENDING;
            await Repository.updateOne(
                FeedRawEntity,
                Repository.queryBuilder({ id: rawId }),
                { pipelineState: retryState, aiAttempts: attempts }
            );
            this.pipelineLog(rawId, `Attempt ${attempts}/${maxAttempts} failed, reset to '${retryState}' for retry. Error: ${error}`);
        }
    }
}
