export * from "./api"
export * from "./admin";

import { OddsModule } from "./api/odds.module";
import * as admin from "./admin/index";
import * as contracts from "./contracts/index";

export default {
    name: '@cmmv/odds',
    version: '0.0.1',
    description: 'Odds package for CMMV',
    api: OddsModule,
    contracts,
    admin,
    dependencies: [
        "@cmmv/http",
        "@cmmv/repository",
        "@cmmv/auth",
        "@cmmv/blog",
        "@cmmv/ai-content"
    ]
}