//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import NetworkView from './views/NetworkView.vue';
import CampaignView from './views/CampaignView.vue';
import CouponView from './views/CouponView.vue';
import AccountView from './views/AccountView.vue';
import CategoryView from './views/CategoryView.vue';
import NetworkCampaignsView from './views/NetworkCampaignsView.vue';
import DeeplinkGeneratorView from './views/DeeplinkGeneratorView.vue';
import SpecialDatesView from './views/SpecialDatesView.vue';
import WebscraperView from './views/WebscraperView.vue';

export const affiliateRoutes: RouteRecordRaw[] = [
    {
        path: '/affiliate',
        component: AdminLayout,
        children: [
            {
                path: 'networks',
                component: NetworkView,
                name: 'affiliate.networks'
            },
            {
                path: 'campaigns',
                component: CampaignView,
                name: 'affiliate.campaigns'
            },
            {
                path: 'coupons',
                component: CouponView,
                name: 'affiliate.coupons'
            },
            {
                path: 'accounts',
                component: AccountView,
                name: 'affiliate.accounts'
            },
            {
                path: 'categories',
                component: CategoryView,
                name: 'affiliate.categories'
            },
            {
                path: 'network-campaigns',
                component: NetworkCampaignsView,
                name: 'affiliate.network-campaigns'
            },
            {
                path: 'deeplink-generator',
                component: DeeplinkGeneratorView,
                name: 'affiliate.deeplink-generator'
            },
            {
                path: 'special-dates',
                component: SpecialDatesView,
                name: 'affiliate.special-dates'
            },
            {
                path: 'webscraper',
                component: WebscraperView,
                name: 'affiliate.webscraper'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Networks',
        icon: 'fas fa-network-wired',
        to: '/affiliate/networks',
        group: 'Affiliate'
    },
    {
        label: 'Advertisers',
        icon: 'fas fa-sitemap',
        to: '/affiliate/network-campaigns',
        group: 'Affiliate'
    },
    {
        label: 'Accounts',
        icon: 'fas fa-user',
        to: '/affiliate/accounts',
        group: 'Affiliate'
    },
    {
        label: 'Categories',
        icon: 'fas fa-tags',
        to: '/affiliate/categories',
        group: 'Affiliate'
    },
    {
        label: 'Campaigns',
        icon: 'fas fa-bullhorn',
        to: '/affiliate/campaigns',
        group: 'Affiliate'
    },
    {
        label: 'Coupons',
        icon: 'fas fa-ticket-alt',
        to: '/affiliate/coupons',
        group: 'Affiliate'
    },
    {
        label: 'Deeplink',
        icon: 'fas fa-link',
        to: '/affiliate/deeplink-generator',
        group: 'Affiliate'
    },
    {
        label: 'Special Dates',
        icon: 'fas fa-calendar-alt',
        to: '/affiliate/special-dates',
        group: 'Affiliate'
    },
    {
        label: 'Webscraper',
        icon: 'fas fa-robot',
        to: '/affiliate/webscraper',
        group: 'Affiliate'
    }
])

