<template>
    <div class="w-full max-w-[1400px] mx-auto px-3 sm:px-4">
        <div v-if="error" class="text-center py-16 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-2xl font-bold mb-2 text-gray-800">Erro ao carregar posts</h2>
            <p class="text-gray-600 mb-4">Não foi possível carregar os posts. Por favor, tente novamente.</p>
            <button @click="loadPosts" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
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
            <section v-if="posts.length > 0" class="mb-4 md:block hidden">
                <!-- Full Layout (default) -->
                <div v-if="coverSettings.layoutType === 'full' || !coverSettings.layoutType" class="bg-white rounded-lg overflow-hidden shadow-md">
                    <a v-if="coverPosts.full" :href="`/post/${coverPosts.full.slug}`" class="block">
                        <div class="relative h-[300px] sm:h-[350px] md:h-[400px]">
                            <img
                                v-if="coverPosts.full && coverPosts.full.featureImage"
                                :src="coverPosts.full.featureImage"
                                :alt="coverPosts.full.title"
                                class="w-full h-full object-cover"
                                loading="lazy"
                                width="890"
                                height="606"
                                :title="coverPosts.full.title"
                                aria-label="Cover Image"
                                fetchpriority="high"
                            />
                            <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="coverPosts.full && coverPosts.full.categories && coverPosts.full.categories.length > 0" class="mb-2 flex flex-wrap gap-2">
                                    <span v-for="category in coverPosts.full.categories" :key="category.id" class="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                                        {{ category.name }}
                                    </span>
                                </div>
                                <h2 v-if="coverPosts.full" class="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.full.title }}</h2>
                                <p v-if="coverPosts.full" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                    {{ coverPosts.full.excerpt || stripHtml(coverPosts.full.content).substring(0, 150) + '...' }}
                                </p>
                                <span class="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors">
                                    Continuar lendo
                                </span>
                            </div>
                        </div>
                    </a>
                </div>

                <!-- Carousel Layout -->
                <div v-else-if="coverSettings.layoutType === 'carousel'" class="bg-white rounded-lg overflow-hidden shadow-md">
                    <div class="relative h-[300px] sm:h-[350px] md:h-[400px]">
                        <div v-for="(post, index) in coverPosts.carousel" :key="post.id"
                             class="absolute w-full h-full transition-opacity duration-500 ease-in-out"
                             :class="{ 'opacity-100': currentCarouselIndex === index, 'opacity-0': currentCarouselIndex !== index }">
                            <a :href="`/post/${post.slug}`" class="block h-full">
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
                                <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="post.categories && post.categories.length > 0" class="mb-2 flex flex-wrap gap-2">
                                        <span v-for="category in post.categories" :key="category.id" class="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                                            {{ category.name }}
                                        </span>
                                    </div>
                                    <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                                    <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                        {{ post.excerpt || stripHtml(post.content).substring(0, 150) + '...' }}
                                    </p>
                                    <span class="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors">
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
                            <div class="relative h-[300px] md:h-full">
                                <img
                                    v-if="coverPosts.splitMain && coverPosts.splitMain.featureImage"
                                    :src="coverPosts.splitMain.featureImage"
                                    :alt="coverPosts.splitMain.title"
                                    class="w-full h-full object-cover"
                                    loading="lazy"
                                    width="890"
                                    height="606"
                                    :title="coverPosts.splitMain.title"
                                    aria-label="Cover Image"
                                    fetchpriority="high"
                                />
                                <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="coverPosts.splitMain && coverPosts.splitMain.categories && coverPosts.splitMain.categories.length > 0" class="mb-2 flex flex-wrap gap-2">
                                        <span v-for="category in coverPosts.splitMain.categories" :key="category.id" class="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                                            {{ category.name }}
                                        </span>
                                    </div>
                                    <h2 v-if="coverPosts.splitMain" class="text-lg sm:text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.splitMain.title }}</h2>
                                    <p v-if="coverPosts.splitMain" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                        {{ coverPosts.splitMain.excerpt || stripHtml(coverPosts.splitMain.content).substring(0, 150) + '...' }}
                                    </p>
                                    <span class="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors">
                                        Continuar lendo
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="md:col-span-1 flex flex-col gap-4">
                        <div v-for="(post, index) in coverPosts.splitSide" :key="post.id" class="flex-1 bg-white rounded-lg overflow-hidden shadow-md">
                            <a :href="`/post/${post.slug}`" class="block h-full">
                                <div class="relative h-[200px] md:h-full">
                                    <img
                                        v-if="post.featureImage"
                                        :src="post.featureImage"
                                        :alt="post.title"
                                        class="w-full h-full object-cover"
                                    />
                                    <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                        <div v-if="post.categories && post.categories.length > 0" class="mb-1 sm:mb-2 flex flex-wrap gap-1">
                                            <span v-for="category in post.categories" :key="category.id" class="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                                                {{ category.name }}
                                            </span>
                                        </div>
                                        <h3 class="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h3>
                                        <span class="text-xs sm:text-sm text-white hover:text-red-400 transition-colors drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 px-2 py-1 rounded inline-block">
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
                            <div class="relative h-[250px] sm:h-[300px] md:h-[350px]">
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
                                <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="post.categories && post.categories.length > 0" class="mb-2 flex flex-wrap gap-2">
                                        <span v-for="category in post.categories" :key="category.id" class="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                                            {{ category.name }}
                                        </span>
                                    </div>
                                    <h2 class="text-lg sm:text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                                    <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                        {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                    </p>
                                    <span class="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors">
                                        Continuar lendo
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            <!-- Top AdSense Banner -->
            <div v-if="adSettings.enableAds && adSettings.homePageHeader" class="w-full bg-gray-100 rounded-lg mb-4 overflow-hidden flex justify-center">
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
                <aside class="xl:w-[160px] shrink-0 hidden xl:block" v-if="adSettings.enableAds">
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
                    <!-- Main Content in 2 Columns -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <!-- Left Column (Latest News) -->
                        <div class="lg:col-span-2">
                            <!-- Popular Posts Carousel (Desktop Only) -->
                            <div class="hidden lg:block mb-8">
                                <h2 class="text-xl font-bold mb-4 pb-2 text-red-600 border-b-2 border-black flex items-center">
                                    <span class="mr-2">🔥</span> Mais Populares
                                </h2>
                                
                                <div class="relative bg-white rounded-lg shadow-md overflow-hidden">
                                    <!-- Container do carrossel -->
                                    <div 
                                        class="flex transition-transform duration-500 ease-in-out cursor-grab active:cursor-grabbing select-none"
                                        :style="{ transform: `translateX(-${currentPopularIndex * 100}%)` }"
                                        @mousedown="startPopularDrag"
                                        @touchstart="startPopularDrag"
                                        @mousemove="onPopularDrag"
                                        @touchmove="onPopularDrag"
                                        @mouseup="endPopularDrag"
                                        @touchend="endPopularDrag"
                                        @mouseleave="endPopularDrag"
                                        @dragstart.prevent
                                    >
                                        <div
                                            v-for="post in popularPosts.slice(0, 5)"
                                            :key="post.id"
                                            class="w-full flex-shrink-0 p-4"
                                        >
                                            <div class="flex gap-4 h-32">
                                                <!-- Imagem -->
                                                <div class="w-48 h-32 overflow-hidden rounded-lg flex-shrink-0">
                                                    <a :href="`/post/${post.slug}`" class="block w-full h-full">
                                                        <img
                                                            v-if="post.featureImage || post.image"
                                                            :src="post.featureImage || post.image"
                                                            :alt="post.title"
                                                            class="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                                                            loading="lazy"
                                                        />
                                                        <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                </div>
                                                <!-- Conteúdo -->
                                                <div class="flex-1 flex flex-col justify-center min-w-0">
                                                    <a :href="`/post/${post.slug}`" class="block group">
                                                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2 mb-2">
                                                            {{ post.title }}
                                                        </h3>
                                                        <p class="text-gray-600 text-sm line-clamp-2 mb-3">
                                                            {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                                        </p>
                                                        <span class="text-xs text-gray-500">
                                                            {{ formatDate(post.publishedAt) }}
                                                        </span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Controles de navegação -->
                                    <div v-if="popularPosts.length > 1" class="absolute top-0 bottom-0 left-0 flex items-center">
                                        <button 
                                            @click="prevPopularSlide" 
                                            class="bg-black/50 hover:bg-black/70 text-white p-2 rounded-r-md focus:outline-none z-10 transition-colors ml-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div v-if="popularPosts.length > 1" class="absolute top-0 bottom-0 right-0 flex items-center">
                                        <button 
                                            @click="nextPopularSlideManual" 
                                            class="bg-black/50 hover:bg-black/70 text-white p-2 rounded-l-md focus:outline-none z-10 transition-colors mr-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <!-- Indicadores de posição -->
                                    <div v-if="popularPosts.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
                                        <button
                                            v-for="(_, index) in popularPosts.slice(0, 5)"
                                            :key="index"
                                            @click="setPopularIndex(index)"
                                            class="w-2 h-2 rounded-full transition-colors"
                                            :class="{ 'bg-red-600': currentPopularIndex === index, 'bg-white/50': currentPopularIndex !== index }"
                                        ></button>
                                    </div>
                                </div>
                            </div>

                            <h2 class="text-xl font-bold mb-4 pb-2 text-red-600 border-b-2 border-black">
                                Últimas Notícias
                            </h2>

                            <!-- Posts Responsivos -->
                            <div class="space-y-4">
                                <a
                                    v-for="post in posts.slice(featuredPost ? 1 : 0, featuredPost ? 5 : 4)"
                                    :key="post.id"
                                    :href="`/post/${post.slug}`"
                                    class="block bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                                >
                                    <!-- Mobile: Layout Vertical -->
                                    <div class="block md:hidden">
                                        <!-- Imagem no topo -->
                                        <div class="w-full h-48 overflow-hidden">
                                            <img
                                                v-if="post.featureImage"
                                                :src="post.featureImage"
                                                :alt="post.title"
                                                class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                            />
                                            <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <!-- Conteúdo embaixo -->
                                        <div class="p-4">
                                            <div v-if="post.categories && post.categories.length > 0" class="mb-2 flex flex-wrap gap-1">
                                                <span v-for="category in post.categories" :key="category.id" class="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-medium">
                                                    {{ category.name }}
                                                </span>
                                            </div>
                                            <h3 class="text-lg font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                                                {{ post.title }}
                                            </h3>
                                            <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {{ post.excerpt || stripHtml(post.content).substring(0, 100) + '...' }}
                                            </p>
                                            <div class="flex justify-between items-center text-xs text-gray-500">
                                                <span v-if="getAuthor(post)" class="truncate mr-2">Por {{ getAuthor(post).name }}</span>
                                                <span class="whitespace-nowrap">{{ formatDate(post.publishedAt) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Desktop: Layout Horizontal -->
                                    <div class="hidden md:flex">
                                        <!-- Imagem à esquerda -->
                                        <div class="w-2/5 h-40 lg:h-48 overflow-hidden">
                                            <img
                                                v-if="post.featureImage"
                                                :src="post.featureImage"
                                                :alt="post.title"
                                                class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                            />
                                            <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <!-- Conteúdo à direita -->
                                        <div class="flex-1 p-4 flex flex-col">
                                            <div v-if="post.categories && post.categories.length > 0" class="mb-2 flex flex-wrap gap-1">
                                                <span v-for="category in post.categories" :key="category.id" class="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-medium">
                                                    {{ category.name }}
                                                </span>
                                            </div>
                                            <h3 class="text-xl lg:text-2xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                                                {{ post.title }}
                                            </h3>
                                            <p class="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
                                                {{ post.excerpt || stripHtml(post.content).substring(0, 150) + '...' }}
                                            </p>
                                            <div class="flex justify-between items-center text-xs text-gray-500 mt-auto">
                                                <span v-if="getAuthor(post)" class="truncate mr-2">Por {{ getAuthor(post).name }}</span>
                                                <span class="whitespace-nowrap">{{ formatDate(post.publishedAt) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>

                            <!-- Mid-content AdSense Banner -->
                            <div v-if="adSettings.enableAds" class="w-full bg-gray-100 rounded-lg my-6 overflow-hidden flex justify-center">
                                <div class="ad-container ad-banner-mid py-2 px-4" v-if="getAdHtml('inContent')">
                                    <div v-html="getAdHtml('inContent')"></div>
                                </div>
                                <div class="ad-container ad-banner-mid py-2 px-4" v-else>
                                    <div class="ad-placeholder h-[90px] w-full max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- More Posts Section -->
                            <div v-if="posts.length > (featuredPost ? 5 : 4)">
                                <h2 class="text-xl font-bold mb-4 pb-2 text-red-600 border-b-2 border-black">
                                    Mais Conteúdo
                                </h2>

                                <div class="space-y-4">
                                    <a
                                        v-for="post in posts.slice(featuredPost ? 5 : 4)"
                                        :key="post.id"
                                        :href="`/post/${post.slug}`"
                                        class="block bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                                    >
                                        <!-- Mobile: Layout Vertical -->
                                        <div class="block md:hidden">
                                            <!-- Imagem no topo -->
                                            <div class="w-full h-48 overflow-hidden">
                                                <img
                                                    v-if="post.featureImage"
                                                    :src="post.featureImage"
                                                    :alt="post.title"
                                                    class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                                />
                                                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <!-- Conteúdo embaixo -->
                                            <div class="p-4">
                                                <div v-if="post.categories && post.categories.length > 0" class="mb-2 flex flex-wrap gap-1">
                                                    <span v-for="category in post.categories" :key="category.id" class="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-medium">
                                                        {{ category.name }}
                                                    </span>
                                                </div>
                                                <h3 class="text-lg font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                                                    {{ post.title }}
                                                </h3>
                                                <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                                                    {{ post.excerpt || stripHtml(post.content).substring(0, 100) + '...' }}
                                                </p>
                                                <div class="flex justify-between items-center text-xs text-gray-500">
                                                    <span v-if="getAuthor(post)" class="truncate mr-2">Por {{ getAuthor(post).name }}</span>
                                                    <span class="whitespace-nowrap">{{ formatDate(post.publishedAt) }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Desktop: Layout Horizontal -->
                                        <div class="hidden md:flex">
                                            <!-- Imagem à esquerda -->
                                            <div class="w-2/5 h-40 lg:h-48 overflow-hidden">
                                                <img
                                                    v-if="post.featureImage"
                                                    :src="post.featureImage"
                                                    :alt="post.title"
                                                    class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                                />
                                                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <!-- Conteúdo à direita -->
                                            <div class="flex-1 p-4 flex flex-col">
                                                <div v-if="post.categories && post.categories.length > 0" class="mb-2 flex flex-wrap gap-1">
                                                    <span v-for="category in post.categories" :key="category.id" class="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-medium">
                                                        {{ category.name }}
                                                    </span>
                                                </div>
                                                <h3 class="text-xl lg:text-2xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                                                    {{ post.title }}
                                                </h3>
                                                <p class="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
                                                    {{ post.excerpt || stripHtml(post.content).substring(0, 150) + '...' }}
                                                </p>
                                                <div class="flex justify-between items-center text-xs text-gray-500 mt-auto">
                                                    <span v-if="getAuthor(post)" class="truncate mr-2">Por {{ getAuthor(post).name }}</span>
                                                    <span class="whitespace-nowrap">{{ formatDate(post.publishedAt) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <!-- Bottom AdSense Banner -->
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

                            <!-- Loading More Indicator -->
                            <div v-if="loadingMore" class="mt-8 flex justify-center items-center py-6">
                                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                                <span class="ml-3 text-gray-600">Carregando mais posts...</span>
                            </div>

                            <!-- Infinite Scroll Observer Target -->
                            <div ref="observerTarget" class="h-4 w-full"></div>
                        </div>

                        <!-- Right Column (Widgets + Ads) -->
                        <div class="lg:col-span-1">
                            <!-- AdSense Rectangle (Top) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarTop" class="bg-gray-100 rounded-lg shadow-md p-2 mb-6 flex justify-center">
                                <div class="ad-container ad-sidebar-top" v-if="getAdHtml('sidebarTop')">
                                    <div v-html="getAdHtml('sidebarTop')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-top" v-else>
                                    <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>



                            <!-- AdSense Rectangle (Middle) -->
                            <div class="bg-gray-100 rounded-lg shadow-md p-2 mb-6 flex justify-center">
                                <div class="ad-container ad-sidebar-mid" v-if="getAdHtml('sidebarMid')">
                                    <div v-html="getAdHtml('sidebarMid')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-mid" v-else>
                                    <div class="ad-placeholder h-[250px] w-[300px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- AdSense Rectangle (Bottom) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarBottom" class="bg-gray-100 rounded-lg shadow-md p-2 mb-6 flex justify-center">
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { usePostsStore } from '../../store/posts';
import { useMostAccessedPostsStore } from '../../store/mostaccessed';
import { formatDate, stripHtml } from '../../composables/useUtils';
import { useAds } from '../../composables/useAds';

// Declare adsbygoogle for TypeScript
declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

const settingsStore = useSettingsStore();
const postsStore = usePostsStore();
const mostAccessedStore = useMostAccessedPostsStore();
const blogAPI = vue3.useBlog();

// State
const rawSettings = computed(() => settingsStore.getSettings);
const settings = computed<Record<string, any>>(() => {
    const settingsObj = rawSettings.value || {};
    // Extract all blog.* settings
    const blogSettings: Record<string, any> = {};
    Object.keys(settingsObj).forEach(key => {
        if (key.startsWith('blog.')) {
            const shortKey = key.replace('blog.', '');
            blogSettings[shortKey] = settingsObj[key];
        }
    });
    return blogSettings;
});
const posts = ref<any[]>(postsStore.getPosts || []);
const popularPosts = computed(() => {
    const mostAccessed = mostAccessedStore.getMostAccessedPosts || [];
    // Se não há posts populares, usa os posts normais como fallback
    return mostAccessed.length > 0 ? mostAccessed : posts.value.slice(0, 5);
});
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(null);
const currentPage = ref(0);
const hasMorePosts = ref(true);
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);
const currentCarouselIndex = ref(0);
const carouselInterval = ref<number | null>(null);
const currentPopularIndex = ref(0);
const popularInterval = ref<number | null>(null);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragCurrentX = ref(0);
const isPopularDragging = ref(false);
const popularDragStartX = ref(0);
const popularDragCurrentX = ref(0);

// Elements references
const sidebarLeftAdContainer = ref<HTMLElement | null>(null);

// Create formatted settings object for useAds
const adPluginSettings = computed(() => {
    return settings.value || {};
});

// Set up ads functionality using the composable
const { adSettings, getAdHtml, loadAdScripts, loadSidebarLeftAd } = useAds(adPluginSettings.value, 'home');

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

const startPopularInterval = () => {
    if (popularPosts.value.length > 1) {
        popularInterval.value = window.setInterval(() => {
            nextPopularSlide();
        }, 10000); // 10 segundos
    }
};

const stopPopularInterval = () => {
    if (popularInterval.value) {
        clearInterval(popularInterval.value);
        popularInterval.value = null;
    }
};

const nextPopularSlide = () => {
    if (popularPosts.value.length > 1) {
        const maxIndex = Math.min(popularPosts.value.length - 1, 4);
        currentPopularIndex.value = (currentPopularIndex.value + 1) % (maxIndex + 1);
    }
};

const setPopularIndex = (index: number) => {
    stopPopularInterval();
    currentPopularIndex.value = index;
    startPopularInterval();
};

const startDrag = (e: MouseEvent | TouchEvent) => {
    isDragging.value = true;
    stopPopularInterval();
    
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    dragStartX.value = clientX;
    dragCurrentX.value = clientX;
    
    e.preventDefault();
};

const onDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return;
    
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    dragCurrentX.value = clientX;
    
    e.preventDefault();
};

const endDrag = () => {
    if (!isDragging.value) return;
    
    const dragDistance = dragCurrentX.value - dragStartX.value;
    const threshold = 50; // Minimum drag distance to trigger navigation
    
    if (Math.abs(dragDistance) > threshold) {
        if (dragDistance > 0 && currentPopularIndex.value > 0) {
            // Dragged right - go to previous
            currentPopularIndex.value--;
        } else if (dragDistance < 0 && currentPopularIndex.value < popularPosts.value.length - 1) {
            // Dragged left - go to next
            currentPopularIndex.value++;
        }
    }
    
    isDragging.value = false;
    startPopularInterval();
};

const prevPopularSlide = () => {
    stopPopularInterval();
    const maxIndex = Math.min(popularPosts.value.length - 1, 4);
    if (currentPopularIndex.value > 0) {
        currentPopularIndex.value--;
    } else {
        currentPopularIndex.value = maxIndex;
    }
    startPopularInterval();
};

const nextPopularSlideManual = () => {
    stopPopularInterval();
    const maxIndex = Math.min(popularPosts.value.length - 1, 4);
    if (currentPopularIndex.value < maxIndex) {
        currentPopularIndex.value++;
    } else {
        currentPopularIndex.value = 0;
    }
    startPopularInterval();
};

const startPopularDrag = (e: MouseEvent | TouchEvent) => {
    isPopularDragging.value = true;
    stopPopularInterval();
    
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    popularDragStartX.value = clientX;
    popularDragCurrentX.value = clientX;
    
    e.preventDefault();
};

const onPopularDrag = (e: MouseEvent | TouchEvent) => {
    if (!isPopularDragging.value) return;
    
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    popularDragCurrentX.value = clientX;
    
    e.preventDefault();
};

const endPopularDrag = () => {
    if (!isPopularDragging.value) return;
    
    const dragDistance = popularDragCurrentX.value - popularDragStartX.value;
    const threshold = 50; // Minimum drag distance to trigger navigation
    
    if (Math.abs(dragDistance) > threshold) {
        const maxIndex = Math.min(popularPosts.value.length - 1, 4);
        if (dragDistance > 0) {
            // Dragged right - go to previous (with loop)
            if (currentPopularIndex.value > 0) {
                currentPopularIndex.value--;
            } else {
                currentPopularIndex.value = maxIndex;
            }
        } else if (dragDistance < 0) {
            // Dragged left - go to next (with loop)
            if (currentPopularIndex.value < maxIndex) {
                currentPopularIndex.value++;
            } else {
                currentPopularIndex.value = 0;
            }
        }
    }
    
    isPopularDragging.value = false;
    startPopularInterval();
};

const headData = ref({
    title: settings.value.title,
    meta: [
        { name: 'description', content: settings.value.description },
        { name: 'keywords', content: settings.value.keywords },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: settings.value.title },
        { property: 'og:description', content: settings.value.description },
        { property: 'og:image', content: settings.value.logo }
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
/*
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
*/
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
            /*
            if (!categories.value.length) {
                try {
                    const categoriesResponse = await blogAPI.categories.getAll();
                    if (categoriesResponse) {
                        categories.value = categoriesResponse;
                    }
                } catch (err) {
                    console.error('Failed to load categories:', err);
                }
            }*/
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
    loading.value = false;
    setupIntersectionObserver();
    startCarouselInterval();
    startPopularInterval();

    // Load ad scripts and sidebar left ad
    loadAdScripts();
    loadSidebarLeftAd(sidebarLeftAdContainer.value);
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }
    stopCarouselInterval();
    stopPopularInterval();
});

watch(() => settings.value['blog.cover'], () => {
    stopCarouselInterval();
    startCarouselInterval();
}, { deep: true });


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

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
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




</style>


