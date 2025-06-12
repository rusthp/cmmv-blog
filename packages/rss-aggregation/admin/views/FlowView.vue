<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Fluxo de Agregação RSS</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Atualizar
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Carregando dados...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Falha ao carregar dados</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Tentar Novamente
            </button>
        </div>

        <!-- Flow View -->
        <div v-else class="bg-neutral-800 rounded-lg p-4 h-[calc(100vh-200px)] min-h-[600px]">
            <VueFlow :nodes="nodes" :edges="edges" class="bg-neutral-900">
                <template #node-channel="props">
                    <ChannelNode 
                        :data="props.data" 
                        @edit="handleNodeEdit" 
                        @view-raws="handleViewRaws"
                        @execute="handleExecuteChannel"
                        @update="handleNodeUpdate"
                        :class="{ 'pulse-border': executing.has(props.data.id) }"
                    />
                </template>
                <template #node-parser="props">
                    <ParserNode 
                        :data="props.data" 
                        @update="handleUpdateParser"
                        @delete="handleDeleteParser"
                    />
                </template>
                <template #node-raw="props">
                    <RawNode 
                        :data="props.data" 
                        :prompts="promptsList"
                        :is-selected="selectedRaws.has(props.data.id)"
                        :selected-prompt="selectedPrompts[props.data.id] || 'default'"
                        @update:selected-prompt="selectedPrompts[props.data.id] = $event"
                        @preview="handlePreview"
                        @generate-ai="handleGenerateAi"
                        @reprocess="handleReprocessRaw"
                        @reject="handleRejectRaw"
                    />
                </template>
                <template #node-ai-content="props">
                    <AiNode 
                        :data="props.data" 
                        @approve="handleApproveAi" 
                        @preview="handlePreview"
                        @regenerate="handleRegenerateAi"
                    />
                </template>

                <Background pattern-color="#4a5568" />
                <MiniMap />
                <Controls />

                <Panel position="top-right" class="p-2 space-x-2 flex items-center">
                     <button title="Centralizar Visualização" @click="fitView()" class="p-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                        </svg>
                    </button>
                    <button v-if="selectedRaws.size > 0" @click="handleClassifySelectedRaws" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                        Classificar {{ selectedRaws.size }} com IA
                    </button>
                     <button @click="openChannelDialog()" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                        + Adicionar Canal
                    </button>
                    <button @click="openParserDialog()" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm">
                        + Adicionar Parser
                    </button>
                </Panel>
            </VueFlow>
        </div>

        <!-- Test Parser Dialog -->
        <div v-if="showTestParserDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">Testar Parser: {{ currentParser?.title }}</h3>
                    <button @click="closeTestParserDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-neutral-300 mb-1">URL para testar</label>
                    <div class="flex">
                        <input v-model="parserTestUrl" type="url" placeholder="https://exemplo.com/artigo" class="flex-grow px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white" />
                        <button @click="testParserWithUrl" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors" :disabled="!parserTestUrl || testingParser">
                            <span v-if="testingParser">Testando...</span>
                            <span v-else>Testar</span>
                        </button>
                    </div>
                </div>
                <div v-if="parserTestResults" class="mt-6 bg-neutral-700 rounded-lg p-4">
                    <h4 class="text-lg font-medium text-white mb-4">Resultados</h4>
                     <div v-for="(value, key) in parserTestResults" :key="key" class="mb-4">
                        <h5 class="text-sm font-medium text-neutral-400 mb-1 capitalize">{{ key }}</h5>
                        <div class="bg-neutral-800 p-3 rounded-md">
                            <p v-if="typeof value === 'string'" class="text-white whitespace-pre-wrap">{{ value || 'N/A' }}</p>
                            <img v-else-if="key === 'featureImage' && value" :src="value" class="max-h-48 rounded-md" />
                            <pre v-else class="text-white whitespace-pre-wrap">{{ JSON.stringify(value, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Parser Confirmation Dialog -->
        <div v-if="showDeleteParserDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">Excluir Parser</h3>
                    <button @click="showDeleteParserDialog = false" class="text-neutral-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <p class="text-neutral-300 mb-4">Tem certeza que deseja excluir o parser? Esta ação não pode ser desfeita.</p>
                <div class="flex justify-end space-x-3">
                    <button @click="showDeleteParserDialog = false" class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">Cancelar</button>
                    <button @click="confirmDeleteParser" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors" :disabled="deletingParser">
                        <span v-if="deletingParser">Excluindo...</span>
                        <span v-else>Excluir</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Channel Form Dialog -->
        <div v-if="showChannelDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-xl w-full p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">{{ editMode ? 'Editar Canal' : 'Adicionar Canal' }}</h3>
                    <button @click="closeChannelDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <!-- Form fields for channel -->
                    <div>
                        <label for="channelName" class="block text-sm font-medium text-neutral-300 mb-1">Nome do Canal</label>
                        <input
                            id="channelName"
                            v-model="channelForm.name"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Nome do canal"
                            required
                        />
                    </div>

                    <div>
                        <label for="channelUrl" class="block text-sm font-medium text-neutral-300 mb-1">URL do Site</label>
                        <input
                            id="channelUrl"
                            v-model="channelForm.url"
                            type="url"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="https://exemplo.com"
                            required
                        />
                    </div>

                    <div>
                        <label for="channelRss" class="block text-sm font-medium text-neutral-300 mb-1">URL do Feed RSS</label>
                        <input
                            id="channelRss"
                            v-model="channelForm.rss"
                            type="url"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="https://exemplo.com/feed.xml"
                            required
                        />
                    </div>

                    <div>
                        <label for="channelInterval" class="block text-sm font-medium text-neutral-300 mb-1">Intervalo de Atualização</label>
                        <div class="flex items-center">
                            <input
                                id="channelInterval"
                                v-model.number="channelForm.intervalHours"
                                type="number"
                                min="1"
                                max="168"
                                class="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                            <span class="ml-2 text-neutral-300">horas</span>
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center">
                            <input
                                id="channelActive"
                                v-model="channelForm.active"
                                type="checkbox"
                                class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                            />
                            <label for="channelActive" class="ml-2 block text-sm font-medium text-neutral-300">
                                Ativo
                            </label>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button
                        @click="closeChannelDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="saveChannel"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                        {{ editMode ? 'Atualizar' : 'Criar' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Parser Form Dialog -->
        <div v-if="showParserDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-xl w-full p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">{{ editMode ? 'Editar Parser' : 'Adicionar Parser' }}</h3>
                    <button @click="closeParserDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <!-- Form fields for parser -->
                    <div>
                        <label for="parserChannel" class="block text-sm font-medium text-neutral-300 mb-1">Canal</label>
                        <select
                            id="parserChannel"
                            v-model="parserForm.channel"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        >
                            <option value="" disabled>Selecione um canal</option>
                            <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                                {{ channel.name }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label for="parserTitle" class="block text-sm font-medium text-neutral-300 mb-1">Regex de Título</label>
                        <input
                            id="parserTitle"
                            v-model="parserForm.title"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Expressão regular para extrair o título"
                            required
                        />
                    </div>

                    <div>
                        <label for="parserContent" class="block text-sm font-medium text-neutral-300 mb-1">Regex de Conteúdo</label>
                        <input
                            id="parserContent"
                            v-model="parserForm.content"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Expressão regular para extrair o conteúdo"
                            required
                        />
                    </div>

                    <div>
                        <label for="parserCategory" class="block text-sm font-medium text-neutral-300 mb-1">Regex de Categoria</label>
                        <input
                            id="parserCategory"
                            v-model="parserForm.category"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Expressão regular para extrair a categoria"
                        />
                    </div>

                    <div>
                        <label for="parserImage" class="block text-sm font-medium text-neutral-300 mb-1">Regex de Imagem</label>
                        <input
                            id="parserImage"
                            v-model="parserForm.featureImage"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Expressão regular para extrair a imagem"
                        />
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button
                        @click="closeParserDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="saveParser"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                        {{ editMode ? 'Atualizar' : 'Criar' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div v-if="notification.show" class="fixed bottom-4 right-4 max-w-xs bg-neutral-800 text-white p-4 rounded-lg shadow-lg z-50 flex items-start"
            :class="{
                'bg-green-600': notification.type === 'success',
                'bg-red-600': notification.type === 'error',
                'bg-blue-600': notification.type === 'info'
            }">
            <div class="flex-shrink-0 mr-2">
                <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <p class="text-sm">{{ notification.message }}</p>
            </div>
        </div>

        <!-- Preview Dialog -->
        <div
            v-if="showPreview"
            class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-hidden"
            style="backdrop-filter: blur(4px);"
            @click.self="closePreview"
        >
            <div class="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div class="flex items-center space-x-4">
                        <!-- Prompt selector dropdown -->
                        <div class="w-64">
                            <label class="block text-xs text-gray-500 mb-1">AI Prompt Template:</label>
                            <div v-if="loadingPrompts" class="flex items-center py-1">
                                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                                <span class="text-gray-500 text-sm">Loading prompts...</span>
                            </div>
                            <select
                                v-else
                                v-model="selectedPrompt"
                                class="w-full px-2 py-1 text-sm bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="default">Default</option>
                                <option v-for="prompt in promptsList" :key="prompt.id" :value="prompt.id">
                                    {{ prompt.name || 'Unnamed Prompt' }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">

                        <button
                            v-if="!aiContent && !editMode"
                            @click="generateAIContentFromPreview"
                            class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors flex items-center"
                            :disabled="aiLoading"
                        >
                            <svg v-if="aiLoading" class="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {{ aiLoading ? 'Generating...' : 'Generate AI Version' }}
                        </button>
                        <button
                            @click="toggleEditMode"
                            class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-md transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            {{ editMode ? 'Exit Edit' : 'Edit' }}
                        </button>
                        <a
                            v-if="previewItem"
                            :href="previewItem.link"
                            target="_blank"
                            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Read
                        </a>
                        <button @click="closePreview" class="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 overflow-y-auto">
                    <!-- Original Content -->
                    <div class="p-6 lg:w-1/2" :class="{ 'lg:w-full': !aiContent }">
                        <div v-if="previewItem">
                            <div class="mb-6">
                                <h1 class="text-2xl font-bold text-gray-900 mb-4">
                                    {{ aiContent ? 'Original: ' : '' }}{{ previewItem.title }}
                                </h1>
                            </div>

                            <div v-if="!editMode" class="prose prose-lg max-w-none text-gray-800" v-html="editedContent || previewItem.content"></div>
                            <div v-else class="w-full">
                                <textarea
                                    v-model="editedContent"
                                    class="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg text-gray-800 font-mono text-sm"
                                    placeholder="Edit the content here..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- AI Generated Content -->
                    <div v-if="aiContent || aiLoading" class="p-6 lg:w-1/2">
                        <div v-if="aiLoading" class="flex flex-col items-center justify-center h-64">
                            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                            <p class="text-gray-600 text-center">Generating AI content...</p>
                        </div>
                        <div v-else-if="aiError" class="bg-red-50 border border-red-200 rounded-md p-4">
                           ...
                        </div>
                        <div v-else-if="aiContent">
                            <div class="mb-6">
                                <h1 class="text-2xl font-bold text-gray-900 mb-4">AI Version: {{ aiContent.title }}</h1>
                            </div>
                            <div class="prose prose-lg max-w-none text-gray-800" v-html="aiContent.content"></div>
                            
                            <!-- AI Suggested Tags -->
                            <div v-if="aiContent.suggestedTags && aiContent.suggestedTags.length > 0" class="mt-6 mb-8">
                                <h3 class="text-lg font-semibold text-gray-800 mb-3">Suggested Tags</h3>
                                <div class="flex flex-wrap gap-2">
                                    <div
                                        v-for="(tag, index) in aiContent.suggestedTags"
                                        :key="index"
                                        class="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm flex items-center cursor-pointer hover:bg-purple-200 transition-colors"
                                        :class="{'bg-green-100 text-green-800': selectedTags.includes(tag)}"
                                        @click="toggleTagSelection(tag)"
                                    >
                                        <span>{{ tag }}</span>
                                        <svg v-if="selectedTags.includes(tag)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <!-- AI Suggested Categories & Category Selector -->
                            <div v-if="categories.length > 0" class="mt-8">
                                <h3 class="text-lg font-semibold text-gray-800 mb-3">Categories</h3>
                                <div v-if="aiContent.suggestedCategories && aiContent.suggestedCategories.length > 0" class="flex flex-wrap gap-2 mb-4">
                                     <div
                                        v-for="(suggestedCategory, index) in aiContent.suggestedCategories"
                                        :key="index"
                                        class="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm flex items-center"
                                    >
                                        <span>{{ suggestedCategory }}</span>
                                        <button
                                            v-if="!categoryExists(suggestedCategory)"
                                            @click="openCreateCategoryDialog(suggestedCategory)"
                                            class="ml-2 text-orange-600 hover:text-orange-800 transition-colors"
                                            title="Create this category"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </button>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div v-for="category in categories" :key="category.id" class="flex items-center">
                                            <input
                                                :id="'cat-' + category.id"
                                                type="checkbox"
                                                :value="category.id"
                                                v-model="selectedCategories"
                                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            >
                                            <label :for="'cat-' + category.id" class="ml-2 text-sm text-gray-700">{{ category.name }}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-8 pt-4 border-t border-gray-200 flex justify-between">
                                <button
                                    @click="handleApproveAi({ data: aiContent })"
                                    class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                                >
                                    Approve & Create Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Category Dialog -->
        <div v-if="showCreateCategoryDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold text-gray-800">Create New Category</h3>
                    <button @click="closeCreateCategoryDialog" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="createCategory">
                    <div class="mb-4">
                        <label for="newCategoryName" class="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                        <input
                            id="newCategoryName"
                            v-model="newCategoryForm.name"
                            @input="updateCategorySlug"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Category name"
                            required
                        />
                    </div>
                    <div class="mb-4">
                        <label for="newCategorySlug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                            id="newCategorySlug"
                            v-model="newCategoryForm.slug"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="category-slug"
                            required
                        />
                    </div>
                    <div class="mb-4">
                        <label for="parentCategory" class="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
                        <select
                            id="parentCategory"
                            v-model="newCategoryForm.parentCategory"
                            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">None</option>
                            <option v-for="category in categories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                    </div>
                    <div class="mb-4 flex items-center">
                        <input
                            id="categoryActive"
                            v-model="newCategoryForm.active"
                            type="checkbox"
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label for="categoryActive" class="ml-2 block text-sm text-gray-700">
                            Active
                        </label>
                    </div>
                    <div class="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            @click="closeCreateCategoryDialog"
                            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            :disabled="createCategoryLoading"
                        >
                             <span v-if="createCategoryLoading" class="flex items-center">
                                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </span>
                            <span v-else>Create Category</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFeedClient } from '../client'
import { useAdminClient } from '@cmmv/blog/admin/client';

import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

import ChannelNode from '../components/flow/ChannelNode.vue'
import ParserNode from '../components/flow/ParserNode.vue'
import RawNode from '../components/flow/RawNode.vue'
import AiNode from '../components/flow/AiNode.vue'

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

const { onConnect, addEdges, onNodeDragStop, onNodeClick, fitView, removeNodes, findNode } = useVueFlow()
const router = useRouter()

const feedClient = useFeedClient()
const adminClient = useAdminClient()
const LOCAL_STORAGE_KEY = 'rss-flow-positions';

// Estados gerais
const loading = ref(true)
const error = ref(null)
const channels = ref([])
const parsers = ref([])
const raws = ref([])
const aiContents = ref([])
const generatingAi = ref(new Set())
const executing = ref(new Set())
const selectedPrompts = ref({})
const selectedRaws = ref(new Set())

// Preview Dialog State
const showPreview = ref(false)
const previewItem = ref(null)
const aiContent = ref(null)
const aiLoading = ref(false)
const aiError = ref(null)
const editMode = ref(false)
const editedContent = ref(null)
const promptsList = ref([])
const selectedPrompt = ref('default')
const loadingPrompts = ref(false)
const categories = ref([])
const loadingCategories = ref(false)
const selectedTags = ref([])
const selectedCategories = ref([])

// Parser Test/Delete states
const showDeleteParserDialog = ref(false)
const parserToDelete = ref(null)
const deletingParser = ref(false)

// Estado do fluxo
const nodes = ref([])
const edges = ref([])

// Estados dos diálogos
const showChannelDialog = ref(false)
const showParserDialog = ref(false)

// Formulários
const channelForm = ref({
    id: '',
    name: '',
    url: '',
    rss: '',
    intervalHours: 24,
    active: true,
    requestLink: false
})

const parserForm = ref({
    id: '',
    channel: '',
    title: '',
    content: '',
    category: '',
    featureImage: '',
    tags: ''
})

// Notificação
const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

// Helper function to ensure AI content data is correctly parsed
const parseAiContentData = (aiData) => {
    if (!aiData) return null;
    return {
        ...aiData,
        suggestedTags: typeof aiData.suggestedTags === 'string' 
            ? JSON.parse(aiData.suggestedTags) 
            : (aiData.suggestedTags || []),
        suggestedCategories: typeof aiData.suggestedCategories === 'string' 
            ? JSON.parse(aiData.suggestedCategories) 
            : (aiData.suggestedCategories || []),
    };
}

// Funções de carregamento de dados
const loadChannels = async () => {
    try {
        const response = await feedClient.channels.get({ limit: 100, sortBy: 'name', sort: 'asc' })
        channels.value = response?.data || []
    } catch (err) {
        console.error('Falha ao carregar canais:', err)
        showNotification('error', err.message || 'Falha ao carregar canais')
    }
}

const loadParsers = async () => {
    try {
        const response = await feedClient.parser.get({ limit: 100, sortBy: 'createdAt', sort: 'desc' })
        parsers.value = response?.data || []
    } catch (err) {
        console.error('Falha ao carregar parsers:', err)
        showNotification('error', err.message || 'Falha ao carregar parsers')
    }
}

const loadRaws = async () => {
    try {
        const response = await feedClient.raw.get({
            limit: 50,
            sortBy: 'createdAt',
            sort: 'desc',
            status: 'pending'
        })
        raws.value = response?.data || []
    } catch (err) {
        console.error('Falha ao carregar raws:', err)
        showNotification('error', err.message || 'Falha ao carregar raws')
    }
}

const loadAiContents = async () => {
    try {
        const response = await feedClient.feedAIContent.get({ 
            postRef: null, 
            limit: 100 
        });
        
        const data = response?.data || [];
        aiContents.value = data.map(parseAiContentData);

    } catch (err) {
        console.error('Falha ao carregar conteúdos de IA pendentes:', err);
        showNotification('error', err.message || 'Falha ao carregar conteúdos de IA');
        aiContents.value = [];
    }
}

// Função principal para carregar todos os dados
const refreshData = async () => {
    loading.value = true
    error.value = null
    try {
        await Promise.all([
            loadChannels(),
            loadParsers(),
            loadRaws(),
            loadAiContents()
        ])
        buildGraph()
    } catch (err) {
        console.error('Falha ao carregar dados:', err)
        error.value = err.message || 'Falha ao carregar dados'
    } finally {
        loading.value = false
    }
}

const buildGraph = () => {
    const newNodes = [];
    const newEdges = [];
    const savedPositions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');

    const xPos = { channel: 50, parser: 350, raw: 650, ai: 950 };
    const ySpacing = { lane: 50, node: 80 };
    let currentY = 50;

    channels.value.forEach(channel => {
        const laneStartY = currentY;
        let laneMaxY = laneStartY;

        // Adiciona o nó do canal
        const channelNodeId = `channel-${channel.id}`;
        newNodes.push({
            id: channelNodeId,
            type: 'channel',
            position: savedPositions[channelNodeId] || { x: xPos.channel, y: laneStartY },
            data: channel,
        });

        const channelParsers = parsers.value.filter(p => p.channel === channel.id);
        const channelRaws = raws.value.filter(r => r.channel === channel.id);
        
        let lastParserY = laneStartY - ySpacing.node;

        if (channelParsers.length > 0) {
            // Caso 1: Existem parsers para o canal
            channelParsers.forEach(parser => {
                const parserY = lastParserY + ySpacing.node;
                const parserNodeId = `parser-${parser.id}`;
                newNodes.push({
                    id: parserNodeId,
                    type: 'parser',
                    position: savedPositions[parserNodeId] || { x: xPos.parser, y: parserY },
                    data: parser,
                });
                newEdges.push({
                    id: `edge-${channelNodeId}-to-${parserNodeId}`,
                    source: channelNodeId,
                    target: parserNodeId,
                    sourceHandle: 'source-right',
                    targetHandle: 'target-left',
                    type: 'smoothstep'
                });

                const parserRaws = channelRaws.filter(r => r.parsedBy === parser.id);
                let lastRawY = parserY - ySpacing.node;

                if (parserRaws.length > 0) {
                     parserRaws.forEach(raw => {
                        const rawY = lastRawY + ySpacing.node;
                        const rawNodeId = `raw-${raw.id}`;
                        newNodes.push({
                            id: rawNodeId,
                            type: 'raw',
                            position: savedPositions[rawNodeId] || { x: xPos.raw, y: rawY },
                            data: raw,
                        });
                        newEdges.push({
                            id: `edge-${parserNodeId}-to-${rawNodeId}`,
                            source: parserNodeId,
                            target: rawNodeId,
                            sourceHandle: 'source-right',
                            targetHandle: 'target-left',
                            animated: true,
                            type: 'smoothstep'
                        });
                        lastRawY = rawY;
                    });
                    lastParserY = lastRawY;
                } else {
                    lastParserY = parserY;
                }
                laneMaxY = Math.max(laneMaxY, lastParserY);
            });

            const unparsedRaws = channelRaws.filter(r => !r.parsedBy);
            if (unparsedRaws.length > 0) {
                const primaryParserNodeId = `parser-${channelParsers[0].id}`;
                let lastUnparsedRawY = laneMaxY;
                unparsedRaws.forEach(raw => {
                    lastUnparsedRawY += ySpacing.node;
                    const rawNodeId = `raw-${raw.id}`;
                    newNodes.push({
                        id: rawNodeId,
                        type: 'raw',
                        position: savedPositions[rawNodeId] || { x: xPos.raw, y: lastUnparsedRawY },
                        data: raw,
                    });
                    newEdges.push({
                        id: `edge-unparsed-${primaryParserNodeId}-to-${rawNodeId}`,
                        source: primaryParserNodeId,
                        target: rawNodeId,
                        sourceHandle: 'source-right',
                        targetHandle: 'target-left',
                        animated: true,
                        type: 'smoothstep'
                    });
                });
                laneMaxY = Math.max(laneMaxY, lastUnparsedRawY);
            }

        } else {
            // Caso 2: Nenhum parser, conecta raws diretamente ao canal
            let lastDirectRawY = laneStartY - ySpacing.node;
            channelRaws.forEach(raw => {
                lastDirectRawY += ySpacing.node;
                const rawNodeId = `raw-${raw.id}`;
                newNodes.push({
                    id: rawNodeId,
                    type: 'raw',
                    position: savedPositions[rawNodeId] || { x: xPos.raw, y: lastDirectRawY },
                    data: raw,
                });
                newEdges.push({
                    id: `edge-channel-${channel.id}-raw-${raw.id}`,
                    source: `channel-${channel.id}`,
                    target: `raw-${raw.id}`,
                    sourceHandle: 'source-right',
                    targetHandle: 'target-left',
                    type: 'smoothstep'
                });
            });
            laneMaxY = Math.max(laneMaxY, lastDirectRawY);
        }

        // Adiciona nós de AI para os raws existentes
        aiContents.value.forEach(ai => {
            const rawNode = newNodes.find(n => n.id === `raw-${ai.rawId}`);
            if (rawNode) {
                const aiNodeId = `ai-${ai.id}`;
                const position = savedPositions[aiNodeId] || { x: xPos.ai, y: rawNode.position.y };
                
                newNodes.push({
                    id: aiNodeId,
                    type: 'ai-content',
                    position: position,
                    data: { ...ai, rawId: ai.rawId },
                });

                newEdges.push({
                    id: `edge-raw-${ai.rawId}-ai-${ai.id}`,
                    source: `raw-${ai.rawId}`,
                    target: aiNodeId,
                    sourceHandle: 'source-right',
                    targetHandle: 'target-left',
                    type: 'smoothstep',
                    animated: true
                });
            }
        });

        // Centraliza o nó do canal na faixa
        const channelNode = newNodes.find(n => n.id === `channel-${channel.id}`);
        if (channelNode && !savedPositions[channelNode.id]) {
            channelNode.position.y = laneStartY + (laneMaxY - laneStartY) / 2;
        }

        currentY = laneMaxY + ySpacing.lane + ySpacing.node;
    });

    nodes.value = newNodes;
    edges.value = newEdges;
}

const handleNodeEdit = (event) => {
    if (event.type === 'channel') {
        openChannelDialog(event.data);
    } else if (event.type === 'parser') {
        openParserDialog(event.data);
    }
}

const handleViewRaws = (event) => {
    const channelId = event.data.id;
    if (channelId) {
        router.push({ path: '/feed/raw', query: { channel: channelId } });
    }
}

const handleExecuteChannel = async (event) => {
    console.log('handleExecuteChannel event:', event);
    const channelData = event.data;
    if (!channelData || executing.value.has(channelData.id)) return;

    executing.value.add(channelData.id);
    showNotification('info', `Executando canal: ${channelData.name}...`);

    try {
        await feedClient.channels.processFeed(channelData.id);
        showNotification('success', `Canal ${channelData.name} executado. Atualizando dados...`);
        
        // Atraso opcional para dar tempo de ver a notificação antes de recarregar
        setTimeout(() => {
            refreshData(); 
        }, 1500);

    } catch (err) {
        console.error('Falha ao executar canal:', err);
        showNotification('error', err.message || `Falha ao executar o canal ${channelData.name}`);
    } finally {
        // O `refreshData` vai limpar o estado de `executing` implicitamente
        // Mas podemos remover aqui caso o refresh falhe
         executing.value.delete(channelData.id);
    }
}

const handleRejectRaw = async (event) => {
    const rawData = event.data;
    if (!rawData || !rawData.id) {
        showNotification('error', 'Dados inválidos para rejeição.');
        return;
    }
    showNotification('info', `Rejeitando item: ${rawData.title.substring(0, 30)}...`);
    try {
        await feedClient.raw.rejectRaw(rawData.id);
        showNotification('success', 'Item rejeitado com sucesso! Atualizando...');
        await refreshData();
    } catch (err) {
        console.error('Falha ao rejeitar item:', err);
        showNotification('error', err.message || 'Falha ao rejeitar item.');
    }
};

const handleReprocessRaw = async (event) => {
    const rawData = event.data;
    if (!rawData || !rawData.id) {
        showNotification('error', 'Dados inválidos para reprocessamento.');
        return;
    }
    showNotification('info', `Reprocessando item: ${rawData.title.substring(0, 30)}...`);
    try {
        const response = await feedClient.raw.reprocessRaw(rawData.id);
        if (response && response.success) {
            showNotification('success', 'Item reprocessado com sucesso! Atualizando...');
            await refreshData();
        } else {
            throw new Error(response.message || 'Falha ao reprocessar item');
        }
    } catch (err) {
        console.error('Falha ao reprocessar item:', err);
        showNotification('error', err.message || 'Falha ao reprocessar item.');
    }
};

const handleRegenerateAi = async (event) => {
    const aiData = event.data;
    if (!aiData || !aiData.rawId) {
        showNotification('error', 'Dados de IA inválidos para regeneração.');
        return;
    }

    const rawNode = raws.value.find(r => r.id === aiData.rawId);
    if (!rawNode) {
        showNotification('error', 'Item Raw original não encontrado para regeneração.');
        return;
    }

    // 1. Remove o nó de IA antigo
    nodes.value = nodes.value.filter(n => n.id !== `ai-${aiData.id}`);
    edges.value = edges.value.filter(e => e.target !== `ai-${aiData.id}`);
    
    // 2. Remove o conteúdo de IA antigo do array de dados
    aiContents.value = aiContents.value.filter(c => c.id !== aiData.id);

    // 3. Remove a posição do localStorage para evitar que o novo nó apareça no mesmo lugar
    const positions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    delete positions[`ai-${aiData.id}`];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(positions));

    // 4. Inicia a geração de um novo conteúdo de IA para o Raw original
    showNotification('info', `Regerando conteúdo para: ${rawNode.title.substring(0, 20)}...`);
    await handleGenerateAi({ data: rawNode, promptId: 'default' }); // Usando prompt padrão, pode ser ajustado se necessário
};

const handleApproveAi = async (event) => {
    const aiContentData = event.data;
    if (!aiContentData) return;

    try {
        showNotification('info', 'Criando post a partir da versão da IA...');

        const slug = aiContentData.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const sourceAttribution = `
            <p class="source-attribution">
                <strong>Com informações do:</strong> <a href="${aiContentData.link}" target="_blank" rel="noopener noreferrer">${getChannelName(aiContentData.channel)}</a>
            </p>
        `;

        const content = aiContentData.content + sourceAttribution;

        const cleanedTags = (aiContentData.suggestedTags || []).filter(Boolean);
        const cleanedCategories = (aiContentData.suggestedCategories || []).filter(Boolean);

        const suggestedCategoryNames = cleanedCategories.map(c => c.toLowerCase());
        const matchingCategoryIds = categories.value
            .filter(cat => suggestedCategoryNames.includes(cat.name.toLowerCase()))
            .map(cat => cat.id);

        const postData = {
            post: {
                title: aiContentData.title,
                slug: slug,
                content: content,
                status: 'draft',
                excerpt: aiContentData.content.substring(0, 200).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                featureImage: aiContentData.featureImage || null,
                tags: cleanedTags.length > 0 ? cleanedTags : [getChannelName(aiContentData.channel), 'AI Generated'],
                categories: matchingCategoryIds,
            },
            meta: {
                metaTitle: aiContentData.title,
                metacontent: aiContentData.content.substring(0, 155).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                ogTitle: aiContentData.title,
                ogcontent: aiContentData.content.substring(0, 155).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                ogImage: aiContentData.featureImage || null,
                twitterTitle: aiContentData.title,
                twittercontent: aiContentData.content.substring(0, 155).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                twitterImage: aiContentData.featureImage || null,
            }
        };

        const saveResponse = await adminClient.posts.save(postData);

        if (!saveResponse || !saveResponse.id) {
            throw new Error("Falha ao criar o post no sistema.");
        }

        // Atualiza o Raw original
        await feedClient.raw.updateRaw(aiContentData.rawId, { 
            postRef: saveResponse.id,
            status: 'approved' 
        });

        // Atualiza o conteúdo de IA para marcá-lo como usado
        await feedClient.feedAIContent.update(aiContentData.id, {
            postRef: saveResponse.id
        });

        showNotification('success', 'Post criado com sucesso! Atualizando o fluxo...');
        
        // Recarrega todos os dados para refletir o novo estado
        await refreshData();

    } catch (err) {
        console.error('Falha ao aprovar conteúdo de IA:', err);
        showNotification('error', `Falha ao criar post: ${err.message}`);
    }
};

const handlePreview = (event) => {
    console.log("Preview event:", event);
    const item = event.data;
    previewItem.value = null;
    aiContent.value = null;
    aiError.value = null;
    editMode.value = false;
    editedContent.value = null;
    selectedTags.value = [];
    selectedCategories.value = [];

    if (event.type === 'raw') {
        previewItem.value = event.data;
    } else if (event.type === 'ai-content') {
        const originalRaw = raws.value.find(r => r.id === event.data.rawId);
        if (originalRaw) {
            previewItem.value = originalRaw;
            aiContent.value = event.data;
            // Pre-select tags and categories when an existing AI node is clicked
            if (event.data.suggestedTags) {
                selectedTags.value = [...event.data.suggestedTags];
            }
            if (event.data.suggestedCategories) {
                preselectCategories(event.data.suggestedCategories);
            }
        } else {
            showNotification('error', 'Raw original não encontrado para esta versão de IA.');
            return;
        }
    }
    
    showPreview.value = true;
    document.body.style.overflow = 'hidden';
    loadPrompts();
    loadCategories();
};

const closePreview = () => {
    showPreview.value = false;
    document.body.style.overflow = '';
};

const toggleEditMode = () => {
    editMode.value = !editMode.value;
    if (editMode.value && editedContent.value === null && previewItem.value) {
        editedContent.value = previewItem.value.content;
    }
};

const toggleTagSelection = (tag) => {
    const index = selectedTags.value.indexOf(tag);
    if (index !== -1) {
        selectedTags.value.splice(index, 1);
    } else {
        selectedTags.value.push(tag);
    }
};

const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const preselectCategories = (suggested) => {
    if (suggested && suggested.length > 0 && categories.value.length > 0) {
        const suggestedCategoryNames = suggested.map((cat) => cat.toLowerCase());
        const matchingCategoryIds = categories.value
            .filter(category => {
                const systemCategoryNameLower = removeAccents(category.name.toLowerCase());
                const normalizedSuggestedCategories = suggestedCategoryNames.map((sc) => removeAccents(sc));
                return normalizedSuggestedCategories.some(aiSuggest => systemCategoryNameLower.includes(aiSuggest) || aiSuggest.includes(systemCategoryNameLower));
            })
            .map(category => category.id);
        selectedCategories.value = [...new Set([...selectedCategories.value, ...matchingCategoryIds])];
    }
};

const generateAIContentFromPreview = async () => {
    if (!previewItem.value) return;
    
    aiLoading.value = true;
    aiError.value = null;
    
    const contentToProcess = editedContent.value || previewItem.value.content;

    try {
        const jobStartResponse = await feedClient.raw.startAIJob(previewItem.value.id, {
            content: contentToProcess,
            promptId: selectedPrompt.value
        });
        const jobId = jobStartResponse?.jobId;

        if (!jobId) throw new Error('Failed to start AI job');

        const pollJobStatus = async () => {
            try {
                const statusResponse = await feedClient.raw.getAIJobStatus(jobId);
                if (statusResponse.status === 'completed') {
                    const result = statusResponse.result;
                    const parsedResult = parseAiContentData(result);
                    const savedPositions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');

                    const rawNode = nodes.value.find(n => n.id === `raw-${previewItem.value.id}`)
                    if (!rawNode) {
                        throw new Error('Nó de origem (raw) não encontrado no grafo.')
                    }

                    const newAiNode = {
                        id: `ai-${parsedResult.id}`,
                        type: 'ai-content',
                        position: savedPositions[`ai-${parsedResult.id}`] || { x: rawNode.position.x + 300, y: rawNode.position.y },
                        data: { ...parsedResult, rawId: previewItem.value.id },
                    }

                    const newEdge = {
                        id: `edge-raw-${previewItem.value.id}-ai-${parsedResult.id}`,
                        source: `raw-${previewItem.value.id}`,
                        target: `ai-${parsedResult.id}`,
                        type: 'smoothstep',
                        animated: true
                    }

                    nodes.value = [...nodes.value, newAiNode]
                    edges.value = [...edges.value, newEdge]

                    showNotification('success', 'Conteúdo de IA gerado com sucesso!')
                    aiLoading.value = false;

                } else if (statusResponse.status === 'error') {
                    throw new Error(statusResponse.error || 'AI processing failed');
                } else {
                    setTimeout(pollJobStatus, 3000);
                }
            } catch (pollErr) {
                aiLoading.value = false;
                aiError.value = pollErr.message || 'Error checking job status';
            }
        };
        setTimeout(pollJobStatus, 2000);
    } catch (err) {
        aiLoading.value = false;
        aiError.value = err.message || 'Failed to generate AI content';
    } finally {
        loadingCategories.value = false;
    }
};

const loadPrompts = async () => {
    if (promptsList.value.length > 0) return;
    try {
        loadingPrompts.value = true;
        const response = await adminClient.prompts.get({ limit: 1000 });
        if (response && response.data) {
            promptsList.value = response.data || [];
        }
    } catch (err) {
        console.error('Failed to load prompts:', err);
    } finally {
        loadingPrompts.value = false;
    }
};

const loadCategories = async () => {
    if (categories.value.length > 0) return;
    try {
        loadingCategories.value = true;
        const response = await adminClient.categories.get({ limit: 1000 });
        if (response && response.data) {
            categories.value = response.data || [];
        }
    } catch (err) {
        console.error('Failed to load categories:', err);
    } finally {
        loadingCategories.value = false;
    }
};

const handleGenerateAi = async (event) => {
    const rawData = event.data
    const promptId = event.promptId
    if (!rawData || generatingAi.value.has(rawData.id)) return

    generatingAi.value.add(rawData.id)
    showNotification('info', `Iniciando geração de IA para: ${rawData.title.substring(0, 20)}...`)

    try {
        const jobStartResponse = await feedClient.raw.startAIJob(rawData.id, { promptId });
        const jobId = jobStartResponse?.jobId;

        if (!jobId) {
            throw new Error('Falha ao iniciar o job de IA. Nenhum ID de job retornado.');
        }

        const pollJobStatus = async () => {
            try {
                const statusResponse = await feedClient.raw.getAIJobStatus(jobId);

                if (statusResponse.status === 'completed') {
                    const aiContentResult = statusResponse.result;
                    const parsedAiContent = parseAiContentData(aiContentResult);
                    const savedPositions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');

                    const rawNode = nodes.value.find(n => n.id === `raw-${rawData.id}`)
                    if (!rawNode) {
                        throw new Error('Nó de origem (raw) não encontrado no grafo.')
                    }

                    const newAiNode = {
                        id: `ai-${parsedAiContent.id}`,
                        type: 'ai-content',
                        position: savedPositions[`ai-${parsedAiContent.id}`] || { x: rawNode.position.x + 300, y: rawNode.position.y },
                        data: { ...parsedAiContent, rawId: rawData.id },
                    }

                    const newEdge = {
                        id: `edge-raw-${rawData.id}-ai-${parsedAiContent.id}`,
                        source: `raw-${rawData.id}`,
                        target: `ai-${parsedAiContent.id}`,
                        sourceHandle: 'source-right',
                        targetHandle: 'target-left',
                        type: 'smoothstep',
                        animated: true
                    }

                    nodes.value = [...nodes.value, newAiNode]
                    edges.value = [...edges.value, newEdge]

                    showNotification('success', 'Conteúdo de IA gerado com sucesso!')
                    generatingAi.value.delete(rawData.id)

                } else if (statusResponse.status === 'error') {
                    throw new Error(statusResponse.error || 'Job de IA falhou no servidor.');
                } else {
                    setTimeout(pollJobStatus, 3000);
                }
            } catch (pollError) {
                generatingAi.value.delete(rawData.id)
                console.error('Erro ao verificar status do job de IA:', pollError);
                showNotification('error', pollError.message || 'Erro ao verificar o progresso da geração de IA.');
            }
        };

        setTimeout(pollJobStatus, 2000);

    } catch (err) {
        generatingAi.value.delete(rawData.id)
        console.error('Falha ao gerar conteúdo de IA:', err)
        showNotification('error', err.message || 'Falha ao gerar conteúdo de IA')
    }
}

onConnect(async (params) => {
    const { source, target } = params;
    const sourceIsChannel = source.startsWith('channel-');
    const targetIsParser = target.startsWith('parser-');

    if (sourceIsChannel && targetIsParser) {
        const parserId = target.replace('parser-', '');
        const channelId = source.replace('channel-', '');

        try {
            const parserToUpdate = parsers.value.find(p => p.id === parserId);
            if (!parserToUpdate) throw new Error('Parser não encontrado');

            await feedClient.parser.update(parserId, { ...parserToUpdate, channel: channelId });
            
            showNotification('success', 'Parser associado ao canal com sucesso!');
            addEdges([{ ...params, sourceHandle: 'source-right', targetHandle: 'target-left' }]); // Adiciona a aresta visualmente
            await refreshData(); // Recarrega os dados para garantir consistência
        } catch(err) {
            console.error("Falha ao associar parser:", err);
            showNotification('error', err.message || 'Falha ao associar parser ao canal');
        }
    }
});

onNodeDragStop((event) => {
    const { node } = event;
    if (!node.position) return; 

    const positions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    positions[node.id] = { x: node.position.x, y: node.position.y };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(positions));
});

onNodeClick((event) => {
    const node = event.node;
    if (node.type === 'raw') {
        const rawId = node.id.replace('raw-', '');
        if (selectedRaws.value.has(rawId)) {
            selectedRaws.value.delete(rawId);
        } else {
            selectedRaws.value.add(rawId);
        }
    }
});

// Funções para gerenciar diálogos
const openChannelDialog = (channel = null) => {
    if (channel) {
        editMode.value = true
        const intervalHours = channel.intervalUpdate ? Math.floor(channel.intervalUpdate / (1000 * 60 * 60)) : 24
        
        channelForm.value = {
            id: channel.id,
            name: channel.name,
            url: channel.url,
            rss: channel.rss,
            intervalHours: intervalHours,
            active: channel.active === undefined ? true : channel.active,
            requestLink: channel.requestLink === undefined ? false : channel.requestLink
        }
    } else {
        editMode.value = false
        channelForm.value = {
            id: '', name: '', url: '', rss: '',
            intervalHours: 24, active: true, requestLink: false
        }
    }
    showChannelDialog.value = true
}

const closeChannelDialog = () => {
    showChannelDialog.value = false
}

const openParserDialog = (parser = null) => {
    if (parser) {
        editMode.value = true
        parserForm.value = {
            id: parser.id,
            channel: parser.channel,
            title: parser.title || '',
            content: parser.content || '',
            category: parser.category || '',
            featureImage: parser.featureImage || '',
            tags: parser.tags || ''
        }
    } else {
        editMode.value = false
        parserForm.value = {
            id: '', channel: '', title: '', content: '',
            category: '', featureImage: '', tags: ''
        }
    }
    showParserDialog.value = true
}

const closeParserDialog = () => {
    showParserDialog.value = false
}

// Funções para salvar dados
const saveChannel = async () => {
    try {
        if (!channelForm.value.name || !channelForm.value.url || !channelForm.value.rss) {
            showNotification('error', 'Por favor, preencha todos os campos obrigatórios')
            return
        }
        
        const intervalUpdate = channelForm.value.intervalHours * 60 * 60 * 1000
        const channelData = {
            name: channelForm.value.name.trim(),
            url: channelForm.value.url.trim(),
            rss: channelForm.value.rss.trim(),
            intervalUpdate: intervalUpdate,
            active: channelForm.value.active,
            requestLink: channelForm.value.requestLink
        }
        
        if (editMode.value && channelForm.value.id) {
            await feedClient.channels.update(channelForm.value.id, channelData)
            showNotification('success', 'Canal atualizado com sucesso')
        } else {
            await feedClient.channels.insert(channelData)
            showNotification('success', 'Canal criado com sucesso')
        }
        
        closeChannelDialog()
        refreshData()
    } catch (err) {
        console.error('Erro ao salvar canal:', err)
        showNotification('error', err.message || 'Erro ao salvar canal')
    }
}

const saveParser = async () => {
    try {
        if (!parserForm.value.channel || !parserForm.value.title || !parserForm.value.content) {
            showNotification('error', 'Por favor, preencha todos os campos obrigatórios')
            return
        }
        
        const parserData = {
            channel: parserForm.value.channel,
            title: parserForm.value.title.trim(),
            content: parserForm.value.content.trim(),
            category: parserForm.value.category?.trim() || '',
            featureImage: parserForm.value.featureImage?.trim() || '',
            tags: parserForm.value.tags?.trim() || ''
        }
        
        if (editMode.value && parserForm.value.id) {
            await feedClient.parser.update(parserForm.value.id, parserData)
            showNotification('success', 'Parser atualizado com sucesso')
        } else {
            await feedClient.parser.insert(parserData)
            showNotification('success', 'Parser criado com sucesso')
        }
        
        closeParserDialog()
        refreshData()
    } catch (err) {
        console.error('Erro ao salvar parser:', err)
        showNotification('error', err.message || 'Erro ao salvar parser')
    }
}

// Função para mostrar notificações
const showNotification = (type, message) => {
    notification.value = {
        show: true,
        type,
        message,
        duration: 3000
    }
    
    setTimeout(() => {
        notification.value.show = false
    }, notification.value.duration)
}

const categoryExists = (categoryName) => {
    return categories.value.some(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
    );
};

const openCreateCategoryDialog = (suggestedName) => {
    newCategoryForm.value = {
        name: suggestedName,
        slug: generateCategorySlug(suggestedName),
        parentCategory: '',
        active: true,
    };
    showCreateCategoryDialog.value = true;
};

const closeCreateCategoryDialog = () => {
    showCreateCategoryDialog.value = false;
};

const updateCategorySlug = () => {
    newCategoryForm.value.slug = generateCategorySlug(newCategoryForm.value.name);
};

const generateCategorySlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const createCategory = async () => {
    try {
        createCategoryLoading.value = true;
        const categoryData = {
            name: newCategoryForm.value.name.trim(),
            slug: newCategoryForm.value.slug.trim(),
            active: newCategoryForm.value.active,
            parentCategory: newCategoryForm.value.parentCategory || null
        };

        await adminClient.categories.insert(categoryData);
        showNotification('success', 'Category created successfully!');
        closeCreateCategoryDialog();
        
        await loadCategories();
        
        const newCategory = categories.value.find(cat => 
            cat.name.toLowerCase() === categoryData.name.toLowerCase()
        );
        if (newCategory && !selectedCategories.value.includes(newCategory.id)) {
            selectedCategories.value.push(newCategory.id);
        }
        
    } catch (err) {
        showNotification('error', err.message || 'Failed to create category');
    } finally {
        createCategoryLoading.value = false;
    }
};

const handleNodeUpdate = async (channelData) => {
    if (!channelData || !channelData.id) {
        showNotification('error', 'Dados de canal inválidos para atualização.');
        return;
    }

    showNotification('info', `Atualizando canal: ${channelData.name}...`);
    try {
        await feedClient.channels.update(channelData.id, channelData);
        showNotification('success', 'Canal atualizado com sucesso!');
        await refreshData();
    } catch (err) {
        console.error('Falha ao atualizar canal:', err);
        showNotification('error', err.message || 'Falha ao atualizar canal.');
    }
};

const handleClassifySelectedRaws = async () => {
    if (selectedRaws.value.size === 0) return;

    const idsToClassify = Array.from(selectedRaws.value);
    showNotification('info', `Enviando ${idsToClassify.length} itens para classificação...`);

    try {
        await feedClient.raw.classifyRawsWithAI(idsToClassify);
        showNotification('success', 'Classificação concluída! Atualizando dados...');
        
        selectedRaws.value.clear();
        
        setTimeout(() => {
            refreshData();
        }, 1500);

    } catch (err) {
        console.error('Falha ao classificar itens:', err);
        showNotification('error', err.message || 'Falha ao classificar itens selecionados');
    }
};

const handleTestParser = (event) => {
    currentParser.value = event.data;
    parserTestUrl.value = '';
    parserTestResults.value = null;
    showTestParserDialog.value = true;
};

const closeTestParserDialog = () => {
    showTestParserDialog.value = false;
    currentParser.value = null;
};

const testParserWithUrl = async () => {
    if (!currentParser.value || !parserTestUrl.value) return;

    testingParser.value = true;
    parserTestResults.value = null;
    try {
        const response = await feedClient.parser.parseContent(currentParser.value.id, parserTestUrl.value);
        if (response && response.success && response.data) {
            parserTestResults.value = response.data;
            showNotification('success', 'URL testada com sucesso!');
        } else {
            throw new Error(response.message || 'Falha ao testar parser');
        }
    } catch (err) {
        console.error('Falha ao testar parser:', err);
        showNotification('error', err.message || 'Falha ao testar parser');
        parserTestResults.value = { error: err.message };
    } finally {
        testingParser.value = false;
    }
};

const handleDeleteParser = (event) => {
    parserToDelete.value = event.data;
    showDeleteParserDialog.value = true;
};

const confirmDeleteParser = async () => {
    if (!parserToDelete.value) return;

    deletingParser.value = true;
    try {
        await feedClient.parser.delete(parserToDelete.value.id);
        showNotification('success', 'Parser excluído com sucesso!');
        await refreshData();
    } catch (err) {
        console.error('Falha ao excluir parser:', err);
        showNotification('error', err.message || 'Falha ao excluir parser.');
    } finally {
        deletingParser.value = false;
        showDeleteParserDialog.value = false;
        parserToDelete.value = null;
    }
};

const handleUpdateParser = async (parserData) => {
    if (!parserData || !parserData.id) {
        showNotification('error', 'Dados de parser inválidos para atualização.');
        return;
    }
    showNotification('info', 'Salvando parser...');
    try {
        await feedClient.parser.update(parserData.id, parserData);
        showNotification('success', 'Parser salvo com sucesso!');
        await refreshData();
    } catch (err) {
        console.error('Falha ao salvar parser:', err);
        showNotification('error', err.message || 'Falha ao salvar parser.');
    }
};

const getChannelName = (channelId) => {
    const channel = channels.value.find(c => c.id === channelId);
    return channel ? channel.name : 'Fonte Desconhecida';
};

onMounted(async () => {
    loading.value = true;
    error.value = null;
    try {
        await Promise.all([
            loadChannels(),
            loadParsers(),
            loadPrompts(),
            loadCategories(),
            loadRaws(),
            loadAiContents()
        ]);
        buildGraph();
    } catch (err) {
        console.error('Falha ao carregar dados iniciais do fluxo:', err);
        error.value = err.message || 'Falha ao carregar dados iniciais';
    } finally {
        loading.value = false;
    }
});

</script>

<style>
.vue-flow__node-input, .vue-flow__node-default, .vue-flow__node-output {
    padding: 0;
    border-radius: 8px;
    border-width: 0;
    font-size: 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

@keyframes pulse-border-animation {
  0% {
    box-shadow: 0 0 0 0px rgba(59, 130, 246, 0.7);
  }
  100% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

.pulse-border .vue-flow__node-content {
  animation: pulse-border-animation 1.5s infinite;
  border-radius: 8px; /* Correspondente ao border-radius do nó */
}

.prose iframe,
.prose video {
    width: 100%;
    aspect-ratio: 16 / 9;
}

.vue-flow__edge {
    z-index: 10;
}
</style>