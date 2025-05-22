import {
    Controller, Get,
    CacheControl, ContentType,
    Raw, Res, Query
} from "@cmmv/http";

import {
    CategoriesServiceTools
} from "./categories.service";

@Controller("affiliate/categories")
export class CategoriesControllerTools {
    constructor(private readonly categoriesService: CategoriesServiceTools){}

    @Get("public")
    @CacheControl({ maxAge: 3600, public: true })
    @ContentType('application/json')
    @Raw()
    async getCoupons() {
        return await this.categoriesService.getCategories();
    }

    @Get("export")
    async export(@Res() response: any, @Query("token") token: string){
        if(token !== process.env.API_SIGNATURE)
            throw new Error("Invalid token");

        const data: string = await this.categoriesService.export();

        response.res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="categories.json"`,
            'Content-Length': Buffer.byteLength(data, 'utf-8')
        });

        response.res.end(data);
    }
}
