<template>
    <div class="w-full relative bg-neutral-100">
        <div class="w-full max-w-[1200px] mx-auto px-4">
            <div v-if="!post" class="bg-white rounded-lg p-6">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Post não encontrado</h1>
                    <p class="text-neutral-600">O post que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else>
                <!-- Top AdSense Banner -->
                <div v-if="adSettings.enableAds && adSettings.articlePageHeader" class="w-full bg-gray-100 rounded-lg mb-8 overflow-hidden flex justify-center">
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
                    <!-- Main Content Area -->
                    <div class="flex-grow">
                        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <!-- Main Post Content (2 columns width) -->
                            <div class="lg:col-span-3 bg-white rounded-lg p-4 relative">
                                <div class="w-full mx-auto overflow-hidden">
                                    <h1 class="post-title text-neutral-900 text-3xl md:text-4xl font-bold break-words mb-4">{{ post.title }}</h1>

                                    <div v-if="post.featureImage" class="post-featured-image relative overflow-hidden rounded-lg max-h-[400px]">
                                        <div class="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                                            <a v-for="category in post.categories" :key="category.id" :href="`/category/${category.slug}`"
                                                class="px-3 py-1 bg-[#ed1c24] text-white text-sm font-medium rounded-full shadow-sm hover:bg-[#c5131a] transition-all">
                                                {{ category.name }}
                                            </a>
                                        </div>
                                        <OptimizedImage
                                            :src="post.featureImage"
                                            :alt="post.featureImageAlt || post.title"
                                            class="featured-img md:block hidden imgix-lazy"
                                            width="890"
                                            height="606"
                                            loading="lazy"
                                            priority="high"
                                            icon-size="lg"
                                            :title="post.featureImageAlt || 'Imagem de destaque'"
                                        />
                                    </div>
                                    <div v-if="post.featureImage" class="md:hidden block mb-4">
                                        <OptimizedImage
                                            :src="post.featureImage"
                                            :alt="post.featureImageAlt || post.title"
                                            class="featured-img imgix-lazy"
                                            width="890"
                                            height="606"
                                            loading="lazy"
                                            priority="high"
                                            icon-size="lg"
                                            :title="post.featureImageAlt || 'Imagem de destaque'"
                                        />
                                    </div>
                                    <div class="post-content prose max-w-none" v-html="post.content"></div>

                                    <div v-if="post.tags && post.tags.length" class="tags-list flex flex-wrap gap-2 mt-6">
                                        <span v-for="tag in post.tags" :key="tag.id" class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">#{{ tag.name }}</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Sidebar (1 column width) -->
                            <div class="lg:col-span-1">
                                <div ref="sidebarLeftAdContainer" class="ad-sidebar-left mb-8"></div>
                                <div class="bg-white rounded-lg p-4 mb-8">
                                    <h3 class="text-lg font-bold mb-4 text-neutral-800">Posts Relacionados</h3>
                                    <div v-if="relatedPosts.length">
                                        <div v-for="related in relatedPosts" :key="related.id" class="mb-4">
                                            <a :href="`/post/${related.slug}`" class="block">
                                                <h4 class="text-base font-semibold text-gray-800 hover:text-[#ed1c24] transition-colors line-clamp-2">{{ related.title }}</h4>
                                            </a>
                                            <span class="text-xs text-gray-500 mt-1 block">{{ formatDate(related.publishedAt) }}</span>
                                        </div>
                                    </div>
                                    <div v-else class="text-gray-500 text-sm">Nenhum post relacionado encontrado.</div>
                                </div>
                            </div>
                        </div>
                        <!-- Comments Section -->
                        <div ref="commentsObserver" id="comments-container" class="bg-white rounded-lg p-4 mt-8"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { usePostsStore } from '../../store/posts';
import OptimizedImage from '../../components/OptimizedImage.vue';
import { formatDate } from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const postsStore = usePostsStore();
const blogAPI = vue3.useBlog();

const adSettings = computed(() => settingsStore.getSettings['blog.ads'] || {});
const post = ref<any>(null);
const relatedPosts = ref<any[]>([]);
const sidebarLeftAdContainer = ref<HTMLElement | null>(null);

const getAdHtml = (position: string) => {
    return adSettings.value[position] || '';
};

const loadPost = async () => {
    // lógica para carregar o post atual
};

const loadRelatedPosts = () => {
    // lógica para carregar posts relacionados
};

onMounted(() => {
    loadPost();
    loadRelatedPosts();
});
</script>

<style scoped>
/* ... estilos conforme versão íntegra ... */
</style>
