import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'Cs2Teams',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: false,
    generateBoilerplates: false,
    auth: false,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_cs2_teams",
        databaseTimestamps: true
    }
})
export class Cs2TeamContract extends AbstractContract {
    @ContractField({ protoType: 'string', nullable: false, index: true })
    externalId!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    name!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    slug!: string;

    @ContractField({ protoType: 'string', nullable: true })
    acronym!: string;

    @ContractField({ protoType: 'string', nullable: true })
    logoUrl!: string;

    @ContractField({ protoType: 'string', nullable: true })
    nationality!: string;

    @ContractField({ protoType: 'string', nullable: true })
    region!: string;

    @ContractField({ protoType: 'int32', nullable: true, defaultValue: 0, index: true })
    ranking!: number;
}
