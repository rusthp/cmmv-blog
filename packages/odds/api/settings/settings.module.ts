import { Module } from '@cmmv/core';
import { OddsSettingsService } from "./settings.service";
import { OddsSettingsController } from "./settings.controller";

export const OddsSettingsModule = new Module('odds-settings-tools', {
    providers: [OddsSettingsService],
    controllers: [OddsSettingsController]
}); 