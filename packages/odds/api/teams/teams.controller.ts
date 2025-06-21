import { Controller, Post, Body, Get, Query, Param } from "@cmmv/http";
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

    @Post(":id/process-image")
    @Auth("oddsteams:update")
    async processImage(@Param("id") id: string) {
        return this.oddsSyncTeamsService.processTeamImage(id);
    }

    @Post("process-all-images/start")
    @Auth("oddsteams:update")
    async startProcessAllImages() {
        return this.oddsSyncTeamsService.startProcessAllImages();
    }

    @Get("process-all-images/progress/:jobId")
    @Auth("oddsteams:read")
    async getProcessAllImagesStatus(@Param("jobId") jobId: string) {
        return this.oddsSyncTeamsService.getProcessAllImagesStatus(jobId);
    }
} 