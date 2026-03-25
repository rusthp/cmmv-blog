<template>
    <div class="w-full relative">
        <div class="w-full max-w-[1200px] mx-auto px-4">
            <div v-if="!post" class="bg-[#191a30] text-gray-100 rounded-lg p-6 border border-[#303443]">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-neutral-800 mb-4">Post não encontrado</h1>
                    <p class="text-neutral-600">O post que você está procurando não existe ou está indisponível.</p>
                </div>
            </div>

            <div v-else>
                <!-- Top AdSense Banner -->
                <div v-if="adSettings.enableAds && adSettings.articlePageHeader" class="w-full mb-8">
                    <article class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 flex flex-col items-center justify-center min-h-[120px]">
                        <div class="ad-container ad-banner-top py-2 px-4 w-full">
                            <div v-if="getAdHtml('header')">
                                <div v-html="getAdHtml('header')"></div>
                            </div>
                            <div v-else class="ad-placeholder w-full h-full flex items-center justify-center text-yellow-400 text-sm border-2 border-dashed border-yellow-400 min-h-[90px]">
                                <div class="text-center">
                                    <div class="text-xs mb-1">🚫 Anúncios Desabilitados</div>
                                    <div class="text-xs">(Desenvolvimento)</div>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>

                <!-- Main Content Layout -->
                <div class="flex flex-col lg:flex-row gap-8 p-4 rounded-lg">
                    <!-- Main Content Area -->
                    <div class="flex-grow">
                        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <!-- Main Post Content (2 columns width) -->
                            <div class="lg:col-span-3 rounded-lg p-4 relative shadow-md text-gray-100 border-0 md:border border-[#303443]">
                                <div class="w-full mx-auto overflow-hidden">
                                    <h1 class="post-title text-3xl md:text-4xl font-bold break-words mb-4 text-shadow-gamer" style="color: #ffffff !important;">{{ post.title }}</h1>

                                    <div v-if="post.featureImage" class="post-featured-image relative overflow-hidden rounded-lg max-h-[400px]">
                                        <div class="absolute top-4 left-4 z-10 flex flex-wrap gap-2 hidden md:flex">
                                            <a v-for="category in post.categories" :key="category.id" :href="`/category/${category.slug}`"
                                                class="px-3 py-1 gamer-button text-sm font-medium rounded-full shadow-sm transition-all">
                                                {{ category.name }}
                                            </a>
                                        </div>

                                                                <OptimizedImage
                            :src="post.featureImage"
                            :alt="post.featureImageAlt || post.title"
                            class="featured-img block imgix-lazy"
                            width="890"
                            height="606"
                            loading="eager"
                            priority="high"
                            icon-size="lg"
                            :title="post.featureImageAlt || 'Imagem de destaque'"
                        />

                                        <p v-if="post.featureImageCaption" class="image-caption text-neutral-600 text-sm mt-2 text-center">{{
                                            post.featureImageCaption }}</p>
                                    </div>

                                    <!-- After Title Ad -->
                                    <div v-if="adSettings.enableAds && adSettings.articlePageAfterTitle" class="w-full my-6">
                                        <article class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 flex flex-col items-center justify-center min-h-[120px]">
                                            <div class="ad-container ad-after-title py-2 px-4 w-full">
                                                <div v-if="getAdHtml('afterTitle')">
                                                    <div v-html="getAdHtml('afterTitle')"></div>
                                                </div>
                                                <div v-else class="ad-placeholder w-full h-full flex items-center justify-center text-yellow-400 text-sm border-2 border-dashed border-yellow-400 min-h-[90px]">
                                                    <div class="text-center">
                                                        <div class="text-xs mb-1">🚫 Anúncios Desabilitados</div>
                                                        <div class="text-xs">(Desenvolvimento)</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    </div>

                                    <!-- Post Header -->
                                    <header class="post-header my-6 bg-gradient-to-r from-[#6600cc]/20 to-transparent p-3 rounded-lg border border-[#303443] shadow-md">
                                        <div class="post-meta flex items-center">
                                            <div class="flex items-center text-gray-300 text-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>{{ formatDate(post.status === 'published' ? post.publishedAt : post.updatedAt) }}</span>
                                            </div>

                                            <div class="post-status ml-4" v-if="post.status !== 'published'">
                                                <span class="bg-[#ffcc00] text-[#333333] px-2 py-1 rounded-full text-xs font-semibold">{{ post.status?.toUpperCase() }}</span>
                                            </div>
                                        </div>
                                    </header>

                                    <!-- Post Content -->
                                    <PostContent v-if="post && post.content" :content="post.content" />

                                    <!-- Tags & Categories -->
                                    <div class="post-taxonomy mt-2">
                                        <div v-if="post.tags && post.tags.length > 0" class="post-tags hidden md:flex">
                                            <div class="tags-list flex flex-wrap gap-2">
                                                <a v-for="tag in post.tags" :key="tag" :href="`/tag/${tag.slug}`"
                                                    class="tag bg-[#0d1117] text-gray-200 hover:border-[#6600cc] border border-[#303443] px-3 py-1 rounded-full text-sm transition-colors">
                                                    {{ tag.name }}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Comments Section -->
                                    <div class="mt-6 mb-6">
                                        <h2 class="text-xl font-bold mb-6 pb-2 text-white border-b-2 border-[#ffcc00] titulo-gamer bg-[#6600cc]/20 pl-2 py-1 rounded-t-md">
                                            Comentários
                                        </h2>
                                        <div id="comments-container" ref="commentsObserver" class="min-h-[100px] comments-section-improved">
                                            <div v-if="!commentsLoaded" class="text-center py-4 text-gray-400"></div>
                                        </div>
                                    </div>

                                    <!-- Author Box -->
                                    <div v-if="author"
                                        class="mb-10 p-6 bg-[#0d1117] rounded-lg border border-[#303443] mt-8 text-gray-100 shadow-md">
                                        <div class="flex items-center mb-4">
                                            <!-- Author Avatar -->
                                            <div
                                                class="w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0 border-2 border-white shadow">
                                                                                <OptimizedImage v-if="author.image" :src="author.image" :alt="author.name"
                                    class="w-full h-full object-cover imgix-lazy" width="44" height="44" icon-size="sm" />
                                                <div v-else
                                                    class="w-full h-full flex items-center justify-center bg-[#6600cc] text-white font-bold text-lg">
                                                    {{ authorInitials }}
                                                </div>
                                            </div>

                                            <!-- Author Info -->
                                            <div class="flex-1 min-w-0">
                                                <span class="text-md font-semibold text-white mb-1 break-words">
                                                    <a :href="`/author/${author.slug}`" class="hover:underline">
                                                        {{ author.name }}
                                                    </a>
                                                </span>
                                                <p v-if="author.location"
                                                    class="text-xs text-gray-300 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none"
                                                        viewBox="0 0 24 24" stroke="currentColor">
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
                                        <div v-if="author.bio" class="text-sm leading-relaxed text-gray-300 mb-4">
                                            {{ author.bio }}
                                        </div>

                                        <!-- Social Links -->
                                        <div class="flex flex-wrap gap-3">
                                            <a v-if="author.website" :href="author.website" target="_blank" rel="noopener noreferrer"
                                                class="inline-flex items-center px-3 py-1.5 bg-[#0d1117] hover:bg-[#6600cc]/30 border border-[#303443] rounded-full text-sm text-gray-200 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                                Website
                                            </a>
                                            <a v-if="author.twitter" :href="`https://twitter.com/${author.twitter}`" target="_blank"
                                                rel="noopener noreferrer"
                                                class="gamer-button w-8 h-8 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110 mr-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path
                                                        d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                                </svg>
                                            </a>
                                            <a v-if="author.facebook" :href="`https://facebook.com/${author.facebook}`" target="_blank"
                                                rel="noopener noreferrer"
                                                class="gamer-button w-8 h-8 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110 mr-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path
                                                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                </svg>
                                            </a>
                                            <a v-if="author.instagram" :href="`https://instagram.com/${author.instagram}`" target="_blank"
                                                rel="noopener noreferrer"
                                                class="gamer-button w-8 h-8 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110 mr-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path
                                                        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                                </svg>
                                            </a>
                                            <a v-if="author.linkedin" :href="`https://linkedin.com/in/${author.linkedin}`" target="_blank"
                                                rel="noopener noreferrer"
                                                class="gamer-button w-8 h-8 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110 mr-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path
                                                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                            </svg>
                                                LinkedIn
                                            </a>
                                            <a v-if="author.github" :href="`https://github.com/${author.github}`" target="_blank"
                                                rel="noopener noreferrer"
                                                class="inline-flex items-center px-3 py-1.5 bg-[#0d1117] hover:bg-[#6600cc]/30 border border-[#303443] rounded-full text-sm text-gray-200 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path
                                                        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.236 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                                </svg>
                                                Github
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Mid-content AdSense Banner Removido -->

                                    <!-- Mais Conteúdo Section -->
                                    <div class="mt-10">
                                        <h2 class="text-xl font-bold mb-6 pb-2 text-white border-b-2 border-[#ffcc00] titulo-gamer bg-[#6600cc]/20 pl-2 py-1 rounded-t-md">
                                            Mais Conteúdo
                                        </h2>

                                        <!-- Related Posts Ad Banner Removido -->

                                        <div ref="relatedPostsObserver" class="min-h-[200px]">
                                            <div v-if="!relatedPostsLoaded" class="flex justify-center items-center py-6">
                                                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0a5d28]"></div>
                                                <span class="ml-3 text-gray-300">Carregando posts relacionados...</span>
                                            </div>

                                            <div v-else-if="relatedPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                <article
                                                    v-for="relatedPost in relatedPosts"
                                                    :key="relatedPost.id"
                                                    class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 flex flex-col min-h-[120px] post-card"
                                                    data-v-f8103284
                                                >
                                                    <a :href="`/post/${relatedPost.slug}`" class="block group">
                                                        <div class="overflow-hidden relative" style="height: 180px; width: 100%; aspect-ratio: 16/9;">
                                                            <OptimizedImage
                                                                v-if="relatedPost.featureImage"
                                                                :src="relatedPost.featureImage"
                                                                :alt="relatedPost.title"
                                                                class="w-full h-full object-cover imgix-lazy transition-transform duration-500 group-hover:scale-110"
                                                                width="300"
                                                                height="180"
                                                                loading="lazy"
                                                                priority="low"
                                                                icon-size="sm"
                                                            />
                                                            <div v-else class="w-full h-full border border-[#303443] flex items-center justify-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                            <div v-if="relatedPost.categories && relatedPost.categories.length > 0" class="absolute top-2 left-2">
                                                                <span class="bg-[#5046e5] text-white px-3 py-1 rounded-full text-xs font-medium">
                                                                    {{ relatedPost.categories[0].name }}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </a>
                                                    <div class="p-4 flex flex-col flex-1">
                                                        <a :href="`/post/${relatedPost.slug}`" class="block">
                                                            <h3 class="text-lg font-bold text-gray-900 mb-2 hover:text-[#00ccff] transition-colors line-clamp-2 border-l-2 border-[#6600cc] pl-2">
                                                                {{ relatedPost.title }}
                                                            </h3>
                                                        </a>
                                                        <p class="text-gray-700 text-sm mb-3 line-clamp-2">
                                                            {{ relatedPost.excerpt || stripHtml(relatedPost.content).substring(0, 120) + '...' }}
                                                        </p>
                                                        <div class="flex justify-between items-center text-xs text-gray-500 mb-3">
                                                            <span v-if="getAuthor(relatedPost)">Por {{ getAuthor(relatedPost).name }}</span>
                                                            <span>{{ formatDate(relatedPost.publishedAt || relatedPost.updatedAt) }}</span>
                                                        </div>
                                                        <!-- Botão Continuar Lendo -->
                                                        <div class="text-center mt-auto">
                                                            <a :href="`/post/${relatedPost.slug}`" class="gamer-button inline-block px-4 py-2 text-sm font-medium rounded-md transition-all hover:shadow-lg text-white" style="color: white !important;">
                                                                Continuar lendo
                                                            </a>
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
                                    <div v-if="adSettings.enableAds && adSettings.articlePageAfterContent" class="w-full mt-8 mb-4">
                                        <article class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 flex flex-col items-center justify-center min-h-[120px]">
                                            <div class="ad-container ad-banner-bottom py-2 px-4 w-full">
                                                <div v-if="getAdHtml('belowContent')">
                                                    <div v-html="getAdHtml('belowContent')"></div>
                                                </div>
                                                <div v-else class="ad-placeholder w-full h-full flex items-center justify-center text-yellow-400 text-sm border-2 border-dashed border-yellow-400 min-h-[90px]">
                                                    <div class="text-center">
                                                        <div class="text-xs mb-1">🚫 Anúncios Desabilitados</div>
                                                        <div class="text-xs">(Desenvolvimento)</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    </div>
                                </div>
                            </div>

                            <!-- Right Column (Widgets + Ads) -->
                            <PostSidebar v-if="post" :post="post" :popular-posts="popularPosts" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Taboola JS Code -->
    <div v-if="adSettings.enableAds && adSettings.enableTaboolaAds && adSettings.taboolaJsCode" v-html="adSettings.taboolaJsCode"></div>
