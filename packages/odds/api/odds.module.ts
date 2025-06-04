import { Module } from '@cmmv/core';

import {
    OddsBetsContract,
    OddsCountriesContract,
    OddsLeaguesContract,
    OddsCategoriesContract
} from '../contracts';

import {
    OddsCountriesModule
} from './countries/countries.module';

import {
    OddsCategoriesModule
} from './categories/categories.module';

export const OddsModule = new Module('odds', {
    contracts: [
        OddsBetsContract,
        OddsCountriesContract,
        OddsLeaguesContract,
        OddsCategoriesContract
    ],
    submodules: [
        OddsCountriesModule,
        OddsCategoriesModule
    ]
});
