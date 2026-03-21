import {
    Controller, Get, Param,
    Query, Post, Body, Put,
    Delete, Queries, Req
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    Repository
} from "@cmmv/repository";

import {
    ParserService
} from "./parser.service";

@Controller("feed/parser")
export class ParserController {
    constructor(private readonly parserService: ParserService){}

    @Get()
    @Auth("feedparser:get")
    async getAll(@Queries() queries: any, @Req() req: any) {
        const FeedParserEntity = Repository.getEntity("FeedParserEntity");
        const result = await Repository.findAll(FeedParserEntity, queries);
        return result;
    }

    @Get(":id")
    @Auth("feedparser:get")
    async getById(@Param("id") id: string) {
        const FeedParserEntity = Repository.getEntity("FeedParserEntity");
        const result = await Repository.findBy(FeedParserEntity, { id });
        return { data: result };
    }

    @Get("parseURL")
    @Auth("feedparser:get")
    async parseURL(@Query("url") url: string) {
        return await this.parserService.parseURL(url);
    }

    @Get("parseContent/:parserId")
    @Auth("feedparser:get")
    async parseContent(@Param("parserId") parserId: string, @Query("url") url: string) {
        return await this.parserService.parseContent(parserId, url);
    }

    @Get("parseContentAll")
    @Auth("feedparser:get")
    async parseContentAll(@Query("url") url: string) {
        return await this.parserService.parseContent(null, url);
    }

    @Get("analyze-all")
    @Auth("feedparser:get")
    async analyzeAllParsers() {
        return await this.parserService.analyzeAllParsers();
    }

    @Post()
    @Auth("feedparser:create")
    async createParser(@Body() body: any) {
        return await this.parserService.createParser(body);
    }

    @Put(":id")
    @Auth("feedparser:update")
    async updateParser(@Param("id") id: string, @Body() body: any) {
        return await this.parserService.updateParser(id, body);
    }

    @Delete(":id")
    @Auth("feedparser:delete")
    async deleteParser(@Param("id") id: string) {
        const FeedParserEntity = Repository.getEntity("FeedParserEntity");
        const result = await Repository.delete(FeedParserEntity, id);
        return result;
    }

    @Post("refine")
    @Auth("feedparser:update")
    async refineParser(@Body() body: { url: string; parser: any }) {
        const { url, parser } = body;
        return await this.parserService.refineWithAI(url, parser);
    }

    @Post("test-custom")
    @Auth("feedparser:get")
    async testCustomParser(@Body() body: { url: string; parserData: any }) {
        const { url, parserData } = body;
        return await this.parserService.testCustomParser(url, parserData);
    }
}
