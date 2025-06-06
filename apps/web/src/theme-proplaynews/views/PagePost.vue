<template>
    <div class="w-full relative bg-neutral-100">
        <div class="w-full max-w-[1400px] mx-auto px-4">
            <div v-if="!post" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Post não encontrado</h1>
                    <p class="text-neutral-600">O post que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else>
                <!-- Top AdSense Banner -->
                <div v-if="adSettings.enableAds && adSettings.articlePageHeader" class="w-full bg-gray-100 rounded-lg mb-8 overflow-hidden flex justify-center" aria-label="Publicidade" role="complementary">
                    <div class="ad-container ad-banner-top py-2 px-4" v-if="getAdHtml('header')">
                        <div v-html="getAdHtml('header')"></div>
                    </div>
                    <div class="ad-container ad-banner-top py-2 px-4" v-else>
                        <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                            <span>Anúncio</span>
                        </div>
                    </div>
                </div>

                <!-- Main Content Layout -->
                <div class="flex flex-col lg:flex-row gap-8">
                    <!-- Left AdSense Sidebar -->
                    <aside class="xl:w-[160px] shrink-0 hidden xl:block" v-if="adSettings.enableAds" aria-label="Publicidade lateral">
                        <div class="sticky top-24">
                            <div class="ad-container ad-sidebar-left mb-6" v-if="adSettings.adSenseSidebarLeft">
                                <div ref="sidebarLeftAdContainer"></div>
                            </div>
                            <div class="ad-container ad-sidebar-left mb-6" v-else>
                                <div class="ad-placeholder h-[600px] w-[160px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                    <span>Anúncio</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <!-- Main Content Area -->
                    <div class="flex-grow">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <!-- Main Post Content (2 columns width) -->
                            <div class="lg:col-span-2 bg-white rounded-lg p-4 relative">
                                <div class="w-full mx-auto overflow-hidden">
                                    <h1 class="post-title text-neutral-900 text-3xl md:text-4xl font-bold break-words mb-4">{{ post.title }}</h1>

                                    <div v-if="post.featureImage" class="post-featured-image relative overflow-hidden rounded-lg max-h-[400px]">
                                        <div class="absolute top-4 left-8 z-10 flex flex-wrap gap-2">
                                            <a v-for="category in post.categories" :key="category.id" :href="`/category/${category.slug}`"
                                                class="px-3 py-1 bg-[#ff0030] text-white text-xs font-medium rounded-full shadow-sm hover:bg-[#cc0027] transition-all whitespace-nowrap mb-2">
                                                {{ category.name }}
                                            </a>
                                        </div>

                                            <img
                                                :src="post.featureImage"
                                                :alt="post.featureImageAlt || post.title"
                                            class="featured-img w-full h-full object-cover"
                                                width="890"
                                            height="400"
                                            loading="eager"
                                            fetchpriority="high"
                                                :title="post.featureImageAlt || 'Imagem de destaque para ' + post.title"
                                                decoding="async"
                                            style="aspect-ratio: 890/400;"
                                            />

                                        <p v-if="post.featureImageCaption" class="image-caption text-neutral-600 text-sm mt-2 text-center">{{
                                            post.featureImageCaption }}</p>
                                    </div>

                                    <!-- After Title Ad -->
                                    <div v-if="adSettings.enableAds && adSettings.articlePageAfterTitle" class="w-full bg-gray-100 rounded-lg my-6 overflow-hidden flex justify-center" aria-label="Publicidade" role="complementary">
                                        <div class="ad-container ad-after-title py-2 px-4" v-if="getAdHtml('afterTitle')">
                                            <div v-html="getAdHtml('afterTitle')"></div>
                                        </div>
                                        <div class="ad-container ad-after-title py-2 px-4" v-else>
                                            <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                                <span>Anúncio</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Post Header -->
                                    <header class="post-header my-6">
                                        <div class="post-meta flex items-center">
                                            <div class="flex items-center text-neutral-600 text-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor" aria-hidden="true">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>{{ formatDate(post.status === 'published' ? post.publishedAt : post.updatedAt) }}</span>
                                            </div>

                                            <div class="post-status ml-4" v-if="post.status !== 'published'">
                                                <span class="bg-[#cc0027] text-white px-2 py-1 rounded-full text-xs font-semibold">{{ post.status?.toUpperCase() }}</span>
                                            </div>
                                        </div>
                                    </header>

                                    <!-- Post Content -->
                                    <div class="post-content text-neutral-800 prose prose-sm sm:prose prose-neutral max-w-none overflow-hidden" aria-label="Conteúdo do post">
                                        <div v-html="processPostContent(post.content)"></div>
                                    </div>

                                    <!-- Tags & Categories -->
                                    <div class="post-taxonomy mt-2">
                                        <div v-if="post.tags && post.tags.length > 0" class="post-tags">
                                            <div class="tags-list flex flex-wrap gap-2" aria-label="Tags">
                                                <a v-for="tag in post.tags" :key="tag" :href="`/tag/${tag.slug}`"
                                                    class="tag bg-neutral-100 text-neutral-700 hover:bg-neutral-200 px-3 py-1 rounded-full text-sm">
                                                    {{ tag.name }}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Author Box -->
                                    <div v-if="author"
                                        class="mb-10 p-6 bg-neutral-50 rounded-lg border border-neutral-200 mt-8" role="complementary" aria-label="Informações do autor">
                                        <div class="flex items-center mb-4">
                                            <!-- Author Avatar -->
                                            <div
                                                class="w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0 border-2 border-white shadow">
                                                <img v-if="author.image" :src="author.image" :alt="`Foto de ${author.name}`"
                                                    class="w-full h-full object-cover" width="44" height="44" loading="lazy" decoding="async" />
                                                <div v-else
                                                    class="w-full h-full flex items-center justify-center bg-[#000] text-white font-bold text-lg"
                                                    aria-label="Iniciais do autor">
                                                    {{ authorInitials }}
                                                </div>
                                            </div>

                                            <!-- Author Info -->
                                            <div class="flex-1 min-w-0">
                                                <span class="text-md font-semibold text-neutral-800 mb-1 break-words">
                                                    <a :href="`/author/${author.slug}`" class="hover:underline">
                                                        {{ author.name }}
                                                    </a>
                                                </span>
                                                <p v-if="author.location"
                                                    class="text-xs text-neutral-600 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none"
                                                        viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span class="truncate">{{ author.location }}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Author Bio -->
                                        <div v-if="author.bio" class="text-sm leading-relaxed text-neutral-700 mb-4">
                                            {{ author.bio }}
                                        </div>

                                        <!-- Social Links -->
                                        <div class="flex flex-wrap gap-3" aria-label="Redes sociais do autor">
                                            <a v-if="author.website" :href="author.website" target="_blank" rel="noopener noreferrer"
                                                class="inline-flex items-center px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-full text-sm text-neutral-700 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor" aria-hidden="true">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                                Website
                                            </a>
                                            <a v-if="author.twitter" :href="`https://twitter.com/${author.twitter}`" target="_blank"
                                                rel="noopener noreferrer"
                                                class="inline-flex items-center px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-full text-sm text-neutral-700 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" viewBox="0 0 24 24"
                                                    fill="currentColor" aria-hidden="true">
                                                    <path
                                                        d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                            </svg>
                                                Twitter
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Mid-content AdSense Banner -->
                                    <div v-if="adSettings.enableAds && adSettings.articlePageInContent" class="w-full bg-gray-100 rounded-lg my-8 overflow-hidden flex justify-center" aria-label="Publicidade em conteúdo" role="complementary">
                                        <div class="ad-container ad-banner-mid py-2 px-4" v-if="getAdHtml('inContent')">
                                            <div v-html="getAdHtml('inContent')"></div>
                                        </div>
                                        <div class="ad-container ad-banner-mid py-2 px-4" v-else>
                                            <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                                <span>Anúncio</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Mais Conteúdo Section -->
                                    <div class="mt-10">
                                        <h2 class="text-xl font-bold mb-6 pb-2 text-[#ff0030] border-b-2 border-[#000]">
                                            Mais Conteúdo
                                        </h2>

                                        <div ref="relatedPostsObserver" class="min-h-[200px]">
                                            <div v-if="!relatedPostsLoaded" class="flex justify-center items-center py-6" aria-live="polite" aria-busy="true">
                                                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff0030]" aria-hidden="true"></div>
                                                <span class="ml-3 text-gray-600">Carregando posts relacionados...</span>
                                            </div>

                                            <div v-else-if="relatedPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                <article
                                                    v-for="relatedPost in relatedPosts"
                                                    :key="relatedPost.id"
                                                    class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 optimize-rendering"
                                                >
                                                    <a :href="`/post/${relatedPost.slug}`" class="block">
                                                        <div class="h-48 overflow-hidden relative progressive-img-container">
                                                            <img
                                                                v-if="relatedPost.featureImage"
                                                                :src="relatedPost.featureImage"
                                                                :alt="relatedPost.title"
                                                                class="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                                                                loading="lazy"
                                                                decoding="async"
                                                            />
                                                            <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <div v-if="relatedPost.categories && relatedPost.categories.length > 0" class="absolute top-2 left-6 flex flex-wrap">
                                                                <span class="bg-[#ff0030] text-white px-2 py-0.5 rounded-md text-xs font-medium truncate max-w-[180px]">
                                                                    {{ relatedPost.categories[0].name }}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </a>
                                                    <div class="p-4">
                                                        <a :href="`/post/${relatedPost.slug}`" class="block">
                                                            <h3 class="text-lg font-bold text-gray-800 mb-2 hover:text-[#ff0030] transition-colors line-clamp-2">
                                                                {{ relatedPost.title }}
                                                            </h3>
                                                        </a>
                                                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                                                            {{ relatedPost.excerpt || stripHtml(relatedPost.content).substring(0, 120) + '...' }}
                                                        </p>
                                                        <div class="flex justify-between items-center text-xs text-gray-500">
                                                            <span v-if="getAuthor(relatedPost)">Por {{ getAuthor(relatedPost).name }}</span>
                                                            <span>{{ formatDate(relatedPost.publishedAt || relatedPost.updatedAt) }}</span>
                                                        </div>
                                                    </div>
                                                </article>
                                            </div>

                                            <div v-else class="text-center py-4 text-gray-600">
                                                Nenhum post relacionado encontrado.
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Bottom AdSense Banner -->
                                    <div v-if="adSettings.enableAds && adSettings.articlePageAfterContent" class="w-full bg-gray-100 rounded-lg mt-8 mb-4 overflow-hidden flex justify-center">
                                        <div class="ad-container ad-banner-bottom py-2 px-4" v-if="getAdHtml('belowContent')">
                                            <div v-html="getAdHtml('belowContent')"></div>
                                        </div>
                                        <div class="ad-container ad-banner-bottom py-2 px-4" v-else>
                                            <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                                <span>Anúncio</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Comments Section -->
                                    <div id="comments-container" ref="commentsObserver" class="mt-10 min-h-[100px]">
                                        <div v-if="!commentsLoaded" class="text-center py-4 text-gray-600"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right Column (Widgets + Ads) -->
                            <div class="lg:col-span-1 min-w-[300px]">
                                <div v-if="adSettings.enableAds && adSettings.articlePageSidebarTop" class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center overflow-hidden h-[400px]">
                                    <div class="ad-container ad-sidebar-top" v-if="getAdHtml('sidebarTop')">
                                        <div v-html="getAdHtml('sidebarTop')"></div>
                                    </div>
                                    <div class="ad-container ad-sidebar-top" v-else>
                                        <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                            <span>Anúncio</span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="adSettings.enableAds && adSettings.articlePageSidebarMid" class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center overflow-hidden h-[400px]">
                                    <div class="ad-container ad-sidebar-mid" v-if="getAdHtml('sidebarMid')">
                                        <div v-html="getAdHtml('sidebarMid')"></div>
                                    </div>
                                    <div class="ad-container ad-sidebar-mid" v-else>
                                        <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                            <span>Anúncio</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-white rounded-lg shadow-md p-5 mb-6 widget-mais-populares">
                                    <h2 class="text-xl font-bold mb-4 pb-2 text-[#ff0030] border-b-2 border-[#000] inline-block titulo-mais-populares">
                                        Mais Populares
                                    </h2>

                                    <div class="space-y-4 lista-mais-populares">
                                        <div
                                            v-for="popularPost in popularPosts"
                                            :key="popularPost.id"
                                            class="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                                        >
                                            <div class="w-20 h-16 flex-shrink-0 overflow-hidden rounded-md">
                                                <a :href="`/post/${popularPost.slug}`">
                                                    <img
                                                        v-if="popularPost.image || popularPost.featureImage"
                                                        :src="popularPost.image || popularPost.featureImage"
                                                        :alt="popularPost.title"
                                                        class="w-full h-full object-cover"
                                                    />
                                                    <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </a>
                                            </div>
                                            <div class="flex-grow">
                                                <a :href="`/post/${popularPost.slug}`" class="block">
                                                    <h4 class="text-sm font-semibold text-gray-800 hover:text-[#ff0030] transition-colors line-clamp-2">
                                                        {{ popularPost.title }}
                                                    </h4>
                                                </a>
                                                <span class="text-xs text-gray-500 mt-1 block">
                                                    {{ formatDate(popularPost.publishedAt || popularPost.updatedAt) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Categories Widget -->
                                <div v-if="categories && categories.length > 0" class="bg-white rounded-lg shadow-md p-5 mb-6">
                                    <h2 class="text-xl font-bold mb-4 pb-2 text-[#ff0030] border-b-2 border-[#000] inline-block">
                                        Categorias
                                    </h2>

                                    <ul class="space-y-2">
                                        <li v-for="category in categories" :key="category.id" class="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                            <a
                                                :href="`/category/${category.slug}`"
                                                class="flex justify-between items-center text-gray-700 hover:text-[#ff0030] transition-colors"
                                            >
                                                {{ category.name }}
                                                <span class="bg-[#ff0030] text-white px-2 py-1 rounded-full text-xs font-medium">
                                                    {{ category.postCount }}
                                                </span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                <!-- AdSense Rectangle (Bottom) -->
                                <div v-if="adSettings.enableAds && adSettings.articlePageSidebarBottom" class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center h-[400px]">
                                    <div class="ad-container ad-sidebar-bottom" v-if="getAdHtml('sidebarBottom')">
                                        <div v-html="getAdHtml('sidebarBottom')"></div>
                                    </div>
                                    <div class="ad-container ad-sidebar-bottom" v-else>
                                        <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                            <span>Anúncio</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Taboola JS Code -->
        <div v-if="adSettings.enableAds && adSettings.enableTaboolaAds && adSettings.taboolaJsCode" v-html="adSettings.taboolaJsCode"></div>
    </div>
</template>

<script setup lang="ts">
//@ts-nocheck
import {
    ref, computed, onServerPrefetch,
    onMounted, watchEffect, watch, onUnmounted
} from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { vue3 } from '@cmmv/blog/client'
import { formatDate, stripHtml } from '../../composables/useUtils'
import CommentSection from '../../components/CommentSection.vue'
import { useSettingsStore } from '../../store/settings';
import { usePostsStore } from '../../store/posts';
import { useCategoriesStore } from '../../store/categories';
import { useMostAccessedPostsStore } from '../../store/mostaccessed';

// Declare adsbygoogle for TypeScript
declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

const settingsStore = useSettingsStore();
const postsStore = usePostsStore();
const categoriesStore = useCategoriesStore();
const mostAccessedPostsStore = useMostAccessedPostsStore();
const blogAPI = vue3.useBlog()
const route = useRoute()

const settings = ref<any>(settingsStore.getSettings);
const post = ref<any>(null)
const categories = ref<any[]>(categoriesStore.getCategories || []);
const popularPosts = ref<any[]>(mostAccessedPostsStore.getMostAccessedPosts || []);
const isSSR = import.meta.env.SSR

if(!isSSR)
    post.value = window.__CMMV_DATA__["post"]

const isTruthy = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value === '1' || value.toLowerCase() === 'true';
    }
    return false;
};

