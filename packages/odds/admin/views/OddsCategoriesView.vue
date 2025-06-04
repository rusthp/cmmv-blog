<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Categories</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span v-if="refreshing">
                        <svg class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Refreshing...
                    </span>
                    <span v-else>Refresh</span>
                </button>
                <!-- Search button with dropdown -->
                <div class="relative">
                    <button @click="toggleSearchDropdown" data-search-toggle
                        class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center relative">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                        <!-- Indicator dot for active search -->
                        <span
                            v-if="filters.search.trim()"
                            class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full"
                            title="Search filter active">
                        </span>
                    </button>
                    <!-- Search dropdown -->
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-2">
                            <div class="relative">
                                <input
                                    v-model="filters.search"
                                    type="text"
                                    placeholder="Search categories..."
                                    class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    @keydown.esc="showSearchDropdown = false"
                                    ref="searchInput"
                                >
                                <!-- Clear button -->
                                <button
                                    v-if="filters.search.trim()"
                                    @click="clearSearch"
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
                                    title="Clear search">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div>
                                <label class="block text-xs text-neutral-400 mb-1">Search in field:</label>
                                <select
                                    v-model="filters.searchField"
                                    class="bg-neutral-700 w-full h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="name">Name</option>
                                    <option value="index">Index</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Category
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading categories...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load categories</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="categories.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p class="text-neutral-300 mb-2">No categories found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first category</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Category
            </button>
        </div>

        <!-- Categories table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-20">
                                Image
                            </th>
                            <th
                                @click="toggleSort('name')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Name
                                <span v-if="filters.sortBy === 'name'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('index')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Index
                                <span v-if="filters.sortBy === 'index'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="category in categories" :key="category.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="category.id">
                                {{ category.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <div class="flex items-center justify-center w-12 h-12">
                                    <img
                                        v-if="category.image"
                                        :src="category.image"
                                        :alt="`${category.name} image`"
                                        class="w-4 h-4 object-cover rounded border border-neutral-600"
                                        @error="handleImageError"
                                    >
                                    <div v-else class="w-4 h-4 bg-neutral-600 rounded border border-neutral-600 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ category.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">
                                {{ category.index !== null && category.index !== undefined ? category.index : '-' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(category)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(category)"
                                        title="Delete"
                                        class="text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <Pagination
            :pagination="pagination"
            itemName="categories"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Category Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Category' : 'Add Category' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="p-6">
                    <form @submit.prevent="saveCategory">
                        <div class="space-y-4">
                            <div class="mb-4">
                                <label for="categoryName" class="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                                <input
                                    id="categoryName"
                                    v-model="categoryForm.name"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Category name"
                                    required
                                />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="categoryIndex" class="block text-sm font-medium text-neutral-300 mb-1">Index (optional)</label>
                                <input
                                    id="categoryIndex"
                                    v-model.number="categoryForm.index"
                                    type="number"
                                    min="0"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Display order (0, 1, 2...)"
                                />
                                <p class="mt-1 text-sm text-neutral-500">Lower numbers appear first</p>
                                <p v-if="formErrors.index" class="mt-1 text-sm text-red-500">{{ formErrors.index }}</p>
                            </div>

                            <div v-if="isEditing" class="mb-4">
                                <label class="block text-sm font-medium text-neutral-300 mb-2">Image (optional)</label>

                                <!-- Image source selection tabs -->
                                <div class="flex mb-3 border-b border-neutral-600">
                                    <button
                                        type="button"
                                        @click="imageSourceType = 'upload'"
                                        :class="[
                                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                                            imageSourceType === 'upload'
                                                ? 'border-blue-500 text-blue-400'
                                                : 'border-transparent text-neutral-400 hover:text-neutral-200'
                                        ]"
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        type="button"
                                        @click="imageSourceType = 'url'"
                                        :class="[
                                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                                            imageSourceType === 'url'
                                                ? 'border-blue-500 text-blue-400'
                                                : 'border-transparent text-neutral-400 hover:text-neutral-200'
                                        ]"
                                    >
                                        From URL
                                    </button>
                                </div>

                                <!-- Upload file section -->
                                <div v-if="imageSourceType === 'upload'" class="space-y-3">
                                    <div class="relative">
                                        <input
                                            ref="fileInput"
                                            type="file"
                                            accept="image/*"
                                            @change="handleFileSelect"
                                            class="hidden"
                                        />
                                        <button
                                            type="button"
                                            @click="$refs.fileInput.click()"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white hover:bg-neutral-600 transition-colors flex items-center justify-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            {{ selectedFile ? selectedFile.name : 'Choose image file' }}
                                        </button>
                                    </div>

                                    <!-- File preview -->
                                    <div v-if="selectedFile && filePreviewUrl" class="mt-2">
                                        <p class="text-xs text-neutral-400 mb-2">Selected file preview:</p>
                                        <img
                                            :src="filePreviewUrl"
                                            :alt="selectedFile.name"
                                            class="w-16 h-16 object-cover rounded border border-neutral-600"
                                        >
                                        <p class="text-xs text-green-400 mt-1">✓ Image loaded successfully</p>
                                    </div>
                                </div>

                                <!-- URL section -->
                                <div v-if="imageSourceType === 'url'" class="space-y-3">
                                    <input
                                        id="categoryImage"
                                        v-model="categoryForm.imageUrl"
                                        type="url"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    <p class="text-sm text-neutral-500">Enter image URL to import and process</p>

                                    <!-- Import button for URL processing -->
                                    <div v-if="categoryForm.imageUrl.trim()" class="mt-2">
                                        <button
                                            type="button"
                                            @click="processImage"
                                            :disabled="processingImage"
                                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md transition-colors flex items-center"
                                        >
                                            <span v-if="processingImage" class="flex items-center">
                                                <svg class="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </span>
                                            <span v-else>Import & Process Image</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Current processed image preview -->
                                <div v-if="categoryForm.image" class="mt-4 p-3 bg-neutral-700 rounded-md">
                                    <div class="flex items-center justify-between mb-2">
                                        <p class="text-xs text-neutral-300 font-medium">Current image:</p>
                                        <button
                                            type="button"
                                            @click="removeImage"
                                            class="text-red-400 hover:text-red-300 text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <img
                                        :src="categoryForm.image"
                                        :alt="`${categoryForm.name} image`"
                                        class="w-20 h-20 object-cover rounded border border-neutral-600"
                                        @error="handleImageError"
                                    >
                                </div>

                                <p v-if="formErrors.image" class="mt-1 text-sm text-red-500">{{ formErrors.image }}</p>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                @click="closeDialog"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                :disabled="formLoading"
                            >
                                <span v-if="formLoading" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                                <span v-else>
                                    {{ isEditing ? 'Update' : 'Create' }}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="categoryToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the category"
            warning-text="This action cannot be undone. All data associated with this category may be affected."
            loading-text="Deleting..."
            @confirm="deleteCategory"
            @cancel="closeDeleteDialog"
        />

        <!-- Toast notifications -->
        <ToastNotification
            :show="notification.show"
            :message="notification.message"
            :type="notification.type"
            :duration="notification.duration"
            @close="notification.show = false"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useOddsClient } from '../client'
import { useAdminClient } from '@cmmv/blog/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const oddsClient = useOddsClient()
const adminClient = useAdminClient()

const categories = ref([])
const loading = ref(true)
const error = ref(null)
const refreshing = ref(false)

const showDialog = ref(false)
const isEditing = ref(false)
const categoryForm = ref({
    name: '',
    index: null,
    image: '',
    imageUrl: '' // temporary field for URL input
})
const categoryToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)
const processingImage = ref(false)

