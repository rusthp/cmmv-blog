import {
    Contract, AbstractContract,
    ContractField, ContractMessage,
    ContractService
} from "@cmmv/core";

import {
    HuntingKeywordsContract
} from "./hunting-keywords.contract";

@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'HuntingResults',
    controllerCustomPath: 'feed/hunting/results',
    protoPackage: 'rss-aggregation',
    subPath: '/rss-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "rss_aggregation_hunting_results",
        databaseTimestamps: true
    }
})
export class HuntingResultsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        objectType: 'object',
        entityType: 'HuntingKeywordsEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: HuntingKeywordsContract,
                entityName: 'keyword',
                field: 'id',
            },
        ],
    })
    keyword: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true,
    })
    link!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    title!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    source!: string;

    @ContractField({
        protoType: 'datetime',
        nullable: false,
        index: true,
    })
    pubDate!: Date;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        defaultValue: 'PENDING',
    })
    status!: 'PENDING' | 'APPROVED' | 'REJECTED';

    /**
     * Id of the ContentMind draft created after approval.
     * Mirrors FeedRawContract.postRef — a plain post id, not a relationship,
     * since the generated post lives in the blog module.
     */
    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    postRef!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        defaultValue: 'NONE',
    })
    generationStatus!: 'NONE' | 'PENDING' | 'GENERATED' | 'FAILED';

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    generationError!: string;
}
