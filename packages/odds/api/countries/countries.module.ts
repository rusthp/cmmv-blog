import { Module } from '@cmmv/core';

import {
    OddsSyncCountriesService
} from "./countries.service";

import {
    OddsCountriesController
} from "./countries.controller";

export const OddsCountriesModule = new Module('odds-countries', {
    providers: [OddsSyncCountriesService],
    controllers: [OddsCountriesController]
});
