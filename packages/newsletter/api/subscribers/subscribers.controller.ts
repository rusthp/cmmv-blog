import {
    Controller, Get, Post,
    Queries, Param, Body
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    NewsletterSubscribersService
} from "./subscribers.service";


@Controller("newsletter/subscribers")
export class NewsletterSubscribersController {
    constructor(private readonly newsletterService: NewsletterSubscribersService) {}

    @Post("subscribe")
    async subscribeToNewsletter(@Body() data: { email: string, name?: string, source?: string }) {
        return await this.newsletterService.subscribe(data);
    }

    @Post("unsubscribe/:email")
    async unsubscribeFromNewsletter(@Param("email") email: string) {
        return await this.newsletterService.unsubscribe(email);
    }
}