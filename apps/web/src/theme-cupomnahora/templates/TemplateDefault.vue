<template>
    <div class="font-sans bg-gray-50">
        <!-- Header -->
        <header class="bg-indigo-600 shadow-md fixed top-0 left-0 right-0 z-50">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between py-4 max-w-[1200px] mx-auto">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <a href="/" class="text-2xl font-bold text-white">
                            <img src="/src/theme-cupomnahora/assets/Logo-1.png" width="100" height="24" alt="Logo" title="Logo">
                        </a>
                    </div>

                    <!-- Search Bar -->
                    <div class="hidden md:block flex-grow max-w-xl mx-8">
                        <div class="relative">
                            <input type="text" placeholder="Buscar lojas ou cupons..."
                                   class="w-full py-2 px-4 border bg-white border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                   v-model="searchQuery"
                                   @input="debouncedSearch"
                                   @focus="onSearchFocus"
                                   @blur="onSearchBlur">
                            <button class="absolute right-3 top-2 text-gray-500" @click="openSearchModal">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            <!-- Autocomplete Dropdown -->
                            <div v-if="showAutocomplete" class="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                <!-- Loading State -->
                                <div v-if="isSearching" class="p-4 text-center">
                                    <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p class="text-sm text-gray-500 mt-2">Buscando...</p>
                                </div>

                                <!-- Featured Stores (quando campo focado sem busca) -->
                                <div v-else-if="searchQuery.trim().length === 0" class="p-4">
                                    <h4 class="text-sm font-semibold text-gray-700 mb-3">Lojas em Destaque</h4>
                                    <div class="space-y-2">
                                        <a v-for="store in featuredStores.slice(0, 6)" :key="store.id"
                                           :href="`/desconto/${store.slug}`"
                                           class="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                           @click="closeAutocomplete">
                                            <div class="w-8 h-8 flex-shrink-0 mr-3">
                                                <img v-if="store.logo" :src="store.logo" :alt="store.name" class="w-full h-full object-contain rounded">
                                                <div v-else class="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div class="flex-grow">
                                                <h5 class="text-sm font-medium text-gray-900">{{ store.name }}</h5>
                                                <p class="text-xs text-gray-500">{{ store.couponCount || 0 }} cupons disponíveis</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>

                                <!-- Search Results -->
                                <div v-else-if="searchQuery.trim().length > 1">
                                    <!-- No Results -->
                                    <div v-if="searchResults.length === 0 && searchCampaigns.length === 0" class="p-4 text-center text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p class="text-sm">Nenhum resultado encontrado</p>
                                    </div>

                                    <!-- Store Results -->
                                    <div v-if="searchCampaigns.length > 0" class="border-b border-gray-100">
                                        <div class="p-3 bg-gray-50">
                                            <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Lojas</h4>
                                        </div>
                                        <div class="p-2">
                                            <a v-for="store in searchCampaigns.slice(0, 4)" :key="store.id"
                                               :href="`/desconto/${store.slug}`"
                                               class="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                               @click="closeAutocomplete">
                                                <div class="w-8 h-8 flex-shrink-0 mr-3">
                                                    <img v-if="store.logo" :src="store.logo" :alt="store.name" class="w-full h-full object-contain rounded">
                                                    <div v-else class="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div class="flex-grow">
                                                    <h5 class="text-sm font-medium text-gray-900">{{ store.name }}</h5>
                                                    <p class="text-xs text-gray-500">{{ store.couponCount || 0 }} cupons</p>
                                                </div>
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Blog Results -->
                                    <div v-if="searchResults.length > 0">
                                        <div class="p-3 bg-gray-50">
                                            <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Artigos</h4>
                                        </div>
                                        <div class="p-2">
                                            <a v-for="post in searchResults.slice(0, 3)" :key="post.id"
                                               :href="`/post/${post.slug}`"
                                               class="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                               @click="closeAutocomplete">
                                                <div class="w-8 h-8 flex-shrink-0 mr-3">
                                                    <img v-if="post.featureImage" :src="post.featureImage" :alt="post.title" class="w-full h-full object-cover rounded">
                                                    <div v-else class="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div class="flex-grow">
                                                    <h5 class="text-sm font-medium text-gray-900 line-clamp-1">{{ post.title }}</h5>
                                                    <p class="text-xs text-gray-500">{{ formatDate(post.publishedAt || post.updatedAt) }}</p>
                                                </div>
                                            </a>
                                        </div>
                                    </div>

                                    <!-- View All Results -->
                                    <div v-if="(searchResults.length > 3 || searchCampaigns.length > 4)" class="p-3 border-t border-gray-100">
                                        <button @click="openSearchModal" class="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                            Ver todos os resultados ({{ searchResults.length + searchCampaigns.length }})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation -->
                    <nav class="hidden md:flex items-center space-x-4">
                        <a href="/desconto" class="text-white hover:text-indigo-200">Lojas</a>
                        <a href="/cupom" class="text-white hover:text-indigo-200">Categorias</a>
                        <a href="/blog" class="text-white hover:text-indigo-200">Blog</a>
                    </nav>

                    <!-- Mobile Menu Button -->
                    <div class="md:hidden flex items-center space-x-3">
                        <button @click="openSearchModal" class="text-white hover:text-indigo-200" title="Search" aria-label="Search">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-white" title="Navbar" aria-label="Navbar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path v-if="mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu -->
                <div v-show="mobileMenuOpen" class="md:hidden py-3 border-t border-gray-200">
                    <div class="flex flex-col gap-1">
                        <a href="/desconto" class="block text-white hover:text-indigo-200 rounded px-3 py-2 text-sm">Lojas</a>
                        <a href="/cupom" class="block text-white hover:text-indigo-200 rounded px-3 py-2 text-sm">Categorias</a>
                        <a href="/blog" class="block text-white hover:text-indigo-200 rounded px-3 py-2 text-sm">Blog</a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main content -->
        <main class="flex-grow container mx-auto md:px-4 md:py-6 mt-16">
            <div class="flex flex-col lg:flex-row gap-6">
                <router-view />
            </div>
        </main>

        <!-- Newsletter Section -->
        <section class="py-12 bg-white border-t border-gray-200">
            <div class="container mx-auto px-4 text-center">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Receba as melhores ofertas</h2>
                <p class="text-gray-600 mb-6 max-w-lg mx-auto">Assine nossa newsletter e receba cupons exclusivos diretamente no seu e-mail.</p>

                <div v-if="newsletterSubmitted" class="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <p class="text-green-700">{{ newsletterMessage }}</p>
                    </div>
                </div>

                <div v-if="newsletterError" class="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-red-700">{{ newsletterError }}</p>
                    </div>
                </div>

                <form @submit.prevent="subscribeNewsletter" class="max-w-md mx-auto flex">
                    <input
                        type="email"
                        v-model="newsletterEmail"
                        placeholder="Seu e-mail"
                        class="flex-grow py-3 px-4 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    >
                    <button
                        type="submit"
                        class="bg-indigo-600 text-white px-6 py-3 rounded-r-lg hover:bg-indigo-700"
                        :disabled="isSubscribing"
                    >
                        <span v-if="isSubscribing">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Aguarde...
                        </span>
                        <span v-else>Assinar</span>
                    </button>
                </form>

                <p class="text-xs text-gray-500 mt-4">Ao se inscrever, você concorda com nossa <a href="/terms-of-privacy" class="text-indigo-600 underline">política de privacidade</a>.</p>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white pt-12 pb-6">
            <div class="container mx-auto px-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    <!-- Sobre -->
                    <div>
                        <h3 class="text-xl font-bold mb-4">Sobre MeuCupom</h3>
                        <p class="text-gray-400 mb-4">Ajudamos milhões de pessoas a economizar nas compras online com cupons de desconto e cashback nas melhores lojas.</p>
                        <div class="flex space-x-4">
                            <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" class="text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" class="text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" class="text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <!-- Lojas Populares -->
                    <div>
                        <h3 class="text-xl font-bold mb-4">Lojas Recentes</h3>
                        <ul class="space-y-2">
                            <li v-for="campaign in recentCampaigns.slice(0, 10)" :key="campaign.id">
                                <a :href="`/desconto/${campaign.slug}`" class="text-gray-400 hover:text-white">
                                    {{ campaign.name }}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-700 pt-6">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <p class="text-gray-400 mb-4 md:mb-0">&copy; {{ new Date().getFullYear() }} MeuCupom. Todos os direitos reservados.</p>
                        <div class="flex space-x-6">
                            <a href="/terms-of-service" class="text-gray-400 hover:text-white">Termos de uso</a>
                            <a href="/terms-of-privacy" class="text-gray-400 hover:text-white">Política de privacidade</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>

        <!-- Search Modal -->
        <div v-if="searchModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="search-modal" role="dialog" aria-modal="true">
            <div class="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" @click="closeSearchModal" style="backdrop-filter: blur(4px);"></div>

                <!-- Modal panel -->
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
                    <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="w-full">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Pesquisar
                                    </h3>
                                    <button @click="closeSearchModal" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div class="mb-4 relative">
                                    <div class="flex items-center absolute inset-y-0 left-0 pl-3 pointer-events-none">
                                        <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="search"
                                        v-model="searchQuery"
                                        @input="debouncedSearch"
                                        class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Pesquisar cupons e lojas..."
                                        autocomplete="off"
                                        ref="searchInput"
                                    />
                                </div>

                                <div class="mt-4 max-h-[70vh] overflow-y-auto">
                                    <div v-if="isSearching" class="flex justify-center items-center py-8">
                                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                                    </div>

                                    <div v-else-if="searchResults.length === 0 && searchCampaigns.length === 0 && searchQuery.length > 1" class="py-8 text-center text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>Nenhum resultado encontrado para "{{ searchQuery }}"</p>
                                    </div>

                                    <div v-else-if="searchQuery.length > 1" class="space-y-4">
                                        <p v-if="searchResults.length > 0 || searchCampaigns.length > 0" class="text-sm text-gray-500 mb-2">
                                            {{ searchResults.length + searchCampaigns.length }} resultado{{ (searchResults.length + searchCampaigns.length) !== 1 ? 's' : '' }} encontrado{{ (searchResults.length + searchCampaigns.length) !== 1 ? 's' : '' }}
                                        </p>

                                        <!-- Resultados de Lojas -->
                                        <div v-if="searchCampaigns.length > 0" class="mb-6">
                                            <h4 class="text-lg font-medium text-gray-700 mb-3 border-b pb-2">Lojas</h4>
                                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                <a v-for="campaign in searchCampaigns" :key="campaign.id"
                                                   :href="`/desconto/${campaign.slug}`"
                                                   class="store-card bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center hover:shadow-md transition-all"
                                                   :class="{'border-indigo-200 bg-indigo-50': campaign.highlight}">
                                                    <div class="text-center">
                                                        <div class="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                                                            <img v-if="campaign.logo" :src="campaign.logo" :alt="campaign.name" class="max-w-full max-h-full">
                                                            <div v-else class="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-full">
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <h3 class="text-sm font-medium text-gray-800 line-clamp-2">{{ campaign.name }}</h3>
                                                        <p class="text-xs text-gray-500">{{ campaign.couponCount || 0 }} cupons</p>
                                                    </div>
                                                </a>
                                            </div>
                                        </div>

                                        <!-- Resultados de Posts -->
                                        <div v-if="searchResults.length > 0" class="mb-6">
                                            <h4 class="text-lg font-medium text-gray-700 mb-3 border-b pb-2">Artigos do Blog</h4>
                                            <a
                                                v-for="post in searchResults"
                                                :key="post.id"
                                                :href="`/post/${post.slug}`"
                                                class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow mb-3"
                                            >
                                                <div class="flex flex-col sm:flex-row">
                                                    <div v-if="post.featureImage" class="w-full sm:w-32 h-40 sm:h-24 flex-shrink-0">
                                                        <img :src="post.featureImage" :alt="post.title" class="w-full h-full object-cover" loading="lazy" />
                                                    </div>
                                                    <div class="p-4 flex-grow">
                                                        <h4 class="font-bold text-gray-900 mb-1">{{ post.title }}</h4>
                                                        <p v-if="post.excerpt" class="text-sm text-gray-600 line-clamp-2">
                                                            {{ post.excerpt }}
                                                        </p>
                                                        <div class="mt-2 text-xs text-gray-500 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {{ formatDate(post.publishedAt || post.updatedAt) }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cupom Modal -->
        <CouponScratchModal
            :visible="isScratchModalOpen"
            :coupon="selectedCouponForScratch"
            @close="closeScratchModal" />
    </div>

    <CookieConsent />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { vue3 } from '@cmmv/blog/client';
