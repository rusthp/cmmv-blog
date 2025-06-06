<template>
    <div class="w-full relative bg-neutral-100">
        <div class="lg:max-w-7xl md:max-w-5xl mx-auto px-4 py-6">
            <div v-if="!category" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Categoria não encontrada</h1>
                    <p class="text-neutral-600">A categoria que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else class="bg-white rounded-lg p-6 overflow-hidden">
                <header class="border-b border-neutral-200 pb-6 mb-8 text-center">
                    <h1 class="text-4xl font-bold text-neutral-900 mb-3">{{ category.name }}</h1>
                    <p v-if="category.description" class="text-lg text-neutral-600 mb-4">{{ category.description }}</p>
                    <p class="text-sm text-neutral-500">{{ totalPosts }} {{ totalPosts === 1 ? 'post encontrado' : 'posts encontrados' }}</p>
                </header>

                <!-- Loading state -->
                <div v-if="loading" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0a5d28]"></div>
                </div>

                <!-- Posts Grid -->
                <div v-else-if="posts.length > 0">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <article v-for="post in posts" :key="post.id" class="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-[#0a5d28]">
                            <!-- Feature Image -->
                            <a :href="`/post/${post.slug}`" class="block overflow-hidden">
                                <div v-if="post.featureImage" class="aspect-video overflow-hidden">
                                    <img 
                                        :src="post.featureImage" 
                                        :alt="post.featureImageAlt || post.title" 
                                        class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                </div>
                                <div v-else class="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </a>

                            <!-- Post Content -->
                            <div class="p-4">
                                <!-- Category Badge -->
                                <div v-if="(post.categories && post.categories.length > 0) || category" class="mb-3">
                                    <span class="bg-[#ffcc00] text-[#333333] px-3 py-1 rounded-full text-xs font-semibold">
                                        {{ post.categories?.[0]?.name || category?.name || 'Sem categoria' }}
                                    </span>
                                </div>
                                <!-- Post Title -->
                                <h2 class="text-lg font-bold text-neutral-900 mb-2 line-clamp-2 hover:text-[#0a5d28] transition-colors">
                                    <a :href="`/post/${post.slug}`" class="hover:text-[#0a5d28] transition-colors">
                                        {{ post.title }}
                                    </a>
                                </h2>

                                <!-- Post Excerpt -->
                                <div class="text-sm text-neutral-600 mb-3 line-clamp-3">
                                    <span v-if="post.excerpt">{{ post.excerpt }}</span>
                                    <span v-else-if="post.content">{{ stripHtml(post.content).substring(0, 120) }}{{ stripHtml(post.content).length > 120 ? '...' : '' }}</span>
                                </div>

                                <!-- Post Meta -->
                                <div class="flex items-center justify-between text-xs text-neutral-500 mb-3">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{{ formatDate(post.publishedAt || post.updatedAt) }}</span>
                                    </div>
                                    <div v-if="post.readingTime" class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{{ post.readingTime }} min</span>
                                    </div>
                                </div>

                                <!-- Tags -->
                                <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
                                    <a v-for="tag in post.tags.slice(0, 3)" :key="tag.id" :href="`/tag/${tag.slug}`"
                                    class="bg-neutral-100 text-neutral-600 text-xs px-2 py-1 rounded hover:bg-neutral-200 transition-colors">
                                        {{ tag.name }}
                                    </a>
                                    <span v-if="post.tags.length > 3" class="text-xs text-neutral-400">
                                        +{{ post.tags.length - 3 }}
                                    </span>
                                </div>

                                <!-- Read More Button -->
                                <div class="pt-2 border-t border-neutral-100">
                                    <a :href="`/post/${post.slug}`"
                                    class="inline-flex items-center text-sm text-[#0a5d28] font-medium hover:text-[#064019] transition-colors">
                                        Ler mais
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </article>
                    </div>

                    <!-- Pagination -->
                    <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2 py-8">
                        <!-- Previous Button -->
                        <button 
                            @click="goToPage(currentPage - 1)"
                            :disabled="currentPage <= 1"
                            :class="[
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                currentPage <= 1 
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                            ]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <!-- Page Numbers -->
                        <template v-for="page in getVisiblePages()" :key="page">
                            <button 
                                v-if="page !== '...'"
                                @click="goToPage(page)"
                                :class="[
                                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    currentPage === page 
                                        ? 'bg-[#0a5d28] text-white' 
                                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                                ]"
                            >
                                {{ page }}
                            </button>
                            <span v-else class="px-2 py-2 text-neutral-400">...</span>
                        </template>

                        <!-- Next Button -->
                        <button 
                            @click="goToPage(currentPage + 1)"
                            :disabled="currentPage >= totalPages"
                            :class="[
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                currentPage >= totalPages 
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                            ]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <!-- Page Info -->
                    <div class="text-center text-sm text-neutral-500 pb-4">
                        Página {{ currentPage }} de {{ totalPages }} 
                        ({{ ((currentPage - 1) * postsPerPage) + 1 }}-{{ Math.min(currentPage * postsPerPage, totalPosts) }} de {{ totalPosts }} posts)
                    </div>
                </div>

                <!-- No posts state -->
                <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
                    <div class="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold mb-2 text-neutral-800">Nenhum post encontrado nesta categoria</h2>
                    <p class="text-neutral-600">Volte mais tarde para novos conteúdos!</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue'
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';

