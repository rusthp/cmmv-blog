import { Service, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

import { AwinService } from "../network-api/awin.service";
import { AfilioService } from "../network-api/afilio.service";
import { CityadsService } from "../network-api/cityads.service";
import { LomadeeService } from "../network-api/lomadee.service";
import { RakutenService } from "../network-api/rakuten.service";

@Service()
export class CampaignsNetworksToolsService {
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
     * Get the APIs supported by the campaigns networks
     * @returns {Object} The APIs supported by the campaigns networks
     */
    async getApisSupported(){
        return {
            "Awin": {
                docs: "https://developer.awin.com/apidocs",
                version: "1.0.0",
                service: () => Application.resolveProvider(AwinService)
            },
            "Afilio": {
                docs: "https://drive.google.com/file/d/1WBZPKidGY1EtjnJE0fIeg1Uk48_Y56gs/view",
                version: "3.0.0",
                service: () => Application.resolveProvider(AfilioService)
            },
            "Cityads": {
                docs: "https://cityads.com/publisher/api/description",
                version: "2.0.0",
                service: () => Application.resolveProvider(CityadsService)
            },
            "Lomadee": {
                docs: "https://developer.socialsoul.com.vc/afiliados/",
                version: "3.0.0",
                service: () => Application.resolveProvider(LomadeeService)
            },
            "Rakuten": {
                docs: "https://developers.rakutenadvertising.com/documentation/en-GB/affiliate_apis",
                version: "2.0.0",
                service: () => Application.resolveProvider(RakutenService)
            }
        }
    }

    /**
     * Get the network API
     * @param network - The network
     * @returns {Object} The network API
     */
    async getNetworkAPI(network: string){
        const supportedApis: any = await this.getApisSupported();
        return (network in supportedApis) ? supportedApis[network].service() : null;
    }

    /**
     * Get the network campaigns
     * @returns {Object} The network campaigns
     */
    async getNetworkCampaigns(){
        const AffiliateNetworksEntity = Repository.getEntity("AffiliateNetworksEntity");
        const AffiliateAccountsEntity = Repository.getEntity("AffiliateAccountsEntity");
        const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");

        const affiliateNetworks = await Repository.findAll(AffiliateNetworksEntity, {
            limit: 1000,
        }, []);

        const affiliateAccounts = await Repository.findAll(AffiliateAccountsEntity, {
            limit: 1000,
        }, []);

        if(affiliateAccounts && affiliateNetworks){
            for(const affiliateAccount of affiliateAccounts.data) {
                const affiliateNetwork = affiliateNetworks.data.find((network: any) => network.id === affiliateAccount.networkId);

                if(!affiliateNetwork)
                    continue;

                const apiLinks = JSON.parse(affiliateNetwork.apiLinks);

                if(apiLinks.campaigns){
                    const metadata = JSON.parse(affiliateAccount.metadata);
                    const formattedUrl = await this.formatUrlWithMetadata(apiLinks.campaigns, metadata);

                    if(affiliateNetwork.apiType !== "Fetch"){
                        const supportedApis = await this.getApisSupported();
                        const service: any = (affiliateNetwork.apiType in supportedApis) ? //@ts-ignore
                            await supportedApis[affiliateNetwork.apiType].service() : null;

                        if(service){
                            const campaigns = await service.getCampaigns(formattedUrl, metadata);

                            campaigns.forEach(async (campaign: any) => {
                                const affiliateCampaignsNetwork = await Repository.findOne(AffiliateCampaignsNetworksEntity, {
                                    network: affiliateNetwork.id,
                                    campaignId: campaign.id
                                });

                                if(!affiliateCampaignsNetwork){
                                    await Repository.insert(AffiliateCampaignsNetworksEntity, {
                                        network: affiliateNetwork.id,
                                        campaignId: campaign.id,
                                        name: campaign.name,
                                        active: campaign.active,
                                        currencyCode: campaign.currencyCode,
                                        sector: campaign.sector,
                                        domain: (typeof campaign.domain === "string") ? campaign.domain?.replace("*.", "") : null
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }

        return { success: true };
    }

    /**
     * Get the network campaigns by network
     * @param networkId - The network ID
     * @returns {Object} The network campaigns
     */
    async getNetworkCampaignsByNetwork(networkId: string){
        const AffiliateNetworksEntity = Repository.getEntity("AffiliateNetworksEntity");
        const AffiliateAccountsEntity = Repository.getEntity("AffiliateAccountsEntity");
        const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");

        const affiliateNetwork = await Repository.findOne(AffiliateNetworksEntity, {
            id: networkId
        });

        if(!affiliateNetwork)
            return { success: false, message: "Network not found" };

        const affiliateAccounts = await Repository.findAll(AffiliateAccountsEntity, {
            limit: 1000,
        }, []);

        if(affiliateAccounts){
            for(const affiliateAccount of affiliateAccounts.data) {
                if(affiliateAccount.networkId !== networkId)
                    continue;

                const apiLinks = JSON.parse(affiliateNetwork.apiLinks);

                if(apiLinks.campaigns){
                    const metadata = JSON.parse(affiliateAccount.metadata);
                    const formattedUrl = await this.formatUrlWithMetadata(apiLinks.campaigns, metadata);

                    if(affiliateNetwork.apiType !== "Fetch"){
                        const supportedApis = await this.getApisSupported();
                        const service: any = (affiliateNetwork.apiType in supportedApis) ? //@ts-ignore
                            await supportedApis[affiliateNetwork.apiType].service() : null;

                        if(service){
                            const campaigns = await service.getCampaigns(formattedUrl, metadata);

                            campaigns.forEach(async (campaign: any) => {
                                const affiliateCampaignsNetwork = await Repository.findOne(AffiliateCampaignsNetworksEntity, {
                                    network: affiliateNetwork.id,
                                    campaignId: campaign.id
                                });

                                if(!affiliateCampaignsNetwork){
                                    await Repository.insert(AffiliateCampaignsNetworksEntity, {
                                        network: affiliateNetwork.id,
                                        campaignId: campaign.id,
                                        name: campaign.name,
                                        active: campaign.active,
                                        currencyCode: campaign.currencyCode,
                                        sector: campaign.sector,
                                        domain: (typeof campaign.domain === "string") ? campaign.domain?.replace("*.", "") : null
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }

        return { success: true };
    }

    /**
     * Get the network campaigns list
     * @param networkId - The network ID
     * @returns {Object} The network campaigns list
     */
    async getNetworkCampaignsList(networkId: string){
        const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");

        const affiliateCampaignsNetworks = await Repository.findAll(AffiliateCampaignsNetworksEntity, {
            network: networkId,
            limit: 1000000
        }, [], {
            select: ["id", "campaignId", "network", "domain", "name", "active", "currencyCode", "sector"]
        });

        return (affiliateCampaignsNetworks) ? affiliateCampaignsNetworks : {};
    }

    /**
     * Get the network coupons
     * @returns {Object} The network coupons
     */
    async getCoupons(){
        const AffiliateNetworksEntity = Repository.getEntity("AffiliateNetworksEntity");
        const AffiliateAccountsEntity = Repository.getEntity("AffiliateAccountsEntity");
        const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");
        const AffiliateCampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");

        const affiliateNetworks = await Repository.findAll(AffiliateNetworksEntity, {
            limit: 1000,
        }, []);

        const affiliateAccounts = await Repository.findAll(AffiliateAccountsEntity, {
            limit: 1000,
        }, []);

        const affiliateCampaigns = await Repository.findAll(AffiliateCampaignsEntity, {
            limit: 10000,
        }, [], {
            select: ["id", "domain", "name"]
        });

        const affiliateCampaignsNetworks = await Repository.findAll(AffiliateCampaignsNetworksEntity, {
            limit: 1000000,
        }, [], {
            select: ["id", "campaignId", "network", "domain"]
        });

        if(affiliateAccounts && affiliateNetworks && affiliateCampaignsNetworks && affiliateCampaigns){
            for(const affiliateAccount of affiliateAccounts.data) {
                const affiliateNetwork = affiliateNetworks.data.find((network: any) => network.id === affiliateAccount.networkId);

                if(!affiliateNetwork)
                    continue;

                const apiLinks = JSON.parse(affiliateNetwork.apiLinks);

                if(apiLinks.coupons){
                    const metadata = JSON.parse(affiliateAccount.metadata);
                    const formattedUrl = await this.formatUrlWithMetadata(apiLinks.coupons, metadata);

                    if(affiliateNetwork.apiType !== "Fetch"){
                        const supportedApis = await this.getApisSupported();
                        const service: any = (affiliateNetwork.apiType in supportedApis) ? //@ts-ignore
                            await supportedApis[affiliateNetwork.apiType].service() : null;

                        if(service){
                            const coupons = await service.getCoupons(formattedUrl, metadata);

                            coupons.forEach(async (coupon: any) => {
                                const affiliateCampaignsNetwork = await Repository.findOne(AffiliateCouponsEntity, {
                                    network: affiliateNetwork.id,
                                    advertiser: coupon.advertiser,
                                    promotionId: coupon.promotionId
                                });

                                const affiliateCampaign = affiliateCampaignsNetworks.data
                                    .find((campaign: any) => (campaign.campaignId === coupon.advertiser || campaign.campaignId === coupon.advertiser.toString()) && campaign.network === affiliateNetwork.id);

                                if(!affiliateCampaignsNetwork && affiliateCampaign){
                                    const affiliateCampaignDomain = affiliateCampaigns.data.find((campaign: any) => campaign.domain === affiliateCampaign.domain);

                                    if(coupon.code.trim() !== ""){
                                        await Repository.insert(AffiliateCouponsEntity, {
                                            network: affiliateNetwork.id,
                                            advertiser: coupon.advertiser,
                                            promotionId: coupon.promotionId,
                                            title: coupon.title,
                                            description: coupon.description,
                                            code: coupon.code,
                                            active: coupon.active,
                                            expiration: coupon.expiration,
                                            link: coupon.link,
                                            campaign: (affiliateCampaignDomain) ? affiliateCampaignDomain.id : null,
                                            campaignName: (affiliateCampaignDomain) ? affiliateCampaignDomain.name : null,
                                            deeplink: coupon.deeplink
                                        });
                                    }
                                }
                            });
                        }
                    }
                }
            }
        }

        return { success: true };
    }

    /**
     * Get the network coupons by network
     * @param networkId - The network ID
     * @returns {Object} The network coupons
     */
    async getCouponsByNetwork(networkId: string){
        const AffiliateNetworksEntity = Repository.getEntity("AffiliateNetworksEntity");
        const AffiliateAccountsEntity = Repository.getEntity("AffiliateAccountsEntity");
        const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");
        const AffiliateCampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");

        const affiliateNetwork = await Repository.findOne(AffiliateNetworksEntity, {
            id: networkId
        });

        const affiliateAccounts = await Repository.findAll(AffiliateAccountsEntity, {
            limit: 1000,
        }, []);

        const affiliateCampaigns = await Repository.findAll(AffiliateCampaignsEntity, {
            limit: 10000,
        }, [], {
            select: ["id", "domain", "name"]
        });

        const affiliateCampaignsNetworks = await Repository.findAll(AffiliateCampaignsNetworksEntity, {
            limit: 1000000,
        }, [], {
            select: ["id", "campaignId", "network", "domain"]
        });

        if(affiliateAccounts && affiliateNetwork && affiliateCampaignsNetworks && affiliateCampaigns){
            for(const affiliateAccount of affiliateAccounts.data) {
                if(affiliateAccount.networkId !== networkId)
                    continue;

                const apiLinks = JSON.parse(affiliateNetwork.apiLinks);

                if(apiLinks.coupons){
                    const metadata = JSON.parse(affiliateAccount.metadata);
                    const formattedUrl = await this.formatUrlWithMetadata(apiLinks.coupons, metadata);

                    if(affiliateNetwork.apiType !== "Fetch"){
                        const supportedApis = await this.getApisSupported();
                        const service: any = (affiliateNetwork.apiType in supportedApis) ? //@ts-ignore
                            await supportedApis[affiliateNetwork.apiType].service() : null;

                        if(service){
                            const coupons = await service.getCoupons(formattedUrl, metadata);

                            coupons.forEach(async (coupon: any) => {
                                const affiliateCampaignsNetwork = await Repository.findOne(AffiliateCouponsEntity, {
                                    network: affiliateNetwork.id,
                                    advertiser: coupon.advertiser,
                                    promotionId: coupon.promotionId
                                });

                                const affiliateCampaign = affiliateCampaignsNetworks.data
                                    .find((campaign: any) => (campaign.campaignId === coupon.advertiser || campaign.campaignId === coupon.advertiser.toString()) && campaign.network === affiliateNetwork.id);

                                if(!affiliateCampaignsNetwork && affiliateCampaign){
                                    const affiliateCampaignDomain = affiliateCampaigns.data.find((campaign: any) => campaign.domain === affiliateCampaign.domain);

                                    await Repository.insert(AffiliateCouponsEntity, {
                                        network: affiliateNetwork.id,
                                        advertiser: coupon.advertiser,
                                        promotionId: coupon.promotionId,
                                        title: coupon.title,
                                        description: coupon.description,
                                        code: coupon.code,
                                        active: coupon.active,
                                        expiration: coupon.expiration,
                                        link: coupon.link,
                                        campaign: (affiliateCampaignDomain) ? affiliateCampaignDomain.id : null,
                                        campaignName: (affiliateCampaignDomain) ? affiliateCampaignDomain.name : null,
                                        deeplink: coupon.deeplink
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }

        return { success: true };
    }

    /**
     * Export the campaigns
     * @returns The campaigns
     */
    async export(){
        const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");
        const campaigns = await Repository.findAll(AffiliateCampaignsNetworksEntity, { limit: 1000000 });
        return (campaigns && campaigns.data.length > 0) ? JSON.stringify(campaigns.data, null, 4) : "";
    }
}
