<template>
    <div class="flex flex-col min-h-screen bg-neutral-100">
        <!-- Skip to content link para acessibilidade -->
        <a href="#main-content" class="skip-to-content">Pular para o conteúdo</a>
        
        <!-- Header -->
        <header class="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500 text-white sticky top-0 z-50 shadow-md w-full" role="banner">
            <div class="mx-auto">
                <div class="max-w-[1200px] mx-auto px-4">
                    <div class="top-header flex justify-center items-center py-1 relative">
                        <div class="logo flex items-center">
                            <a href="/" class="text-2xl font-bold text-white" aria-label="ProPlayNews - Ir para a página inicial">
                                <img src="/src/theme-proplaynews/assets/android-icon-96x96.png" alt="ProPlayNews Logo" class="h-auto w-15 max-h-25">
                            </a>
                        </div>
                        <div class="flex items-center space-x-4 absolute right-0">
                            <!-- Lupa de Busca Destacada -->
                            <button 
                                @click="openSearchModal" 
                                class="search-icon bg-white/15 text-white border-2 border-white/30 text-xl cursor-pointer p-3 rounded-full hover:bg-white/25 hover:border-white/50 hover:scale-110 transition-all duration-300 backdrop-blur-md shadow-2xl relative group animate-pulse-subtle" 
                                aria-label="Abrir pesquisa"
                                title="🔍 Pesquisar posts"
                            >
                                <!-- Ícone de lupa mais reconhecível -->
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="3"/>
                                    <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                                </svg>
                                <!-- Pulse ring effect -->
                                <div class="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75"></div>
                                <!-- Tooltip de atalho -->
                                <div class="absolute -bottom-12 -left-4 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    🔍 Buscar
                                </div>
                            </button>
                            <!-- Botões temporariamente escondidos -->
                            <!-- <a href="#" class="text-gray-300 text-sm hover:text-[#ff0030] transition-colors">Entrar</a>
                            <a href="#" class="text-gray-300 text-sm hover:text-[#ff0030] transition-colors">Cadastrar</a> -->
                            <button 
                                @click="mobileMenuOpen = !mobileMenuOpen" 
                                class="md:hidden text-white"
                                aria-label="Abrir menu móvel"
                                :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
                                aria-controls="mobile-menu"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path v-if="mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Navegação principal -->
            <nav class="main-nav bg-white py-2 relative block" role="navigation" aria-label="Navegação principal">
                <div class="max-w-[1200px] mx-auto px-3">
                    <div class="mx-auto">
                        <div class="nav-container flex justify-center items-center relative w-full">
                            <!-- Menu para desktop e mobile com scroll horizontal -->
                            <div class="categories flex md:flex-wrap overflow-x-auto scrollbar-hide w-full md:w-auto pb-1 md:pb-0 justify-center md:justify-center">
                                <a href="/" class="text-gray-900 px-3 py-1.5 mr-2 font-bold text-sm uppercase tracking-wide md:text-base rounded hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 relative group">
                                    Home
                                    <span class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#ff0030] transition-all duration-300 group-hover:w-full"></span>
                                </a>
                                <template v-for="category in mainNavCategories.rootCategories" :key="category.id">
                                    <div v-if="mainNavCategories.childrenMap[category.id] && mainNavCategories.childrenMap[category.id].length > 0" class="relative flex-shrink-0">
                                        <button
                                            @click="(e) => toggleDropdown(category.id, e)"
                                            type="button"
                                            class="dropdown-toggle text-gray-900 px-3 py-1.5 mr-2 font-bold text-sm uppercase tracking-wide md:text-base rounded hover:bg-gray-100 transition-colors whitespace-nowrap flex items-center cursor-pointer flex-shrink-0 relative group"
                                            :class="{'bg-gray-100': openDropdowns[category.id]}"
                                            :aria-expanded="openDropdowns[category.id] ? 'true' : 'false'"
                                            :aria-controls="`dropdown-menu-${category.id}`"
                                            :id="`dropdown-button-${category.id}`"
                                        >
                                            {{ category.name }}
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 transition-transform duration-200" :class="{'rotate-180': openDropdowns[category.id]}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                            <span class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#ff0030] transition-all duration-300 group-hover:w-full"></span>
                                        </button>
                                        <div
                                            v-show="openDropdowns[category.id]"
                                            :id="`dropdown-menu-${category.id}`"
                                            class="dropdown-menu absolute left-0 top-full mt-2 w-48 rounded-md shadow-xl bg-white border border-gray-200 z-50"
                                            role="menu"
                                            :aria-labelledby="`dropdown-button-${category.id}`"
                                            style="position: absolute !important; display: block !important;"
                                        >
                                            <div v-if="!mainNavCategories.childrenMap[category.id]?.length" class="px-3 py-2 text-gray-500 text-sm">
                                                Nenhuma subcategoria
                                            </div>
                                            <a v-for="child in mainNavCategories.childrenMap[category.id]" :key="child.id"
                                                :href="`/category/${child.slug}`"
                                                class="block text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors first:rounded-t-md last:rounded-b-md"
                                                role="menuitem"
                                            >
                                                {{ child.name }}
                                            </a>
                                        </div>
                                    </div>
                                    <a
                                        v-else
                                        :href="`/category/${category.slug}`"
                                        class="text-gray-900 px-3 py-1.5 mr-2 font-bold text-sm uppercase tracking-wide md:text-base rounded hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 relative group"
                                    >
                                        {{ category.name }}
                                        <span class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#ff0030] transition-all duration-300 group-hover:w-full"></span>
                                    </a>
                                </template>
                            </div>

                            <!-- Ícones de redes sociais -->
                            <div class="hidden lg:flex items-center space-x-4 flex-shrink-0 ml-4">
                                <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors text-lg" aria-label="Facebook">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </a>
                                <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors text-lg" aria-label="Twitter">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                    </svg>
                                </a>
                                <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors text-lg" aria-label="Instagram">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                    </svg>
                                </a>
                                <a v-if="settings['blog.youtube']" :href="`https://youtube.com/${settings['blog.youtube']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors text-lg" aria-label="YouTube">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                    </svg>
                                </a>
                            </div>

                            <!-- Indicador de rolagem em dispositivos móveis -->
                            <div class="absolute right-0 bottom-0 w-8 h-full bg-gradient-to-r from-transparent to-white pointer-events-none lg:hidden" aria-hidden="true"></div>
                        </div>

                        <!-- Mobile Menu -->
                        <div v-show="mobileMenuOpen" id="mobile-menu" class="md:hidden py-2 border-t border-gray-200 mt-2">
                            <div class="flex flex-col gap-0.5">
                                <!-- Botão de Busca no Menu Mobile -->
                                <button 
                                    @click="openSearchModal"
                                    class="flex items-center w-full px-3 py-2 text-blue-600 bg-blue-50 rounded-lg font-bold text-sm transition-colors hover:bg-blue-100 border border-blue-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    🔍 BUSCAR POSTS
                                </button>
                                <a href="/" class="text-gray-900 px-3 py-1.5 font-bold text-sm uppercase tracking-wide rounded hover:bg-gray-100 transition-colors">Home</a>
                                <template v-for="category in mainNavCategories.rootCategories" :key="category.id">
                                    <div v-if="mainNavCategories.childrenMap[category.id]" class="w-full">
                                        <button
                                            @click="(e) => toggleDropdown(category.id, e)"
                                            type="button"
                                            class="dropdown-toggle flex items-center justify-between w-full text-gray-900 hover:bg-gray-100 rounded px-3 py-1.5 text-sm font-bold uppercase tracking-wide cursor-pointer"
                                            :class="{'bg-gray-100': openDropdowns[category.id]}"
                                            :aria-expanded="openDropdowns[category.id] ? 'true' : 'false'"
                                            :aria-controls="`mobile-dropdown-menu-${category.id}`"
                                            :id="`mobile-dropdown-button-${category.id}`"
                                        >
                                            {{ category.name }}
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200" :class="{'rotate-180': openDropdowns[category.id]}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div 
                                            v-show="openDropdowns[category.id]" 
                                            :id="`mobile-dropdown-menu-${category.id}`"
                                            class="pl-3 py-0.5 bg-gray-50 rounded mt-0.5"
                                            role="menu"
                                            :aria-labelledby="`mobile-dropdown-button-${category.id}`"
                                        >
                                            <a
                                                v-for="child in mainNavCategories.childrenMap[category.id]"
                                                :key="child.id"
                                                :href="`/category/${child.slug}`"
                                                class="block px-3 py-1.5 text-sm text-gray-900 font-bold uppercase tracking-wide hover:bg-gray-100 rounded"
                                                role="menuitem"
                                            >
                                                {{ child.name }}
                                            </a>
                                        </div>
                                    </div>
                                    <a
                                        v-else
                                        :href="`/category/${category.slug}`"
                                        class="block text-gray-900 hover:bg-gray-100 rounded px-3 py-1.5 text-sm font-bold uppercase tracking-wide"
                                    >
                                        {{ category.name }}
                                    </a>
                                </template>
                            </div>
                        </div>

                        <!-- Redes sociais em dispositivos móveis -->
                        <div class="flex justify-center mt-3 md:hidden" v-show="mobileMenuOpen">
                            <div class="flex items-center space-x-6">
                                <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </a>
                                <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                    </svg>
                                </a>
                                <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                    </svg>
                                </a>
                                <a v-if="settings['blog.youtube']" :href="`https://youtube.com/${settings['blog.youtube']}`" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#ff0030] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <!-- Linha decorativa -->
            <div class="h-[2px] w-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500" aria-hidden="true"></div>
        </header>

        <!-- Main Content -->
        <main id="main-content" class="flex-grow container mx-auto md:px-4 md:py-6" role="main">
            <div class="flex flex-col lg:flex-row gap-6">
                <router-view />
            </div>
        </main>

        <!-- Performance Manager para otimizações -->
        <PerformanceManager :enableLazyLoad="true" :enablePreloading="true" />

        <!-- Footer -->
        <footer class="bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 text-white" role="contentinfo">
            <div class="max-w-[1200px] mx-auto px-4 py-5">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex flex-col md:max-w-[50%]">
                        <h3 class="text-base font-bold mb-2 relative text-white drop-shadow-md">
                            Sobre o Proplay News
                            <span class="absolute bottom-0 left-0 w-8 h-0.5 bg-[#ff0030]" aria-hidden="true"></span>
                        </h3>
                        <p class="text-white text-xs mb-3 drop-shadow-md">
                            Portal especializado em esportes eletrônicos, notícias de jogos e cobertura de campeonatos. Trazendo as últimas atualizações do cenário competitivo, análises de jogos e tudo sobre o universo gamer.
                        </p>
                    </div>

                    <div class="flex flex-col md:items-end">
                        <nav aria-label="Links do rodapé">
                            <div class="flex flex-wrap gap-4 mb-3">
                                <a href="/" class="text-white text-xs hover:text-[#ff0030] transition-colors drop-shadow-md">Home</a>
                                <a href="/terms-of-service" class="text-white text-xs hover:text-[#ff0030] transition-colors drop-shadow-md">Termos de Uso</a>
                                <a href="/terms-of-privacy" class="text-white text-xs hover:text-[#ff0030] transition-colors drop-shadow-md">Política de Privacidade</a>
                            </div>
                        </nav>

                        <div class="flex space-x-4" aria-label="Redes sociais">
                            <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#ff0030] transition-colors" aria-label="Facebook">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#ff0030] transition-colors" aria-label="Twitter">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#ff0030] transition-colors" aria-label="Instagram">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.youtube']" :href="`https://youtube.com/${settings['blog.youtube']}`" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#ff0030] transition-colors" aria-label="Youtube">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.whatsapp']" :href="`https://chat.whatsapp.com/${settings['blog.whatsapp']}`" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#ff0030] transition-colors" aria-label="WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.telegram']" :href="`https://t.me/${settings['blog.telegram']}`" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#ff0030] transition-colors" aria-label="Telegram">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.325.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.discord']" :href="`https://discord.gg/${settings['blog.discord']}`" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#ff0030] transition-colors" aria-label="Discord">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="max-w-[1200px] mx-auto px-4 py-2 text-center text-xs text-white/70">
                <p>&copy; {{ new Date().getFullYear() }} ProPlayNews. Todos os direitos reservados.</p>
            </div>
        </footer>

        <!-- Search Modal -->
        <div v-if="searchModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="search-modal" role="dialog" aria-modal="true" @click="closeSearchModal">
            <div class="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true"></div>

                <!-- Modal panel -->
                <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10 border border-gray-100" @click.stop>
                    <div class="px-6 pt-6 pb-4 sm:p-8 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="w-full">
                                <div class="flex justify-end items-center mb-6">
                                    <button @click="closeSearchModal" class="text-gray-400 hover:text-gray-600 focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div class="mb-6 relative">
                                    <div class="flex items-center absolute inset-y-0 left-0 pl-4 pointer-events-none">
                                        <svg class="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="search"
                                        v-model="searchQuery"
                                        @input="debouncedSearch"
                                        @keydown.enter="performSearch"
                                        class="bg-gray-50 border-2 border-gray-200 text-gray-900 text-lg rounded-xl block w-full pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-500 search-input"
                                        placeholder="Digite sua pesquisa aqui..."
                                        autocomplete="off"
                                        ref="searchInput"
                                    />

                                    <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button @click="clearSearch" class="text-gray-400 hover:text-gray-600 focus:outline-none p-1 hover:bg-gray-100 rounded-full transition-colors">
                                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div class="mt-4 max-h-[70vh] overflow-y-auto search-results">
                                    <!-- Estado de carregamento -->
                                    <div v-if="isSearching" class="flex flex-col justify-center items-center py-12">
                                        <div class="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-blue-500 mb-4"></div>
                                        <p class="text-gray-600 text-lg">Pesquisando...</p>
                                    </div>

                                    <!-- Nenhum resultado encontrado -->
                                    <div v-else-if="searchResults.length === 0 && searchQuery.length > 1" class="py-12 text-center text-gray-600">
                                        <div class="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h4 class="text-xl font-semibold text-gray-900 mb-2">Nenhum resultado encontrado</h4>
                                        <p class="text-gray-500">Não encontramos posts para "<span class="font-medium">{{ searchQuery }}</span>"</p>
                                        <p class="text-sm text-gray-400 mt-1">Tente usar palavras-chave diferentes</p>
                                    </div>

                                    <!-- Resultados da pesquisa -->
                                    <div v-else-if="searchQuery.length > 1" class="space-y-4">
                                        <div v-if="searchResults.length > 0" class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                            <p class="text-sm font-medium text-gray-700">
                                                {{ searchResults.length }} resultado{{ searchResults.length !== 1 ? 's' : '' }} encontrado{{ searchResults.length !== 1 ? 's' : '' }}
                                            </p>
                                            <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                "{{ searchQuery }}"
                                            </div>
                                        </div>
                                        <a
                                            v-for="post in searchResults"
                                            :key="post.id"
                                            :href="`/post/${post.slug}`"
                                            class="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200 group mx-2"
                                        >
                                            <div class="flex flex-col sm:flex-row">
                                                <div class="p-4 flex-grow">
                                                    <h4 class="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{{ post.title }}</h4>
                                                    <p v-if="post.excerpt" class="text-sm text-gray-600 line-clamp-2 mb-3">
                                                        {{ post.excerpt }}
                                                    </p>
                                                    <div class="flex items-center justify-between">
                                                        <div class="text-xs text-gray-500 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {{ formatDate(post.publishedAt || post.updatedAt) }}
                                                        </div>
                                                        <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    <!-- Estado inicial -->
                                    <div v-else class="py-12 text-center text-gray-500">
                                        <div class="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <h4 class="text-xl font-semibold text-gray-900 mb-2">Pesquisar Posts</h4>
                                        <p class="text-gray-500">Digite pelo menos 2 caracteres para buscar posts</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Botão Flutuante de Busca (Mobile) -->
    <button 
        @click="openSearchModal"
        class="floating-search-button md:hidden"
        aria-label="Buscar posts"
        title="🔍 Buscar"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    </button>

    <CookieConsent />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { vue3 } from '@cmmv/blog/client';
