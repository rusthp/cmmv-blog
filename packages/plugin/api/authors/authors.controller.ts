import { Auth } from "@cmmv/auth";

import {
    Controller, Get, Post,
    Queries, Param, Body,
    Response, HttpException,
    HttpStatus, CacheControl,
    Raw, ContentType, Put,
    Delete
} from "@cmmv/http";

import {
    AuthorsService
} from "./authors.service";

@Controller('authors')
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) {}

    @Get()
    @Auth({ rootOnly: true })
    async getAll(@Queries() queries: any) {
        return this.authorsService.getAll(queries);
    }

    @Post()
    @Auth({ rootOnly: true })
    async create(@Body() body: any) {
        return this.authorsService.createAuthor(body);
    }

    @Put(':id')
    @Auth({ rootOnly: true })
    async update(@Param('id') id: string, @Body() body: any) {
        return this.authorsService.updateAuthor(id, body);
    }

    @Delete(':id')
    @Auth({ rootOnly: true })
    async delete(@Param('id') id: string) {
        return this.authorsService.deleteAuthor(id);
    }

    @Get(':id')
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getAuthorById(@Param('id') id: string, @Response() res: any) {
        const author = await this.authorsService.getAuthorById(id);

        if(!author)
            throw new HttpException("Author not found", HttpStatus.NOT_FOUND);

        return author;
    }

    @Get('slug/:slug')
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getAuthorBySlug(@Param('slug') slug: string, @Response() res: any) {
        const author = await this.authorsService.getAuthorBySlug(slug);

        if(!author)
            throw new HttpException("Author not found", HttpStatus.NOT_FOUND);

        return author;
    }
}