const adSettings = computed(() => {
    const rawSettings = settings.value || {};

    const result: Record<string, any> = {
        enableAds: isTruthy(rawSettings['blog.enableAds']),
        showAdsLoggedIn: isTruthy(rawSettings['blog.showAdsLoggedIn']),

        articlePageHeader: rawSettings['blog.articlePageHeader'] === undefined ? true : isTruthy(rawSettings['blog.articlePageHeader']),
        articlePageSidebarTop: rawSettings['blog.articlePageSidebarTop'] === undefined ? true : isTruthy(rawSettings['blog.articlePageSidebarTop']),
        articlePageSidebarBottom: rawSettings['blog.articlePageSidebarBottom'] === undefined ? true : isTruthy(rawSettings['blog.articlePageSidebarBottom']),
        articlePageAfterTitle: isTruthy(rawSettings['blog.articlePageAfterTitle']),
        articlePageInContent: rawSettings['blog.articlePageInContent'] === undefined ? true : isTruthy(rawSettings['blog.articlePageInContent']),
        articlePageAfterContent: rawSettings['blog.articlePageAfterContent'] === undefined ? true : isTruthy(rawSettings['blog.articlePageAfterContent']),
        articlePageFooter: isTruthy(rawSettings['blog.articlePageFooter']),

        // AdSense settings
        enableAdSense: isTruthy(rawSettings['blog.enableAdSense']),
        adSensePublisherId: rawSettings['blog.adSensePublisherId'] || '',
        adSenseAutoAdsCode: rawSettings['blog.adSenseAutoAdsCode'] || '',
        enableAdSenseAutoAds: isTruthy(rawSettings['blog.enableAdSenseAutoAds']),
        adSenseHeaderBanner: rawSettings['blog.adSenseHeaderBanner'] || '',
        adSenseSidebarTop: rawSettings['blog.adSenseSidebarTop'] || '',
        adSenseSidebarMid: rawSettings['blog.adSenseSidebarMid'] || '',
        adSenseSidebarBottom: rawSettings['blog.adSenseSidebarBottom'] || '',
        adSenseSidebarLeft: rawSettings['blog.adSenseSidebarLeft'] || '',
        adSenseAfterCover: rawSettings['blog.adSenseAfterCover'] || '',
        adSenseAfterTitle: rawSettings['blog.adSenseAfterTitle'] || '',
        adSenseInArticle: rawSettings['blog.adSenseInArticle'] || '',
        adSenseBelowContent: rawSettings['blog.adSenseBelowContent'] || '',

        enableCustomAds: isTruthy(rawSettings['blog.enableCustomAds']),
        customHeaderBanner: rawSettings['blog.customHeaderBanner'] || '',
        customSidebarTop: rawSettings['blog.customSidebarTop'] || '',
        customSidebarBottom: rawSettings['blog.customSidebarBottom'] || '',
        customInArticle: rawSettings['blog.customInArticle'] || '',
        customBelowContent: rawSettings['blog.customBelowContent'] || '',

        enableAmazonAds: isTruthy(rawSettings['blog.enableAmazonAds']),
        amazonAssociateId: rawSettings['blog.amazonAssociateId'] || '',
        amazonSidebarAd: rawSettings['blog.amazonSidebarAd'] || '',
        amazonInContentAd: rawSettings['blog.amazonInContentAd'] || '',
        amazonBelowContentAd: rawSettings['blog.amazonBelowContentAd'] || '',

        enableTaboolaAds: isTruthy(rawSettings['blog.enableTaboolaAds']),
        taboolaPublisherId: rawSettings['blog.taboolaPublisherId'] || '',
        taboolaBelowArticle: rawSettings['blog.taboolaBelowArticle'] || '',
        taboolaRightRail: rawSettings['blog.taboolaRightRail'] || '',
        taboolaFooter: rawSettings['blog.taboolaFooter'] || '',
        taboolaJsCode: rawSettings['blog.taboolaJsCode'] || '',
    };

    // Log for debugging
    console.log('adSenseSidebarLeft value in PagePost:', rawSettings['blog.adSenseSidebarLeft']);

    return result;
});

