import {
    Controller,
    Post,
    Body,
    Get,
    Queries,
    Param
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import { OddsSyncLeaguesService } from './leagues.service';

@Controller("odds/leagues")
export class OddsLeaguesController {
    constructor(private oddsSyncLeaguesService: OddsSyncLeaguesService) {}

    @Get()
    @Auth("oddsleagues:get")
    async getLeagues(@Queries() queries: any) {
        return this.oddsSyncLeaguesService.getLeagues(queries);
    }

    @Post("sync")
    @Auth("oddsleagues:update")
    async syncLeagues(@Body() body: { settingId: string; endpoint: string }) {
        const { settingId, endpoint } = body;
        return await this.oddsSyncLeaguesService.syncLeaguesFromAPI(settingId, endpoint);
    }

    @Post(":id/process-logo")
    @Auth("oddsleagues:update")
    async processLogo(@Param("id") id: string) {
        return this.oddsSyncLeaguesService.processLeagueLogo(id);
    }

    @Post("process-all-logos/start")
    @Auth("oddsleagues:update")
    async processAllLogos() {
        return this.oddsSyncLeaguesService.startProcessAllLogos();
    }

    @Get("process-all-logos/progress/:jobId")
    @Auth("oddsleagues:get")
    async getProcessAllLogosStatus(@Param("jobId") jobId: string) {
        return this.oddsSyncLeaguesService.getProcessAllLogosStatus(jobId);
    }
} 