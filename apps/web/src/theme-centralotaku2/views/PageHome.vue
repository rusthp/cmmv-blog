<template>
    <div class="w-full max-w-[1200px] mx-auto px-2 sm:px-4 overflow-x-hidden">
        <div v-if="error" class="text-center py-8 sm:py-16 bg-white rounded-lg shadow-md mx-2 sm:mx-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl sm:text-2xl font-bold mb-2 text-gray-800">Erro ao carregar posts</h2>
            <p class="text-gray-600 mb-4 px-4">Não foi possível carregar os posts. Por favor, tente novamente.</p>
            <button @click="loadPosts" class="px-4 py-2 bg-[#dc2626] text-white rounded-md hover:bg-[#dc2626] transition-colors">
                Tentar novamente
            </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="posts.length === 0" class="text-center py-8 sm:py-16 bg-white rounded-lg shadow-md mx-2 sm:mx-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl sm:text-2xl font-bold mb-2 text-gray-800">Nenhum post encontrado</h2>
            <p class="text-gray-600 px-4">Volte mais tarde para novos conteúdos!</p>
        </div>

        <div v-else class="overflow-x-hidden">
            <!-- Cover Section -->
            <section v-if="posts.length > 0" class="mb-4 sm:mb-6 md:mb-8 hidden sm:block">
                <!-- Full Layout (default) -->
                <div v-if="coverSettings.layoutType === 'full' || !coverSettings.layoutType" class="bg-white rounded-lg overflow-hidden shadow-md">
                    <a v-if="coverPosts.full" :href="`/post/${coverPosts.full.slug}`" class="block">
                        <div class="relative h-[200px] sm:h-[300px] md:h-[400px]">
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
                            <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="coverPosts.full && coverPosts.full.categories && coverPosts.full.categories.length > 0" class="mb-2">
                                    <span class="bg-[#dc2626] text-[#ffffff] px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium">
                                        {{ coverPosts.full.categories[0].name }}
                                    </span>
                                </div>
                                <h2 v-if="coverPosts.full" class="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.full.title }}</h2>
                                <p v-if="coverPosts.full" class="text-gray-100 mb-3 sm:mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-full md:max-w-2xl text-xs sm:text-sm md:text-base">
                                    {{ coverPosts.full.excerpt || stripHtml(coverPosts.full.content).substring(0, 150) + '...' }}
                                </p>
                                <span class="inline-block bg-[#dc2626] hover:bg-[#dc2626] text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm md:text-base">
                                    Continuar lendo
                                </span>
                            </div>
                        </div>
                    </a>
                </div>

                <!-- Carousel Layout -->
                <div v-else-if="coverSettings.layoutType === 'carousel'" class="bg-white rounded-lg overflow-hidden shadow-md">
                    <div class="relative h-[200px] sm:h-[300px] md:h-[400px]">
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
                                    priority="high"
                                    icon-size="lg"
                                />
                                <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                        <span class="bg-[#dc2626] text-[#ffffff] px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium">
                                            {{ post.categories[0].name }}
                                        </span>
                                    </div>
                                    <h2 class="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                                    <p class="text-gray-100 mb-3 sm:mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-full md:max-w-2xl text-xs sm:text-sm md:text-base">
                                        {{ post.excerpt || stripHtml(post.content).substring(0, 150) + '...' }}
                                    </p>
                                    <span class="inline-block bg-[#dc2626] hover:bg-[#dc2626] text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm md:text-base">
                                        Continuar lendo
                                    </span>
                                </div>
                            </a>
                        </div>

                        <!-- Carousel Controls -->
                        <div class="absolute top-0 bottom-0 left-0 flex items-center">
                            <button @click="prevCarouselSlide" class="bg-black/30 hover:bg-black/50 text-white p-1 sm:p-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-red-500 z-10" aria-label="Slide anterior">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                        <div class="absolute top-0 bottom-0 right-0 flex items-center">
                            <button @click="nextCarouselSlide" class="bg-black/30 hover:bg-black/50 text-white p-1 sm:p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500 z-10" aria-label="Próximo slide">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <!-- Carousel Indicators -->
                        <div class="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-10" role="tablist" aria-label="Controles do carrossel">
                            <button
                                v-for="(_, index) in coverPosts.carousel"
                                :key="index"
                                @click="currentCarouselIndex = index"
                                class="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                :class="{ 'bg-white': currentCarouselIndex === index }"
                                role="tab"
                                :aria-selected="currentCarouselIndex === index"
                                :aria-label="`Slide ${index + 1}`"
                            ></button>
                        </div>
                    </div>
                </div>

                <!-- Split Layout (1 large, 2 small) -->
                <div v-else-if="coverSettings.layoutType === 'split'" class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div class="md:col-span-2 bg-white rounded-lg overflow-hidden shadow-md">
                        <a v-if="coverPosts.splitMain" :href="`/post/${coverPosts.splitMain.slug}`" class="block h-full">
                            <div class="relative h-[200px] md:h-[300px] lg:h-full">
                                <OptimizedImage
                                    :src="coverPosts.splitMain?.featureImage"
                                    :alt="coverPosts.splitMain?.title"
                                    :title="coverPosts.splitMain?.title"
                                    aria-label="Cover Image"
                                    width="890"
                                    height="606"
                                    priority="high"
                                    icon-size="lg"
                                />
                                <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="coverPosts.splitMain && coverPosts.splitMain.categories && coverPosts.splitMain.categories.length > 0" class="mb-2">
                                        <span class="bg-[#dc2626] text-[#ffffff] px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium">
                                            {{ coverPosts.splitMain.categories[0].name }}
                                        </span>
                                    </div>
                                    <h2 v-if="coverPosts.splitMain" class="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.splitMain.title }}</h2>
                                    <p v-if="coverPosts.splitMain" class="text-gray-100 mb-3 sm:mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-full md:max-w-2xl text-xs sm:text-sm md:text-base">
                                        {{ coverPosts.splitMain.excerpt || stripHtml(coverPosts.splitMain.content).substring(0, 150) + '...' }}
                                    </p>
                                    <span class="inline-block bg-[#dc2626] hover:bg-[#dc2626] text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm md:text-base">
                                        Continuar lendo
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="md:col-span-1 flex flex-col gap-3 sm:gap-4">
                        <div v-for="(post, index) in coverPosts.splitSide" :key="post.id" class="flex-1 bg-white rounded-lg overflow-hidden shadow-md min-h-[150px] sm:min-h-[200px]">
                            <a :href="`/post/${post.slug}`" class="block h-full">
                                <div class="relative h-full">
                                    <OptimizedImage
                                        :src="post.featureImage"
                                        :alt="post.title"
                                        icon-size="md"
                                    />
                                    <div class="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                        <div v-if="post.categories && post.categories.length > 0" class="mb-1 sm:mb-2">
                                            <span class="bg-[#dc2626] text-[#ffffff] px-1 sm:px-2 py-1 rounded-md text-xs font-medium">
                                                {{ post.categories[0].name }}
                                            </span>
                                        </div>
                                        <h3 class="text-xs sm:text-sm md:text-base font-bold mb-1 sm:mb-2 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded line-clamp-2">{{ post.title }}</h3>
                                        <span class="text-xs text-white hover:text-[#dc2626] transition-colors drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 px-2 py-1 rounded inline-block">
                                            Continuar lendo &rarr;
                                        </span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Dual Layout (2 equal columns) -->
                <div v-else-if="coverSettings.layoutType === 'dual'" class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div v-for="post in coverPosts.dual" :key="post.id" class="bg-white rounded-lg overflow-hidden shadow-md">
                        <a :href="`/post/${post.slug}`" class="block">
                            <div class="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px]">
                                <OptimizedImage
                                    :src="post.featureImage"
                                    :alt="post.title"
                                    :title="post.title"
                                    aria-label="Cover Image"
                                    width="890"
                                    height="606"
                                    priority="high"
                                    icon-size="lg"
                                />
                                <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                        <span class="bg-[#dc2626] text-[#ffffff] px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium">
                                            {{ post.categories[0].name }}
                                        </span>
                                    </div>
                                    <h2 class="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                                    <p class="text-gray-100 mb-3 sm:mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-full text-xs sm:text-sm md:text-base">
                                        {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                    </p>
                                    <span class="inline-block bg-[#dc2626] hover:bg-[#dc2626] text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm md:text-base">
                                        Continuar lendo
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            <!-- Top AdSense Banner -->
            <div v-if="adSettings.enableAds && adSettings.homePageHeader" class="w-full bg-gray-100 rounded-lg mb-4 sm:mb-6 md:mb-8 overflow-hidden flex justify-center mx-2 sm:mx-0">
                <div class="ad-container ad-banner-top py-2 px-2 sm:px-4 w-full max-w-full" v-if="getAdHtml('header')">
                    <div v-html="getAdHtml('header')"></div>
                </div>
                <div class="ad-container ad-banner-top py-2 px-2 sm:px-4 w-full max-w-full" v-else>
                    <div class="ad-placeholder h-[70px] sm:h-[90px] w-full max-w-[280px] sm:max-w-[320px] md:max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm mx-auto">
                        <span>Anúncio</span>
                    </div>
                </div>
            </div>

            <!-- Main Content Layout -->
            <div class="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
                <div class="flex-grow min-w-0">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        <div class="lg:col-span-2 min-w-0">
                            <h2 class="text-lg sm:text-xl font-bold mb-4 sm:mb-6 pb-2 text-[#dc2626] border-b-2 border-[#FFFF] px-2 sm:px-0">
                                Últimas Notícias
                            </h2>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0">
                                <article
                                    v-for="post in posts.slice(featuredPost ? 1 : 0, featuredPost ? 5 : 4)"
                                    :key="post.id"
                                    class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300"
                                >
                                    <a :href="`/post/${post.slug}`" class="block">
                                        <div class="h-32 sm:h-40 md:h-48 overflow-hidden relative">
                                            <OptimizedImage
                                                :src="post.featureImage"
                                                :alt="post.title"
                                                width="360"
                                                height="192"
                                                priority="high"
                                                :hover="true"
                                                icon-size="md"
                                            />
                                            <div v-if="post.categories && post.categories.length > 0" class="absolute top-2 left-2">
                                                <span class="bg-[#dc2626] text-[#ffff] px-2 py-1 rounded-md text-xs font-medium">
                                                    {{ post.categories[0].name }}
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                    <div class="p-3 sm:p-4">
                                        <a :href="`/post/${post.slug}`" class="block">
                                            <h3 class="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 hover:text-[#dc2626] transition-colors line-clamp-2">
                                                {{ post.title }}
                                            </h3>
                                        </a>
                                        <p class="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                                            {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                        </p>
                                        
                                        <!-- Audio Player Widget -->
                                        <AudioPlayer 
                                            v-if="hasAudio(post.content) && extractAudioUrl(post.content)"
                                            :src="extractAudioUrl(post.content)!"
                                            :compact="true"
                                        />
                                        
                                        <div class="flex justify-between items-center text-xs text-gray-500">
                                            <span v-if="getAuthor(post)" class="truncate">Por {{ getAuthor(post).name }}</span>
                                            <span class="flex-shrink-0 ml-2">{{ formatDate(post.publishedAt) }}</span>
                                        </div>
                                    </div>
                                </article>
                            </div>

                            <!-- Mid-content AdSense Banner -->
                            <div v-if="adSettings.enableAds" class="w-full bg-gray-100 rounded-lg my-4 sm:my-6 md:my-8 overflow-hidden flex justify-center">
                                <div class="ad-container ad-banner-mid py-2 px-2 sm:px-4 w-full max-w-full" v-if="getAdHtml('inContent')">
                                    <div v-html="getAdHtml('inContent')"></div>
                                </div>
                                <div class="ad-container ad-banner-mid py-2 px-2 sm:px-4 w-full max-w-full" v-else>
                                    <div class="ad-placeholder h-[70px] sm:h-[90px] w-full max-w-[280px] sm:max-w-[320px] md:max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm mx-auto">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="posts.length > (featuredPost ? 5 : 4)">
                                <h2 class="text-lg sm:text-xl font-bold mb-4 sm:mb-6 pb-2 text-[#dc2626] border-b-2 border-[#FFFF] px-2 sm:px-0">
                                    Mais Conteúdo
                                </h2>

                                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0">
                                    <article
                                        v-for="post in posts.slice(featuredPost ? 5 : 4)"
                                        :key="post.id"
                                        class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300"
                                    >
                                        <a :href="`/post/${post.slug}`" class="block">
                                            <div class="h-32 sm:h-40 md:h-48 overflow-hidden relative">
                                                <OptimizedImage
                                                    :src="post.featureImage"
                                                    :alt="post.title"
                                                    width="360"
                                                    height="192"
                                                    :hover="true"
                                                    icon-size="md"
                                                />
                                                <div v-if="post.categories && post.categories.length > 0" class="absolute top-2 left-2">
                                                    <span class="bg-[#dc2626] text-[#ffffff] px-2 py-1 rounded-md text-xs font-medium">
                                                        {{ post.categories[0].name }}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                        <div class="p-3 sm:p-4">
                                            <a :href="`/post/${post.slug}`" class="block">
                                                <h3 class="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 hover:text-[#dc2626] transition-colors line-clamp-2">
                                                    {{ post.title }}
                                                </h3>
                                            </a>
                                            <p class="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                                                {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                            </p>
                                            
                                            <!-- Audio Player Widget -->
                                            <AudioPlayer 
                                                v-if="hasAudio(post.content) && extractAudioUrl(post.content)"
                                                :src="extractAudioUrl(post.content)!"
                                                :compact="true"
                                            />
                                            
                                            <div class="flex justify-between items-center text-xs text-gray-500">
                                                <span v-if="getAuthor(post)" class="truncate">Por {{ getAuthor(post).name }}</span>
                                                <span class="flex-shrink-0 ml-2">{{ formatDate(post.publishedAt) }}</span>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            </div>

                            <div v-if="adSettings.enableAds && adSettings.homePageAfterPosts" class="w-full bg-gray-100 rounded-lg mt-4 sm:mt-6 md:mt-8 mb-4 overflow-hidden flex justify-center">
                                <div class="ad-container ad-banner-bottom py-2 px-2 sm:px-4 w-full max-w-full" v-if="getAdHtml('belowContent')">
                                    <div v-html="getAdHtml('belowContent')"></div>
                                </div>
                                <div class="ad-container ad-banner-bottom py-2 px-2 sm:px-4 w-full max-w-full" v-else>
                                    <div class="ad-placeholder h-[70px] sm:h-[90px] w-full max-w-[280px] sm:max-w-[320px] md:max-w-[728px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm mx-auto">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="loadingMore" class="mt-4 sm:mt-6 md:mt-8 flex justify-center items-center py-6">
                                <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-[#dc2626]"></div>
                                <span class="ml-3 text-gray-600 text-sm sm:text-base">Carregando mais posts...</span>
                            </div>

                            <div ref="observerTarget" class="h-4 w-full"></div>
                        </div>

                        <!-- Right Column (Widgets + Ads) -->
                        <div class="lg:col-span-1 w-full lg:max-w-[320px] px-2 sm:px-0 min-w-0">
                            <!-- AdSense Rectangle (Top) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarTop" class="bg-gray-100 rounded-lg p-2 mb-4 sm:mb-6 flex justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]" aria-label="Publicidade" aria-hidden="true">
                                <div class="ad-container ad-sidebar-top w-full max-w-full" v-if="getAdHtml('sidebarTop')">
                                    <div v-html="getAdHtml('sidebarTop')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-top w-full max-w-full" v-else>
                                    <div class="ad-placeholder h-[180px] sm:h-[200px] md:h-[250px] w-full max-w-[280px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm mx-auto">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Popular Posts Widget -->
                            <div class="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-5 mb-4 sm:mb-6">
                                <h2 class="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 pb-2 text-[#dc2626] border-b-2 border-[#000]" id="popular-posts">
                                    Mais Populares
                                </h2>

                                <div class="space-y-3 sm:space-y-4" aria-labelledby="popular-posts">
                                    <div
                                        v-for="post in popularPosts"
                                        :key="post.id"
                                        class="flex gap-2 sm:gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                                    >
                                        <div class="w-12 sm:w-16 md:w-20 h-10 sm:h-12 md:h-16 flex-shrink-0 overflow-hidden rounded-md">
                                            <a :href="`/post/${post.slug}`" :aria-label="'Ver post: ' + post.title">
                                                <OptimizedImage
                                                    :src="post.image"
                                                    :alt="post.title"
                                                    width="80"
                                                    height="64"
                                                    icon-size="sm"
                                                />
                                            </a>
                                        </div>
                                        <div class="flex-grow min-w-0">
                                            <a :href="`/post/${post.slug}`" class="block">
                                                <h4 class="text-xs sm:text-sm font-semibold text-gray-800 hover:text-[#dc2626] transition-colors line-clamp-2">
                                                    {{ post.title }}
                                                </h4>
                                            </a>
                                            
                                            <!-- Compact Audio Player for sidebar -->
                                            <div v-if="hasAudio(post.content) && extractAudioUrl(post.content)" class="mt-2">
                                                <div class="flex items-center gap-2 bg-gray-50 rounded p-1 sm:p-2">
                                                    <button
                                                        @click="toggleAudio(post.id, extractAudioUrl(post.content)!)"
                                                        class="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors text-xs"
                                                        :aria-label="'Reproduzir áudio de ' + post.title"
                                                    >
                                                        <svg class="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z"/>
                                                        </svg>
                                                    </button>
                                                    <span class="text-xs text-gray-600 truncate">🎵 Áudio disponível</span>
                                                </div>
                                            </div>
                                            
                                            <span class="text-xs text-gray-500 mt-1 block">
                                                {{ formatDate(post.publishedAt) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- AdSense Rectangle (Middle) -->
                            <div class="bg-gray-100 rounded-lg p-2 mb-4 sm:mb-6 flex justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]">
                                <div class="ad-container ad-sidebar-mid w-full max-w-full" v-if="getAdHtml('sidebarMid')">
                                    <div v-html="getAdHtml('sidebarMid')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-mid w-full max-w-full" v-else>
                                    <div class="ad-placeholder h-[180px] sm:h-[200px] md:h-[250px] w-full max-w-[280px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm mx-auto">
                                        <span>Anúncio</span>
                                    </div>
                                </div>
                            </div>

                            <!-- AdSense Rectangle (Bottom) -->
                            <div v-if="adSettings.enableAds && adSettings.homePageSidebarBottom" class="bg-gray-100 rounded-lg p-2 mb-4 sm:mb-6 flex justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]">
                                <div class="ad-container ad-sidebar-bottom w-full max-w-full" v-if="getAdHtml('sidebarBottom')">
                                    <div v-html="getAdHtml('sidebarBottom')"></div>
                                </div>
                                <div class="ad-container ad-sidebar-bottom w-full max-w-full" v-else>
                                    <div class="ad-placeholder h-[180px] sm:h-[200px] md:h-[250px] w-full max-w-[280px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm mx-auto">
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
import { formatDate, stripHtml, hasAudio, extractAudioUrl } from '../../composables/useUtils';
import { useAds } from '../../composables/useAds';
import OptimizedImage from '../../components/OptimizedImage.vue';
import AudioPlayer from '../../components/AudioPlayer.vue';

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
const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);
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
            // Atualizar o store com os posts
            postsStore.setPosts(response.posts);
            posts.value = postsStore.getPosts;

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

        const response: any = await blogAPI.posts.getAll(currentPage.value * pagination.value.limit);

        if (response && response.posts && response.posts.length > 0) {
            // Concatenar diretamente os arrays
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
    if (observerTarget.value) {
        observer.value = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMorePosts.value && !loadingMore.value) {
                    loadMorePosts();
                }
            },
            { threshold: 0.1, rootMargin: '100px 0px' }
        );
        
        observer.value.observe(observerTarget.value);
    }
};

