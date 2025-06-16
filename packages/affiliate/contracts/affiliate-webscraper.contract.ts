import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Affiliate',
    controllerName: 'AffiliateWebscraper',
    controllerCustomPath: 'affiliate/webscraper',
    protoPackage: 'affiliate',
    subPath: '/affiliate',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "affiliate_webscraper",
        databaseTimestamps: true
    }
})
export class AffiliateWebscraperContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    label!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true
    })
    domain!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        defaultValue: "'{}'",
        nullable: true
    })
    fields!: string;
}
