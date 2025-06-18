import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Odds',
    controllerName: 'OddsTeams',
    controllerCustomPath: 'odds/teams',
    protoPackage: 'odds',
    subPath: '/odds',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "odds_teams",
        databaseTimestamps: true
    }
})
export class OddsTeamsContract extends AbstractContract {
    @ContractField({ protoType: 'number', unique: true, index: true })
    external_id!: number;

    @ContractField({ protoType: 'string', index: true })
    name!: string;

    @ContractField({ protoType: 'string', nullable: true })
    code?: string;

    @ContractField({ protoType: 'string', nullable: true, index: true })
    country_id?: string;

    @ContractField({ protoType: 'string', nullable: true })
    country_name?: string;

    @ContractField({ protoType: 'number', nullable: true })
    founded?: number;

    @ContractField({ protoType: 'boolean', nullable: true })
    national?: boolean;

    @ContractField({ protoType: 'string', nullable: true })
    logo?: string;

    @ContractField({ protoType: 'string', nullable: true })
    venue_id?: string;
} 