import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

import {
    UserContract
} from "@cmmv/auth";

import {
    CategoriesContract
} from "./categories.contract";

@Contract({
    namespace: 'Blog',
    controllerName: 'Posts',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_posts",
        databaseTimestamps: true,
        databaseFakeDelete: true
    }
})
export class PostsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        objectType: 'object',
        entityType: 'UserEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        readOnly: true,
        link: [
            {
                createRelationship: true,
                contract: UserContract,
                contractName: 'UserContract',
                entityName: 'user',
                field: 'id',
            },
        ],
    })
    author: string;

    @ContractField({
        protoType: 'array',
        nullable: false,
        objectType: 'string',
        entityType: 'UserContract',
        protoRepeated: true,
        exclude: true,
    })
    authors: string[];

    @ContractField({
        protoType: 'string',
        nullable: false,
        validations: [
            {
                type: 'IsString',
                message: 'The title must be a string',
            },
            {
                type: 'MinLength',
                value: 3,
                message: 'The title must be at least 3 characters',
            },
            {
                type: 'MaxLength',
                value: 100,
                message: 'The title must be less than 100 characters',
            },
        ],
    })
    title!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        validations: [
            {
                type: 'MaxLength',
                value: 140,
                message: 'The excerpt must be less than 140 characters',
            },
        ],
    })
    excerpt?: string;

    /*@ContractField({
        protoType: 'text',
        nullable: true
    })
    lexicalContent?: string;

    @ContractField({
        protoType: 'text',
        nullable: true
    })
    mobileDocument?: string;*/

    @ContractField({
        protoType: 'text',
        nullable: false,
        validations: [
            {
                type: 'IsString',
                message: 'The content must be a string',
            }
        ],
    })
    content!: string;

    @ContractField({
        protoType: 'array',
        nullable: true,
        objectType: 'string',
        entityType: 'CategoriesEntity',
        protoRepeated: true,
        exclude: true,
        link: [
            {
                createRelationship: false,
                contract: CategoriesContract,
                contractName: 'CategoriesContract',
                entityName: 'category',
                field: 'id',
                array: true
            },
        ],
    })
    categories: string[];

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        validations: [
            {
                type: 'IsString',
                message: 'The slug must be a string',
            },
        ],
    })
    slug!: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    metaTitle?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    metaDescription?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    metaKeywords?: string;

    @ContractField({
        protoType: 'datetime',
        nullable: true,
        index: true
    })
    publishedAt?: Date;

    @ContractField({
        protoType: 'int64',
        nullable: true,
        index: true
    })
    autoPublishAt?: number;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    image?: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: false
    })
    featured!: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    featureImage?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    featureImageAlt?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    featureImageCaption?: string;

    @ContractField({
        protoType: 'array',
        nullable: true,
        objectType: 'string',
        protoRepeated: true,
        array: true,
        exclude: true,
    })
    tags?: string[];

    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'post',
        exclude: true,
    })
    type: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'draft',
        index: true,
        exclude: true,
    })
    status: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        defaultValue: 'public',
        readOnly: true,
        index: true,
        exclude: true,
    })
    visibility: string;

    @ContractField({
        protoType: 'text',
        nullable: true
    })
    codeInjectionHead?: string;

    @ContractField({
        protoType: 'text',
        nullable: true
    })
    codeInjectionBody?: string;

    @ContractField({
        protoType: 'string',
        nullable: true
    })
    canonicalUrl?: string;

    @ContractField({
        protoType: 'int',
        nullable: false,
        defaultValue: 0,
        index: true,
        exclude: true,
    })
    views: number;

    @ContractField({
        protoType: 'int',
        nullable: false,
        defaultValue: 0,
        index: true,
        exclude: true,
    })
    comments: number;
}
