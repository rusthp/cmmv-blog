import { Module } from '@cmmv/core';

import {
    FeedChannelsContract,
    FeedRawContract,
    FeedParserContract
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
<<<<<<< HEAD
    AutoPipelineModule
} from "./auto-pipeline/auto-pipeline.module";
=======
    WebScraperModule
} from "./web-scraper/web-scraper.module";
>>>>>>> 548298048e09744c9b91c1f6e6cd360e4e8e46e8

export const RSSAggregationModule = new Module('rss-aggregation', {
    contracts: [
        FeedChannelsContract,
        FeedRawContract,
        FeedParserContract
    ],
    submodules: [
        RSSChannelsModule,
        RSSRawModule,
        RSSParserModule,
<<<<<<< HEAD
        AutoPipelineModule
=======
        WebScraperModule
>>>>>>> 548298048e09744c9b91c1f6e6cd360e4e8e46e8
    ]
});