// Helper to get appropriate ad HTML based on position
const getAdHtml = (position) => {
    if (!adSettings.value.enableAds) return '';

    // Check if position is enabled
    const positionSetting = `articlePage${position.charAt(0).toUpperCase() + position.slice(1)}`;
    if (positionSetting in adSettings.value && !adSettings.value[positionSetting]) {
        return '';
    }

    if (adSettings.value.enableAdSense) {
        // Map position to the correct AdSense setting key
        let adSenseSetting = '';
        switch (position) {
            case 'header':
                adSenseSetting = 'adSenseHeaderBanner';
                break;
            case 'afterTitle':
                adSenseSetting = 'adSenseAfterTitle';
                break;
            case 'sidebarTop':
                adSenseSetting = 'adSenseSidebarTop';
                break;
            case 'sidebarMid':
                adSenseSetting = 'adSenseSidebarMid';
                break;
            case 'sidebarBottom':
                adSenseSetting = 'adSenseSidebarBottom';
                break;
            case 'sidebarLeft':
                adSenseSetting = 'adSenseSidebarLeft';
                break;
            case 'inContent':
                adSenseSetting = 'adSenseInArticle';
                break;
            case 'belowContent':
                adSenseSetting = 'adSenseBelowContent';
                break;
            default:
                return '';
        }

        if (adSenseSetting in adSettings.value && adSettings.value[adSenseSetting]) {
            return adSettings.value[adSenseSetting];
        }
    }

    if (adSettings.value.enableCustomAds) {
        // Map position to the correct custom ad setting key
        let customSetting = '';
        switch (position) {
            case 'header':
                customSetting = 'customHeaderBanner';
                break;
            case 'sidebarTop':
                customSetting = 'customSidebarTop';
                break;
            case 'sidebarBottom':
                customSetting = 'customSidebarBottom';
                break;
            case 'inContent':
                customSetting = 'customInArticle';
                break;
            case 'belowContent':
                customSetting = 'customBelowContent';
                break;
            default:
                return '';
        }

        if (customSetting in adSettings.value && adSettings.value[customSetting]) {
            return adSettings.value[customSetting];
        }
    }

    if (adSettings.value.enableAmazonAds) {
        switch (position) {
            case 'sidebarTop':
                if (adSettings.value.amazonSidebarAd) return adSettings.value.amazonSidebarAd;
                break;
            case 'inContent':
                if (adSettings.value.amazonInContentAd) return adSettings.value.amazonInContentAd;
                break;
            case 'belowContent':
                if (adSettings.value.amazonBelowContentAd) return adSettings.value.amazonBelowContentAd;
                break;
        }
    }

    if (adSettings.value.enableTaboolaAds) {
        switch (position) {
            case 'belowContent':
                if (adSettings.value.taboolaBelowArticle) return adSettings.value.taboolaBelowArticle;
                break;
            case 'sidebarTop':
                if (adSettings.value.taboolaRightRail) return adSettings.value.taboolaRightRail;
                break;
            case 'footer':
                if (adSettings.value.taboolaFooter) return adSettings.value.taboolaFooter;
                break;
        }
    }

    return '';
};

