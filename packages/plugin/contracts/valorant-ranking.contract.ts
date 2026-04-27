import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'ValorantRankings',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: false,
    generateBoilerplates: false,
    auth: false,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_valorant_rankings",
        databaseTimestamps: true
    }
})
export class ValorantRankingContract extends AbstractContract {
    @ContractField({ protoType: 'int32', nullable: false, index: true })
    standing!: number;

    @ContractField({ protoType: 'int32', nullable: false })
    points!: number;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    teamName!: string;

    @ContractField({ protoType: 'string', nullable: true })
    teamCode!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    region!: string; // americas | emea | pacific | china

    @ContractField({ protoType: 'string', nullable: false, index: true })
    snapshotDate!: string; // YYYY_MM_DD

    @ContractField({ protoType: 'string', nullable: true })
    logoUrl!: string;
}
