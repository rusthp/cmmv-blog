import {
    Controller, Get, RouterSchema,
    Queries, Req, Param,
    CacheControl, ContentType, Raw
} from "@cmmv/http";

import { Config } from "@cmmv/core";

import {
    NotificationsService
} from "./notifications.service";

import {
    DailyReportService
} from "./daily-report.service";

@Controller("blog")
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService){}

    @Get("notifications/daily-report")
    async sendDailyReport(@Queries() queries: any) {
        const signature = Config.get<string>("api.signature", "") || process.env.API_SIGNATURE || "";
        if (!signature || queries?.key !== signature)
            return { success: false, message: "Unauthorized" };

        const sent = await DailyReportService.sendDailyReport();
        return { success: sent };
    }
}
