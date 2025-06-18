import {
    Controller,
    Post,
    Body
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import { OddsSyncLeaguesService } from './leagues.service';

@Controller("odds/leagues")
export class OddsLeaguesController {
    constructor(private oddsSyncLeaguesService: OddsSyncLeaguesService) {}

    @Post("sync")
    @Auth("oddsleagues:update")
    async syncLeagues(@Body() body: { settingId: string; endpoint: string }) {
        const { settingId, endpoint } = body;
        return await this.oddsSyncLeaguesService.syncLeaguesFromAPI(settingId, endpoint);
    }
} 