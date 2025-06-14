import {
    Contract, AbstractContract,
    ContractField, ContractMessage,
    ContractService
} from "@cmmv/core";

import {
    FeedChannelsContract
} from "./feed-channels.contract";

@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'FeedRaw',
    controllerCustomPath: 'feed/raw',
    protoPackage: 'rss-aggregation',
    subPath: '/rss-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "rss_aggregation_feed_raw",
        databaseTimestamps: true
    }
})
export class FeedRawContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        objectType: 'object',
        entityType: 'FeedChannelsEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: FeedChannelsContract,
                entityName: 'channel',
                field: 'id',
            },
        ],
    })
    channel: string;

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
        protoType: 'text',
        nullable: false,
    })
    content!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    featureImage!: string;

    @ContractField({
        protoType: 'datetime',
        nullable: false,
        index: true,
    })
    pubDate!: Date;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true
    })
    category!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    postRef!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        index: true,
        defaultValue: false,
    })
    rejected!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    feedType!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        index: true,
        defaultValue: false,
    })
    hasParser!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    parsedBy!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
        defaultValue: 'pending',
        exclude: true,
    })
    status!: string;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        index: true,
        defaultValue: 0,
    })
    relevance!: number;
}
