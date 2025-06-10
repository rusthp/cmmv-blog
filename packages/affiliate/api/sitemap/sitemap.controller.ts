import {
    Get, Controller,
    ContentType, Raw,
    CacheControl, Param
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
        try {
            return await this.sitemapService.generateSitemapIndex();
        } catch (error) {
            console.error('Error generating sitemap index:', error);
            throw error;
        }
    }

    @Get('affiliate-campaign-sitemap.xml')
    @ContentType('text/xml')
    @CacheControl({ maxAge: 86400, public: true })
    async getCampaignSitemap() {
        try {
            return await this.sitemapService.getCampaignSitemap();
        } catch (error) {
            console.error('Error generating campaign sitemap:', error);
            throw error;
        }
    }

    @Get('affiliate-campaign-sitemap-:page.xml')
    @ContentType('text/xml')
    @CacheControl({ maxAge: 86400, public: true })
    async getCampaignSitemapPaginated(@Param('page') page: string) {
        try {
            const pageNumber = parseInt(page) || 1;
            return await this.sitemapService.getCampaignSitemap(pageNumber);
        } catch (error) {
            console.error(`Error generating campaign sitemap page ${page}:`, error);
            throw error;
        }
    }

    @Get('affiliate-category-sitemap.xml')
    @ContentType('text/xml')
    @CacheControl({ maxAge: 86400, public: true })
    async getCategorySitemap() {
        try {
            return await this.sitemapService.getCategorySitemap();
        } catch (error) {
            console.error('Error generating category sitemap:', error);
            throw error;
        }
    }
}
