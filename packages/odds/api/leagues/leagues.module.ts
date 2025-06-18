import { Module } from '@cmmv/core';

import {
    OddsSyncLeaguesService
} from "./leagues.service";

import {
    OddsLeaguesController
} from "./leagues.controller";

export const OddsLeaguesModule = new Module('odds-leagues', {
    providers: [OddsSyncLeaguesService],
    controllers: [OddsLeaguesController]
}); 