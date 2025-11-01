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
    WebScraperModule
} from "./web-scraper/web-scraper.module";

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
        WebScraperModule
    ]
});
