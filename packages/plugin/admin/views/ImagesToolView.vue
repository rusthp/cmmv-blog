<template>
    <div class="bg-neutral-900 min-h-screen text-white p-6">
        <div class="max-w-6xl mx-auto">
            <!-- Cabeçalho -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold mb-2">Editor de Imagens</h1>
                <p class="text-neutral-400">Ferramenta avançada para edição de imagens com crop, resize e remoção de objetos.</p>
            </div>

            <!-- Upload inicial ou área de edição -->
            <div v-if="!selectedImage" class="bg-neutral-800 rounded-lg p-12 text-center">
                <div class="max-w-md mx-auto">
                    <div class="mb-8">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h2 class="text-xl font-medium mb-2">Selecione uma imagem para começar</h2>
                        <p class="text-neutral-400 mb-6">Suporta JPG, PNG, WebP, AVIF e GIF.</p>

                        <div class="flex justify-center">
                            <label class="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Escolher imagem
                                <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
                            </label>
                        </div>
                    </div>

                    <div class="border-t border-neutral-700 pt-6">
                        <p class="text-sm text-neutral-500 mb-4">Ou arraste e solte uma imagem abaixo</p>
                        <div
                            class="border-2 border-dashed border-neutral-700 rounded-lg p-8 transition-colors"
                            :class="{ 'border-blue-500 bg-blue-900/20': isDragging }"
                            @dragover.prevent="isDragging = true"
                            @dragleave.prevent="isDragging = false"
                            @drop.prevent="handleDrop"
                        >
                            <p class="text-neutral-400">Solte sua imagem aqui</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Editor de imagem -->
            <div v-else class="flex flex-col">
                <!-- Barra de ferramentas -->
                <div class="bg-neutral-800 rounded-t-lg p-4 border-b border-neutral-700 mb-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-1">
                            <button
                                @click="setActiveTool('crop')"
                                class="p-2 rounded-md transition-colors"
                                :class="activeTool === 'crop' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'"
                                title="Cortar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                                </svg>
                            </button>

                            <button
                                @click="setActiveTool('resize')"
                                class="p-2 rounded-md transition-colors"
                                :class="activeTool === 'resize' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'"
                                title="Redimensionar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </button>

                            <button
                                @click="setActiveTool('erase')"
                                class="p-2 rounded-md transition-colors"
                                :class="activeTool === 'erase' || activeTool === 'eraseBrush' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'"
                                title="Remover objetos"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>

                        <div class="flex items-center space-x-2">
                            <button
                                @click="resetImage"
                                class="px-3 py-1.5 text-sm bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
                            >
                                Resetar
                            </button>

                            <button
                                @click="cancelEdit"
                                class="px-3 py-1.5 text-sm bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
                            >
                                Cancelar
                            </button>

                            <button
                                @click="applyChanges"
                                class="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded transition-colors"
                                :disabled="isProcessing"
                            >
                                <span v-if="isProcessing" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processando...
                                </span>
                                <span v-else>Aplicar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Área de edição principal -->
                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Painel de ferramentas lateral -->
                    <div class="w-full lg:w-64 bg-neutral-800 rounded-lg p-4 h-fit">
                        <h3 class="font-medium text-lg mb-4">{{ getToolTitle }}</h3>

                        <!-- Controles de crop -->
                        <div v-if="activeTool === 'crop'" class="space-y-4">
                            <p class="text-neutral-400 text-sm mb-4">Selecione a área que deseja cortar na imagem.</p>

                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <label class="text-sm text-neutral-400">X:</label>
                                    <span class="text-sm">{{ Math.round(cropParams.left) }}px</span>
                                </div>
                                <input
                                    type="range"
                                    v-model.number="cropParams.left"
                                    :max="imageInfo.width - cropParams.width"
                                    min="0"
                                    class="w-full"
                                />
                            </div>

                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <label class="text-sm text-neutral-400">Y:</label>
                                    <span class="text-sm">{{ Math.round(cropParams.top) }}px</span>
                                </div>
                                <input
                                    type="range"
                                    v-model.number="cropParams.top"
                                    :max="imageInfo.height - cropParams.height"
                                    min="0"
                                    class="w-full"
                                />
                            </div>

                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <label class="text-sm text-neutral-400">Largura:</label>
                                    <span class="text-sm">{{ Math.round(cropParams.width) }}px</span>
                                </div>
                                <input
                                    type="range"
                                    v-model.number="cropParams.width"
                                    :max="imageInfo.width - cropParams.left"
                                    min="10"
                                    class="w-full"
                                />
                            </div>

                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <label class="text-sm text-neutral-400">Altura:</label>
                                    <span class="text-sm">{{ Math.round(cropParams.height) }}px</span>
                                </div>
                                <input
                                    type="range"
                                    v-model.number="cropParams.height"
                                    :max="imageInfo.height - cropParams.top"
                                    min="10"
                                    class="w-full"
                                />
                            </div>
                        </div>

                        <!-- Controles de resize -->
                        <div v-if="activeTool === 'resize'" class="space-y-4">
                            <p class="text-neutral-400 text-sm mb-4">Defina o novo tamanho para a imagem.</p>

                            <div>
                                <label class="block text-sm text-neutral-400 mb-1">Largura:</label>
                                <div class="flex items-center">
                                    <input
                                        type="number"
                                        v-model.number="resizeParams.width"
                                        min="1"
                                        max="2000"
                                        class="w-full px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span class="ml-2 text-sm text-neutral-400">px</span>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm text-neutral-400 mb-1">Altura:</label>
                                <div class="flex items-center">
                                    <input
                                        type="number"
                                        v-model.number="resizeParams.height"
                                        min="1"
                                        max="2000"
                                        class="w-full px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span class="ml-2 text-sm text-neutral-400">px</span>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm text-neutral-400 mb-1">Método de ajuste:</label>
                                <select
                                    v-model="resizeParams.fit"
                                    class="w-full px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="cover">Cover (Cobrir)</option>
                                    <option value="contain">Contain (Conter)</option>
                                    <option value="fill">Fill (Preencher)</option>
                                    <option value="inside">Inside (Interior)</option>
                                    <option value="outside">Outside (Exterior)</option>
                                </select>
                            </div>

                            <div class="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    id="maintain-ratio"
                                    v-model="maintainAspectRatio"
                                    class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                />
                                <label for="maintain-ratio" class="ml-2 block text-sm text-neutral-400">
                                    Manter proporção
                                </label>
                            </div>
                        </div>

                        <!-- Controles de erase -->
                        <div v-if="activeTool === 'erase' || activeTool === 'eraseBrush'" class="space-y-4">
                            <div class="flex justify-between items-center mb-4">
                                <p class="text-neutral-400 text-sm">Selecione o modo de remoção:</p>

                                <div class="flex space-x-2">
                                    <button
                                        @click="setActiveTool('erase')"
                                        class="px-2 py-1 text-xs rounded transition-colors"
                                        :class="activeTool === 'erase' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
                                    >
                                        Área
                                    </button>
                                    <button
                                        @click="setActiveTool('eraseBrush')"
                                        class="px-2 py-1 text-xs rounded transition-colors"
                                        :class="activeTool === 'eraseBrush' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
                                    >
                                        Pincel
                                    </button>
                                </div>
                            </div>

                            <!-- Controles de área retangular -->
                            <div v-if="activeTool === 'erase'">
                                <p class="text-neutral-400 text-sm mb-4">Selecione a área que contém algo que você deseja remover da imagem.</p>

                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <label class="text-sm text-neutral-400">X:</label>
                                        <span class="text-sm">{{ Math.round(eraseParams.left) }}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        v-model.number="eraseParams.left"
                                        :max="imageInfo.width - eraseParams.width"
                                        min="0"
                                        class="w-full"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <label class="text-sm text-neutral-400">Y:</label>
                                        <span class="text-sm">{{ Math.round(eraseParams.top) }}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        v-model.number="eraseParams.top"
                                        :max="imageInfo.height - eraseParams.height"
                                        min="0"
                                        class="w-full"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <label class="text-sm text-neutral-400">Largura:</label>
                                        <span class="text-sm">{{ Math.round(eraseParams.width) }}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        v-model.number="eraseParams.width"
                                        :max="imageInfo.width - eraseParams.left"
                                        min="10"
                                        class="w-full"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <label class="text-sm text-neutral-400">Altura:</label>
                                        <span class="text-sm">{{ Math.round(eraseParams.height) }}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        v-model.number="eraseParams.height"
                                        :max="imageInfo.height - eraseParams.top"
                                        min="10"
                                        class="w-full"
                                    />
                                </div>
                            </div>

                            <!-- Controles do pincel -->
                            <div v-if="activeTool === 'eraseBrush'">
                                <p class="text-neutral-400 text-sm mb-4">Use o pincel para marcar as áreas que deseja remover.</p>

                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <label class="text-sm text-neutral-400">Tamanho do pincel:</label>
                                        <span class="text-sm">{{ eraseBrushSize }}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        v-model.number="eraseBrushSize"
                                        min="5"
                                        max="100"
                                        class="w-full"
                                    />
                                </div>

                                <div class="mt-4 flex space-x-2">
                                    <button
                                        @click="clearMask"
                                        class="px-3 py-1.5 text-sm bg-neutral-700 hover:bg-neutral-600 rounded transition-colors flex-1"
                                    >
                                        Limpar
                                    </button>
                                    <button
                                        @click="toggleEraseMode"
                                        class="px-3 py-1.5 text-sm rounded transition-colors flex-1"
                                        :class="eraseModeIsAdd ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
                                    >
                                        {{ eraseModeIsAdd ? 'Pintar Área' : 'Borracha' }}
                                    </button>
                                </div>
                            </div>

                            <div class="mt-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md text-sm text-yellow-200">
                                <p>A função de remoção utiliza IA para preencher a área selecionada inteligentemente preservando o fundo.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Visualização da imagem -->
                    <div class="flex-1 bg-neutral-800 rounded-lg overflow-hidden relative">
                        <div class="absolute inset-0 bg-neutral-900 bg-opacity-50 flex items-center justify-center z-10" v-if="isProcessing">
                            <div class="flex flex-col items-center">
                                <svg class="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p class="text-white text-lg">Processando imagem...</p>
                            </div>
                        </div>

                        <div class="relative overflow-auto max-h-[600px] p-4 flex justify-center" ref="imageContainer">
                            <div class="relative inline-block">
                                <img :src="displayImage" ref="imageElement" class="max-w-full h-auto" />

                                <!-- Overlay de recorte -->
                                <div
                                    v-if="activeTool === 'crop'"
                                    class="absolute inset-0"
                                    @mousedown="startDrag"
                                    @mousemove="onDrag"
                                    @mouseup="stopDrag"
                                    @mouseleave="stopDrag"
                                >
                                    <!-- Overlay de escurecimento -->
                                    <div class="absolute inset-0 bg-black bg-opacity-50"></div>

                                    <!-- Área de corte -->
                                    <div
                                        class="absolute border-2 border-blue-500 bg-transparent cursor-move"
                                        :style="{
                                            left: `${cropParams.left}px`,
                                            top: `${cropParams.top}px`,
                                            width: `${cropParams.width}px`,
                                            height: `${cropParams.height}px`
                                        }"
                                    >
                                        <!-- Pontos de redimensionamento -->
                                        <div class="absolute w-3 h-3 bg-blue-500 rounded-full top-0 left-0 cursor-nw-resize"></div>
                                        <div class="absolute w-3 h-3 bg-blue-500 rounded-full top-0 right-0 cursor-ne-resize"></div>
                                        <div class="absolute w-3 h-3 bg-blue-500 rounded-full bottom-0 left-0 cursor-sw-resize"></div>
                                        <div class="absolute w-3 h-3 bg-blue-500 rounded-full bottom-0 right-0 cursor-se-resize"></div>
                                    </div>
                                </div>

                                <!-- Overlay de erase -->
                                <div
                                    v-if="activeTool === 'erase'"
                                    class="absolute inset-0"
                                    @mousedown="startDrag"
                                    @mousemove="onDrag"
                                    @mouseup="stopDrag"
                                    @mouseleave="stopDrag"
                                >
                                    <!-- Área de remoção -->
                                    <div
                                        class="absolute border-2 border-red-500 bg-red-500 bg-opacity-30 cursor-move"
                                        :style="{
                                            left: `${eraseParams.left}px`,
                                            top: `${eraseParams.top}px`,
                                            width: `${eraseParams.width}px`,
                                            height: `${eraseParams.height}px`
                                        }"
                                    >
                                        <!-- Pontos de redimensionamento -->
                                        <div class="absolute w-3 h-3 bg-red-500 rounded-full top-0 left-0 cursor-nw-resize"></div>
                                        <div class="absolute w-3 h-3 bg-red-500 rounded-full top-0 right-0 cursor-ne-resize"></div>
                                        <div class="absolute w-3 h-3 bg-red-500 rounded-full bottom-0 left-0 cursor-sw-resize"></div>
                                        <div class="absolute w-3 h-3 bg-red-500 rounded-full bottom-0 right-0 cursor-se-resize"></div>
                                    </div>
                                </div>

                                <!-- Canvas de máscara para o modo pincel -->
                                <canvas
                                    v-if="activeTool === 'eraseBrush'"
                                    ref="maskCanvas"
                                    class="absolute inset-0 cursor-crosshair"
                                    @mousedown="startPainting"
                                    @mousemove="paint"
                                    @mouseup="stopPainting"
                                    @mouseleave="stopPainting"
                                    @touchstart="startPaintingTouch"
                                    @touchmove="paintTouch"
                                    @touchend="stopPainting"
                                    @touchcancel="stopPainting"
                                ></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notificação de sucesso ou erro -->
        <div
            v-if="notification.show"
            class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform"
            :class="{
                'bg-green-700': notification.type === 'success',
                'bg-red-700': notification.type === 'error',
                'translate-y-0 opacity-100': notification.show,
                'translate-y-10 opacity-0': !notification.show
            }"
        >
            <div class="flex items-center">
                <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span class="text-white">{{ notification.message }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useAdminClient } from '../client';