const getAuthor = (post: any) => {
    if (!post.authors || !post.authors.length) return null;
    return post.authors.find((author: any) => author.id === post.author);
};

const currentAudio = ref<HTMLAudioElement | null>(null);

const toggleAudio = (postId: string, audioUrl: string) => {
    // Pausar áudio atual se existir
    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value = null;
    }

    // Criar e reproduzir novo áudio
    const audio = new Audio(audioUrl);
    audio.play().then(() => {
        currentAudio.value = audio;
    }).catch(error => {
        console.error('Erro ao reproduzir áudio:', error);
    });

    // Limpar referência quando terminar
    audio.addEventListener('ended', () => {
        if (currentAudio.value === audio) {
            currentAudio.value = null;
        }
    });
};

// Provide hydrated state to child components
provide('hydrated', hydrated);

onMounted(async () => {
    loading.value = false;
    hydrated.value = true;
    startCarouselInterval();
    loadAdScripts();
    loadSidebarLeftAd(sidebarLeftAdContainer.value);

    await nextTick();
    setupIntersectionObserver();
});

onUnmounted(() => {
    if (observer.value && observerTarget.value) {
        observer.value.unobserve(observerTarget.value);
        observer.value.disconnect();
    }

    stopCarouselInterval();
    
    // Pausar áudio se estiver tocando
    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value = null;
    }
});

