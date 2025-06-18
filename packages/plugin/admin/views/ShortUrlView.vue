<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Short URLs</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Short URL
                </button>
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
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
                                    placeholder="Search short URLs..."
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
                                    <option value="originalUrl">Original URL</option>
                                    <option value="slug">Slug</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading short URLs...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load short URLs</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="shortUrls.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p class="text-neutral-300 mb-2">No short URLs found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first short URL</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Short URL
            </button>
        </div>

        <!-- Short URLs table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th
                                @click="toggleSort('slug')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Slug
                                <span v-if="filters.sortBy === 'slug'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Original URL
                            </th>
                            <th
                                @click="toggleSort('statusHTTP')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Status
                                <span v-if="filters.sortBy === 'statusHTTP'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="shortUrl in shortUrls" :key="shortUrl.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="shortUrl.id">
                                {{ shortUrl.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <span class="font-mono bg-neutral-700 px-2 py-1 rounded text-blue-400">
                                    {{ shortUrl.slug }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-neutral-300 max-w-xs">
                                <div class="truncate" :title="shortUrl.originalUrl">
                                    {{ shortUrl.originalUrl }}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                    class="px-2 py-1 text-xs font-medium rounded-full"
                                    :class="getStatusClass(shortUrl.statusHTTP)"
                                >
                                    {{ shortUrl.statusHTTP }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="copyShortUrl(shortUrl)"
                                        title="Copy Short URL"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="openEditDialog(shortUrl)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="openOriginalUrl(shortUrl.slug)"
                                        title="Open Original URL"
                                        class="text-neutral-400 hover:text-green-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(shortUrl)"
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
            itemName="short URLs"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Short URL Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Short URL' : 'Add Short URL' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="p-6">
                    <form @submit.prevent="saveShortUrl">
                        <div class="space-y-4">
                            <div>
                                <label for="originalUrl" class="block text-sm font-medium text-neutral-300 mb-1">Original URL</label>
                                <input
                                    id="originalUrl"
                                    v-model="shortUrlForm.originalUrl"
                                    type="url"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="https://example.com/very-long-url"
                                    required
                                />
                                <p v-if="formErrors.originalUrl" class="mt-1 text-sm text-red-500">{{ formErrors.originalUrl }}</p>
                            </div>

                            <div>
                                <label for="slug" class="block text-sm font-medium text-neutral-300 mb-1">Slug</label>
                                <div class="flex space-x-2">
                                    <input
                                        id="slug"
                                        v-model="shortUrlForm.slug"
                                        type="text"
                                        class="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="my-short-link"
                                        required
                                    />
                                    <button
                                        type="button"
                                        @click="generateRandomSlug"
                                        class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center"
                                        title="Generate random slug"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                                <p class="mt-1 text-sm text-neutral-500">Short URL: /s/<span class="text-blue-400">{{ shortUrlForm.slug || 'your-slug' }}</span></p>
                                <p v-if="formErrors.slug" class="mt-1 text-sm text-red-500">{{ formErrors.slug }}</p>
                            </div>

                            <div>
                                <label for="statusHTTP" class="block text-sm font-medium text-neutral-300 mb-1">HTTP Status Code</label>
                                <select
                                    id="statusHTTP"
                                    v-model.number="shortUrlForm.statusHTTP"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="301">301 - Permanent Redirect</option>
                                    <option value="302">302 - Temporary Redirect</option>
                                    <option value="307">307 - Temporary Redirect (Preserve Method)</option>
                                    <option value="308">308 - Permanent Redirect (Preserve Method)</option>
                                </select>
                                <p class="mt-1 text-sm text-neutral-500">Choose the type of redirect for this short URL</p>
                                <p v-if="formErrors.statusHTTP" class="mt-1 text-sm text-red-500">{{ formErrors.statusHTTP }}</p>
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
            :item-name="shortUrlToDelete?.slug"
            :loading="deleteLoading"
            message="Are you sure you want to delete the short URL"
            warning-text="This action cannot be undone. The short URL will no longer redirect to the original URL."
            loading-text="Deleting..."
            @confirm="deleteShortUrl"
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
import { useAdminClient } from '@cmmv/blog/admin/client'
import Pagination from '../components/Pagination.vue'
import DeleteDialog from '../components/DeleteDialog.vue'
import ToastNotification from '../components/ToastNotification.vue'

const adminClient = useAdminClient()

const shortUrls = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const shortUrlForm = ref({
    originalUrl: '',
    slug: '',
    statusHTTP: 301
})
const shortUrlToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const shortUrlToDelete = ref(null)
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
    perPage: 10,
    total: 0,
    from: 1,
    to: 50
})

const filters = ref({
    search: '',
    searchField: 'originalUrl',
    sortBy: 'originalUrl',
    sortOrder: 'desc',
    page: 1
})

const blogUrl = ref('')
const showSearchDropdown = ref(false)
const searchInput = ref(null)

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
    loadShortUrls()
    showSearchDropdown.value = false
}

const loadBlogUrl = async () => {
    try {
        const settings = await adminClient.settings.getRoot()
        const urlSetting = settings.find(s => s.key === 'blog.url')

        if (urlSetting)
            blogUrl.value = urlSetting.value.replace(/\/$/, '')
    } catch (err) {
        console.error('Failed to load blog URL:', err)
        blogUrl.value = ''
    }
}

const loadShortUrls = async () => {
    try {
        loading.value = true
        error.value = null

        const apiFilters = {
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage,
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder,
        }

        if (filters.value.search) {
            apiFilters.search = filters.value.search
            apiFilters.searchField = filters.value.searchField
        }

        const response = await adminClient.shorturl.get(apiFilters)

        if (response && response.data) {
            shortUrls.value = response.data || []

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 50
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
            shortUrls.value = []
            pagination.value = {
                current: 1,
                lastPage: 1,
                perPage: 10,
                total: 0,
                from: 0,
                to: 0
            }
        }

        loading.value = false
    } catch (err) {
        console.error('Failed to load short URLs:', err)
        loading.value = false
        error.value = err.message || 'Failed to load short URLs'
        showNotification('error', 'Failed to load short URLs')
    }
}

const refreshData = async () => {
    await loadShortUrls()
}

const handlePageChange = (newPage) => {
    filters.value.page = newPage
}

watch(filters, () => {
    loadShortUrls()
}, { deep: true })

const openAddDialog = () => {
    isEditing.value = false
    shortUrlForm.value = {
        originalUrl: '',
        slug: '',
        statusHTTP: 301
    }
    formErrors.value = {}
    showDialog.value = true
}

const openEditDialog = (shortUrl) => {
    isEditing.value = true
    shortUrlToEdit.value = shortUrl
    shortUrlForm.value = {
        originalUrl: shortUrl.originalUrl,
        slug: shortUrl.slug,
        statusHTTP: shortUrl.statusHTTP
    }
    formErrors.value = {}
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    shortUrlForm.value = {
        originalUrl: '',
        slug: '',
        statusHTTP: 301
    }
    formErrors.value = {}
    shortUrlToEdit.value = null
}

const saveShortUrl = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        if (!shortUrlForm.value.originalUrl.trim()) {
            formErrors.value.originalUrl = 'Original URL is required'
            formLoading.value = false
            return
        }

        if (!shortUrlForm.value.slug.trim()) {
            formErrors.value.slug = 'Slug is required'
            formLoading.value = false
            return
        }

        try {
            new URL(shortUrlForm.value.originalUrl)
        } catch {
            formErrors.value.originalUrl = 'Please enter a valid URL'
            formLoading.value = false
            return
        }

        const shortUrlData = {
            originalUrl: shortUrlForm.value.originalUrl.trim(),
            slug: shortUrlForm.value.slug.trim(),
            statusHTTP: shortUrlForm.value.statusHTTP
        }

        if (isEditing.value) {
            await adminClient.shorturl.update(shortUrlToEdit.value.id, shortUrlData)
            showNotification('success', 'Short URL updated successfully')
        } else {
            await adminClient.shorturl.create(shortUrlData)
            showNotification('success', 'Short URL created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save short URL')
    }
}

