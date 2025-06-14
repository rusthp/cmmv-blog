<template>
    <div class="lg:ml-64">
        <div v-if="!page" class="container mx-auto max-w-4xl px-4 py-12">
            <div class="bg-neutral-800 dark:bg-neutral-900 p-6 rounded-lg text-center" role="alert" aria-live="polite">
                <h1 class="text-2xl font-bold text-white mb-4">Page not found</h1>
                <p class="text-neutral-400">The page you're looking for doesn't exist or is unavailable.</p>
            </div>
        </div>

        <div v-else class="article-container lg:max-w-4xl md:max-w-3xl dark:bg-neutral-900">
            <div v-if="page.featureImage" class="post-featured-image relative">
                <div class="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                    <a
                        v-for="category in page.categories"
                        :key="category.id"
                        :href="`/category/${category.slug}`"
                        class="px-3 py-1 bg-red-500 bg-opacity-85 text-white text-sm font-medium rounded-full shadow-sm hover:bg-opacity-100 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        :aria-label="`Categoria: ${category.name}`"
                    >
                        {{ category.name }}
                    </a>
                </div>
                    
                <OptimizedImage
                    :src="page.full?.featureImage"
                    :alt="page.full?.title"
                    :title="page.full?.title"
                    aria-label="Cover Image"
                    width="890"
                    height="606"
                    loading="lazy"
                    priority="high"
                    icon-size="lg"
                />

                <p v-if="page.full?.featureImageCaption" class="image-caption dark:text-neutral-300">{{ page.full?.featureImageCaption }}</p>
            </div>

            <!-- Post Header -->
            <header class="post-header dark:bg-neutral-900">
                <h1 class="post-title dark:text-white">{{ page.title }}</h1>

                <div class="post-meta">
                    <div class="post-status" v-if="page.status !== 'published'">
                        <span class="status-badge">{{ page.status.toUpperCase() }}</span>
                    </div>
                </div>
            </header>

            <!-- Post Content -->
            <div class="post-content dark:text-neutral-300" v-html="page.content"></div>

            <!-- Add this right after the post content, replace the existing share box -->
            <div class="py-8 border-t border-neutral-200 dark:border-neutral-800">
                <div class="flex items-center justify-between">
                    <!-- Share text and icons -->
                    <div class="flex items-center gap-2">
                        <span class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Share:</span>

                        <div class="flex gap-2">
                            <!-- Facebook -->
                            <a
                                class="bg-blue-600 hover:bg-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                                rel="nofollow noopener"
                                :href="'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl)"
                                onclick="window.open(this.href, 'facebook-share','width=580,height=296');return false;"
                                title="Share on Facebook"
                                aria-label="Compartilhar no Facebook"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
                                </svg>
                            </a>

                            <!-- Twitter -->
                            <a
                                class="bg-sky-500 hover:bg-sky-600 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                rel="nofollow noopener"
                                :href="'https://twitter.com/share?text=' + encodeURIComponent(page.title) + '&url=' + encodeURIComponent(pageUrl)"
                                onclick="window.open(this.href, 'twitter-share', 'width=550,height=235');return false;"
                                title="Share on Twitter"
                                aria-label="Compartilhar no Twitter"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>

                            <!-- LinkedIn -->
                            <a
                                class="bg-blue-700 hover:bg-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700"
                                rel="nofollow noopener"
                                :href="'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(pageUrl) + '&title=' + encodeURIComponent(page.title)"
                                onclick="window.open(this.href, 'linkedin-share', 'width=490,height=530');return false;"
                                title="Share on LinkedIn"
                                aria-label="Compartilhar no LinkedIn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>

                            <!-- WhatsApp -->
                            <a
                                class="bg-green-500 hover:bg-green-600 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                rel="nofollow noopener"
                                :href="'https://api.whatsapp.com/send?text=' + encodeURIComponent(page.title + ' ' + pageUrl)"
                                data-action="share/whatsapp/share"
                                title="Share on WhatsApp"
                                aria-label="Compartilhar no WhatsApp"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { vue3 } from '@cmmv/blog/client';
import OptimizedImage from '../../components/OptimizedImage.vue';

const blogAPI = vue3.useBlog();
const route = useRoute();
const page = ref<any>(null);

page.value = route.params.id ?
    await blogAPI.pages.getById(route.params.id as string) :
    await blogAPI.pages.getBySlug(route.params.slug as string);

const author = ref(page.value.authors.find(
    (author: any) => author.user === page.value.author
));

const pageUrl = computed(() => {
    //@ts-ignore
    return `${import.meta.env.VITE_WEBSITE_URL}/page/${page.value.slug}`;
});

</script>
