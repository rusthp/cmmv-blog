<template>
    <div class="flex min-h-screen bg-gray-100">
                <!-- Mobile Toggle Button -->
        <button
            @click="sidebarOpen = !sidebarOpen"
            class="mobile-toggle-btn group lg:hidden"
            aria-label="Abrir menu lateral"
            :aria-expanded="sidebarOpen"
            aria-controls="sidebar"
        >
            <div class="mobile-toggle-bg"></div>
            <svg xmlns="http://www.w3.org/2000/svg" class="mobile-toggle-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path v-if="sidebarOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <!-- Sidebar -->
        <aside
            id="sidebar"
            class="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-gray-900 via-black to-gray-900 z-50 transform transition-all duration-300 ease-in-out shadow-2xl border-r border-red-500/20"
            :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
            style="overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none;"
            role="navigation"
            aria-label="Menu principal"
        >
            <!-- Decorative gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-red-600/10 pointer-events-none" style="z-index: 1;"></div>
            
            <div class="relative h-full flex flex-col" style="z-index: 10;">
                <!-- Logo Section -->
                <div class="p-8 border-b border-red-500/20 bg-gradient-to-r from-red-600/10 to-transparent">
                    <a href="/" class="flex flex-col items-center mb-6 group" aria-label="Página inicial Central Otaku">
                        <div class="relative">
                            <img src="/src/theme-centralotaku/logo2.png" width="140" height="45" alt="Logo Central Otaku" title="Logo Central Otaku" class="transition-transform duration-300 group-hover:scale-105">
                            <div class="absolute -inset-2 bg-gradient-to-r from-red-600/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </div>
                    </a>

                    <!-- Social Icons Grid -->
                    <div class="grid grid-cols-3 gap-3 mb-6">
                        <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" rel="noopener noreferrer" title="Facebook"
                            class="social-icon group relative overflow-hidden" aria-label="Facebook">
                            <div class="social-icon-bg facebook"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>

                        <a v-if="settings['blog.discord']" :href="`https://discord.gg/${settings['blog.discord']}`" target="_blank" rel="noopener noreferrer" title="Discord"
                            class="social-icon group relative overflow-hidden" aria-label="Discord">
                            <div class="social-icon-bg discord"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                            </svg>
                        </a>

                        <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" rel="noopener noreferrer" title="Instagram"
                            class="social-icon group relative overflow-hidden" aria-label="Instagram">
                            <div class="social-icon-bg instagram"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                            </svg>
                        </a>

                        <a v-if="settings['blog.youtube']" :href="`https://youtube.com/${settings['blog.youtube']}`" target="_blank" rel="noopener noreferrer" title="Youtube"
                            class="social-icon group relative overflow-hidden" aria-label="Youtube">
                            <div class="social-icon-bg youtube"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                            </svg>
                        </a>

                        <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" rel="noopener noreferrer" title="Twitter/X"
                            class="social-icon group relative overflow-hidden" aria-label="Twitter/X">
                            <div class="social-icon-bg twitter"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                        </a>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center justify-center gap-3">
                        <!-- Theme Toggle -->
                        <button @click="toggleTheme" class="action-btn group relative overflow-hidden" :title="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'" :aria-label="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'">
                            <div class="action-btn-bg"></div>
                            <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </button>

                        <!-- Search Button -->
                        <button @click="openSearchModal" class="action-btn group relative overflow-hidden" title="Pesquisar" aria-label="Abrir modal de pesquisa">
                            <div class="action-btn-bg"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Navigation Section -->
                <div class="flex-1 p-6" style="overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none;">
                    <div class="mb-6">
                        <h2 class="text-lg font-bold text-white mb-2 flex items-center">
                            <span class="w-1 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full mr-3" aria-hidden="true"></span>
                            Categorias
                        </h2>
                        <div class="h-px bg-gradient-to-r from-red-500/50 to-transparent"></div>
                    </div>
                    
                    <nav class="space-y-2" aria-label="Navegação de categorias">
                        <template v-for="category in mainNavCategories.rootCategories" :key="category.id">
                            <!-- Category with children -->
                            <div v-if="mainNavCategories.childrenMap[category.id]" class="nav-item-group">
                                <button
                                    @click="(e) => toggleDropdown(category.id, e)"
                                    class="nav-item dropdown-toggle group w-full flex items-center justify-between"
                                    :class="{'active': openDropdowns[category.id]}"
                                    :aria-expanded="openDropdowns[category.id]"
                                    :aria-controls="`dropdown-content-${category.id}`"
                                >
                                    <div class="flex items-center">
                                        <div class="nav-item-icon" aria-hidden="true">
                                            <div class="nav-item-dot"></div>
                                        </div>
                                        <span class="nav-item-text">{{ category.name }}</span>
                                    </div>
                                    <svg class="nav-dropdown-icon" :class="{'rotate-180': openDropdowns[category.id]}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                
                                <!-- Dropdown content -->
                                <div v-show="openDropdowns[category.id]" :id="`dropdown-content-${category.id}`" class="nav-dropdown">
                                    <div class="nav-dropdown-content">
                                        <a
                                            v-for="child in mainNavCategories.childrenMap[category.id]"
                                            :key="child.id"
                                            :href="`/category/${child.slug}`"
                                            class="nav-sub-item group"
                                        >
                                            <div class="nav-sub-item-line" aria-hidden="true"></div>
                                            <span class="nav-sub-item-text">{{ child.name }}</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Single category -->
                            <div v-else class="nav-item-group">
                                <a
                                    :href="`/category/${category.slug}`"
                                    class="nav-item group"
                                >
                                    <div class="nav-item-icon" aria-hidden="true">
                                        <div class="nav-item-dot"></div>
                                    </div>
                                    <span class="nav-item-text">{{ category.name }}</span>
                                </a>
                            </div>
                        </template>
                    </nav>
                </div>

                <!-- Footer da Sidebar -->
                <div class="p-6 border-t border-red-500/20 bg-gradient-to-t from-black/50 to-transparent">
                    <div class="flex flex-col items-center space-y-3">
                        <div class="flex items-center space-x-4">
                            <a href="/terms-of-service" class="footer-link group">
                                <span class="footer-link-text">Termos de Uso</span>
                                <div class="footer-link-underline" aria-hidden="true"></div>
                            </a>
                            <div class="w-px h-4 bg-gradient-to-b from-red-500/50 to-transparent" aria-hidden="true"></div>
                            <a href="/terms-of-privacy" class="footer-link group">
                                <span class="footer-link-text">Privacidade</span>
                                <div class="footer-link-underline" aria-hidden="true"></div>
                            </a>
                        </div>
                        <div class="text-xs text-gray-500 text-center">
                            © {{ new Date().getFullYear() }} Central Otaku
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex-1 lg:ml-72">
        <!-- Main content -->
            <main class="container mx-auto px-4 py-6" id="main-content" role="main">
            <div class="flex flex-col lg:flex-row gap-6">
                <router-view />
            </div>
        </main>

        <!-- Newsletter Section -->
            <section class="bg-red-600 py-10 text-white" aria-labelledby="newsletter-heading">
            <div class="max-w-[1200px] mx-auto px-4">
                <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="md:w-1/2">
                        <h3 id="newsletter-heading" class="text-2xl font-bold mb-2">Inscreva-se em nossa Newsletter</h3>
                        <p class="text-gray-200 mb-4">
                            Receba as últimas notícias e atualizações diretamente no seu e-mail.
                            Fique por dentro de tudo sobre o universo Otaku.
                        </p>
                    </div>
                    <div class="md:w-1/2 w-full">
                        <div v-if="newsletterSubmitted" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <p class="text-green-700">{{ newsletterMessage }}</p>
                            </div>
                        </div>

                        <div v-if="newsletterError" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <p class="text-red-700">{{ newsletterError }}</p>
                            </div>
                        </div>

                        <form @submit.prevent="subscribeNewsletter" class="flex w-full">
                            <label for="newsletter-email" class="sr-only">Seu email</label>
                            <input id="newsletter-email" v-model="newsletterEmail" type="email" placeholder="Seu email"
                                class="flex-grow px-4 py-3 rounded-l-md border-0 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                aria-required="true"
                            >
                            <button type="submit" class="bg-slate-700 text-white font-medium px-6 py-3 rounded-r-md hover:bg-slate-600 transition-colors whitespace-nowrap" :disabled="isSubscribing">
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
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-[#333333] text-white" role="contentinfo" aria-labelledby="footer-heading">
            <div class="max-w-[1200px] mx-auto px-4 py-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 id="footer-heading" class="text-lg font-bold mb-4 relative pb-3">
                            Sobre o Central Otaku
                            <span class="absolute bottom-0 left-0 w-10 h-1 bg-red-500" aria-hidden="true"></span>
                        </h3>
                        <p class="text-gray-300 text-sm mb-4">
                            🎌 Central Otaku – Onde a paixão por animes se encontra com a informação!
                        </p>
                        <ul class="space-y-2 mb-4">
                            <li><a href="/" class="text-gray-300 hover:text-red-500">Home</a></li>
                            <li><a href="/terms-of-service" class="text-gray-300 hover:text-red-500">Termos de Uso</a></li>
                            <li><a href="/terms-of-privacy" class="text-gray-300 hover:text-red-500">Política de Privacidade</a></li>
                        </ul>
                        <div class="flex space-x-5">
                            <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Facebook">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Twitter">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Instagram">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.youtube']" :href="`https://youtube.com/${settings['blog.youtube']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Youtube">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.whatsapp']" :href="`https://chat.whatsapp.com/${settings['blog.whatsapp']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.telegram']" :href="`https://t.me/${settings['blog.telegram']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Telegram">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.325.037.342.22.149.44.38.464.597.042.024-.024.121-.12.145-.24.024-.12-.12-.12-.144.024-.12.12.12.12.144.24.36.48.36.6.024.12-.024.12-.12.024-.12zM12 5.52a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm9.6 14.4c-.024.12-.144.144-.12.024.12.12.12.12.12.12.12.12z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.discord']" :href="`https://discord.gg/${settings['blog.discord']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Discord">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-bold mb-4 relative pb-3">
                            Categorias
                            <span class="absolute bottom-0 left-0 w-10 h-1 bg-red-500" aria-hidden="true"></span>
                        </h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4">
                            <ul class="space-y-2">
                                <li v-for="(category, index) in categoriesColumns[0]" :key="category.id">
                                    <a :href="`/category/${category.slug}`" class="text-gray-300 hover:text-red-500">
                                        {{ category.name }}
                                    </a>
                                </li>
                            </ul>
                            <ul class="space-y-2">
                                <li v-for="category in categoriesColumns[1]" :key="category.id">
                                    <a :href="`/category/${category.slug}`" class="text-gray-300 hover:text-red-500">
                                        {{ category.name }}
                                    </a>
                                </li>
                            </ul>
                            <ul class="space-y-2">
                                <li v-for="category in categoriesColumns[2]" :key="category.id">
                                    <a :href="`/category/${category.slug}`" class="text-gray-300 hover:text-red-500">
                                        {{ category.name }}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-700 mt-8 pt-6 text-center">
                    <p class="text-gray-400 text-sm">
                        &copy; {{ new Date().getFullYear() }} Central Otaku - Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
        </div>

        <!-- Search Modal -->
        <div v-if="searchModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="search-modal-title" role="dialog" aria-modal="true">
            <div class="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" @click="closeSearchModal" style="backdrop-filter: blur(4px);"></div>

                <!-- Modal panel -->
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
                    <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="w-full">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="search-modal-title">
                                        Pesquisar
                                    </h3>
                                    <button @click="closeSearchModal" class="text-gray-400 hover:text-gray-500 focus:outline-none" aria-label="Fechar modal de pesquisa">
                                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div class="mb-4 relative">
                                    <div class="flex items-center absolute inset-y-0 left-0 pl-3 pointer-events-none" aria-hidden="true">
                                        <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <label for="search-input-modal" class="sr-only">Pesquisar posts</label>
                                    <input
                                        id="search-input-modal"
                                        type="search"
                                        v-model="searchQuery"
                                        @input="debouncedSearch"
                                        class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Pesquisar posts..."
                                        autocomplete="off"
                                        ref="searchInput"
                                        aria-describedby="search-results-description"
                                    />
                                </div>

                                <div class="mt-4 max-h-[70vh] overflow-y-auto">
                                    <div v-if="isSearching" class="flex justify-center items-center py-8" role="status" aria-live="polite">
                                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                        <span class="sr-only">Procurando...</span>
                                    </div>

                                    <div v-else-if="searchResults.length === 0 && searchQuery.length > 1" class="py-8 text-center text-gray-600" role="status" aria-live="polite">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>Nenhum resultado encontrado para "{{ searchQuery }}"</p>
                                    </div>

                                    <div v-else-if="searchQuery.length > 1" class="space-y-4">
                                        <p v-if="searchResults.length > 0" class="text-sm text-gray-500 mb-2" id="search-results-description" aria-live="polite">
                                            {{ searchResults.length }} resultado{{ searchResults.length !== 1 ? 's' : '' }} encontrado{{ searchResults.length !== 1 ? 's' : '' }}
                                        </p>
                                        <a
                                            v-for="post in searchResults"
                                            :key="post.id"
                                            :href="`/post/${post.slug}`"
                                            class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
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
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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

    <CookieConsent />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { vue3 } from '@cmmv/blog/client';
