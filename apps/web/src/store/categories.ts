import { defineStore } from 'pinia'

export const useCategoriesStore = defineStore('categories', {
    state: () => ({
        categories: null as any,
        affiliateCategories: [] as any[],
    }),
    actions: {
        setCategories(data: any) {
            this.categories = data
        },
        setAffiliateCategories(data: any[]) {
            this.affiliateCategories = data || []
        }
    },
    getters: {
        getCategories: (state) => state.categories,
        getAffiliateCategories: (state) => state.affiliateCategories
    }
})
