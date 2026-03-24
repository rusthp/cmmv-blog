import { Module } from '@cmmv/core';

import { AutopostService } from "./autopost.service";
import { AutopostController } from "./autopost.controller";

export const AutopostModule = new Module('blog_autopost', {
    controllers: [AutopostController],
    providers: [AutopostService]
});
