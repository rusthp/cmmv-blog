import { Module } from '@cmmv/core';

import { AffiliateSitemapController } from "./sitemap.controller";
import { AffiliateSitemapService } from "./sitemap.service";

export const AffiliateSitemapModule = new Module('sitemap', {
    controllers: [AffiliateSitemapController],
    providers: [AffiliateSitemapService]
});
