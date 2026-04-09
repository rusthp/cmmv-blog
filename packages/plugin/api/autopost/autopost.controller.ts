import {
    Controller, Get, Param, Queries
} from '@cmmv/http';

import {
    Config
} from "@cmmv/core";

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

    @Get("repost/:id")
    async repost(@Param("id") id: string, @Queries() queries: any) {
        const signature = Config.get<string>("api.signature", "") || process.env.API_SIGNATURE || "";
        if (!signature || queries?.key !== signature)
            return { success: false, message: "Unauthorized" };

        try {
            const { Repository } = await import("@cmmv/repository");
            const PostsEntity = Repository.getEntity("PostsEntity");
            const post = await Repository.findOne(PostsEntity, { id });

            if (!post)
                return { success: false, message: `Post ${id} not found` };

            await this.autopostService.sendToSocialNetworks(post);
            return { success: true, message: `Post "${(post as any).title}" sent to social networks` };
        } catch (err: any) {
            return { success: false, message: err?.message || "Unknown error" };
        }
    }
}
