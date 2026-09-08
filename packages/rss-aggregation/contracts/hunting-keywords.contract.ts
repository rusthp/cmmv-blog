import {
    Contract, AbstractContract,
    ContractField, ContractMessage,
    ContractService
} from "@cmmv/core";

@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'HuntingKeywords',
    controllerCustomPath: 'feed/hunting/keywords',
    protoPackage: 'rss-aggregation',
    subPath: '/rss-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "rss_aggregation_hunting_keywords",
        databaseTimestamps: true
    }
})
export class HuntingKeywordsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true,
    })
    keyword!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    label!: string;

    @ContractField({
        protoType: 'int32',
        nullable: false,
        defaultValue: 1000 * 60 * 60 * 6,
        index: true
    })
    intervalUpdate!: number;

    @ContractField({
        protoType: 'datetime',
        index: true,
        nullable: true
    })
    lastUpdate!: Date;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        index: true,
        defaultValue: true
    })
    active!: boolean;
}