const adminClient = useAdminClient();

const selectedImage = ref<File | null>(null);
const originalImageDataUrl = ref<string>('');
const processedImageDataUrl = ref<string>('');
const isDragging = ref(false);
const isProcessing = ref(false);

const imageInfo = reactive({
    width: 0,
    height: 0
});

const activeTool = ref<'crop' | 'resize' | 'erase' | 'eraseBrush'>('crop');
const imageElement = ref<HTMLImageElement | null>(null);
const imageContainer = ref<HTMLDivElement | null>(null);
const maskCanvas = ref<HTMLCanvasElement | null>(null);

const cropParams = reactive({
    left: 0,
    top: 0,
    width: 300,
    height: 200,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
});

const resizeParams = reactive({
    width: 800,
    height: 600,
    fit: 'cover'
});

const eraseParams = reactive({
    left: 50,
    top: 50,
    width: 100,
    height: 100,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
});

const eraseBrushSize = ref(20);
const isPainting = ref(false);
const lastPaintPos = reactive({ x: 0, y: 0 });
const eraseModeIsAdd = ref(true);

const maintainAspectRatio = ref(true);
const originalAspectRatio = ref(1.33);

const notification = reactive({
    show: false,
    type: 'success',
    message: ''
});

const displayImage = computed(() => {
    return processedImageDataUrl.value || originalImageDataUrl.value;
});

