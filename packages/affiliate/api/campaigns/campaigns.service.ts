import { Service, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
//@ts-ignore
import { MediasService } from "@cmmv/blog";

@Service()
export class CampaignsServiceTools {
    /**
     * Update the logo of a campaign
     * @param campaignId - The ID of the campaign
     * @param logo - The logo of the campaign as a base64 string
     * @returns The updated campaign
     */
    async updateCampaignLogo(campaignId: string, logo: string) {
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");

        const campaign = await Repository.findOne(CampaignEntity, {
            id: campaignId
        });

        if (!campaign)
            throw new Error("Campaign not found");

        const mediasService: any = Application.resolveProvider(MediasService);
        const logoUrl = await mediasService.getImageUrl(logo);

        const affectedRows = await Repository.update(CampaignEntity, campaignId, {
            logo: logoUrl
        });

        return { affected: affectedRows};
    }

    /**
     * Get the list of campaigns that are public
     * @returns The list of campaigns
     */
    async getCampaignsPublicList(){
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const campaigns = await Repository.findAll(CampaignEntity, {
            active: true,
            limit: 10000
        }, [], {
            select: ["id", "name", "logo", "description", "highlight", "slug"]
        });

        return (campaigns && campaigns.data.length > 0) ? campaigns?.data : [];
    }

    /**
     * Export the campaigns
     * @returns The campaigns
     */
    async export(){
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const campaigns = await Repository.findAll(CampaignEntity, { limit: 1000000 });
        return (campaigns && campaigns.data.length > 0) ? JSON.stringify(campaigns.data, null, 4) : "";
    }
}
