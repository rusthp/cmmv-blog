import { Module } from '@cmmv/core';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from "./notifications.service";
import { DailyReportService } from "./daily-report.service";

export const NotificationsModule = new Module('blog_notifications', {
    controllers: [NotificationsController],
    providers: [NotificationsService, DailyReportService]
});