function processPostContent(content) {
    if (!content) return '';

    // Twitter/X URL patterns
    const twitterUrlPatterns = [
        /https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/status\/([0-9]+)(\?[^\s]*)?/g,
        /https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/status\/([0-9]+)(\?[^\s]*)?/g
    ];

    // Reddit URL patterns
    const redditUrlPatterns = [
        /https?:\/\/(www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)(?:\/[^\/\s]+)?(?:\/([a-zA-Z0-9]+))?/g
    ];

    let processedContent = content;

    // Replace Twitter/X URLs with embed code
    twitterUrlPatterns.forEach(pattern => {
        processedContent = processedContent.replace(pattern, (match, p1, username, tweetId) => {
            // Create Twitter embed HTML
            return `<div class="twitter-embed">
                <blockquote class="twitter-tweet" data-dnt="true" data-theme="light">
                    <a href="${match}"></a>
                </blockquote>
            </div>`;
        });
    });

    // Replace Reddit URLs with embed code
    redditUrlPatterns.forEach(pattern => {
        processedContent = processedContent.replace(pattern, (match, p1, subreddit, postId, commentId) => {
            // Create Reddit embed HTML
            return `<div class="reddit-embed">
                <div class="reddit-card" data-embed-height="500">
                    <a href="${match}"></a>
                </div>
            </div>`;
        });
    });

    // Load Twitter script if content has Twitter embeds
    if (!isSSR && (processedContent.includes('twitter-tweet') || processedContent.includes('twitter-embed'))) {
        setTimeout(() => {
            loadTwitterScript();
        }, 100);
    }

    // Load Reddit script if content has Reddit embeds
    if (!isSSR && processedContent.includes('reddit-embed')) {
        setTimeout(() => {
            loadRedditScript();
        }, 100);
    }

    return processedContent;
}

