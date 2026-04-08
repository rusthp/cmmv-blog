import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'PostSeoMetrics',
    controllerCustomPath: 'posts/seo-metrics',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: false,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_post_seo_metrics",
        databaseTimestamps: true
    }
})
export class PostSeoMetricsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    postId!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    url!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true
    })
    keyword!: string;

    @ContractField({
        protoType: 'int32',
        nullable: false,
        defaultValue: 0
    })
    impressions!: number;

    @ContractField({
        protoType: 'int32',
        nullable: false,
        defaultValue: 0
    })
    clicks!: number;

    @ContractField({
        protoType: 'float',
        nullable: false,
        defaultValue: 0
    })
    ctr!: number;

    @ContractField({
        protoType: 'float',
        nullable: false,
        defaultValue: 0
    })
    position!: number;

    @ContractField({
        protoType: 'datetime',
        nullable: false,
        index: true
    })
    collectedAt!: Date;
}
