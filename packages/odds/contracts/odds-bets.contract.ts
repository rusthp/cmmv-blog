import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Odds',
    controllerName: 'OddsBets',
    controllerCustomPath: 'odds/bets',
    protoPackage: 'odds',
    subPath: '/odds',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "odds_bets",
        databaseTimestamps: true
    }
})
export class OddsBetsContract extends AbstractContract {
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
        entityType: 'string',
        protoRepeated: false,
        nullable: true,
        readOnly: true,
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
}
