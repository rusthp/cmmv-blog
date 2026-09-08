import { Module } from '@cmmv/core';

import {
    HuntingService
} from "./hunting.service";

import {
    HuntingArticleGeneratorService
} from "./hunting-article-generator.service";

import {
    HuntingController
} from "./hunting.controller";

export const RSSHuntingModule = new Module('rss-hunting', {
    providers: [HuntingArticleGeneratorService, HuntingService],
    controllers: [HuntingController]
});
