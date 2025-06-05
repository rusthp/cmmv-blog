//@ts-ignore
import { useApi } from '@cmmv/blog/admin/api';

export const useNewsletterClient = () => {
    const api = useApi();

    const subscribers = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`newsletter/subscribers?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("newsletter/subscribers", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`newsletter/subscribers/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`newsletter/subscribers/${id}`, "DELETE");
        }
    }

    return {
        subscribers
    };
}; 