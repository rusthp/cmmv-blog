<template>
    <div class="audio-player-widget bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
        <!-- Debug info -->
        <div v-if="debugMode" class="text-xs text-gray-500 mb-2 p-2 bg-yellow-100 rounded">
            <p><strong>Debug:</strong></p>
            <p>URL: {{ src }}</p>
            <p>Loading: {{ isLoading }}</p>
            <p>Error: {{ hasError }}</p>
            <p>Duration: {{ duration }}</p>
        </div>

        <div class="flex items-center gap-3">
            <!-- Play/Pause Button -->
            <button
                @click="togglePlay"
                class="flex-shrink-0 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                :disabled="isLoading || hasError"
                :aria-label="isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'"
            >
                <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                </svg>
                <svg v-else-if="hasError" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <svg v-else-if="isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>

            <!-- Progress Bar -->
            <div class="flex-grow">
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{{ formatTime(currentTime) }}</span>
                    <span v-if="hasError" class="text-red-500">Erro no áudio</span>
                    <span v-else>{{ formatTime(duration) }}</span>
                </div>
                <div 
                    class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer"
                    @click="seek"
                    ref="progressBar"
                >
                    <div 
                        class="bg-red-500 h-2 rounded-full transition-all duration-100"
                        :style="{ width: progressPercentage + '%' }"
                    ></div>
                </div>
            </div>

            <!-- Volume Control -->
            <div class="flex-shrink-0 flex items-center gap-2">
                <button
                    @click="toggleMute"
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    :aria-label="isMuted ? 'Ativar som' : 'Silenciar'"
                    :disabled="hasError"
                >
                    <svg v-if="isMuted || hasError" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                    <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Hidden Audio Element -->
        <audio
            ref="audioElement"
            :src="src"
            @loadedmetadata="onLoadedMetadata"
            @timeupdate="onTimeUpdate"
            @ended="onEnded"
            @canplay="onCanPlay"
            @loadstart="onLoadStart"
            @error="onError"
            @loadeddata="onLoadedData"
            preload="metadata"
        ></audio>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Props {
    src: string;
    compact?: boolean;
    debugMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    compact: false,
    debugMode: false
});

const audioElement = ref<HTMLAudioElement | null>(null);
const progressBar = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const isLoading = ref(false);
const isMuted = ref(false);
const hasError = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const errorMessage = ref('');
const retryCount = ref(0);
const maxRetries = 3;

const progressPercentage = computed(() => {
    return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
});

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const togglePlay = async () => {
    if (!audioElement.value || hasError.value) return;

    try {
        if (isPlaying.value) {
            audioElement.value.pause();
            isPlaying.value = false;
        } else {
            console.log('Attempting to play audio:', props.src);
            await audioElement.value.play();
            isPlaying.value = true;
        }
    } catch (error) {
        console.error('Erro ao reproduzir áudio:', error);
        
        // Para URLs do Discord, tentar estratégias alternativas
        if (props.src.includes('cdn.discordapp.com')) {
            console.log('Discord URL detected, trying alternative methods...');
            await tryDiscordAudioFallbacks();
        } else {
            // Tentar retry se ainda não excedeu o limite
            if (retryCount.value < maxRetries) {
                console.log(`Tentando novamente... (${retryCount.value + 1}/${maxRetries})`);
                retryCount.value++;
                await retryWithDifferentMethod();
            } else {
                hasError.value = true;
                errorMessage.value = error instanceof Error ? error.message : 'Erro desconhecido';
                isPlaying.value = false;
            }
        }
    }
};