const getToolTitle = computed(() => {
    switch(activeTool.value) {
        case 'crop': return 'Cortar Imagem';
        case 'resize': return 'Redimensionar';
        case 'erase': return 'Remover Objetos (Área)';
        case 'eraseBrush': return 'Remover Objetos (Pincel)';
        default: return 'Editar Imagem';
    }
});

// Métodos
function setActiveTool(tool: 'crop' | 'resize' | 'erase' | 'eraseBrush') {
    activeTool.value = tool;

    if (tool === 'eraseBrush') {
        nextTick(() => {
            initMaskCanvas();
        });
    }
}

async function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
        selectedImage.value = input.files[0];
        await loadImage(selectedImage.value);
    }
}

async function handleDrop(event: DragEvent) {
    isDragging.value = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        selectedImage.value = event.dataTransfer.files[0];
        await loadImage(selectedImage.value);
    }
}

async function loadImage(file: File) {
    if (!file.type.startsWith('image/')) {
        showNotification('error', 'O arquivo selecionado não é uma imagem válida');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
            originalImageDataUrl.value = e.target.result;
            processedImageDataUrl.value = '';

            const img = new Image();
            img.onload = () => {
                imageInfo.width = img.width;
                imageInfo.height = img.height;
                originalAspectRatio.value = img.width / img.height;

                initEditParams();
            };
            img.src = e.target.result;
        }
    };

    reader.readAsDataURL(file);
}

