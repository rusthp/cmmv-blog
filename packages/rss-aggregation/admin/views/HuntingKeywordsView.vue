<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Hunting Keywords</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Keyword
                </button>

                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>

                <button
                    @click="huntAll"
                    class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                    :disabled="hunting"
                    title="Manual hunt - keywords are automatically hunted according to their update interval"
                >
                    <svg v-if="hunting" class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {{ hunting ? 'Hunting...' : 'Hunt Now' }}
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading keywords...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load hunting keywords</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="keywords.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">No hunting keywords found</p>
            <p class="text-neutral-400 text-sm mb-4">Add a keyword to start hunting news without a registered channel</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Keyword
            </button>
        </div>

        <!-- Keywords table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th
                                @click="toggleSort('keyword')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Keyword
                                <span v-if="filters.sortBy === 'keyword'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Label
                            </th>
                            <th
                                @click="toggleSort('lastUpdate')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Last Hunt
                                <span v-if="filters.sortBy === 'lastUpdate'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Update Interval
                            </th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Active
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="keyword in keywords" :key="keyword.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="keyword.id">
                                {{ keyword.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ keyword.keyword }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ keyword.label || '-' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ formatDate(keyword.lastUpdate) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ formatInterval(keyword.intervalUpdate) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <button
                                    @click="toggleActive(keyword)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        keyword.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="huntKeyword(keyword)"
                                        title="Hunt this keyword now"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors"
                                        :disabled="huntingKeywords.includes(keyword.id)"
                                    >
                                        <template v-if="huntingKeywords.includes(keyword.id)">
                                            <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </template>
                                        <template v-else>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </template>
                                    </button>
                                    <button
                                        @click="openEditDialog(keyword)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(keyword)"
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
            itemName="keywords"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Keyword Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Keyword' : 'Add Keyword' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveKeyword">
                        <div class="mb-4">
                            <label for="keywordTerm" class="block text-sm font-medium text-neutral-300 mb-1">Search Keyword</label>
                            <input
                                id="keywordTerm"
                                v-model="keywordForm.keyword"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="prefeitura counter-strike evento"
                                required
                            />
                            <p class="mt-1 text-sm text-neutral-500">Searched on Google News every interval. No channel registration needed.</p>
                            <p v-if="formErrors.keyword" class="mt-1 text-sm text-red-500">{{ formErrors.keyword }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="keywordLabel" class="block text-sm font-medium text-neutral-300 mb-1">Label</label>
                            <input
                                id="keywordLabel"
                                v-model="keywordForm.label"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Esports municipal"
                            />
                            <p class="mt-1 text-sm text-neutral-500">Optional category used to group results in the validation queue</p>
                        </div>

                        <div class="mb-4">
                            <label for="keywordInterval" class="block text-sm font-medium text-neutral-300 mb-1">Update Interval</label>
                            <div class="flex items-center">
                                <input
                                    id="keywordInterval"
                                    v-model.number="keywordForm.intervalHours"
                                    type="number"
                                    min="1"
                                    max="168"
                                    class="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                <span class="ml-2 text-neutral-300">hours</span>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">How often to search for this keyword (1-168 hours)</p>
                            <p v-if="formErrors.intervalUpdate" class="mt-1 text-sm text-red-500">{{ formErrors.intervalUpdate }}</p>
                        </div>

                        <div class="mb-4">
                            <div class="flex items-center">
                                <input
                                    id="keywordActive"
                                    v-model="keywordForm.active"
                                    type="checkbox"
                                    class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                />
                                <label for="keywordActive" class="ml-2 block text-sm font-medium text-neutral-300">
                                    Active
                                </label>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">Only active keywords will be hunted</p>
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
            :item-name="keywordToDelete?.keyword"
            :loading="deleteLoading"
            message="Are you sure you want to delete the keyword"
            warning-text="This action cannot be undone. Results already collected for this keyword may be affected."
            loading-text="Deleting..."
            @confirm="deleteKeyword"
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
import { ref, onMounted, watch } from 'vue'
import { useFeedClient } from '@cmmv/rss-aggregation/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const feedClient = useFeedClient()

const keywords = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const keywordForm = ref({
    keyword: '',
    label: '',
    intervalHours: 6,
    active: true
})
const keywordToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const keywordToDelete = ref(null)
const deleteLoading = ref(false)

const hunting = ref(false)
const huntingKeywords = ref([])

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
    to: 10
})

const filters = ref({
    sortBy: 'keyword',
    sortOrder: 'asc',
    page: 1
})

