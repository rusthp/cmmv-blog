import {
    Controller, Get, Param,
    Put, Body, Queries, Response, Query, Post
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    RawService
} from "./raw.service";

@Controller("feed/raw")
export class RawController {
    constructor(private readonly rawService: RawService){}

    @Get("getRaws", {exclude: true })
    @Auth("feedraw:get")
    async getRaws(@Queries() queries: any) {
        return await this.rawService.getRaws(queries);
    }

    @Post("getAIRaw/:id", {exclude: true })
    @Auth("feedraw:get")
    async getAIRaw(@Param("id") id: string, @Body() data?: any) {
        return await this.rawService.getAIRaw(id, data?.content, data?.promptId);
    }

    @Post("startAIJob/:id", {exclude: true })
    @Auth("feedraw:get")
    async startAIJob(@Param("id") id: string, @Body() data?: any) {
        const jobId = await this.rawService.startAIJob(id, data?.content, data?.promptId);
        return { jobId };
    }

    @Get("getAIJobStatus/:jobId", {exclude: true })
    @Auth("feedraw:get")
    async getAIJobStatus(@Param("jobId") jobId: string) {
        return await this.rawService.getAIJobStatus(jobId);
    }

    @Put("updateRaw/:id", {exclude: true })
    @Auth("feedraw:update")
    async updateRaw(@Param("id") id: string, @Body() data: any) {
        return await this.rawService.updateRaw(id, data);
    }

    @Put("rejectRaw/:id", {exclude: true })
    @Auth("feedraw:update")
    async rejectRaw(@Param("id") id: string) {
        return await this.rawService.rejectRaw(id);
    }

    @Get("imageProxy", {exclude: true })
    async imageProxy(@Query("url") url: string, @Response() res: Response) {
        return await this.rawService.proxyImage(url, res);
    }

    @Get("audioProxy", {exclude: true })
    async audioProxy(@Query("url") url: string, @Response() res: Response) {
        return await this.rawService.proxyAudio(url, res);
    }

    @Get("cleanAllRaws", {exclude: true })
    @Auth("feedraw:delete")
    async cleanAllRaws() {
        return await this.rawService.cleanAllRaws();
    }

    @Get("cleanChannelRaws/:channelId", {exclude: true })
    @Auth("feedraw:delete")
    async cleanChannelRaws(
        @Param("channelId") channelId: string
    ) {
        return await this.rawService.cleanChannelRaws(channelId);
    }

    @Post("reprocess/:id", {exclude: true })
    @Auth("feedraw:update")
    async reprocessRaw(@Param("id") id: string) {
        return await this.rawService.reprocessRaw(id);
    }

    @Post("classifyRawsWithAI", {exclude: true })
    @Auth("feedraw:update")
    async classifyRawsWithAI() {
        return await this.rawService.classifyRawsWithAI();
    }
}
