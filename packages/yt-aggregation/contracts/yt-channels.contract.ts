import {
    Contract, AbstractContract,
    ContractField, ContractMessage,
    ContractService
} from "@cmmv/core";

@Contract({
    namespace: 'YTAggregation',
    controllerName: 'YTChannels',
    controllerCustomPath: 'ytfeed/channels',
    protoPackage: 'yt-aggregation',
    subPath: '/yt-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "yt_aggregation_channels",
        databaseTimestamps: true
    }
})
export class YTChannelsContract extends AbstractContract {
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
        index: true,
    })
    channelId!: string;

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
        nullable: false,
        defaultValue: false
    })
    autoPublish!: boolean;
}
