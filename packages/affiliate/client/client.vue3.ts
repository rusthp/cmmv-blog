//@ts-nocheck
import { useApi } from "@cmmv/blog/client/client.vue3";

let ref = (val) => ({ value: val });
let inject = () => ({});
let App = function () { };

try {
    const Vue = require('vue');
    ref = Vue.ref;
    inject = Vue.inject;
    App = Vue.App;
} catch (e) {}

const PRELOADED_KEY = Symbol('preloaded');
type FetchMap = Record<string, Promise<any>>;
let ssrData: FetchMap = {};

/**
 * @description Get the environment variable
 * @param {string} key - The key of the environment variable
 * @returns {string | undefined} The environment variable
 */
export const getEnv = (key: string): string | undefined => {
    if (typeof import.meta !== 'undefined' && import.meta.env)
        return import.meta.env[key]

    if (typeof process !== 'undefined' && process.env)
        return process.env[key]

    return undefined
}

/**
 * @description Use the Blog API to fetch data from the server
 * @returns {Object} The Blog API object
 */
export const useAffiliate = () => {
    const api = useApi();

    const categories = {
        getAll: async () => {
            const { data } = await api.get<any[]>("affiliate/categories/public", "categories");
            return data.value || [];
        }
    };

    const campaigns = {
        getAll: async () => {
            const { data } = await api.get<any[]>("affiliate/campaigns/public", "campaigns");
            return data.value || [];
        },
        getAllWithCouponCounts: async () => {
            const { data } = await api.get<any[]>("affiliate/campaigns/public-with-counts", "campaigns_with_counts");
            return data.value || [];
        }
    };

    const coupons = {
        getMostViewed: async () => {
            const { data } = await api.get<any[]>("affiliate/coupons/campaign/views", "coupons");
            return data.value || [];
        },
        getCountByCampaignId: async (campaignId: string) => {
            if (!campaignId) {
                console.warn('Campaign ID is required to get coupon count.');
                return { count: 0 };
            }
            try {
                const { data } = await api.get<{ count: number }>(`affiliate/coupons/count/${campaignId}`, `coupon_count_${campaignId}`);
                return data.value || { count: 0 };
            } catch (error) {
                console.error(`Failed to fetch coupon count for campaign ${campaignId}:`, error);
                return { count: 0 };
            }
        },
        getTop25WeeklyCoupons: async () => {
            try {
                const { data } = await api.get<any[]>("affiliate/coupons/top25weekly", "coupons_top25weekly");
                return data.value || [];
            } catch (error) {
                console.error("Failed to fetch top 25 weekly coupons:", error);
                return [];
            }
        },
        getByCampaignId: async (campaignId: string) => {
            if (!campaignId) {
                console.warn('Campaign ID is required to get coupons.');
                return [];
            }
            try {
                const { data } = await api.get<any[]>(`affiliate/coupons/campaign/${campaignId}`, `coupons_campaign_${campaignId}`);
                return data.value || [];
            } catch (error) {
                console.error(`Failed to fetch coupons for campaign ${campaignId}:`, error);
                return [];
            }
        }
    };

    return {
        categories,
        campaigns,
        coupons
    };
};