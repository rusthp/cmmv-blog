import {
    Controller, Post, Get, Param
} from '@cmmv/http';

import {
    Auth
} from "@cmmv/auth";

import {
    Repository
} from "@cmmv/repository";

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

    @Post("repost/:id")
    @Auth()
    async repost(@Param("id") id: string) {
        try {
            const PostsEntity = Repository.getEntity("PostsEntity");
            const post = await Repository.findOne(PostsEntity, { id });

            if (!post)
                return { success: false, message: `Post ${id} not found` };

            await this.autopostService.sendToSocialNetworks(post);
            return { success: true, message: `Post "${post.title}" sent to social networks` };
        } catch (err: any) {
            return { success: false, message: err?.message || "Unknown error" };
        }
    }
}
