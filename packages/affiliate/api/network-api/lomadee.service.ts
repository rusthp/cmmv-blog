import * as url from "node:url";
import { Service } from "@cmmv/core";

import {
    NetworkApiAbstract
} from "./network-api.abstract";

@Service("lomadee")
export class LomadeeService extends NetworkApiAbstract {
    /**
     * Get campaigns from Afilio
     * @param urlApi
     * @returns
     */
    async getCampaigns(urlApi: string){
        const response = await fetch(urlApi);
        const data = await response.json();

        const campaigns = (data.stores.length > 0) ? await Promise.all(data.stores.map(async (store: any) => {
            const finalUrl = await this.resolveShortenedUrl(store.link, true, 10)

            return {
                id: store.id,
                name: store.name,
                url: finalUrl,
                image: store.thumbnail,
                active: true,
                currencyCode: "BRL",
                domain: url.parse(finalUrl).hostname?.replace("www.", ""),
                comission: store.maxCommission
            }
        })) : [];

        return campaigns;
    }

    /**
     * Get coupons from Afilio
     * @param urlApi
     * @returns
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
        const coupons = data.coupons;

        for(const key in coupons){
            const coupon = coupons[key];
            const resolvedLink = await this.resolveShortenedUrl(coupon.link, true, 10);

            dataReturn.push({
                title: coupon.description,
                description: coupon.description,
                code: coupon.code.trim(),
                active: true,
                expiration: new Date(coupon.vigency),
                link: resolvedLink,
                advertiser: coupon.store.id,
                promotionId: coupon.id,
                deeplink: coupon.link
            });
        }

        return dataReturn;
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
        return result.deeplinks[0].deeplink;
    }
}
