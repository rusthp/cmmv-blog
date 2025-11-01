<template>
    <div class="home-page w-full max-w-[1200px] mx-auto px-4">
        <div v-if="error" class="text-center py-16 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-2xl font-bold mb-2 text-gray-800">Erro ao carregar posts</h2>
            <p class="text-gray-600 mb-4">Não foi possível carregar os posts. Por favor, tente novamente.</p>
                            <button @click="loadPosts" class="px-4 py-2 bg-[#ffcc00] text-[#333333] rounded-md hover:bg-[#ffa500] transition-colors">
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
            <!-- Cover Section -->
            <section v-if="posts.length > 0" class="mb-8 md:block hidden">
                <!-- Full Layout (default) -->
                <div v-if="coverSettings.layoutType === 'full' || !coverSettings.layoutType" class="bg-white rounded-lg overflow-hidden shadow-md">
                    <a v-if="coverPosts.full" :href="`/post/${coverPosts.full.slug}`" class="block">
                        <div class="relative h-[400px]">
                            <OptimizedImage
                                :src="coverPosts.full?.featureImage"
                                :alt="coverPosts.full?.title"
                                :title="coverPosts.full?.title"
                                aria-label="Cover Image"
                                width="890"
                                height="606"
                                loading="lazy"
                                priority="high"
                                icon-size="lg"
                            />
                            <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="coverPosts.full && coverPosts.full.categories && coverPosts.full.categories.length > 0" class="mb-2">
                                    <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-sm">
                                        {{ coverPosts.full.categories[0].name }}
                                    </span>
                                </div>
                                <h2 v-if="coverPosts.full" class="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-2 px-4 rounded">{{ coverPosts.full.title }}</h2>
                                <p v-if="coverPosts.full" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                    {{ coverPosts.full.excerpt || (stripHtml(coverPosts.full.content).length > 100 ? stripHtml(coverPosts.full.content).substring(0, 100) + '...' : stripHtml(coverPosts.full.content)) }}
                                </p>
                                <span class="inline-block bg-[#ffcc00] hover:bg-[#ffa500] text-[#333333] px-4 py-2 rounded-md transition-colors">
                                    Continuar lendo
                                </span>
                            </div>
                        </div>
                    </a>
                </div>

                <!-- Carousel Layout -->
                <div v-else-if="coverSettings.layoutType === 'carousel'" class="bg-white rounded-lg overflow-hidden shadow-md">
                    <div class="relative h-[400px]">
                        <div v-for="(post, index) in coverPosts.carousel" :key="post.id"
                             class="absolute w-full h-full transition-opacity duration-500 ease-in-out"
                             :class="{ 'opacity-100': currentCarouselIndex === index, 'opacity-0': currentCarouselIndex !== index }">
                            <a :href="`/post/${post.slug}`" class="block h-full">
                                <OptimizedImage
                                    :src="post.featureImage"
                                    :alt="post.title"
                                    :title="post.title"
                                    aria-label="Cover Image"
                                    width="890"
                                    height="606"
                                    loading="lazy"
                                    priority="high"
                                    icon-size="lg"
                                />
                                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                                            {{ post.categories[0].name }}
                                        </span>
                                    </div>
                                                                    <h2 class="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-2 px-4 rounded">{{ post.title }}</h2>
                                <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                    {{ post.excerpt || (stripHtml(post.content).length > 100 ? stripHtml(post.content).substring(0, 100) + '...' : stripHtml(post.content)) }}
                                </p>
                                    <span class="inline-block bg-[#ffcc00] hover:bg-[#ffa500] text-[#333333] px-4 py-2 rounded-md transition-colors">
                                        Continuar lendo
                                    </span>
                                </div>
                            </a>
                        </div>

                        <!-- Carousel Controls -->
                        <div class="absolute top-0 bottom-0 left-0 flex items-center">
                            <button @click="prevCarouselSlide" class="bg-black/30 hover:bg-black/50 text-white p-2 rounded-r-md focus:outline-none z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                        <div class="absolute top-0 bottom-0 right-0 flex items-center">
                            <button @click="nextCarouselSlide" class="bg-black/30 hover:bg-black/50 text-white p-2 rounded-l-md focus:outline-none z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <!-- Carousel Indicators -->
                        <div class="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-10">
                            <button
                                v-for="(_, index) in coverPosts.carousel"
                                :key="index"
                                @click="currentCarouselIndex = index"
                                class="w-3 h-3 rounded-full bg-white/50 focus:outline-none"
                                :class="{ 'bg-white': currentCarouselIndex === index }"
                            ></button>
                        </div>
                    </div>
                </div>

                <!-- Split Layout (1 large, 2 small) -->
                <div v-else-if="coverSettings.layoutType === 'split'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="md:col-span-2 bg-white rounded-lg overflow-hidden shadow-md">
                        <a v-if="coverPosts.splitMain" :href="`/post/${coverPosts.splitMain.slug}`" class="block h-full">
                            <div class="relative h-full">
                                <OptimizedImage
                                    :src="coverPosts.splitMain?.featureImage"
                                    :alt="coverPosts.splitMain?.title"
                                    :title="coverPosts.splitMain?.title"
                                    aria-label="Cover Image"
                                    width="890"
                                    height="606"
                                    loading="lazy"
                                    priority="high"
                                    icon-size="lg"
                                />
                                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="coverPosts.splitMain && coverPosts.splitMain.categories && coverPosts.splitMain.categories.length > 0" class="mb-2">
                                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                                            {{ coverPosts.splitMain.categories[0].name }}
                                        </span>
                                    </div>
                                    <h2 v-if="coverPosts.splitMain" class="text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-2 px-4 rounded">{{ coverPosts.splitMain.title }}</h2>
                                    <p v-if="coverPosts.splitMain" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                        {{ coverPosts.splitMain.excerpt || (stripHtml(coverPosts.splitMain.content).length > 100 ? stripHtml(coverPosts.splitMain.content).substring(0, 100) + '...' : stripHtml(coverPosts.splitMain.content)) }}
                                    </p>
                                    <span class="inline-block bg-[#ffcc00] hover:bg-[#ffa500] text-[#333333] px-4 py-2 rounded-md transition-colors">
                                        Continuar lendo
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="md:col-span-1 flex flex-col gap-4">
                        <div v-for="(post, index) in coverPosts.splitSide" :key="post.id" class="flex-1 bg-white rounded-lg overflow-hidden shadow-md">
                            <a :href="`/post/${post.slug}`" class="block h-full">
                                <div class="relative h-full">
                                    <OptimizedImage
                                        :src="post.featureImage"
                                        :alt="post.title"
                                        loading="lazy"
                                        icon-size="md"
                                    />
                                    <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                        <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                            <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                                                {{ post.categories[0].name }}
                                            </span>
                                        </div>
                                        <h3 class="text-base font-bold mb-2 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-2 px-3 rounded">{{ post.title }}</h3>
                                        <span class="text-sm text-white hover:text-[#ffcc00] transition-colors drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 px-2 py-1 rounded inline-block">
                                            Continuar lendo &rarr;
                                        </span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Dual Layout (2 equal columns) -->
                <div v-else-if="coverSettings.layoutType === 'dual'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="post in coverPosts.dual" :key="post.id" class="bg-white rounded-lg overflow-hidden shadow-md">
                        <a :href="`/post/${post.slug}`" class="block">
                            <div class="relative h-[350px]">
                                <OptimizedImage
                                    :src="post.featureImage"
                                    :alt="post.title"
                                    :title="post.title"
                                    aria-label="Cover Image"
                                    width="890"
                                    height="606"
                                    loading="lazy"
                                    priority="high"
                                    icon-size="lg"
                                />
                                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                                            {{ post.categories[0].name }}
                                        </span>
                                    </div>
                                                                            <h2 class="text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-2 px-4 rounded">{{ post.title }}</h2>
                                    <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                        {{ post.excerpt || (stripHtml(post.content).length > 100 ? stripHtml(post.content).substring(0, 100) + '...' : stripHtml(post.content)) }}
                                    </p>
                                    <span class="inline-block bg-[#ffcc00] hover:bg-[#ffa500] text-[#333333] px-4 py-2 rounded-md transition-colors">
                                        Continuar lendo
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

                            <!-- Top AdSense Banner -->
                <div v-if="adStates.showHeaderAd" class="w-full bg-gray-100 rounded-lg mb-8 overflow-hidden flex justify-center">
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
                <div class="flex-grow">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2">
                            <h2 class="text-xl font-bold mb-6 pb-2 text-purple-700 border-b-2 border-purple-400">
                                Últimas Notícias
                            </h2>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <article
                                    v-for="post in computedPosts.initial"
                                    :key="post.id"
                                    class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300"
                                >
                                    <a :href="`/post/${post.slug}`" class="block">
                                        <div class="h-64 overflow-hidden relative">
                                            <OptimizedImage
                                                :src="post.featureImage"
                                                :alt="post.title"
                                                width="400"
                                                height="256"
                                                loading="lazy"
                                                priority="high"
                                                :hover="true"
                                                icon-size="lg"
                                            />
                                            <div v-if="post.categories && post.categories.length > 0" class="absolute top-2 left-2">
                                                <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                                                    {{ post.categories[0].name }}
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                    <div class="p-3">
                                        <a :href="`/post/${post.slug}`" class="block">
                                            <h3 class="text-lg font-bold text-gray-800 mb-1 hover:text-purple-600 transition-colors line-clamp-2">
                                                {{ post.title.length > 65 ? post.title.substring(0, 65) + '...' : post.title }}
                                            </h3>
                                        </a>
                                        <p class="text-gray-600 text-sm mb-2 line-clamp-2">
                                            {{ post.excerpt || (stripHtml(post.content).length > 70 ? stripHtml(post.content).substring(0, 70) + '...' : stripHtml(post.content)) }}
                                        </p>
                                        <div class="flex justify-between items-center text-xs text-gray-500">
                                            <span v-if="getAuthor(post)">Por {{ getAuthor(post).name }}</span>
                                            <span>{{ formatDate(post.publishedAt) }}</span>
                                        </div>
                                    </div>
                                </article>
                            </div>

                                            <!-- Mid-content AdSense Banner -->
                <div v-if="adStates.showInContentAd" class="w-full bg-gray-100 rounded-lg my-8 overflow-hidden flex justify-center">
                                <div class="ad-container ad-banner-mid py-2 px-4" v-if="getAdHtml('inContent')">
                                    <div v-html="getAdHtml('inContent')"></div>
                                </div>
                                <div class="ad-container ad-banner-mid py-2 px-4" v-else>
                                    <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="computedPosts.remaining.length > 0">
                                <h2 class="text-xl font-bold mb-6 pb-2 text-purple-700 border-b-2 border-purple-400">
                                    Mais Conteúdo
                                </h2>

                                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    <article
                                        v-for="post in computedPosts.remaining"
                                        :key="post.id"
                                        class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300"
                                    >
                                        <a :href="`/post/${post.slug}`" class="block">
                                            <div class="h-64 overflow-hidden relative">
                                                <OptimizedImage
                                                    :src="post.featureImage"
                                                    :alt="post.title"
                                                    width="400"
                                                    height="256"
                                                    loading="lazy"
                                                    :hover="true"
                                                    icon-size="lg"
                                                />
                                                <div v-if="post.categories && post.categories.length > 0" class="absolute top-2 left-2">
                                                    <span class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                                                        {{ post.categories[0].name }}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                        <div class="p-3">
                                            <a :href="`/post/${post.slug}`" class="block">
                                                                                        <h3 class="text-lg font-bold text-gray-800 mb-1 hover:text-purple-600 transition-colors line-clamp-2">
                                            {{ post.title.length > 65 ? post.title.substring(0, 65) + '...' : post.title }}
                                        </h3>
                                            </a>
                                            <p class="text-gray-600 text-sm mb-2 line-clamp-2">
                                                {{ post.excerpt || (stripHtml(post.content).length > 42 ? stripHtml(post.content).substring(0, 42) + '...' : stripHtml(post.content)) }}
                                            </p>
                                            <div class="flex justify-between items-center text-xs text-gray-500">
                                                <span v-if="getAuthor(post)">Por {{ getAuthor(post).name }}</span>
                                                <span>{{ formatDate(post.publishedAt) }}</span>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            </div>

                            <div v-if="adSettings.enableAds && adSettings.homePageAfterPosts" class="w-full bg-gray-100 rounded-lg mt-8 mb-4 overflow-hidden flex justify-center">
                                <div class="ad-container ad-banner-bottom py-2 px-4" v-if="getAdHtml('belowContent')">
                                    <div v-html="getAdHtml('belowContent')"></div>
                                </div>
                                <div class="ad-container ad-banner-bottom py-2 px-4" v-else>
                                    <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Botão Ver Mais -->
                            <div v-if="hasMorePosts && !loadingMore" class="mt-8 flex justify-center">
                                <button 
                                    @click="loadMorePosts"
                                    class="bg-[#ffcc00] hover:bg-[#ffa500] text-[#333333] font-medium px-8 py-3 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                                >
                                    Ver Mais Posts
                                </button>
                            </div>

                            <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffcc00]"></div>
                                <span class="ml-3 text-gray-600">Carregando mais posts...</span>
                            </div>

                            <div v-if="!hasMorePosts && posts.length > 0" class="mt-8 text-center py-4 text-gray-500">
                                <p>🎉 Você viu todos os posts!</p>
                            </div>
                        </div>

                        <!-- Right Column (Widgets + Ads) -->
                        <div class="sidebar lg:col-span-1 min-w-[300px]">
                            <!-- AdSense Rectangle (Top) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarTop" class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center h-[400px]">
                                <div class="ad-container ad-sidebar-top" v-if="getAdHtml('sidebarTop')">
                                    <div v-html="getAdHtml('sidebarTop')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-top" v-else>
                                    <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Popular Posts Widget -->
                            <div class="bg-white rounded-lg shadow-md p-5 mb-6">
                                <h2 class="text-xl font-bold mb-4 pb-2 text-[#333333] border-b-2 border-[#ffcc00]">
                                    Mais Populares
                                </h2>

                                <div v-if="(popularPosts && popularPosts.length > 0) || (posts && posts.length > 0)" class="space-y-4">
                                    <div
                                        v-for="post in (popularPosts && popularPosts.length > 0) ? popularPosts : posts.slice(0, 5)"
                                        :key="post.id"
                                        class="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                                    >
                                        <div class="w-20 h-16 flex-shrink-0 overflow-hidden rounded-md">
                                            <a :href="`/post/${post.slug}`">
                                                <OptimizedImage
                                                    :src="post.image || post.featureImage"
                                                    :alt="post.title"
                                                    width="80"
                                                    height="64"
                                                    loading="lazy"
                                                    icon-size="sm"
                                                />
                                            </a>
                                        </div>
                                        <div class="flex-grow">
                                            <a :href="`/post/${post.slug}`" class="block">
                                                <h4 class="text-sm font-semibold text-gray-800 hover:text-purple-600 transition-colors">
                                                    {{ post.title.length > 45 ? post.title.substring(0, 45) + '...' : post.title }}
                                                </h4>
                                            </a>
                                            <span class="text-xs text-gray-500 mt-1 block">
                                                {{ formatDate(post.publishedAt || post.updatedAt) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Fallback quando não há posts -->
                                <div v-else class="text-center py-6 text-gray-500">
                                    <p class="text-sm">📰 Nenhum post disponível no momento</p>
                                    <p class="text-xs mt-1">Novos conteúdos em breve!</p>
                                </div>
                            </div>

                            <!-- AdSense Rectangle (Middle) -->
                            <div class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center h-[400px]">
                                <div class="ad-container ad-sidebar-mid" v-if="getAdHtml('sidebarMid')">
                                    <div v-html="getAdHtml('sidebarMid')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-mid" v-else>
                                    <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Categories Widget -->


                            <!-- AdSense Rectangle (Bottom) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarBottom" class="bg-gray-100 rounded-lg p-2 mb-6 flex justify-center h-[400px]">
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
</template>

<script setup lang="ts">
import {
    ref, computed, onMounted,
    onUnmounted, watch, nextTick, provide
} from 'vue';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
import { usePostsStore } from '../../store/posts';
import { useMostAccessedPostsStore } from '../../store/mostaccessed';
import { formatDate, stripHtml } from '../../composables/useUtils';
import { useAds } from '../../composables/useAds';
import OptimizedImage from '../../components/OptimizedImage.vue';

declare global {
    interface Window {
        adsbygoogle: any[];
        workbox: any;
        imgix: any;
    }
}

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();
const postsStore = usePostsStore();
const mostAccessedStore = useMostAccessedPostsStore();
const blogAPI = vue3.useBlog();

const rawSettings = computed(() => settingsStore.getSettings);
const settings = computed<Record<string, any>>(() => {
    const settingsObj = rawSettings.value || {};
    const blogSettings: Record<string, any> = {};
    Object.keys(settingsObj).forEach(key => {
        if (key.startsWith('blog.')) {
            const shortKey = key.replace('blog.', '');
            blogSettings[shortKey] = settingsObj[key];
        }
    });
    return blogSettings;
});
const categories = ref<any[]>(categoriesStore.getCategories || []);
const posts = ref<any[]>(postsStore.getPosts || []);
const popularPosts = ref<any[]>(mostAccessedStore.getMostAccessedPosts || []);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(null);
const currentPage = ref(0);
const hasMorePosts = ref(true);
const currentCarouselIndex = ref(0);
const carouselInterval = ref<number | null>(null);
const sidebarLeftAdContainer = ref<HTMLElement | null>(null);
const hydrated = ref(false);

const adPluginSettings = computed(() => {
    return settings.value || {};
});

const {
    adSettings, getAdHtml,
    loadAdScripts, loadSidebarLeftAd
} = useAds(adPluginSettings.value, 'home');

const coverSettings = computed(() => {
    try {
        const config = settings.value.cover;
        return config ? JSON.parse(config) : { layoutType: 'full' };
    } catch (err) {
        console.error('Error parsing cover settings:', err);
        return { layoutType: 'full' };
    }
});

const hasCoverConfig = computed(() => {
    return !!settings.value.cover && Object.keys(coverSettings.value).length > 0;
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
        const shouldRespectSelectedPosts = config.respectSelectedPosts !== false;

        if (shouldRespectSelectedPosts) {
            if (config.layoutType === 'full' && config.fullCover?.postId) {
                const configPost = posts.value.find(p => p.id === config.fullCover.postId);
                if (configPost) result.full = configPost;
            }

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

            if (config.layoutType === 'split') {
                // Main post
                if (config.split?.main?.postId) {
                    const mainPost = posts.value.find(p => p.id === config.split.main.postId);
                    if (mainPost) result.splitMain = mainPost;
                }

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
    if (coverSettings.value.layoutType === 'carousel' && coverPosts.value.carousel?.length > 1) {
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
    title: settings.value.title,
    meta: [
        { name: 'description', content: settings.value.description },
        { name: 'keywords', content: settings.value.keywords },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: settings.value.title },
        { property: 'og:description', content: settings.value.description },
        { property: 'og:image', content: settings.value.logo },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '675' },
        { property: 'og:image:type', content: 'image/webp' },
        { property: 'og:image:alt', content: settings.value.title }
    ],
    link: [
        { rel: 'canonical', href: settings.value.url },
        { rel: 'alternate', href: `${settings.value.url}/feed`, type: 'application/rss+xml', title: settings.value.title }
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

        const response: any = await blogAPI.posts.getAll({
            offset: currentPage.value * pagination.value.limit,
            limit: pagination.value.limit
        });

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
        
        // Usar o offset correto baseado no número atual de posts
        const currentOffset = posts.value.length;
        
        const response: any = await blogAPI.posts.getAll({
            offset: currentOffset,
            limit: pagination.value.limit
        });

        if (response && response.posts && response.posts.length > 0) {
            // Filtrar posts duplicados baseado no ID
            const newPosts = response.posts.filter((newPost: any) => 
                !posts.value.some((existingPost: any) => existingPost.id === newPost.id)
            );
            
            if (newPosts.length > 0) {
                posts.value = [...posts.value, ...newPosts];
                
                pagination.value = {
                    total: response.meta?.pagination?.total || 0,
                    limit: response.meta?.pagination?.limit || 12,
                    offset: currentOffset + newPosts.length
                };

                hasMorePosts.value = posts.value.length < response.count;
            } else {
                hasMorePosts.value = false;
            }
        } else {
            hasMorePosts.value = false;
        }
    } catch (err: any) {
        console.error('Failed to load more posts:', err);
        hasMorePosts.value = false;
    } finally {
        loadingMore.value = false;
    }
};

// Função setupIntersectionObserver removida - agora usando botão "Ver mais"

const getAuthor = (post: any) => {
    if (!post.authors || !post.authors.length) return null;
    return post.authors.find((author: any) => author.id === post.author);
};

// Performance optimization: compute post slices once
const computedPosts = computed(() => {
    if (!posts.value?.length) return { initial: [], remaining: [] };
    
    const startIndex = featuredPost.value ? 1 : 0;
    const midIndex = featuredPost.value ? 5 : 4;
    
    return {
        initial: posts.value.slice(startIndex, midIndex),
        remaining: posts.value.slice(midIndex)
    };
});

// Provide hydrated state to child components
provide('hydrated', hydrated);

onMounted(async () => {
    loading.value = false;
    hydrated.value = true;
    startCarouselInterval();
    loadAdScripts();
    loadSidebarLeftAd(sidebarLeftAdContainer.value);

    await nextTick();
});

onUnmounted(() => {
    stopCarouselInterval();
});

watch(() => settings.value['blog.cover'], () => {
    stopCarouselInterval();
    startCarouselInterval();
}, { deep: true });

watch(() => posts.value.length, async () => {
    await nextTick();
});

// Performance optimization: compute ad states once
const adStates = computed(() => ({
    showHeaderAd: adSettings.value.enableAds && adSettings.value.homePageHeader,
    showInContentAd: adSettings.value.enableAds,
    showAfterPostsAd: adSettings.value.enableAds && adSettings.value.homePageAfterPosts,
    showSidebarTopAd: adSettings.value.enableAds && adSettings.value.homePageSidebarTop,
    showSidebarMidAd: adSettings.value.enableAds && adSettings.value.homePageSidebarMid,
    showSidebarBottomAd: adSettings.value.enableAds && adSettings.value.homePageSidebarBottom,
    showTaboolaAds: adSettings.value.enableAds && adSettings.value.enableTaboolaAds && adSettings.value.taboolaJsCode
}));
</script>

<style scoped>
@media (max-width: 1280px) {
    .ad-sidebar-left {
        display: none;
    }
}

/* line-clamp removido para evitar truncamento duplo */

.ad-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ccc;
    border-radius: 4px;
}


</style>


