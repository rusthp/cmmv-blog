import { Module } from '@cmmv/core';

import { AfilioService } from "./afilio.service";
import { AwinService } from "./awin.service";
import { CityadsService } from "./cityads.service";
import { LomadeeService } from "./lomadee.service";

export const AffiliateNetworkApiModule = new Module('affiliate-network-api', {
    providers: [
        AfilioService,
        AwinService,
        CityadsService,
        LomadeeService
    ]
});