import { useHead } from '@unhead/vue'
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
import { useDarkMode } from '../../composables/useDarkMode';
import CookieConsent from '../../components/CookieConsent.vue';
import { vue3 as newsletterVue3 } from '@cmmv/newsletter/client';

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
            href: '/src/theme-centralotaku/style.css'
        },
        {
            rel: 'icon',
            type: 'image/ico',
            href: '/src/theme-centralotaku/favicon.ico?v=2'
        },
        { rel: 'preconnect', href: 'https://www.googletagmanager.com/' },
        { rel: 'preconnect', href: 'https://www.google-analytics.com/' },
        { rel: 'preconnect', href: 'https://www.googletag.com/' },
        { rel: 'preconnect', href: 'https://connect.facebook.net/' },
        { rel: 'preconnect', href: 'https://securepubads.g.doubleclick.net/' },
        { rel: 'preconnect', href: 'https://tpc.googlesyndication.com/' },
        { rel: 'preconnect', href: 'https://www.googletag.com/' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com/' },
        { rel: 'dns-prefetch', href: 'https://securepubads.g.doubleclick.net' }
    ],

    script: scripts
})

// Usando o composable de gerenciamento de tema
const { isDarkMode, toggleTheme } = useDarkMode();

const popularPosts = ref<any[]>([]);
const loadingPopularPosts = ref(true);

const searchModalOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const isSearching = ref(false);
const searchTimeout = ref<any>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const sidebarOpen = ref(false);

const categories = ref<any[]>(categoriesStore.getCategories || []);

const footerCategories = computed(() => {
    return categories.value.slice(0, 6);
});

const mainNavCategories = computed(() => {
    const navCategories = categories.value?.filter((category: any) => category.mainNav) || [];
    navCategories.sort((a: any, b: any) => (a.mainNavIndex ?? 999) - (b.mainNavIndex ?? 999));

    const rootCategories = navCategories.filter((cat: any) => !cat.parentCategory);
    const childCategories = navCategories.filter((cat: any) => cat.parentCategory);

    return {
        rootCategories,
        childrenMap: childCategories.reduce((map: Record<string, any[]>, child: any) => {
            if (!map[child.parentCategory]) {
                map[child.parentCategory] = [];
            }
            map[child.parentCategory].push(child);
            return map;
        }, {} as Record<string, any[]>),
    };
});

// Newsletter functionality
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

const openDropdowns = ref<Record<string, boolean>>({});

const toggleDropdown = (categoryId: string, event: Event) => {
    event.stopPropagation();
    if (openDropdowns.value[categoryId]) {
        openDropdowns.value = {
            ...openDropdowns.value,
            [categoryId]: false
        };
    } else {
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
    searchModalOpen.value = false;
    searchQuery.value = '';
    searchResults.value = [];
};

const debouncedSearch = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = setTimeout(() => {
        performSearch();
    }, 300);
};

