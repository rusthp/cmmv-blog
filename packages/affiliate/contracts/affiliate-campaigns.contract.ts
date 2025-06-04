import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

import {
    AffiliateNetworksContract
} from "./affiliate-networks.contract";

@Contract({
    namespace: 'Affiliate',
    controllerName: 'AffiliateCampaigns',
    controllerCustomPath: 'affiliate/campaigns',
    protoPackage: 'affiliate',
    subPath: '/affiliate',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "affiliate_campaigns",
        databaseTimestamps: true
    }
})
export class AffiliateCampaignsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    url!: string;

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    logo!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    description!: string;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        entityType: 'AffiliateNetworksEntity',
        protoRepeated: false,
        nullable: true,
        modelName: 'AffiliateNetworks',
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: AffiliateNetworksContract,
                entityName: 'networks',
                field: 'id'
            },
        ],
    })
    network!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
        index: true
    })
    domain?: string;

    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    metadata?: string;

    @ContractField({
        protoType: 'array',
        objectType: 'string',
        entityType: 'string',
        array: true,
        nullable: true,
        protoRepeated: true,
        index: true
    })
    categories?: string[];

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true
    })
    highlight!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    slug!: string;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        defaultValue: 0,
        index: true
    })
    coupons!: number;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    seoTitle?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    seoSubtitle?: string;

    @ContractField({
        protoType: 'text',
        nullable: true
    })
    seoSmallText?: string;

    @ContractField({
        protoType: 'text',
        nullable: true
    })
    seoLongText?: string;
}
