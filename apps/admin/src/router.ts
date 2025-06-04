import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import LoginView from './views/LoginView.vue';

const adminRoutes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: LoginView
    }
]

import { mergePluginRoutes } from '@cmmv/blog/admin/composable/useRouter'
import { blogAdminRoutes } from '@cmmv/blog/admin/router'
import { accessControlRoutes } from '@cmmv/access-control/admin/router';
import { rssFeedRoutes } from '@cmmv/rss-aggregation/admin/router';
import { ytFeedRoutes } from '@cmmv/yt-aggregation/admin/router';
import { affiliateRoutes } from '@cmmv/affiliate/admin/router';
import { oddsRoutes } from '@cmmv/odds/admin/router';

const mergedRoutes = mergePluginRoutes(
    adminRoutes,
    [
        blogAdminRoutes,
        accessControlRoutes,
        rssFeedRoutes,
        ytFeedRoutes,
        affiliateRoutes,
        oddsRoutes
    ]
);

const router = createRouter({
    // @ts-ignore
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: mergedRoutes,
})

export default router
