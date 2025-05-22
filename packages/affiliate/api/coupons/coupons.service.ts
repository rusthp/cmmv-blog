import {
    Service, Application, Config
} from "@cmmv/core";

import {
    Repository, In, Not, IsNull,
    MoreThan
} from "@cmmv/repository";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

@Service()
export class CouponsServiceTools {
    /**
     * Uses AI to search for coupon codes for a specific campaign and adds them to the database
     * @param campaignId The ID of the campaign to find coupons for
     * @returns Array of created coupon objects
     */
    async getCouponsWithAI(campaignId: string) {
        const language = Config.get("blog.language", "en");
        const AffiliateCampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");

        const campaign = await Repository.findOne(AffiliateCampaignsEntity, {
            id: campaignId
        });

        if (!campaign)
            throw new Error(`Campaign with ID ${campaignId} not found`);

        const prompt = `
            Find 10 current discount coupon codes for ${campaign.name}.
            Only include coupons that have an actual code and are VALID (not expired).
            IMPORTANT: Only include coupons with expiration dates in the future (after today's date) or with no expiration.

            For each coupon, provide:
            1. Translating it to ${language}
            2. The coupon code
            3. A brief description of the discount (make it detailed but do not exceed 250 characters)
            4. The expiration date (if available) - MUST be after today or null
            5. The discount amount or percentage
            6. The source URL where you found this coupon code

            IMPORTANT: Return ONLY a raw JSON array with objects containing these fields, without any explanation or text before or after:
            [
              {
                "code": "EXAMPLE15",
                "description": "Description of the discount - make this detailed with 100-250 characters explaining the offer, restrictions, and benefits",
                "expiration": "YYYY-MM-DD",
                "type": "Cupom",
                "typeDiscount": "percentage" or "fixed",
                "title": "Brief title for the coupon",
                "linkRef": "https://example.com/source-page-where-coupon-was-found"
              }
            ]

            If the expiration date is not available, set it to null.
            For typeDiscount, set to "percentage" if it's a percentage discount, or "fixed" if it's a fixed amount.
            For linkRef, provide the EXACT URL where you found the coupon code - this is very important.
            Today's date is ${new Date().toISOString().split('T')[0]}, so all expiration dates must be after this date.

            DO NOT include any explanatory text, disclaimers or notes - ONLY the JSON array.
        `;

        try {
            const aiService = Application.resolveProvider<any>(AIContentService);
            const aiResponse = await aiService.generateContent(prompt);

            let coupons = [];

            let jsonText = '';
            if (typeof aiResponse === 'string') {
                const jsonStartIndex = aiResponse.indexOf('[');
                const jsonEndIndex = aiResponse.lastIndexOf(']') + 1;

                if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                    jsonText = aiResponse.substring(jsonStartIndex, jsonEndIndex);
                } else {
                    jsonText = aiResponse;
                }

                jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                console.log('Extracted JSON text:', jsonText.substring(0, 100) + '...');
            } else {
                jsonText = JSON.stringify(aiResponse);
            }

            const parsedResponse = JSON.parse(jsonText);

            if (Array.isArray(parsedResponse)) {
                coupons = parsedResponse;
            } else if (parsedResponse.coupons && Array.isArray(parsedResponse.coupons)) {
                coupons = parsedResponse.coupons;
            } else {
                console.warn("AI response does not contain a valid coupons array");
                return [];
            }

            const savedCoupons = [];
            for (const coupon of coupons) {
                if (!coupon.code) continue;

                const existingCoupon = await Repository.findOne(AffiliateCouponsEntity, {
                    code: coupon.code
                });

                if (existingCoupon)
                    continue;

                const newCoupon = {
                    title: coupon.title || `${campaign.name} ${coupon.code}`,
                    description: coupon.description || '',
                    code: coupon.code,
                    expiration: coupon.expiration ? new Date(coupon.expiration) : null,
                    type: coupon.type || 'Cupom',
                    typeDiscount: coupon.typeDiscount || 'percentage',
                    active: true,
                    campaign: campaignId,
                    campaignName: campaign.name,
                    network: campaign.network || null,
                    linkRef: coupon.linkRef || null
                };

                try {
                    const savedCoupon = await Repository.insert(AffiliateCouponsEntity, newCoupon);
                    savedCoupons.push(savedCoupon);
                } catch (err) {
                    console.warn(`Failed to save coupon ${coupon.code}: ${err instanceof Error ? err.message : String(err)}`);
                }
            }

            return savedCoupons;
        } catch (err) {
            console.warn(`Error processing AI response: ${err instanceof Error ? err.message : String(err)}`);
            return [];
        }
    }

    /**
     * Get all coupons for a campaign
     * @param campaignId The ID of the campaign to get coupons for
     * @returns Array of coupon objects
     */
    async getCoupons(campaignId: string) {
        const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");

        const coupons = await Repository.findAll(AffiliateCouponsEntity, {
            limit: 100,
            active: true,
            campaign: campaignId
        }, [], {
            order: {
                expiration: "DESC"
            },
            select: ["title", "code", "description", "expiration", "type", "typeDiscount"]
        });

        return (coupons) ? coupons.data : [];
    }

    /**
     * Get all coupons for a campaign with views
     * @param campaignId The ID of the campaign to get coupons for
     * @returns Array of coupon objects
     */
    async getCouponsWithViews() {
        const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");
        const AffiliateCampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");

        const coupons = await Repository.findAll(AffiliateCouponsEntity, {
            limit: 100,
            active: true,
            campaign: Not(IsNull()),
            expiration: MoreThan(new Date())
        }, [], {
            order: {
                views: "DESC"
            },
            select: ["title", "code", "description", "expiration", "type", "typeDiscount", "views", "campaign"]
        });

        const campaignIds = (coupons) ? coupons.data.map((coupon: any) => coupon.campaign) : [];

        const campaigns = await Repository.findAll(AffiliateCampaignsEntity, {
            id: In(campaignIds)
        }, [], {
            select: ["id", "name", "slug", "logo"]
        });

        if (!campaigns)
            throw new Error(`Campaigns with IDs ${campaignIds} not found`);

        const campaignMap = new Map(campaigns.data.map((campaign: any) => [campaign.id, campaign]));
        let dataResponse: any[] = [];

        if (coupons) {
            dataResponse = coupons.data;
            coupons.data.forEach((coupon: any, index: number) => {
                const campaign: any = campaignMap.get(coupon.campaign);

                if (campaign) {
                    dataResponse[index].campaignName = campaign.name;
                    dataResponse[index].campaignSlug = campaign.slug;
                    dataResponse[index].campaignLogo = campaign.logo;
                }
            });
        }

        return (dataResponse.length > 0) ? dataResponse : [];
    }

    /**
     * Export the coupons
     * @returns The coupons
     */
    async export(){
        const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");
        const coupons = await Repository.findAll(AffiliateCouponsEntity, { limit: 1000000 });
        return (coupons && coupons.data.length > 0) ? JSON.stringify(coupons.data, null, 4) : "";
    }
}
