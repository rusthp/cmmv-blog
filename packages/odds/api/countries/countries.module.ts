import { Module } from '@cmmv/core';

import {
    OddsCountriesService
} from "./countries.service";

import {
    OddsCountriesController
} from "./countries.controller";

export const OddsCountriesModule = new Module('odds-countries', {
    providers: [OddsCountriesService],
    controllers: [OddsCountriesController]
});
