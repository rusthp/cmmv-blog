<template>
    <div class="w-full max-w-[1200px] mx-auto px-4">
        <!-- Cover Section -->
        <section v-if="posts.length > 0" class="mb-8 mt-4 md:block hidden">
            <!-- Full Layout (default) -->
            <div v-if="coverSettings.layoutType === 'full' || !coverSettings.layoutType" class="bg-white rounded-lg overflow-hidden shadow-md">
                <a v-if="coverPosts.full" :href="`/post/${coverPosts.full.slug}`" class="block">
                    <div class="relative h-[400px]">
                        <img
                            v-if="coverPosts.full && coverPosts.full.featureImage"
                            :src="getThumbnailUrl(coverPosts.full.featureImage)"
                            :data-src="coverPosts.full.featureImage"
                            :alt="coverPosts.full.title"
                            class="lazy-image w-full h-full object-cover"
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
                        <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                            <div v-if="coverPosts.full && coverPosts.full.categories && coverPosts.full.categories.length > 0" class="mb-2">
                                <span class="bg-[#ffcc00] text-[#333] px-3 py-1 rounded-md text-sm font-medium">
                                    {{ coverPosts.full.categories[0].name }}
                                </span>
                            </div>
                            <h2 v-if="coverPosts.full" class="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.full.title }}</h2>
                            <p v-if="coverPosts.full" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                {{ coverPosts.full.excerpt || stripHtml(coverPosts.full.content).substring(0, 150) + '...' }}
                            </p>
                            <span class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
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
                            <img
                                v-if="post.featureImage"
                                :src="getThumbnailUrl(post.featureImage)"
                                :data-src="post.featureImage"
                                :alt="post.title"
                                class="lazy-image w-full h-full object-cover"
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
                            <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                    <span class="bg-[#ffcc00] text-[#333] px-3 py-1 rounded-md text-sm font-medium">
                                        {{ post.categories[0].name }}
                                    </span>
                                </div>
                                <h2 class="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                                <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                    {{ post.excerpt || stripHtml(post.content).substring(0, 150) + '...' }}
                                </p>
                                <span class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
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
                            <img
                                v-if="coverPosts.splitMain && coverPosts.splitMain.featureImage"
                                :src="getThumbnailUrl(coverPosts.splitMain.featureImage)"
                                :data-src="coverPosts.splitMain.featureImage"
                                :alt="coverPosts.splitMain.title"
                                class="lazy-image w-full h-full object-cover"
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
                            <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="coverPosts.splitMain && coverPosts.splitMain.categories && coverPosts.splitMain.categories.length > 0" class="mb-2">
                                    <span class="bg-[#ffcc00] text-[#333] px-3 py-1 rounded-md text-sm font-medium">
                                        {{ coverPosts.splitMain.categories[0].name }}
                                    </span>
                                </div>
                                <h2 v-if="coverPosts.splitMain" class="text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ coverPosts.splitMain.title }}</h2>
                                <p v-if="coverPosts.splitMain" class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                    {{ coverPosts.splitMain.excerpt || stripHtml(coverPosts.splitMain.content).substring(0, 150) + '...' }}
                                </p>
                                <span class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
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
                                <img
                                    v-if="post.featureImage"
                                    :src="getThumbnailUrl(post.featureImage)"
                                    :data-src="post.featureImage"
                                    :alt="post.title"
                                    class="lazy-image w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                    <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                        <span class="bg-[#ffcc00] text-[#333] px-2 py-1 rounded-md text-xs font-medium">
                                            {{ post.categories[0].name }}
                                        </span>
                                    </div>
                                    <h3 class="text-base font-bold mb-2 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h3>
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
                            <img
                                v-if="post.featureImage"
                                :src="getThumbnailUrl(post.featureImage)"
                                :data-src="post.featureImage"
                                :alt="post.title"
                                class="lazy-image w-full h-full object-cover"
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
                            <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white">
                                <div v-if="post.categories && post.categories.length > 0" class="mb-2">
                                    <span class="bg-[#ffcc00] text-[#333] px-3 py-1 rounded-md text-sm font-medium">
                                        {{ post.categories[0].name }}
                                    </span>
                                </div>
                                <h2 class="text-xl md:text-2xl font-bold mb-3 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-black/30 inline-block py-1 px-2 rounded">{{ post.title }}</h2>
                                <p class="text-gray-100 mb-4 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] bg-black/25 p-2 rounded max-w-2xl">
                                    {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                </p>
                                <span class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
                                    Continuar lendo
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </section>

        <div class="container mx-auto md:px-0 px-2 pb-12">
            <!-- Lojas em Destaque -->
            <section class="mb-12">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">Lojas em Destaque</h2>
                    <a href="/desconto" class="text-indigo-600 hover:text-indigo-800 font-medium">Ver todas</a>
                </div>

                <div v-if="loading" class="flex justify-center items-center py-10">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
                </div>

                <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <a v-for="campaign in featuredCampaigns.slice(0, 18)" :key="campaign.id" :href="`/desconto/${campaign.slug}`"
                        class="store-card bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center hover:shadow-lg transition-all">
                        <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                                <img v-if="campaign.logo"
                                     :src="getThumbnailUrl(campaign.logo)"
                                     :data-src="campaign.logo"
                                     :alt="campaign.name"
                                     class="lazy-image max-w-full max-h-full"
                                     loading="lazy" width="64" height="64">
                                <div v-else class="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 class="text-sm font-medium text-gray-800">{{ campaign.name }}</h3>
                            <p class="text-xs text-gray-500">{{ campaign.couponCount }} cupons</p>
                        </div>
                    </a>
                </div>
            </section>

            <!-- Top Cupons Carrossel -->
            <section class="container card-carousel mb-12">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">Top cupons</h2>
                    <a href="#top-25-cupons" class="text-indigo-600 hover:text-indigo-800 font-medium">Ver todos</a>
                </div>
                <div id="coupon-cards" class="relative">
                    <div class="overflow-hidden">
                        <div class="flex transition-transform duration-300 ease-in-out"
                            :style="`transform: translateX(-${currentCouponIndex * (100 / couponSlidesVisible)}%);`">
                            <div v-for="coupon in featuredCoupons.slice(0, 10)" :key="coupon.id"
                                class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 flex-shrink-0">
                                <a :href="coupon.campaignSlug ? `/desconto/${coupon.campaignSlug}` : '#'"
                                   class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all h-full flex flex-col p-0 block">
                                    <div class="p-4 pb-3">
                                        <div class="flex-shrink-0 h-24 flex items-center justify-center">
                                            <img v-if="coupon.campaignLogo"
                                                 :src="getThumbnailUrl(coupon.campaignLogo)"
                                                 :data-src="coupon.campaignLogo"
                                                 :alt="coupon.campaignName"
                                                 class="lazy-image max-h-20 max-w-full object-contain"
                                                 loading="lazy" width="102" height="80">
                                            <div v-else class="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-md">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex-1 flex flex-col text-center p-4 pt-3 mt-auto">
                                        <p class="text-sm font-bold text-gray-800 mb-1 line-clamp-2 h-10">{{ coupon.title }}</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Carousel Controls -->
                    <button @click="prevCouponSlide"
                            class="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full w-10 h-10 p-2 z-10 -ml-3 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors">
                        <i class="fas fa-chevron-left"></i>
                    </button>

                    <button @click="nextCouponSlide"
                            class="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full w-10 h-10 p-2 z-10 -mr-3 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors">
                        <i class="fas fa-chevron-right"></i>
                    </button>

                    <!-- Carousel Bullets -->
                    <div class="flex justify-center mt-6 space-x-2">
                        <button v-for="i in Math.ceil(Math.min(10, featuredCoupons.length) / couponSlidesVisible)" :key="i"
                            @click="currentCouponIndex = (i-1) * couponSlidesVisible"
                            class="w-2.5 h-2.5 rounded-full bg-gray-300 hover:bg-gray-400 focus:outline-none transition-colors"
                            :class="{'bg-indigo-600': Math.floor(currentCouponIndex / couponSlidesVisible) === i-1}"></button>
                    </div>
                </div>
            </section>

            <!-- Top 25 Cupons da Semana -->
            <section id="top-25-cupons" class="mb-12">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">Os 50 melhores Cupons de Desconto da semana!</h2>
                </div>

                <div v-if="loading" class="flex justify-center items-center py-10">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-green-600"></div>
                </div>
                <div v-else-if="error" class="text-center py-10 text-red-500">
                    Ocorreu um erro ao carregar os cupons. Tente novamente mais tarde.
                </div>
                <div v-else-if="top25Coupons.length === 0" class="text-center py-10 text-gray-500">
                    Nenhum cupom encontrado esta semana.
                </div>
                <div v-else class="space-y-4">
                    <div v-for="coupon in top25Coupons" :key="coupon.id"
                         class="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center hover:shadow-lg transition-shadow duration-300">

                        <div class="w-24 h-16 md:w-32 md:h-20 flex-shrink-0 mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
                            <a :href="coupon.campaignSlug ? `/desconto/${coupon.campaignSlug}` : '#'" class="block">
                                <img v-if="coupon.campaignLogo"
                                     :src="getThumbnailUrl(coupon.campaignLogo)"
                                     :data-src="coupon.campaignLogo"
                                     :alt="coupon.campaignName"
                                     class="lazy-image max-w-full max-h-full object-contain rounded"
                                     loading="lazy" width="102" height="80">
                                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                            </a>
                        </div>

                        <div class="flex-grow text-center md:text-left">
                            <h3 class="text-lg md:text-xl font-semibold text-gray-800 mb-1">{{ coupon.title }}</h3>
                            <p v-if="coupon.cashbackPercentage" class="text-sm text-green-600 font-medium mb-1">
                                + {{ coupon.cashbackPercentage }}% de cashback
                                <span v-if="coupon.oldCashbackPercentage" class="text-gray-500 line-through">(era {{coupon.oldCashbackPercentage}}%)</span>
                            </p>
                            <p class="text-gray-600 text-sm mb-2 line-clamp-2">{{ coupon.description }}</p>
                            <p class="text-xs text-gray-500">
                                <span v-if="coupon.verifiedToday">Verificado hoje</span>
                                <span v-if="coupon.verifiedToday && coupon.views" class="mx-1">•</span>
                                <span v-if="coupon.views">{{ coupon.views || 0 }} total de visualizações</span>
                            </p>
                        </div>

                        <div class="mt-4 md:mt-0 md:ml-6 flex-shrink-0 w-full md:w-48">
                            <button v-if="coupon.code"
                                @click="openScratchModal(coupon)"
                                class="coupon-button group relative w-full h-12 overflow-visible bg-white border border-gray-300 rounded-lg transition-all duration-200 hover:shadow-lg"
                                :class="[
                                    new Date(coupon.expiration) < new Date() ?
                                        'border-gray-400 bg-gray-100 expired' :
                                        'border-green-400 hover:border-green-500'
                                ]">

                                <!-- Área do código completo (sempre visível por baixo) -->
                                <div class="absolute inset-0 flex items-center justify-end px-4 z-5"
                                    :class="[new Date(coupon.expiration) < new Date() ?
                                        'bg-gray-100' :
                                        'bg-gradient-to-r from-green-50 to-emerald-50']">
                                    <div class="font-mono text-sm font-bold px-3 py-2"
                                        :class="[new Date(coupon.expiration) < new Date() ?
                                            'border-gray-400 text-gray-600' :
                                            'border-green-400 text-green-800']">
                                        ...{{ coupon.code.slice(-4) }}
                                    </div>
                                </div>

                                <!-- Parte verde "Ver Cupom" que funciona como tampa -->
                                <div class="coupon-cover absolute inset-0 flex items-center px-4 transition-all duration-200 ease-in-out z-10"
                                    :class="[new Date(coupon.expiration) < new Date() ?
                                        'bg-gray-400' :
                                        'bg-green-600']">

                                    <!-- Texto VER CUPOM -->
                                    <div class="flex items-center text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span class="text-sm font-medium">Ver Cupom</span>
                                    </div>
                                </div>
                            </button>
                            <a v-else
                               :href="coupon.linkRef || (coupon.campaignSlug ? `/desconto/${coupon.campaignSlug}/${coupon.id}` : '#')"
                               target="_blank"
                               class="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 text-center w-full">
                                Ver Desconto
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Blog Posts -->
            <section class="pt-12 bg-gray-50 rounded-lg">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-between mb-8">
                        <h2 class="text-2xl font-bold text-gray-800">Últimas do Blog</h2>
                        <a href="/blog" class="text-indigo-600 hover:text-indigo-800 font-medium">Ver blog</a>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Blog Posts Dinâmicos -->
                        <div v-for="post in posts.slice(0, 3)" :key="post.id"
                            class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all flex flex-col">
                            <a :href="`/post/${post.slug}`" class="block h-48 overflow-hidden">
                                <img v-if="post.featureImage"
                                     :src="getThumbnailUrl(post.featureImage)"
                                     :data-src="post.featureImage"
                                     :alt="post.title"
                                     class="lazy-image w-full h-full object-cover"
                                     loading="lazy" width="360" height="192">
                                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                            </a>
                            <div class="p-6 flex-1 flex flex-col">
                                <span class="text-xs font-medium text-indigo-600 mb-2 block">
                                    {{ post.categories && post.categories.length > 0 ? post.categories[0].name : 'Dicas de Economia' }}
                                </span>
                                <a :href="`/post/${post.slug}`" class="block">
                                    <h3 class="text-xl font-bold text-gray-800 mb-2 line-clamp-2 h-14 overflow-hidden hover:text-indigo-600 transition-colors">{{ post.title }}</h3>
                                </a>
                                <p class="text-gray-600 mb-4 flex-1 line-clamp-3 h-18">
                                    {{ post.excerpt || stripHtml(post.content).substring(0, 120) + '...' }}
                                </p>
                                <div class="flex items-center justify-between mt-auto">
                                    <span class="text-sm text-gray-500">{{ formatDate(post.publishedAt) }}</span>
                                    <a :href="`/post/${post.slug}`" class="text-indigo-600 hover:text-indigo-800 font-medium">Ler mais</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>

    <CouponScratchModal
        :visible="isScratchModalOpen"
        :coupon="selectedCouponForScratch"
        @close="closeScratchModal" />

