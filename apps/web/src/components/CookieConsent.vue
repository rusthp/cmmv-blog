<template>
    <ClientOnly>
        <div v-if="!cookiesAccepted" class="fixed bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto z-50 max-w-xs sm:max-w-md transform transition-all duration-500 ease-in-out" :class="{ 'translate-y-full opacity-0': isHidden, 'translate-y-0 opacity-100': !isHidden }">
            <div class="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 rounded-xl shadow-2xl overflow-hidden border-2 border-cyan-400 relative">
                <!-- Efeito de brilho neon -->
                <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse"></div>
                
                <!-- Cabeçalho -->
                <div class="relative p-3 sm:p-4 text-center border-b border-cyan-400/30">
                    <div class="flex items-center justify-center gap-1 sm:gap-2 mb-2">
                        <span class="text-lg sm:text-2xl animate-bounce">🎮</span>
                        <h3 class="text-lg sm:text-xl font-bold text-white neon-text">GAME ON!</h3>
                        <span class="text-lg sm:text-2xl animate-bounce delay-75">⚡</span>
                    </div>
                    <div class="flex justify-center gap-1">
                        <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-ping"></span>
                        <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-ping delay-100"></span>
                        <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-ping delay-200"></span>
                    </div>
                </div>
                
                <!-- Conteúdo -->
                <div class="relative p-3 sm:p-4 bg-gradient-to-t from-gray-900 to-transparent">
                    <p class="text-xs sm:text-sm md:text-base text-gray-200 mb-3 sm:mb-4 leading-relaxed">
                        <span class="text-cyan-400 font-bold">GG Player!</span> 🏆 Este site usa cookies para otimizar sua experiência gaming! 
                        <br class="hidden sm:block"><br class="hidden sm:block">
                        <span class="text-purple-300">Level up</span> concordando com nossa 
                        <a href="/terms-of-privacy" class="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-wavy transition-colors">Política de Privacidade</a>.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-3 sm:mt-4">
                        <button
                            @click="rejectCookies"
                            class="px-3 py-2 text-xs sm:text-sm bg-red-600/80 hover:bg-red-600 rounded-lg border border-red-500 text-white transition-all hover:scale-105 font-medium cursor-pointer hover:shadow-lg hover:shadow-red-500/25"
                        >
                            <span class="mr-1">❌</span> Rage Quit
                        </button>
                        <button
                            @click="acceptCookies"
                            class="px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg text-white font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
                        >
                            <span class="mr-1">🚀</span> Ready Player One!
                        </button>
                    </div>
                </div>
                
                <!-- Efeito de scan lines -->
                <div class="absolute inset-0 pointer-events-none">
                    <div class="scan-lines"></div>
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

<style scoped>
.neon-text {
    text-shadow: 
        0 0 5px #00ffff,
        0 0 10px #00ffff,
        0 0 15px #00ffff,
        0 0 20px #00ffff;
}

/* Efeito de scan lines futurista */
.scan-lines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        transparent 50%,
        rgba(0, 255, 255, 0.03) 50%
    );
    background-size: 100% 4px;
    animation: scan 2s linear infinite;
}

@keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
}

/* Animações dos emojis */
.animate-bounce {
    animation: gaming-bounce 2s infinite ease-in-out;
}

.delay-75 {
    animation-delay: 0.3s;
}

@keyframes gaming-bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0) scale(1);
    }
    40% {
        transform: translateY(-8px) scale(1.1);
    }
    60% {
        transform: translateY(-4px) scale(1.05);
    }
}

/* Efeito de glow nos botões */
button:hover {
    filter: brightness(1.1);
}

/* Efeito de typing nos pontos */
.animate-ping {
    animation: ping-gaming 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.delay-100 {
    animation-delay: 0.2s;
}

.delay-200 {
    animation-delay: 0.4s;
}

@keyframes ping-gaming {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.3);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