function initEditParams() {
    cropParams.left = Math.max(0, (imageInfo.width - 300) / 2);
    cropParams.top = Math.max(0, (imageInfo.height - 200) / 2);
    cropParams.width = Math.min(300, imageInfo.width);
    cropParams.height = Math.min(200, imageInfo.height);

    resizeParams.width = imageInfo.width;
    resizeParams.height = imageInfo.height;

    eraseParams.left = Math.max(0, (imageInfo.width - 100) / 2);
    eraseParams.top = Math.max(0, (imageInfo.height - 100) / 2);
    eraseParams.width = Math.min(100, imageInfo.width);
    eraseParams.height = Math.min(100, imageInfo.height);
}

function startDrag(event: MouseEvent) {
    if (activeTool.value === 'crop') {
        cropParams.isDragging = true;
        cropParams.dragStartX = event.clientX;
        cropParams.dragStartY = event.clientY;
    } else if (activeTool.value === 'erase') {
        eraseParams.isDragging = true;
        eraseParams.dragStartX = event.clientX;
        eraseParams.dragStartY = event.clientY;
    }
}

function onDrag(event: MouseEvent) {
    if (activeTool.value === 'crop' && cropParams.isDragging) {
        const deltaX = event.clientX - cropParams.dragStartX;
        const deltaY = event.clientY - cropParams.dragStartY;

        cropParams.left = Math.max(0, Math.min(imageInfo.width - cropParams.width, cropParams.left + deltaX));
        cropParams.top = Math.max(0, Math.min(imageInfo.height - cropParams.height, cropParams.top + deltaY));

        cropParams.dragStartX = event.clientX;
        cropParams.dragStartY = event.clientY;
    } else if (activeTool.value === 'erase' && eraseParams.isDragging) {
        const deltaX = event.clientX - eraseParams.dragStartX;
        const deltaY = event.clientY - eraseParams.dragStartY;

        eraseParams.left = Math.max(0, Math.min(imageInfo.width - eraseParams.width, eraseParams.left + deltaX));
        eraseParams.top = Math.max(0, Math.min(imageInfo.height - eraseParams.height, eraseParams.top + deltaY));

        eraseParams.dragStartX = event.clientX;
        eraseParams.dragStartY = event.clientY;
    }
}

