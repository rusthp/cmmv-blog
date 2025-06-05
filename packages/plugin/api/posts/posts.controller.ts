import { Application } from "@cmmv/core";
import { Auth } from "@cmmv/auth";

import {
   Controller, Get, Post,
   Queries, Param, Body, Req, RouterSchema,
   User, Response, CacheControl, ContentType,
   Raw, Delete
} from "@cmmv/http";

import {
    Cache
} from "@cmmv/cache";

import {
    PostsPublicService
} from "./posts.service";

@Controller('blog')
export class PostsController {
    constructor(private readonly postsPublicService: PostsPublicService) {}

    @Get("posts/admin", { exclude: true })
    @Auth("posts:get")
    async getPostsAdmin(@Queries() queries: any, @Req() req: any) {
        return this.postsPublicService.getAllPosts(queries, req, true);
    }

    @Get("posts", {
        contract: Application.getContract("PostsContract"),
        schema: RouterSchema.GetAll,
        summary: "Returns Posts records by filter",
        exposeFilters: true,
        exclude: true
    })
    @Cache("posts:getAll")
    @CacheControl({ maxAge: 3600, public: true })
    async getPosts(@Queries() queries: any, @Req() req: any) {
        return this.postsPublicService.getAllPosts(queries, req);
    }

    @Get("posts/public", {
        exclude: true
    })
    @Cache("posts:getAll")
    @CacheControl({ maxAge: 3600, public: true })
    async getPostsPublic(@Queries() queries: any, @Req() req: any) {
        return this.postsPublicService.getAllPostsPublic(queries, req);
    }

    @Get("pages", {
        contract: Application.getContract("PostsContract"),
        schema: RouterSchema.GetAll,
        summary: "Returns Pages records by filter",
        exposeFilters: true,
        exclude: true
    })
    @Cache("pages:getAll")
    @CacheControl({ maxAge: 3600, public: true })
    async getPages(@Queries() queries: any, @Req() req: any) {
        return this.postsPublicService.getAllPages(queries, req);
    }

    @Get("posts/slug/:slug", {
        contract: Application.getContract("PostsContract"),
        schema: RouterSchema.GetByID,
        summary: "Returns Posts record by slug",
        exposeFilters: true,
        exclude: true
    })
    @Cache("posts:")
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getBySlug(@Param("slug") slug: string, @Response() res: any) {
        return await this.postsPublicService.getPostBySlug(slug);
    }

    @Get("pages/slug/:slug", {
        contract: Application.getContract("PostsContract"),
        schema: RouterSchema.GetByID,
        summary: "Returns Pages record by slug",
        exposeFilters: true,
        exclude: true
    })
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getPageBySlug(@Param("slug") slug: string, @Response() res: any) {
        return await this.postsPublicService.getPageBySlug(slug);
    }

    @Get("posts/:id", {
        contract: Application.getContract("PostsContract"),
        schema: RouterSchema.GetByID,
        summary: "Returns Posts record by id",
        exposeFilters: true,
        exclude: true
    })
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getById(@Param("id") id: string, @Response() res: any) {
        return await this.postsPublicService.getPostById(id);
    }

    @Get("pages/:id", {
        contract: Application.getContract("PostsContract"),
        schema: RouterSchema.GetByID,
        summary: "Returns Pages record by id",
        exposeFilters: true,
        exclude: true
    })
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getPageById(@Param("id") id: string, @Response() res: any) {
        return await this.postsPublicService.getPageById(id);
    }

    @Get("posts/tags", {
        contract: Application.getContract("PostsTagsContract"),
        schema: RouterSchema.GetAll,
        summary: "Returns Posts Tags records by filter",
        exposeFilters: true,
        exclude: true
    })
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getTags(@Queries() queries: any, @Response() res: any) {
        return await this.postsPublicService.getTags(queries);
    }

    @Get("posts/tags/:slug", {
        contract: Application.getContract("PostsTagsContract"),
        schema: RouterSchema.GetByID,
        summary: "Returns Posts Tags record by slug",
        exposeFilters: true,
        exclude: true
    })
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getPostsByTagSlug(@Param("slug") slug: string, @Response() res: any) {
        return await this.postsPublicService.getPostsByTagSlug(slug);
    }

    @Get("posts/most-accessed", {
        contract: Application.getContract("PostsContract"),
        schema: RouterSchema.GetAll,
        summary: "Returns Posts most accessed records by filter",
        exposeFilters: true,
        exclude: true
    })
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getPostsMostAccessed(@Queries() queries: any, @Response() res: any) {
        return await this.postsPublicService.getPostsMostAccessedWeek();
    }

    @Post("posts", { exclude: true })
    @Auth("post:insert")
    async savePost(@Body() body: any, @User() user: any) {
        return this.postsPublicService.savePost(body, user);
    }

    @Post("pages", { exclude: true })
    @Auth("pages:insert")
    async savePage(@Body() body: any, @User() user: any) {
        return this.postsPublicService.savePage(body, user);
    }

    @Delete("posts/:id", { exclude: true })
    @Auth("posts:delete")
    async deletePost(@Param("id") id: string) {
        return this.postsPublicService.deletePost(id);
    }

    @Delete("pages/:id", { exclude: true })
    @Auth("pages:delete")
    async deletePage(@Param("id") id: string) {
        return this.postsPublicService.deletePost(id);
    }

    @Post("posts/generate", { exclude: true })
    @Auth("posts:insert")
    async generatePost(@Body() body: any) {
        return this.postsPublicService.generatePostFromUrl(body.url, body.prompt);
    }

    @Post("posts/generate/start", { exclude: true })
    @Auth("posts:insert")
    async startGeneratePost(@Body() body: any) {
        const jobId = await this.postsPublicService.startGenerateJob(body.url, body.promptId);
        return { jobId };
    }

    @Get("posts/generate/status/:jobId", { exclude: true })
    @Auth("posts:insert")
    async getGeneratePostStatus(@Param("jobId") jobId: string) {
        return this.postsPublicService.getGenerateJobStatus(jobId);
    }

    @Post("posts/actions/recalculate-category-counts", { exclude: true })
    @Auth("categories:update")
    async recalculateCategoryPostCounts() {
        await this.postsPublicService.recalculateCategories();
        return { message: "Category post counts recalculation initiated." };
    }
}
