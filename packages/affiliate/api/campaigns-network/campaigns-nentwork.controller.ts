import {
    Controller, Get, Param,
    ContentType, Raw, Res, Query
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    CampaignsNetworksToolsService
} from "./campaigns-nentwork.service";

@Controller("affiliate/campaigns-networks")
export class CampaignsNetworksControllerTools {
    constructor(private readonly campaignsNetworksService: CampaignsNetworksToolsService){}

    @Get("/apis-supported")
    @ContentType("application/json")
    @Raw()
    @Auth("affiliatecampaignsnetworks:get")
    async getApisSupported(){
        return this.campaignsNetworksService.getApisSupported();
    }

    @Get("/network-campaigns")
    @Auth("affiliatecampaignsnetworks:get")
    async getNetworkCampaigns() {
        return this.campaignsNetworksService.getNetworkCampaigns();
    }

    @Get("/coupons")
    @Auth("affiliatecampaignsnetworks:get")
    async getCoupons() {
        return this.campaignsNetworksService.getCoupons();
    }

    @Get("/network-campaigns/:networkId")
    @Auth("affiliatecampaignsnetworks:get")
    async getNetworkCampaignsByNetwork(@Param("networkId") networkId: string) {
        return this.campaignsNetworksService.getNetworkCampaignsByNetwork(networkId);
    }

    @Get("/network-campaigns-list/:networkId")
    @Auth("affiliatecampaignsnetworks:get")
    async getNetworkCampaignsList(@Param("networkId") networkId: string) {
        return this.campaignsNetworksService.getNetworkCampaignsList(networkId);
    }

    @Get("/coupons/:networkId")
    @Auth("affiliatecampaignsnetworks:get")
    async getCouponsByNetwork(@Param("networkId") networkId: string) {
        return this.campaignsNetworksService.getCouponsByNetwork(networkId);
    }

    @Get("export")
    async export(@Res() response: any, @Query("token") token: string){
        if(token !== process.env.API_SIGNATURE)
            throw new Error("Invalid token");

        const data: string = await this.campaignsNetworksService.export();

        response.res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="campaigns-networks.json"`,
            'Content-Length': Buffer.byteLength(data, 'utf-8')
        });

        response.res.end(data);
    }
}
