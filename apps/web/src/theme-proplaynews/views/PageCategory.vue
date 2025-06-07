<template>
    <div class="w-full relative bg-neutral-100">
        <div class="lg:max-w-7xl md:max-w-5xl mx-auto px-4 py-6">
            <div v-if="error || (!category && !loading)" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">{{ error || 'Categoria não encontrada' }}</h1>
                    <p class="text-neutral-600">A categoria que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else-if="category" class="bg-white rounded-lg p-6 overflow-hidden">
                <header class="border-b border-neutral-200 pb-6 mb-8 text-center">
                    <h1 class="text-4xl font-bold text-neutral-900 mb-3">{{ category?.name || 'Categoria' }}</h1>
                    <p v-if="category?.description" class="text-lg text-neutral-600 mb-4">{{ category.description }}</p>
                    <p class="text-sm text-neutral-500">{{ posts.length }} de {{ totalPosts }} posts</p>
                </header>

                <!-- Initial loading state -->
                <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff0030]"></div>
                </div>

                <!-- Posts Grid -->
                <div v-else-if="posts.length > 0">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <article v-for="post in posts" :key="post.id" class="post-card bg-white rounded-lg overflow-hidden">
                            <!-- Feature Image -->
                            <a :href="`/post/${post.slug}`" class="block overflow-hidden">
                                <div v-if="post.featureImage" class="aspect-video overflow-hidden">
                                    <img
                                        :src="post.featureImage"
                                        :alt="post.featureImageAlt || post.title"
                                        class="post-image w-full h-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        width="400"
                                        height="225"
                                    />
                                </div>
                                <div v-else class="aspect-video bg-neutral-200 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </a>

                            <div class="p-6">
                                <!-- Post Title -->
                                <h2 class="text-xl font-bold text-neutral-900 mb-3 line-clamp-2">
                                    <a :href="`/post/${post.slug}`" class="hover:text-[#ff0030] transition-colors">
                                        {{ post.title }}
                                    </a>
                                </h2>

                                <!-- Post Meta -->
                                <div class="flex items-center mb-3 text-sm text-neutral-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{{ formatDate(post.publishedAt || post.updatedAt) }}</span>
                                </div>

                                <!-- Post Excerpt -->
                                <div class="text-neutral-700 mb-4 line-clamp-3">
                                    <span v-if="post.excerpt">{{ post.excerpt }}</span>
                                    <span v-else-if="post.content">{{ getExcerpt(post.content) }}</span>
                                </div>

                                <!-- Read More Button -->
                                <a :href="`/post/${post.slug}`"
                                   class="inline-flex items-center text-[#ff0030] font-medium hover:text-[#cc0028] transition-colors">
                                    Ler mais
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </a>
                            </div>
                        </article>
                    </div>

                    <!-- Loading more indicator -->
                    <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff0030]"></div>
                        <span class="ml-3 text-neutral-600">Carregando mais posts...</span>
                    </div>

                    <!-- No more posts indicator -->
                    <div v-if="!hasMorePosts && posts.length > 0 && !loadingMore" class="mt-8 text-center py-4 text-neutral-500">
                        <p>Você viu todos os posts desta categoria!</p>
                    </div>

                    <!-- Intersection observer target -->
                    <div ref="observerTarget" class="h-4 w-full"></div>
                </div>

                <!-- No posts state -->
                <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
                    <h2 class="text-2xl font-bold mb-2 text-neutral-800">Nenhum post encontrado nesta categoria</h2>
                    <p class="text-neutral-600">Volte mais tarde para novos conteúdos!</p>
                </div>
            </div>

            <!-- Loading state for category -->
            <div v-else-if="loading" class="bg-white rounded-lg p-6">
                <div class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff0030]"></div>
                    <span class="ml-3 text-neutral-600">Carregando categoria...</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
//@ts-nocheck
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue'
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';

import {
    formatDate, stripHtml
} from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();
const blogAPI = vue3.useBlog();
const route = useRoute();

