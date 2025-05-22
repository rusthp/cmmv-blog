import {
    Controller, Get, Param,
    CacheControl, ContentType,
    Raw, Put, Body, Res,
    Query
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
