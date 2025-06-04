<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Countries</h1>
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
                                    placeholder="Search countries..."
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
                                    <option value="code">Code</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Country
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading countries...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load countries</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="countries.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">No countries found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by adding your first country</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Country
            </button>
        </div>

        <!-- Countries table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-20">
                                Flag
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
                                @click="toggleSort('code')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Code
                                <span v-if="filters.sortBy === 'code'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('createdAt')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white hidden md:table-cell"
                            >
                                Created
                                <span v-if="filters.sortBy === 'createdAt'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="country in countries" :key="country.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="country.id">
                                {{ country.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <div class="flex items-center justify-center w-8 h-6">
                                    <img
                                        v-if="country.flag"
                                        :src="country.flag"
                                        :alt="`${country.name} flag`"
                                        class="w-8 h-6 object-cover rounded border border-neutral-600"
                                        @error="handleImageError"
                                    >
                                    <div v-else class="w-8 h-6 bg-neutral-600 rounded border border-neutral-600 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ country.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono uppercase">
                                {{ country.code }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 hidden md:table-cell">
                                {{ formatDate(country.createdAt) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(country)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(country)"
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
            itemName="countries"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Country Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Country' : 'Add Country' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="p-6">
                    <form @submit.prevent="saveCountry">
                        <div class="space-y-4">
                            <div class="mb-4">
                                <label for="countryName" class="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                                <input
                                    id="countryName"
                                    v-model="countryForm.name"
                                    @input="updateCode"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Country name"
                                    required
                                />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="countryCode" class="block text-sm font-medium text-neutral-300 mb-1">Code</label>
                                <input
                                    id="countryCode"
                                    v-model="countryForm.code"
                                    type="text"
                                    maxlength="3"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase font-mono"
                                    placeholder="ISO code (e.g., USA, BRA, GER)"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">ISO country code (2-3 characters)</p>
                                <p v-if="formErrors.code" class="mt-1 text-sm text-red-500">{{ formErrors.code }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="countryFlag" class="block text-sm font-medium text-neutral-300 mb-1">Flag URL (optional)</label>
                                <input
                                    id="countryFlag"
                                    v-model="countryForm.flag"
                                    type="url"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="https://example.com/flag.png"
                                />
                                <p class="mt-1 text-sm text-neutral-500">URL to the country flag image</p>
                                <!-- Flag preview -->
                                <div v-if="countryForm.flag" class="mt-2">
                                    <p class="text-xs text-neutral-400 mb-1">Preview:</p>
                                    <img
                                        :src="countryForm.flag"
                                        :alt="`${countryForm.name} flag preview`"
                                        class="w-12 h-8 object-cover rounded border border-neutral-600"
                                        @error="handleImageError"
                                    >
                                </div>
                                <p v-if="formErrors.flag" class="mt-1 text-sm text-red-500">{{ formErrors.flag }}</p>
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
            :item-name="countryToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the country"
            warning-text="This action cannot be undone. All data associated with this country may be affected."
            loading-text="Deleting..."
            @confirm="deleteCountry"
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
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const oddsClient = useOddsClient()

const countries = ref([])
const loading = ref(true)
const error = ref(null)
const refreshing = ref(false)

const showDialog = ref(false)
const isEditing = ref(false)
const countryForm = ref({
    name: '',
    code: '',
    flag: ''
})
const countryToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const countryToDelete = ref(null)
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
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1
})

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
    loadCountries()
    showSearchDropdown.value = false
}

const loadCountries = async () => {
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

        // Using the odds countries client
        const response = await oddsClient.countries.get(apiFilters)

        if (response && response.data) {
            countries.value = response.data || []

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
            countries.value = []
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
        console.error('Failed to load countries:', err)
        loading.value = false
        error.value = err.message || 'Failed to load countries'
        showNotification('error', 'Failed to load countries')
    }
}

// Refresh data
const refreshData = async () => {
    if (refreshing.value) return

    refreshing.value = true
    await loadCountries()
    refreshing.value = false
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadCountries()
}, { deep: true })

// Dialog methods
const openAddDialog = () => {
    isEditing.value = false
    countryForm.value = {
        name: '',
        code: '',
        flag: ''
    }
    formErrors.value = {}
    showDialog.value = true
}

const openEditDialog = (country) => {
    isEditing.value = true
    countryToEdit.value = country
    countryForm.value = {
        name: country.name,
        code: country.code,
        flag: country.flag || ''
    }
    formErrors.value = {}
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    countryForm.value = {
        name: '',
        code: '',
        flag: ''
    }
    formErrors.value = {}
    countryToEdit.value = null
}

// Save country
const saveCountry = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!countryForm.value.name.trim()) {
            formErrors.value.name = 'Country name is required'
            formLoading.value = false
            return
        }

        if (!countryForm.value.code.trim()) {
            formErrors.value.code = 'Country code is required'
            formLoading.value = false
            return
        }

        const countryData = {
            name: countryForm.value.name.trim(),
            code: countryForm.value.code.trim().toUpperCase(),
            flag: countryForm.value.flag.trim() || null
        }

        if (isEditing.value) {
            await oddsClient.countries.update(countryToEdit.value.id, countryData)
            showNotification('success', 'Country updated successfully')
        } else {
            await oddsClient.countries.insert(countryData)
            showNotification('success', 'Country created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save country')
    }
}

const confirmDelete = (country) => {
    countryToDelete.value = country
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    countryToDelete.value = null
}

const deleteCountry = async () => {
    if (!countryToDelete.value) return

    try {
        deleteLoading.value = true
        await oddsClient.countries.delete(countryToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Country deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete country:', err)
        showNotification('error', err.message || 'Failed to delete country')
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

const updateCode = () => {
    // Auto-generate code from name if it's empty or was auto-generated
    if (!countryForm.value.code || countryForm.value.code === generateCode(countryForm.value.name)) {
        countryForm.value.code = generateCode(countryForm.value.name)
    }
}

const generateCode = (text) => {
    return text
        .toString()
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '')        // Remove spaces
        .replace(/[^\w]+/g, '')     // Remove all non-word characters
        .substring(0, 3);           // Take first 3 characters
}

const handleImageError = (event) => {
    // Hide broken images
    event.target.style.display = 'none'
}

onMounted(() => {
    loadCountries()

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })
})
</script>
