import * as url from "node:url";
import * as xml2js from 'xml2js';
import { Service } from "@cmmv/core";

import {
    NetworkApiAbstract
} from "./network-api.abstract";

@Service("rakuten")
export class RakutenService extends NetworkApiAbstract {
    /**
     * Generate the token
     * @param metadata - The metadata
     * @returns The token
     */
    private async generateToken(metadata?: any){
        const base64 = Buffer.from(`${metadata.client_id}:${metadata.client_secret}`).toString('base64');
        const response = await fetch("https://api.linksynergy.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Bearer ${base64}`
            },
            body: new URLSearchParams({
                "scope": metadata.sid
            }).toString()
        });

        const data = await response.json();
        return data.access_token;
    }

    /**
     * Get the campaigns
     * @param urlApi - The URL of the API
     * @param metadata - The metadata
     * @returns The campaigns
     */
    async getCampaigns(urlApi: string, metadata?: any){
        const token = await this.generateToken(metadata);
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        const dataReturn = [];
        const campaigns = data.advertisers;

        for(const key in campaigns){
            const campaign = campaigns[key];
            const urlCampaign = url.parse(campaign.url);
            const domain = urlCampaign.hostname;

            dataReturn.push({
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                url: campaign.url,
                image: campaign.profiles.logoURL,
                active: true,
                domain: domain?.replace("www.", "")
            });
        }

        return dataReturn;
    }

    /**
     * Get the coupons
     * @param urlApi - The URL of the API
     * @param metadata - The metadata
     * @returns The coupons
     */
    async getCoupons(urlApi: string, metadata?: any){
        const token = await this.generateToken(metadata);
        const response = await fetch(urlApi, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const parser = new xml2js.Parser({
            explicitArray: false,
            normalize: true,
            normalizeTags: false,
            mergeAttrs: false,
            attrkey: '$'
        });

        const data = await response.text();
        const result = await parser.parseStringPromise(data);
        const coupons = result.couponfeed.link;
        const dataReturn: any[] = [];

        for(const key in coupons){
            try{
                const coupon = coupons[key];
                const resolvedLink = await this.resolveShortenedUrl(coupon.clickurl, true, 10);
                const match = coupon.impressionpixel.match(/[?&]bids=([^&]+)/);

                dataReturn.push({
                    title: coupon.offerdescription,
                    description: coupon.offerdescription,
                    code: coupon.couponcode,
                    active: true,
                    expiration: new Date(coupon.offerenddate),
                    link: resolvedLink,
                    advertiser: coupon.advertiserid,
                    promotionId: match[1],
                    deeplink: coupon.clickurl
                });
            }
            catch(e){}
        }

        return dataReturn;
    }

    /**
     * Get the deeplink
     * @param urlApi - The URL of the API
     * @param metadata - The metadata
     * @returns The deeplink
     */
    async getDeeplink(urlApi: string, metadata: any){
        const token = await this.generateToken(metadata);
        const response = await fetch(urlApi, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                url: metadata.url,
                advertiser_id: Number(metadata.campaignId)
            })
        });

        const data = await response.json();
        return data.advertiser.deep_link.deep_link_url;
    }
}
