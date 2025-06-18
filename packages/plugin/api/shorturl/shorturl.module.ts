import { Module } from '@cmmv/core';

import { ShortUrlContract } from '../../contracts';

import {
    ShortUrlController,
    ShortUrlRedirectController
} from './shorturl.controller';

import { ShortUrlServiceTools } from "./shorturl.service";

export const ShortUrlModule = new Module('blog_shorturl', {
    contracts: [ShortUrlContract],
    controllers: [
        ShortUrlController,
        ShortUrlRedirectController
    ],
    providers: [ShortUrlServiceTools]
});
