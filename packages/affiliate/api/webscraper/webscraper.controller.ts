import {
    Controller, Get, Post,
    CacheControl, ContentType,
    Raw, Res, Query, Body
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    WebscraperServiceTools
} from "./webscraper.service";

@Controller("affiliate/webscraper")
export class WebscraperControllerTools {
    constructor(private readonly webscraperService: WebscraperServiceTools){}

    /**
     * Analyze a URL and generate field extraction patterns using AI
     * POST /affiliate/webscraper/analyze
     * Body: { url: string, type: 'coupon' | 'product' }
     */
    @Post("analyze")
    @Auth("affiliatewebscraper:update")
    async analyzeUrl(@Body() body: any) {
        return await this.webscraperService.analyzeUrlForExtraction(body.url, body.type);
    }

    /**
     * Test regex patterns against HTML content
     * POST /affiliate/webscraper/test-regex
     * Body: { url: string, fields: Array<{name: string, regex: string}> }
     */
    @Post("test-regex")
    @Auth("affiliatewebscraper:update")
    async testRegexPatterns(@Body() body: any) {
        return await this.webscraperService.testRegexPatternsFromUrl(body.url, body.fields);
    }

    /**
     * Get webpage content for preview
     * GET /affiliate/webscraper/preview?url=<url>
     */
    @Get("preview")
    @Auth("affiliatewebscraper:get")
    async getWebpagePreview(@Query("url") url: string) {
        return await this.webscraperService.getWebpagePreview(url);
    }

    /**
     * Health check endpoint
     * GET /affiliate/webscraper/health
     */
    @Get("health")
    @ContentType("application/json")
    @Raw()
    async healthCheck() {
        return await this.webscraperService.healthCheck();
    }
}