import { useHead } from '@unhead/vue'
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';

import CookieConsent from '../../components/CookieConsent.vue';
import PerformanceManager from '../components/PerformanceManager.vue';

const blogAPI = vue3.useBlog();
const categoriesStore = useCategoriesStore();
const settingsStore = useSettingsStore();

const settings = ref<any>(settingsStore.getSettings);

const scripts = computed(() => {
    const baseScripts = [];
    return [...baseScripts, ...settingsStore.googleAnalyticsScripts];
});

useHead({
    meta: computed(() => settingsStore.allMetaTags),

    link: [
        {
            rel: 'stylesheet',
            href: '/src/theme-proplaynews/style.css'
        },
        {
            rel: 'icon',
            type: 'image/ico',
            href: '/src/theme-proplaynews/favicon.ico?v=3'
        },
        // Preconnects para recursos críticos
        { rel: 'preconnect', href: 'https://www.googletagmanager.com/' },
        { rel: 'preconnect', href: 'https://www.google-analytics.com/' },
        { rel: 'preconnect', href: 'https://www.googletag.com/' },
        { rel: 'preconnect', href: 'https://connect.facebook.net/' },
        { rel: 'preconnect', href: 'https://securepubads.g.doubleclick.net/' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com/' },
        { rel: 'dns-prefetch', href: 'https://securepubads.g.doubleclick.net' },
        { rel: 'dns-prefetch', href: 'https://images.unsplash.com' },
        { rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
    ],

    script: scripts
})

const isDarkMode = ref(false);

const applyTheme = () => {
    if (isDarkMode.value) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

const searchModalOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const isSearching = ref(false);
const searchTimeout = ref<any>(null);
const searchInput = ref<HTMLInputElement | null>(null);

const categories = ref<any[]>(categoriesStore.getCategories || []);

const footerCategories = computed(() => {
    return categories.value.slice(0, 6);
});

const mobileMenuOpen = ref(false);

const mainNavCategories = computed(() => {
    const navCategories = categories.value?.filter((category: any) => category.mainNav) || [];
    navCategories.sort((a: any, b: any) => (a.mainNavIndex ?? 999) - (b.mainNavIndex ?? 999));

    const rootCategories = navCategories.filter((cat: any) => !cat.parentCategory);
    const childCategories = navCategories.filter((cat: any) => cat.parentCategory);

    const childrenMap = childCategories.reduce((map: Record<string, any[]>, child: any) => {
        if (!map[child.parentCategory]) {
            map[child.parentCategory] = [];
        }
        map[child.parentCategory].push(child);
        return map;
    }, {} as Record<string, any[]>);

    // Removed debug logs

    return {
        rootCategories,
        childrenMap
    };
});

const openDropdowns = ref<Record<string, boolean>>({});




const toggleDropdown = (categoryId: string, event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (openDropdowns.value[categoryId]) {
        // Fecha o dropdown atual
        openDropdowns.value = {
            ...openDropdowns.value,
            [categoryId]: false
        };
    } else {
        // Fecha todos os outros e abre o atual
        const newDropdownState: Record<string, boolean> = {};
        Object.keys(openDropdowns.value).forEach(key => {
            newDropdownState[key] = false;
        });
        newDropdownState[categoryId] = true;
        openDropdowns.value = newDropdownState;
    }
};

const openSearchModal = () => {
    searchModalOpen.value = true;
    setTimeout(() => {
        searchInput.value?.focus();
    }, 100);
};

const closeSearchModal = () => {
    // Limpa timeout anterior se existir
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
        searchTimeout.value = null;
    }
    
    searchModalOpen.value = false;
    searchQuery.value = '';
    searchResults.value = [];
    isSearching.value = false;
};



const clearSearch = () => {
    // Limpa timeout anterior se existir
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
        searchTimeout.value = null;
    }
    
    searchQuery.value = '';
    searchResults.value = [];
    isSearching.value = false;
    searchInput.value?.focus();
};

const debouncedSearch = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }
    
    // Limpa resultados anteriores imediatamente para evitar cache visual
    if (searchQuery.value.trim().length < 2) {
        searchResults.value = [];
        return;
    }

    searchTimeout.value = setTimeout(() => {
        performSearch();
    }, 300);
};

