import {
    Controller, Get, Param,
    CacheControl, ContentType,
    Raw, Put, Body, Res,
    Query, Post
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    CampaignsServiceTools
} from "./campaigns.service";

@Controller("affiliate/campaigns")
export class CampaignsControllerTools {
    constructor(private readonly campaignsService: CampaignsServiceTools){}

    @Put(":campaignId/logo")
    @Auth("affiliatecampaigns:update")
    async updateCampaignLogo(@Param("campaignId") campaignId: string, @Body() data: { logo: string }) {
        return await this.campaignsService.updateCampaignLogo(campaignId, data.logo);
    }

    @Post(":campaignId/generate-seo")
    @Auth("affiliatecampaigns:update")
    async generateSEOContent(@Param("campaignId") campaignId: string) {
        return await this.campaignsService.generateSEOContent(campaignId);
    }

    @Post(":campaignId/start-seo-job")
    @Auth("affiliatecampaigns:update")
    async startSEOGenerationJob(@Param("campaignId") campaignId: string) {
        const jobId = await this.campaignsService.startSEOGenerationJob(campaignId);
        return { jobId, status: 'pending', message: 'SEO generation job started' };
    }

    @Get("job/:jobId/status")
    @Auth("affiliatecampaigns:get")
    async getAIJobStatus(@Param("jobId") jobId: string) {
        return await this.campaignsService.getAIJobStatus(jobId);
    }

    @Get("public")
    @ContentType("application/json")
    @CacheControl({
        maxAge: 60 * 60 * 24,
        sMaxAge: 60 * 60 * 24,
        public: true
    })
    @Raw()
    async getCampaignsPublicList(){
        return await this.campaignsService.getCampaignsPublicList();
    }

    @Get("public-with-counts")
    @ContentType("application/json")
    @CacheControl({
        maxAge: 60 * 15,
        sMaxAge: 60 * 15,
        public: true
    })
    @Raw()
    async getCampaignsPublicListWithCouponCounts(){
        return await this.campaignsService.getCampaignsPublicListWithCouponCounts();
    }

    @Get("export")
    async export(@Res() response: any, @Query("token") token: string){
        if(token !== process.env.API_SIGNATURE)
            throw new Error("Invalid token");

        const data: string = await this.campaignsService.export();

        response.res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="campaigns.json"`,
            'Content-Length': Buffer.byteLength(data, 'utf-8')
        });

        response.res.end(data);
    }
}
