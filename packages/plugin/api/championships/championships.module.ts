import { Module } from '@cmmv/core';

import { EsportsTournamentContract } from '../../contracts/esports-tournament.contract';
import { EsportsMatchContract } from '../../contracts/esports-match.contract';
import { EsportsTeamContract } from '../../contracts/esports-team.contract';
import { Cs2RankingContract } from '../../contracts/cs2-ranking.contract';

import { ChampionshipsService } from './championships.service';
import { RankingsService } from './rankings.service';
import { LolEsportsService } from './lolesports.service';
import { Draft5Service } from './draft5.service';
import { VlrService } from './vlr.service';
import { ChampionshipsController } from './championships.controller';

export const ChampionshipsModule = new Module('blog_championships', {
    controllers: [ChampionshipsController],
    providers: [ChampionshipsService, RankingsService, LolEsportsService, Draft5Service, VlrService],
    contracts: [
        EsportsTournamentContract,
        EsportsMatchContract,
        EsportsTeamContract,
        Cs2RankingContract,
    ],
});
