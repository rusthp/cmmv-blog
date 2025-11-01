<template>
    <div class="w-full relative bg-neutral-100">
        <div class="lg:max-w-4xl md:max-w-3xl mx-auto">
            <div v-if="!data.tag" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Tag não encontrada</h1>
                    <p class="text-neutral-600">A tag que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else class="bg-white rounded-lg p-6 article-container overflow-hidden">
                <header class="border-b border-neutral-200 pb-4 mb-6 pr-4 pt-4">
                    <h1 class="text-3xl font-bold text-neutral-900 mb-3">Tag: {{ data.tag.name }}</h1>
                    <p v-if="data.tag.description" class="text-neutral-600 mb-4">{{ data.tag.description }}</p>
                    <div class="text-sm text-neutral-500">{{ data.tag.postCount }} posts com esta tag</div>
                </header>

                <!-- Initial loading state -->
                <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                </div>

                <!-- Posts List -->
                <div v-else-if="posts.length > 0"
                    class="space-y-10 post-content prose prose-sm sm:prose prose-neutral max-w-none">
                    <article v-for="post in posts" :key="post.id"
                        class="border-b border-neutral-200 pb-8 last:border-0">
                        <!-- Feature Image -->
                        <a :href="`/post/${post.slug}`" class="block mb-4" aria-label="Ler mais sobre este post">
                                                          <div v-if="post.featureImage" class="relative bg-gray-100 overflow-hidden rounded-lg" style="min-height: 200px;">
                                <OptimizedImage :src="post.featureImage" :alt="post.featureImageAlt || post.title"
                                    class="w-full h-auto object-contain imgix-lazy" :hover="true" icon-size="lg" style="max-height: 250px; min-height: 200px;" />
                            </div>
                        </a>

                        <!-- Post Title -->
                        <h2 class="text-2xl font-bold text-neutral-900 mb-4 pb-3 border-b border-gray-200">
                            <a :href="`/post/${post.slug}`" class="hover:text-purple-600 transition-colors"
                                aria-label="Ler mais sobre este post">
                                {{ post.title }}
                            </a>
                        </h2>

                        <!-- Post Meta -->
                        <div class="flex items-center mb-4 text-sm text-neutral-600 pt-2">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{{ formatDate(post.publishedAt || post.updatedAt) }}</span>
                            </div>
                        </div>

                        <!-- Post Excerpt -->
                        <div v-if="post.excerpt" class="text-neutral-700 mb-4">
                            {{ post.excerpt.length > 200 ? post.excerpt.substring(0, 200) + '...' : post.excerpt }}
                        </div>
                        <div v-else-if="post.content" class="text-neutral-700 mb-4">
                            {{ stripHtml(post.content).substring(0, 200) }}{{ stripHtml(post.content).length > 200 ?
                            '...' : '' }}
                        </div>

                        <!-- Tags -->
                        <div v-if="post.tags && post.tags.length > 0" class="mb-4 flex flex-wrap gap-2">
                            <a v-for="tag in post.tags" :key="tag" :href="`/tag/${tag.slug}`"
                                class="bg-[#ffcc00] text-[#333333] text-sm px-3 py-1 rounded-full hover:bg-[#ffa500] font-medium shadow-sm transition-all duration-200 hover:shadow-md">
                                {{ tag.name }}
                            </a>
                        </div>

                        <!-- Read More Button -->
                        <div class="mt-4">
                            <a :href="`/post/${post.slug}`"
                                class="inline-flex items-center text-purple-600 font-medium hover:text-purple-700 transition-colors">
                                Ler mais
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                        clip-rule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </article>
                </div>

                <!-- No posts state -->
                <div v-else-if="!loading && posts.length === 0" class="text-center py-16">
                    <h2 class="text-2xl font-bold mb-2 text-neutral-800">Nenhum post encontrado com esta tag</h2>
                    <p class="text-neutral-600">Volte mais tarde para novos conteúdos!</p>
                </div>

                <!-- Loading more indicator -->
                <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                </div>

                <!-- Intersection observer target -->
                <div ref="observerTarget" class="h-4 w-full"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import OptimizedImage from '../../components/OptimizedImage.vue';
import { useSettingsStore } from '../../store/settings';

import {
    formatDate, stripHtml
} from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const blogAPI = vue3.useBlog();
const route = useRoute();

const data = ref<any>(await blogAPI.tags.getPostsBySlug(route.params.slug as string));
const posts = ref<any[]>(data.value.posts || []);
const settings = ref<any>(settingsStore.getSettings);
const loading = ref(false);
const loadingMore = ref(false);
const hasMorePosts = ref(true);
const currentPage = ref(0);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

const pageUrl = computed(() => {
    // @ts-ignore
    return `${import.meta.env.VITE_WEBSITE_URL}/tag/${data.value?.tag?.slug || ''}`
})

const headData = ref({
    title: data.value?.tag?.name + ' - ' + settings.value['blog.title'],
    meta: [
        { name: 'description', content: data.value?.tag?.description },
        { name: 'keywords', content: settings.value['blog.keywords'] },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: data.value?.tag?.name + ' - ' + settings.value['blog.title'] },
        { property: 'og:description', content: data.value?.tag?.description },
        { property: 'og:image', content: settings.value['blog.logo'] },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '675' },
        { property: 'og:image:type', content: 'image/webp' },
        { property: 'og:image:alt', content: data.value?.tag?.name },
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

        const response = await blogAPI.tags.getPostsBySlug(route.params.slug as string, posts.value.length);

        if (response && response.posts && response.posts.length > 0) {
            posts.value = [...posts.value, ...response.posts];
            hasMorePosts.value = posts.value.length < (response.total || 0);
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

<style scoped>
.article-container {
    max-width: 48rem;
    margin: 0 auto;
}

.post-content :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
}

.post-content :deep(iframe) {
    max-width: 100%;
    border-radius: 4px;
    margin: 1rem 0;
}

.post-content :deep(table) {
    max-width: 100%;
    overflow-x: auto;
    display: block;
    border-collapse: collapse;
    margin: 1rem 0;
}

.post-content :deep(table td),
.post-content :deep(table th) {
    border: 1px solid #e5e5e5;
    padding: 0.5rem;
}

.post-content :deep(pre) {
    max-width: 100%;
    overflow-x: auto;
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.post-content :deep(code) {
    white-space: pre-wrap;
    word-break: break-word;
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9em;
}

.post-content :deep(blockquote) {
                    border-left: 4px solid #ffcc00;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #666;
}

.post-content :deep(h2),
.post-content :deep(h3),
.post-content :deep(h4),
.post-content :deep(h5),
.post-content :deep(h6) {
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.post-content :deep(p) {
    margin-bottom: 1rem;
    line-height: 1.7;
}

.post-content :deep(ul),
.post-content :deep(ol) {
    margin: 1rem 0;
    padding-left: 2rem;
}

.post-content :deep(li) {
    margin-bottom: 0.5rem;
}

.post-content :deep(a) {
                    color: #333333;
    text-decoration: underline;
}

.post-content :deep(a:hover) {
    color: #064019;
}
</style>