const performSearch = async () => {
    if (searchQuery.value.trim().length < 2) {
        searchResults.value = [];
        return;
    }

    isSearching.value = true;

    try {
        const response = await blogAPI.posts.search(searchQuery.value);

        if (Array.isArray(response)) {
            searchResults.value = response;
        } else if (response && typeof response === 'object') {
            const typedResponse = response as { posts?: any[] };
            searchResults.value = Array.isArray(typedResponse.posts) ? typedResponse.posts : [];
        } else {
            searchResults.value = [];
        }
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
        })()
    ]);
    
    document.addEventListener('click', closeDropdownsOnClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', closeDropdownsOnClickOutside);
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
</script>

<style>
.line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

@keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Modern Sidebar Styles */

/* Hide scrollbars */
aside::-webkit-scrollbar,
.flex-1::-webkit-scrollbar,
*::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
}

aside,
.flex-1,
* {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Ensure sidebar is always on top */
aside {
    z-index: 1000 !important;
}

/* Remove any potential overlay elements */
.sidebar-overlay {
    display: none !important;
}

/* Ensure clean sidebar appearance */
aside {
    border: none !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

/* Remove any unwanted borders or lines */
aside::before,
aside::after {
    display: none !important;
}

/* Smooth scrolling without visible scrollbars */
aside {
    overflow-y: auto;
    overflow-x: hidden;
}

/* Clean navigation appearance */
.nav-item-group {
    border: none !important;
}

.nav-item {
    border-width: 1px !important;
}

/* Mobile Toggle Button */
.mobile-toggle-btn {
    position: fixed;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 9999;
    padding: 0.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    outline: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
    width: 2.5rem;
    height: 2.5rem;
}

.mobile-toggle-bg {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 0.5rem;
    transition: all 0.3s;
    border: 1px solid rgba(239, 68, 68, 0.3);
    backdrop-filter: blur(10px);
}

.mobile-toggle-btn:hover .mobile-toggle-bg {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    transform: scale(1.05);
}

.mobile-toggle-icon {
    height: 1.25rem;
    width: 1.25rem;
    color: white;
    position: relative;
    z-index: 10;
    transition: transform 0.3s;
}

.mobile-toggle-btn:hover .mobile-toggle-icon {
    transform: scale(1.1);
}

/* Hide mobile button on desktop */
@media (min-width: 1024px) {
    .mobile-toggle-btn {
        display: none !important;
    }
}

/* Force mobile button dimensions on all pages */
.mobile-toggle-btn {
    width: 2.5rem !important;
    height: 2.5rem !important;
    min-width: 2.5rem !important;
    min-height: 2.5rem !important;
    max-width: 2.5rem !important;
    max-height: 2.5rem !important;
    padding: 0.5rem !important;
    border-radius: 0.5rem !important;
    position: fixed !important;
    top: 0.75rem !important;
    left: 0.75rem !important;
    z-index: 9999 !important;
    box-sizing: border-box !important;
}

.mobile-toggle-bg {
    border-radius: 0.5rem !important;
}

.mobile-toggle-icon {
    width: 1.25rem !important;
    height: 1.25rem !important;
    min-width: 1.25rem !important;
    min-height: 1.25rem !important;
    max-width: 1.25rem !important;
    max-height: 1.25rem !important;
}

/* Prevent any page-specific CSS from affecting mobile button */
.theme-override .mobile-toggle-btn,
.w-full .mobile-toggle-btn,
.max-w-\[1400px\] .mobile-toggle-btn,
.container .mobile-toggle-btn {
    width: 2.5rem !important;
    height: 2.5rem !important;
    padding: 0.5rem !important;
    position: fixed !important;
    top: 0.75rem !important;
    left: 0.75rem !important;
    z-index: 9999 !important;
}

/* Ensure button is not affected by flex or grid containers */
.mobile-toggle-btn {
    flex: none !important;
    grid-area: unset !important;
    margin: 0 !important;
    transform: none !important;
}

/* Social Icons */
.social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    color: white;
    transition: all 0.3s ease-in-out;
    position: relative;
    cursor: pointer;
}

.social-icon-bg {
    position: absolute;
    inset: 0;
    border-radius: 0.75rem;
    transition: all 0.3s;
    background: linear-gradient(to bottom right, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.5));
    border: 1px solid rgba(55, 65, 81, 0.5);
}

