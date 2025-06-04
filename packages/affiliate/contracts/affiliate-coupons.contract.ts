import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Affiliate',
    controllerName: 'AffiliateCoupons',
    controllerCustomPath: 'affiliate/coupons',
    protoPackage: 'affiliate',
    subPath: '/affiliate',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "affiliate_coupons",
        databaseTimestamps: true
    }
})
export class AffiliateCouponsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'Cupom',
        index: true
    })
    type!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'fixed',
        index: true
    })
    typeDiscount!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    title!: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    description?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    code!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    network?: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    advertiser?: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    promotionId?: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    campaign?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    campaignName?: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true
    })
    expiration?: Date;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    link?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    linkRef?: string;

    @ContractField({
        protoType: 'text',
        nullable: true
    })
    deeplink?: string;

    @ContractField({
        protoType: 'number',
        nullable: false,
        defaultValue: 0,
        index: true
    })
    views!: number;
}
