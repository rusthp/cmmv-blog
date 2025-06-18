import {
    OddsSettingsContract
} from "./odds-settings.contract";

import {
    OddsCountriesContract
} from "./odds-countries.contract";

import {
    OddsLeaguesContract
} from "./odds-leagues.contract";

import {
    OddsVenuesContract
} from "./odds-venues.contract";

import {
    OddsTeamsContract
} from "./odds-teams.contract";

export * from './odds-bets.contract';
export * from './odds-countries.contract';
export * from './odds-leagues.contract';
export * from './odds-categories.contract';
export * from './odds-settings.contract';
export * from './odds-venues.contract';
export * from './odds-teams.contract';

export default [
    OddsSettingsContract,
    OddsCountriesContract,
    OddsLeaguesContract,
    OddsVenuesContract,
    OddsTeamsContract
];