function loadTwitterScript() {
    if (document.getElementById('twitter-widgets-script')) return;

    const script = document.createElement('script');
    script.id = 'twitter-widgets-script';
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
}

function loadRedditScript() {
    if (document.getElementById('reddit-widget-script')) return;

    const script = document.createElement('script');
    script.id = 'reddit-widget-script';
    script.src = 'https://embed.reddit.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
}

const author = computed(() => post.value?.authors?.find((a: any) => a.user === post.value?.author))
const isScrolled = ref(false)
const relatedPosts = ref<any[]>([])
const isDesktop = ref(false)
const linkCopied = ref(false)

const authorInitials = computed(() => {
    return author.value?.name
        ? author.value.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        : '?'
})

const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const whatsappShareUrl = computed(() => {
    if (!post.value) return '';
    const text = encodeURIComponent(post.value.title + ' ' + pageUrl.value)
    return isDesktop.value
        ? `https://web.whatsapp.com/send?text=${text}`
        : `https://api.whatsapp.com/send?text=${text}`
})

const getAuthor = (post: any) => {
    if (!post.authors || !post.authors.length) return null;
    return post.authors.find((author: any) => author.user === post.author);
};

onServerPrefetch(async () => {
    post.value = route.params.id
            ? await blogAPI.posts.getById(route.params.id as string)
            : await blogAPI.posts.getBySlug(route.params.slug as string);
})

watchEffect(() => {
    if (post.value && post.value.id) {
        const storePosts = postsStore.getPosts || [];

        if (storePosts.length > 0) {
            const filteredPosts = storePosts.filter(p => p.id !== post.value.id);

            if (filteredPosts.length > 0)
                relatedPosts.value = shuffleArray(filteredPosts).slice(0, 3);
        }
    }
})

const pageUrl = computed(() => {
    return `${import.meta.env.VITE_WEBSITE_URL}/post/${post.value?.slug || ''}`
})

const keywords = computed(() => post.value?.keywords ||
    (post.value?.tags?.map((tag: any) => tag.name).join(', ') || ''))

