import {
    Service, Logger
} from "@cmmv/core";

import {
    Repository, In
} from "@cmmv/repository";

@Service()
export class AffiliateSpecialDatesServiceTools {
    private readonly logger = new Logger("AffiliateSpecialDatesService");

    /**
     * Get special dates
     * @param queries - Queries
     * @returns Special dates
     */
    async getSpecialDates(queries: any) {
        const SpecialDatesEntity = Repository.getEntity("AffiliateSpecialDatesEntity");

        if (queries.slug) {
            const result = await Repository.findOne(SpecialDatesEntity, { slug: queries.slug });
            return result;
        }

        if (queries.active === undefined || queries.active === null) {
            queries.active = true;
        }

        return await Repository.findAll(SpecialDatesEntity, queries);
    }

    /**
     * Find special date by slug
     * @param slug - Slug
     * @returns Special date
     */
    async findBySlug(slug: string) {
        const SpecialDatesEntity = Repository.getEntity("AffiliateSpecialDatesEntity");
        const result = await Repository.findOne(SpecialDatesEntity, { slug: slug });
        return result;
    }

    /**
     * Get campaigns by special date
     * @param specialDateId - Special date ID
     * @returns Campaigns
     */
    async getCampaignsBySpecialDate(specialDateId: string) {
        try {
            const SpecialDatesEntity = Repository.getEntity("AffiliateSpecialDatesEntity");
            const CampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");

            const specialDate = await Repository.findOne(SpecialDatesEntity, {
                id: specialDateId
            });
            if (!specialDate || !specialDate.campaigns || specialDate.campaigns.length === 0) {
                return [];
            }

            const campaigns = await Repository.findAll(CampaignsEntity, {
                id: In(specialDate.campaigns),
                active: true
            }, [], {
                select: [
                    "id", "name", "logo", "highlight", "slug", "description"
                ]
            });

            return campaigns?.data || [];
        } catch (error) {
            console.error('Error fetching campaigns by special date ID:', error);
            return [];
        }
    }

    /**
     * Get campaigns by special date slug
     * @param slug - Slug
     * @returns Campaigns
     */
    async getCampaignsBySpecialDateSlug(slug: string) {
        try {
            const SpecialDatesEntity = Repository.getEntity("AffiliateSpecialDatesEntity");
            const CampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");

            const specialDate = await Repository.findOne(SpecialDatesEntity, {
                slug: slug
            });

            if (!specialDate || !specialDate.campaigns || specialDate.campaigns.length === 0) {
                return [];
            }

            const campaigns = await Repository.findAll(CampaignsEntity, {
                id: specialDate.campaigns,
                active: true
            }, [], {
                select: [
                    "id", "name", "logo", "highlight", "slug", "description"
                ]
            });

            return campaigns?.data || [];
        } catch (error) {
            console.error('Error fetching campaigns by special date slug:', error);
            return [];
        }
    }
}