</template>

<script setup lang="ts">
//@ts-nocheck
import {
    ref, computed, onServerPrefetch,
    onMounted, watchEffect, watch, onUnmounted, nextTick, provide
} from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { vue3 } from '@cmmv/blog/client'
import { formatDate, stripHtml } from '../../composables/useUtils'
import CommentSection from '../../components/CommentSection.vue'
import OptimizedImage from '../../components/OptimizedImage.vue'
import PostContent from '../components/PostContent.vue';
import PostSidebar from '../components/PostSidebar.vue';
import { useSettingsStore } from '../../store/settings';
import { usePostsStore } from '../../store/posts';
import { useCategoriesStore } from '../../store/categories';
import { useMostAccessedPostsStore } from '../../store/mostaccessed';
import { useAdManager } from '../composables/useAdManager';
import { useErrorHandling } from '../composables/useErrorHandling';
import { usePreparedPosts } from '../composables/usePreparedPosts';
import { useNetworkErrorHandling } from '../composables/useNetworkErrorHandling';

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

const { adSettings, getAdHtml, loadAdScripts, settings } = useAdManager();
const post = ref<any>(null)
const categories = ref<any[]>(categoriesStore.getCategories || []);
const popularPosts = ref<any[]>(mostAccessedPostsStore.getMostAccessedPosts || []);
const isSSR = import.meta.env.SSR

