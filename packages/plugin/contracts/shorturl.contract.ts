import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'ShortUrl',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_shorturl"
    }
})
export class ShortUrlContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true
    })
    originalUrl!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        unique: true
    })
    slug!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        defaultValue: 301
    })
    statusHTTP!: number;
}
