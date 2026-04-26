import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'EsportsTournaments',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: false,
    generateBoilerplates: false,
    auth: false,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_esports_tournaments",
        databaseTimestamps: true
    }
})
export class EsportsTournamentContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    externalId!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true, defaultValue: 'csgo' })
    game!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    name!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    slug!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true, defaultValue: 'upcoming' })
    status!: string; // upcoming | ongoing | finished | cancelled

    @ContractField({ protoType: 'string', nullable: true })
    startDate!: string;

    @ContractField({ protoType: 'string', nullable: true })
    endDate!: string;

    @ContractField({ protoType: 'string', nullable: true })
    prizePool!: string;

    @ContractField({ protoType: 'string', nullable: true })
    location!: string;

    @ContractField({ protoType: 'boolean', nullable: false, defaultValue: false })
    online!: boolean;

    @ContractField({ protoType: 'string', nullable: true })
    tier!: string; // s | a | b | c | d

    @ContractField({ protoType: 'string', nullable: true })
    logoUrl!: string;

    @ContractField({ protoType: 'string', nullable: true })
    bannerUrl!: string;

    @ContractField({ protoType: 'string', nullable: true })
    leagueName!: string;

    @ContractField({ protoType: 'string', nullable: true })
    leagueLogo!: string;

    @ContractField({ protoType: 'string', nullable: true })
    serieName!: string;

    @ContractField({ protoType: 'string', nullable: true })
    teamsJson!: string; // JSON array of team objects

    @ContractField({ protoType: 'string', nullable: true })
    subTournamentsJson!: string; // JSON array of {id, slug, name} for PandaScore sub-tournaments

    @ContractField({ protoType: 'string', nullable: true })
    serieExternalId!: string; // PandaScore serie ID (used for match sync endpoint)

    @ContractField({ protoType: 'string', nullable: true, index: true })
    region!: string; // NA | EU | BR | SA | APAC | global

    @ContractField({ protoType: 'int32', nullable: false, defaultValue: 0 })
    numberOfTeams!: number;

    @ContractField({ protoType: 'boolean', nullable: false, defaultValue: true, index: true })
    featured!: boolean;
}
