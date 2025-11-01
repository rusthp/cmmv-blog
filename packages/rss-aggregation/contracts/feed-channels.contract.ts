import {
    Contract, AbstractContract,
    ContractField, ContractMessage,
    ContractService
} from "@cmmv/core";

@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'FeedChannels',
    controllerCustomPath: 'feed/channels',
    protoPackage: 'rss-aggregation',
    subPath: '/rss-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "rss_aggregation_feed_channels",
        databaseTimestamps: true
    }
})
export class FeedChannelsContract extends AbstractContract {
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
        protoType: 'string',
        nullable: false,
    })
    rss!: string;

    @ContractField({
        protoType: 'int32',
        nullable: false,
        defaultValue: 1000 * 60 * 60 * 24,
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

    @ContractField({
        protoType: 'boolean',
        nullable: true,
        defaultValue: false
    })
    requestLink!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
        defaultValue: 'RSS'
    })
    sourceType!: 'RSS' | 'WEB_SCRAPING';

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    listPageUrl!: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    scrapingConfig!: string;
}