import { useHead } from '@unhead/vue'
import { useSettingsStore } from '../../store/settings';
import { useCampaignsStore } from '../../store/campaigns';
import { useCouponsStore } from '../../store/coupons';
import { vue3 as affiliateVue3 } from '@cmmv/affiliate/client';
import { useRoute } from 'vue-router';
import CouponScratchModal from '../components/CouponScratchModal.vue';
import CookieConsent from '../../components/CookieConsent.vue';
import { vue3 as newsletterVue3 } from '@cmmv/newsletter/client';

const blogAPI = vue3.useBlog();
const affiliateAPI = affiliateVue3.useAffiliate();
const settingsStore = useSettingsStore();
const campaignsStore = useCampaignsStore();
const couponsStore = useCouponsStore();
const route = useRoute();
const settings = ref<any>(settingsStore.getSettings);
const campaigns = ref<any[]>(campaignsStore.getCampaigns || []);

const recentCampaigns = computed(() => {
    if (!campaigns.value || campaigns.value.length === 0) return [];
    // Ordenar por couponCount (quantidade de cupons) como critério de "popularidade"
    return [...campaigns.value]
        .filter(campaign => campaign.couponCount > 0)
        .sort((a, b) => (b.couponCount || 0) - (a.couponCount || 0))
        .slice(0, 10);
});