// Garantir que temos o post no lado do cliente
if(!isSSR) {
    if (window.__CMMV_DATA__ && window.__CMMV_DATA__["post"]) {
        post.value = window.__CMMV_DATA__["post"];
    }
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
        { name: 'twitter:site', content: settings.value?.['blog.twitter'] ? `@${settings.value['blog.twitter']}` : undefined },
        { name: 'twitter:creator', content: author.value?.twitter ? `@${author.value.twitter}` : undefined },
        ...metadata.value
    ],
    link: [
        { rel: 'canonical', href: pageUrl.value },
    ],
    script: isSSR ? [
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify(vue3.createLdJSON('post', post.value, settings.value))
        },
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify(vue3.createLdJSON('breadcrumb', [
                { name: 'Home', url: settings.value?.['blog.url'] || '/' },
                ...((post.value?.categories && post.value.categories.length > 0) ? [{
                    name: post.value.categories[0].name,
                    url: `/category/${post.value.categories[0].slug}`
                }] : []),
                { name: post.value?.title, url: pageUrl.value }
            ], settings.value))
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

        if (!commentsContainer || !document.body.contains(commentsContainer))
            return;
            
        // Aplicar classe para melhor contraste
        commentsContainer.classList.add('comments-section-improved');

        while (commentsContainer.firstChild)
            commentsContainer.removeChild(commentsContainer.firstChild);

        if (commentSystem.value === 'disqus') {
            loadDisqusComments();
        } else if (commentSystem.value === 'facebook') {
            loadFacebookComments();
        } else {
            // Título removido para evitar duplicação

            setTimeout(() => {
                try {
                    if (isMounted.value && document.body.contains(commentsContainer)) {
                        const comments = new CMMVComments({
                            container: '#comments-container',
                            postId: window.location.pathname.split('/').pop(),
                            theme: 'dark'
                        });
                        
                        // Adicionando um pequeno timeout para garantir que os estilos sejam aplicados após o carregamento
                        setTimeout(() => {
                            applyCommentsStyles();
                        }, 500);
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

        if (!commentsContainer || !document.body.contains(commentsContainer))
            return;

        commentsContainer.innerHTML = '';

        // Título removido para evitar duplicação

        const fbCommentsDiv = document.createElement('div');
        fbCommentsDiv.className = 'fb-comments';
        fbCommentsDiv.setAttribute('data-href', pageUrl.value);
        fbCommentsDiv.setAttribute('data-width', '100%');
        fbCommentsDiv.setAttribute('data-numposts', '5');
        fbCommentsDiv.setAttribute('data-order-by', 'social');
        fbCommentsDiv.setAttribute('data-colorscheme', 'light');
        commentsContainer.appendChild(fbCommentsDiv);

        const facebookAppId = settings.value['blog.facebookAppId'];

        if (!facebookAppId)
            return;

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
    } catch (error) {}
};

const loadDisqusComments = () => {
    try {
        if (isSSR || !isMounted.value) return;

        const commentsContainer = document.getElementById('comments-container');

        if (!commentsContainer || !document.body.contains(commentsContainer))
            return;

        const disqusShortname = settings.value['blog.disqusShortname'];

        if (!disqusShortname) {
            if (document.body.contains(commentsContainer))
                commentsContainer.innerHTML = '<p class="text-center text-red-500 py-4">O sistema de comentários do Disqus não está configurado corretamente.</p>';

            return;
        }

        // Título removido para evitar duplicação
        if (!document.body.contains(commentsContainer)) return;

        const disqusThread = document.createElement('div');
        disqusThread.id = 'disqus_thread';
        if (!document.body.contains(commentsContainer)) return;
        commentsContainer.appendChild(disqusThread);

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
            } catch (error) {}
        }, 100);
    } catch (error) {}
};

