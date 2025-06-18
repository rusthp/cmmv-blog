import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Odds',
    controllerName: 'OddsLeagues',
    controllerCustomPath: 'odds/leagues',
    protoPackage: 'odds',
    subPath: '/odds',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "odds_leagues",
        databaseTimestamps: true
    }
})
export class OddsLeaguesContract extends AbstractContract {
    @ContractField({ protoType: 'number', unique: true, index: true })
    external_id!: number;

    @ContractField({ protoType: 'string', index: true })
    name!: string;

    @ContractField({ protoType: 'string' })
    type!: string;

    @ContractField({ protoType: 'string', nullable: true })
    logo?: string;

    @ContractField({ protoType: 'boolean', defaultValue: false })
    odds!: boolean;

    @ContractField({ protoType: 'number' })
    year!: number;

    @ContractField({ protoType: 'datetime' })
    start_date!: Date;

    @ContractField({ protoType: 'datetime' })
    end_date!: Date;

    @ContractField({ protoType: 'boolean', defaultValue: false })
    current!: boolean;

    @ContractField({ protoType: 'string', nullable: true, index: true })
    country_id?: string;
}
