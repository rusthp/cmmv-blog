import { Module } from '@cmmv/core';
import { FeedAIService } from "./feed-ai.service";
import { FeedAIController } from "./feed-ai.controller";

export const RSSFeedAIModule = new Module('rss-feed-ai', {
    providers: [FeedAIService],
    controllers: [FeedAIController]
}); 