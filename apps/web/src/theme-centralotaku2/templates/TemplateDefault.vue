<template>
    <Navbar v-cloak />

    <div class="bg-neutral-50 dark:bg-neutral-900 z-10 relative">
        <div class="mx-auto z-10">
            <div class="flex">
                <router-view />
            </div>
        </div>
    </div>

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

    <CookieConsent />
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue'
import CookieConsent from '../../components/CookieConsent.vue'
import { useSettingsStore } from "../../store/settings";
import { useHead } from '@unhead/vue'
import { ref, computed } from 'vue'

const settingsStore = useSettingsStore();
const sidebarOpen = ref(false);

const scripts = computed(() => {
    const baseScripts = [];

    return [...baseScripts, ...settingsStore.googleAnalyticsScripts];
});

useHead({
    meta: computed(() => settingsStore.allMetaTags),

    link: [
        {
            rel: 'stylesheet',
            href: '/src/theme-default/style.css',
            media: 'all'
        },
        {
            rel: 'icon',
            type: 'image/ico',
            href: computed(() => settingsStore.faviconUrl)
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
</script>
