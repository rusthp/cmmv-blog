import {
    Controller,
    Get,
    Queries,
    Param
} from "@cmmv/http";

import {
    AffiliateSpecialDatesServiceTools
} from "./special-dates.service";

@Controller("affiliate/special-dates")
export class AffiliateSpecialDatesController {
    constructor(private readonly specialDatesService: AffiliateSpecialDatesServiceTools) {}

    @Get("public")
    async getSpecialDates(@Queries() queries: any) {
        return await this.specialDatesService.getSpecialDates(queries);
    }

    @Get("find-by-slug/:slug")
    async findBySlug(@Param("slug") slug: string) {
        return await this.specialDatesService.findBySlug(slug);
    }

    @Get("campaigns/:specialDateId")
    async getCampaignsBySpecialDate(@Param("specialDateId") specialDateId: string) {
        return await this.specialDatesService.getCampaignsBySpecialDate(specialDateId);
    }

    @Get("campaigns/slug/:slug")
    async getCampaignsBySpecialDateSlug(@Param("slug") slug: string) {
        return await this.specialDatesService.getCampaignsBySpecialDateSlug(slug);
    }
}