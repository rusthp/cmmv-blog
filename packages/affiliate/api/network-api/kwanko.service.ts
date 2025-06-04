import * as url from "node:url";
import { Service } from "@cmmv/core";

import {
    NetworkApiAbstract
} from "./network-api.abstract";

@Service("kwanko")
export class KwankoService extends NetworkApiAbstract {
    /**
     * Get the campaigns from the Kwanko API
     * @param urlApi - The URL of the API
     * @returns The campaigns
     */
    async getCampaigns(urlApi: string, metadata: any){
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${metadata.token}`
            }
        });

        const data = (response.status === 200) ? await response.json() : [];
        const campaigns = (data.campaigns.length > 0) ? data.campaigns
        .filter((campaign: any) => campaign.currency === metadata.currency)
        .map((campaign: any) => ({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            url: campaign.url,
            image: campaign.logo,
            active: true,
            currencyCode: campaign.currency,
            domain: url.parse(campaign.url).hostname?.replace("www.", "")
        })) : [];

        return campaigns;
    }

    /**
     * Get the coupons from the Kwanko API
     * @param urlApi - The URL of the API
     * @returns The coupons
     */
    async getCoupons(urlApi: string, metadata: any){
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${metadata.token}`
            }
        });

        const data = (response.status === 200) ? await response.json() : [];

        const dataReturn = [];
        const coupons = data.ads;

        for(const key in coupons){
            try{
                const coupon = coupons[key];
                const resolvedLink = await this.resolveShortenedUrl(coupon.tracked_material_per_websites[0].urls.click, true, 10);

                dataReturn.push({
                    title: coupon.name,
                    description: coupon.description,
                    code: coupon.code,
                    active: true,
                    expiration: new Date(coupon.validity_date.end),
                    link: resolvedLink,
                    advertiser: coupon.campaign.id,
                    promotionId: coupon.id,
                    deeplink: coupon.tracked_material_per_websites[0].urls.click
                });
            }
            catch(e){}
        }

        return dataReturn;
    }

    /**
     * Get the deeplink from the Kwanko API
     * @param urlApi - The URL of the API
     * @param metadata - The metadata
     * @returns The deeplink
     */
    async getDeeplink(urlApi: string, metadata: any){
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${metadata.token}`
            }
        });

        const result = (response.status === 200) ? await response.json() : [];
        return result.ads[0].tracked_material_per_websites[0].urls.click.replace("{XXX}", encodeURIComponent(metadata.url));
    }
}