const description = computed(() =>
    stripHtml(post.value?.description || post.value?.excerpt || post.value?.content || '')
        .substring(0, 150) + '...'
)

const metadata = computed(() => keywords.value
    .split(', ')
    .map((k: string) => ({ property: 'article:tag', content: k })))

const headData = computed(() => ({
    title: post.value?.title,
    meta: [
        { name: 'description', content: description.value },
        { name: 'keywords', content: keywords.value },
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: post.value?.title },
        { property: 'og:description', content: description.value },
        { property: 'og:image', content: post.value?.featureImage || settings.value?.['blog.image'] },
        { property: 'og:url', content: pageUrl.value },
        { property: 'og:image:type', content: 'image/webp' },
        { property: 'og:image:alt', content: post.value?.title || 'Imagem' },
        { property: 'og:image:secure_url', content: post.value?.featureImage || settings.value?.['blog.image'] },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '675' },
        { property: 'og:image:type', content: 'image/webp' },
        { property: 'og:updated_time', content: post.value?.updatedAt ? new Date(post.value.updatedAt).toISOString() : new Date().toISOString() },
        { property: 'article:published_time', content: post.value?.status === 'published' && post.value?.publishedAt ? new Date(post.value.publishedAt).toISOString() : post.value?.createdAt ? new Date(post.value.createdAt).toISOString() : new Date().toISOString() },
        { property: 'article:modified_time', content: post.value?.updatedAt ? new Date(post.value.updatedAt).toISOString() : new Date().toISOString() },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: post.value?.title },
        { name: 'twitter:description', content: description.value },
        { name: 'twitter:image', content: post.value?.featureImage || settings.value?.['blog.image'] },
        { name: 'twitter:url', content: pageUrl.value },
        ...metadata.value
    ],
    link: [
        { rel: 'canonical', href: pageUrl.value },
        { rel: 'alternate', href: `${settings.value['blog.url']}/feed`, type: 'application/rss+xml', title: settings.value['blog.title'] }
    ],
    script: isSSR ? [
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify(vue3.createLdJSON('post', post.value, settings.value))
        }

    ] : [
        {
            type: 'text/javascript',
            src: 'https://platform.twitter.com/widgets.js',
            charset: 'UTF-8',
            async: true,
            id: 'twitter-widgets-script'
        },
        {
            type: 'text/javascript',
            src: 'https://embed.reddit.com/widgets.js',
            charset: 'UTF-8',
            async: true,
            id: 'reddit-widget-script'
        }
    ]
}))

useHead(headData)

const copyPageUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(pageUrl.value).then(() => {
            linkCopied.value = true
            setTimeout(() => (linkCopied.value = false), 2000)
        })
    }
}

const handleScroll = () => {
    if (!document.body.contains(relatedPostsObserver.value)) {
        return;
    }
    isScrolled.value = window.scrollY > 300;
};

const commentSystem = computed(() => {
    return settings.value['blog.commentSystem'] || 'none';
});

