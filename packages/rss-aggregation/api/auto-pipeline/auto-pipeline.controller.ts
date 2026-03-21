import {
    Controller, Get
} from "@cmmv/http";

import { Application, Config, Logger } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

import {
    AutoPipelineService
} from "./auto-pipeline.service";

import {
    ChannelsService
} from "../channels/channels.service";

import { ImagePipelineWorker } from "./image-pipeline";

@Controller("pipeline")
export class AutoPipelineController {

    @Get("classify", { exclude: true })
    async runClassify() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.classifyWorker();
        return { result: true, message: "classifyWorker executed" };
    }

    @Get("generate", { exclude: true })
    async runGenerate() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.generateWorker();
        return { result: true, message: "generateWorker executed" };
    }

    @Get("postworker", { exclude: true })
    async runPost() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.postWorker();
        return { result: true, message: "postWorker executed" };
    }

    @Get("runall", { exclude: true })
    async runAll() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.classifyWorker();
        await svc.generateWorker();
        await svc.postWorker();
        return { result: true, message: "Full pipeline executed" };
    }
    @Get("reprocess-images", { exclude: true })
    async reprocessImages() {
        const logger = new Logger("ImageReprocess");
        logger.log("Starting image reprocessing for posts without feature images...");

        const PostsEntity = Repository.getEntity("PostsEntity");
        const MediasService = Application.resolveProvider(
            (await import("@cmmv/blog")).MediasService
        );

        const imagePipeline = new ImagePipelineWorker(MediasService);

        // Find posts with empty or missing featureImage
        const allPosts = await Repository.findAll(PostsEntity, {
            limit: 100,
            sortBy: 'createdAt',
            sort: 'DESC',
        });

        let fixed = 0;
        let failed = 0;

        for (const post of allPosts?.data || []) {
            if (post.featureImage && post.featureImage.trim() !== '') continue;

            try {
                // Try to find image from linked feed raw
                const FeedRawEntity = Repository.getEntity("FeedRawEntity");
                const feedRaw = await Repository.findOne(FeedRawEntity, { postRef: post.id });

                let imageUrl = feedRaw?.featureImage || '';

                // Try to extract from the original link if available
                if (!imageUrl && feedRaw?.link) {
                    const channelsService: any = Application.resolveProvider(ChannelsService);
                    try {
                        imageUrl = await channelsService.extractImageFromPageMeta(feedRaw.link);
                    } catch { /* silent */ }
                }

                let resolvedImage = '';
                if (imageUrl) {
                    resolvedImage = await imagePipeline.validateAndResolveImage(imageUrl, post.title || '');
                }

                // Fallback to placeholder
                if (!resolvedImage) {
                    resolvedImage = await imagePipeline.createAndSavePlaceholder(post.title || 'Post');
                }

                if (resolvedImage) {
                    await Repository.updateOne(
                        PostsEntity,
                        Repository.queryBuilder({ id: post.id }),
                        { featureImage: resolvedImage }
                    );
                    fixed++;
                    logger.log(`Fixed image for post: "${post.title}"`);
                } else {
                    failed++;
                }
            } catch (err: any) {
                failed++;
                logger.log(`Failed to reprocess image for "${post.title}": ${err.message}`);
            }
        }

        return {
            result: true,
            message: `Image reprocessing complete: ${fixed} fixed, ${failed} failed`,
            fixed,
            failed,
        };
    }

    @Get("test-full-pipeline", { exclude: true })
    async runTestPipeline() {
        const logger = new Logger("PipelineTest");
        const channelsService: any = Application.resolveProvider(ChannelsService);
        const autoPipelineService: any = Application.resolveProvider(AutoPipelineService);

        logger.log("Starting Full Pipeline Test...");

        // 1. Fetch Feeds
        logger.log("1. Fetching Feeds...");
        await channelsService.processFeeds(true);

        // 2. Classify
        logger.log("2. Running Classify Worker...");
        await autoPipelineService.classifyWorker();

        // 3. Generate
        logger.log("3. Running Generate Worker...");
        await autoPipelineService.generateWorker();

        // 4. Post
        logger.log("4. Running Post Worker...");
        await autoPipelineService.postWorker();

        return {
            result: true,
            message: "Full pipeline test executed",
            steps: ["fetch", "classify", "generate", "post"]
        };
    }
}
