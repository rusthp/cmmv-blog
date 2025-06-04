import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Affiliate',
    controllerName: 'AffiliateNetworks',
    controllerCustomPath: 'affiliate/networks',
    protoPackage: 'affiliate',
    subPath: '/affiliate',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "affiliate_networks",
        databaseTimestamps: true
    }
})
export class AffiliateNetworksContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
        unique: true
    })
    url!: string;

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    metadata?: string;

    @ContractField({
        protoType: 'text',
        nullable: true,
        readOnly: true,
    })
    apiLinks?: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
        defaultValue: 'Fetch',
    })
    apiType?: string;
}