.social-icon:hover .social-icon-bg {
    transform: scale(1.05);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.social-icon-bg.facebook:hover {
    background: linear-gradient(to bottom right, rgba(37, 99, 235, 0.2), rgba(30, 64, 175, 0.2));
    border-color: rgba(59, 130, 246, 0.3);
}

.social-icon-bg.discord:hover {
    background: linear-gradient(to bottom right, rgba(79, 70, 229, 0.2), rgba(107, 33, 168, 0.2));
    border-color: rgba(99, 102, 241, 0.3);
}

.social-icon-bg.instagram:hover {
    background: linear-gradient(to bottom right, rgba(219, 39, 119, 0.2), rgba(107, 33, 168, 0.2));
    border-color: rgba(236, 72, 153, 0.3);
}

.social-icon-bg.youtube:hover {
    background: linear-gradient(to bottom right, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.2));
    border-color: rgba(239, 68, 68, 0.3);
}

.social-icon-bg.twitter:hover {
    background: linear-gradient(to bottom right, rgba(96, 165, 250, 0.2), rgba(37, 99, 235, 0.2));
    border-color: rgba(96, 165, 250, 0.3);
}

.social-icon:hover {
    transform: scale(1.05);
}

/* Action Buttons */
.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    color: white;
    transition: all 0.3s ease-in-out;
    position: relative;
    cursor: pointer;
}

