import { defineStore } from 'pinia'

export const useSpecialDatesStore = defineStore('specialdates', {
    state: () => ({
        specialDates: [] as any[],
        specialDateBySlug: {} as Record<string, any>,
    }),
    actions: {
        setSpecialDates(data: any) {
            let datesArray: any[] = [];
            
            if (Array.isArray(data)) {
                datesArray = data;
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.data)) {
                    datesArray = data.data;
                } else if (Array.isArray(data.result)) {
                    datesArray = data.result;
                } else if (data.data && Array.isArray(data.data.value)) {
                    datesArray = data.data.value;
                } else if (data.data && data.data.value && Array.isArray(data.data.value.data)) {
                    datesArray = data.data.value.data;
                }
            }
            
            this.specialDates = datesArray || [];
        },
        setSpecialDateForSlug(slug: string, data: any) {
            if (slug && data) {
                this.specialDateBySlug[slug] = data;
            }
        },
        reset() {
            this.specialDates = []
            this.specialDateBySlug = {}
        }
    },
    getters: {
        getSpecialDates: (state) => state.specialDates,
        getActiveDates: (state) => {
            if (!Array.isArray(state.specialDates)) {
                return [];
            }
            
            return state.specialDates.filter((date: any) => date && date.active);
        },
        getSpecialDateBySlug: (state) => (slug: string) => {
            return state.specialDateBySlug[slug] || null;
        },
    }
})
