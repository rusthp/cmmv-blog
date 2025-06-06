import { defineStore } from 'pinia'

export const usePostsStore = defineStore('posts', {
    state: () => ({
        data: null as any,
    }),
    actions: {
        setPosts(data: any) {
            this.data = data
        },
        addPosts(newPosts: any[]) {
            if (!this.data) {
                this.data = newPosts
                return
            }
            
            // Filtrar para adicionar apenas posts únicos
            const uniqueNewPosts = newPosts.filter(newPost => 
                !this.data.some((existingPost: any) => existingPost.id === newPost.id)
            )
            
            if (uniqueNewPosts.length > 0) {
                this.data = [...this.data, ...uniqueNewPosts]
            }
        }
    },
    getters: {
        getPosts: (state) => state.data,
    },
})