.action-btn-bg {
    position: absolute;
    inset: 0;
    border-radius: 0.75rem;
    transition: all 0.3s;
    background: linear-gradient(to bottom right, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.2));
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.action-btn:hover .action-btn-bg {
    transform: scale(1.05);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    background: linear-gradient(to bottom right, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.3));
    border-color: rgba(248, 113, 113, 0.5);
}

.action-btn:hover {
    transform: scale(1.05);
}

/* Navigation Styles */
.nav-item-group {
    position: relative;
}

.nav-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    color: #d1d5db;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid transparent;
    background: linear-gradient(to right, transparent, transparent);
}

.nav-item:hover {
    color: white;
    border-color: rgba(239, 68, 68, 0.2);
    background: linear-gradient(to right, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05));
}

.nav-item.active {
    color: white;
    background: linear-gradient(to right, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.1));
    border-color: rgba(239, 68, 68, 0.3);
}

.nav-item-icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
    position: relative;
}

.nav-item-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: #4b5563;
    transition: all 0.3s;
}

.nav-item:hover .nav-item-dot {
    background-color: #ef4444;
    transform: scale(1.25);
}

.nav-item.active .nav-item-dot {
    background-color: #ef4444;
    transform: scale(1.25);
}

.nav-item-text {
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.3s;
}

.nav-item:hover .nav-item-text {
    transform: translateX(0.25rem);
}

.nav-dropdown-icon {
    width: 1rem;
    height: 1rem;
    transition: transform 0.3s;
    color: #9ca3af;
}

.nav-item:hover .nav-dropdown-icon {
    color: #f87171;
}

/* Dropdown Styles */
.nav-dropdown {
    margin-top: 0.5rem;
    margin-left: 1.5rem;
    overflow: hidden;
    animation: slideDown 0.3s ease-out;
}

.nav-dropdown-content {
    padding-left: 1rem;
    border-left: 1px solid rgba(239, 68, 68, 0.2);
}

.nav-dropdown-content > * + * {
    margin-top: 0.25rem;
}

.nav-sub-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    color: #9ca3af;
    transition: all 0.3s;
    position: relative;
    cursor: pointer;
}

.nav-sub-item:hover {
    color: white;
    background-color: rgba(220, 38, 38, 0.1);
}