const showDeleteDialog = ref(false)
const categoryToDelete = ref(null)
const deleteLoading = ref(false)

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

const pagination = ref({
    current: 1,
    lastPage: 1,
    perPage: 50,
    total: 0,
    from: 1,
    to: 50
})

const filters = ref({
    search: '',
    searchField: 'name',
    sortBy: 'index',
    sortOrder: 'asc',
    page: 1
})

const showSearchDropdown = ref(false)
const searchInput = ref(null)

const imageSourceType = ref('upload')
const selectedFile = ref(null)
const filePreviewUrl = ref(null)

function toggleSearchDropdown() {
    showSearchDropdown.value = !showSearchDropdown.value

    if (showSearchDropdown.value) {
        nextTick(() => {
            searchInput.value?.focus()
        })
    }
}

function clearSearch() {
    filters.value.search = ''
    filters.value.page = 1
    loadCategories()
    showSearchDropdown.value = false
}

const loadCategories = async () => {
    try {
        loading.value = true
        error.value = null

        const apiFilters = {
            limit: pagination.value.perPage.toString(),
            offset: ((filters.value.page - 1) * pagination.value.perPage).toString(),
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder,
        }

        if (filters.value.search) {
            apiFilters.search = filters.value.search
            apiFilters.searchField = filters.value.searchField
        }

        // Using the odds categories client
        const response = await oddsClient.categories.get(apiFilters)

        if (response && response.data) {
            categories.value = response.data || []

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 50;

            // Calculate current page from offset and limit
            const currentPage = Math.floor(currentOffset / currentLimit) + 1
            const lastPage = Math.ceil(totalCount / currentLimit)

            pagination.value = {
                current: currentPage,
                lastPage: lastPage,
                perPage: currentLimit,
                total: totalCount,
                from: currentOffset + 1,
                to: Math.min(currentOffset + currentLimit, totalCount)
            }
        } else {
            categories.value = []
            // Reset pagination if data format is unexpected
            pagination.value = {
                current: 1,
                lastPage: 1,
                perPage: 50,
                total: 0,
                from: 0,
                to: 0
            }
        }

        loading.value = false
    } catch (err) {
        console.error('Failed to load categories:', err)
        loading.value = false
        error.value = err.message || 'Failed to load categories'
        showNotification('error', 'Failed to load categories')
    }
}