const scripts = computed(() => {
    const baseScripts = [];
    return [...baseScripts, ...settingsStore.googleAnalyticsScripts];
});

useHead({
    meta: computed(() => settingsStore.allMetaTags),

    link: [
        {
            rel: 'stylesheet',
            href: '/src/theme-cupomnahora/style.css?v=2'
        },
        {
            rel: 'icon',
            type: 'image/ico',
            href: '/src/theme-cupomnahora/favicon.ico?v=2'
        },
        { rel: 'preconnect', href: 'https://www.googletagmanager.com/' },
        { rel: 'preconnect', href: 'https://www.google-analytics.com/' },
        { rel: 'preconnect', href: 'https://www.googletag.com/' },
        { rel: 'preconnect', href: 'https://connect.facebook.net/' },
        { rel: 'preconnect', href: 'https://securepubads.g.doubleclick.net/' },
        { rel: 'preconnect', href: 'https://tpc.googlesyndication.com/' },
        { rel: 'preconnect', href: 'https://www.googletag.com/' },
        { rel: 'preconnect', href: 'https://static.cupomnahora.com.br/' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com/' },
        { rel: 'dns-prefetch', href: 'https://securepubads.g.doubleclick.net' },
        { rel: 'dns-prefetch', href: 'https://static.cupomnahora.com.br/' }
    ]
})

const searchModalOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const searchCampaigns = ref<any[]>([]);
const isSearching = ref(false);
const searchTimeout = ref<any>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const mobileMenuOpen = ref(false);
const showAutocomplete = ref(false);
const featuredStores = ref<any[]>([]);
const autocompleteBlurTimeout = ref<any>(null);

const openSearchModal = () => {
    searchModalOpen.value = true;
    closeAutocomplete();
    setTimeout(() => {
        searchInput.value?.focus();
    }, 100);
};

const closeSearchModal = () => {
    searchModalOpen.value = false;
    searchQuery.value = '';
    searchResults.value = [];
    searchCampaigns.value = [];
};

const debouncedSearch = () => {
    if (searchTimeout.value)
        clearTimeout(searchTimeout.value);

    searchTimeout.value = setTimeout(() => {
        performSearch();
    }, 300);
};

const onSearchFocus = () => {
    if (autocompleteBlurTimeout.value)
        clearTimeout(autocompleteBlurTimeout.value);

    showAutocomplete.value = true;
    loadFeaturedStores();
};

const onSearchBlur = () => {
    autocompleteBlurTimeout.value = setTimeout(() => {
        showAutocomplete.value = false;
    }, 150);
};

const closeAutocomplete = () => {
    showAutocomplete.value = false;
    if (autocompleteBlurTimeout.value) {
        clearTimeout(autocompleteBlurTimeout.value);
    }
};

const loadFeaturedStores = async () => {
    if (featuredStores.value.length === 0) {
        try {
            const campaigns = await affiliateAPI.campaigns.getAllWithCouponCounts();

            if (campaigns && Array.isArray(campaigns)) {
                featuredStores.value = campaigns
                    .filter((campaign: any) => campaign.active !== false)
                    .sort((a: any, b: any) => {
                        if (a.highlight && !b.highlight) return -1;
                        if (!a.highlight && b.highlight) return 1;
                        return (b.couponCount || 0) - (a.couponCount || 0);
                    })
                    .slice(0, 8);
            }
        } catch (error) {
            console.error('Erro ao carregar lojas em destaque:', error);
            featuredStores.value = [];
        }
    }
};

const performSearch = async () => {
    if (searchQuery.value.trim().length < 2) {
        searchResults.value = [];
        searchCampaigns.value = [];
        return;
    }

    isSearching.value = true;

    try {
        const query = searchQuery.value.trim();
        const postPromise = blogAPI.posts.search(query);
        const campaignsPromise = affiliateAPI.campaigns.searchCampaigns(query);
        const [postResponse, campaignsResponse] = await Promise.all([postPromise, campaignsPromise]);

        if (Array.isArray(postResponse)) {
            searchResults.value = postResponse;
        } else if (postResponse && typeof postResponse === 'object') {
            const typedResponse = postResponse as { posts?: any[] };
            searchResults.value = Array.isArray(typedResponse.posts) ? typedResponse.posts : [];
        } else {
            searchResults.value = [];
        }

        if (campaignsResponse && Array.isArray(campaignsResponse)) {
            searchCampaigns.value = campaignsResponse;
        } else {
            searchCampaigns.value = [];
        }
    } catch (error) {
        searchResults.value = [];
        searchCampaigns.value = [];
    } finally {
        isSearching.value = false;
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

const categoriesColumns = computed(() => {
    const allCategories: any[] = [];
    const columnSize = Math.ceil(allCategories.length / 3);

    return [
        allCategories.slice(0, columnSize),
        allCategories.slice(columnSize, columnSize * 2),
        allCategories.slice(columnSize * 2)
    ];
});

const isScratchModalOpen = ref(false);
const selectedCouponForScratch = ref<any | null>(null);

const checkCouponInUrl = async () => {
    const displayCode = route.query.display;

    if (displayCode && typeof displayCode === 'string') {
        try {
            let foundCoupon: any = null;
            let relatedCampaign: any = null;

            if (couponsStore.getFeaturedCoupons.length > 0)
                foundCoupon = couponsStore.getFeaturedCoupons.find(c => c.code === displayCode);

            if (!foundCoupon && couponsStore.getTop25Coupons.length > 0)
                foundCoupon = couponsStore.getTop25Coupons.find(c => c.code === displayCode);

            if (!foundCoupon) {
                const campaigns = campaignsStore.getCampaigns || [];
                for (const campaign of campaigns) {
                    const campaignCoupons = couponsStore.getCampaignCoupons(campaign.id);
                    if (campaignCoupons && campaignCoupons.length > 0) {
                        foundCoupon = campaignCoupons.find(c => c.code === displayCode);
                        if (foundCoupon) {
                            relatedCampaign = campaign;
                            break;
                        }
                    }
                }
            }

            if (foundCoupon) {
                if (!foundCoupon.campaignName || !foundCoupon.campaignLogo) {
                    if (!relatedCampaign) {
                        const campaigns = campaignsStore.getCampaigns || [];
                        relatedCampaign = campaigns.find(c => c.id === foundCoupon.campaignId);
                    }

                    selectedCouponForScratch.value = {
                        ...foundCoupon,
                        campaignName: relatedCampaign?.name || 'Loja',
                        campaignLogo: relatedCampaign?.logo || null
                    };
                } else {
                    selectedCouponForScratch.value = foundCoupon;
                }
                isScratchModalOpen.value = true;
            }
        } catch (error) {
            console.error('Erro ao processar código do cupom:', error);
        }
    }
};

const closeScratchModal = () => {
    isScratchModalOpen.value = false;
    selectedCouponForScratch.value = null;
};

onMounted(async () => {
    await checkCouponInUrl();
});

const newsletterAPI = newsletterVue3.useNewsletter();
const newsletterEmail = ref('');
const newsletterSubmitted = ref(false);
const newsletterMessage = ref('');
const newsletterError = ref('');
const isSubscribing = ref(false);

const subscribeNewsletter = async () => {
    if (!newsletterEmail.value || !isValidEmail(newsletterEmail.value)) {
        newsletterError.value = 'Por favor, informe um e-mail válido.';
        return;
    }

    try {
        newsletterError.value = '';
        isSubscribing.value = true;
        const emailToSubmit = newsletterEmail.value;

        const response = await fetch('/api/newsletter/subscribers/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailToSubmit,
                source: 'footer'
            })
        });

        if (response.ok) {
            newsletterSubmitted.value = true;
            newsletterMessage.value = 'Obrigado! Você foi inscrito com sucesso.';
            newsletterEmail.value = '';

            setTimeout(() => {
                newsletterSubmitted.value = false;
            }, 5000);
        } else {
            throw new Error('Falha na requisição');
        }

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        newsletterError.value = 'Não foi possível processar sua inscrição. Tente novamente.';
    } finally {
        isSubscribing.value = false;
    }
};

const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
</script>

<style>
.hero-gradient {
    background: linear-gradient(90deg, #4338ca, #6366f1);
}
.store-card:hover {
    transform: translateY(-5px);
    transition: all 0.3s ease;
}
.coupon-card:hover {
    border-color: #6366f1;
}
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.autocomplete-dropdown {
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.autocomplete-item:hover {
    background: linear-gradient(90deg, rgba(67, 56, 202, 0.05), rgba(99, 102, 241, 0.05));
}

input[type="text"]:focus + button svg {
    color: #4338ca;
}
</style>
