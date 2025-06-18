import {
    Controller, Get, RouterSchema,
    Queries, Req, Param,
    CacheControl, ContentType, Raw,
    Post, Body
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    OddsSyncCountriesService
} from "./countries.service";

@Controller("odds/countries")
export class OddsCountriesController {
    constructor(private oddsCountriesService: OddsSyncCountriesService){}

    @Post("sync")
    @Auth("oddscountries:update")
    async syncCountries(@Body() body: { settingId: string; endpoint: string }) {
        const { settingId, endpoint } = body;
        return await this.oddsCountriesService.syncCountriesFromAPI(settingId, endpoint);
    }
}
