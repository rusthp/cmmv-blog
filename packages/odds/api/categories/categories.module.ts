import { Module } from '@cmmv/core';

import {
    OddsCategoriesServiceTools
} from "./categories.service";

import {
    OddsCategoriesControllerTools
} from "./categories.controller";

export const OddsCategoriesModule = new Module('odds-categories-tools', {
    providers: [OddsCategoriesServiceTools],
    controllers: [OddsCategoriesControllerTools]
});
