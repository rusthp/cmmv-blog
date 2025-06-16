//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';

import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import ChannelsView from './views/ChannelsView.vue';
import VideosView from './views/VideosView.vue';

export const ytFeedRoutes: RouteRecordRaw[] = [
    {
        path: '/ytfeed',
        component: AdminLayout,
        children: [
            {
                path: 'channels',
                component: ChannelsView,
                name: 'yt-feed-channels'
            },
            {
                path: 'videos',
                component: VideosView,
                name: 'yt-feed-videos'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Channels',
        icon: 'fab fa-youtube',
        to: '/ytfeed/channels',
        group: 'Feeds'
    },
    {
        label: 'Videos',
        icon: 'fas fa-video',
        to: '/ytfeed/videos',
        group: 'Feeds'
    }
])

