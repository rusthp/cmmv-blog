import { Module } from '@cmmv/core';

import {
    NewsletterSubscribersContract
} from '../contracts';

import {
    NewsletterSubscribersModule
} from './subscribers/subscribers.module';

export const NewsletterModule = new Module('newsletter', {
    contracts: [
        NewsletterSubscribersContract
    ],
    submodules: [
        NewsletterSubscribersModule
    ]
}); 