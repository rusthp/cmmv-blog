import { Module } from '@cmmv/core';
import { OddsSyncTeamsService } from "./teams.service";
import { OddsTeamsController } from "./teams.controller";

export const OddsTeamsModule = new Module('odds-teams', {
    providers: [OddsSyncTeamsService],
    controllers: [OddsTeamsController]
}); 