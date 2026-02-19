import { Module } from "@cmmv/core";
import { WebScraperService } from "./web-scraper.service";

export const WebScraperModule = new Module('rss-aggregation-web-scraper', {
    providers: [WebScraperService],
    controllers: []
});

