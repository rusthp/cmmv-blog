import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Affiliate',
    controllerName: 'AffiliateCategories',
    controllerCustomPath: 'affiliate/categories',
    protoPackage: 'affiliate',
    subPath: '/affiliate',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "affiliate_categories",
        databaseTimestamps: true
    }
})
export class AffiliateCategoriesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    name!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true
    })
    slug!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    icon!: string;
}
