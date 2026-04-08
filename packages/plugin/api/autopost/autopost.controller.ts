import {
    Controller, Post, Get
} from '@cmmv/http';

import {
    Auth
} from "@cmmv/auth";

import {
    AutopostService
} from './autopost.service';

@Controller("autopost")
export class AutopostController {
    constructor(private readonly autopostService: AutopostService) {}

    @Get("test-facebook")
    @Auth()
    async testFacebook() {
        return this.autopostService.testFacebookConnection();
    }

    @Get("test-twitter")
    @Auth()
    async testTwitter() {
        return this.autopostService.testTwitterConnection();
    }

    @Get("test-bluesky")
    @Auth()
    async testBluesky() {
        return this.autopostService.testBlueskyConnection();
    }
}
