import { Module } from '@cmmv/core';
import { OddsSyncVenuesService } from "./venues.service";
import { OddsVenuesController } from "./venues.controller";

export const OddsVenuesModule = new Module('odds-venues', {
    providers: [OddsSyncVenuesService],
    controllers: [OddsVenuesController]
}); 