// Refresh data
const refreshData = async () => {
    if (refreshing.value) return

    refreshing.value = true
    await loadCategories()
    refreshing.value = false
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadCategories()
}, { deep: true })

// Dialog methods
const openAddDialog = () => {
    isEditing.value = false
    categoryForm.value = {
        name: '',
        index: null,
        image: '',
        imageUrl: ''
    }
    formErrors.value = {}
    imageSourceType.value = 'upload'
    selectedFile.value = null
    filePreviewUrl.value = null
    showDialog.value = true
}

const openEditDialog = (category) => {
    isEditing.value = true
    categoryToEdit.value = category
    categoryForm.value = {
        name: category.name,
        index: category.index,
        image: category.image || '',
        imageUrl: '' // Reset URL field for editing
    }
    formErrors.value = {}
    imageSourceType.value = 'upload'
    selectedFile.value = null
    filePreviewUrl.value = null
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    categoryForm.value = {
        name: '',
        index: null,
        image: '',
        imageUrl: ''
    }
    formErrors.value = {}
    categoryToEdit.value = null
    imageSourceType.value = 'upload'
    selectedFile.value = null
    filePreviewUrl.value = null
}

// Process image using adminClient
const processImage = async () => {
    if (!categoryForm.value.imageUrl.trim()) {
        showNotification('error', 'Please enter an image URL first')
        return
    }

    try {
        processingImage.value = true

        const response = await adminClient.medias.importFromUrl({
            url: categoryForm.value.imageUrl.trim()
        })

        if (response && response.url) {
            categoryForm.value.image = response.url
            categoryForm.value.imageUrl = '' // Clear the input URL after processing
            showNotification('success', 'Image processed and imported successfully')
        } else {
            throw new Error('Invalid response from image processing')
        }

    } catch (err) {
        console.error('Failed to process image:', err)
        showNotification('error', err.message || 'Failed to process image')
    } finally {
        processingImage.value = false
    }
}

