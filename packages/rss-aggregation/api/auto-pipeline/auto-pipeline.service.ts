import {
    Service, Logger,
    Config, Cron,
    CronExpression,
    Application
} from "@cmmv/core";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

import { ClassificationWorker } from "./classification-worker";
import { GenerationWorker } from "./generation-worker";
import { PostingWorker } from "./posting-worker";
import { ImagePipelineWorker } from "./image-pipeline";

let mediasServiceInstance: any = null;

/**
 * Pipeline Orchestrator — thin coordinator that owns @Cron decorators
 * and delegates actual work to dedicated workers:
 *
 *   ClassificationWorker  → AI-based relevance scoring
 *   GenerationWorker      → 2-pass AI content generation
 *   PostingWorker          → post creation, categories, scheduling
 *   ImagePipelineWorker    → image download, cache, placeholder
 */
@Service()
export class AutoPipelineService {
    private static readonly logger = new Logger("AutoPipelineService");

    private static classificationWorkerInstance: ClassificationWorker;
    private static generationWorkerInstance: GenerationWorker;
    private static postingWorkerInstance: PostingWorker;
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
        AutoPipelineService.generationWorkerInstance = new GenerationWorker();
        AutoPipelineService.postingWorkerInstance = new PostingWorker(AutoPipelineService.imagePipelineInstance);
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

    @Cron(CronExpression.EVERY_30_MINUTES)
    async generateWorkerCron() {
        try {
            if (!AutoPipelineService.isEnabled()) return;
            await AutoPipelineService.generationWorkerInstance.run();
        } catch (err) {
            console.error('[pipeline] generateWorkerCron error:', err);
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

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API (for controller / manual triggers)
    // ═══════════════════════════════════════════════════════════

    async classifyWorker(): Promise<void> {
        return AutoPipelineService.classificationWorkerInstance.run();
    }

    async generateWorker(): Promise<void> {
        return AutoPipelineService.generationWorkerInstance.run();
    }

    async postWorker(): Promise<void> {
        return AutoPipelineService.postingWorkerInstance.run();
    }

    /**
     * Exposed for external callers that need image validation
     * (e.g., manual re-processing, API endpoints).
     */
    async validateAndResolveImage(url: string, title: string, channelReferer?: string): Promise<string> {
        return AutoPipelineService.imagePipelineInstance.validateAndResolveImage(url, title, channelReferer);
    }
}