const isSSR = import.meta.env.SSR;
const posts = ref<any[]>([]);
const settings = ref<any>(settingsStore.getSettings);
const category = ref<any>(null);
const pagination = ref<any>(null);
const loading = ref(true);
const loadingMore = ref(false);
const hasMorePosts = ref(true);
const totalPosts = ref(0);
const error = ref<string | null>(null);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// Load initial data
const loadInitialData = async () => {
    try {
        loading.value = true;
        error.value = null;
        
        const routeParam = route.params.id || route.params.slug;
        if (!routeParam) {
            throw new Error('Parâmetro de categoria não encontrado na rota');
        }
        
        const data = route.params.id ?
            await blogAPI.categories.getById(route.params.id as string) :
            await blogAPI.categories.getBySlug(route.params.slug as string);

        if (!data || !data.category) {
            error.value = 'Categoria não encontrada';
            category.value = null;
            posts.value = [];
            totalPosts.value = 0;
            hasMorePosts.value = false;
            return;
        }

        category.value = data.category;
        posts.value = data.posts?.data || [];
        pagination.value = data.posts?.pagination;
        totalPosts.value = data.posts?.count || 0;

        hasMorePosts.value = posts.value.length < totalPosts.value;
        
        console.log(`Categoria '${category.value.name}' carregada com ${posts.value.length} posts`);
        
    } catch (err: any) {
        console.error('Failed to load category data:', {
            error: err,
            route: route.params,
            message: err.message
        });
        error.value = err.message || 'Erro ao carregar categoria';
        category.value = null;
        posts.value = [];
        totalPosts.value = 0;
        hasMorePosts.value = false;
    } finally {
        loading.value = false;
    }
};

const pageUrl = computed(() => {
    if (!category.value?.slug) {
        return `${import.meta.env.VITE_WEBSITE_URL}/category/`
    }
    return `${import.meta.env.VITE_WEBSITE_URL}/category/${category.value.slug}`
});

// Otimizar performance do stripHtml
const getExcerpt = (content: string) => {
    const cleanText = stripHtml(content);
    return cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText;
};

const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value) return;

    try {
        loadingMore.value = true;

        const response = route.params.id ?
            await blogAPI.categories.getById(route.params.id as string, posts.value.length) :
            await blogAPI.categories.getBySlug(route.params.slug as string, posts.value.length);

        if (response && response.posts && response.posts.data && response.posts.data.length > 0) {
            posts.value = [...posts.value, ...response.posts.data];
            hasMorePosts.value = posts.value.length < totalPosts.value;
        } else {
            hasMorePosts.value = false;
        }
    } catch (err) {
        console.error('Failed to load more posts:', err);
    } finally {
        loadingMore.value = false;
    }
};

const setupIntersectionObserver = () => {
    if (isSSR || typeof window === 'undefined') return;
    
    observer.value = new IntersectionObserver(
        (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMorePosts.value && !loadingMore.value) {
                loadMorePosts();
            }
        },
        { threshold: 0.1 }
    );

    if (observerTarget.value) {
        observer.value.observe(observerTarget.value);
    }
};

// Setup SEO head data reativo
const headData = computed(() => {
    const blogTitle = settings.value?.['blog.title'] || 'Blog';
    const blogDescription = settings.value?.['blog.description'] || '';
    const blogKeywords = settings.value?.['blog.keywords'] || '';
    const blogLogo = settings.value?.['blog.logo'] || '';
    const blogUrl = settings.value?.['blog.url'] || '';

    if (!category.value?.name) {
        return {
            title: `Categoria - ${blogTitle}`,
            meta: [
                { name: 'description', content: blogDescription },
                { name: 'keywords', content: blogKeywords }
            ]
        };
    }

    const categoryTitle = `${category.value.name} - ${blogTitle}`;
    const categoryDescription = category.value.description || blogDescription;

    return {
        title: categoryTitle,
        meta: [
            { name: 'description', content: categoryDescription },
            { name: 'keywords', content: blogKeywords },
            { property: 'og:type', content: 'website' },
            { property: 'og:title', content: categoryTitle },
            { property: 'og:description', content: categoryDescription },
            { property: 'og:image', content: blogLogo },
            { property: 'og:url', content: pageUrl.value }
        ],
        link: [
            { rel: 'canonical', href: pageUrl.value },
            { rel: 'alternate', href: `${blogUrl}/feed`, type: 'application/rss+xml', title: blogTitle }
        ]
    };
});

useHead(headData);

// Watch para recarregar quando a rota mudar
watch(() => route.params, async (newParams, oldParams) => {
    if (newParams.slug !== oldParams?.slug || newParams.id !== oldParams?.id) {
        await loadInitialData();
        setupIntersectionObserver();
    }
}, { deep: true });

onMounted(async () => {
    await loadInitialData();
    setupIntersectionObserver();
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }
});
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
