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
        }
    };

    const coupons = {
        getMostViewed: async () => {
            const { data } = await api.get<any[]>("affiliate/coupons/campaign/views", "coupons");
            return data.value || [];
        }
    };

    return {
        categories,
        campaigns,
        coupons
    };
};