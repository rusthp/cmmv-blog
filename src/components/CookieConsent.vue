<template>
    <ClientOnly>
        <div v-if="!cookiesAccepted" class="border-t border-neutral-100 dark:border-neutral-800 fixed bottom-0 inset-x-0 z-50 bg-neutral-800 dark:bg-neutral-900 text-white p-4 shadow-lg transform transition-transform duration-300" :class="{ 'translate-y-full': isHidden }">
            <div class="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex-1">
                    <p class="text-sm md:text-base text-neutral-200">
                        Este site utiliza cookies para melhorar sua experiência de navegação. Ao continuar usando este site, você concorda com o uso de cookies conforme nossa
                        <a href="/termos-de-privacidade" class="text-blue-400 hover:text-blue-300 underline">Política de Privacidade</a>.
                    </p>
                </div>
                <div class="flex flex-shrink-0 gap-3">
                    <button
                        @click="rejectCookies"
                        class="px-4 py-2 text-sm bg-transparent hover:bg-neutral-700 rounded-md border border-neutral-600 text-neutral-300 transition-colors cursor-pointer"
                    >
                        Recusar
                    </button>
                    <button
                        @click="acceptCookies"
                        class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors cursor-pointer"
                    >
                        Aceitar
                    </button>
                </div>
            </div>
        </div>
    </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ClientOnly from './ClientOnly.vue';

const cookiesAccepted = ref(false);
const isHidden = ref(true);

// Check localStorage on mount
onMounted(() => {
    // Small delay to ensure smooth entrance animation
    setTimeout(() => {
        checkCookieConsent();
    }, 1000);
});

function checkCookieConsent() {
    const consent = localStorage.getItem('cookie-consent');
    cookiesAccepted.value = consent === 'accepted';

    // Show banner with animation if consent is not given
    if (!cookiesAccepted.value) {
        isHidden.value = false;
    }
}

function acceptCookies() {
    localStorage.setItem('cookie-consent', 'accepted');
    cookiesAccepted.value = true;

    hideWithAnimation();
}

function rejectCookies() {
    localStorage.setItem('cookie-consent', 'rejected');
    cookiesAccepted.value = true;
    hideWithAnimation();
}

function hideWithAnimation() {
    isHidden.value = true;

    // Remove from DOM after animation completes
    setTimeout(() => {
        cookiesAccepted.value = true;
    }, 300);
}
</script> 