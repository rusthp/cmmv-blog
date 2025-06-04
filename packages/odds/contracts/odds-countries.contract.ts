import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Odds',
    controllerName: 'OddsCountries',
    controllerCustomPath: 'odds/countries',
    protoPackage: 'odds',
    subPath: '/odds',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "odds_countries",
        databaseTimestamps: true
    }
})
export class OddsCountriesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    code!: string;

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    flag!: string;
}
