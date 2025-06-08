<template>
    <button
        @click="toggle"
        class="fixed top-4 left-4 z-50 p-2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-red-600 lg:hidden cursor-pointer"
        aria-label="Menu de navegação"
        :aria-expanded="sidebarOpen ? 'true' : 'false'"
        aria-controls="main-menu"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path v-if="sidebarOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </button>

    <aside
        class="fixed inset-y-0 left-0 w-64 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 z-20 transform transition-transform duration-300 ease-in-out"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
        id="main-menu"
        role="navigation"
        aria-label="Menu principal"
    >
        <div class="h-full flex flex-col">
            <div class="p-4 border-b border-neutral-200 dark:border-neutral-800" v-if="settings">
                <a href="/" class="flex flex-col items-center" aria-label="Ir para página inicial">
                    <img
                        v-if="settings['blog.logo']"
                        :src="settings['blog.logo']"
                        :alt="settings['blog.title']"
                        class="rounded-lg w-[140px] h-auto"
                        width="140"
                        height="79"
                    />
                </a>

                <div class="mt-4 flex items-center justify-center gap-2">
                    <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" rel="noopener noreferrer" title="Facebook"
                        class="flex items-center justify-center p-2 text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Facebook">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>

                    <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" rel="noopener noreferrer" title="Twitter"
                        class="flex items-center justify-center p-2 text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                    </a>

                    <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" rel="noopener noreferrer" title="Instagram"
                    class="flex items-center justify-center p-2 text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                    </a>

                    <a v-if="settings['blog.telegram']" :href="`https://t.me/${settings['blog.telegram']}`" target="_blank" rel="noopener noreferrer" title="Telegram"
                        class="flex items-center justify-center p-2 text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-6.465-3.192c-.379.12-3.447 1.446-9.582 4.105-.138.054-.32.183-.32.183-.106.051-.14.134-.14.234 0 .21.167.31.167.31l.955.417c.424.194.854.142 1.204-.108l.148-.112 2.462-1.601c.21-.114.255-.134.358-.029 0 0 .356.287 1.306 1.435.36.434.571.646.948.646.507 0 .741-.362.825-.484l.797-1.704c.214-.46.025-1.067-.908-1.356l-4.568-1.765c-.505-.204-1.068-.012-1.241.643l-.476 1.38c-.122.352.167.663.484.604l1.453-.303"/>
                        </svg>
                    </a>

                    <a v-if="settings['blog.linkedin']" :href="`https://linkedin.com/in/${settings['blog.linkedin']}`" target="_blank" rel="noopener noreferrer" title="LinkedIn"
                        class="flex items-center justify-center p-2 text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                    </a>

                    <a v-if="settings['blog.github']" :href="`https://github.com/${settings['blog.github']}`" target="_blank" rel="noopener noreferrer" title="GitHub"
                        class="flex items-center justify-center p-2 text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.236 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                    </a>
                </div>

                <div class="p-2 m-auto items-center justify-center flex">
                    <div v-if="isLoggedIn" class="flex items-center space-x-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center mt-1">
                                <a href="/member/profile" class="text-sm text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded">Profile</a>
                                <span class="text-neutral-400 dark:text-neutral-500 mx-2">|</span>
                                <button @click="logout" class="text-sm text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded">Sign Out</button>
                            </div>
                        </div>
                    </div>
                    <div v-else class="flex items-center justify-center">
                        <div class="flex space-x-2">
                            <a href="/member/login" class="text-sm text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded">Sign In</a>
                            <span class="text-neutral-400 dark:text-neutral-600">|</span>
                            <a href="/member/register" class="text-sm text-neutral-700 dark:text-neutral-300 hover:text-red-500 dark:hover:text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded">Register</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4">
                <button
                    @click="openSearchModal"
                    class="w-full flex items-center p-3 mb-6 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-950"
                    aria-label="Abrir busca"
                    aria-haspopup="dialog"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span class="text-neutral-700 dark:text-neutral-300">Search</span>
                </button>

                <!-- Categorias -->
                <div class="mb-6">
                    <h2 class="text-sm font-semibold mb-3 text-red-600 dark:text-red-500 uppercase tracking-wider flex items-center justify-between" id="categories-heading">
                        <span>Categorias</span>
                    </h2>
                    
                    <!-- Lista de categorias em estilo dropdown -->
                    <div class="space-y-1" role="navigation" aria-labelledby="categories-heading">
                        <div v-for="category in mainCategories" :key="category.id" class="bg-neutral-100 dark:bg-neutral-900 rounded-md overflow-hidden">
                            <!-- Categoria pai -->
                            <div class="group">
                                <div class="flex items-center justify-between p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                                    <a 
                                        :href="`/category/${category.slug}`" 
                                        class="text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-500 flex-grow truncate focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                                        :aria-expanded="openedCategories[category.id] ? 'true' : 'false'"
                                    >
                                        {{ category.name }} 
                                        <span class="text-xs text-neutral-500 dark:text-neutral-400">({{ category.postCount }})</span>
                                    </a>
                                    
                                    <button 
                                        v-if="hasChildren(category)" 
                                        @click.stop.prevent="toggleCategory(category.id)"
                                        class="p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-neutral-500 hover:text-red-500"
                                        :aria-expanded="openedCategories[category.id] ? 'true' : 'false'"
                                        :aria-controls="`subcategory-${category.id}`"
                                        :aria-label="openedCategories[category.id] ? `Fechar subcategorias de ${category.name}` : `Abrir subcategorias de ${category.name}`"
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            class="h-4 w-4 transform transition-transform duration-200" 
                                            :class="{ 'rotate-180': openedCategories[category.id] }" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <!-- Subcategorias (filhos) -->
                                <div 
                                    v-if="hasChildren(category) && openedCategories[category.id]" 
                                    class="pl-2 ml-2 border-l border-neutral-200 dark:border-neutral-700"
                                    :id="`subcategory-${category.id}`"
                                    role="group"
                                    :aria-label="`Subcategorias de ${category.name}`"
                                >
                                    <a 
                                        v-for="child in getCategoryChildren(category)" 
                                        :key="child.id"
                                        :href="`/category/${child.slug}`"
                                        class="flex items-center p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                                    >
                                        {{ child.name }}
                                        <span class="text-xs text-neutral-500 dark:text-neutral-500 ml-1">({{ child.postCount }})</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-center">
                <a href="/terms-of-service" class="px-2 py-1 text-xs text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
                    Terms of Service
                </a>
                <span class="text-neutral-400 dark:text-neutral-600 self-center mx-1">|</span>
                <a href="/terms-of-privacy" class="px-2 py-1 text-xs text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
                    Privacy Policy
                </a>
            </div>

        </div>
    </aside>

    <!-- Search Modal -->
    <div v-if="searchModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="search-modal" role="dialog" aria-modal="true">
        <div class="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" @click="closeSearchModal" style="backdrop-filter: blur(4px);"></div>

            <!-- Modal panel -->
            <div class="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
                <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="w-full">
                            <!-- Search header with close button -->
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg leading-6 font-medium text-neutral-900 dark:text-white" id="modal-title">
                                    Search
                                </h3>
                                <button @click="closeSearchModal" class="text-neutral-400 hover:text-neutral-500 focus:outline-none">
                                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <!-- Search input -->
                            <div class="mb-4 relative">
                                <div class="flex items-center absolute inset-y-0 left-0 pl-3 pointer-events-none">
                                    <svg class="w-5 h-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="search"
                                    v-model="searchQuery"
                                    @input="debouncedSearch"
                                    @keydown.enter="performSearch"
                                    class="bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Buscar posts..."
                                    autocomplete="off"
                                    ref="searchInput"
                                />
                                <div v-if="isSearching" class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <div class="animate-spin h-5 w-5 border-t-2 border-b-2 border-red-500 rounded-full"></div>
                                </div>
                                <div v-else-if="searchQuery.length > 0" class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button @click="clearSearch" class="text-neutral-400 hover:text-red-500 focus:outline-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Search results -->
                            <div class="mt-4 max-h-[70vh] overflow-y-auto">
                                <div v-if="isSearching" class="flex justify-center items-center py-8">
                                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                </div>

                                <div v-else-if="searchResults.length === 0 && searchQuery.length > 1" class="py-8 text-center text-neutral-600 dark:text-neutral-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>Nenhum post encontrado para "{{ searchQuery }}"</p>
                                    <p class="mt-2 text-sm">Tente usar termos mais específicos ou verifique a ortografia</p>
                                </div>

                                <!-- Search results with query -->
                                <div v-else-if="searchQuery.length > 1" class="space-y-4">
                                    <p v-if="searchResults.length > 0" class="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                                        Encontrado{{ searchResults.length !== 1 ? 's' : '' }} {{ searchResults.length }} resultado{{ searchResults.length !== 1 ? 's' : '' }}
                                    </p>
                                    <a
                                        v-for="post in searchResults"
                                        :key="post.id"
                                        :href="`/post/${post.slug}`"
                                        class="block bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div class="flex flex-col sm:flex-row">
                                            <div v-if="post.featureImage" class="w-full sm:w-32 h-40 sm:h-24 flex-shrink-0">
                                                <img :src="post.featureImage" :alt="post.title" class="w-full h-full object-cover"/>
                                            </div>
                                            <div class="p-4 flex-grow">
                                                <h4 class="font-bold text-neutral-900 dark:text-white mb-1" v-html="highlightSearchTerm(post.title, searchQuery)"></h4>
                                                <p v-if="post.excerpt" class="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2" v-html="highlightSearchTerm(post.excerpt, searchQuery)">
                                                </p>
                                                <div class="mt-2 text-xs text-neutral-500 dark:text-neutral-500 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {{ formatDate(post.publishedAt || post.updatedAt) }}
                                                </div>
                                                <!-- Exibir score de relevância (apenas para debugging) -->
                                                <div v-if="post.relevanceScore !== undefined" class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                                                    <span v-if="post.categories && post.categories.length > 0" class="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded px-2 py-0.5 mr-1">
                                                        {{ post.categories[0].name }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>

                                <!-- Recent Posts Preview (shown when no search query) -->
                                <div v-else class="space-y-4">
                                    <div class="flex items-center justify-between mb-4">
                                        <h3 class="font-medium text-neutral-800 dark:text-white">Recent Posts</h3>
                                        <a href="/" class="text-sm text-red-600 dark:text-red-400 hover:underline">View all</a>
                                    </div>

                                    <div v-if="isLoadingRecentPosts" class="flex justify-center items-center py-8">
                                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                    </div>

                                    <a
                                        v-else
                                        v-for="post in recentPosts"
                                        :key="post.id"
                                        :href="`/post/${post.slug}`"
                                        class="block bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div class="flex flex-col sm:flex-row">
                                            <div v-if="post.featureImage" class="w-full sm:w-36 h-48 sm:h-28 relative flex-shrink-0">
                                                <img :src="post.featureImage" :alt="post.title" class="w-full h-full object-cover"/>
                                                <div v-if="post.categories && post.categories.length > 0"
                                                     class="absolute top-0 left-0 bg-red-600 text-white text-xs px-2 py-1 m-1 rounded">
                                                    {{ post.categories[0].name }}
                                                </div>
                                            </div>
                                            <div class="p-4 flex-grow">
                                                <h4 class="font-bold text-neutral-900 dark:text-white mb-1">{{ post.title }}</h4>
                                                <p v-if="post.excerpt" class="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                                    {{ post.excerpt }}
                                                </p>
                                                <div class="mt-2 flex items-center justify-between">
                                                    <div class="text-xs text-neutral-500 dark:text-neutral-500 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {{ formatDate(post.publishedAt || post.updatedAt) }}
                                                    </div>
                                                    <span class="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-300">
                                                        Read more
                                                    </span>
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

    <!-- Login Modal (if we want to provide quick login without navigating to the page) -->
    <div v-if="loginModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="login-modal" role="dialog" aria-modal="true">
        <div class="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" @click="closeLoginModal" style="backdrop-filter: blur(4px);"></div>

            <!-- Modal panel -->
            <div class="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="w-full">
                            <!-- Login header with close button -->
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg leading-6 font-medium text-neutral-900 dark:text-white" id="modal-title">
                                    Login
                                </h3>
                                <button @click="closeLoginModal" class="text-neutral-400 hover:text-neutral-500 focus:outline-none">
                                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <!-- Login form -->
                            <form @submit.prevent="handleLogin">
                                <div class="mb-4">
                                    <label for="email" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        v-model="loginForm.email"
                                        required
                                        class="bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white text-sm rounded-lg block w-full p-2.5 focus:ring-red-500 focus:border-red-500"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div class="mb-4">
                                    <label for="password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        v-model="loginForm.password"
                                        required
                                        class="bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white text-sm rounded-lg block w-full p-2.5 focus:ring-red-500 focus:border-red-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div class="flex items-center justify-between mb-6">
                                    <div class="flex items-center">
                                        <input
                                            id="remember-me"
                                            type="checkbox"
                                            v-model="loginForm.rememberMe"
                                            class="h-4 w-4 text-red-600 focus:ring-red-500 border-neutral-300 rounded"
                                        />
                                        <label for="remember-me" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                                            Remember me
                                        </label>
                                    </div>
                                    <a href="#" class="text-sm text-red-600 dark:text-red-400 hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <div v-if="loginError" class="mb-4 text-sm text-red-600 dark:text-red-400">
                                    {{ loginError }}
                                </div>
                                <div>
                                    <button
                                        type="submit"
                                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        :disabled="isLoggingIn"
                                    >
                                        <span v-if="isLoggingIn">
                                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Logging in...
                                        </span>
                                        <span v-else>Sign in</span>
                                    </button>
                                </div>
                                <div class="mt-4 text-center">
                                    <span class="text-sm text-neutral-600 dark:text-neutral-400">Don't have an account?</span>
                                    <a href="/member/register" class="ml-1 text-sm text-red-600 dark:text-red-400 hover:underline">Register</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="isLoggedIn" class="fixed bottom-4 right-4 z-40 lg:hidden">
        <button
            @click="toggleProfileDropdown"
            class="flex items-center space-x-2 px-4 py-2 bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-full shadow-lg transition-colors"
        >
            <div class="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden bg-red-600 text-white">
                <img
                    v-if="currentMember.avatar"
                    :src="currentMember.avatar"
                    :alt="currentMember.name"
                    class="h-full w-full object-cover"
                />
                <span v-else class="text-sm font-medium">{{ memberInitials }}</span>
            </div>
            <span class="text-sm font-medium">{{ currentMember.name || 'My Profile' }}</span>
        </button>

        <div v-if="profileDropdownOpen" class="absolute bottom-14 right-0 w-48 py-2 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700">
            <a href="/member/profile" class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                View Profile
            </a>
            <a href="/member/settings" class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                Settings
            </a>
            <div class="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
            <button @click="logout" class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                Sign Out
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { vue3 } from '@cmmv/blog/client';
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
import CategoryItem from './CategoryItem.vue';

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();

const blogAPI = vue3.useBlog();
const settings = ref<any>(settingsStore.getSettings);
const categories = ref<any[]>(categoriesStore.getCategories || []);
const sidebarOpen = ref(false)
const searchModalOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const isSearching = ref(false)
const searchTimeout = ref<any>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const recentPosts = ref<any[]>([])
const isLoadingRecentPosts = ref(false)

const isLoggedIn = ref(false);
const currentMember = ref<any>({});
const loginModalOpen = ref(false);
const loginForm = ref({
    email: '',
    password: '',
    rememberMe: false
});
const isLoggingIn = ref(false);
const loginError = ref('');

const memberInitials = computed(() => {
    if (!currentMember.value?.name) return '';
    return currentMember.value.name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
})

const groupedCategories = computed(() => {
    const allCategories = categories.value || [];
    if (!allCategories.length) return [];

    const categoriesById: Record<string, any> = {};
    allCategories.forEach(category => {
        categoriesById[category.id] = { ...category, children: [] };
    });

    const rootCategories: any[] = [];
    allCategories.forEach(category => {
        if (category.parent && categoriesById[category.parent]) {
            categoriesById[category.parent].children.push(categoriesById[category.id]);
        } else {
            rootCategories.push(categoriesById[category.id]);
        }
    });

    // Sort children within each parent
    Object.values(categoriesById).forEach(cat => {
        if (cat.children && cat.children.length > 0) {
            cat.children.sort((a: any, b: any) => a.name.localeCompare(b.name));
        }
    });
    
    // Sort root categories
    rootCategories.sort((a, b) => a.name.localeCompare(b.name));

    return rootCategories;
});

const toggle = () => {
    sidebarOpen.value = !sidebarOpen.value;
}

const openSearchModal = () => {
    searchModalOpen.value = true;
    loadRecentPosts();
    
    nextTick(() => {
        setTimeout(() => {
            if (searchInput.value) {
                searchInput.value.focus();
            }
        }, 100);
    });
}

const closeSearchModal = () => {
    searchModalOpen.value = false;
    searchQuery.value = '';
    searchResults.value = [];
}

const loadRecentPosts = async () => {
    if (recentPosts.value.length > 0) return;

    isLoadingRecentPosts.value = true;

    try {
        const response = await blogAPI.posts.getAll(0);

        if (Array.isArray(response)) {
            recentPosts.value = response.slice(0, 5);
        } else if (response && typeof response === 'object') {
            const typedResponse = response as { posts?: any[] };
            recentPosts.value = typedResponse.posts ? typedResponse.posts.slice(0, 5) : [];
        } else {
            recentPosts.value = [];
            console.warn('Formato de resposta inesperado ao carregar posts recentes:', response);
        }
    } catch (error) {
        console.error('Erro ao carregar posts recentes:', error);
        recentPosts.value = [];
    } finally {
        isLoadingRecentPosts.value = false;
    }
}

const debouncedSearch = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = setTimeout(() => {
        performSearch();
    }, 300);
}

