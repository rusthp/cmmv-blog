//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import NewsletterSubscribersView from './views/NewsletterSubscribersView.vue';

export const newsletterRoutes: RouteRecordRaw[] = [
    {
        path: '/newsletter',
        component: AdminLayout,
        children: [
            {
                path: 'subscribers',
                component: NewsletterSubscribersView,
                name: 'newsletter-subscribers'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Subscribers',
        icon: 'fas fa-envelope',
        to: '/newsletter/subscribers',
        group: 'Newsletter'
    }
]) 