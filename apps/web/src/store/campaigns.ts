import { defineStore } from 'pinia'

export const useCampaignsStore = defineStore('campaigns', {
    state: () => ({
        campaigns: null as any,
    }),
    actions: {
        setCampaigns(data: any) {
            this.campaigns = data
        }
    },
    getters: {
        getCampaigns: (state) => state.campaigns
    }
}) 