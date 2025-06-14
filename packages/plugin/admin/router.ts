//@ts-nocheck
import { RouteRecordRaw } from 'vue-router';
import { useNavbar } from './composable/useNavbar';

import AdminLayout from './layouts/AdminLayout.vue';
import HomeView from './views/HomeView.vue';
import PostsView from './views/PostsView.vue';
import PagesView from './views/PagesView.vue';
import SettingsView from './views/SettingsView.vue';
import CategoriesView from './views/CategoriesView.vue';
import TagsView from './views/TagsView.vue';
import ProfileView from './views/ProfileView.vue';
import AuthorsView from './views/AuthorsView.vue';
import MediasView from './views/MediasView.vue';
import MediaBackupsView from './views/MediaBackupsView.vue';
import MembersView from './views/MembersView.vue';
import CommentsView from './views/CommentsView.vue';
import ImportsView from './views/ImportsView.vue';
import ImagesToolView from './views/ImagesToolView.vue';
import ThemesView from './views/ThemesView.vue';
import CoverView from './views/CoverView.vue';
import WhitelabelView from './views/WhitelabelView.vue';
import WhitelabelAccessView from './views/WhitelabelAccessView.vue';
import BackupView from './views/BackupView.vue';
import PromptsView from './views/PromptsView.vue';

import SetupView from './views/SetupView.vue';
import PostView from './views/PostView.vue';
import PageView from './views/PageView.vue';

export const blogAdminRoutes: RouteRecordRaw[] = [
    {
        path: '/',
        component: AdminLayout,
        children: [
            { path: '', component: HomeView },
            { path: '/posts', component: PostsView },
            //{ path: '/pages', component: PagesView },
            { path: '/settings', component: SettingsView },
            { path: '/categories', component: CategoriesView },
            { path: '/tags', component: TagsView },
            { path: '/profile', component: ProfileView },
            { path: '/authors', component: AuthorsView },
            { path: '/medias', component: MediasView },
            //{ path: '/media-backups', component: MediaBackupsView },
            { path: '/members', component: MembersView },
            { path: '/comments', component: CommentsView },
            { path: '/imports', component: ImportsView },
            { path: '/themes', component: ThemesView },
            { path: '/cover', component: CoverView },
            { path: '/whitelabel', component: WhitelabelView },
            //{ path: '/whitelabel-access', component: WhitelabelAccessView },
            { path: '/backup', component: BackupView },
            { path: '/prompts', component: PromptsView }
        ]
    },
    {
        path: '/setup',
        name: 'setup',
        component: SetupView
    },
    {
        path: '/post/:id',
        name: 'editPost',
        component: PostView
    },
    {
        path: '/post',
        name: 'newPost',
        component: PostView,
    },
    {
        path: '/page/:id',
        name: 'editPage',
        component: PageView
    },
    {
        path: '/page',
        name: 'newPage',
        component: PageView
    },
] as RouteRecordRaw[];

useNavbar().addItems([
    {
        label: 'Dashboard',
        icon: 'fas fa-home',
        to: '/'
    },
    {
        label: 'Posts',
        icon: 'fas fa-file-alt',
        to: '/posts',
        group: 'CMS'
    },
    /*{
        label: 'Pages',
        icon: 'fas fa-copy',
        to: '/pages',
        group: 'CMS'
    },*/
    {
        label: 'Comments',
        icon: 'fas fa-comments',
        to: '/comments',
        group: 'CMS'
    },
    {
        label: 'Medias',
        icon: 'fas fa-images',
        to: '/medias',
        group: 'CMS'
    },
    /*{
        label: 'Media Backups',
        icon: 'fas fa-archive',
        to: '/media-backups',
        group: 'CMS'
    },*/
    {
        label: 'Categories',
        icon: 'fas fa-folder',
        to: '/categories',
        group: 'CMS'
    },
    {
        label: 'Tags',
        icon: 'fas fa-tags',
        to: '/tags',
        group: 'CMS'
    },
    {
        label: 'Prompts',
        icon: 'fas fa-robot',
        to: '/prompts',
        group: 'Settings'
    },
    {
        label: 'Authors',
        icon: 'fas fa-user-edit',
        to: '/authors',
        group: 'CMS'
    },
    {
        label: 'Members',
        icon: 'fas fa-users',
        to: '/members',
        group: 'CMS'
    },
    {
        label: 'Imports',
        icon: 'fas fa-file-import',
        to: '/imports',
        group: 'Settings'
    },
    {
        label: 'Themes',
        icon: 'fas fa-palette',
        to: '/themes',
        group: 'Settings'
    },
    {
        label: 'Cover',
        icon: 'fas fa-image',
        to: '/cover',
        group: 'Settings'
    },
    {
        label: 'Whitelabels',
        icon: 'fas fa-globe',
        to: '/whitelabel',
        group: 'Settings'
    },
    /*{
        label: 'Access',
        icon: 'fas fa-key',
        to: '/whitelabel-access',
        group: 'Settings'
    },*/
    {
        label: 'Backup',
        icon: 'fas fa-database',
        to: '/backup',
        group: 'Settings'
    },
    {
        label: 'Settings',
        icon: 'fas fa-cog',
        to: '/settings',
        group: 'Settings'
    },
])