const performSearch = async () => {
    // Verificar se a consulta tem pelo menos 2 caracteres
    if (searchQuery.value.trim().length < 2) {
        searchResults.value = [];
        return;
    }

    isSearching.value = true;

    try {
        // Verificar se a API está disponível
        if (!blogAPI || !blogAPI.posts || typeof blogAPI.posts.search !== 'function') {
            console.error('API de busca não disponível');
            throw new Error('API de busca não disponível');
        }

        const trimmedQuery = searchQuery.value.trim();
        console.log('Realizando busca por:', trimmedQuery);
        
        const response = await blogAPI.posts.search(trimmedQuery);
        console.log('Resposta da busca:', response);

        let results: any[] = [];
        
        if (Array.isArray(response)) {
            results = response;
        } else if (response && typeof response === 'object') {
            // Suporte a diferentes formatos de resposta
            if (Array.isArray(response.posts)) {
                results = response.posts;
            } else if (Array.isArray(response.data)) {
                results = response.data;
            } else if (Array.isArray(response.results)) {
                results = response.results;
            } else {
                const typedResponse = response as { posts?: any[] };
                results = Array.isArray(typedResponse.posts) ? typedResponse.posts : [];
            }
        } else {
            results = [];
            console.warn('Formato de resposta inesperado durante a busca:', response);
        }
        
        // Melhorar a relevância dos resultados
        if (results.length > 0) {
            // Calcular pontuação de relevância para cada resultado
            results = results.map((post: any) => {
                let relevanceScore = 0;
                const searchTermLower = trimmedQuery.toLowerCase();
                
                // Título contém o termo de busca exato (maior pontuação)
                if (post.title && post.title.toLowerCase().includes(searchTermLower)) {
                    relevanceScore += 10;
                    // Título começa com o termo de busca (pontuação ainda maior)
                    if (post.title.toLowerCase().startsWith(searchTermLower)) {
                        relevanceScore += 5;
                    }
                }
                
                // Verificar nas categorias
                if (post.categories && Array.isArray(post.categories)) {
                    post.categories.forEach((cat: any) => {
                        if (cat.name && cat.name.toLowerCase().includes(searchTermLower)) {
                            relevanceScore += 8;
                        }
                    });
                }
                
                // Verificar nas tags
                if (post.tags && Array.isArray(post.tags)) {
                    post.tags.forEach((tag: any) => {
                        if (tag.name && tag.name.toLowerCase().includes(searchTermLower)) {
                            relevanceScore += 7;
                        }
                    });
                }
                
                // Verificar no resumo/excerto
                if (post.excerpt && post.excerpt.toLowerCase().includes(searchTermLower)) {
                    relevanceScore += 3;
                }
                
                // Verificar no conteúdo (menor pontuação pois é menos específico)
                if (post.html && post.html.toLowerCase().includes(searchTermLower)) {
                    relevanceScore += 1;
                }
                
                return { ...post, relevanceScore };
            });
            
            // Filtrar resultados com pontuação zero (irrelevantes)
            results = results.filter((post: any) => post.relevanceScore > 0);
            
            // Ordenar por relevância
            results.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
        }
        
        searchResults.value = results;
    } catch (error) {
        console.error('Erro na busca:', error);
        searchResults.value = [];
    } finally {
        isSearching.value = false;
    }
}