</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, onServerPrefetch } from 'vue';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { vue3 as affiliateVue3 } from '@cmmv/affiliate/client';
import { useSettingsStore } from '../../store/settings';
import { usePostsStore } from '../../store/posts';
import { useCampaignsStore } from '../../store/campaigns';
import { useCouponsStore } from '../../store/coupons';
import { formatDate, stripHtml } from '../../composables/useUtils';
import CouponScratchModal from '../components/CouponScratchModal.vue';

const settingsStore = useSettingsStore();
const postsStore = usePostsStore();
const campaignsStore = useCampaignsStore();
const couponsStore = useCouponsStore();
const blogAPI = vue3.useBlog();
const affiliateAPI = affiliateVue3.useAffiliate();

// State
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
const posts = ref<any[]>(postsStore.getPosts || []);
const campaigns = ref<any[]>(campaignsStore.getCampaigns || []);
const featuredCoupons = ref<any[]>(couponsStore.getFeaturedCoupons || []);
const top25Coupons = ref<any[]>(couponsStore.getTop25Coupons || []);
const loading = ref(true);
const error = ref(null);
const currentCarouselIndex = ref(0);
const carouselInterval = ref<number | null>(null);
const currentCouponIndex = ref(0);
const couponSlidesVisible = ref(3);