.nav-sub-item-line {
    width: 0.75rem;
    height: 1px;
    background-color: #4b5563;
    margin-right: 0.75rem;
    transition: all 0.3s;
}

.nav-sub-item:hover .nav-sub-item-line {
    background-color: #ef4444;
    width: 1rem;
}

.nav-sub-item-text {
    font-size: 0.875rem;
    transition: all 0.3s;
}

.nav-sub-item:hover .nav-sub-item-text {
    transform: translateX(0.25rem);
}

/* Footer Links */
.footer-link {
    position: relative;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: #9ca3af;
    transition: all 0.3s;
    cursor: pointer;
}

.footer-link-text {
    position: relative;
    z-index: 10;
    transition: color 0.3s;
}

.footer-link:hover .footer-link-text {
    color: #f87171;
}

.footer-link-underline {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 1px;
    background-color: #ef4444;
    transition: all 0.3s;
    transform: translateX(-50%);
}

.footer-link:hover .footer-link-underline {
    width: 100%;
}

/* Animations */
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
    
/* Animação suave para os dropdowns */
.dropdown-content {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
}

/* Rotação suave do ícone de dropdown */
.rotate-180 {
    transform: rotate(180deg);
}

/* Estilos do modo escuro */
.dark {
    color-scheme: dark;
}

.dark body, 
.dark .bg-gray-100,
.dark .bg-neutral-100 {
    background-color: #121212;
    color: #e0e0e0;
}

.dark .bg-white, 
.dark .bg-gray-50,
.dark .bg-neutral-50 {
    background-color: #1e1e1e;
    color: #e0e0e0;
}

.dark .text-gray-900, 
.dark .text-gray-800, 
.dark .text-gray-700,
.dark .text-neutral-900, 
.dark .text-neutral-800, 
.dark .text-neutral-700 {
    color: #e0e0e0;
}

.dark .text-gray-600, 
.dark .text-gray-500,
.dark .text-neutral-600, 
.dark .text-neutral-500 {
    color: #a0a0a0;
}

.dark .border-gray-200, 
.dark .border-gray-300,
.dark .border-neutral-200, 
.dark .border-neutral-300,
.dark .border-neutral-100 {
    border-color: #333333;
}

.dark .bg-gray-200,
.dark .bg-neutral-200 {
    background-color: #2a2a2a;
}

.dark input, 
.dark textarea,
.dark select {
    background-color: #2a2a2a;
    color: #e0e0e0;
    border-color: #444;
}

.dark input::placeholder, 
.dark textarea::placeholder {
    color: #888;
}

.dark .shadow-md,
.dark .shadow-lg {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

/* Estilos específicos para páginas */
.dark .post-content {
    color: #e0e0e0;
}

.dark .post-content :deep(h2),
.dark .post-content :deep(h3),
.dark .post-content :deep(h4),
.dark .post-content :deep(h5),
.dark .post-content :deep(h6) {
    color: #e0e0e0;
}

.dark .post-content :deep(p) {
    color: #d0d0d0;
}

.dark .post-content :deep(blockquote) {
    color: #a0a0a0;
    background-color: #1a1a1a;
}

.dark .post-content :deep(code),
.dark .post-content :deep(pre) {
    background-color: #2a2a2a;
    color: #e0e0e0;
}

.dark .post-content :deep(table th),
.dark .post-content :deep(table td) {
    border-color: #444;
}

.dark .ad-placeholder {
    background-color: #2a2a2a;
    border-color: #444;
    color: #888;
}

.dark .bg-gray-200 {
    background-color: #2a2a2a;
}

.dark .bg-gray-100 {
    background-color: #1a1a1a;
}

.dark .bg-blue-50,
.dark .bg-pink-50,
.dark .bg-neutral-50,
.dark .bg-green-50 {
    background-color: rgba(255, 255, 255, 0.05);
}

.dark .hover\:bg-gray-50:hover,
.dark .hover\:bg-gray-100:hover,
.dark .hover\:bg-neutral-50:hover,
.dark .hover\:bg-neutral-100:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.dark .transform:hover {
    background-color: #2a2a2a;
}
</style>
