import {
    Get, Controller,
    ContentType, Raw,
    CacheControl
} from "@cmmv/http";

import {
    AffiliateSitemapService
} from "./sitemap.service";

@Controller("affiliate")
export class AffiliateSitemapController {
    constructor(private readonly sitemapService: AffiliateSitemapService) {}

    @Get('sitemap')
    @ContentType('text/xml')
    @CacheControl({ maxAge: 2592000, public: true })
    async getSitemapHandler() {
        return this.getSitemap();
    }

    @Get('sitemap.xml')
    @ContentType('text/xml')
    @CacheControl({ maxAge: 86400, public: true })
    async getSitemap() {
        return this.sitemapService.generateSitemapIndex();
    }

    @Get('affiliate-campaign-sitemap.xml')
    @ContentType('text/xml')
    @CacheControl({ maxAge: 86400, public: true })
    async getCampaignSitemap() {
        return this.sitemapService.getCampaignSitemap();
    }

    @Get('affiliate-category-sitemap.xml')
    @ContentType('text/xml')
    @CacheControl({ maxAge: 86400, public: true })
    async getCategorySitemap() {
        return this.sitemapService.getCategorySitemap();
    }
}
