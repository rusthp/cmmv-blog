<template>
    <div class="w-full max-w-[1200px] mx-auto px-4">
        <!-- Cover Section -->
        <section v-if="posts.length > 0" class="mb-8 md:block hidden">
            <!-- Full Layout (default) -->
            <div v-if="coverSettings.layoutType === 'full' || !coverSettings.layoutType" class="bg-white rounded-lg overflow-hidden shadow-md">
                <a v-if="coverPosts.full" :href="`/post/${coverPosts.full.slug}`" class="block">
                    <div class="relative h-[400px]">
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
                            <span class="inline-block bg-[#0a5d28] hover:bg-[#064019] text-white px-4 py-2 rounded-md transition-colors">
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
                                <span class="inline-block bg-[#0a5d28] hover:bg-[#064019] text-white px-4 py-2 rounded-md transition-colors">
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
                                <span class="inline-block bg-[#0a5d28] hover:bg-[#064019] text-white px-4 py-2 rounded-md transition-colors">
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
                                    :src="post.featureImage"
                                    :alt="post.title"
                                    class="w-full h-full object-cover"
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
                                <span class="inline-block bg-[#0a5d28] hover:bg-[#064019] text-white px-4 py-2 rounded-md transition-colors">
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
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                </div>

                <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <a v-for="campaign in featuredCampaigns.slice(0, 18)" :key="campaign.id" :href="`/desconto/${campaign.slug}`"
                        class="store-card bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center hover:shadow-lg transition-all"
                        :class="{'border-indigo-200 bg-indigo-50': campaign.highlight}">
                        <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                                <img v-if="campaign.logo" :src="campaign.logo" :alt="campaign.name" class="max-w-full max-h-full">
                                <div v-else class="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 class="text-sm font-medium text-gray-800">{{ campaign.name }}</h3>
                            <p class="text-xs text-gray-500">{{ Math.floor(Math.random() * 50) + 10 }} cupons</p>
                        </div>
                    </a>
                </div>
            </section>

            <!-- Categorias Populares -->
            <section class="mb-12">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">Categorias Populares</h2>
                    <a href="#" class="text-indigo-600 hover:text-indigo-800 font-medium">Ver todas</a>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <!-- Categoria Dinâmicas -->
                    <a v-for="(category, index) in categoriesWithIcons" :key="category.id" :href="`/category/${category.slug}`"
                        class="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-indigo-50 transition-all">
                        <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                            <i :class="category.icon"></i>
                        </div>
                        <h3 class="text-sm font-medium text-gray-800">{{ category.name }}</h3>
                        <p class="text-xs text-gray-500">{{ category.postCount || Math.floor(Math.random() * 100) + 20 }} cupons</p>
                    </a>
                </div>
            </section>

            <!-- Cupons em Destaque -->
            <section class="container card-carousel">
                <h2 class="card-carousel-title text-2xl font-bold text-gray-800 mb-8">Top cupons</h2>
                <div id="coupon-cards" class="relative">
                    <div class="overflow-hidden">
                        <div class="flex transition-transform duration-300 ease-in-out"
                            :style="`transform: translateX(-${currentCouponIndex * (100 / couponSlidesVisible)}%);`">
                            <div v-for="coupon in featuredCoupons.slice(0, 10)" :key="coupon.id"
                                class="coupon-card-container w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 flex-shrink-0">
                                <div class="coupon-card bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
                                    <div class="coupon-card-store-logo-container p-4  flex justify-center items-center h-24">
                                        <img v-if="coupon.campaignLogo" :src="coupon.campaignLogo" :alt="coupon.campaignName"
                                            class="coupon-card-store-logo max-h-16 max-w-full">
                                        <div v-else class="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="coupon-card-infos p-4 flex-1 flex flex-col">
                                        <p class="coupon-card-overview text-sm line-clamp-2 flex-grow">{{ coupon.description }}</p>
                                    </div>
                                    <div class="border-t border-gray-200 p-4">
                                        <div class="flex justify-between items-center">
                                            <div class="bg-gray-100 text-gray-800 py-2 px-3 rounded-md font-mono text-xs">
                                                {{ coupon.code ? '****' + (coupon.code.length > 3 ? coupon.code.substring(coupon.code.length - 3) : coupon.code) : '********' }}
                                            </div>
                                            <a :href="coupon.campaignSlug ? `/desconto/${coupon.campaignSlug}` : '#'" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3 rounded-md">
                                                Pegar cupom
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Carousel Controls -->
                    <button @click="prevCouponSlide" class="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full w-10 h-10 p-2 z-10 -ml-3"
                        :class="{'opacity-50 cursor-not-allowed': currentCouponIndex === 0}">
                        <i class="fas fa-chevron-left text-gray-600"></i>
                    </button>
                    <button @click="nextCouponSlide" class="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full  w-10 h-10 p-2 z-10 -mr-3"
                        :class="{'opacity-50 cursor-not-allowed': currentCouponIndex >= Math.max(0, featuredCoupons.length - couponSlidesVisible)}">
                        <i class="fas fa-chevron-right text-gray-600"></i>
                    </button>

                    <!-- Carousel Bullets -->
                    <div class="flex justify-center mt-4 space-x-2">
                        <button v-for="i in Math.ceil(10 / couponSlidesVisible)" :key="i"
                            @click="currentCouponIndex = i-1"
                            class="w-2 h-2 rounded-full bg-gray-300 focus:outline-none"
                            :class="{'bg-indigo-600': Math.floor(currentCouponIndex) === i-1}"></button>
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
                            <div class="h-48 overflow-hidden">
                                <img v-if="post.featureImage" :src="post.featureImage" :alt="post.title" class="w-full h-full object-cover">
                                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="p-6 flex-1 flex flex-col">
                                <span class="text-xs font-medium text-indigo-600 mb-2 block">
                                    {{ post.categories && post.categories.length > 0 ? post.categories[0].name : 'Dicas de Economia' }}
                                </span>
                                <h3 class="text-xl font-bold text-gray-800 mb-2 line-clamp-2 h-14 overflow-hidden">{{ post.title }}</h3>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useHead } from '@unhead/vue';