const tryDiscordAudioFallbacks = async () => {
    if (!audioElement.value) return;
    
    const strategies = [
        // Estratégia 1: Tentar sem crossorigin
        async () => {
            console.log('Strategy 1: No crossorigin');
            audioElement.value!.removeAttribute('crossorigin');
            audioElement.value!.load();
            await new Promise(resolve => setTimeout(resolve, 500));
            return audioElement.value!.play();
        },
        
        // Estratégia 2: Usar fetch para carregar como blob
        async () => {
            console.log('Strategy 2: Fetch as blob');
            try {
                const response = await fetch(props.src, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                console.log('Created blob URL:', blobUrl);
                audioElement.value!.src = blobUrl;
                audioElement.value!.load();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                return audioElement.value!.play();
            } catch (fetchError) {
                console.error('Fetch strategy failed:', fetchError);
                throw fetchError;
            }
        },
        
        // Estratégia 3: Tentar com proxy customizado local
        async () => {
            console.log('Strategy 3: Custom proxy');
            const proxyUrl = createCustomProxy(props.src);
            audioElement.value!.src = proxyUrl;
            audioElement.value!.load();
            await new Promise(resolve => setTimeout(resolve, 500));
            return audioElement.value!.play();
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        try {
            console.log(`Trying Discord strategy ${i + 1}/${strategies.length}`);
            await strategies[i]();
            isPlaying.value = true;
            hasError.value = false;
            console.log(`Strategy ${i + 1} successful!`);
            return;
        } catch (error) {
            console.error(`Strategy ${i + 1} failed:`, error);
            continue;
        }
    }
    
    // Se todas as estratégias falharam
    hasError.value = true;
    errorMessage.value = 'Falha ao carregar áudio do Discord após todas as tentativas';
    isPlaying.value = false;
};

const createCustomProxy = (url: string): string => {
    // Criar uma data URL que tenta contornar CORS
    // Esta é uma abordagem muito simples, pode não funcionar sempre
    try {
        const proxyUrl = `data:audio/mpeg;charset=utf-8,${encodeURIComponent(url)}`;
        return proxyUrl;
    } catch (error) {
        console.error('Failed to create custom proxy:', error);
        return url;
    }
};

const retryWithDifferentMethod = async () => {
    if (!audioElement.value) return;
    
    try {
        // Tentar diferentes configurações de crossorigin
        const crossoriginOptions = ['', 'anonymous', 'use-credentials'];
        const currentOption = crossoriginOptions[retryCount.value % crossoriginOptions.length];
        
        console.log(`Retry ${retryCount.value}: Setting crossorigin to "${currentOption}"`);
        
        if (currentOption === '') {
            audioElement.value.removeAttribute('crossorigin');
        } else {
            audioElement.value.setAttribute('crossorigin', currentOption);
        }
        
        // Forçar reload do elemento
        audioElement.value.load();
        
        // Aguardar um momento e tentar tocar novamente
        setTimeout(async () => {
            try {
                if (audioElement.value) {
                    await audioElement.value.play();
                    isPlaying.value = true;
                    hasError.value = false;
                }
            } catch (error) {
                console.error(`Retry ${retryCount.value} failed:`, error);
                if (retryCount.value >= maxRetries) {
                    hasError.value = true;
                    errorMessage.value = 'Falha após múltiplas tentativas';
                } else {
                    togglePlay(); // Tentar novamente
                }
            }
        }, 500);
        
    } catch (error) {
        console.error('Error in retry method:', error);
        hasError.value = true;
    }
};

const toggleMute = () => {
    if (!audioElement.value || hasError.value) return;
    
    isMuted.value = !isMuted.value;
    audioElement.value.muted = isMuted.value;
};

const seek = (event: MouseEvent) => {
    if (!audioElement.value || !progressBar.value || duration.value === 0 || hasError.value) return;

    const rect = progressBar.value.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration.value;
    
    audioElement.value.currentTime = newTime;
    currentTime.value = newTime;
};

const onLoadStart = () => {
    console.log('Audio load started:', props.src);
    isLoading.value = true;
    hasError.value = false;
};

const onLoadedMetadata = () => {
    console.log('Audio metadata loaded:', props.src);
    if (audioElement.value) {
        duration.value = audioElement.value.duration;
        console.log('Audio duration:', duration.value);
    }
};

const onLoadedData = () => {
    console.log('Audio data loaded:', props.src);
    isLoading.value = false;
    hasError.value = false;
    retryCount.value = 0; // Reset retry count on successful load
};

const onCanPlay = () => {
    console.log('Audio can play:', props.src);
    isLoading.value = false;
    hasError.value = false;
    retryCount.value = 0; // Reset retry count on successful load
};

const onTimeUpdate = () => {
    if (audioElement.value) {
        currentTime.value = audioElement.value.currentTime;
    }
};

const onEnded = () => {
    isPlaying.value = false;
    currentTime.value = 0;
    if (audioElement.value) {
        audioElement.value.currentTime = 0;
    }
};

const onError = (error: Event) => {
    console.error('Erro no player de áudio:', error);
    console.error('Audio src:', props.src);
    console.error('Audio element:', audioElement.value);
    
    if (audioElement.value && audioElement.value.error) {
        console.error('Audio error details:', {
            code: audioElement.value.error.code,
            message: audioElement.value.error.message,
            networkState: audioElement.value.networkState,
            readyState: audioElement.value.readyState,
            src: audioElement.value.src
        });
        
        // Códigos de erro específicos
        const errorCodes = {
            1: 'MEDIA_ERR_ABORTED - Download abortado',
            2: 'MEDIA_ERR_NETWORK - Erro de rede',
            3: 'MEDIA_ERR_DECODE - Erro de decodificação',
            4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Formato não suportado'
        };
        
        const errorCode = audioElement.value.error.code;
        console.error('Error type:', errorCodes[errorCode as keyof typeof errorCodes] || `Unknown error code: ${errorCode}`);
    }
    
    // Não definir erro imediatamente - tentar retry primeiro
    if (retryCount.value < maxRetries) {
        console.log(`Auto-retry on error... (${retryCount.value + 1}/${maxRetries})`);
        retryCount.value++;
        retryWithDifferentMethod();
    } else {
        isLoading.value = false;
        isPlaying.value = false;
        hasError.value = true;
        errorMessage.value = 'Falha ao carregar áudio após múltiplas tentativas';
    }
};

// Watch for src changes
watch(() => props.src, (newSrc) => {
    console.log('Audio src changed:', newSrc);
    hasError.value = false;
    isPlaying.value = false;
    currentTime.value = 0;
    duration.value = 0;
    retryCount.value = 0; // Reset retry count
    
    if (audioElement.value) {
        audioElement.value.load(); // Reload the audio element
    }
});

onMounted(() => {
    console.log('AudioPlayer mounted with src:', props.src);
    
    // Pausar outros áudios quando este começar a tocar
    const handlePlay = () => {
        document.querySelectorAll('audio').forEach(audio => {
            if (audio !== audioElement.value && !audio.paused) {
                audio.pause();
            }
        });
    };

    if (audioElement.value) {
        audioElement.value.addEventListener('play', handlePlay);
    }
});

onUnmounted(() => {
    if (audioElement.value) {
        audioElement.value.pause();
        audioElement.value.src = '';
    }
});
</script>

<style scoped>
.audio-player-widget {
    border: 1px solid rgba(229, 231, 235, 0.6);
}

.dark .audio-player-widget {
    border-color: rgba(75, 85, 99, 0.6);
}
</style> 