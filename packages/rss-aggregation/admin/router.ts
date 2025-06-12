//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import ChannelsView from './views/ChannelsView.vue';
import RawView from './views/RawView.vue';
import ParserView from './views/ParserView.vue';
import FlowView from './views/FlowView.vue';

export const rssFeedRoutes: RouteRecordRaw[] = [
    {
        path: '/feed',
        component: AdminLayout,
        children: [
            { path: 'channels', component: ChannelsView },
            { path: 'raw', component: RawView },
            { path: 'parser', component: ParserView },
            { path: 'flow', component: FlowView },
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Channels',
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
        label: 'Fluxo Visual',
        icon: 'fas fa-project-diagram',
        to: '/feed/flow',
        group: 'Feeds'
    }
])

