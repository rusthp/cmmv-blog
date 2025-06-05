export * from "./api"
export * from "./admin";

import { NewsletterModule } from "./api/newsletter.module";
import * as admin from "./admin/index";
import * as contracts from "./contracts/index";

export default {
    name: '@cmmv/newsletter',
    version: '0.0.1',
    description: 'Newsletter management package for CMMV',
    api: NewsletterModule,
    contracts,
    admin,
    dependencies: [
        "@cmmv/http",
        "@cmmv/repository",
        "@cmmv/auth",
        "@cmmv/blog"
    ]
} 