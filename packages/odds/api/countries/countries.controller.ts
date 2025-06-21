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
    constructor(private readonly syncService: OddsSyncCountriesService) {}

    @Get()
    @Auth("oddscountries:get")
    async getCountries(@Queries() queries: any) {
        return this.syncService.getCountries(queries);
    }

    @Post("sync")
    @Auth("oddscountries:update")
    async syncFromAPI(@Body() body: { settingId: string; endpoint: string }) {
        return this.syncService.syncCountriesFromAPI(body.settingId, body.endpoint);
    }

    @Post(":id/process-flag")
    async processFlag(@Param("id") id: string) {
        return this.syncService.processCountryFlag(id);
    }

    @Post("process-all-flags")
    async processAllFlags() {
        return this.syncService.processAllFlags();
    }
}
