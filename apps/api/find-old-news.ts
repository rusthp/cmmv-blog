import { Repository } from "@cmmv/repository";
import { Config, Application } from "@cmmv/core";
import { RSSAggregationModule } from "@cmmv/rss-aggregation/api/rss-aggregation.module";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { Like } from "@cmmv/repository";

dotenv.config({ path: resolve(process.cwd(), '.env') });

Application.create({
    httpAdapter: null,
    modules: [
        RSSAggregationModule
    ],
    services: []
});

async function main() {
    await Config.loadConfig();
    await Repository.initialize();

    const FeedRawEntity = Repository.getEntity("FeedRawEntity");
    const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

    const rawItems = await Repository.findAll(FeedRawEntity, {
        title: Like('%bt0 fala sobre retorno%')
    });

    console.log("Raw items found:", rawItems?.data?.length || 0);

    for (const item of rawItems?.data || []) {
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
            console.log("Channel RSS:", channel.rss);
            console.log("Channel ListPageUrl:", channel.listPageUrl);
        } else {
            console.log("Channel ID (Not found):", item.channel);
        }
    }
}

main().catch(console.error);
