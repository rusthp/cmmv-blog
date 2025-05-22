import { Module } from '@cmmv/core';

import {
    AccountsController
} from "./accounts.controller";

import {
    AccountsService
} from "./accounts.service";

export const AccountsModule = new Module('blog_accounts', {
    controllers: [AccountsController],
    providers: [AccountsService],
});
