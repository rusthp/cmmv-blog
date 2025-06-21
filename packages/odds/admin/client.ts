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
        get: async (filters: Record<string, any>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`odds/countries?${query}`, "GET");
        },
        getById: async (id: string) => {
            return api.authRequest(`odds/countries/${id}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("odds/countries", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`odds/countries/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`odds/countries/${id}`, "DELETE");
        },
        sync: async (settingId: string, endpoint: string) => {
            return api.authRequest("odds/countries/sync", "POST", { settingId, endpoint });
        },
        processFlag: async (id: string) => {
            return api.authRequest(`odds/countries/${id}/process-flag`, "POST");
        },
        processAllFlags: async () => {
            return api.authRequest("odds/countries/process-all-flags", "POST");
        }
    }

    const leagues = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`odds/leagues?${query}`, "GET");
        },
        insert: async (data: any) => {
            // TODO: Implement API call
            return api.authRequest("odds/leagues", "POST", data);
        },
        update: async (id: string, data: any) => {
            // TODO: Implement API call
            return api.authRequest(`odds/leagues/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            // TODO: Implement API call
            return api.authRequest(`odds/leagues/${id}`, "DELETE");
        },
        sync: async (settingId: string, endpoint: string) => {
            return api.authRequest("odds/leagues/sync", "POST", { settingId, endpoint });
        },
        processLogo: async (id: string) => {
            return api.authRequest(`odds/leagues/${id}/process-logo`, "POST");
        },
        startProcessAllLogos: async () => {
            return api.authRequest("odds/leagues/process-all-logos/start", "POST");
        },
        getProcessAllLogosStatus: async (jobId: string) => {
            return api.authRequest(`odds/leagues/process-all-logos/progress/${jobId}`, "GET");
        }
    }

    const settings = {
        get: async (filters: Record<string, any>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`odds/settings?${query}`, "GET");
        },
        getById: async (id: string) => {
            return api.authRequest(`odds/settings/${id}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("odds/settings", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`odds/settings/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`odds/settings/${id}`, "DELETE");
        }
    }

    const venues = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`odds/venues?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("odds/venues", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`odds/venues/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`odds/venues/${id}`, "DELETE");
        },
        sync: async (settingId: string, endpoint: string, country?: string, search?: string, id?: number, name?: string, city?: string) => {
            return api.authRequest("odds/venues/sync", "POST", { settingId, endpoint, country, search, id, name, city });
        },
        syncAllCountries: async (settingId: string) => {
            return api.authRequest("odds/venues/sync-all-countries", "POST", { settingId });
        },
        getSyncProgress: async (syncId: string) => {
            return api.authRequest(`odds/venues/sync-progress/${syncId}`, "GET");
        },
        getSyncProgressStream: (syncId: string) => {
            const baseUrl = api.getBaseUrl();
            const token = api.getToken();
            return new EventSource(`${baseUrl}/odds/venues/sync-progress-stream/${syncId}?token=${token}`);
        },
        processImage: async (id: string) => {
            return api.authRequest(`odds/venues/${id}/process-image`, "POST");
        },
        startProcessAllImages: async () => {
            return api.authRequest("odds/venues/process-all-images/start", "POST");
        },
        getProcessAllImagesStatus: async (jobId: string) => {
            return api.authRequest(`odds/venues/process-all-images/progress/${jobId}`, "GET");
        }
    }

    const teams = {
        get: async (filters: Record<string, string>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`odds/teams?${query}`, "GET");
        },
        insert: async (data: any) => {
            return api.authRequest("odds/teams", "POST", data);
        },
        update: async (id: string, data: any) => {
            return api.authRequest(`odds/teams/${id}`, "PUT", data);
        },
        delete: async (id: string) => {
            return api.authRequest(`odds/teams/${id}`, "DELETE");
        },
        sync: async (settingId: string, params: {
            id?: string;
            name?: string;
            country?: string;
            code?: string;
            venue?: string;
            league?: string;
            season?: string;
            search?: string;
        }) => {
            return api.authRequest("odds/teams/sync", "POST", { settingId, ...params });
        },
        getSyncProgress: async (syncId: string) => {
            return api.authRequest(`odds/teams/sync-progress/${syncId}`, "GET");
        },
        processImage: async (id: string) => {
            return api.authRequest(`odds/teams/${id}/process-image`, "POST");
        },
        startProcessAllImages: async () => {
            return api.authRequest("odds/teams/process-all-images/start", "POST");
        },
        getProcessAllImagesStatus: async (jobId: string) => {
            return api.authRequest(`odds/teams/process-all-images/progress/${jobId}`, "GET");
        }
    }

    return {
        categories,
        countries,
        leagues,
        settings,
        venues,
        teams
    };
};
