import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'RSSAggregation',
    controllerName: 'ImageCache',
    controllerCustomPath: 'image/cache',
    protoPackage: 'rss-aggregation',
    subPath: '/rss-aggregation',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "rss_aggregation_image_cache",
        databaseTimestamps: true
    }
})
export class ImageCacheContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    originalUrl!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    localPath!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    sourceDomain?: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    mimeType?: string;

    @ContractField({
        protoType: 'int32',
        nullable: true,
    })
    fileSize?: number;

    @ContractField({
        protoType: 'string',
        nullable: false,
        unique: true,
        index: true,
    })
    hash!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    keywords?: string;

    @ContractField({
        protoType: 'datetime',
        nullable: true,
        index: true,
    })
    lastUsedAt?: Date;
}