const isScratchModalOpen = ref(false);
const selectedCouponForScratch = ref<any | null>(null);
let lazyLoadObserver: IntersectionObserver | null = null;

/**
 * Get thumbnail URL by adding _thumb to the filename and forcing .webp format
 */
const getThumbnailUrl = (originalUrl: string): string => {
    if (!originalUrl) return originalUrl;

    if (originalUrl.includes('_thumb')) return originalUrl;
    if (originalUrl.startsWith('data:')) return originalUrl;

    const lastDotIndex = originalUrl.lastIndexOf('.');

    if (lastDotIndex === -1)
        return originalUrl + '_thumb.webp';

    const beforeExtension = originalUrl.substring(0, lastDotIndex);
    return `${beforeExtension}_thumb.webp`;
};

/**
 * Initialize lazy loading observer
 */
const initLazyLoading = () => {
    if (!('IntersectionObserver' in window)) return;

    lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                const fullSrc = img.dataset.src;

                if (fullSrc && fullSrc !== img.src) {
                    const newImg = new Image();
                    newImg.onload = () => {
                        img.src = fullSrc;
                        img.classList.add('loaded');
                    };
                    newImg.onerror = () => {
                        img.classList.add('error');
                    };
                    newImg.src = fullSrc;
                }

                lazyLoadObserver?.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });

    const observeLazyImages = () => {
        const lazyImages = document.querySelectorAll('img.lazy-image');
        lazyImages.forEach((img) => {
            lazyLoadObserver?.observe(img);
        });
    };

    setTimeout(observeLazyImages, 100);

    watch([posts, campaigns, featuredCoupons, top25Coupons], () => {
        setTimeout(observeLazyImages, 100);
    }, { deep: true });
};

