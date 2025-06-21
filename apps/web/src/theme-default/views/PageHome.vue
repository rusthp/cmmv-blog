<template>
    <div class="lg:ml-64 w-full relative px-4">
        <!-- Cover Section -->
        <div class="mx-auto px-4 py-8 pb-0 hidden md:hidden lg:block">
            <div class="bg-white dark:bg-neutral-900 rounded-lg max-w-[1200px] m-auto overflow-hidden shadow-lg">
                <div v-if="coverType === 'full' && coverPost" class="relative aspect-[21/9] overflow-hidden">
                    <img
                        v-if="coverPost.featureImage"
                        :src="coverPost.featureImage"
                        :alt="coverPost.title"
                        class="w-full h-full object-cover !hidden"
                        loading="lazy"
                        width="890"
                        height="606"
                        :title="coverPost.title"
                        aria-label="Cover Image"
                        fetchpriority="high"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div v-if="coverPost.categories && coverPost.categories.length > 0" class="mb-2">
                            <a
                                :href="`/category/${coverPost.categories[0].slug}`"
                                class="px-3 py-1 bg-blue-600 bg-opacity-85 text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                            >
                                {{ coverPost.categories[0].name }}
                            </a>
                        </div>
                        <a :href="`/post/${coverPost.slug}`" class="block">
                            <h2 class="text-2xl md:text-4xl font-bold mb-2 hover:text-blue-400 transition-colors">{{ coverPost.title }}</h2>
                            <p class="text-gray-200 line-clamp-2 md:max-w-3xl">{{ coverPost.excerpt || stripHtml(coverPost.content).substring(0, 200) + '...' }}</p>
                        </a>
                        <div class="mt-4 flex items-center text-sm text-gray-300">
                            <span v-if="getAuthor(coverPost)" class="mr-4">By {{ getAuthor(coverPost).name }}</span>
                            <span>{{ formatDate(coverPost.publishedAt) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Carousel layout -->
                <div v-else-if="coverType === 'carousel' && carouselPosts.length > 0" class="relative aspect-[21/9] overflow-hidden">
                    <div v-for="(post, index) in carouselPosts" :key="post.id" v-show="carouselIndex === index" class="absolute inset-0">
                        <img
                            v-if="post.featureImage"
                            :src="post.featureImage"
                            :alt="post.title"
                            class="w-full h-full object-cover"
                            loading="lazy"
                            width="890"
                            height="606"
                            :title="post.title"
                            aria-label="Cover Image"
                            fetchpriority="high"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                <a
                                    :href="`/category/${post.categories[0].slug}`"
                                    class="px-3 py-1 bg-blue-600 bg-opacity-85 text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                                >
                                    {{ post.categories[0].name }}
                                </a>
                            </div>
                            <a :href="`/post/${post.slug}`" class="block">
                                <h2 class="text-2xl md:text-4xl font-bold mb-2 hover:text-blue-400 transition-colors">{{ post.title }}</h2>
                                <p class="text-gray-200 line-clamp-2 md:max-w-3xl">{{ post.excerpt || stripHtml(post.content).substring(0, 200) + '...' }}</p>
                            </a>
                            <div class="mt-4 flex items-center text-sm text-gray-300">
                                <span v-if="getAuthor(post)" class="mr-4">By {{ getAuthor(post).name }}</span>
                                <span>{{ formatDate(post.publishedAt) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Carousel Controls -->
                    <div class="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-30">
                        <button
                            v-for="(_, index) in carouselPosts"
                            :key="index"
                            @click="carouselIndex = index"
                            class="w-3 h-3 rounded-full transition-colors"
                            :class="carouselIndex === index ? 'bg-blue-500' : 'bg-gray-400 bg-opacity-50'"
                            aria-label="Carousel Indicator"
                        ></button>
                    </div>

                    <!-- Carousel Navigation Arrows -->
                    <button
                        @click="prevSlide"
                        class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-30 hover:bg-black/70"
                        aria-label="Previous Slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        @click="nextSlide"
                        class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-30 hover:bg-black/70"
                        aria-label="Next Slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <!-- Split layout -->
                <div v-else-if="coverType === 'split' && splitMainPost && splitSecondaryPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px]">
                    <div class="relative overflow-hidden h-[400px]">
                        <img
                            v-if="splitMainPost.featureImage"
                            :src="splitMainPost.featureImage"
                            :alt="splitMainPost.title"
                            class="w-full h-full object-cover"
                            loading="lazy"
                            width="890"
                            height="606"
                            :title="splitMainPost.title"
                            aria-label="Cover Image"
                            fetchpriority="high"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div v-if="splitMainPost.categories && splitMainPost.categories.length > 0" class="mb-2">
                                <a
                                    :href="`/category/${splitMainPost.categories[0].slug}`"
                                    class="px-2 py-1 bg-blue-600 bg-opacity-85 text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                                >
                                    {{ splitMainPost.categories[0].name }}
                                </a>
                            </div>
                            <a :href="`/post/${splitMainPost.slug}`" class="block">
                                <h2 class="text-xl md:text-2xl font-bold mb-1 hover:text-blue-400 transition-colors line-clamp-2">{{ splitMainPost.title }}</h2>
                                <p class="text-gray-200 text-sm line-clamp-2">{{ splitMainPost.excerpt || stripHtml(splitMainPost.content).substring(0, 120) + '...' }}</p>
                            </a>
                        </div>
                    </div>

                    <div class="grid grid-rows-2 gap-2 h-[400px]">
                        <div v-for="(post, index) in splitSecondaryPosts.slice(0, 2)" :key="post.id" class="relative overflow-hidden">
                            <img
                                v-if="post.featureImage"
                                :src="post.featureImage"
                                :alt="post.title"
                                class="w-full h-full object-cover"
                                loading="lazy"
                                width="890"
                                height="606"
                                :title="post.title"
                                aria-label="Cover Image"
                                fetchpriority="high"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 right-0 p-3 text-white">
                                <div v-if="post.categories && post.categories.length > 0" class="mb-1">
                                    <a
                                        :href="`/category/${post.categories[0].slug}`"
                                        class="px-2 py-0.5 bg-blue-600 bg-opacity-85 text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                                    >
                                        {{ post.categories[0].name }}
                                    </a>
                                </div>
                                <a :href="`/post/${post.slug}`" class="block">
                                    <h2 class="text-base font-bold hover:text-blue-400 transition-colors line-clamp-2">{{ post.title }}</h2>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dual layout -->
                <div v-else-if="coverType === 'dual' && dualPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px]">
                    <div v-for="(post, index) in dualPosts.slice(0, 2)" :key="post.id" class="relative overflow-hidden h-full">
                        <img
                            v-if="post.featureImage"
                            :src="post.featureImage"
                            :alt="post.title"
                            class="w-full h-full object-cover"
                            loading="lazy"
                            width="890"
                            height="606"
                            :title="post.title"
                            aria-label="Cover Image"
                            fetchpriority="high"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                <a
                                    :href="`/category/${post.categories[0].slug}`"
                                    class="px-2 py-1 bg-blue-600 bg-opacity-85 text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                                >
                                    {{ post.categories[0].name }}
                                </a>
                            </div>
                            <a :href="`/post/${post.slug}`" class="block">
                                <h2 class="text-xl font-bold mb-1 hover:text-blue-400 transition-colors line-clamp-2">{{ post.title }}</h2>
                                <p class="text-gray-200 text-sm line-clamp-2">{{ post.excerpt || stripHtml(post.content).substring(0, 100) + '...' }}</p>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Default fallback if no configuration -->
                <div v-else-if="posts.length > 0" class="relative aspect-[21/9] overflow-hidden">
                    <img
                        v-if="posts[0].featureImage"
                        :src="posts[0].featureImage"
                        :alt="posts[0].title"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        width="890"
                        height="606"
                        :title="posts[0].title"
                        aria-label="Cover Image"
                        fetchpriority="high"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div v-if="posts[0].categories && posts[0].categories.length > 0" class="mb-2">
                            <a
                                :href="`/category/${posts[0].categories[0].slug}`"
                                class="px-3 py-1 bg-blue-600 bg-opacity-85 text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                            >
                                {{ posts[0].categories[0].name }}
                            </a>
                        </div>
                        <a :href="`/post/${posts[0].slug}`" class="block">
                            <h2 class="text-2xl md:text-4xl font-bold mb-2 hover:text-blue-400 transition-colors">{{ posts[0].title }}</h2>
                            <p class="text-gray-200 line-clamp-2 md:max-w-3xl">{{ posts[0].excerpt || stripHtml(posts[0].content).substring(0, 200) + '...' }}</p>
                        </a>
                        <div class="mt-4 flex items-center text-sm text-gray-300">
                            <span v-if="getAuthor(posts[0])" class="mr-4">By {{ getAuthor(posts[0]).name }}</span>
                            <span>{{ formatDate(posts[0].publishedAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class=" bg-white dark:bg-neutral-900 rounded-lg max-w-[1200px] m-auto overflow-hidden justify-center xl:m-auto">
            <div class="mx-auto px-4 py-8">
                <div v-if="loading && posts.length === 0" class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>

                <div v-else-if="posts && posts.length === 0" class="text-center py-16">
                    <h2 class="text-2xl font-bold mb-2 dark:text-white">No posts found</h2>
                    <p class="text-gray-600 dark:text-gray-400">Check back later for new content!</p>
                </div>

                <div v-else>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-8">
                        <div v-for="post in posts" :key="post.id" class="flex flex-col bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
                            <a :href="`/post/${post.slug}`" class="block">
                                <div class="relative h-50 overflow-hidden">
                                    <img
                                        v-if="post.featureImage"
                                        :src="post.featureImage"
                                        :alt="post.title"
                                        class="w-full h-full object-cover transition-transform hover:scale-105"
                                    />
                                    <div v-else class="w-full h-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>

                                    <div class="absolute top-2 left-2 flex gap-2 flex-wrap">
                                        <a
                                            v-for="category in post.categories"
                                            :key="category.id"
                                            :href="`/category/${category.slug}`"
                                            class="px-3 py-1 bg-blue-600 bg-opacity-85 text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                                        >
                                            {{ category.name }}
                                        </a>
                                    </div>
                                </div>

                                <div class="p-4 flex-grow flex flex-col">
                                    <a :href="`/post/${post.slug}`" class="block mb-2">
                                        <h2 class="text-xl font-bold line-clamp-2 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                                            {{ post.title }}
                                        </h2>
                                    </a>

                                    <p class="text-gray-600 dark:text-gray-300 line-clamp-3 text-sm mb-4">
                                        {{ post.excerpt || stripHtml(post.content).substring(0, 150) + '...' }}
                                    </p>

                                    <div class="mt-auto flex justify-between items-center">
                                        <div class="flex items-center">
                                            <div v-if="getAuthor(post)" class="text-sm text-gray-600 dark:text-gray-400">
                                                <a :href="`/author/${getAuthor(post).slug}`" class="hover:text-blue-600 dark:hover:text-blue-400">
                                                    {{ getAuthor(post).name }}
                                                </a>
                                            </div>
                                        </div>

                                        <span class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ formatDate(post.publishedAt) }}
                                        </span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>

                    <div v-if="!hasMorePosts && posts.length > 0 && !loadingMore" class="mt-8 text-center py-4 text-gray-500 dark:text-gray-400">

                    </div>

                    <div ref="observerTarget" class="h-4 w-full"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useHead } from '@unhead/vue'
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { usePostsStore } from '../../store/posts';

import {
    formatDate, stripHtml
} from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const postsStore = usePostsStore();
const blogAPI = vue3.useBlog();
const settings = ref<any>(settingsStore.getSettings);
const posts = ref<any[]>(postsStore.getPosts);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(null);
const currentPage = ref(0);
const hasMorePosts = ref(true);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

const coverSettings = ref<any>(null);
const coverType = ref<string>('full');
const coverPost = ref<any>(null);
const carouselPosts = ref<any[]>([]);
const carouselIndex = ref(0);
const carouselInterval = ref<any>(null);
const splitMainPost = ref<any>(null);
const splitSecondaryPosts = ref<any[]>([]);
const dualPosts = ref<any[]>([]);

const parseCoverSettings = () => {
    try {
        if (settings.value['blog.cover']) {
            const coverConfig = JSON.parse(settings.value['blog.cover']);
            coverSettings.value = coverConfig;
            coverType.value = coverConfig.type || 'full';
        } else {
            coverType.value = 'full';
        }
    } catch (err) {
        console.error('Failed to parse cover settings:', err);
        coverType.value = 'full';
    }
};

const loadCoverPosts = async () => {
    if (!coverSettings.value) return;

    try {
        const shouldRespectSelectedPosts = coverSettings.value.respectSelectedPosts !== false; // Default to true if missing

        if (!shouldRespectSelectedPosts) {
            if (posts.value.length > 0) {
                coverPost.value = posts.value[0];
                carouselPosts.value = posts.value.slice(0, 3);
                splitMainPost.value = posts.value[0];
                splitSecondaryPosts.value = posts.value.slice(1, 3);
                dualPosts.value = posts.value.slice(0, 2);
            }
            return;
        }

        if (coverType.value === 'full') {
            const postId = coverSettings.value.fullCover?.postId || coverSettings.value.postId;
            if (postId) {
                const post = posts.value.find(p => p.id === postId);
                if (post) {
                    coverPost.value = post;
                } else {
                    try {
                        const response = await blogAPI.posts.getById(postId);
                        if (response) coverPost.value = response;
                    } catch (error) {
                        console.error(`Failed to fetch full cover post ${postId}:`, error);
                        // Fallback to most recent post
                        if (posts.value.length > 0) {
                            coverPost.value = posts.value[0];
                        }
                    }
                }
            } else if (posts.value.length > 0) {
                coverPost.value = posts.value[0];
            }
        }

        else if (coverType.value === 'carousel') {
            const postIds = Array.isArray(coverSettings.value.postIds)
                ? coverSettings.value.postIds
                : (coverSettings.value.carousel?.filter((item: any) => item.postId).map((item: any) => item.postId) || []);

            if (postIds.length > 0) {
                const fetchedPosts: any[] = [];
                for (const postId of postIds) {
                    const post = posts.value.find(p => p.id === postId);
                    if (post) {
                        fetchedPosts.push(post);
                    } else {
                        try {
                            const response = await blogAPI.posts.getById(postId);
                            if (response) fetchedPosts.push(response);
                        } catch (error) {
                            console.error(`Failed to fetch carousel post ${postId}:`, error);
                        }
                    }
                }
                carouselPosts.value = fetchedPosts.length > 0 ? fetchedPosts : posts.value.slice(0, 3);
            } else if (posts.value.length > 0) {
                carouselPosts.value = posts.value.slice(0, 3);
            }
        }

        else if (coverType.value === 'split') {
            // Main post
            const mainPostId = coverSettings.value.split?.main?.postId ||
                               coverSettings.value.mainPostId;

            if (mainPostId) {
                const post = posts.value.find(p => p.id === mainPostId);
                if (post) {
                    splitMainPost.value = post;
                } else {
                    try {
                        const response = await blogAPI.posts.getById(mainPostId);
                        if (response) splitMainPost.value = response;
                    } catch (error) {
                        console.error('Failed to fetch split main post:', error);
                        // Fallback to most recent post
                        if (posts.value.length > 0) {
                            splitMainPost.value = posts.value[0];
                        }
                    }
                }
            } else if (posts.value.length > 0) {
                splitMainPost.value = posts.value[0];
            }

            // Secondary posts
            const secondaryPostIds = Array.isArray(coverSettings.value.sidePostIds)
                ? coverSettings.value.sidePostIds
                : (coverSettings.value.split?.secondary?.filter((item: any) => item.postId).map((item: any) => item.postId) || []);

            if (secondaryPostIds.length > 0) {
                const fetchedPosts: any[] = [];
                for (const postId of secondaryPostIds) {
                    const post = posts.value.find(p => p.id === postId);
                    if (post) {
                        fetchedPosts.push(post);
                    } else {
                        try {
                            const response = await blogAPI.posts.getById(postId);
                            if (response) fetchedPosts.push(response);
                        } catch (error) {
                            console.error(`Failed to fetch split secondary post ${postId}:`, error);
                        }
                    }
                }
                splitSecondaryPosts.value = fetchedPosts.length > 0 ? fetchedPosts : posts.value.slice(1, 3);
            } else if (posts.value.length > 1) {
                splitSecondaryPosts.value = posts.value.slice(1, 3);
            }
        }

        else if (coverType.value === 'dual') {
            const postIds = Array.isArray(coverSettings.value.postIds)
                ? coverSettings.value.postIds
                : (coverSettings.value.dual?.filter((item: any) => item.postId).map((item: any) => item.postId) || []);

            if (postIds.length > 0) {
                const fetchedPosts: any[] = [];
                for (const postId of postIds) {
                    const post = posts.value.find(p => p.id === postId);
                    if (post) {
                        fetchedPosts.push(post);
                    } else {
                        try {
                            const response = await blogAPI.posts.getById(postId);
                            if (response) fetchedPosts.push(response);
                        } catch (error) {
                            console.error(`Failed to fetch dual post ${postId}:`, error);
                        }
                    }
                }
                dualPosts.value = fetchedPosts.length > 0 ? fetchedPosts : posts.value.slice(0, 2);
            } else if (posts.value.length > 1) {
                dualPosts.value = posts.value.slice(0, 2);
            }
        }

        if (!coverPost.value && carouselPosts.value.length === 0 &&
            !splitMainPost.value && dualPosts.value.length === 0) {
            if (posts.value.length > 0) {
                coverType.value = 'full';
                coverPost.value = posts.value[0];
            }
        }
    } catch (err) {
        console.error('Failed to load cover posts:', err);
    }
};

const nextSlide = () => {
    carouselIndex.value = (carouselIndex.value + 1) % carouselPosts.value.length;
};

const prevSlide = () => {
    carouselIndex.value = (carouselIndex.value - 1 + carouselPosts.value.length) % carouselPosts.value.length;
};

if(settings.value){
    const headData = ref({
        title: settings.value['blog.title'] || 'Blog',
        meta: [
            { name: 'description', content: settings.value['blog.description'] || 'Blog' },
            { name: 'keywords', content: settings.value['blog.keywords'] || 'Blog' },
            { property: 'og:type', content: 'website' },
            { property: 'og:title', content: settings.value['blog.title'] || 'Blog' },
            { property: 'og:description', content: settings.value['blog.description'] || 'Blog' },
            { property: 'og:image', content: settings.value['blog.logo'] || '' }
        ],
        link: [
            { rel: 'canonical', href: settings.value['blog.url'] },
            { rel: 'alternate', href: `${settings.value['blog.url']}/feed`, type: 'application/rss+xml', title: settings.value['blog.title'] }
        ]
    })

    useHead(headData);
}

const pagination = ref({
    total: 0,
    limit: 32,
    offset: 0
});

const loadPosts = async () => {
    try {
        loading.value = true;
        error.value = null;

        const response: any = await blogAPI.posts.getAll({ offset: currentPage.value * pagination.value.limit, limit: pagination.value.limit });

        if (response) {
            posts.value = response.posts;

            pagination.value = {
                total: response.meta?.pagination?.total || 0,
                limit: response.meta?.pagination?.limit || 32,
                offset: response.meta?.pagination?.offset || 0
            };

            hasMorePosts.value = posts.value.length < response.count;

            parseCoverSettings();
            await loadCoverPosts();
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

        const response: any = await blogAPI.posts.getAll({ offset: posts.value.length, limit: pagination.value.limit });

        if (response && response.posts && response.posts.length > 0) {
            posts.value = [...posts.value, ...response.posts];

            pagination.value = {
                total: response.meta?.pagination?.total || 0,
                limit: response.meta?.pagination?.limit || 9,
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

const setupCarouselRotation = () => {
    if (carouselPosts.value.length > 1) {
        clearInterval(carouselInterval.value);
        carouselInterval.value = setInterval(() => {
            nextSlide();
        }, 10000);
    }
};

onMounted(async () => {
    loadPosts();
    setupIntersectionObserver();
    setupCarouselRotation();
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }

    if (carouselInterval.value) {
        clearInterval(carouselInterval.value);
    }
});

watch([carouselPosts], () => {
    setupCarouselRotation();
});

const getAuthor = (post: any) => {
    if (!post.authors || !post.authors.length) return null;
    return post.authors.find((author: any) => author.id === post.author);
};
</script>
