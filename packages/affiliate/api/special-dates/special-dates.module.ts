import { Module } from '@cmmv/core';

import {
    AffiliateSpecialDatesServiceTools
} from "./special-dates.service";

import {
    AffiliateSpecialDatesController
} from "./special-dates.controller";

export const AffiliateSpecialDatesModule = new Module('affiliate-special-dates', {
    providers: [AffiliateSpecialDatesServiceTools],
    controllers: [AffiliateSpecialDatesController]
});