const loadComments = () => {
    try {
        if (!isMounted.value || isSSR) return;

        const commentsContainer = document.getElementById('comments-container');

        if (!commentsContainer || !document.body.contains(commentsContainer)) {
            console.warn('Comments container not found or not attached to DOM');
            return;
        }

        while (commentsContainer.firstChild) {
            commentsContainer.removeChild(commentsContainer.firstChild);
        }

        if (commentSystem.value === 'disqus') {
            loadDisqusComments();
        } else if (commentSystem.value === 'facebook') {
            loadFacebookComments();
        } else {
            const commentsTitle = document.createElement('h3');
            commentsTitle.className = 'text-xl font-bold mb-4 text-neutral-800';
            commentsTitle.textContent = 'Comentários';
            commentsContainer.appendChild(commentsTitle);

            setTimeout(() => {
                try {
                    if (isMounted.value && document.body.contains(commentsContainer)) {
                        const comments = new CMMVComments({
                            container: '#comments-container',
                            postId: window.location.pathname.split('/').pop(),
                            theme: 'dark'
                        });
                    }
                } catch (error) {
                    console.error('Error initializing comments:', error);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error in loadComments:', error);
    }
};

const loadFacebookComments = () => {
    try {
        if (isSSR || !isMounted.value) return;

        const commentsContainer = document.getElementById('comments-container');
        if (!commentsContainer || !document.body.contains(commentsContainer)) {
            console.warn('Comments container not found or not attached to DOM');
            return;
        }

        commentsContainer.innerHTML = '';

        const commentsTitle = document.createElement('h3');
        commentsTitle.className = 'text-xl font-bold mb-4 text-neutral-800';
        commentsTitle.textContent = 'Comentários';
        commentsContainer.appendChild(commentsTitle);

        const fbCommentsDiv = document.createElement('div');
        fbCommentsDiv.className = 'fb-comments';
        fbCommentsDiv.setAttribute('data-href', pageUrl.value);
        fbCommentsDiv.setAttribute('data-width', '100%');
        fbCommentsDiv.setAttribute('data-numposts', '5');
        fbCommentsDiv.setAttribute('data-order-by', 'social');
        fbCommentsDiv.setAttribute('data-colorscheme', 'light');
        commentsContainer.appendChild(fbCommentsDiv);

        const facebookAppId = settings.value['blog.facebookAppId'];
        if (!facebookAppId) {
            console.error('Facebook App ID is not set.');
            return;
        }

        if (!window.FB) {
            if (!document.getElementById('facebook-jssdk')) {
                window.fbAsyncInit = function () {
                    FB.init({
                        appId: facebookAppId,
                        xfbml: true,
                        version: 'v16.0',
                    });
                    FB.XFBML.parse();
                };

                const script = document.createElement('script');
                script.id = 'facebook-jssdk';
                script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
            }
        } else {
            FB.XFBML.parse();
        }
    } catch (error) {
        console.error('Error in loadFacebookComments:', error);
    }
};

const loadDisqusComments = () => {
    try {
        if (isSSR || !isMounted.value) return;

        const commentsContainer = document.getElementById('comments-container');
        if (!commentsContainer || !document.body.contains(commentsContainer)) {
            console.warn('Comments container not found or not attached to DOM for Disqus');
            return;
        }

        const disqusShortname = settings.value['blog.disqusShortname'];
        if (!disqusShortname) {
            console.error('Disqus shortname is not set');
            if (document.body.contains(commentsContainer)) {
                commentsContainer.innerHTML = '<p class="text-center text-red-500 py-4">O sistema de comentários do Disqus não está configurado corretamente.</p>';
            }
            return;
        }

        const commentsTitle = document.createElement('h3');
        commentsTitle.className = 'text-xl font-bold mb-4 text-neutral-800';
        commentsTitle.textContent = 'Comentários';
        if (!document.body.contains(commentsContainer)) return;
        commentsContainer.appendChild(commentsTitle);

        const disqusThread = document.createElement('div');
        disqusThread.id = 'disqus_thread';
        if (!document.body.contains(commentsContainer)) return;
        commentsContainer.appendChild(disqusThread);

        // Usar setTimeout para garantir que o Disqus seja carregado após o DOM ser atualizado
        setTimeout(() => {
            try {
                if (!isMounted.value || !document.body.contains(disqusThread)) return;

                window.disqus_config = function() {
                    this.page.url = pageUrl.value;
                    this.page.identifier = post.value?.id || post.value?.slug;
                    this.page.title = post.value?.title;
                };

                const script = document.createElement('script');
                script.src = `https://${disqusShortname}.disqus.com/embed.js`;
                script.setAttribute('data-timestamp', +new Date());

                // Verificar se o documento ainda está disponível
                const target = document.head || document.body;
                if (target) {
                    target.appendChild(script);
                }
            } catch (error) {
                console.error('Error loading Disqus:', error);
            }
        }, 100);
    } catch (error) {
        console.error('Error in loadDisqusComments:', error);
    }
};

const relatedPostsObserver = ref<HTMLElement | null>(null)
const commentsObserver = ref<HTMLElement | null>(null)
const relatedPostsLoaded = ref(false)
const commentsLoaded = ref(false)
const relatedPostsObserverInstance = ref<IntersectionObserver | null>(null)
const commentsObserverInstance = ref<IntersectionObserver | null>(null)

const isMounted = ref(false);

onMounted(() => {
    isMounted.value = true;
    isDesktop.value = window.innerWidth > 768;

    window.addEventListener('resize', () => {
        if (isMounted.value)
            isDesktop.value = window.innerWidth > 768;
    });

    window.addEventListener('scroll', handleScroll);
    setupLazyLoading();
    loadAdScripts();
    loadSidebarLeftAd();
    
    // Load comments lazily when component is near viewport
    const commentObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !commentsLoaded.value) {
                    loadComments();
                    commentObserver.unobserve(entry.target);
                }
            });
        },
        { rootMargin: '100px' }
    );

    if (commentsObserver.value) {
        commentObserver.observe(commentsObserver.value);
    }

    // Add scroll listener for reading progress
    window.addEventListener('scroll', updateReadingProgress);

    // Set up mutation observer to control dynamic ads
    setupAdMutationObserver();
});

onUnmounted(() => {
    isMounted.value = false;

    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', () => {
        isDesktop.value = window.innerWidth > 768;
    });

    if (relatedPostsObserverInstance.value) {
        relatedPostsObserverInstance.value.disconnect();
        relatedPostsObserverInstance.value = null;
    }

    if (commentsObserverInstance.value) {
        commentsObserverInstance.value.disconnect();
        commentsObserverInstance.value = null;
    }
});

const setupLazyLoading = () => {
    if (relatedPostsObserver.value) {
        relatedPostsObserverInstance.value = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !relatedPostsLoaded.value) {
                    if (document.body.contains(relatedPostsObserver.value)) {
                        loadRelatedPosts();
                    }
                }
            },
            {
                rootMargin: '200px',
                threshold: 0.1
            }
        );

        relatedPostsObserverInstance.value.observe(relatedPostsObserver.value);
    }

    if (commentsObserver.value) {
        commentsObserverInstance.value = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !commentsLoaded.value) {
                    if (document.body.contains(commentsObserver.value)) {
                        loadComments();
                        commentsLoaded.value = true;
                    }
                }
            },
            {
                rootMargin: '300px',
                threshold: 0.1
            }
        );

        commentsObserverInstance.value.observe(commentsObserver.value);
    }
};

const loadRelatedPosts = async () => {
    if (!document.body.contains(relatedPostsObserver.value))
        return;

    try {
        if (post.value && post.value.id) {
            const storePosts = postsStore.getPosts || [];

            if (storePosts.length > 0) {
                const filteredPosts = storePosts.filter(p => p.id !== post.value.id);

                if (filteredPosts.length > 0) {
                    if (document.body.contains(relatedPostsObserver.value))
                        relatedPosts.value = shuffleArray(filteredPosts).slice(0, 3);
                }
            }

            if (document.body.contains(relatedPostsObserver.value))
                relatedPostsLoaded.value = true;
        }
    } catch (error) {
        console.error('Error loading related posts:', error);
    }
};

