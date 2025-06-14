import { Module } from '@cmmv/core';

import { AccountsModule } from './accounts/accounts.module';
import { AuthorsModule } from './authors/authors.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.modules';
import { CommentsModule } from './comments/comments.module';
import { MembersModule } from './members/members.module';
import { SettingsModule } from './settings/settings.module';
import { ProfileModule } from './profile/profile.module';
import { MediasModule } from './medias/medias.module';
import { SitemapModule } from './sitemap/sitemap.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ImportsModule } from './imports/imports.module';
import { RedirectsModule } from './redirects/redirects.module';
import { FeedModule } from './feed/feed.modules';
import { ImagesModule } from './images/images.modules';
import { ThemesModule } from './themes/themes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AutopostModule } from './autopost/autopost.module';
import { WhitelabelModule } from './whitelabel/whitelabel.modules';
import { CDNModule } from './cdn/cdn.module';
import { LogsModule } from './logs/logs.module';
import { BackupModule } from './backup/backup.module';
import { PromptsModule } from './prompts/prompts.modules';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';

export const BlogModule = new Module('blog', {
    submodules: [
        AccountsModule,
        AuthorsModule,
        PostsModule,
        CategoriesModule,
        CommentsModule,
        MembersModule,
        SettingsModule,
        ProfileModule,
        MediasModule,
        SitemapModule,
        AnalyticsModule,
        ImportsModule,
        RedirectsModule,
        FeedModule,
        ImagesModule,
        ThemesModule,
        NotificationsModule,
        AutopostModule,
        WhitelabelModule,
        CDNModule,
        LogsModule,
        BackupModule,
        PromptsModule,
        StorageModule,
        HealthModule
    ]
});
