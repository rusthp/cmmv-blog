<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Whitelabel Access</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
                <!-- Add search button with dropdown -->
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
                                    placeholder="Search users or domains..."
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
                                    <option value="user">User</option>
                                    <option value="whitelabel">Domain</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Access
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading access records...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load access records</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="accessRecords.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p class="text-neutral-300 mb-2">No access records found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by adding your first whitelabel access permission</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Access
            </button>
        </div>

        <!-- Access records table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th
                                @click="toggleSort('user')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                User
                                <span v-if="filters.sortBy === 'user'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('whitelabel')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Whitelabel
                                <span v-if="filters.sortBy === 'whitelabel'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="record in accessRecords" :key="record.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="record.id">
                                {{ record.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <div class="flex items-center">
                                    <div class="h-7 w-7 rounded-full flex items-center justify-center overflow-hidden bg-blue-600 text-white mr-2">
                                        <img
                                            v-if="record.userData?.profile?.image"
                                            :src="record.userData.profile.image"
                                            :alt="getUserName(record.userData)"
                                            class="h-full w-full object-cover"
                                        />
                                        <span v-else class="text-sm font-medium">{{ getUserInitials(record.userData) }}</span>
                                    </div>
                                    <div>
                                        <div class="text-white">{{ getUserName(record.userData) }}</div>
                                        <div class="text-neutral-400 text-xs">{{ record.userData?.email }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <div class="flex items-center">
                                    <div class="h-7 w-7 rounded-full flex items-center justify-center overflow-hidden bg-neutral-700 mr-2">
                                        <img
                                            v-if="record.whitelabelData?.faviconUrl"
                                            :src="record.whitelabelData.faviconUrl"
                                            :alt="record.whitelabelData.name"
                                            class="h-full w-full object-cover"
                                            @error="handleImageError"
                                        />
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="text-white">{{ record.whitelabelData?.name }}</div>
                                        <div>
                                            <a :href="`https://${record.whitelabelData?.domain}`" target="_blank" class="text-blue-400 hover:text-blue-300 hover:underline text-xs">
                                                {{ record.whitelabelData?.domain }}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    @click="confirmDelete(record)"
                                    title="Remove Access"
                                    class="text-neutral-400 hover:text-red-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <Pagination
            :pagination="pagination"
            itemName="access records"
            @pageChange="handlePageChange"
        />

        <!-- Add Access Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Add Whitelabel Access</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveAccess">
                        <div class="mb-4">
                            <label for="userSelect" class="block text-sm font-medium text-neutral-300 mb-1">User</label>
                            <div class="relative">
                                <select
                                    id="userSelect"
                                    v-model="accessForm.user"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select a user</option>
                                    <option v-for="user in users" :key="user.id" :value="user.id">
                                        {{ getUserName(user) }} ({{ user.email }})
                                    </option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                            <p v-if="formErrors.user" class="mt-1 text-sm text-red-500">{{ formErrors.user }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="whitelabelSelect" class="block text-sm font-medium text-neutral-300 mb-1">Whitelabel Domain</label>
                            <div class="relative">
                                <select
                                    id="whitelabelSelect"
                                    v-model="accessForm.whitelabel"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select a domain</option>
                                    <option v-for="whitelabel in whitelabels" :key="whitelabel.id" :value="whitelabel.id">
                                        {{ whitelabel.name }} ({{ whitelabel.domain }})
                                    </option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                            <p v-if="formErrors.whitelabel" class="mt-1 text-sm text-red-500">{{ formErrors.whitelabel }}</p>
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
                                <span v-else>Add Access</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="`access for ${getDeleteItemName()}`"
            :loading="deleteLoading"
            message="Are you sure you want to remove access for"
            warning-text="This action cannot be undone. The user will no longer have access to this whitelabel domain."
            loading-text="Removing access..."
            @confirm="deleteAccess"
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAdminClient } from '@cmmv/blog/admin/client'
import Pagination from '../components/Pagination.vue'
import DeleteDialog from '../components/DeleteDialog.vue'
import ToastNotification from '../components/ToastNotification.vue'

const adminClient = useAdminClient()

const accessRecords = ref([])
const users = ref([])
const whitelabels = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const accessForm = ref({
    user: '',
    whitelabel: ''
})
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const accessToDelete = ref(null)
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
    to: 10
})

const filters = ref({
    search: '',
    searchField: 'user',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1
})

// Add search dropdown state
const showSearchDropdown = ref(false)
const searchInput = ref(null)

// Load access records with user and whitelabel details
const loadAccessRecords = async () => {
    try {
        loading.value = true
        error.value = null

        const apiFilters = {
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage,
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder
        }

        if (filters.value.search) {
            apiFilters.search = filters.value.search
            apiFilters.searchField = filters.value.searchField
        }

        const response = await adminClient.whitelabelAccess.get(apiFilters)

        if (response && response.data) {
            accessRecords.value = response.data.map(record => {
                return {
                    ...record,
                    userData: record.user,
                    whitelabelData: record.whitelabel
                }
            })

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 10

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
            accessRecords.value = []
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
        console.error('Failed to load whitelabel access records:', err)
        loading.value = false
        error.value = err.message || 'Failed to load whitelabel access records'
        showNotification('error', 'Failed to load whitelabel access records')
    }
}

// Load users for the dropdown
const loadUsers = async () => {
    try {
        const response = await adminClient.users.get({
            limit: 100,
            sortBy: 'email',
            sort: 'asc'
        })
        users.value = response.data || []
    } catch (err) {
        console.error('Failed to load users:', err)
        showNotification('error', 'Failed to load users')
    }
}

// Load whitelabels for the dropdown
const loadWhitelabels = async () => {
    try {
        const response = await adminClient.whitelabel.get({
            limit: 100,
            sortBy: 'name',
            sort: 'asc'
        })
        whitelabels.value = response.data || []
    } catch (err) {
        console.error('Failed to load whitelabel domains:', err)
        showNotification('error', 'Failed to load whitelabel domains')
    }
}

// Format date helper
const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Get user display name helper
const getUserName = (user) => {
    if (!user) return 'Unknown User'
    if (user.profile && user.profile.name) return user.profile.name
    return user.email ? user.email.split('@')[0] : 'Unknown User'
}

// Get user initials for avatar
const getUserInitials = (user) => {
    if (!user) return '?'
    if (user.profile && user.profile.name) {
        const nameParts = user.profile.name.split(' ')
        if (nameParts.length > 1) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        }
        return user.profile.name[0].toUpperCase()
    }
    return user.email ? user.email[0].toUpperCase() : '?'
}

// Handle image error
const handleImageError = (event) => {
    event.target.style.display = 'none'
    event.target.nextElementSibling.style.display = 'block'
}

// Get delete item name for confirmation dialog
const getDeleteItemName = () => {
    if (!accessToDelete.value) return ''

    const userName = accessToDelete.value.userData ?
        getUserName(accessToDelete.value.userData) : 'user'

    const domainName = accessToDelete.value.whitelabelData ?
        accessToDelete.value.whitelabelData.name : 'domain'

    return `${userName} to ${domainName}`
}

// Refresh data
const refreshData = () => {
    loadAccessRecords()
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage
}

// Watch for filter changes
watch(filters, () => {
    loadAccessRecords()
}, { deep: true })

// Dialog methods
const openAddDialog = () => {
    accessForm.value = {
        user: '',
        whitelabel: ''
    }
    formErrors.value = {}
    showDialog.value = true

    // Load users and whitelabels if not already loaded
    if (users.value.length === 0) loadUsers()
    if (whitelabels.value.length === 0) loadWhitelabels()
}

const closeDialog = () => {
    showDialog.value = false
    accessForm.value = {
        user: '',
        whitelabel: ''
    }
    formErrors.value = {}
}

// Save access
const saveAccess = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!accessForm.value.user) {
            formErrors.value.user = 'User is required'
            formLoading.value = false
            return
        }

        if (!accessForm.value.whitelabel) {
            formErrors.value.whitelabel = 'Whitelabel domain is required'
            formLoading.value = false
            return
        }

        const accessData = {
            user: accessForm.value.user,
            whitelabel: accessForm.value.whitelabel
        }

        await adminClient.whitelabelAccess.create(accessData)
        showNotification('success', 'Access granted successfully')

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to grant access')
    }
}

const confirmDelete = (access) => {
    accessToDelete.value = access
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    accessToDelete.value = null
}

const deleteAccess = async () => {
    if (!accessToDelete.value) return

    try {
        deleteLoading.value = true
        await adminClient.whitelabelAccess.delete(accessToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Access removed successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to remove access:', err)
        showNotification('error', err.message || 'Failed to remove access')
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

// Toggle search dropdown
const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value

    // Focus the search input when dropdown opens
    if (showSearchDropdown.value) {
        nextTick(() => {
            searchInput.value?.focus()
        })
    }
}

// Clear search
const clearSearch = () => {
    filters.value.search = ''
    filters.value.page = 1
    loadAccessRecords()
}

onMounted(() => {
    loadAccessRecords()

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value &&
            !e.target.closest('[data-search-toggle]') &&
            !e.target.closest('.absolute')) {
            showSearchDropdown.value = false
        }
    })
})
</script>
