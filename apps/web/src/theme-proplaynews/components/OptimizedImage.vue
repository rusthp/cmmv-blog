<template>
  <div class="progressive-img-container relative overflow-hidden w-full h-full" :style="containerStyle" :class="{ 'rounded': rounded }">
    <img
      v-if="loaded"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :style="imageStyle"
      class="progressive-img absolute inset-0 w-full h-full"
      :class="{ 
        'rounded': rounded, 
        'blur-up': blur, 
        'lazyloaded': loaded && !loading,
        'object-cover': objectFit === 'cover',
        'object-contain': objectFit === 'contain',
        'object-fill': objectFit === 'fill'
      }"
      ref="image"
      @load="onImageLoaded"
      @error="onImageError"
      decoding="async"
      :fetchpriority="priority"
      :loading="lazyLoad ? 'lazy' : 'eager'"
    />
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-200">
      <div class="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-gray-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [Number, String],
    default: null
  },
  height: {
    type: [Number, String],
    default: null
  },
  objectFit: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'contain', 'fill', 'none', 'scale-down'].includes(value)
  },
  rounded: {
    type: Boolean,
    default: false
  },
  blur: {
    type: Boolean,
    default: true
  },
  lazyLoad: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    default: 'auto',
    validator: (value) => ['auto', 'high', 'low'].includes(value)
  },
  ratio: {
    type: String,
    default: null
  }
});

const image = ref(null);
const loading = ref(true);
const error = ref(false);
const loaded = ref(false);

const containerStyle = computed(() => {
  const style = {};
  
  if (props.ratio) {
    const [width, height] = props.ratio.split(':');
    style.paddingBottom = `${(Number(height) / Number(width)) * 100}%`;
  } else if (props.height && props.width) {
    style.paddingBottom = `${(Number(props.height) / Number(props.width)) * 100}%`;
  }
  
  return style;
});

const imageStyle = computed(() => {
  const style = {};
  
  if (props.objectFit) {
    style.objectFit = props.objectFit;
  }
  
  return style;
});

const onImageLoaded = () => {
  loading.value = false;
  loaded.value = true;
};

const onImageError = () => {
  loading.value = false;
  error.value = true;
};

onMounted(() => {
  if (!props.lazyLoad || (props.priority === 'high')) {
    const img = new Image();
    img.src = props.src;
    img.onload = onImageLoaded;
    img.onerror = onImageError;
    loaded.value = true;
  } else {
    loaded.value = true;
  }
});
</script> 