import {
    formatDate, stripHtml
} from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const blogAPI = vue3.useBlog();
const route = useRoute();
const router = useRouter();

const posts = ref<any[]>([]);
const settings = ref<any>(settingsStore.getSettings);
const category = ref<any>(null);
const loading = ref(true);
const currentPage = ref(1);
const postsPerPage = 15;
const totalPosts = ref(0);

// Computed values
const totalPages = computed(() => Math.ceil(totalPosts.value / postsPerPage));

const pageUrl = computed(() => {
    return `${import.meta.env.VITE_WEBSITE_URL}/category/${category.value?.slug || ''}`
})

// Load posts function
const loadPosts = async (page = 1) => {
    try {
        loading.value = true;
        
        const offset = (page - 1) * postsPerPage;
        
        const response = route.params.id ?
            await blogAPI.categories.getById(route.params.id as string, offset, postsPerPage) :
            await blogAPI.categories.getBySlug(route.params.slug as string, offset, postsPerPage);

        if (response) {
            category.value = response.category;
            posts.value = response.posts?.data || [];
            totalPosts.value = response.posts?.count || 0;
            
            // Debug: verificar estrutura dos posts
            console.log('Posts carregados:', posts.value);
            if (posts.value.length > 0) {
                console.log('Primeiro post:', posts.value[0]);
                console.log('Categorias do primeiro post:', posts.value[0]?.categories);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        posts.value = [];
        totalPosts.value = 0;
    } finally {
        loading.value = false;
    }
};

// Pagination functions
const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value || page === currentPage.value) return;
    
    currentPage.value = page;
    
    // Update URL with page parameter
    const query = { ...route.query };
    if (page === 1) {
        delete query.page;
    } else {
        query.page = page.toString();
    }
    
    router.push({ 
        path: route.path, 
        query: Object.keys(query).length > 0 ? query : undefined 
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    loadPosts(page);
};

const getVisiblePages = () => {
    const pages = [];
    const total = totalPages.value;
    const current = currentPage.value;
    
    if (total <= 7) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);
        
        if (current <= 4) {
            // Show 1, 2, 3, 4, 5, ..., last
            for (let i = 2; i <= 5; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(total);
        } else if (current >= total - 3) {
            // Show 1, ..., last-4, last-3, last-2, last-1, last
            pages.push('...');
            for (let i = total - 4; i <= total; i++) {
                pages.push(i);
            }
        } else {
            // Show 1, ..., current-1, current, current+1, ..., last
            pages.push('...');
            for (let i = current - 1; i <= current + 1; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(total);
        }
    }
    
    return pages;
};

// Initialize page from URL query parameter
const initializePage = () => {
    const pageParam = route.query.page;
    const page = pageParam ? parseInt(pageParam as string) : 1;
    currentPage.value = Math.max(1, page);
};

// Watch for route changes
watch(() => route.query.page, (newPage) => {
    const page = newPage ? parseInt(newPage as string) : 1;
    if (page !== currentPage.value) {
        currentPage.value = Math.max(1, page);
        loadPosts(currentPage.value);
    }
});

// SEO Head data
const headData = computed(() => ({
    title: `${category.value?.name || 'Categoria'} - Página ${currentPage.value} - ${settings.value['blog.title']}`,
    meta: [
        { name: 'description', content: category.value?.description || `Posts da categoria ${category.value?.name}` },
        { name: 'keywords', content: settings.value['blog.keywords'] },
        { name: 'robots', content: currentPage.value > 1 ? 'noindex, follow' : 'index, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `${category.value?.name} - ${settings.value['blog.title']}` },
        { property: 'og:description', content: category.value?.description || `Posts da categoria ${category.value?.name}` },
        { property: 'og:image', content: settings.value['blog.logo'] },
        { property: 'og:url', content: pageUrl.value }
    ],
    link: [
        { rel: 'canonical', href: pageUrl.value },
        { rel: 'alternate', href: `${settings.value['blog.url']}/feed`, type: 'application/rss+xml', title: settings.value['blog.title'] },
        ...(currentPage.value > 1 ? [{ rel: 'prev', href: `${pageUrl.value}?page=${currentPage.value - 1}` }] : []),
        ...(currentPage.value < totalPages.value ? [{ rel: 'next', href: `${pageUrl.value}?page=${currentPage.value + 1}` }] : [])
    ]
}));

useHead(headData);

// Initialize
initializePage();
loadPosts(currentPage.value);
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Smooth transitions for grid items */
.grid > article {
    transition: all 0.3s ease;
}

.grid > article:hover {
    transform: translateY(-2px);
}

/* Pagination button effects */
button {
    transition: all 0.2s ease;
}

button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

button:active:not(:disabled) {
    transform: translateY(0);
}

/* Custom scrollbar for mobile */
@media (max-width: 768px) {
    .grid {
        gap: 1rem;
    }
}

/* Loading animation improvement */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
