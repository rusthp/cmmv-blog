import { Module } from '@cmmv/core';

import {
    FeedChannelsContract,
    FeedRawContract,
    FeedParserContract,
    ImageCacheContract,
    HuntingKeywordsContract,
    HuntingResultsContract
} from '../contracts';

import {
    RSSChannelsModule
} from "./channels/channels.module";

import {
    RSSRawModule
} from "./raw/raw.module";

import {
    RSSParserModule
} from "./parser/parser.module";

import {
    AutoPipelineModule
} from "./auto-pipeline/auto-pipeline.module";

import {
    WebScraperModule
} from "./web-scraper/web-scraper.module";

import {
    RSSHuntingModule
} from "./hunting/hunting.module";

export const RSSAggregationModule = new Module('rss-aggregation', {
    contracts: [
        FeedChannelsContract,
        FeedRawContract,
        FeedParserContract,
        ImageCacheContract,
        HuntingKeywordsContract,
        HuntingResultsContract
    ],
    submodules: [
        RSSChannelsModule,
        RSSRawModule,
        RSSParserModule,
        AutoPipelineModule,
        WebScraperModule,
        RSSHuntingModule
    ]
});
