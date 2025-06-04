//@ts-ignore
import { useApi } from '@cmmv/blog/admin/api';

export const useOddsClient = () => {
    const api = useApi();

    const categories = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`odds/categories?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("odds/categories", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`odds/categories/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`odds/categories/${id}`, "DELETE");
        },
        updateImage: async (id: string, imageData: string) => {
            return api.authRequest(`odds/categories/${id}/image`, "PUT", { image: imageData });
        }
    }

    const countries = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`odds/countries?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("odds/countries", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`odds/countries/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`odds/countries/${id}`, "DELETE");
        }
    }

    return {
        categories,
        countries
    };
};