watch(() => settings.value['blog.cover'], () => {
    stopCarouselInterval();
    startCarouselInterval();
}, { deep: true });

watch(() => posts.value.length, async () => {
    await nextTick();
});
</script>

<style scoped>
/* Prevent horizontal overflow */
* {
    max-width: 100%;
    box-sizing: border-box;
}

@media (max-width: 1280px) {
    .ad-sidebar-left {
        display: none;
    }
}

/* Responsive utilities */
@media (max-width: 640px) {
    .lg\:grid-cols-3 {
        grid-template-columns: 1fr !important;
    }
    
    .lg\:col-span-2 {
        grid-column: span 1 !important;
    }
    
    .lg\:col-span-1 {
        grid-column: span 1 !important;
    }
    
    .md\:grid-cols-3 {
        grid-template-columns: 1fr !important;
    }
    
    .md\:col-span-2 {
        grid-column: span 1 !important;
    }
    
    .md\:col-span-1 {
        grid-column: span 1 !important;
    }
    
    .md\:grid-cols-2 {
        grid-template-columns: 1fr !important;
    }
}

/* Tablet optimizations */
@media (min-width: 641px) and (max-width: 1023px) {
    .lg\:grid-cols-3 {
        grid-template-columns: 1fr !important;
    }
    
    .lg\:col-span-2 {
        grid-column: span 1 !important;
    }
    
    .lg\:col-span-1 {
        grid-column: span 1 !important;
    }
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    word-break: break-word;
}

