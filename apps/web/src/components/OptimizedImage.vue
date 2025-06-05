<template>
    <div class="relative w-full h-full" v-cloak>
        <!-- Optimized Image -->
        <img
            v-if="src && isHydrated"
            ref="imageElement"
            :src="imageSrc"
            :srcset="useOriginalImage ? undefined : computedSrcset"
            :sizes="useOriginalImage ? undefined : sizes"
            :alt="alt || 'Image'"
            :class="imageClasses"
            :width="width"
            :height="height"
            :loading="loading"
            :fetchpriority="priority"
            :title="title"
            :aria-label="ariaLabel"
            @load="onImageLoad"
            @error="onImageError"
        />

        <!-- Fallback/Placeholder -->
        <div
            v-else
            :class="fallbackClasses"
            class="w-full h-full bg-gray-200 flex items-center justify-center"
        >
            <slot name="fallback">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    :class="fallbackIconSize"
                    class="text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useSettingsStore } from '../store/settings';

const settingsStore = useSettingsStore();
const settings = ref<any>(settingsStore.getSettings);

interface OptimizedImageProps {
    src?: string;
    srcset?: string;
    sizes?: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    loading?: 'lazy' | 'eager';
    priority?: 'high' | 'low' | 'auto';
    title?: string;
    ariaLabel?: string;
    classes?: string;
    fallbackClasses?: string;
    iconSize?: 'sm' | 'md' | 'lg' | 'xl';
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    hover?: boolean;
    transition?: boolean;
    autoSrcset?: boolean;
    srcsetSizes?: number[];
    quality?: number;
    format?: string;
}

const isHydrated = ref(false);
const imageElement = ref<HTMLImageElement | null>(null);
const isLoaded = ref(false);
const useOriginalImage = ref(false);

const props = withDefaults(defineProps<OptimizedImageProps>(), {
    loading: 'lazy',
    priority: 'auto',
    classes: '',
    fallbackClasses: '',
    iconSize: 'md',
    objectFit: 'cover',
    hover: false,
    transition: true,
    autoSrcset: true,
    srcsetSizes: () => [320, 640, 960, 1280, 2560],
    sizes: '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 960px) 960px, (max-width: 1280px) 1280px, 2560px',
    quality: 75,
    format: 'auto'
});

const emit = defineEmits<{
    load: [event: Event];
    error: [event: Event];
}>();

const generateCloudflareImageUrl = (originalUrl: string, width: number, fit: string = 'cover', quality: number = 75, format: string = 'auto'): string => {
    try {
        const cfParams = `width=${width},quality=${quality},format=${format},fit=${fit}`;
        const cfPrefix = `/cdn-cgi/image/${cfParams}`;

        let url: URL;
        if (originalUrl.startsWith('http')) {
            url = new URL(originalUrl);
        } else {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            url = new URL(originalUrl, baseUrl || 'https://example.com');
        }

        if (!url.pathname.includes('/cdn-cgi/image/')) {
            url.pathname = cfPrefix + url.pathname;
        } else {
            url.pathname = url.pathname.replace(
                /\/cdn-cgi\/image\/[^/]+/,
                cfPrefix
            );
        }

        return url.toString();
    } catch (error) {
        console.warn('Error generating Cloudflare URL:', error);
        return originalUrl;
    }
};

const generateSrcset = (src: string, sizes: number[]): string => {

    if (!src || !settings.value['blog.cloudflareImageSrcset']) return '';

    const fit = props.objectFit === 'contain' ? 'contain' : 'cover';

    return sizes.map(size => {
        const resizedUrl = generateCloudflareImageUrl(src, size, fit, props.quality, props.format);
        return `${resizedUrl} ${size}w`;
    }).join(', ');
};

const computedSrcset = computed(() => {
    if (props.srcset)
        return props.srcset;

    if (props.autoSrcset && props.src)
        return generateSrcset(props.src, props.srcsetSizes);

    return undefined;
});

const imageClasses = computed(() => {
    const baseClasses = [
        'w-full h-full',
        `object-${props.objectFit}`,
        'imgix-lazy'
    ];

    if (props.transition) {
        baseClasses.push('transition-transform duration-300');
    }

    if (props.hover) {
        baseClasses.push('hover:scale-105');
    }

    if (props.classes) {
        baseClasses.push(props.classes);
    }

    return baseClasses.join(' ');
});

const fallbackIconSize = computed(() => {
    const sizeMap = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20'
    };
    return sizeMap[props.iconSize];
});

const onImageLoad = (event: Event) => {
    if (isLoaded.value) return;

    isLoaded.value = true;
    emit('load', event);
};

const onImageError = (event: Event) => {
    if (!useOriginalImage.value && props.src) {
        console.warn('Optimized image failed, falling back to original:', props.src);
        useOriginalImage.value = true;
        return;
    }

    emit('error', event);
};

const imageSrc = computed(() => {
    if (!props.src) return '';

    if (useOriginalImage.value)
        return props.src;

    if (settings.value['blog.cloudflareImageSrcset']) {
        const fit = props.objectFit === 'contain' ? 'contain' : 'cover';
        return generateCloudflareImageUrl(props.src, 1280, fit, props.quality, props.format);
    }

    return props.src;
});

watch(() => props.src, () => {
    useOriginalImage.value = false;
    isLoaded.value = false;
});

onMounted(() => {
    isHydrated.value = true;
});

onUnmounted(() => {
    isLoaded.value = false;
    useOriginalImage.value = false;
});
</script>

<style scoped>
/* Component-specific styles */
.imgix-lazy {
    transition: opacity 0.3s ease;
}

.imgix-lazy.imgix-loaded {
    opacity: 1;
}

.imgix-lazy.imgix-error {
    opacity: 0.5;
    filter: grayscale(100%);
}
</style>
