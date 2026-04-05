import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'Cs2Rankings',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: false,
    generateBoilerplates: false,
    auth: false,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_cs2_rankings",
        databaseTimestamps: true
    }
})
export class Cs2RankingContract extends AbstractContract {
    @ContractField({ protoType: 'int32', nullable: false, index: true })
    standing!: number;

    @ContractField({ protoType: 'int32', nullable: false })
    points!: number;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    teamName!: string;

    @ContractField({ protoType: 'string', nullable: true })
    roster!: string; // comma-separated player names

    @ContractField({ protoType: 'string', nullable: false, index: true })
    region!: string; // global | americas | europe | asia

    @ContractField({ protoType: 'string', nullable: false, index: true })
    snapshotDate!: string; // e.g. 2026_03_02

    @ContractField({ protoType: 'string', nullable: true })
    logoUrl!: string;

    @ContractField({ protoType: 'string', nullable: true })
    detailsSlug!: string; // extracted from details link
}
