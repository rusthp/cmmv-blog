import { Module } from '@cmmv/core';

import {
    NewsletterSubscriptionService
} from "./subscribers.service";

import {
    NewsletterSubscribersController
} from "./subscribers.controller";

export const NewsletterSubscribersModule = new Module('newsletter-subscribers', {
    providers: [NewsletterSubscriptionService],
    controllers: [NewsletterSubscribersController]
}); 