const loadKeywords = async () => {
    try {
        loading.value = true
        error.value = null

        const apiFilters = {
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage,
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder,
        }

        const response = await feedClient.huntingKeywords.get(apiFilters)

        if (response && response.data) {
            keywords.value = response.data || []

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 10

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
            keywords.value = []
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
        console.error('Failed to load hunting keywords:', err)
        loading.value = false
        error.value = err.message || 'Failed to load hunting keywords'
        showNotification('error', 'Failed to load hunting keywords')
    }
}

const refreshData = () => {
    loadKeywords()
}

const handlePageChange = (newPage) => {
    filters.value.page = newPage
}

watch(filters, () => {
    loadKeywords()
}, { deep: true })

const openAddDialog = () => {
    isEditing.value = false
    keywordForm.value = {
        keyword: '',
        label: '',
        intervalHours: 6,
        active: true
    }
    formErrors.value = {}
    showDialog.value = true
}

const openEditDialog = (keyword) => {
    isEditing.value = true
    keywordToEdit.value = keyword

    const intervalHours = keyword.intervalUpdate ? Math.floor(keyword.intervalUpdate / (1000 * 60 * 60)) : 6

    keywordForm.value = {
        keyword: keyword.keyword,
        label: keyword.label || '',
        intervalHours: intervalHours,
        active: keyword.active === undefined ? true : keyword.active
    }
    formErrors.value = {}
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    keywordForm.value = { keyword: '', label: '', intervalHours: 6, active: true }
    formErrors.value = {}
    keywordToEdit.value = null
}

const saveKeyword = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        if (!keywordForm.value.keyword.trim()) {
            formErrors.value.keyword = 'Search keyword is required'
            formLoading.value = false
            return
        }

        if (!keywordForm.value.intervalHours || keywordForm.value.intervalHours < 1 || keywordForm.value.intervalHours > 168) {
            formErrors.value.intervalUpdate = 'Update interval must be between 1 and 168 hours'
            formLoading.value = false
            return
        }

        const keywordData = {
            keyword: keywordForm.value.keyword.trim(),
            label: keywordForm.value.label.trim() || null,
            intervalUpdate: keywordForm.value.intervalHours * 60 * 60 * 1000,
            active: keywordForm.value.active
        }

        if (isEditing.value) {
            await feedClient.huntingKeywords.update(keywordToEdit.value.id, keywordData)
            showNotification('success', 'Keyword updated successfully')
        } else {
            await feedClient.huntingKeywords.insert(keywordData)
            showNotification('success', 'Keyword created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save keyword')
    }
}

const confirmDelete = (keyword) => {
    keywordToDelete.value = keyword
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    keywordToDelete.value = null
}

const deleteKeyword = async () => {
    if (!keywordToDelete.value) return

    try {
        deleteLoading.value = true
        await feedClient.huntingKeywords.delete(keywordToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Keyword deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete keyword:', err)
        showNotification('error', err.message || 'Failed to delete keyword')
    }
}

const toggleActive = async (keyword) => {
    try {
        const updatedKeyword = {
            ...keyword,
            active: !keyword.active
        }

        await feedClient.huntingKeywords.update(keyword.id, updatedKeyword)

        const index = keywords.value.findIndex(k => k.id === keyword.id)
        if (index !== -1) {
            keywords.value[index].active = !keyword.active
        }

        showNotification('success', `Keyword ${updatedKeyword.active ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
        console.error('Failed to toggle keyword active state:', err)
        showNotification('error', err.message || 'Failed to update keyword status')
    }
}

const huntAll = async () => {
    try {
        hunting.value = true
        const response = await feedClient.huntingKeywords.processHunting()
        showNotification('success', response?.message || 'Hunt finished successfully')
        refreshData()
    } catch (err) {
        showNotification('error', err.message || 'Failed to run hunt')
    } finally {
        hunting.value = false
    }
}

const huntKeyword = async (keyword) => {
    if (huntingKeywords.value.includes(keyword.id)) return

    try {
        huntingKeywords.value.push(keyword.id)
        const response = await feedClient.huntingKeywords.processKeyword(keyword.id)
        showNotification('success', response?.message || `Hunt for "${keyword.keyword}" finished`)
        refreshData()
    } catch (err) {
        console.error('Failed to hunt keyword:', err)
        showNotification('error', err.message || `Failed to hunt keyword "${keyword.keyword}"`)
    } finally {
        huntingKeywords.value = huntingKeywords.value.filter(id => id !== keyword.id)
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

const formatInterval = (interval) => {
    if (!interval) return '6 hours'

    const hours = Math.floor(interval / (1000 * 60 * 60))

    if (hours === 1) return '1 hour'
    return `${hours} hours`
}

const formatDate = (timestamp) => {
    if (!timestamp) return 'Never'

    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Never'

    return date.toLocaleString()
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'asc'
    }
}

onMounted(() => {
    loadKeywords()
})
</script>
