import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

import {
    OddsCountriesContract
} from "./odds-countries.contract";

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
    @ContractField({
        protoType: 'string',
        objectType: 'object',
        entityType: 'OddsCountriesEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: OddsCountriesContract,
                entityName: 'country',
                field: 'id',
            },
        ],
    })
    country!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    code!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    name!: string;

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    logo!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: true,
        index: true,
        defaultValue: true
    })
    current!: boolean;

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true
    })
    startDate!: Date;

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true
    })
    endDate!: Date;


}
