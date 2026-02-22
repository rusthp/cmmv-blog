import { Repository } from "@cmmv/repository";
import { Config, Application } from "@cmmv/core";
import { RSSAggregationModule } from "@cmmv/rss-aggregation/api/rss-aggregation.module";
import { BlogModule } from "@cmmv/blog";
import * as dotenv from "dotenv";
import { resolve } from "path";

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

    const item1 = await Repository.findOne(FeedRawEntity, { id: 'e8c4ba6c-6ec6-407d-8a65-6c6fae1535e4' });
    const item2 = await Repository.findOne(FeedRawEntity, { id: 'c52bd7b7-2041-4fc5-990f-152c2eb317b8' });

    for (const item of [item1, item2]) {
        if (!item) continue;
        console.log("---");
        console.log("ID:", item.id);
        console.log("Title:", item.title);
        console.log("Link:", item.link);
        console.log("pubDate:", item.pubDate);
        console.log("createdAt:", item.createdAt);

        const channel = await Repository.findOne(FeedChannelsEntity, { id: item.channel });
        if (channel) {
            console.log("Channel Name:", channel.name);
            console.log("Channel Type:", channel.sourceType);
        }
    }
}

main().catch(console.error);
