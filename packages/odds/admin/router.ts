//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import OddsCountriesView from './views/OddsCountriesView.vue';
import OddsCategoriesView from './views/OddsCategoriesView.vue';
import OddsSettingsView from './views/OddsSettingsView.vue';
import OddsLeaguesView from './views/OddsLeaguesView.vue';
import OddsVenuesView from './views/OddsVenuesView.vue';
import OddsTeamsView from './views/OddsTeamsView.vue';

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
            },
            {
                path: 'leagues',
                component: OddsLeaguesView,
                name: 'odds-leagues'
            },
            {
                path: 'venues',
                component: OddsVenuesView,
                name: 'odds-venues'
            },
            {
                path: 'teams',
                component: OddsTeamsView,
                name: 'odds-teams'
            },
            {
                path: 'settings',
                component: OddsSettingsView,
                name: 'odds-settings'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Countries',
        icon: 'fas fa-flag',
        to: '/odds/countries',
        group: 'Odds'
    },
    {
        label: 'Leagues',
        icon: 'fas fa-trophy',
        to: '/odds/leagues',
        group: 'Odds'
    },
    {
        label: 'Venues',
        icon: 'fas fa-map-marker-alt',
        to: '/odds/venues',
        group: 'Odds'
    },
    {
        label: 'Teams',
        icon: 'fas fa-users',
        to: '/odds/teams',
        group: 'Odds'
    },
    {
        label: 'Categories',
        icon: 'fas fa-tags',
        to: '/odds/categories',
        group: 'Odds'
    },
    {
        label: 'Bets',
        icon: 'fas fa-dice',
        to: '/odds/bets',
        group: 'Odds'
    },
    {
        label: 'Settings',
        icon: 'fas fa-cog',
        to: '/odds/settings',
        group: 'Odds'
    },
])

