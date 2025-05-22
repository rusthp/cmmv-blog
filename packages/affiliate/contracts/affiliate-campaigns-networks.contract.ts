import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

import {
    AffiliateNetworksContract
} from "./affiliate-networks.contract";

@Contract({
    namespace: 'Affiliate',
    controllerName: 'AffiliateCampaignsNetworks',
    controllerCustomPath: 'affiliate/campaigns-networks',
    protoPackage: 'affiliate',
    subPath: '/affiliate',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "affiliate_campaigns_networks",
        databaseTimestamps: true
    },
    index: [
        {
            name: 'network_campaign_id',
            fields: ['network', "campaignId"],
            options: {
                unique: true
            }
        }
    ]
})
export class AffiliateCampaignsNetworksContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string;

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
        objectType: 'string',
        nullable: false,
        readOnly: true,
        index: true,
    })
    campaignId!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        readOnly: true,
        defaultValue: true,
        index: true,
    })
    active?: boolean;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        nullable: true,
        readOnly: true,
        index: true,
    })
    currencyCode?: string;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        nullable: true,
        readOnly: true,
    })
    sector?: string;

    @ContractField({
        protoType: 'string',
        objectType: 'string',
        nullable: true,
        readOnly: true,
        index: true,
    })
    domain?: string;

    @ContractField({
        protoType: 'number',
        nullable: true,
        readOnly: true,
        index: true,
    })
    comission?: number;
}