.ad-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ccc;
    border-radius: 4px;
    max-width: 100%;
}

/* Prevent text overflow */
.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Mobile optimizations */
@media (max-width: 640px) {
    .transform {
        transform: none !important;
    }
    
    .hover\:-translate-y-1:hover {
        transform: none !important;
    }
    
    /* Ensure images don't break layout */
    img {
        max-width: 100%;
        height: auto;
    }
    
    /* Prevent content from being too narrow */
    .min-w-0 {
        min-width: 0;
    }
}

/* Touch optimizations */
@media (hover: none) and (pointer: coarse) {
    .hover\:shadow-lg:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .transform {
        transform: none;
    }
    
    .hover\:-translate-y-1:hover {
        transform: none;
    }
}

/* Flexbox improvements for responsive layout */
@media (max-width: 1023px) {
    .flex-grow {
        flex: 1;
        min-width: 0;
    }
    
    .flex-shrink-0 {
        flex-shrink: 0;
    }
}

/* Grid improvements */
@media (max-width: 1023px) {
    .grid {
        display: grid;
        gap: 1rem;
    }
    
    .gap-3 {
        gap: 0.75rem;
    }
    
    .gap-4 {
        gap: 1rem;
    }
}

/* Custom breakpoint for navbar visibility at 1690px */
@media (max-width: 1689px) {
    .navbar-mobile-trigger {
        display: block !important;
    }
    
    .navbar-desktop-sidebar:not(.translate-x-0) {
        transform: translateX(-100%) !important;
    }
    
    .navbar-mobile-overlay {
        display: block !important;
    }
    
    .content-with-sidebar {
        margin-left: 0 !important;
    }
}

/* Show sidebar by default on large screens */
@media (min-width: 1690px) {
    .navbar-mobile-trigger {
        display: none !important;
    }
    
    .navbar-desktop-sidebar {
        transform: translateX(0) !important;
    }
    
    .navbar-desktop-sidebar.translate-x-0 {
        transform: translateX(0) !important;
    }
    
    .navbar-desktop-sidebar.-translate-x-full {
        transform: translateX(0) !important;
    }
    
    .navbar-mobile-overlay {
        display: none !important;
    }
    
    .content-with-sidebar {
        margin-left: 16rem !important;
    }
}

/* Ensure container doesn't overflow */
.overflow-x-hidden {
    overflow-x: hidden;
}

/* Responsive container */
@media (max-width: 640px) {
    .max-w-\[1200px\] {
        max-width: 100% !important;
    }
}

/* Ad container responsive fixes */
.ad-container {
    max-width: 100%;
    overflow: hidden;
}

@media (max-width: 767px) {
    .ad-container {
        padding: 0.5rem;
    }
}
</style>


