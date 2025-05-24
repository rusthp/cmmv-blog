<template>
    <div class="flex flex-col min-h-screen bg-gray-100">
        <!-- Header -->
        <header class="bg-black sticky top-0 z-50 shadow-md border-b border-red-600">
            <div class="max-w-[1200px] mx-auto px-4">
                <div class="flex justify-between items-center h-14">
                    <!-- Logo -->
                    <div class="flex-shrink-0">
                        <a href="/" class="text-2xl font-bold text-white flex items-center">
                            <img src="/src/theme-centralotaku/logo2.png" width="130" height="10" alt="Logo" title="Logo">
                        </a>
                    </div>

                    <!-- Desktop Navigation -->
                    <nav class="hidden md:flex items-center justify-center space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-6 font-bold text-base tracking-wide main-nav h-full">
                        <template v-for="category in mainNavCategories.rootCategories" :key="category.id">
                            <div v-if="mainNavCategories.childrenMap[category.id]" class="relative group h-full flex items-center"
                                @mouseenter="openDropdowns[category.id] = true"
                                @mouseleave="openDropdowns[category.id] = false"
                            >
                                <button
                                    @click="(e) => toggleDropdown(category.id, e)"
                                    class="dropdown-toggle flex items-center gap-1 px-4 h-full text-white hover:text-red-500 transition-colors focus:outline-none"
                                    :class="{'text-red-500': openDropdowns[category.id]}"
                                >
                                    {{ category.name }}
                                    <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                <div
                                    v-show="openDropdowns[category.id]"
                                    class="dropdown-menu absolute left-1/2 -translate-x-1/2 min-w-[180px] rounded-lg shadow-xl bg-[#181824] border border-[#222] z-20 py-2 animate-fade-in"
                                >
                                    <a v-for="(child, idx) in mainNavCategories.childrenMap[category.id]" :key="child.id"
                                        :href="`/category/${child.slug}`"
                                        class="block px-6 py-3 text-white text-base font-semibold hover:bg-[#232334] hover:text-red-500 transition-colors"
                                    >
                                        {{ child.name }}
                                        <div v-if="idx !== mainNavCategories.childrenMap[category.id].length - 1" class="border-b border-[#333] mx-2"></div>
                                    </a>
                                </div>
                            </div>
                            <a v-else
                                :href="`/category/${category.slug}`"
                                class="h-full flex items-center px-4 text-white hover:text-red-500 transition-colors"
                            >
                                {{ category.name }}
                            </a>
                        </template>
                    </nav>

                    <!-- Botões (desktop e mobile) -->
                    <div class="flex items-center space-x-3">
                        <!-- Botão de Tema -->
                        <button @click="toggleTheme" class="text-white hover:text-red-500 transition-colors" :title="isDarkMode ? 'Modo Claro' : 'Modo Escuro'">
                            <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </button>
                        
                        <!-- Links Sociais (apenas desktop) -->
                        <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" rel="noopener noreferrer" title="Facebook" class="text-white hover:text-red-500 transition-colors hidden md:block">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a v-if="settings['blog.discord']" :href="`https://discord.gg/${settings['blog.discord']}`" target="_blank" rel="noopener noreferrer" title="Discord" class="text-white hover:text-red-500 transition-colors hidden md:block">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                            </svg>
                        </a>

                        <!-- Botão de Pesquisa -->
                        <button @click="openSearchModal" class="text-white hover:text-red-500 transition-colors" title="Search" aria-label="Search">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        
                        <!-- Botão do Menu Mobile (apenas mobile) -->
                        <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-white md:hidden" title="Menu" aria-label="Menu">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path v-if="mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu -->
                <div v-show="mobileMenuOpen" class="md:hidden py-3 border-t border-slate-700 mobile-menu-content">
                    <div class="flex flex-col gap-1">
                        <template v-for="category in mainNavCategories.rootCategories" :key="category.id">
                            <div v-if="mainNavCategories.childrenMap[category.id]" class="w-full">
                                <button
                                    @click="(e) => toggleDropdown(category.id, e)"
                                    class="dropdown-toggle flex items-center justify-between w-full text-white hover:bg-slate-700 hover:text-red-500 rounded px-3 py-2 text-sm"
                                    :class="{'bg-slate-700 text-red-500': openDropdowns[category.id]}"
                                >
                                    {{ category.name }}
                                    <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                <div v-show="openDropdowns[category.id]" class="pl-4 py-1 bg-slate-800 rounded mt-1">
                                    <a
                                        v-for="child in mainNavCategories.childrenMap[category.id]"
                                        :key="child.id"
                                        :href="`/category/${child.slug}`"
                                        class="block px-4 py-2 text-sm text-white hover:bg-red-500 hover:text-white rounded"
                                    >
                                        {{ child.name }}
                                    </a>
                                </div>
                            </div>
                            <a
                                v-else
                                :href="`/category/${category.slug}`"
                                class="block text-white hover:bg-slate-700 hover:text-red-500 rounded px-3 py-2 text-sm"
                            >
                                {{ category.name }}
                            </a>
                        </template>
                    </div>

                    <!-- Social Icons para Mobile -->
                    <div class="flex justify-center space-x-6 mt-3 pt-3 border-t border-slate-700 mobile-social-icons">
                        <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" class="text-white hover:text-red-500 transition-colors mobile-social" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" class="text-white hover:text-red-500 transition-colors mobile-social" aria-label="Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                        </a>
                        <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" class="text-white hover:text-red-500 transition-colors mobile-social" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                            </svg>
                        </a>
                        <a v-if="settings['blog.youtube']" :href="`https://youtube.com/${settings['blog.youtube']}`" target="_blank" class="text-white hover:text-red-500 transition-colors mobile-social" aria-label="Youtube">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                            </svg>
                        </a>
                        <a v-if="settings['blog.discord']" :href="`https://discord.gg/${settings['blog.discord']}`" target="_blank" class="text-white hover:text-red-500 transition-colors mobile-social" aria-label="Discord">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main content -->
        <main class="flex-grow container mx-auto md:px-4 md:py-6">
            <div class="flex flex-col lg:flex-row gap-6">
                <router-view />
            </div>
        </main>

        <!-- Newsletter Section -->
        <section class="bg-red-600 py-10 text-white mt-8">
            <div class="max-w-[1200px] mx-auto px-4">
                <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="md:w-1/2">
                        <h3 class="text-2xl font-bold mb-2">Inscreva-se em nossa Newsletter</h3>
                        <p class="text-gray-200 mb-4">
                            Receba as últimas notícias e atualizações diretamente no seu e-mail.
                            Fique por dentro de tudo sobre o universo Otaku.
                        </p>
                    </div>
                    <div class="md:w-1/2 w-full">
                        <form class="flex w-full">
                            <input type="email" placeholder="Seu email"
                                class="flex-grow px-4 py-3 rounded-l-md border-0 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500">
                            <button type="submit" class="bg-slate-700 text-white font-medium px-6 py-3 rounded-r-md hover:bg-slate-600 transition-colors whitespace-nowrap">
                                Assinar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-[#333333] text-white">
            <div class="max-w-[1200px] mx-auto px-4 py-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-lg font-bold mb-4 relative pb-3">
                            Sobre o Central Otaku
                            <span class="absolute bottom-0 left-0 w-10 h-1 bg-red-500"></span>
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
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Twitter">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Instagram">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.youtube']" :href="`https://youtube.com/${settings['blog.youtube']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Youtube">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.whatsapp']" :href="`https://chat.whatsapp.com/${settings['blog.whatsapp']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 448 512" fill="currentColor">
                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.telegram']" :href="`https://t.me/${settings['blog.telegram']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Telegram">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.325.037.342.22.149.44.38.464.597.042.024-.024.121-.12.145-.24.024-.12-.12-.12-.144.024-.12.12.12.12.144.24.36.48.36.6.024.12-.024.12-.12.024-.12zM12 5.52a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm9.6 14.4c-.024.12-.144.144-.12.024.12.12.12.12.12.12.12.12z"/>
                                </svg>
                            </a>
                            <a v-if="settings['blog.discord']" :href="`https://discord.gg/${settings['blog.discord']}`" target="_blank" class="text-white hover:text-red-500 transition-colors" aria-label="Discord">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-bold mb-4 relative pb-3">
                            Categorias
                            <span class="absolute bottom-0 left-0 w-10 h-1 bg-red-500"></span>
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
                                        class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Pesquisar posts..."
                                        autocomplete="off"
                                        ref="searchInput"
                                    />
                                </div>

                                <div class="mt-4 max-h-[70vh] overflow-y-auto">
                                    <div v-if="isSearching" class="flex justify-center items-center py-8">
                                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                    </div>

                                    <div v-else-if="searchResults.length === 0 && searchQuery.length > 1" class="py-8 text-center text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>Nenhum resultado encontrado para "{{ searchQuery }}"</p>
                                    </div>

                                    <div v-else-if="searchQuery.length > 1" class="space-y-4">
                                        <p v-if="searchResults.length > 0" class="text-sm text-gray-500 mb-2">
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

    <CookieConsent />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { vue3 } from '@cmmv/blog/client';
