<template>
  <div @click="onPreview" class="relative p-3 rounded-lg shadow-md cursor-pointer" :style="nodeStyle">
    <div v-if="isApproving" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-10 transition-opacity duration-300">
        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-400 mb-2"></div>
        <span class="text-xs text-green-300 font-semibold">Criando Post...</span>
    </div>
    <Handle id="target-left" type="target" :position="Position.Left" />
    <Handle id="source-right" type="source" :position="Position.Right" />
    <div class="flex items-center mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.523L16.5 21.75l-.398-1.227a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.227-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.227a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.227.398a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
      <div class="font-bold text-sm">Conteúdo (IA)</div>
    </div>
    <div class="text-xs text-neutral-200 truncate" :title="data.title">
      {{ data.title }}
    </div>
    <div class="mt-2 pt-2 border-t border-white/20 flex justify-end items-center">
        <div class="flex space-x-1">
             <button @click.stop="onRegenerate" title="Regerar Conteúdo" class="text-white hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
             <button @click.stop="onApprove" title="Aprovar para Post" class="text-white hover:text-green-300 transition-colors p-1 rounded-full hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            </button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  isApproving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['approve', 'preview', 'regenerate'])

const onApprove = () => {
  emit('approve', { type: 'ai-content', data: props.data })
}

const onPreview = () => {
    emit('preview', { type: 'ai-content', data: props.data })
}

const onRegenerate = () => {
    emit('regenerate', { type: 'ai-content', data: props.data })
}

const nodeStyle = computed(() => ({
  backgroundColor: 'rgba(107, 33, 168, 0.7)',
  borderColor: '#6b21a8',
  borderWidth: '2px',
  color: '#ffffff',
  width: '220px',
}))
</script> 