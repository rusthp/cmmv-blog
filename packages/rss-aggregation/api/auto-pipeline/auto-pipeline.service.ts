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

    private readonly classificationWorker: ClassificationWorker;
    private readonly generationWorker: GenerationWorker;
    private readonly postingWorker: PostingWorker;
    private readonly imagePipeline: ImagePipelineWorker;

    constructor(
        _aiContentService: AIContentService
    ) {
        try {
            if (Application.instance && Application.instance.providersMap.has("MediasService")) {
                mediasServiceInstance = Application.instance.providersMap.get("MediasService");
            }
        } catch (e: any) {
            AutoPipelineService.logger.log(`[pipeline][WARN] Failed to preload MediasService: ${e.message}`);
        }

        this.imagePipeline = new ImagePipelineWorker(mediasServiceInstance);
        this.classificationWorker = new ClassificationWorker();
        this.generationWorker = new GenerationWorker();
        this.postingWorker = new PostingWorker(this.imagePipeline);
    }

    // ─── Kill Switch ──────────────────────────────────────────
    private isEnabled(): boolean {
        return Config.get<boolean>("blog.autoPipelineEnabled", false);
    }

    // ═══════════════════════════════════════════════════════════
    // CRON TRIGGERS
    // ═══════════════════════════════════════════════════════════

    @Cron(CronExpression.EVERY_2_HOURS)
    async classifyWorkerCron() {
        try {
            if (!this.isEnabled()) return;
            await this.classificationWorker.run();
        } catch (err) {
            console.error('[pipeline] classifyWorkerCron error:', err);
        }
    }

    @Cron(CronExpression.EVERY_30_MINUTES)
    async generateWorkerCron() {
        try {
            if (!this.isEnabled()) return;
            await this.generationWorker.run();
        } catch (err) {
            console.error('[pipeline] generateWorkerCron error:', err);
        }
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async postWorkerCron() {
        try {
            if (!this.isEnabled()) return;
            await this.postingWorker.run();
        } catch (err) {
            console.error('[pipeline] postWorkerCron error:', err);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API (for controller / manual triggers)
    // ═══════════════════════════════════════════════════════════

    async classifyWorker(): Promise<void> {
        return this.classificationWorker.run();
    }

    async generateWorker(): Promise<void> {
        return this.generationWorker.run();
    }

    async postWorker(): Promise<void> {
        return this.postingWorker.run();
    }

    /**
     * Exposed for external callers that need image validation
     * (e.g., manual re-processing, API endpoints).
     */
    async validateAndResolveImage(url: string, title: string, channelReferer?: string): Promise<string> {
        return this.imagePipeline.validateAndResolveImage(url, title, channelReferer);
    }
}