import { useHead } from '@unhead/vue'
import { useSettingsStore } from '../../store/settings';
import { useCategoriesStore } from '../../store/categories';
//import { useDarkMode } from '../../composables/useUtils';
import { useDarkMode } from '../../composables/useDarkMode';
import { onClickOutside } from '@vueuse/core';
import CookieConsent from '../../components/CookieConsent.vue';

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
const mobileMenuOpen = ref(false);

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
.main-nav {
    background: #11111a;
    border-bottom: 1px solid #181824;
}
header .h-14 {
    display: flex;
    align-items: center;
    height: 3.5rem;
}
.main-nav a, .main-nav button {
    font-size: 1.15rem;
    font-weight: bold;
    letter-spacing: 0.02em;
    transition: color 0.2s;
    display: flex;
    align-items: center;
}
.main-nav .dropdown-menu {
    min-width: 180px;
    background: #181824;
    border: 1px solid #222;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    padding: 0.5rem 0;
    z-index: 30;
    animation: fade-in 0.18s;
    top: 100%;
}
.main-nav .dropdown-menu a {
    color: #fff;
    font-size: 1.08rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 0;
    transition: background 0.18s, color 0.18s;
    height: auto;
    display: block;
}
.main-nav .dropdown-menu a:hover {
    background: #232334;
    color: #ef4444;
}
.main-nav .dropdown-menu .border-b {
    border-color: #333 !important;
}
@media (max-width: 900px) {
    .main-nav a, .main-nav button {
        font-size: 1rem;
    }
}
@keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.header,
header.bg-black {
    background: #11111a !important;
    border-bottom: 1px solid #181824 !important;
}