const closeLoginModal = () => {
    loginModalOpen.value = false
    loginForm.value = {
        email: '',
        password: '',
        rememberMe: false
    }
    loginError.value = ''
}

const handleLogin = async () => {
    loginError.value = ''
    isLoggingIn.value = true

    try {
        const loginData = {
            email: loginForm.value.email,
            password: loginForm.value.password
        }

        const response = await fetch('/api/members/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })

        if (!response.ok)
            throw new Error('Invalid login credentials')

        const data = await response.json()

        if (data && data.token && data.member) {
            currentMember.value = data.member
            isLoggedIn.value = true
            closeLoginModal()

            if (loginForm.value.rememberMe) {
                localStorage.setItem('member', JSON.stringify({
                    token: data.token,
                    member: data.member
                }))
            } else {
                sessionStorage.setItem('member', JSON.stringify({
                    token: data.token,
                    member: data.member
                }))
            }
        } else {
            loginError.value = 'Invalid login credentials'
        }
    } catch (error: any) {
        console.error('Login error:', error)
        loginError.value = error.message || 'Failed to login. Please try again.'
    } finally {
        isLoggingIn.value = false
    }
}

const logout = () => {
    currentMember.value = {};
    isLoggedIn.value = false;

    localStorage.removeItem('member');
    sessionStorage.removeItem('member');

    const currentPath = window.location.pathname;

    if (currentPath.startsWith('/member/'))
        window.location.href = '/'
}

const checkAuthentication = () => {
    const sessionData = sessionStorage.getItem('member');

    if (sessionData) {
        try {
            const parsed = JSON.parse(sessionData)
            if (parsed.token && parsed.member) {
                isLoggedIn.value = true
                currentMember.value = parsed.member
                return
            }
        } catch (e) {
            console.error('Error parsing session data:', e)
        }
    }

    const localData = localStorage.getItem('member');

    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            if (parsed.token && parsed.member) {
                isLoggedIn.value = true;
                currentMember.value = parsed.member;
                return;
            }
        } catch (e) {
            console.error('Error parsing local data:', e);
        }
    }

    isLoggedIn.value = false;
    currentMember.value = {};
}