import { vue3 } from '@cmmv/blog/client';
import { vue3 as affiliateVue3 } from '@cmmv/affiliate/client';
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
import { usePostsStore } from '../../store/posts';
import { formatDate, stripHtml } from '../../composables/useUtils';

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();
const postsStore = usePostsStore();
const blogAPI = vue3.useBlog();
const affiliateAPI = affiliateVue3.useAffiliate();

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
const categories = ref<any[]>(categoriesStore.getCategories || []);
const posts = ref<any[]>(postsStore.getPosts || []);
const campaigns = ref<any[]>([]);
const featuredCoupons = ref<any[]>([]); // Will store coupons from useAffiliate().coupons.getMostViewed()
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const searchModalOpen = ref(false);
const currentCarouselIndex = ref(0);
const carouselInterval = ref<number | null>(null);
const currentCouponIndex = ref(0);
const couponSlidesVisible = ref(3);

// Icons for categories
const categoryIcons = [
    'fas fa-tshirt',
    'fas fa-laptop',
    'fas fa-utensils',
    'fas fa-home',
    'fas fa-plane',
    'fas fa-gamepad',
    'fas fa-shopping-basket',
    'fas fa-baby',
    'fas fa-book',
    'fas fa-graduation-cap',
    'fas fa-car',
    'fas fa-paw'
];

const categoriesWithIcons = computed(() => {
    if (!categories.value.length) return [];
    return categories.value.slice(0, 6).map((category, index) => ({
        ...category,
        icon: categoryIcons[index % categoryIcons.length]
    }));
});

// Cover settings from the blog settings
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

// Cover posts for different layout types
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

// Carousel functions
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

// Sort campaigns to prioritize highlighted ones
const featuredCampaigns = computed(() => {
    if (!campaigns.value.length) return [];

    // Sort to put highlighted campaigns first
    return [...campaigns.value].sort((a, b) => {
        if (a.highlight && !b.highlight) return -1;
        if (!a.highlight && b.highlight) return 1;
        return 0;
    });
});

// Computed properties for different sections
// We've removed featuredStores as it's no longer needed since we removed "Ofertas por Loja" section

// Helper functions
const validUntil = () => {
    const now = new Date();
    const future = new Date(now.setDate(now.getDate() + Math.floor(Math.random() * 60) + 10));
    return future.toLocaleDateString('pt-BR');
};

const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = Math.floor(Math.random() * 5) + 5;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const headData = ref({
    title: settings.value?.title || 'MeuCupom - Economize em suas compras online',
    meta: [
        { name: 'description', content: settings.value?.description || 'Encontre os melhores cupons de desconto e ofertas em mais de 5.000 lojas parceiras.' },
        { property: 'og:title', content: settings.value?.title || 'MeuCupom - Economize em suas compras online' },
        { property: 'og:description', content: settings.value?.description || 'Encontre os melhores cupons de desconto e ofertas em mais de 5.000 lojas parceiras.' },
        { property: 'og:type', content: 'website' }
    ]
});

useHead(headData);

const loadData = async () => {
    try {
        loading.value = true;
        error.value = null;

        // Parallel loading of posts, campaigns and coupons
        const [postsResponse, campaignsResponse, couponsResponse] = await Promise.all([
            blogAPI.posts.getAll(0),
            affiliateAPI.campaigns.getAll(),
            affiliateAPI.coupons.getMostViewed()
        ]);

        if (postsResponse) {
            posts.value = postsResponse.posts;
        }

        if (campaignsResponse) {
            campaigns.value = campaignsResponse;
        }

        // Load featured coupons from the API
        if (couponsResponse) {
            console.log('Featured coupons loaded:', couponsResponse);
            featuredCoupons.value = couponsResponse;
        }

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
    } catch (err: any) {
        console.error('Failed to load data:', err);
        error.value = err;
    } finally {
        loading.value = false;
    }
};

const openSearchModal = () => {
    searchModalOpen.value = true;
};

const prevCouponSlide = () => {
    if (currentCouponIndex.value > 0) {
        currentCouponIndex.value--;
    }
};

const nextCouponSlide = () => {
    if (currentCouponIndex.value < featuredCoupons.value.length - couponSlidesVisible.value) {
        currentCouponIndex.value++;
    }
};

onMounted(async () => {
    await loadData();
    startCarouselInterval();
});

onUnmounted(() => {
    stopCarouselInterval();
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

.h-18 {
    height: 4.5rem; /* 72px - equivalent to 3 lines of text */
}
</style>


