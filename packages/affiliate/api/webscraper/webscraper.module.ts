import { Module } from '@cmmv/core';

import {
    WebscraperServiceTools
} from "./webscraper.service";

import {
    WebscraperControllerTools
} from "./webscraper.controller";

export const AffiliateWebscraperModule = new Module('affiliate-webscraper-tools', {
    providers: [WebscraperServiceTools],
    controllers: [WebscraperControllerTools]
});