const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
    }

    if (e.key === 'Escape') {
        if (searchModalOpen.value)
            closeSearchModal();

        if (loginModalOpen.value)
            closeLoginModal();
    }
}

const profileDropdownOpen = ref(false);

const toggleProfileDropdown = () => {
    profileDropdownOpen.value = !profileDropdownOpen.value;
}

const handleClickOutside = (event: MouseEvent) => {
    if (profileDropdownOpen.value) {
        const target = event.target as HTMLElement;

        if (!target.closest('.profile-dropdown'))
            profileDropdownOpen.value = false;
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleGlobalSearch);
    checkAuthentication();
    
    // Fetch categories if they're not already loaded
    if (!categories.value.length) {
        blogAPI.categories.getAll()
            .then(categoriesResponse => {
                if (categoriesResponse) {
                    categories.value = categoriesResponse;
                }
            })
            .catch(err => {
                console.error('Failed to load categories:', err);
            });
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleGlobalSearch);
});

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Estado para controlar quais categorias estão expandidas no dropdown
const openedCategories = ref<Record<string, boolean>>({});

// Categorias formatadas para o menu principal
const mainCategories = computed(() => {
    // Usar as categorias agrupadas mas em formato plano para o menu dropdown
    return groupedCategories.value;
});

// Verificar se uma categoria tem filhos
const hasChildren = (category: any) => {
    return category.children && category.children.length > 0;
};

