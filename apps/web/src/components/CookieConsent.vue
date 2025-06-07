<template>
    <ClientOnly>
        <div v-if="!cookiesAccepted" class="fixed bottom-4 right-4 z-50 max-w-md transform transition-all duration-500 ease-in-out" :class="{ 'translate-y-full opacity-0': isHidden, 'translate-y-0 opacity-100': !isHidden }">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <!-- Cabeçalho -->
                <div class="bg-gray-800 py-3 px-4">
                    <h3 class="text-lg font-semibold text-white">Aviso de Cookies</h3>
                </div>
                
                <!-- Conteúdo -->
                <div class="p-4">
                    <p class="text-sm text-gray-700 mb-4">
                        Este site usa cookies para melhorar sua experiência de navegação. Ao continuar usando este site, você concorda com o uso de cookies de acordo com nossa
                        <a href="/terms-of-privacy" class="text-blue-600 hover:text-blue-500 underline">Política de Privacidade</a>.
                    </p>
                    
                    <div class="flex justify-end gap-3 mt-2">
                        <button
                            @click="rejectCookies"
                            class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors font-medium"
                        >
                            Recusar
                        </button>
                        <button
                            @click="acceptCookies"
                            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                        >
                            Aceitar
                        </button>
                    </div>
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
    }, 500);
}
</script>
