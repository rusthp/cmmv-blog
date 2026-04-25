import {
    Controller, Get, RouterSchema,
    Queries, Req, Param,
    CacheControl, ContentType, Raw
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    ChannelsService
} from "./channels.service";

@Controller("feed/channel-actions")
export class ChannelsController {
    constructor(private readonly channelsService: ChannelsService){}

    @Get("processFeeds", {exclude: true })
    @Auth("feedchannels:update")
    async processFeeds() {
        return await this.channelsService.processFeeds(true);
    }

    @Get("processFeed/:channelId", {exclude: true })
    @Auth("feedchannels:update")
    async processFeed(@Param("channelId") channelId: string) {
        return await this.channelsService.processFeed(channelId);
    }
}
