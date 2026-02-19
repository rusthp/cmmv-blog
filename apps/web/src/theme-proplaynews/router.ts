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
                    { path: '', component: () => import('./views/PageHome.vue') },
                    { path: '/category/:slug', component: () => import('./views/PageCategory.vue') },
                    { path: '/preview/:id', component: () => import('./views/PagePost.vue') },
                    { path: '/preview-page/:id', component: () => import('./views/PagePage.vue') },
                    { path: '/post/:slug', component: () => import('./views/PagePost.vue') },
                    { path: '/tag/:slug', component: () => import('./views/PageTag.vue') },
                    { path: '/author/:slug', component: () => import('./views/PageAuthor.vue') },
                    { path: '/contato', component: () => import('./views/ContactPage.vue') },
                    { path: '/terms-of-service', component: () => import('./views/TermsOfService.vue') },
                    { path: '/terms-of-privacy', component: () => import('./views/TermsOfPrivacy.vue') }
                ]
            }
        ]
    });
}