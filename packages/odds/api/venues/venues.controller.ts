import { Controller, Post, Body, Get, Query } from "@cmmv/http";
import { Auth } from "@cmmv/auth";
import { OddsSyncVenuesService } from './venues.service';

@Controller("odds/venues")
export class OddsVenuesController {
    constructor(private oddsSyncVenuesService: OddsSyncVenuesService) {}

    @Post("sync")
    @Auth("oddsvenues:update")
    async syncVenues(@Body() body: { settingId: string; endpoint: string; country?: string; search?: string; id?: number; name?: string; city?: string }) {
        const { settingId, endpoint, country, search, id, name, city } = body;
        return await this.oddsSyncVenuesService.syncVenuesFromAPI(settingId, endpoint, country, search, id, name, city);
    }

    @Post("sync-all-countries")
    @Auth("oddsvenues:update")
    async syncAllVenuesByCountries(@Body() body: { settingId: string }) {
        const { settingId } = body;
        return await this.oddsSyncVenuesService.startSyncAllVenuesByCountries(settingId);
    }
    
    @Get("sync-progress/:syncId")
    @Auth("oddsvenues:read")
    getSyncProgress(@Query('syncId') syncId: string) {
        return this.oddsSyncVenuesService.getSyncProgress(syncId);
    }
} 