// Obter os filhos de uma categoria
const getCategoryChildren = (category: any) => {
    return category.children || [];
};

// Alternar visibilidade de uma categoria
const toggleCategory = (categoryId: string) => {
    openedCategories.value = {
        ...openedCategories.value,
        [categoryId]: !openedCategories.value[categoryId]
    };
};

// Verificar se o usuário está pressionando Ctrl+K ou Cmd+K para abrir a busca
const handleGlobalSearch = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
    }
};

const clearSearch = () => {
    searchQuery.value = '';
    searchResults.value = [];
    loadRecentPosts();
    setTimeout(() => {
        if (searchInput.value) {
            searchInput.value.focus();
        }
    }, 100);
};

const highlightSearchTerm = (text: string, query: string): string => {
    if (!text || !query || query.trim() === '') return text;
    
    // Escapar caracteres especiais para evitar problemas com regex
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // Escapar HTML para prevenir XSS
    const escapeHtml = (str: string) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    
    const safeText = escapeHtml(text);
    const safeQuery = escapeRegExp(query.trim());
    
    try {
        const regex = new RegExp(`(${safeQuery})`, 'gi');
        return safeText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</mark>');
    } catch (e) {
        console.error('Erro ao destacar termos de busca:', e);
        return safeText;
    }
}
</script>