// Save category
const saveCategory = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!categoryForm.value.name.trim()) {
            formErrors.value.name = 'Category name is required'
            formLoading.value = false
            return
        }

        console.log('Category form image value before save:', categoryForm.value.image)

        const categoryData = {
            name: categoryForm.value.name.trim(),
            index: categoryForm.value.index !== null && categoryForm.value.index !== undefined ? Number(categoryForm.value.index) : null,
            image: categoryForm.value.image && categoryForm.value.image.trim() ? categoryForm.value.image.trim() : null
        }

        // If image is base64 (starts with 'data:'), handle it like CampaignView.vue
        if (isEditing.value && categoryForm.value.image && categoryForm.value.image.startsWith('data:')) {
            try {
                const imageBackup = categoryForm.value.image

                // First save without the image (set to existing image if editing, empty if creating)
                if (isEditing.value && categoryToEdit.value)
                    categoryData.image = categoryToEdit.value.image || null
                else
                    categoryData.image = null

                console.log('Category data being sent (without base64 image):', categoryData)

                let category
                let categoryId

                if (isEditing.value && categoryToEdit.value) {
                    categoryId = categoryToEdit.value.id
                    category = await oddsClient.categories.update(categoryId, categoryData)
                } else {
                    category = await oddsClient.categories.insert(categoryData)
                    categoryId = category.id
                }

                if (!categoryId) {
                    console.error('Failed to get category ID for image update', category)
                    throw new Error('Unable to update image: Missing category ID')
                }

                // Now process the image using updateImage method
                console.log('Calling updateImage with ID:', categoryId, 'and base64 length:', imageBackup.length)
                const imageResponse = await oddsClient.categories.updateImage(categoryId, imageBackup)
                console.log('Image update response:', imageResponse)

                // Extract the image URL from response and update the category
                let processedImageUrl = null
                if (imageResponse && imageResponse.url) {
                    processedImageUrl = imageResponse.url
                } else if (imageResponse && imageResponse.data && imageResponse.data.url) {
                    processedImageUrl = imageResponse.data.url
                } else if (imageResponse && imageResponse.image) {
                    processedImageUrl = imageResponse.image
                }

                if (processedImageUrl) {
                    // Update category with the processed image URL
                    await oddsClient.categories.update(categoryId, {
                        ...categoryData,
                        image: processedImageUrl
                    })
                    console.log('Category updated with processed image URL:', processedImageUrl)
                }

                showNotification('success', isEditing.value ? 'Category updated successfully' : 'Category created successfully')
                formLoading.value = false
                closeDialog()
                refreshData()
                return

            } catch (err) {
                formLoading.value = false
                if (err.response?.data?.errors)
                    formErrors.value = err.response.data.errors
                else
                    showNotification('error', err.message || 'Failed to save category')
                return
            }
        } else {
            // Regular save (no base64 image)
            console.log('Category data being sent:', categoryData)

            if (isEditing.value) {
                await oddsClient.categories.update(categoryToEdit.value.id, categoryData)
                showNotification('success', 'Category updated successfully')
            } else {
                await oddsClient.categories.insert(categoryData)
                showNotification('success', 'Category created successfully')
            }

            formLoading.value = false
            closeDialog()
            refreshData()
        }
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save category')
    }
}

const confirmDelete = (category) => {
    categoryToDelete.value = category
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    categoryToDelete.value = null
}

const deleteCategory = async () => {
    if (!categoryToDelete.value) return

    try {
        deleteLoading.value = true
        await oddsClient.categories.delete(categoryToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Category deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete category:', err)
        showNotification('error', err.message || 'Failed to delete category')
    }
}

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

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'

    try {
        const date = new Date(timestamp)
        if (isNaN(date.getTime())) return 'N/A'
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch (err) {
        console.error('Date formatting error:', err, timestamp)
        return 'N/A'
    }
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'asc'
    }
}

const handleImageError = (event) => {
    // Hide broken images
    event.target.style.display = 'none'
}

const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
        if (!file.type.startsWith('image/')) {
            showNotification('error', 'Please select an image file')
            event.target.value = ''
            return
        }

        selectedFile.value = file
        const reader = new FileReader()
        reader.onload = (e) => {
            filePreviewUrl.value = e.target.result
            // Directly set the image as base64 data URL (like CampaignView.vue)
            categoryForm.value.image = e.target.result
            console.log('Image set as base64, length:', e.target.result.length)
        }
        reader.readAsDataURL(file)
    }
}

const removeImage = () => {
    categoryForm.value.image = ''
    selectedFile.value = null
    filePreviewUrl.value = null
    showNotification('success', 'Image removed successfully')
}

onMounted(() => {
    loadCategories()

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })
})
</script>
