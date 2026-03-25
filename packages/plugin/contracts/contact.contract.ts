import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'Contact',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_contact",
        databaseTimestamps: true
    }
})
export class ContactContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false })
    name!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    email!: string;

    @ContractField({ protoType: 'string', nullable: false })
    subject!: string;

    @ContractField({ protoType: 'string', nullable: false })
    message!: string;

    @ContractField({ protoType: 'string', nullable: false, defaultValue: 'new' })
    status!: string;

    @ContractField({ protoType: 'string', nullable: true })
    ip?: string;
}