const performSearch = async () => {
    const query = searchQuery.value.trim();
    
    if (query.length < 2) {
        searchResults.value = [];
        return;
    }

    // Limpa resultados anteriores antes de fazer nova pesquisa
    searchResults.value = [];
    isSearching.value = true;

    try {
        // Força uma nova instância da API para evitar cache entre páginas
        const freshBlogAPI = vue3.useBlog();
        const response = await freshBlogAPI.posts.search(query);

        let results: any[] = [];
        if (Array.isArray(response)) {
            results = response;
        } else if (response && typeof response === 'object') {
            const typedResponse = response as { posts?: any[], data?: any[] };
            results = Array.isArray(typedResponse.posts) ? typedResponse.posts : 
                     Array.isArray(typedResponse.data) ? typedResponse.data : [];
        }

        console.log(`Busca por "${query}": ${results.length} resultados encontrados`);

        // Filtra e ordena resultados por relevância
        const filteredResults = results.filter((post: any) => {
            if (!post || !post.title) return false;
            
            const title = (post.title || '').toLowerCase();
            const content = (post.content || '').toLowerCase();
            const excerpt = (post.excerpt || '').toLowerCase();
            const searchTerm = query.toLowerCase();
            
            // Verifica se o termo de busca não é muito repetitivo (ex: "gggggg")
            const isRepetitiveSearch = /^(.)\1{2,}$/.test(searchTerm);
            
            if (isRepetitiveSearch) {
                // Para buscas repetitivas, busca correspondência mais exata
                return title === searchTerm || 
                       title.includes(searchTerm + ' ') ||
                       title.includes(' ' + searchTerm) ||
                       excerpt.includes(searchTerm + ' ') ||
                       excerpt.includes(' ' + searchTerm);
            } else {
                // Busca normal: deve conter a palavra completa ou substring significativa
                return title.includes(searchTerm) || 
                       content.includes(searchTerm) || 
                       excerpt.includes(searchTerm);
            }
        });

        // Ordena por relevância (título > excerpt > conteúdo)
        filteredResults.sort((a: any, b: any) => {
            const searchTerm = query.toLowerCase();
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();
            const aExcerpt = (a.excerpt || '').toLowerCase();
            const bExcerpt = (b.excerpt || '').toLowerCase();
            
            // Prioridade: busca exata no título
            if (aTitle.includes(searchTerm) && !bTitle.includes(searchTerm)) return -1;
            if (!aTitle.includes(searchTerm) && bTitle.includes(searchTerm)) return 1;
            
            // Prioridade: busca no excerpt
            if (aExcerpt.includes(searchTerm) && !bExcerpt.includes(searchTerm)) return -1;
            if (!aExcerpt.includes(searchTerm) && bExcerpt.includes(searchTerm)) return 1;
            
            return 0;
        });

        searchResults.value = filteredResults.slice(0, 15); // Aumentado para 15 resultados
        console.log(`Resultados filtrados: ${searchResults.value.length}`);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.value = [];
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
    const allCategories = categories.value;
    const columnSize = Math.ceil(allCategories.length / 3);

    return [
        allCategories.slice(0, columnSize),
        allCategories.slice(columnSize, columnSize * 2),
        allCategories.slice(columnSize * 2)
    ];
});

