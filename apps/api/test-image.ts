import { Config, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { RSSAggregationModule } from "@cmmv/rss-aggregation/api/rss-aggregation.module";
import { resolve } from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), '.env') });

import { BlogModule } from "@cmmv/blog";

Application.create({
    httpAdapter: null,
    modules: [
        BlogModule,
        RSSAggregationModule
    ],
    services: []
});

async function main() {
    Application.logger.info("Initializing Config...");
    await Config.loadConfig();

    Application.logger.info("Initializing Repository...");
    await Repository.initialize();

    // Also init medias service
    const { MediasService } = require('@cmmv/blog');
    const mediasService = Application.resolveProvider(MediasService);

    const { AutoPipelineService } = require('@cmmv/rss-aggregation/api/auto-pipeline/auto-pipeline.service');
    const service = Application.resolveProvider(AutoPipelineService);

    const testUrl = "https://img-cdn.hltv.org/gallerypicture/9m2bE5HlXwBqE3xYk0Ym4N.jpg?ixlib=java-2.1.0&s=1cb3a8a3a0021b18361b7fcd217d8ef0";

    console.log("Testing valid URL fetching...");
    const url = await service['validateAndResolveImage'](testUrl, "Test Valid");
    console.log("Final Valid Image URL:", url);

    console.log("Testing invalid URL fetching (should generate placeholder)...");
    const invalidUrl = await service['validateAndResolveImage']("https://hltv.org/invalid.jpg", "Test Invalid");
    console.log("Final Invalid Image URL:", invalidUrl);

    console.log("Done.");
}

main().catch(console.error);
