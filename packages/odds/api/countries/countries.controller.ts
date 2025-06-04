import {
    Controller, Get, RouterSchema,
    Queries, Req, Param,
    CacheControl, ContentType, Raw
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    OddsCountriesService
} from "./countries.service";

@Controller("odds/countries")
export class OddsCountriesController {
    constructor(private readonly oddsCountriesService: OddsCountriesService){}

}
