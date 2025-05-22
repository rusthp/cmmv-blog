import { Service } from "@cmmv/core";

import {
    NetworkApiAbstract
} from "./network-api.abstract";

@Service("awin")
export class AwinService extends NetworkApiAbstract {
    /**
     * Get the campaigns from the Awin API
     * @param urlApi - The URL of the API
     * @returns The campaigns
     */
    async getCampaigns(urlApi: string){
        const response = await fetch(urlApi);
        const data = (response.status === 200) ? await response.json() : [];

        return (data.length > 0) ? data.map((campaign: any) => ({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            url: campaign.displayUrl,
            image: campaign.logoUrl,
            active: campaign.status === "Active",
            currencyCode: campaign.currencyCode,
            sector: campaign.primarySector,
            domain: (campaign.validDomains && campaign.validDomains.length > 0) ? campaign.validDomains[0].domain : campaign.validDomains
        })) : [];
    }

    /**
     * Get the coupons from the Awin API
     * @param urlApi - The URL of the API
     * @returns The coupons
     */
    async getCoupons(urlApi: string){
        let allCoupons: any[] = [];
        let currentPage = 1;
        let hasMorePages = true;

        while (hasMorePages) {
            const response = await fetch(urlApi, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "filters": {
                        "exclusiveOnly": false,
                        "regionCodes": ["BR"],
                        "type": "voucher"
                    },
                    "pagination": {
                        "page": currentPage,
                        "pageSize": 100
                    }
                })
            });

            const result = (response.status === 200) ? await response.json() : { data: [] };

            if (result.data && result.data.length > 0) {
                const coupons = result.data.map((coupon: any) => ({
                    title: coupon.title,
                    description: coupon.description,
                    code: coupon.voucher.code,
                    active: coupon.status === "active",
                    expiration: new Date(coupon.endDate),
                    link: coupon.url,
                    advertiser: coupon.advertiser.id,
                    promotionId: coupon.promotionId,
                    deeplink: coupon.urlTracking
                }));

                allCoupons = [...allCoupons, ...coupons];
                hasMorePages = result.data.length === 100;
                currentPage++
            } else {
                hasMorePages = false;
            }
        }

        return allCoupons;
    }

    /**
     * Get the deeplink from the Awin API
     * @param urlApi - The URL of the API
     * @param metadata - The metadata
     * @returns The deeplink
     */
    async getDeeplink(urlApi: string, metadata: any){
        const response = await fetch(urlApi, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "advertiserId": metadata.campaignId,
                "destinationUrl": metadata.link,
                "shorten": true
            })
        });

        const result = (response.status === 200) ? await response.json() : { data: [] };
        return result.shortUrl;
    }
}
