import {
    Contract, AbstractContract,
    ContractField, ContractMessage,
    ContractService
} from "@cmmv/core";

@Contract({
    namespace: 'YTAggregation',
    controllerName: 'YTVideos',
    controllerCustomPath: 'ytfeed/videos',
    protoPackage: 'yt-aggregation',
    subPath: '/yt-aggregation',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "yt_aggregation_videos",
        databaseTimestamps: true
    }
})
export class YTVideosContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    title!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    description!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    videoId!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    channelId!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    thumbnailUrl!: string;

    @ContractField({
        protoType: 'datetime',
        nullable: false,
        index: true,
    })
    publishedAt!: Date;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    url!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false,
        index: true,
    })
    isPublished!: boolean;

    @ContractField({
        protoType: 'datetime',
        nullable: true,
        index: true,
    })
    publishedAtBlog!: Date;

    @ContractField({
        protoType: 'string',
        nullable: true,
        index: true,
    })
    blogPostId!: string;

    @ContractField({
        protoType: 'int32',
        nullable: true,
        defaultValue: 0,
        index: true,
    })
    durationSeconds!: number;

    @ContractField({
        protoType: 'boolean',
        nullable: true,
        defaultValue: false,
        index: true,
    })
    rejected!: boolean;
}
