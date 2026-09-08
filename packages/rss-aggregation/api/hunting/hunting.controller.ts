import {
    Controller, Get, Put,
    Queries, Param
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    HuntingService
} from "./hunting.service";

@Controller("feed/hunting")
export class HuntingController {
    constructor(private readonly huntingService: HuntingService) {}

    @Get("processHunting", { exclude: true })
    @Auth("huntingkeywords:update")
    async processHunting() {
        return await this.huntingService.processHunting(true);
    }

    @Get("processKeyword/:keywordId", { exclude: true })
    @Auth("huntingkeywords:update")
    async processKeyword(@Param("keywordId") keywordId: string) {
        return await this.huntingService.processKeyword(keywordId);
    }

    @Get("getResults", { exclude: true })
    @Auth("huntingresults:get")
    async getResults(@Queries() queries: any) {
        return await this.huntingService.getResults(queries);
    }

    @Put("approveResult/:id", { exclude: true })
    @Auth("huntingresults:update")
    async approveResult(@Param("id") id: string) {
        return await this.huntingService.setResultStatus(id, 'APPROVED');
    }

    @Put("rejectResult/:id", { exclude: true })
    @Auth("huntingresults:update")
    async rejectResult(@Param("id") id: string) {
        return await this.huntingService.setResultStatus(id, 'REJECTED');
    }
}
