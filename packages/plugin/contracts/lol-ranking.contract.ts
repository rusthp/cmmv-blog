import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Blog',
    controllerName: 'LolRankings',
    protoPackage: 'blog',
    subPath: '/blog',
    generateController: false,
    generateBoilerplates: false,
    auth: false,
    options: {
        moduleContract: true,
        databaseSchemaName: "blog_lol_rankings",
        databaseTimestamps: true
    }
})
export class LolRankingContract extends AbstractContract {
    @ContractField({ protoType: 'int32', nullable: false, index: true })
    standing!: number;

    @ContractField({ protoType: 'int32', nullable: false })
    wins!: number;

    @ContractField({ protoType: 'int32', nullable: false })
    losses!: number;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    teamName!: string;

    @ContractField({ protoType: 'string', nullable: true })
    teamCode!: string;

    @ContractField({ protoType: 'string', nullable: false, index: true })
    league!: string; // lck | lec | lcs | lpl | cblol | lcp

    @ContractField({ protoType: 'string', nullable: false, index: true })
    region!: string; // APAC | EU | NA | BR | global

    @ContractField({ protoType: 'string', nullable: false, index: true })
    snapshotDate!: string; // YYYY_MM_DD

    @ContractField({ protoType: 'string', nullable: true })
    logoUrl!: string;
}
