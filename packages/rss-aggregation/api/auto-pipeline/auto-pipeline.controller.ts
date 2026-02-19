import {
    Controller, Get
} from "@cmmv/http";

import { Application, Logger } from "@cmmv/core";

import {
    AutoPipelineService
} from "./auto-pipeline.service";

import {
    ChannelsService
} from "../channels/channels.service";

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
