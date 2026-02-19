<template>
    <div class="w-full relative min-h-screen" style="background: transparent;">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div v-if="!category" class="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-white mb-4">Categoria não encontrada</h1>
                    <p class="text-gray-300">A categoria que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else class="article-container overflow-hidden">
                <header class="text-center mb-8">
                    <!-- Category Badge -->
                    <div class="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold px-6 py-2 rounded-full uppercase tracking-wide mb-4 shadow-lg">
                        {{ category.name }}
                    </div>
                    <div class="text-sm text-gray-300">{{ category.postCount }} posts nesta categoria</div>
                </header>

                <!-- Initial loading state -->
                <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                </div>

                <!-- Posts Grid -->
                <div v-else-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <article v-for="post in posts" :key="post.id" class="bg-gradient-to-br from-white to-purple-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:shadow-purple-200 transition-all duration-300 hover:transform hover:scale-105 border border-purple-100">
                        <!-- Feature Image -->
                        <a :href="`/post/${post.slug}`" class="block relative" aria-label="Ler mais sobre este post">
                            <div v-if="post.featureImage" class="relative bg-gray-100 rounded-t-lg overflow-hidden" style="min-height: 200px;">
                                <img
                                    :src="post.featureImage"
                                    :alt="post.featureImageAlt || post.title"
                                    class="w-full h-auto object-contain transition-transform duration-300 hover:scale-105"
                                    loading="lazy"
                                    style="max-height: 250px; min-height: 200px;"
                                />
                                <!-- Category Badge -->
                                <div class="absolute top-3 left-3">
                                    <span class="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                                        {{ (post.categories && post.categories.length > 0) ? post.categories[0].name : category.name }}
                                    </span>
                                </div>
                            </div>
                        </a>

                        <!-- Post Content -->
                        <div class="p-4">
                            <!-- Post Title -->
                            <h2 class="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                                <a :href="`/post/${post.slug}`" class="hover:text-purple-600 transition-colors" aria-label="Ler mais sobre este post">
                                    {{ post.title }}
                                </a>
                            </h2>

                            <!-- Post Excerpt -->
                            <div v-if="post.excerpt" class="text-gray-600 mb-4 text-sm leading-relaxed break-words pt-2">
                                {{ post.excerpt.length > 150 ? post.excerpt.substring(0, 150) + '...' : post.excerpt }}
                            </div>
                            <div v-else-if="post.content" class="text-gray-600 mb-4 text-sm leading-relaxed break-words pt-2">
                                {{ stripHtml(post.content).length > 150 ? stripHtml(post.content).substring(0, 150) + '...' : stripHtml(post.content) }}
                            </div>

                            <!-- Post Meta -->
                            <div class="flex items-center justify-between text-xs text-purple-500 mb-4">
                                <div class="flex items-center">
                                    <span>Por</span>
                                    <span class="ml-1 font-medium">{{ formatDate(post.publishedAt || post.updatedAt) }}</span>
                                </div>
                            </div>

                            <!-- Read More Button -->
                            <div class="mt-auto">
                                <a :href="`/post/${post.slug}`"
                                class="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg">
                                    Continuar lendo
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </article>
                </div>

                <!-- No posts state -->
                <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
                    <h2 class="text-2xl font-bold mb-2 text-purple-800">Nenhum post encontrado nesta categoria</h2>
                    <p class="text-purple-600">Volte mais tarde para novos conteúdos!</p>
                </div>

                <!-- Loading more indicator -->
                <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                </div>

                <!-- No more posts indicator -->
                <div v-if="!hasMorePosts && posts.length > 0 && !loadingMore" class="mt-8 text-center py-4 text-neutral-500">

                </div>

                <!-- Intersection observer target -->
                <div ref="observerTarget" class="h-4 w-full"></div>
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


import {
    formatDate, stripHtml
} from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const blogAPI = vue3.useBlog();
const route = useRoute();

const isSSR = import.meta.env.SSR
const posts = ref<any[]>([]);
const settings = ref<any>(settingsStore.getSettings);
const category = ref<any>(null);
const pagination = ref<any>(null);
const loading = ref(true);
const loadingMore = ref(false);
const hasMorePosts = ref(true);
const currentPage = ref(0);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

loading.value = true;

const data = ref<any>(route.params.id ?
    await blogAPI.categories.getById(route.params.id as string) :
    await blogAPI.categories.getBySlug(route.params.slug as string));

category.value = data.value.category;
posts.value = data.value.posts?.data || [];
pagination.value = data.value.posts?.pagination;

hasMorePosts.value = posts.value.length < (data.value.posts?.count || 0);

const pageUrl = computed(() => {
    return `${import.meta.env.VITE_WEBSITE_URL}/category/${category.value?.slug || ''}`
})

const headData = ref({
    title: category.value.name + ' - ' + settings.value['blog.title'],
    meta: [
        { name: 'description', content: category.value.description },
        { name: 'keywords', content: settings.value['blog.keywords'] },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: category.value.name + ' - ' + settings.value['blog.title'] },
        { property: 'og:description', content: category.value.description },
        { property: 'og:image', content: settings.value['blog.logo'] },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '675' },
        { property: 'og:image:type', content: 'image/webp' },
        { property: 'og:image:alt', content: category.value.name },
        { property: 'og:url', content: pageUrl.value }
    ],
    link: [
        { rel: 'canonical', href: pageUrl.value }
    ]
})

useHead(headData);

const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value) return;

    try {
        loadingMore.value = true;
        currentPage.value++;

        const response = route.params.id ?
            await blogAPI.categories.getById(route.params.id as string, posts.value.length) :
            await blogAPI.categories.getBySlug(route.params.slug as string, posts.value.length);

        if (response && response.posts && response.posts.data && response.posts.data.length > 0) {
            posts.value = [...posts.value, ...response.posts.data];
            hasMorePosts.value = posts.value.length < (response.posts.count || 0);
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

onMounted(async () => {
    loading.value = false;
    setupIntersectionObserver();
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }
});
</script>
