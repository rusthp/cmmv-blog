import { defineStore } from 'pinia'

export const useCampaignsStore = defineStore('campaigns', {
    state: () => ({
        campaigns: null as any,
        campaignsBySpecialDateSlug: {} as Record<string, any[]>,
    }),
    actions: {
        setCampaigns(data: any) {
            this.campaigns = data
        },
        setCampaignsForSpecialDate(slug: string, campaigns: any[]) {
            if (slug && campaigns) {
                this.campaignsBySpecialDateSlug[slug] = campaigns;
            }
        },
    },
    getters: {
        getCampaigns: (state) => state.campaigns,
        getCampaignsBySpecialDateSlug: (state) => (slug: string) => {
            return state.campaignsBySpecialDateSlug[slug] || [];
        },
    }
}) 