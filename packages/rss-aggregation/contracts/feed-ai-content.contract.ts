import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";
import { FeedRawContract } from "./feed-raw.contract";

@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'FeedAIContent',
    controllerCustomPath: 'feed/ai-content',
    protoPackage: 'rss-aggregation',
    subPath: '/rss-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "rss_aggregation_feed_ai_content",
        databaseTimestamps: true
    }
})
export class FeedAIContentContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        objectType: 'object',
        entityType: 'FeedRawEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: FeedRawContract,
                entityName: 'raw',
                field: 'id',
            },
        ],
    })
    rawId!: string;

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
        nullable: true,
    })
    featureImage!: string;

    @ContractField({
        protoType: 'text', // Storing as JSON string
        nullable: true,
    })
    suggestedTags!: string;

    @ContractField({
        protoType: 'text', // Storing as JSON string
        nullable: true,
    })
    suggestedCategories!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    postRef!: string;
} 