onMounted(async () => {
    await Promise.all([
        (async () => {
            if (!categories.value?.length) {
                try {
                    const categoriesResponse = await blogAPI.categories.getAll();
                    if (categoriesResponse) {
                        // Atualiza tanto o store quanto a referência local
                        categoriesStore.setCategories(categoriesResponse);
                        categories.value = categoriesResponse;
                    }
                } catch (err) {
                    console.error('Failed to load categories:', err);
                }
            }
        })()
    ]);

    isDarkMode.value = false;
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    document.addEventListener('click', closeDropdownsOnClickOutside);
    
    // Adicionar atalho de teclado para busca (Ctrl+K) e ESC
    const handleKeydown = (e: KeyboardEvent) => {
        // Ctrl+K ou Cmd+K para abrir busca
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearchModal();
        }
        // ESC para fechar modal
        if (e.key === 'Escape' && searchModalOpen.value) {
            e.preventDefault();
            closeSearchModal();
        }
    };
    
    document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', closeDropdownsOnClickOutside);
    // Cleanup dos timeouts de busca
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }
});

const closeDropdownsOnClickOutside = (event: Event) => {
    const dropdownElements = document.querySelectorAll('.dropdown-menu');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    let clickedInsideDropdown = false;

    dropdownElements.forEach(el => {
        if (el.contains(event.target as Node)) {
            clickedInsideDropdown = true;
        }
    });

    dropdownToggles.forEach(el => {
        if (el.contains(event.target as Node)) {
            clickedInsideDropdown = true;
        }
    });

    if (!clickedInsideDropdown) {
        openDropdowns.value = {};
    }
};

