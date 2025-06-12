<template>
  <div class="relative p-3 rounded-lg shadow-md transition-all duration-200" :style="nodeStyle" :class="{'ring-2 ring-offset-2 ring-offset-neutral-900 ring-sky-400': isSelected}">
    <div v-if="isApproving" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-10 transition-opacity duration-300">
        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-400 mb-2"></div>
        <span class="text-xs text-green-300 font-semibold">Criando Post...</span>
    </div>
    <Handle id="target-left" type="target" :position="Position.Left" :style="{ top: '50%' }" />
    <Handle id="source-right" type="source" :position="Position.Right" :style="{ top: '50%' }" />

    <div v-if="data.featureImage" class="mb-2 -m-3 mt-0 rounded-t-lg overflow-hidden h-24 bg-neutral-700">
        <img :src="imageProxyUrl" @error="onImageError" v-if="!imageError" class="w-full h-full object-cover" alt="Feature Image">
        <div v-else class="w-full h-full flex items-center justify-center text-neutral-500">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6l.01.01" /></svg>
        </div>
    </div>

    <div class="mb-2" :class="{'mt-2': data.featureImage}">
      <div class="font-bold text-sm truncate" :title="data.title">{{ data.title }}</div>
      <div class="text-xs text-neutral-400 mt-1 flex items-center justify-between">
        <span>{{ new Date(data.pubDate).toLocaleString() }}</span>
        <span v-if="data.relevance > 0" class="font-semibold" :style="{ color: relevanceColor }">Relevance: {{ data.relevance }}</span>
      </div>
    </div>
    <div class="mt-2 pt-2 border-t border-white/20 flex justify-between items-center space-x-2">
      <select
        :value="selectedPrompt"
        @change="$emit('update:selectedPrompt', $event.target.value)"
        @click.stop
        class="w-full text-xs bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1"
      >
        <option value="default">Default Prompt</option>
        <option v-for="prompt in prompts" :key="prompt.id" :value="prompt.id">
          {{ prompt.name }}
        </option>
      </select>
    </div>

    <!-- Action Buttons -->
    <div class="mt-2 pt-2 border-t border-white/20 flex justify-end items-center space-x-1">
        <button @click.stop="onGenerateAi" title="Gerar com IA" class="text-white hover:text-purple-300 transition-colors p-1 rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
        </button>
        <button @click.stop="onReprocess" title="Reprocessar" class="text-white hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
        <button @click.stop="onPreview" title="Preview" class="text-white hover:text-green-300 transition-colors p-1 rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        <a :href="data.link" target="_blank" @click.stop title="Abrir Link Original" class="text-white hover:text-yellow-300 transition-colors p-1 rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
        <button @click.stop="onReject" title="Rejeitar" class="text-white hover:text-red-300 transition-colors p-1 rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed, ref } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  prompts: {
    type: Array,
    default: () => []
  },
  selectedPrompt: {
    type: String,
    default: 'default'
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isApproving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['preview', 'generate-ai', 'update:selectedPrompt', 'reprocess', 'reject'])

const imageError = ref(false)

const onImageError = () => {
    imageError.value = true
}

const imageProxyUrl = computed(() => {
    if (!props.data.featureImage) return ''
    return `/api/feed/raw/imageProxy?url=${encodeURIComponent(props.data.featureImage)}`
})

const onPreview = () => {
  emit('preview', { type: 'raw', data: props.data })
}

const onGenerateAi = () => {
  emit('generate-ai', { type: 'raw', data: props.data, promptId: props.selectedPrompt })
}

const onReprocess = () => {
    emit('reprocess', { type: 'raw', data: props.data });
}

const onReject = () => {
    emit('reject', { type: 'raw', data: props.data });
}

const relevanceColor = computed(() => {
    const relevance = props.data.relevance || 0;
    if (relevance > 75) return '#4ade80'; // green-400
    if (relevance > 40) return '#facc15'; // yellow-400
    if (relevance > 0) return '#f87171'; // red-400
    return '#a5b4fc'; // indigo-300 (default)
});

const nodeStyle = computed(() => ({
  backgroundColor: 'rgba(55, 65, 81, 0.8)', // gray-700 com opacidade
  borderColor: relevanceColor.value,
  borderWidth: '1px',
  color: '#ffffff',
  width: '280px',
}))
</script> 