import {
    Controller, Get,
    Queries, Param,
    Post, Body, Put, Delete
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    YTVideosServiceAdmin
} from "./videos.service";

@Controller("ytfeed/videos/admin")
export class YTVideosController {
    constructor(private readonly ytVideosService: YTVideosServiceAdmin){}

    @Get("/")
    @Auth("ytvideos:get")
    async getVideos(@Queries() queries: any) {
        return this.ytVideosService.getVideos(queries);
    }

    @Post("/ai/:id")
    @Auth("ytvideos:get")
    async getAIVideo(@Param("id") id: string, @Body() data?: any) {
        return this.ytVideosService.getAIVideo(id, data);
    }

    @Put("/:id")
    @Auth("ytvideos:update")
    async updateVideo(@Param("id") id: string, @Body() data: any) {
        return this.ytVideosService.updateVideo(id, data);
    }

    @Delete("/reject/:id")
    @Auth("ytvideos:update")
    async rejectVideo(@Param("id") id: string, @Body() data: any) {
        return this.ytVideosService.rejectVideo(id, data);
    }
}
