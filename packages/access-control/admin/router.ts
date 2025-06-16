//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';
import { useNavbar } from '@cmmv/blog/admin/composable/useNavbar';
import AdminLayout from '@cmmv/blog/admin/layouts/AdminLayout.vue';
import UserView from './views/UserView.vue';
import GroupView from './views/GroupView.vue';
export const accessControlRoutes: RouteRecordRaw[] = [
    {
        path: '/access',
        component: AdminLayout,
        children: [
            {
                path: 'users',
                component: UserView,
                name: 'access-control-users'
            },
            {
                path: 'groups',
                component: GroupView,
                name: 'access-control-groups'
            }
        ]
    },
] as RouteRecordRaw[]

useNavbar().addItems([
    {
        label: 'Groups',
        icon: 'fas fa-user-friends',
        to: '/access/groups',
        group: 'Settings'
    },
    {
        label: 'Users',
        icon: 'fas fa-users',
        to: '/access/users',
        group: 'Settings'
    }
])

