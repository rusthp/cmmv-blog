import {
    Service, Logger,
    Config, Cron,
    CronExpression,
    Application
} from "@cmmv/core";

import { Repository } from "@cmmv/repository";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

import { PIPELINE_STATE } from "./pipeline-constants";
import { ClassificationWorker } from "./classification-worker";
import { KeywordEngineWorker } from "./keyword-engine";
import { KeywordSuggestionsWorker } from "./keyword-suggestions.worker";
import { GenerationWorker } from "./generation-worker";
import { PostingWorker } from "./posting-worker";
import { PostUpdateWorker } from "./post-update-worker";
import { ImagePipelineWorker } from "./image-pipeline";

let mediasServiceInstance: any = null;

/**
 * Pipeline Orchestrator — thin coordinator that owns @Cron decorators
 * and delegates actual work to dedicated workers:
 *
 *   ClassificationWorker  → AI-based relevance scoring
 *   KeywordEngineWorker   → long-tail keyword generation (CLASSIFIED → KEYWORD_DONE)
 *   GenerationWorker      → 2-pass AI content generation (KEYWORD_DONE → GENERATED)
 *   PostingWorker          → post creation, categories, scheduling
 *   ImagePipelineWorker    → image download, cache, placeholder
 */
@Service()
export class AutoPipelineService {
    private static readonly logger = new Logger("AutoPipelineService");

    private static classificationWorkerInstance: ClassificationWorker;
    private static keywordEngineInstance: KeywordEngineWorker;
    private static keywordSuggestionsInstance: KeywordSuggestionsWorker;
    private static generationWorkerInstance: GenerationWorker;
    private static postingWorkerInstance: PostingWorker;
    private static postUpdateWorkerInstance: PostUpdateWorker;
    private static imagePipelineInstance: ImagePipelineWorker;

    constructor(
        _aiContentService: AIContentService
    ) {
        if (AutoPipelineService.postingWorkerInstance) return;

        try {
            if (Application.instance && Application.instance.providersMap.has("MediasService")) {
                mediasServiceInstance = Application.instance.providersMap.get("MediasService");
            }
        } catch (e: any) {
            AutoPipelineService.logger.log(`[pipeline][WARN] Failed to preload MediasService: ${e.message}`);
        }

        AutoPipelineService.imagePipelineInstance = new ImagePipelineWorker(mediasServiceInstance);
        AutoPipelineService.classificationWorkerInstance = new ClassificationWorker();
        AutoPipelineService.keywordEngineInstance = new KeywordEngineWorker();
        AutoPipelineService.keywordSuggestionsInstance = new KeywordSuggestionsWorker();
        AutoPipelineService.generationWorkerInstance = new GenerationWorker();
        AutoPipelineService.postingWorkerInstance = new PostingWorker(AutoPipelineService.imagePipelineInstance);
        AutoPipelineService.postUpdateWorkerInstance = new PostUpdateWorker();
    }

    // ─── Kill Switch ──────────────────────────────────────────
    private static isEnabled(): boolean {
        return Config.get<boolean>("blog.autoPipelineEnabled", false);
    }

    // ═══════════════════════════════════════════════════════════
    // CRON TRIGGERS
    // ═══════════════════════════════════════════════════════════

