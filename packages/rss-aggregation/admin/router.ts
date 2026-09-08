//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import ChannelsView from './views/ChannelsView.vue';
import RawView from './views/RawView.vue';
import ParserView from './views/ParserView.vue';
import HuntingKeywordsView from './views/HuntingKeywordsView.vue';
import HuntingResultsView from './views/HuntingResultsView.vue';

export const rssFeedRoutes: RouteRecordRaw[] = [
    {
        path: '/feed',
        component: AdminLayout,
        children: [
            { path: 'channels', component: ChannelsView },
            { path: 'raw', component: RawView },
            { path: 'parser', component: ParserView },
            { path: 'hunting/keywords', component: HuntingKeywordsView },
            { path: 'hunting/results', component: HuntingResultsView },
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'RSS',
        icon: 'fas fa-rss',
        to: '/feed/channels',
        group: 'Feeds'
    },
    {
        label: 'Parser',
        icon: 'fas fa-code',
        to: '/feed/parser',
        group: 'Feeds'
    },
    {
        label: 'Raw',
        icon: 'fas fa-database',
        to: '/feed/raw',
        group: 'Feeds'
    },
    {
        label: 'Hunting',
        icon: 'fas fa-crosshairs',
        to: '/feed/hunting/keywords',
        group: 'Feeds'
    },
    {
        label: 'Hunting Queue',
        icon: 'fas fa-clipboard-check',
        to: '/feed/hunting/results',
        group: 'Feeds'
    }
])

