import { defineStore } from 'pinia'

export const useCouponsStore = defineStore('coupons', {
    state: () => ({
        featuredCoupons: [] as any[],
        top25Coupons: [] as any[],
        campaignCoupons: {} as Record<string, any[]>,
        couponsBySpecialDateSlug: {} as Record<string, { featured: any[], all: any[] }>,
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
        },
        setCouponsForSpecialDate(slug: string, coupons: { featured: any[], all: any[] }) {
            if (slug && coupons) {
                this.couponsBySpecialDateSlug[slug] = coupons;
            }
        },
    },
    getters: {
        getFeaturedCoupons: (state) => state.featuredCoupons,
        getTop25Coupons: (state) => state.top25Coupons,
        getCampaignCoupons: (state) => (campaignId: string) => state.campaignCoupons[campaignId] || [],
        getCouponsBySpecialDateSlug: (state) => (slug: string) => {
            return state.couponsBySpecialDateSlug[slug] || { featured: [], all: [] };
        },
    }
})