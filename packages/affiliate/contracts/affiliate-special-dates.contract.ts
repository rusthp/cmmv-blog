import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Affiliate',
    controllerName: 'AffiliateSpecialDates',
    controllerCustomPath: 'affiliate/special-dates',
    protoPackage: 'affiliate',
    subPath: '/affiliate',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "affiliate_special_dates",
        databaseTimestamps: true
    }
})
export class AffiliateSpecialDatesContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    name: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    description: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
        unique: true
    })
    slug!: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    image?: string;

    @ContractField({
        protoType: 'array',
        objectType: 'string',
        entityType: 'string',
        array: true,
        nullable: true,
        protoRepeated: true,
        index: true
    })
    campaigns?: string[];

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;
}