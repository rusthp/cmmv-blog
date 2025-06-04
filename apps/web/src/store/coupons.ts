import { defineStore } from 'pinia'

export const useCouponsStore = defineStore('coupons', {
    state: () => ({
        featuredCoupons: [] as any[],
        top25Coupons: [] as any[],
        campaignCoupons: {} as Record<string, any[]>,
    }),
    actions: {
        setFeaturedCoupons(data: any[]) {
            this.featuredCoupons = data || []
        },
        setTop25Coupons(data: any[]) {
            this.top25Coupons = data || []
        },
        setCampaignCoupons(campaignId: string, coupons: any[]) {
            this.campaignCoupons[campaignId] = coupons || []
        }
    },
    getters: {
        getFeaturedCoupons: (state) => state.featuredCoupons,
        getTop25Coupons: (state) => state.top25Coupons,
        getCampaignCoupons: (state) => (campaignId: string) => state.campaignCoupons[campaignId] || [],
    }
})