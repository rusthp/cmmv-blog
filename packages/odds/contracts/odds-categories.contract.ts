import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Odds',
    controllerName: 'OddsCategories',
    controllerCustomPath: 'odds/categories',
    protoPackage: 'odds',
    subPath: '/odds',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "odds_categories",
        databaseTimestamps: true
    }
})
export class OddsCategoriesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        index: true,
    })
    index!: number;

    @ContractField({
        protoType: 'text',
        nullable: true
    })
    image!: string;
}
