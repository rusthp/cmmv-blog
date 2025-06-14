import {
    Controller, Get, RouterSchema,
    Queries, Req, Param,
    CacheControl, ContentType, Raw
} from "@cmmv/http";

import {
    NotificationsService
} from "./notifications.service";

@Controller("blog")
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService){}
}
