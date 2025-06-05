import {
    createMemoryHistory, createWebHistory,
    createRouter as _createRouter
} from 'vue-router';

export function createRouter() {
    return _createRouter({
        history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
        routes: [
            {
                path: '/',
                component: () => import('./templates/TemplateDefault.vue'),
                children: [
                    {
                        path: '',
                        name: 'Home',
                        component: () => import('./views/PageHome.vue')
                    },
                    {
                        path: '/category/:slug',
                        name: 'Category',
                        component: () => import('./views/PageCategory.vue')
                    },
                    {
                        path: '/preview/:id',
                        name: 'PreviewPost',
                        component: () => import('./views/PagePost.vue')
                    },
                    {
                        path: '/preview-page/:id',
                        name: 'PreviewPage',
                        component: () => import('./views/PagePage.vue')
                    },
                    {
                        path: '/post/:slug',
                        name: 'Post',
                        component: () => import('./views/PagePost.vue')
                    },
                    {
                        path: '/tag/:slug',
                        name: 'Tag',
                        component: () => import('./views/PageTag.vue')
                    },
                    {
                        path: '/author/:slug',
                        name: 'Author',
                        component: () => import('./views/PageAuthor.vue')
                    },
                    {
                        path: '/terms-of-service',
                        name: 'TermsOfService',
                        component: () => import('./views/TermsOfService.vue')
                    },
                    {
                        path: '/terms-of-privacy',
                        name: 'TermsOfPrivacy',
                        component: () => import('./views/TermsOfPrivacy.vue')
                    },
                    {
                        path: '/desconto',
                        name: 'Discount',
                        component: () => import('./views/PageDiscount.vue')
                    },
                    {
                        path: '/desconto/:slug',
                        name: 'CampaignDetail',
                        component: () => import('./views/PageCampaignDetail.vue')
                    },
                    {
                        path: '/cupom',
                        name: 'Coupon',
                        component: () => import('./views/PageCoupon.vue')
                    },
                    {
                        path: '/cupom/:slug',
                        name: 'CategoryDetail',
                        component: () => import('./views/PageCategoryDetail.vue')
                    },
                    {
                        path: '/blog',
                        name: 'Blog',
                        component: () => import('./views/PageBlog.vue')
                    }
                ]
            }
        ]
    });
}