watch(isDarkMode, () => {
    applyTheme();
});
</script>

<style scoped>
/* Navegação com marcações que ficam dentro do contêiner */
.nav-container {
    position: relative;
    overflow: visible; /* Permite que dropdowns sejam visíveis */
}

.categories {
    position: relative;
    z-index: 1;
}

/* Linha de marcação da página ativa */
.router-link-active .absolute {
    width: 100% !important;
}

/* Scrollbar customizada para navegação mobile */
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

/* Transições suaves para dropdowns */
.dropdown-menu {
    transform-origin: top;
    animation: dropdownSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
    position: absolute !important;
    z-index: 9999 !important;
    background: white !important;
    min-width: 200px !important;
}

@keyframes dropdownSlideIn {
    from {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Indicador visual de subcategorias */
.dropdown-toggle svg {
    transition: transform 0.2s ease, color 0.2s ease;
}

.dropdown-toggle:hover svg {
    color: #ff0030;
}

/* Melhor feedback visual */
.dropdown-menu a:hover {
    transform: translateX(4px);
}

/* Sistema simples: Apenas Click */

/* Hover effects melhorados */
.group:hover .absolute {
    width: 100%;
}

/* Container de navegação responsivo */
@media (max-width: 768px) {
    .categories {
        justify-content: flex-start;
        padding-left: 1rem;
        padding-right: 1rem;
    }
}

@media (min-width: 769px) {
    .categories {
        justify-content: center;
    }
 }

/* Animação da linha vermelha e branca */
.barber-line {
    height: 100%;
    width: 200%;
    background: repeating-linear-gradient(
        45deg,
        #ff0030,
        #ff0030 10px,
        #ffffff 10px,
        #ffffff 20px
    );
    animation: slide 20s linear infinite;
}

@keyframes slide {
    from {
        transform: translateX(0);
    }
    to {
        transform: translateX(-50%);
    }
}
</style>
