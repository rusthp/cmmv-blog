import { Repository } from "@cmmv/repository";
import { Config, Application } from "@cmmv/core";
import { RSSAggregationModule } from "@cmmv/rss-aggregation/api/rss-aggregation.module";
import { BlogModule } from "@cmmv/blog";
import * as dotenv from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

dotenv.config({ path: resolve(process.cwd(), '.env') });

Application.create({
    httpAdapter: null,
    modules: [
        BlogModule,
        RSSAggregationModule
    ],
    services: []
});

async function main() {
    await Config.loadConfig();
    await Repository.initialize();

    const FeedRawEntity = Repository.getEntity("FeedRawEntity");
    const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

    const items = await Repository.findAll(FeedRawEntity, {
        limit: 50
    }, ["createdAt", "DESC"]);

    const results = [];
    for (const item of items?.data || []) {
        const channel = await Repository.findOne(FeedChannelsEntity, { id: item.channel });
        results.push({
            id: item.id,
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            createdAt: item.createdAt,
            channelName: channel?.name,
            channelType: channel?.sourceType
        });
    }

    fs.writeFileSync(resolve(process.cwd(), 'recent.json'), JSON.stringify(results, null, 2));
    console.log("Wrote recent.json");
}

main().catch(console.error);
