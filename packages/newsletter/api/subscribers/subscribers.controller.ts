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

// Instanciar o serviço diretamente para evitar problemas de injeção de dependência
const newsletterService = new NewsletterSubscribersService();

@Controller("newsletter/subscribers")
export class NewsletterSubscribersController {
    @Post("subscribe")
    async subscribeToNewsletter(@Body() data: { email: string, name?: string, source?: string }) {
        return await newsletterService.subscribe(data);
    }

    @Post("unsubscribe/:email")
    async unsubscribeFromNewsletter(@Param("email") email: string) {
        return await newsletterService.unsubscribe(email);
    }
} 