<template>
    <ClientOnly>
        <div v-if="!cookiesAccepted" class="sticky bottom-0 w-full flex justify-center p-4 z-40" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-description">
            <div class="max-w-lg w-full transition-all duration-500 ease-in-out" :class="{ 'opacity-0 scale-95 translate-y-8': isHidden, 'opacity-100 scale-100 translate-y-0': !isHidden }">
            <div class="relative bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-blue-900/70 rounded-2xl shadow-2xl overflow-hidden border border-blue-400/40 backdrop-blur-xl">
                <!-- Efeito de brilho gaming -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-pulse"></div>
                
                <!-- Ícone gaming -->
                <div class="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-blue-400/80 to-blue-600/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.859 0-7 3.141-7 7v1h17z"/>
                    </svg>
                </div>
                
                <!-- Conteúdo -->
                <div class="relative p-6 pt-8">
                    <h3 id="cookie-title" class="text-xl font-bold text-white mb-3 pl-8">
                        🍪 <span class="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">Cookies & Gaming</span>
                    </h3>
                    
                    <p id="cookie-description" class="text-gray-300 text-sm mb-5 leading-relaxed pl-8">
                        Nosso site usa cookies para turbinar sua experiência gaming! 🎮 
                        Continuando aqui, você aceita nossos cookies conforme nossa
                        <a href="/terms-of-privacy" class="text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors font-medium">Política de Privacidade</a>.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            @click="rejectCookies"
                            class="px-6 py-2.5 text-sm bg-slate-700/40 hover:bg-slate-600/50 border border-slate-500/50 rounded-xl text-gray-300 hover:text-white transition-all duration-300 font-medium backdrop-blur-sm active:scale-95"
                            aria-label="Recusar cookies e continuar navegando"
                        >
                            ❌ Nah, recusar
                        </button>
                        <button
                            @click="acceptCookies"
                            class="px-6 py-2.5 text-sm bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-500/90 hover:to-blue-600/90 rounded-xl text-white font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/25 backdrop-blur-sm"
                            aria-label="Aceitar cookies e melhorar experiência"
                        >
                            ✨ GG, aceitar!
                        </button>
                    </div>
                </div>

                <!-- Decoração gaming -->
                <div class="absolute top-2 right-2 text-blue-300/30 text-xs font-mono">
                    {'PWR'}
                </div>
            </div>
            </div>
        </div>
    </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ClientOnly from './ClientOnly.vue';

const cookiesAccepted = ref(true); // Start assuming accepted (will be corrected by checkCookieConsent)
const isHidden = ref(true); // Always start hidden

// Check localStorage on mount
onMounted(() => {
    // Check and animate in smoothly
    checkCookieConsent();
});

function checkCookieConsent() {
    const consent = localStorage.getItem('cookie-consent');
    
    if (consent === 'accepted' || consent === 'rejected') {
        // Cookie já foi decidido, não mostrar banner
        cookiesAccepted.value = true;
        isHidden.value = true;
    } else {
        // Sem decisão ainda, mostrar banner
        cookiesAccepted.value = false;
        isHidden.value = false;
    }
}

function acceptCookies() {
    localStorage.setItem('cookie-consent', 'accepted');
    hideWithAnimation();
}

function rejectCookies() {
    localStorage.setItem('cookie-consent', 'rejected');
    hideWithAnimation();
}

function hideWithAnimation() {
    isHidden.value = true;

    // Remove from DOM after animation completes (timing matches transition duration)
    setTimeout(() => {
        cookiesAccepted.value = true;
    }, 600); // 100ms extra buffer for smooth completion
}
</script>
