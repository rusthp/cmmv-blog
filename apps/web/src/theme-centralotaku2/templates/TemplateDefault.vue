<template>
    <Navbar v-cloak />

    <div class="bg-neutral-50 dark:bg-neutral-900 z-10 relative">
        <div class="mx-auto z-10" :class="{ 'content-with-sidebar': isLargeScreen }">
            <div class="flex">
                <router-view />
            </div>
        </div>
    </div>

    <!-- Newsletter Section -->
    <section class="py-8 sm:py-12 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800" aria-labelledby="newsletter-heading">
        <div class="container mx-auto px-4 text-center">
            <h2 id="newsletter-heading" class="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Receba as novidades</h2>
            <p class="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6 max-w-lg mx-auto px-2">Assine nossa newsletter e receba os melhores posts diretamente no seu e-mail.</p>

            <div v-if="newsletterSubmitted" class="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 mx-4 sm:mx-auto" role="alert" aria-live="polite">
                <div class="flex items-center">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <p class="text-sm sm:text-base text-green-700">{{ newsletterMessage }}</p>
                </div>
            </div>

            <div v-if="newsletterError" class="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 mx-4 sm:mx-auto" role="alert" aria-live="assertive">
                <div class="flex items-center">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class="text-sm sm:text-base text-red-700">{{ newsletterError }}</p>
                </div>
            </div>

            <form @submit.prevent="subscribeNewsletter" class="max-w-md mx-auto flex flex-col sm:flex-row gap-2 sm:gap-0 px-4 sm:px-0" aria-labelledby="newsletter-heading">
                <label for="newsletter-email" class="sr-only">Seu e-mail</label>
                <input
                    type="email"
                    id="newsletter-email"
                    v-model="newsletterEmail"
                    placeholder="Seu e-mail"
                    class="flex-grow py-2 sm:py-3 px-3 sm:px-4 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    required
                >
                <button
                    type="submit"
                    class="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm sm:text-base font-medium"
                    :disabled="isSubscribing"
                    aria-label="Assinar newsletter"
                >
                    <span v-if="isSubscribing" class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="text-sm sm:text-base">Aguarde...</span>
                    </span>
                    <span v-else class="text-sm sm:text-base">Assinar</span>
                </button>
            </form>
            <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-3 sm:mt-4 px-4">Ao se inscrever, você concorda com nossa <a href="/terms-of-privacy" class="text-red-500 underline hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded">política de privacidade</a>.</p>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-neutral-900 text-white pt-8 sm:pt-12 pb-6" role="contentinfo">
        <div class="container mx-auto px-4 max-w-[1200px]">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                <!-- Sobre -->
                <div class="md:col-span-2">
                    <h3 class="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{{ settings['blog.title'] }}</h3>
                    <p class="text-neutral-400 mb-3 sm:mb-4 max-w-xl text-sm sm:text-base">{{ settings['blog.description'] }}</p>
                    <div class="flex space-x-3 sm:space-x-4 justify-center sm:justify-start">
                        <a v-if="settings['blog.facebook']" :href="`https://facebook.com/${settings['blog.facebook']}`" target="_blank" class="text-neutral-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a v-if="settings['blog.twitter']" :href="`https://twitter.com/${settings['blog.twitter']}`" target="_blank" class="text-neutral-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1" aria-label="Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        </a>
                        <a v-if="settings['blog.instagram']" :href="`https://instagram.com/${settings['blog.instagram']}`" target="_blank" class="text-neutral-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        </a>
                    </div>
                </div>
            </div>

            <div class="border-t border-neutral-700 pt-4 sm:pt-6">
                <div class="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                    <p class="text-neutral-400 text-sm sm:text-base text-center sm:text-left">&copy; {{ new Date().getFullYear() }} {{ settings['blog.title'] }}. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    </footer>

    <CookieConsent />
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue'
import CookieConsent from '../../components/CookieConsent.vue'
import { useSettingsStore } from "../../store/settings";
import { useCategoriesStore } from "../../store/categories";
import { useHead } from '@unhead/vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { vue3 as newsletterVue3 } from '@cmmv/newsletter/client';

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.getSettings);
const categoriesStore = useCategoriesStore();
const categories = ref<any[]>(categoriesStore.getCategories || []);

const scripts = computed(() => {
    const baseScripts = [
        {
            src: '/imgix-min.js?v=0.0.6',
            type: 'text/javascript',
            async: true,
            defer: true
        }
    ];

    return [...baseScripts, ...settingsStore.googleAnalyticsScripts];
});

useHead({
    meta: computed(() => settingsStore.allMetaTags),

    link: [
        {
            rel: 'stylesheet',
            href: '/src/theme-centralotaku2/style.css'
        },
        {
            rel: 'icon',
            type: 'image/ico',
            href: '/src/theme-centralotaku2/favicon.ico?v=2'
        },
        { rel: 'preconnect', href: 'https://www.googletagmanager.com/' },
        { rel: 'preconnect', href: 'https://www.google-analytics.com/' },
        { rel: 'preconnect', href: 'https://www.googletag.com/' },
        { rel: 'preconnect', href: 'https://connect.facebook.net/' },
        { rel: 'preconnect', href: 'https://securepubads.g.doubleclick.net/' },
        { rel: 'preconnect', href: 'https://tpc.googlesyndication.com/' },
        { rel: 'preconnect', href: 'https://static.centralotaku.com.br/' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com/' },
        { rel: 'dns-prefetch', href: 'https://securepubads.g.doubleclick.net' },
        { rel: 'dns-prefetch', href: 'https://static.centralotaku.com.br/' },
        { rel: 'alternate', href: `${settings.value['blog.url']}/feed`, type: 'application/rss+xml', title: settings.value['blog.title'] }
    ],

    script: scripts.value
})

const newsletterAPI = newsletterVue3.useNewsletter();
const newsletterEmail = ref('');
const newsletterSubmitted = ref(false);
const newsletterMessage = ref('');
const newsletterError = ref('');
const isSubscribing = ref(false);
const isLargeScreen = ref(false);

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
            const data = await response.json().catch(() => ({ message: 'Falha na requisição' }));
            throw new Error(data.message || 'Falha na requisição');
        }

    } catch (error: any) {
        console.error('Newsletter subscription error:', error);
        newsletterError.value = error.message === 'Email already subscribed' ? 'Este e-mail já está inscrito.' : 'Não foi possível processar sua inscrição. Tente novamente.';
    } finally {
        isSubscribing.value = false;
    }
};

const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const isDarkMode = ref(false);

const checkScreenSize = () => {
    isLargeScreen.value = window.innerWidth >= 1690;
}

const handleResize = () => {
    checkScreenSize();
}

onMounted(() => {
    // Force light theme for better performance (GameDevBR optimization)
    isDarkMode.value = false;
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    
    // Check screen size
    checkScreenSize();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.content-with-sidebar {
    margin-left: 16rem;
}
</style>
