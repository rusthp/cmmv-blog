import { Controller, Post, Body, Get, Query } from "@cmmv/http";
import { Auth } from "@cmmv/auth";
import { OddsSyncTeamsService } from './teams.service';

@Controller("odds/teams")
export class OddsTeamsController {
    constructor(private oddsSyncTeamsService: OddsSyncTeamsService) {}

    @Post("sync")
    @Auth("oddsteams:update")
    async syncTeams(@Body() body: { 
        settingId: string; 
        id?: string; 
        name?: string; 
        country?: string; 
        code?: string; 
        venue?: string; 
        league?: string; 
        season?: string; 
        search?: string; 
    }) {
        const { settingId, ...params } = body;
        return await this.oddsSyncTeamsService.startSyncTeams(settingId, params);
    }
    
    @Get("sync-progress/:syncId")
    @Auth("oddsteams:read")
    getSyncProgress(@Query('syncId') syncId: string) {
        return this.oddsSyncTeamsService.getSyncProgress(syncId);
    }
} 