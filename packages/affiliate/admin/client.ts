//@ts-ignore
import { useApi } from '@cmmv/blog/admin/api';

export const useAffiliateClient = () => {
    const api = useApi();

    const networks = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliate/networks?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliate/networks", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliate/networks/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliate/networks/${id}`, "DELETE");
        },
        getNetworkCampaigns: async (networkId: string) => {
            return api.authRequest(`affiliate/campaigns-networks/network-campaigns/${networkId}`, "GET");
        },
        getCouponsByNetwork: async (networkId: string) => {
            return api.authRequest(`affiliate/campaigns-networks/coupons/${networkId}`, "GET");
        },
        export: async (token: string) => {
            return api.authRequest(`affiliate/networks/export?token=${token}`, "GET");
        }
    }

    const campaigns = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliate/campaigns?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliate/campaigns", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliate/campaigns/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliate/campaigns/${id}`, "DELETE");
        },
        updateLogo: async (id: string, logoData: string) => {
            return api.authRequest(`affiliate/campaigns/${id}/logo`, "PUT", { logo: logoData });
        },
        generateSEOContent: async (id: string) => {
            return api.authRequest(`affiliate/campaigns/${id}/generate-seo`, "POST");
        },
        startSEOJob: async (id: string) => {
            return api.authRequest(`affiliate/campaigns/${id}/start-seo-job`, "POST");
        },
        getJobStatus: async (jobId: string) => {
            return api.authRequest(`affiliate/campaigns/job/${jobId}/status`, "GET");
        },
        export: async (token: string) => {
            return api.authRequest(`affiliate/campaigns/export?token=${token}`, "GET");
        },
        getCouponsWithAI: async (campaignId: string) => {
            return api.authRequest(`affiliate/campaigns/ai/${campaignId}`, "GET");
        },
        getCampaignBySlug: async (slug: string) => {
            return api.authRequest(`affiliate/campaigns/public/${slug}`, "GET");
        },
        searchCampaigns: async (query: string) => {
            return api.authRequest(`affiliate/campaigns/search?query=${query}`, "GET");
        }
    }

    const coupons = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliate/coupons?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliate/coupons", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliate/coupons/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliate/coupons/${id}`, "DELETE");
        },
        getCouponsWithAI: async (campaignId: string) => {
            return api.authRequest(`affiliate/coupons/ai/${campaignId}`, "GET");
        },
        generateBestCouponsPost: async (campaignId: string) => {
            return api.authRequest(`affiliate/coupons/generate-post/${campaignId}`, "GET");
        },
        startPostJob: async (campaignId: string) => {
            return api.authRequest(`affiliate/coupons/start-post-job/${campaignId}`, "GET");
        },
        getPostJobStatus: async (jobId: string) => {
            return api.authRequest(`affiliate/coupons/post-job/${jobId}/status`, "GET");
        },
        export: async (token: string) => {
            return api.authRequest(`affiliate/coupons/export?token=${token}`, "GET");
        }
    }

    const accounts = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliate/accounts?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliate/accounts", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliate/accounts/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliate/accounts/${id}`, "DELETE");
        }
    }

    const categories = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliate/categories?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliate/categories", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliate/categories/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliate/categories/${id}`, "DELETE");
        },
        export: async (token: string) => {
            return api.authRequest(`affiliate/categories/export?token=${token}`, "GET");
        }
    }

    const campaignsNetworks = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`affiliate/campaigns-networks?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("affiliate/campaigns-networks", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`affiliate/campaigns-networks/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`affiliate/campaigns-networks/${id}`, "DELETE");
        },
        getApisSupported: async () => {
            return api.authRequest("affiliate/campaigns-networks/apis-supported", "GET");
        },
        getNetworkCampaigns: async () => {
            return api.authRequest("affiliate/campaigns-networks/network-campaigns", "GET");
        },
        getNetworkCampaignsById: async (networkId: string) => {
            return api.authRequest(`affiliate/campaigns-networks/network-campaigns/${networkId}`, "GET");
        },
        getNetworkCampaignsList: async (networkId: string) => {
            return api.authRequest(`affiliate/campaigns-networks/network-campaigns-list/${networkId}`, "GET");
        },
        export: async (token: string) => {
            return api.authRequest(`affiliate/campaigns-networks/export?token=${token}`, "GET");
        }
    }

    const deeplink = {
        getDeeplink: async (accountId: string, campaignId: string, link: string) => {
            return api.authRequest(`affiliate/deeplink/${accountId}/${campaignId}?link=${encodeURIComponent(link)}`, "GET");
        }
    }

    return {
        networks,
        campaigns,
        coupons,
        accounts,
        categories,
        campaignsNetworks,
        deeplink
    };
};