function stopDrag() {
    if (activeTool.value === 'crop') {
        cropParams.isDragging = false;
    } else if (activeTool.value === 'erase') {
        eraseParams.isDragging = false;
    }
}

function initMaskCanvas() {
    if (!maskCanvas.value || !imageElement.value) return;

    const canvas = maskCanvas.value;
    const img = imageElement.value;

    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = `${img.clientWidth}px`;
    canvas.style.height = `${img.clientHeight}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }
}

function startPainting(event: MouseEvent) {
    if (activeTool.value !== 'eraseBrush' || !maskCanvas.value) return;

    isPainting.value = true;

    const { offsetX, offsetY } = calculateCanvasOffset(event);
    lastPaintPos.x = offsetX;
    lastPaintPos.y = offsetY;

    paint(event);
}

function startPaintingTouch(event: TouchEvent) {
    if (activeTool.value !== 'eraseBrush' || !maskCanvas.value) return;

    event.preventDefault();
    isPainting.value = true;

    const touch = event.touches[0];
    const { offsetX, offsetY } = calculateCanvasTouchOffset(touch);
    lastPaintPos.x = offsetX;
    lastPaintPos.y = offsetY;

    paintTouch(event);
}

function paint(event: MouseEvent) {
    if (!isPainting.value || !maskCanvas.value) return;

    const canvas = maskCanvas.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = calculateCanvasOffset(event);

    ctx.beginPath();
    ctx.strokeStyle = eraseModeIsAdd ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
    ctx.fillStyle = eraseModeIsAdd ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = eraseBrushSize.value;

    ctx.moveTo(lastPaintPos.x, lastPaintPos.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, eraseBrushSize.value / 2, 0, Math.PI * 2);
    ctx.fill();

    lastPaintPos.x = offsetX;
    lastPaintPos.y = offsetY;
}

function paintTouch(event: TouchEvent) {
    if (!isPainting.value || !maskCanvas.value) return;

    event.preventDefault();
    const touch = event.touches[0];
    const { offsetX, offsetY } = calculateCanvasTouchOffset(touch);

    const canvas = maskCanvas.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = eraseModeIsAdd ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
    ctx.fillStyle = eraseModeIsAdd ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = eraseBrushSize.value;

    ctx.moveTo(lastPaintPos.x, lastPaintPos.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(offsetX, offsetY, eraseBrushSize.value / 2, 0, Math.PI * 2);
    ctx.fill();

    lastPaintPos.x = offsetX;
    lastPaintPos.y = offsetY;
}

function stopPainting() {
    isPainting.value = false;
}

function calculateCanvasOffset(event: MouseEvent): { offsetX: number, offsetY: number } {
    if (!maskCanvas.value) return { offsetX: 0, offsetY: 0 };

    const canvas = maskCanvas.value;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        offsetX: (event.clientX - rect.left) * scaleX,
        offsetY: (event.clientY - rect.top) * scaleY
    };
}

function calculateCanvasTouchOffset(touch: Touch): { offsetX: number, offsetY: number } {
    if (!maskCanvas.value) return { offsetX: 0, offsetY: 0 };

    const canvas = maskCanvas.value;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        offsetX: (touch.clientX - rect.left) * scaleX,
        offsetY: (touch.clientY - rect.top) * scaleY
    };
}

function clearMask() {
    if (!maskCanvas.value) return;

    const canvas = maskCanvas.value;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function toggleEraseMode() {
    eraseModeIsAdd.value = !eraseModeIsAdd.value;
}

function getMaskAsBase64(): string {
    if (!maskCanvas.value) return '';

    return maskCanvas.value.toDataURL('image/png');
}

watch(() => resizeParams.width, (newWidth) => {
    if (maintainAspectRatio.value && originalAspectRatio.value > 0) {
        resizeParams.height = Math.round(newWidth / originalAspectRatio.value);
    }
});

watch(() => resizeParams.height, (newHeight) => {
    if (maintainAspectRatio.value && originalAspectRatio.value > 0) {
        resizeParams.width = Math.round(newHeight * originalAspectRatio.value);
    }
});

async function applyChanges() {
    if (!selectedImage.value) return;

    isProcessing.value = true;

    try {
        let result;

        switch (activeTool.value) {
            case 'crop':
                result = await adminClient.images.crop(selectedImage.value, {
                    left: Math.round(cropParams.left),
                    top: Math.round(cropParams.top),
                    width: Math.round(cropParams.width),
                    height: Math.round(cropParams.height)
                });
                break;

            case 'resize':
                result = await adminClient.images.resize(selectedImage.value, {
                    width: resizeParams.width,
                    height: resizeParams.height,
                    fit: resizeParams.fit
                });
                break;

            case 'erase':
                result = await adminClient.images.erase(selectedImage.value, {
                    left: Math.round(eraseParams.left),
                    top: Math.round(eraseParams.top),
                    width: Math.round(eraseParams.width),
                    height: Math.round(eraseParams.height)
                });
                break;

            case 'eraseBrush':
                // Enviar a imagem original e a máscara como base64
                const imageBase64 = originalImageDataUrl.value;
                const maskBase64 = getMaskAsBase64();

                if (!maskBase64) {
                    throw new Error('Nenhuma área foi selecionada para remoção');
                }

                result = await adminClient.images.erase(selectedImage.value, {
                    left: 0,
                    top: 0,
                    width: imageInfo.width,
                    height: imageInfo.height
                });
            break;
        }

        if (result && result.success && result.processedImage) {
            processedImageDataUrl.value = result.processedImage;

            // Atualizar dimensões da imagem após processamento
            const img = new Image();
            img.onload = () => {
                imageInfo.width = img.width;
                imageInfo.height = img.height;
                originalAspectRatio.value = img.width / img.height;

                // Atualizar o arquivo de imagem para futuras operações
                createFileFromDataURL(result.processedImage).then(file => {
                    if (file) {
                        selectedImage.value = file;

                        // Se estiver usando o pincel, reinicialize o canvas
                        if (activeTool.value === 'eraseBrush') {
                            nextTick(() => {
                                clearMask();
                                initMaskCanvas();
                            });
                        }
                    }
                });
            };
            img.src = result.processedImage;

            showNotification('success', 'Imagem processada com sucesso');
        } else {
            throw new Error('Falha ao processar a imagem');
        }
    } catch (error) {
        console.error('Erro ao processar a imagem:', error);
        showNotification('error', 'Erro ao processar a imagem. Tente novamente.');
    } finally {
        isProcessing.value = false;
    }
}

async function createFileFromDataURL(dataUrl: string): Promise<File | null> {
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fileName = selectedImage.value?.name || 'image.jpg';
        const mimeType = dataUrl.split(';')[0].split(':')[1];

        return new File([blob], fileName, { type: mimeType });
    } catch (error) {
        console.error('Erro ao criar arquivo a partir do DataURL:', error);
        return null;
    }
}

function resetImage() {
    processedImageDataUrl.value = '';

    if (selectedImage.value) {
        loadImage(selectedImage.value);
    }

    showNotification('success', 'Imagem resetada com sucesso');
}

function cancelEdit() {
    selectedImage.value = null;
    originalImageDataUrl.value = '';
    processedImageDataUrl.value = '';
    activeTool.value = 'crop';
}

function showNotification(type: 'success' | 'error', message: string) {
    notification.type = type;
    notification.message = message;
    notification.show = true;

    setTimeout(() => {
        notification.show = false;
    }, 3000);
}

// Ajustar o canvas de máscara quando o tamanho da janela mudar
watch([displayImage], () => {
    if (activeTool.value === 'eraseBrush') {
        nextTick(() => {
            initMaskCanvas();
        });
    }
});

// Garantir que o canvas seja reinicializado quando a ferramenta mudar
watch(activeTool, (newTool) => {
    if (newTool === 'eraseBrush') {
        nextTick(() => {
            initMaskCanvas();
        });
    }
});
</script>

<style scoped>
input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    background: #4B5563;
    border-radius: 3px;
    outline: none;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #3B82F6;
    border-radius: 50%;
    cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #3B82F6;
    border-radius: 50%;
    cursor: pointer;
}
</style>