/* Correções para o menu mobile */
@media (max-width: 767px) {
    /* Esconde ícones sociais não-mobile no header mobile */
    header a[href*="facebook"]:not(.mobile-social),
    header a[href*="twitter"]:not(.mobile-social),
    header a[href*="instagram"]:not(.mobile-social),
    header a[href*="youtube"]:not(.mobile-social),
    header a[href*="discord"]:not(.mobile-social) {
        display: none !important;
    }
    
    /* Menu mobile */
    header .h-14 {
        height: auto;
        min-height: 3.5rem;
        padding: 0.5rem 0;
    }
    
    header .flex.justify-between.items-center {
        align-items: center !important;
    }

    /* Botões alinhados corretamente no mobile */
    .mobile-menu-wrapper button {
        padding: 0.5rem;
    }
    
    /* Posicionamento da logo no header mobile */
    header .flex-shrink-0 {
        display: flex;
        justify-content: flex-start;
    }
    
    /* Garante que o Facebook não aparece no menu principal mobile */
    header > div > div > a[href*="facebook"] {
        display: none !important;
    }
    
    /* Apenas os botões sociais no rodapé do menu mobile devem ser visíveis */
    .mobile-social-icons .mobile-social {
        display: flex !important;
    }
}

/* Garante que botões não aparecerão duplicados */
@media (min-width: 768px) {
    .md\:hidden {
        display: none !important;
    }
}
@media (max-width: 767px) {
    header .md\:block,
    header .md\:flex {
        display: none !important;
    }
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

.dark header.bg-black {
    background: #000 !important;
    border-color: #333 !important;
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
