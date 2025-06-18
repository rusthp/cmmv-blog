import {
    Controller, Get, Res, Param,
    Post, Body
} from "@cmmv/http";

import { ShortUrlServiceTools } from "./shorturl.service";

@Controller("blog")
export class ShortUrlController {
    constructor(private readonly shortUrlService: ShortUrlServiceTools) { }

    @Get("shorturl/:slug", {
        summary: "Short URL",
        exposeFilters: true,
        exclude: true
    })
    async getShortUrl(@Param("slug") slug: string, @Res() response) {
        const shortUrl = await this.shortUrlService.getShortUrl(slug);
        response.res.writeHead(shortUrl.statusHTTP, { Location: shortUrl.originalUrl });
        response.res.end();
    }

    @Post("/shorturl", {
        summary: "Create a short URL",
        exposeFilters: true,
        exclude: true
    })
    async createShortUrl(@Body() body: any) {
        console.log(this.shortUrlService);
        return this.shortUrlService.createShortUrl(body.originalUrl, body.customSlug, body.statusHTTP);
    }
}

@Controller("s")
export class ShortUrlRedirectController {
    constructor(private readonly shortUrlService: ShortUrlServiceTools) { }

    @Get(":slug", {
        summary: "Short URL Redirect",
        exposeFilters: true,
        exclude: true
    })
    async getShortUrlRedirect(@Param("slug") slug: string, @Res() response) {
        const shortUrl = await this.shortUrlService.getShortUrl(slug);
        response.res.writeHead(shortUrl.statusHTTP, { Location: shortUrl.originalUrl });
        response.res.end();
    }
}