/**
 * Cleanup lazy loading observer
 */
const cleanupLazyLoading = () => {
    if (lazyLoadObserver) {
        lazyLoadObserver.disconnect();
        lazyLoadObserver = null;
    }
};

const coverSettings = computed(() => {
    try {
        const config = settings.value.cover;
        return config ? JSON.parse(config) : { layoutType: 'full' };
    } catch (err) {
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

const featuredCampaigns = computed(() => {
    if (!campaigns.value || campaigns.value.length === 0) return [];
    return campaigns.value.filter(campaign => campaign.couponCount > 0);
});

const headData = ref({
    title: settings.value?.title || 'CupomNahora - Economize em suas compras online',
    meta: [
        { name: 'description', content: settings.value?.description || 'Encontre os melhores cupons de desconto e ofertas em mais de 5.000 lojas parceiras.' },
        { property: 'og:title', content: settings.value?.title || 'CupomNahora - Economize em suas compras online' },
        { property: 'og:description', content: settings.value?.description || 'Encontre os melhores cupons de desconto e ofertas em mais de 5.000 lojas parceiras.' },
        { property: 'og:type', content: 'website' }
    ]
});

useHead(headData);

const loadData = async () => {
    try {
        loading.value = true;
        error.value = null;

        let needToFetchPosts = posts.value.length === 0;
        let needToFetchCampaigns = campaigns.value.length === 0;
        let needToFetchFeaturedCoupons = featuredCoupons.value.length === 0;
        let needToFetchTop25Coupons = top25Coupons.value.length === 0;

        const promises: Promise<any>[] = [];

        if (needToFetchPosts) {
            promises.push(
                blogAPI.posts.getAll(0).then(postsResponse => {
                    if (postsResponse) {
                        posts.value = postsResponse.posts;
                        postsStore.setPosts(postsResponse.posts);
                    }
                })
            );
        }

        if (needToFetchCampaigns) {
            promises.push(
                affiliateAPI.campaigns.getAllWithCouponCounts().then(campaignsData => {
                    if (campaignsData && campaignsData.length > 0) {
                        campaigns.value = campaignsData;
                        campaignsStore.setCampaigns(campaignsData);
                    } else {
                        campaigns.value = [];
                    }
                })
            );
        }

        if (needToFetchFeaturedCoupons) {
            promises.push(
                affiliateAPI.coupons.getMostViewed().then(couponsResponse => {
                    if (couponsResponse) {
                        // Converter views para número em cada cupom
                        const couponsWithNumericViews = couponsResponse.map((coupon: any) => ({
                            ...coupon,
                            views: parseInt(String(coupon.views), 10) || 0
                        }));
                        featuredCoupons.value = couponsWithNumericViews;
                        couponsStore.setFeaturedCoupons(couponsWithNumericViews);
                    } else {
                        featuredCoupons.value = [];
                    }
                })
            );
        }

        if (needToFetchTop25Coupons) {
            promises.push(
                affiliateAPI.coupons.getTop25WeeklyCoupons().then(weeklyTopCouponsResponse => {
                    if (weeklyTopCouponsResponse) {
                        // Converter views para número em cada cupom
                        const couponsWithNumericViews = weeklyTopCouponsResponse.map((coupon: any) => ({
                            ...coupon,
                            views: parseInt(String(coupon.views), 10) || 0
                        }));
                        top25Coupons.value = couponsWithNumericViews;
                        couponsStore.setTop25Coupons(couponsWithNumericViews);
                    } else {
                        top25Coupons.value = [];
                    }
                })
            );
        }

        if (promises.length > 0)
            await Promise.all(promises);
    } catch (err: any) {
        error.value = err;
    } finally {
        loading.value = false;
    }
};

const prevCouponSlide = () => {
    const numDisplayableCoupons = Math.min(10, featuredCoupons.value.length);
    if (couponSlidesVisible.value >= numDisplayableCoupons) {
        currentCouponIndex.value = 0;
        return;
    }

    const maxStartIndex = Math.max(0, numDisplayableCoupons - couponSlidesVisible.value);

    if (currentCouponIndex.value > 0) {
        currentCouponIndex.value--;
    } else {
        currentCouponIndex.value = maxStartIndex;
    }
};

const nextCouponSlide = () => {
    const numDisplayableCoupons = Math.min(10, featuredCoupons.value.length);
    if (couponSlidesVisible.value >= numDisplayableCoupons) {
        currentCouponIndex.value = 0;
        return;
    }

    const maxStartIndex = Math.max(0, numDisplayableCoupons - couponSlidesVisible.value);

    if (currentCouponIndex.value < maxStartIndex) {
        currentCouponIndex.value++;
    } else {
        currentCouponIndex.value = 0;
    }
};

const openScratchModal = (coupon: any) => {
    if (!coupon.campaignName || !coupon.campaignLogo) {
        const relatedCampaign = campaigns.value.find(c => c.id === coupon.campaignId);

        selectedCouponForScratch.value = {
            ...coupon,
            campaignName: relatedCampaign?.name || coupon.campaignName || 'Loja',
            campaignLogo: relatedCampaign?.logo || coupon.campaignLogo || null
        };
    } else {
        selectedCouponForScratch.value = coupon;
    }

    isScratchModalOpen.value = true;

    // Incrementar a contagem de visualizações
    if (coupon && (coupon.id || coupon.code)) {
        incrementCouponView(coupon.id || coupon.code, coupon);
    }

    if (coupon && coupon.code)
        window.open(window.location.href + `?display=${coupon.code}`, '_blank');

    if (coupon && coupon.deeplink)
        window.location.href = coupon.deeplink;
};

// Função para incrementar as visualizações do cupom
const incrementCouponView = async (couponId: string, coupon: any) => {
    try {
        const result = await affiliateAPI.coupons.incrementView(couponId);
        
        if (result && result.success && result.views !== undefined) {
            // Atualizar o valor local para refletir imediatamente na UI
            coupon.views = parseInt(String(result.views), 10) || 0;
            
            // Forçar atualização dos arrays para refletir a mudança na UI
            if (featuredCoupons.value.includes(coupon)) {
                const updatedFeaturedCoupons = [...featuredCoupons.value];
                featuredCoupons.value = updatedFeaturedCoupons;
                couponsStore.setFeaturedCoupons(updatedFeaturedCoupons);
            }
            
            if (top25Coupons.value.includes(coupon)) {
                const updatedTop25Coupons = [...top25Coupons.value];
                top25Coupons.value = updatedTop25Coupons;
                couponsStore.setTop25Coupons(updatedTop25Coupons);
            }
        }
    } catch (err) {
        console.error('Erro ao incrementar visualizações do cupom:', err);
    }
};

const closeScratchModal = () => {
    isScratchModalOpen.value = false;
    selectedCouponForScratch.value = null;
};

onServerPrefetch(async () => {
    await loadData();
})

onMounted(async () => {
    await loadData();
    startCarouselInterval();
    initLazyLoading();
    
    // Calcular o número adequado de slides visíveis com base no viewport
    updateCouponSlidesVisible();
    window.addEventListener('resize', updateCouponSlidesVisible);
});

onUnmounted(() => {
    stopCarouselInterval();
    cleanupLazyLoading();
    window.removeEventListener('resize', updateCouponSlidesVisible);
});

const updateCouponSlidesVisible = () => {
    // Ajustar o número de slides visíveis baseado na largura da tela
    if (window.innerWidth < 640) { // sm
        couponSlidesVisible.value = 1;
    } else if (window.innerWidth < 768) { // md
        couponSlidesVisible.value = 2;
    } else if (window.innerWidth < 1024) { // lg
        couponSlidesVisible.value = 3;
    } else {
        couponSlidesVisible.value = 4;
    }
};

watch(() => settings.value['blog.cover'], () => {
    stopCarouselInterval();
    startCarouselInterval();
}, { deep: true });
</script>

<style scoped>
.lazy-image {
    transition: opacity 0.3s ease-in-out;
    opacity: 0.8;
}

.lazy-image.loaded {
    opacity: 1;
}

.lazy-image.error {
    opacity: 0.7;
    filter: grayscale(0.2);
}

img {
    transition: opacity 0.2s ease-in-out;
}

.lazy-image:not(.loaded):not(.error) {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
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