const relatedPostsObserver = ref<HTMLElement | null>(null)
const commentsObserver = ref<HTMLElement | null>(null)
const relatedPostsLoaded = ref(false)
const commentsLoaded = ref(false)
const relatedPostsObserverInstance = ref<IntersectionObserver | null>(null)
const commentsObserverInstance = ref<IntersectionObserver | null>(null)

// Função para aplicar estilos melhorados aos comentários
const applyCommentsStyles = () => {
    if (!isMounted.value || isSSR) return;
    
    const commentsContainer = document.getElementById('comments-container');
    if (!commentsContainer || !document.body.contains(commentsContainer)) return;
    
    // Melhorar contraste dos inputs e botões
    const inputs = commentsContainer.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        (input as HTMLElement).style.backgroundColor = '#1a1b26';
        (input as HTMLElement).style.border = '1px solid #3b4254';
        (input as HTMLElement).style.color = '#e2e8f0';
        (input as HTMLElement).style.padding = '0.5rem';
    });
    
    // Melhorar contraste dos botões
    const buttons = commentsContainer.querySelectorAll('button');
    buttons.forEach(button => {
        (button as HTMLElement).style.backgroundColor = '#6600cc';
        (button as HTMLElement).style.color = 'white';
        (button as HTMLElement).style.border = 'none';
        (button as HTMLElement).style.padding = '0.5rem 1rem';
        (button as HTMLElement).style.borderRadius = '0.375rem';
        (button as HTMLElement).style.fontWeight = '600';
    });
    
    // Melhorar contraste dos textos
    const textElements = commentsContainer.querySelectorAll('p, span, div, h3, h4, h5, h6');
    textElements.forEach(el => {
        if ((el as HTMLElement).style.color === '' || 
            (el as HTMLElement).style.color === 'rgba(0, 0, 0, 0.87)' || 
            (el as HTMLElement).style.color.includes('rgb(107, 114, 128)')) {
            (el as HTMLElement).style.color = '#e2e8f0';
        }
    });
}

