import {
    Service, Application
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import {
    CampaignsNetworksToolsService
} from "../campaigns-network/campaigns-nentwork.service";

@Service()
export class DeeplinkService {
    /**
     * Format the URL with the metadata
     * @param url - The URL to format
     * @param metadata - The metadata to format the URL with
     * @returns {Promise<string>} The formatted URL
     */
    private async formatUrlWithMetadata(url: string, metadata: any){
        for(let key in metadata)
            url = url.replace(`{${key}}`, metadata[key]);

        return url;
    }

    /**
     * Get the deeplink for a campaign
     * @param networkId The ID of the network
     * @param campaignId The ID of the campaign
     * @returns The deeplink
     */
    async getDeeplink(accountId: string, campaignId: string, link: string) {
        const AffiliateAccountsEntity = Repository.getEntity("AffiliateAccountsEntity");
        const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");
        const AffiliateNetworksEntity = Repository.getEntity("AffiliateNetworksEntity");
        const campaignsNetworksToolsService = Application.resolveProvider(CampaignsNetworksToolsService);

        const account = await Repository.findOne(AffiliateAccountsEntity, {
            id: accountId
        });

        if (!account)
            throw new Error("Account not found");

        const affiliateNetwork = await Repository.findOne(AffiliateNetworksEntity, {
            id: account.network
        });

        if (!affiliateNetwork)
            throw new Error("Network not found");

        const campaignNetwork = await Repository.findOne(AffiliateCampaignsNetworksEntity, {
            id: campaignId,
            network: account.network
        });

        console.log({
            id: campaignId,
            network: account.network
        });

        if (!campaignNetwork)
            throw new Error("Campaign network not found");

        const apiLinks = JSON.parse(affiliateNetwork.apiLinks);

        if(apiLinks.deeplink){
            let metadata = JSON.parse(account.metadata);
            const formattedUrl = await this.formatUrlWithMetadata(apiLinks.deeplink, {
                ...metadata,
                campaignId: campaignNetwork.campaignId,
                url: encodeURIComponent(link)
            });

            const networkAPI = await campaignsNetworksToolsService.getNetworkAPI(affiliateNetwork.apiType);

            if(networkAPI){
                const deeplink = await networkAPI.getDeeplink(formattedUrl, {
                    ...metadata,
                    campaignId: campaignNetwork.campaignId,
                    url: link
                });

                return { success: true, deeplink: deeplink };
            }
        }

        return { success: false, message: "No deeplink found" };
    }
}
