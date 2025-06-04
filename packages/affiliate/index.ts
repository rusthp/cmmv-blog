export * from "./api"
export * from "./admin";
export * from "./client";
export * from "./contracts";

import { AffiliateModule } from "./api/affiliate.module";
import * as admin from "./admin/index";
import * as clients from "./client/index";
import * as contracts from "./contracts/index";

export default {
    name: '@cmmv/affiliate',
    version: '0.0.1',
    description: 'Affiliate package for CMMV',
    api: AffiliateModule,
    contracts,
    clients,
    admin,
    dependencies: [
        "@cmmv/http",
        "@cmmv/repository",
        "@cmmv/auth",
        "@cmmv/blog",
        "@cmmv/ai-content"
    ]
}