const isMounted = ref(false);

const { preparePosts } = usePreparedPosts();
const { setupGlobalErrorHandling } = useErrorHandling();
const { setupNetworkErrorHandling } = useNetworkErrorHandling();

const isMobile = ref(false);
const checkMobileView = () => { isMobile.value = window.innerWidth < 768; };

onMounted(() => {
    isMounted.value = true;
    isDesktop.value = window.innerWidth > 768;
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    setupGlobalErrorHandling();
    setupNetworkErrorHandling();
    setupLazyLoading();
    loadAdScripts();
    
    // Recarregar anúncios após um delay para garantir que funcionem
    setTimeout(() => {
        if (isMounted.value) {
            loadAdScripts();
        }
    }, 1000);
    
    // Tentar aplicar estilos aos comentários após o carregamento inicial
    setTimeout(() => {
        applyCommentsStyles();
    }, 1000);
    
    // Forçar carregamento dos posts relacionados mesmo sem scroll
    // Isso garante que funcionará tanto na navegação quanto no refresh
    setTimeout(() => {
        if (!relatedPostsLoaded.value && post.value) {
            loadRelatedPosts();
        }
    }, 1500);
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
                rootMargin: '300px', // Aumentado para carregar mais cedo
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
    if (!document.body.contains(relatedPostsObserver.value)) {
        return;
    }

    try {
        if (post.value && post.value.id) {
            let storePosts = postsStore.getPosts || [];

            // Se não há posts no store ou são muito poucos, buscamos da API
            if (storePosts.length < 4) {
                try {
                    const apiPosts = await blogAPI.posts.list({ limit: 6 });
                    if (apiPosts && apiPosts.length > 0) {
                        storePosts = apiPosts;
                    }
                } catch (apiError) {
                    console.error('Erro ao buscar posts da API', { error: apiError.message });
                }
            }

            if (storePosts.length > 0) {
                const filteredPosts = storePosts.filter(p => p.id !== post.value.id);

                if (filteredPosts.length > 0) {
                    if (document.body.contains(relatedPostsObserver.value)) {
                        relatedPosts.value = shuffleArray(filteredPosts).slice(0, 3);
                    }
                }
            }

            if (document.body.contains(relatedPostsObserver.value)) {
                relatedPostsLoaded.value = true;
            }
        }
    } catch (error) {
        console.error('Error loading related posts:', error);
    }
};

const sidebarLeftAdContainer = ref(null);
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
    border-left: 4px solid #0a5d28;
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
    color: #0a5d28;
    text-decoration: underline;
}

