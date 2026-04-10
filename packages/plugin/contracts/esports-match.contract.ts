import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'EsportsMatches',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: false,
    generateBoilerplates: false,
    auth: false,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_esports_matches",
        databaseTimestamps: true
    }
})
export class EsportsMatchContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    externalId!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true, defaultValue: 'csgo' })
    game!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    tournamentExternalId!: string;

    @ContractField({ protoType: 'string', nullable: true, index: true })
    tournamentSlug!: string;

    @ContractField({ protoType: 'string', nullable: true })
    name!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true, defaultValue: 'not_started' })
    status!: string; // not_started | running | finished | canceled

    @ContractField({ protoType: 'string', nullable: true, index: true })
    scheduledAt!: string;

    @ContractField({ protoType: 'string', nullable: true })
    endedAt!: string;

    @ContractField({ protoType: 'int32', nullable: false, defaultValue: 1 })
    numberOfGames!: number; // best of X

    @ContractField({ protoType: 'string', nullable: true, index: true })
    phase!: string; // group_stage | playoffs | grand_final | qualifier

    // Team 1
    @ContractField({ protoType: 'string', nullable: true })
    team1ExternalId!: string;

    @ContractField({ protoType: 'string', nullable: true })
    team1Name!: string;

    @ContractField({ protoType: 'string', nullable: true })
    team1Logo!: string;

    @ContractField({ protoType: 'string', nullable: true })
    team1Acronym!: string;

    @ContractField({ protoType: 'int32', nullable: false, defaultValue: 0 })
    team1Score!: number;

    // Team 2
    @ContractField({ protoType: 'string', nullable: true })
    team2ExternalId!: string;

    @ContractField({ protoType: 'string', nullable: true })
    team2Name!: string;

    @ContractField({ protoType: 'string', nullable: true })
    team2Logo!: string;

    @ContractField({ protoType: 'string', nullable: true })
    team2Acronym!: string;

    @ContractField({ protoType: 'int32', nullable: false, defaultValue: 0 })
    team2Score!: number;

    @ContractField({ protoType: 'string', nullable: true })
    winnerExternalId!: string;

    @ContractField({ protoType: 'string', nullable: true })
    streamUrl!: string;

    // Bracket connectivity
    @ContractField({ protoType: 'int32', nullable: true })
    roundNumber!: number; // 1 = first round, 2 = second, etc.

    @ContractField({ protoType: 'string', nullable: true })
    nextMatchId!: string; // externalId of the match winner advances to

    @ContractField({ protoType: 'string', nullable: true })
    bracketSection!: string; // upper | lower | grand_final

    // Data source tracking
    @ContractField({ protoType: 'string', nullable: true, defaultValue: 'pandascore' })
    dataSource!: string; // pandascore | draft5 | vlr | lolesports
}
