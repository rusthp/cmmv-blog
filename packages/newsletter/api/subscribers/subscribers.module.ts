import { Module } from '@cmmv/core';

import {
    NewsletterSubscribersService
} from "./subscribers.service";

import {
    NewsletterSubscribersController
} from "./subscribers.controller";

export const NewsletterSubscribersModule = new Module('newsletter-subscribers', {
    providers: [NewsletterSubscribersService],
    controllers: [NewsletterSubscribersController]
}); 