.post-content :deep(a:hover) {
    color: #064019;
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
    width: 100%;
    max-height: 500px;
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
    line-clamp: 2;
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

/* Styles for comments and links that were lost in refactoring */
:deep(.post-content a) {
    color: #4ade80 !important;
}
:deep(.post-content a:hover) {
    color: #86efac !important;
}
:deep(.comments-section-improved) { 
    background-color: #0d1117; 
    border: 1px solid #3b4254;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}
:deep(.comments-section-improved *) { 
    color: #e2e8f0 !important;  
}
:deep(.comments-section-improved input), 
:deep(.comments-section-improved textarea) { 
    background-color: #1a1b26 !important;
    border: 1px solid #3b4254 !important;
    color: #e2e8f0 !important;
    padding: 0.5rem !important;
}
:deep(.comments-section-improved button) { 
    background-color: #6600cc !important;
    color: white !important;
    border: none !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.375rem !important;
    font-weight: 600 !important;
}
:deep(.comments-section-improved button:hover) { 
    background-color: #7c3aed !important;
}
:deep(.comments-section-improved a) { 
    color: #4ade80 !important; 
    text-decoration: none !important;
}
:deep(.comments-section-improved a:hover) { 
    color: #86efac !important; 
    text-decoration: underline !important;
}

#comments-container {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
}
</style>

