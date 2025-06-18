import { defineStore } from 'pinia'

export const usePostsStore = defineStore('posts', {
    state: () => ({
        data: null as any,
    }),
    actions: {
        setPosts(data: any) {
            this.data = data
        },
    },
    getters: {
        getPosts: (state) => state.data,
    },
})
