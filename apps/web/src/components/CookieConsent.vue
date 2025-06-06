<template>
    <ClientOnly>
        <div v-if="!cookiesAccepted" class="fixed bottom-4 right-4 z-50 max-w-md transform transition-all duration-500 ease-in-out" :class="{ 'translate-y-full opacity-0': isHidden, 'translate-y-0 opacity-100': !isHidden }">
            <div class="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400">
                <!-- Cabeçalho com imagem -->
                <div class="relative">
                    <div class="absolute -left-6 -top-6 w-32 h-32 transform rotate-12">
                        <img src="/src/theme-centralotaku2/assets/11907549-removebg-preview.png" alt="Luffy - One Piece" class="w-full h-full object-contain" @error="handleImageError" />
                    </div>
                    <div class="pt-3 pb-1 px-4 text-center">
                        <h3 class="text-xl font-bold text-white ml-24 text-shadow">Aventura dos Cookies! 🍪</h3>
                    </div>
                </div>
                
                <!-- Opção alternativa com emoji caso a imagem não carregue -->
                <div v-if="imageError" class="absolute -left-2 -top-2 w-24 h-24 flex items-center justify-center">
                    <div class="text-4xl anime-bounce">🏴‍☠️</div>
                </div>
                
                <!-- Conteúdo -->
                <div class="p-4 pt-0 bg-white rounded-b-lg">
                    <p class="text-sm md:text-base text-neutral-700 mb-4">
                        Ei, nakama! <span class="inline-block animate-pulse">⚓</span> Este site usa cookies para melhorar sua aventura de navegação! Ao continuar usando este site, você concorda com nossos cookies de acordo com nossa
                        <a href="/terms-of-privacy" class="text-red-600 hover:text-red-500 font-bold underline">Política de Privacidade</a>.
                    </p>
                    
                    <div class="flex justify-end gap-3 mt-2">
                        <button
                            @click="rejectCookies"
                            class="px-4 py-2 text-sm bg-neutral-200 hover:bg-neutral-300 rounded-full border border-neutral-300 text-neutral-700 transition-all hover:scale-105 font-medium cursor-pointer"
                        >
                            Recusar ❌
                        </button>
                        <button
                            @click="acceptCookies"
                            class="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-full text-white font-bold transition-all hover:scale-105 hover:shadow-lg cursor-pointer"
                        >
                            Aceitar! ✨
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
const imageError = ref(false);

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

function handleImageError() {
    imageError.value = true;
}
</script>

<style scoped>
.text-shadow {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.anime-bounce {
    animation: bounce 1s infinite alternate;
}

@keyframes bounce {
    0% {
        transform: translateY(0) rotate(0deg);
    }
    100% {
        transform: translateY(-10px) rotate(10deg);
    }
}

/* Animação para a imagem do Luffy */
img[alt="Luffy - One Piece"] {
    animation: luffy-animation 3s infinite alternate;
    filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3));
}

@keyframes luffy-animation {
    0% {
        transform: translateY(0) rotate(5deg) scale(1);
    }
    50% {
        transform: translateY(-5px) rotate(8deg) scale(1.05);
    }
    100% {
        transform: translateY(-2px) rotate(12deg) scale(1.02);
    }
}
</style>