    @Cron(CronExpression.EVERY_2_HOURS)
    async classifyWorkerCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await AutoPipelineService.classificationWorkerInstance.run();
        } catch (err) {
            console.error('[pipeline] classifyWorkerCron error:', err);
        }
    }

    @Cron("5,35 * * * *")
    async keywordEngineWorkerCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await AutoPipelineService.keywordEngineInstance.run();
        } catch (err) {
            console.error('[pipeline] keywordEngineWorkerCron error:', err);
        }
    }

    @Cron("10,40 * * * *")
    async generateWorkerCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await AutoPipelineService.generationWorkerInstance.run();
        } catch (err) {
            console.error('[pipeline] generateWorkerCron error:', err);
        }
    }

    @Cron("15,45 * * * *")
    async keywordSuggestionsWorkerCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await AutoPipelineService.keywordSuggestionsInstance.run();
        } catch (err) {
            console.error('[pipeline] keywordSuggestionsWorkerCron error:', err);
        }
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async postWorkerCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await AutoPipelineService.postingWorkerInstance.run();
        } catch (err) {
            console.error('[pipeline] postWorkerCron error:', err);
        }
    }

    @Cron("0 3 * * *")
    async postUpdateWorkerCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await AutoPipelineService.postUpdateWorkerInstance.run();
        } catch (err) {
            console.error('[pipeline] postUpdateWorkerCron error:', err);
        }
    }

    @Cron("*/30 * * * *")
    async recoverStuckItemsCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await this.recoverStuckItems();
        } catch (err) {
            console.error('[pipeline] recoverStuckItemsCron error:', err);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API (for controller / manual triggers)
    // ═══════════════════════════════════════════════════════════

    async classifyWorker(): Promise<void> {
        return AutoPipelineService.classificationWorkerInstance.run();
    }

    async keywordEngineWorker(): Promise<void> {
        return AutoPipelineService.keywordEngineInstance.run();
    }

    async generateWorker(): Promise<void> {
        return AutoPipelineService.generationWorkerInstance.run();
    }

    async postWorker(): Promise<void> {
        return AutoPipelineService.postingWorkerInstance.run();
    }

    async keywordSuggestionsWorker(): Promise<void> {
        return AutoPipelineService.keywordSuggestionsInstance.run();
    }

    async postUpdateWorker(): Promise<void> {
        return AutoPipelineService.postUpdateWorkerInstance.run();
    }

    /**
     * Exposed for external callers that need image validation
     * (e.g., manual re-processing, API endpoints).
     */
    async validateAndResolveImage(url: string, title: string, channelReferer?: string): Promise<string> {
        return AutoPipelineService.imagePipelineInstance.validateAndResolveImage(url, title, channelReferer);
    }

    private async recoverStuckItems(): Promise<void> {
        try {
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");
            const staleThresholdMs = 30 * 60 * 1000; // 30 minutes
            const staleDate = new Date(Date.now() - staleThresholdMs);

            // Items stuck in CLASSIFYING → reset to PENDING
            const stuckClassifying = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.CLASSIFYING,
                limit: 100,
                sortBy: 'updatedAt',
                sort: 'ASC',
            });

            if (stuckClassifying?.data?.length) {
                const maxAttempts = Config.get<number>('blog.autoPipelineMaxAttempts', 3);
                for (const item of stuckClassifying.data) {
                    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
                    if (!updatedAt || updatedAt > staleDate) continue;
                    const attempts = (item.aiAttempts || 0) + 1;
                    if (attempts >= maxAttempts) {
                        await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id: item.id }), { pipelineState: PIPELINE_STATE.FAILED, aiAttempts: attempts });
                        AutoPipelineService.logger.log(`[pipeline][recovery] Item ${item.id} stuck in CLASSIFYING >30min, max attempts → FAILED`);
                    } else {
                        await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id: item.id }), { pipelineState: PIPELINE_STATE.PENDING, aiAttempts: attempts });
                        AutoPipelineService.logger.log(`[pipeline][recovery] Item ${item.id} stuck in CLASSIFYING >30min → reset to PENDING (attempt ${attempts}/${maxAttempts})`);
                    }
                }
            }

                        // Items stuck in POSTING → reset to GENERATED
            const stuckPosting = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.POSTING,
                limit: 50,
                sortBy: 'updatedAt',
                sort: 'ASC',
            });

            if (stuckPosting?.data?.length) {
                for (const item of stuckPosting.data) {
                    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
                    if (!updatedAt || updatedAt > staleDate) continue;
                    // Only reset if no postRef — if postRef exists, mark DONE
                    if (item.postRef) {
                        await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id: item.id }), { pipelineState: PIPELINE_STATE.DONE });
                        AutoPipelineService.logger.log(`[pipeline][recovery] Item ${item.id} stuck in POSTING with postRef → DONE`);
                    } else {
                        await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id: item.id }), { pipelineState: PIPELINE_STATE.GENERATED, aiAttempts: 0 });
                        AutoPipelineService.logger.log(`[pipeline][recovery] Item ${item.id} stuck in POSTING >30min → reset to GENERATED`);
                    }
                }
            }

            // Items stuck in GENERATING → reset to KEYWORD_DONE (or CLASSIFIED as fallback)
            const stuckGenerating = await Repository.findAll(FeedRawEntity, {
                pipelineState: PIPELINE_STATE.GENERATING,
                limit: 50,
                sortBy: 'updatedAt',
                sort: 'ASC',
            });

            if (stuckGenerating?.data?.length) {
                for (const item of stuckGenerating.data) {
                    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
                    if (!updatedAt || updatedAt > staleDate) continue;
                    const resetState = item.pipelineState === PIPELINE_STATE.GENERATING
                        ? PIPELINE_STATE.KEYWORD_DONE
                        : PIPELINE_STATE.CLASSIFIED;
                    await Repository.updateOne(FeedRawEntity, Repository.queryBuilder({ id: item.id }), { pipelineState: resetState, aiAttempts: 0 });
                    AutoPipelineService.logger.log(`[pipeline][recovery] Item ${item.id} stuck in GENERATING >30min → reset to ${resetState}`);
                }
            }
        } catch (err: any) {
            AutoPipelineService.logger.error(`[pipeline][recovery] recoverStuckItems error: ${err.message}`);
        }
    }
}
