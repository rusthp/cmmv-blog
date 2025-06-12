import { Controller, Get, Queries, Post, Body, Param } from "@cmmv/http";
import { Auth } from "@cmmv/auth";
import { FeedAIService } from "./feed-ai.service";

@Controller("feed/ai-content")
export class FeedAIController {
    constructor(private readonly feedAIService: FeedAIService) {}

    @Get("get", { exclude: true })
    @Auth("feedraw:get")
    async get(@Queries() queries: any) {
        return await this.feedAIService.get(queries);
    }

    @Post("update/:id", { exclude: true })
    @Auth("feedraw:update")
    async update(@Param('id') id: string, @Body() body: any) {
        return await this.feedAIService.update(id, body);
    }
} 