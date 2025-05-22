import * as url from "node:url";
import { Service } from "@cmmv/core";

import {
    NetworkApiAbstract
} from "./network-api.abstract";

@Service("cityads")
export class CityadsService extends NetworkApiAbstract {
    /**
     * Get the campaigns from the Cityads API
     * @param urlApi - The URL of the API
     * @returns The campaigns
     */
    async getCampaigns(urlApi: string){
        const response = await fetch(urlApi);
        const data = (response.status === 200) ? await response.json() : [];

        return (data.offers.length > 0) ? data.offers
            .filter((campaign: any) => campaign.offer_currency.name === "BRL")
            .map((campaign: any) => ({
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                url: campaign.site_url,
                image: campaign.logo,
                active: campaign.is_available,
                currencyCode: campaign.offer_currency.name,
                sector: campaign.category.name,
                domain: url.parse(campaign.site_url).hostname?.replace("www.", "")
            })) : [];
    }

    /**
     * Get the coupons from the Cityads API
     * @param urlApi - The URL of the API
     * @returns The coupons
     */
    async getCoupons(urlApi: string){
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = (response.status === 200) ? await response.json() : [];
        const dataReturn = [];
        const coupons = data.data.items;

        for(const key in coupons){
            const coupon = coupons[key];
            const resolvedLink = await this.resolveShortenedUrl(coupon.url);

            dataReturn.push({
                title: coupon.name,
                description: coupon.description,
                code: coupon.promo_code.trim(),
                active: (coupon.status !== "Active"),
                expiration: new Date(coupon.active_to),
                link: resolvedLink,
                advertiser: coupon.offer_id,
                promotionId: coupon.id,
                deeplink: coupon.url
            });
        }

        return dataReturn;
    }

    /**
     * Get the deeplink from the Cityads API
     * @param urlApi - The URL of the API
     * @param metadata - The metadata
     * @returns The deeplink
     */
    async getDeeplink(urlApi: string, metadata: any){
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = (response.status === 200) ? await response.json() : [];
        let deeplink = "";

        for(var key2 in result.data.items){
            if(result.data.items[key2].is_default){
                deeplink = result.data.items[key2].deep_link+"?url="+encodeURIComponent(metadata.url);
                break;
            }
        }

        return deeplink;
    }
}
