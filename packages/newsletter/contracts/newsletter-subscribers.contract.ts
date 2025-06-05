import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Newsletter',
    controllerName: 'NewsletterSubscribers',
    controllerCustomPath: 'newsletter/subscribers',
    protoPackage: 'newsletter',
    subPath: '/newsletter',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "newsletter_subscribers",
        databaseTimestamps: true
    }
})
export class NewsletterSubscribersContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    email!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    name!: string;

    @ContractField({
        protoType: 'boolean',
        nullable: false,
        defaultValue: true,
        index: true
    })
    active!: boolean;

    @ContractField({
        protoType: 'date',
        nullable: true,
        index: true
    })
    subscribedAt!: Date;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    source!: string;
} 