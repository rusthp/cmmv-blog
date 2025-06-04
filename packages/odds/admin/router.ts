//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import OddsCountriesView from './views/OddsCountriesView.vue';
import OddsCategoriesView from './views/OddsCategoriesView.vue';

export const oddsRoutes: RouteRecordRaw[] = [
    {
        path: '/odds',
        component: AdminLayout,
        children: [
            {
                path: 'countries',
                component: OddsCountriesView,
                name: 'odds-countries'
            },
            {
                path: 'categories',
                component: OddsCategoriesView,
                name: 'odds-categories'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Countries',
        icon: 'fas fa-globe',
        to: '/odds/countries',
        group: 'Odds'
    },
    {
        label: 'Leagues',
        icon: 'fas fa-globe',
        to: '/odds/leagues',
        group: 'Odds'
    },
    {
        label: 'Categories',
        icon: 'fas fa-globe',
        to: '/odds/categories',
        group: 'Odds'
    },
    {
        label: 'Bets',
        icon: 'fas fa-network-wired',
        to: '/odds/bets',
        group: 'Odds'
    },
])

