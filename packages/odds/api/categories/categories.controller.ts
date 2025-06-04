import {
    Controller, Param,
    Put, Body
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    OddsCategoriesServiceTools
} from "./categories.service";

@Controller("odds/categories")
export class OddsCategoriesControllerTools {
    constructor(private readonly categoriesService: OddsCategoriesServiceTools){}

    @Put(":categoryId/image")
    @Auth("odds:update")
    async updateCategoryImage(@Param("categoryId") categoryId: string, @Body() data: { image: string }) {
        return await this.categoriesService.updateCategoryImage(categoryId, data.image);
    }
}
