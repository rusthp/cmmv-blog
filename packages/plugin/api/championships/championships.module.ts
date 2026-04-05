import { Module } from '@cmmv/core';

import { Cs2TournamentContract } from '../../contracts/cs2-tournament.contract';
import { Cs2MatchContract } from '../../contracts/cs2-match.contract';
import { Cs2TeamContract } from '../../contracts/cs2-team.contract';

import { ChampionshipsService } from './championships.service';
import { ChampionshipsController } from './championships.controller';

export const ChampionshipsModule = new Module('blog_championships', {
    controllers: [ChampionshipsController],
    providers: [ChampionshipsService],
    contracts: [
        Cs2TournamentContract,
        Cs2MatchContract,
        Cs2TeamContract,
    ],
});
