import * as url from "node:url";
import { Service } from "@cmmv/core";

import {
    NetworkApiAbstract
} from "./network-api.abstract";

@Service("hasoffers")
export class HasoffersService extends NetworkApiAbstract {
    /**
     * Get campaigns from Afilio
     * @param urlApi
     * @returns
     */
    async getCampaigns(urlApi: string){
        const response = await fetch(urlApi);
        const data = await response.json();
        const dataReturn = [];
        const campaigns = data.response.data;

        for(const key in campaigns){
            const campaign = campaigns[key].Offer;
            const urlCampaign = url.parse(campaign.preview_url);
            const domain = urlCampaign.hostname;

            dataReturn.push({
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                url: campaign.preview_url,
                image: "",
                active: campaign.approval_status === "approved",
                currencyCode: campaign.currency,
                domain: domain?.replace("www.", ""),
                comission: campaign.percent_payout
            });
        }

        return dataReturn;
    }

    /**
     * Get coupons from Afilio
     * @param urlApi
     * @returns
     */
    async getCoupons(urlApi: string){
        return [];
    }

    /**
     * Get deeplink from Afilio
     * @param urlApi
     * @param url
     * @returns
     */
    async getDeeplink(urlApi: string, metadata: any){
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = (response.status === 200) ? await response.json() : { data: [] };
        return result.response.data.click_url;
    }
}
