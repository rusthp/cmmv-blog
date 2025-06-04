import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

import {
    FeedChannelsContract
} from "./feed-channels.contract";

@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'FeedParser',
    controllerCustomPath: 'feed/parser',
    protoPackage: 'rss-aggregation',
    subPath: '/rss-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "rss_aggregation_feed_parser",
        databaseTimestamps: true
    }
})
export class FeedParserContract extends AbstractContract {
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
    })
    title: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    content: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    tags: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    category: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    featureImage: string;
}
