<template>
  <div class="p-3 rounded-lg shadow-md transition-all duration-300" :style="nodeStyle" :class="isEditing ? 'w-[450px]' : 'w-[220px]'">
    <Handle id="target-left" type="target" :position="Position.Left" :style="{ top: '50%' }" />
    <Handle id="source-right" type="source" :position="Position.Right" :style="{ top: '50%' }" />
    
    <div class="font-bold text-sm mb-1">Parser</div>
    
    <!-- Simple View -->
    <template v-if="!isEditing">
      <div class="text-xs text-neutral-200">
        <p class="truncate" :title="data.title || 'N/A'">
          Regex: <span class="font-mono">{{ data.title || 'N/A' }}</span>
        </p>
      </div>
      <div class="mt-2 pt-2 border-t border-white/20 flex justify-end items-center space-x-1">
        <button @click.stop="toggleEditMode" title="Editar Parser" class="text-white hover:text-yellow-300 transition-colors p-1 rounded-full hover:bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button @click.stop="$emit('delete', { data: props.data })" title="Excluir Parser" class="text-white hover:text-red-300 transition-colors p-1 rounded-full hover:bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </template>

    <!-- Editing View -->
    <template v-else>
      <div class="space-y-2 mt-3 text-xs max-h-64 overflow-y-auto pr-2">
        <!-- Regex Fields -->
        <div v-for="field in editableFields" :key="field.key">
            <label :for="`parser-${data.id}-${field.key}`" class="block text-xs font-medium text-neutral-300 mb-1">{{ field.label }}</label>
            <input :id="`parser-${data.id}-${field.key}`" v-model="editableData[field.key]" type="text" class="w-full px-2 py-1 bg-neutral-900 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs" />
        </div>
      </div>
      
      <!-- AI Generator Section -->
      <div class="mt-3 pt-3 border-t border-white/20">
          <label class="block text-xs font-medium text-neutral-300 mb-1">URL para Teste e Geração</label>
          <div class="flex">
              <input v-model="generationUrl" type="url" placeholder="Cole a URL do artigo aqui" class="flex-grow px-2 py-1 bg-neutral-900 border border-neutral-600 rounded-l-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
              <button @click="generateWithAi" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-r-md text-xs" :disabled="generating || !generationUrl">
                  <span v-if="generating">Gerando...</span>
                  <span v-else>IA</span>
              </button>
               <button @click="testParser" class="px-3 py-1 ml-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs" :disabled="testing || !generationUrl">
                  <span v-if="testing">Testando...</span>
                  <span v-else>Testar</span>
              </button>
          </div>
           <p v-if="generationError" class="text-red-400 text-xs mt-1">{{ generationError }}</p>
      </div>

       <!-- Test Results -->
      <div v-if="testResults" class="mt-2 text-xs">
          <h4 class="font-bold text-neutral-200">Resultados do Teste:</h4>
          <pre class="bg-neutral-900 p-2 rounded-md max-h-28 overflow-auto text-green-300">{{ JSON.stringify(testResults, null, 2) }}</pre>
      </div>

      <!-- Action Buttons for Editing View -->
      <div class="mt-3 pt-3 border-t border-white/20 flex justify-end items-center space-x-2">
        <button @click="cancelEdit" class="px-3 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 rounded-md">Cancelar</button>
        <button @click="saveChanges" class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-md">Salvar</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed, ref } from 'vue'
import { useFeedClient } from '../../client'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(['update', 'delete'])

const feedClient = useFeedClient()

const isEditing = ref(false)
const editableData = ref({})
const editableFields = ref([
    { key: 'title', label: 'Regex de Título' },
    { key: 'content', label: 'Regex de Conteúdo' },
    { key: 'category', label: 'Regex de Categoria' },
    { key: 'featureImage', label: 'Regex de Imagem' },
    { key: 'tags', label: 'Regex de Tags' },
])

const generationUrl = ref('')
const generating = ref(false)
const generationError = ref(null)
const testing = ref(false)
const testResults = ref(null)


const toggleEditMode = () => {
    isEditing.value = true
    editableData.value = JSON.parse(JSON.stringify(props.data))
    generationError.value = null
    generationUrl.value = ''
    testResults.value = null
}

const cancelEdit = () => {
    isEditing.value = false
}

const saveChanges = () => {
    emit('update', editableData.value)
    isEditing.value = false
}

const testParser = async () => {
    if (!generationUrl.value) return;
    testing.value = true;
    generationError.value = null;
    testResults.value = null;
    try {
        const response = await feedClient.parser.testContent(editableData.value, generationUrl.value);
        if (response && response.success) {
            testResults.value = response.data;
        } else {
            const errorMessage = response?.message || 'Falha ao testar o parser. Verifique se o endpoint da API está funcionando.';
            throw new Error(errorMessage);
        }
    } catch (err) {
        generationError.value = err?.message || 'Ocorreu um erro desconhecido durante o teste.';
    } finally {
        testing.value = false;
    }
}

const generateWithAi = async () => {
    if (!generationUrl.value) return;
    generating.value = true;
    generationError.value = null;
    testResults.value = null;
    try {
        const encodedUrl = encodeURIComponent(generationUrl.value)
        const response = await feedClient.parser.parseURL(encodedUrl)
        if (response) {
            const updateField = (field, newValue, confidence) => {
                const oldValue = editableData.value[field];
                if (!oldValue || confidence === 'high') {
                    editableData.value[field] = newValue || '';
                }
            };
            
            updateField('title', response.title?.regex, response.title?.confidence);
            updateField('content', response.content?.regex, response.content?.confidence);
            updateField('category', response.category?.regex, response.category?.confidence);
            updateField('featureImage', response.featuredImage?.regex, response.featuredImage?.confidence);
            updateField('tags', response.tags?.regex, response.tags?.confidence);

        } else {
            throw new Error('Resposta inválida da IA.')
        }
    } catch (err) {
        generationError.value = err?.message || 'Falha ao gerar regex com IA.'
    } finally {
        generating.value = false;
    }
}

const nodeStyle = computed(() => ({
  backgroundColor: 'rgba(34, 139, 34, 0.7)',
  borderColor: '#228B22',
  borderWidth: '2px',
  color: '#ffffff',
}))
</script> 