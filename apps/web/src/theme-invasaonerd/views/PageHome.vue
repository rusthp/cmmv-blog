<template>
    <div class="w-full max-w-[1200px] mx-auto">
        <!-- Loading State -->
        <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff3e3e]"></div>
            <span class="ml-3 text-gray-600">Carregando posts...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-16 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-2xl font-bold mb-2 text-gray-800">Erro ao carregar posts</h2>
            <p class="text-gray-600 mb-4">Não foi possível carregar os posts. Por favor, tente novamente.</p>
            <button @click="loadPosts" class="px-4 py-2 bg-[#ff3e3e] text-white rounded-md hover:bg-[#d12222] transition-colors">
                Tentar novamente
            </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="posts.length === 0" class="text-center py-16 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-2xl font-bold mb-2 text-gray-800">Nenhum post encontrado</h2>
            <p class="text-gray-600">Volte mais tarde para novos conteúdos!</p>
        </div>

        <div v-else>
            <!-- Cover Section with Featured Post -->
            <section v-if="featuredPost" class="mb-8">
                <div class="bg-white rounded-lg overflow-hidden shadow-md">
                    <a :href="`/post/${featuredPost.slug}`" class="block">
                        <div class="relative h-[400px]">
                            <OptimizedImage
                                v-if="featuredPost.featureImage"
                                :src="featuredPost.featureImage"
                                :alt="featuredPost.title"
                                class="w-full h-full object-cover imgix-lazy"
                                priority="high"
                                icon-size="lg"
                            />
                            <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="featuredPost.categories && featuredPost.categories.length > 0" class="mb-2">
                                    <span class="bg-[#ff3e3e] text-white px-3 py-1 rounded-md text-sm font-medium">
                                        {{ featuredPost.categories[0].name }}
                                    </span>
                                </div>
                                <h2 class="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ featuredPost.title }}</h2>
                                <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                    {{ featuredPost.excerpt || stripHtml(featuredPost.content).substring(0, 150) + '...' }}
                                </p>
                                <span class="inline-block bg-[#ff3e3e] hover:bg-[#d12222] text-white px-4 py-2 rounded-md transition-colors">
                                    Continuar lendo
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
            </section>

            <!-- Main Content Layout -->
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Posts Container -->
                <div class="flex-grow">
                    <!-- Latest News Section -->
                    <div class="mb-8">
                        <h2 class="text-xl font-bold mb-6 pb-2 text-[#1a1a1a] border-b-2 border-[#ff3e3e]">
                            Últimas Notícias
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <article
                                v-for="post in posts.slice(featuredPost ? 1 : 0, featuredPost ? 5 : 4)"
                                :key="post.id"
                                class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300"
                            >
                                <a :href="`/post/${post.slug}`" class="block">
                                    <div class="h-48 overflow-hidden relative">
                                        <OptimizedImage
                                            v-if="post.featureImage"
                                            :src="post.featureImage"
                                            :alt="post.title"
                                            class="w-full h-full object-cover transition-transform hover:scale-105 duration-300 imgix-lazy"
                                            :hover="true"
                                            icon-size="md"
                                        />
                                        <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div v-if="post.categories && post.categories.length > 0" class="absolute top-2 left-2">
                                            <span class="bg-[#ff3e3e] text-white px-2 py-1 rounded-md text-xs font-medium">
                                                {{ post.categories[0].name }}
                                            </span>
                                        </div>
                                    </div>
                                </a>
                                <div class="p-4">
                                    <a :href="`/post/${post.slug}`" class="block">
                                        <h3 class="text-lg font-bold text-gray-800 mb-2 hover:text-[#ff3e3e] transition-colors line-clamp-2">
                                            {{ post.title }}
                                        </h3>
                                    </a>
                                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                                        {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                    </p>
                                    <div class="flex justify-between items-center text-xs text-gray-500">
                                        <span v-if="getAuthor(post)">Por {{ getAuthor(post).name }}</span>
                                        <span>{{ formatDate(post.publishedAt) }}</span>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>

                    <!-- More Posts Section -->
                    <div v-if="posts.length > (featuredPost ? 5 : 4)">
                        <h2 class="text-xl font-bold mb-6 pb-2 text-[#1a1a1a] border-b-2 border-[#ff3e3e]">
                            Mais Conteúdo
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            <article
                                v-for="post in posts.slice(featuredPost ? 5 : 4)"
                                :key="post.id"
                                class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300"
                            >
                                <a :href="`/post/${post.slug}`" class="block">
                                    <div class="h-48 overflow-hidden relative">
                                        <OptimizedImage
                                            v-if="post.featureImage"
                                            :src="post.featureImage"
                                            :alt="post.title"
                                            class="w-full h-full object-cover transition-transform hover:scale-105 duration-300 imgix-lazy"
                                            :hover="true"
                                            icon-size="md"
                                        />
                                        <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div v-if="post.categories && post.categories.length > 0" class="absolute top-2 left-2">
                                            <span class="bg-[#ff3e3e] text-white px-2 py-1 rounded-md text-xs font-medium">
                                                {{ post.categories[0].name }}
                                            </span>
                                        </div>
                                    </div>
                                </a>
                                <div class="p-4">
                                    <a :href="`/post/${post.slug}`" class="block">
                                        <h3 class="text-lg font-bold text-gray-800 mb-2 hover:text-[#ff3e3e] transition-colors line-clamp-2">
                                            {{ post.title }}
                                        </h3>
                                    </a>
                                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                                        {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                    </p>
                                    <div class="flex justify-between items-center text-xs text-gray-500">
                                        <span v-if="getAuthor(post)">Por {{ getAuthor(post).name }}</span>
                                        <span>{{ formatDate(post.publishedAt) }}</span>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>

                    <!-- Loading More Indicator -->
                    <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff3e3e]"></div>
                        <span class="ml-3 text-gray-600">Carregando mais posts...</span>
                    </div>

                    <!-- Infinite Scroll Observer Target -->
                    <div ref="observerTarget" class="h-4 w-full"></div>
                </div>

                <!-- Sidebar -->
                <aside class="lg:w-80 shrink-0">
                    <!-- Popular Posts Widget -->
                    <div class="bg-white rounded-lg shadow-md p-5 mb-6">
                        <h2 class="text-xl font-bold mb-4 pb-2 text-[#1a1a1a] border-b-2 border-[#ff3e3e]">
                            Mais Populares
                        </h2>

                        <div class="space-y-4">
                            <div
                                v-for="post in popularPosts"
                                :key="post.id"
                                class="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                                <div class="w-20 h-16 flex-shrink-0 overflow-hidden rounded-md">
                                    <a :href="`/post/${post.slug}`">
                                        <OptimizedImage
                                            :src="post.featureImage || post.image || '/placeholder-image.jpg'"
                                            :alt="post.title"
                                            class="w-full h-full object-cover imgix-lazy"
                                            width="80"
                                            height="64"
                                            icon-size="sm"
                                        />
                                    </a>
                                </div>
                                <div class="flex-grow">
                                    <a :href="`/post/${post.slug}`" class="block">
                                        <h4 class="text-sm font-semibold text-gray-800 hover:text-[#ff3e3e] transition-colors line-clamp-2">
                                            {{ post.title }}
                                        </h4>
                                    </a>
                                    <span class="text-xs text-gray-500 mt-1 block">
                                        {{ formatDate(post.publishedAt || post.updatedAt) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Categories Widget -->
                    <div class="bg-white rounded-lg shadow-md p-5 mb-6">
                        <h2 class="text-xl font-bold mb-4 pb-2 text-[#1a1a1a] border-b-2 border-[#ff3e3e]">
                            Categorias
                        </h2>

                        <ul class="space-y-2">
                            <li v-for="category in categories" :key="category.id" class="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                <a
                                    :href="`/category/${category.slug}`"
                                    class="flex justify-between items-center text-gray-700 hover:text-[#ff3e3e] transition-colors"
                                >
                                    {{ category.name }}
                                    <span class="bg-[#ff3e3e] text-white px-2 py-1 rounded-full text-xs font-medium">
                                        {{ category.postCount }}
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
import { usePostsStore } from '../../store/posts';
import { useMostAccessedPostsStore } from '../../store/mostaccessed';
import OptimizedImage from '../../components/OptimizedImage.vue';
import { formatDate, stripHtml } from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();
const postsStore = usePostsStore();
const mostAccessedPostsStore = useMostAccessedPostsStore();
const blogAPI = vue3.useBlog();

// State
const settings = ref<any>(settingsStore.getSettings);
const categories = ref<any[]>(categoriesStore.getCategories || []);
const posts = ref<any[]>(postsStore.getPosts || []);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(null);
const popularPosts = ref<any[]>(mostAccessedPostsStore.getMostAccessedPosts || []);
const currentPage = ref(0);
const hasMorePosts = ref(true);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);
const currentCarouselIndex = ref(0);
const carouselInterval = ref<number | null>(null);

const coverSettings = computed(() => {
    try {
        const config = settings.value['blog.cover'];
        return config ? JSON.parse(config) : { layoutType: 'full' };
    } catch (err) {
        console.error('Error parsing cover settings:', err);
        return { layoutType: 'full' };
    }
});

const hasCoverConfig = computed(() => {
    return !!settings.value['blog.cover'] && Object.keys(coverSettings.value).length > 0;
});

const coverPosts = computed(() => {
    if (!posts.value.length) return {};

    const result: any = {
        full: posts.value[0],
        carousel: posts.value.slice(0, 3),
        splitMain: posts.value[0],
        splitSide: posts.value.slice(1, 3),
        dual: posts.value.slice(0, 2)
    };

    if (hasCoverConfig.value) {
        const config = coverSettings.value;
        const shouldRespectSelectedPosts = config.respectSelectedPosts !== false; // Default to true if missing

        if (shouldRespectSelectedPosts) {
            // Handle "full" layout
            if (config.layoutType === 'full' && config.fullCover?.postId) {
                const configPost = posts.value.find(p => p.id === config.fullCover.postId);
                if (configPost) result.full = configPost;
            }

            // Handle "carousel" layout
            if (config.layoutType === 'carousel' && Array.isArray(config.carousel)) {
                const carouselPostIds = config.carousel
                    .filter(item => item && item.postId)
                    .map(item => item.postId);

                if (carouselPostIds.length) {
                    const configPosts = carouselPostIds
                        .map((id: string) => posts.value.find(p => p.id === id))
                        .filter(Boolean);

                    if (configPosts.length) result.carousel = configPosts;
                }
            }

            // Handle "split" layout
            if (config.layoutType === 'split') {
                // Main post
                if (config.split?.main?.postId) {
                    const mainPost = posts.value.find(p => p.id === config.split.main.postId);
                    if (mainPost) result.splitMain = mainPost;
                }

                // Secondary posts
                if (Array.isArray(config.split?.secondary)) {
                    const secondaryPostIds = config.split.secondary
                        .filter(item => item && item.postId)
                        .map(item => item.postId);

                    if (secondaryPostIds.length) {
                        const secondaryPosts = secondaryPostIds
                            .map((id: string) => posts.value.find(p => p.id === id))
                            .filter(Boolean);

                        if (secondaryPosts.length) result.splitSide = secondaryPosts;
                    }
                }
            }

            // Handle "dual" layout
            if (config.layoutType === 'dual' && Array.isArray(config.dual)) {
                const dualPostIds = config.dual
                    .filter(item => item && item.postId)
                    .map(item => item.postId);

                if (dualPostIds.length) {
                    const configPosts = dualPostIds
                        .map((id: string) => posts.value.find(p => p.id === id))
                        .filter(Boolean);

                    if (configPosts.length) result.dual = configPosts;
                }
            }
        }
    }

    return result;
});

const startCarouselInterval = () => {
    if (coverSettings.value.type === 'carousel' && coverPosts.value.carousel?.length > 1) {
        carouselInterval.value = window.setInterval(() => {
            nextCarouselSlide();
        }, 5000);
    }
};

const stopCarouselInterval = () => {
    if (carouselInterval.value) {
        clearInterval(carouselInterval.value);
        carouselInterval.value = null;
    }
};

const nextCarouselSlide = () => {
    stopCarouselInterval();
    if (coverPosts.value.carousel?.length) {
        currentCarouselIndex.value = (currentCarouselIndex.value + 1) % coverPosts.value.carousel.length;
    }
    startCarouselInterval();
};

const prevCarouselSlide = () => {
    stopCarouselInterval();
    if (coverPosts.value.carousel?.length) {
        currentCarouselIndex.value = (currentCarouselIndex.value - 1 + coverPosts.value.carousel.length) % coverPosts.value.carousel.length;
    }
    startCarouselInterval();
};

const headData = ref({
    title: settings.value['blog.title'],
    meta: [
        { name: 'description', content: settings.value['blog.description'] },
        { name: 'keywords', content: settings.value['blog.keywords'] },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: settings.value['blog.title'] },
        { property: 'og:description', content: settings.value['blog.description'] },
        { property: 'og:image', content: settings.value['blog.logo'] }
    ],
    link: [
        { rel: 'canonical', href: settings.value['blog.url'] },
        { rel: 'alternate', href: `${settings.value['blog.url']}/feed`, type: 'application/rss+xml', title: settings.value['blog.title'] }
    ]
});

useHead(headData);

const pagination = ref({
    total: 0,
    limit: 12,
    offset: 0
});

const featuredPost = computed(() => {
    return posts.value.length > 0 ? posts.value[0] : null;
});

const reviewPosts = computed(() => {
    const reviewCategory = categories.value.find(cat =>
        cat.name.toLowerCase() === 'review' ||
        cat.name.toLowerCase() === 'reviews' ||
        cat.name.toLowerCase() === 'análise' ||
        cat.name.toLowerCase() === 'análises');

    if (reviewCategory) {
        return posts.value.filter(post =>
            post.categories &&
            post.categories.some(cat => cat.id === reviewCategory.id)
        ).slice(0, 2);
    } else {
        const middleIndex = Math.min(Math.floor(posts.value.length / 2), 5);
        return posts.value.slice(middleIndex, middleIndex + 2);
    }
});

const loadPosts = async () => {
    try {
        loading.value = true;
        error.value = null;

        const response: any = await blogAPI.posts.getAll(currentPage.value * pagination.value.limit);

        if (response) {
            posts.value = response.posts;

            pagination.value = {
                total: response.meta?.pagination?.total || 0,
                limit: response.meta?.pagination?.limit || 12,
                offset: response.meta?.pagination?.offset || 0
            };

            hasMorePosts.value = posts.value.length < response.count;

            if (!categories.value.length) {
                try {
                    const categoriesResponse = await blogAPI.categories.getAll();
                    if (categoriesResponse) {
                        categories.value = categoriesResponse;
                    }
                } catch (err) {
                    console.error('Failed to load categories:', err);
                }
            }
        }
    } catch (err: any) {
        console.error('Failed to load posts:', err);
        error.value = err;
    } finally {
        loading.value = false;
    }
};

const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value) return;

    try {
        loadingMore.value = true;
        currentPage.value++;

        const response: any = await blogAPI.posts.getAll(posts.value.length);

        if (response && response.posts && response.posts.length > 0) {
            posts.value = [...posts.value, ...response.posts];

            pagination.value = {
                total: response.meta?.pagination?.total || 0,
                limit: response.meta?.pagination?.limit || 12,
                offset: response.meta?.pagination?.offset || 0
            };

            hasMorePosts.value = posts.value.length < response.count;
        } else {
            hasMorePosts.value = false;
        }
    } catch (err: any) {
        console.error('Failed to load more posts:', err);
    } finally {
        loadingMore.value = false;
    }
};

const setupIntersectionObserver = () => {
    observer.value = new IntersectionObserver(
        (entries) => {
            const [entry] = entries;

            if (entry.isIntersecting && hasMorePosts.value && !loadingMore.value)
                loadMorePosts();
        },
        { threshold: 0.1 }
    );

    if (observerTarget.value) {
        observer.value.observe(observerTarget.value);
    }
};

const getAuthor = (post: any) => {
    if (!post.authors || !post.authors.length) return null;
    return post.authors.find((author: any) => author.id === post.author);
};

onMounted(async () => {
    await Promise.all([
        loadPosts()
    ]);
    setupIntersectionObserver();
    startCarouselInterval();
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }
    stopCarouselInterval();
});

watch(() => settings.value['blog.cover'], () => {
    stopCarouselInterval();
    startCarouselInterval();
}, { deep: true });
</script>

<style scoped>
/* Line clamp utility */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@media (max-width: 768px) {
    .featured-post {
        height: 300px;
    }
}

img {
    transition: opacity 0.2s ease-in-out;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>


