import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Odds',
    controllerName: 'OddsVenues',
    controllerCustomPath: 'odds/venues',
    protoPackage: 'odds',
    subPath: '/odds',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "odds_venues",
        databaseTimestamps: true
    }
})
export class OddsVenuesContract extends AbstractContract {
    @ContractField({ protoType: 'number', unique: true, index: true })
    external_id!: number;

    @ContractField({ protoType: 'string', index: true })
    name!: string;

    @ContractField({ protoType: 'string', nullable: true })
    address?: string;

    @ContractField({ protoType: 'string', nullable: true })
    city?: string;

    @ContractField({ protoType: 'string', nullable: true, index: true })
    country_id?: string;

    @ContractField({ protoType: 'number', nullable: true })
    capacity?: number;

    @ContractField({ protoType: 'string', nullable: true })
    surface?: string;

    @ContractField({ protoType: 'string', nullable: true })
    image?: string;
} 