const confirmDelete = (shortUrl) => {
    shortUrlToDelete.value = shortUrl
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    shortUrlToDelete.value = null
}

const deleteShortUrl = async () => {
    if (!shortUrlToDelete.value) return

    try {
        deleteLoading.value = true
        await adminClient.shorturl.delete(shortUrlToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Short URL deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete short URL:', err)
        showNotification('error', err.message || 'Failed to delete short URL')
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

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'asc'
    }
}

const getStatusClass = (status) => {
    switch (status) {
        case 301:
            return 'bg-green-900 text-green-200'
        case 302:
            return 'bg-yellow-900 text-yellow-200'
        case 307:
            return 'bg-blue-900 text-blue-200'
        case 308:
            return 'bg-purple-900 text-purple-200'
        default:
            return 'bg-neutral-900 text-neutral-200'
    }
}

const copyShortUrl = async (shortUrl) => {
    try {
        const fullUrl = blogUrl.value ? `${blogUrl.value}/s/${shortUrl.slug}` : `/s/${shortUrl.slug}`
        await navigator.clipboard.writeText(fullUrl)
        showNotification('success', 'Short URL copied to clipboard')
    } catch (err) {
        console.error('Failed to copy URL:', err)
        showNotification('error', 'Failed to copy URL to clipboard')
    }
}

const openOriginalUrl = (originalUrl) => {
    window.open(blogUrl.value + '/s/' + originalUrl, '_blank')
}

const generateRandomSlug = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''

    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    shortUrlForm.value.slug = result
}

onMounted(() => {
    loadShortUrls()
    loadBlogUrl()

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })
})
</script>