const loadAdScripts = () => {
    if (adSettings.value.enableAds) {
        if (adSettings.value.enableAdSense && adSettings.value.enableAdSenseAutoAds && adSettings.value.adSenseAutoAdsCode) {
            const existingScript = document.getElementById('adsense-script');
            if (!existingScript) {
                try {
                    const srcRegex = /src="([^"]+)"/;
                    const match = adSettings.value.adSenseAutoAdsCode.match(srcRegex);

                    if (match && match[1]) {
                        const scriptSrc = match[1];
                        const head = document.head;
                        const script = document.createElement('script');
                        script.id = 'adsense-script';
                        script.async = true;
                        script.src = scriptSrc;
                        script.crossOrigin = "anonymous";
                        head.appendChild(script);
                        console.log('AdSense script added to head:', scriptSrc);
                    } else {
                        console.error('Could not extract AdSense script URL from:', adSettings.value.adSenseAutoAdsCode);
                    }
                } catch (e) {
                    console.error('Error parsing AdSense code:', e);
                }
            }
        }

        if (adSettings.value.adSenseSidebarLeft && sidebarLeftAdContainer.value) {
            try {
                setTimeout(() => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = adSettings.value.adSenseSidebarLeft;
                    const insElement = tempDiv.querySelector('ins');

                    if (insElement) {
                        sidebarLeftAdContainer.value.appendChild(insElement);

                        if (window.adsbygoogle) {
                            try {
                                window.adsbygoogle.push({});
                            } catch (e) {
                                console.error('Error initializing left sidebar ad:', e);
                            }
                        }
                    } else {
                        console.error('Could not find ins element in adSenseSidebarLeft HTML');
                    }
                }, 500);
            } catch (e) {
                console.error('Error inserting left sidebar ad:', e);
            }
        }

        if (adSettings.value.enableAdSense && window.adsbygoogle) {
            setTimeout(() => {
                try {
                    document.querySelectorAll('.adsbygoogle').forEach((ad) => {
                        if (!ad.hasAttribute('data-adsbygoogle-status')) {
                            (window.adsbygoogle = window.adsbygoogle || []).push({});
                        } else {
                            console.log('Ad unit already initialized:', ad.getAttribute('data-adsbygoogle-status'));
                        }
                    });
                } catch (e) {
                    console.error('AdSense initialization error:', e);
                }
            }, 300);
        }
    }
};

const sidebarLeftAdContainer = ref(null);

const setupAdMutationObserver = () => {
    // Create mutation observer to control dynamic ads
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check if it's an ad element
                    if (
                        node.tagName === 'INS' && 
                        (node.className.includes('adsbygoogle') || node.style.display)
                    ) {
                        controlAdElement(node);
                    }
                    
                    // Check for iframe ads
                    if (node.tagName === 'IFRAME' && 
                        (node.src.includes('google') || node.src.includes('doubleclick'))
                    ) {
                        controlAdElement(node);
                    }
                    
                    // Check for div containers with ad IDs
                    if (node.tagName === 'DIV' && 
                        (node.id.includes('google_ads') || node.className.includes('google'))
                    ) {
                        controlAdElement(node);
                    }
                    
                    // Recursively check child nodes
                    const adElements = node.querySelectorAll('ins.adsbygoogle, iframe[src*="google"], div[id*="google_ads"]');
                    adElements.forEach(controlAdElement);
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

const controlAdElement = (element) => {
    // Apply size constraints and positioning
    element.style.maxWidth = '300px';
    element.style.maxHeight = '250px';
    element.style.overflow = 'hidden';
    element.style.position = 'relative';
    element.style.zIndex = '1';
    element.style.margin = '16px auto';
    element.style.borderRadius = '8px';
    element.style.contain = 'size layout style paint';
    
    // Ensure the element doesn't interfere with content
    if (element.parentElement) {
        element.parentElement.style.isolation = 'isolate';
        element.parentElement.style.contain = 'layout style';
    }
};

const updateReadingProgress = () => {
    // Implementation of updateReadingProgress function
};

const loadSidebarLeftAd = () => {
    // Implementation of loadSidebarLeftAd function
};
</script>

<style scoped>
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
    border-left: 4px solid #ff0030;
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
    color: #ff0030;
    text-decoration: underline;
}

.post-content :deep(a:hover) {
    color: #cc0027;
}

/* Twitter/X embed styles */
.post-content :deep(.twitter-embed) {
    margin: 1.5rem auto;
    max-width: 550px;
    position: relative;
    min-height: 200px;
}

.post-content :deep(.twitter-embed)::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231da1f2'%3E%3Cpath d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.2;
}

.post-content :deep(.twitter-embed iframe) {
    border: none !important;
    margin: 0 auto !important;
}

.featured-img {
    opacity: 1;
    height: auto;
    max-height: 500px;
    width: 100%;
    object-fit: cover;
    border-radius: 8px;
}

.post-title {
    word-wrap: break-word;
    hyphens: auto;
}

.tags-list {
    overflow-x: auto;
    padding-bottom: 4px;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.ad-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ccc;
    border-radius: 4px;
}

/* Only hide the left sidebar on screens smaller than 1280px */
@media (max-width: 1280px) {
    .ad-sidebar-left {
        display: none;
    }
}

.category-container {
    max-width: calc(100% - 2rem);
    padding-right: 1rem;
}
</style>
