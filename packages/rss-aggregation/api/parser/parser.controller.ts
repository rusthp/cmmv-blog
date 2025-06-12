import {
    Controller, Get, Param,
    Query,
    Post,
    Body
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    ParserService
} from "./parser.service";

@Controller("feed/parser")
export class ParserController {
    constructor(private readonly parserService: ParserService){}

    @Post("testContent")
    @Auth("feedparser:get")
    async testContent(@Body() data: any, @Query("url") url: string) {
        const urlDecoded = decodeURIComponent(url);
        return await this.parserService.testContent(data, urlDecoded);
    }

    @Get("parseURL")
    @Auth("feedparser:get")
    async parseURL(@Query("url") url: string) {
        const urlDecoded = decodeURIComponent(url);
        return await this.parserService.parseURL(urlDecoded);
    }

    @Get("parseContent/:parserId")
    @Auth("feedparser:get")
    async parseContent(@Param("parserId") parserId: string, @Query("url") url: string) {
        const urlDecoded = decodeURIComponent(url);
        return await this.parserService.parseContent(parserId, urlDecoded);
    }

    @Get("parseContentAll")
    @Auth("feedparser:get")
    async parseContentAll(@Query("url") url: string) {
        const urlDecoded = decodeURIComponent(url);
        return await this.parserService.parseContent(null, urlDecoded);
    }
}
