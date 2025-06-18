<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Network Accounts</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Account
                </button>
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
                <button @click="exportAccounts" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center" :disabled="exportLoading">
                    <svg v-if="exportLoading" class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                </button>
                <!-- Add search dropdown button -->
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
                        <div class="p-3 space-y-3">
                            <div class="relative">
                                <input
                                    v-model="filters.search"
                                    type="text"
                                    placeholder="Search accounts..."
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
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading accounts...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load accounts</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="accounts.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">No network accounts found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first network account</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Account
            </button>
        </div>

        <!-- Accounts table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th
                                @click="toggleSort('label')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Label
                                <span v-if="filters.sortBy === 'label'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Network
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="account in accounts" :key="account.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="account.id">
                                {{ account.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ account.label }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                <span
                                    v-if="account.networkName"
                                    class="bg-neutral-700 text-xs rounded px-2 py-1"
                                >
                                    {{ account.networkName }}
                                </span>
                                <span v-else class="text-neutral-500 italic">
                                    No network
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(account)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(account)"
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
            itemName="accounts"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Account Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Account' : 'Add Account' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveAccount" class="max-h-[70vh] overflow-y-auto">
                        <div class="mb-4">
                            <label for="accountLabel" class="block text-sm font-medium text-neutral-300 mb-1">Account Label</label>
                            <input
                                id="accountLabel"
                                v-model="accountForm.label"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Account label"
                                required
                            />
                            <p v-if="formErrors.label" class="mt-1 text-sm text-red-500">{{ formErrors.label }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="accountNetwork" class="block text-sm font-medium text-neutral-300 mb-1">Network</label>
                            <div v-if="loadingNetworks" class="flex items-center py-2">
                                <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                <span class="ml-2 text-neutral-400 text-sm">Loading networks...</span>
                            </div>
                            <div v-else-if="availableNetworks.length === 0" class="py-2 text-sm text-neutral-400">
                                No networks available. Please create a network first.
                            </div>
                            <div v-else>
                                <select
                                    id="accountNetwork"
                                    v-model="accountForm.network"
                                    @change="loadNetworkMetadata"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="" disabled>Select a network</option>
                                    <option
                                        v-for="network in availableNetworks"
                                        :key="network.id"
                                        :value="network.id"
                                    >
                                        {{ network.name }}
                                    </option>
                                </select>
                            </div>
                            <p v-if="formErrors.network" class="mt-1 text-sm text-red-500">{{ formErrors.network }}</p>
                        </div>

                        <!-- Dynamic Network Metadata Fields -->
                        <div v-if="accountForm.network && networkMetadataFields.length > 0" class="mb-6">
                            <label class="block text-sm font-medium text-neutral-300 mb-2">Network Credentials</label>
                            <div class="bg-neutral-750 p-4 rounded-md mb-2">
                                <div class="max-h-[250px] overflow-y-auto pr-1 space-y-4">
                                    <div v-for="field in networkMetadataFields" :key="field.key" class="mb-3">
                                        <label :for="`metadata_${field.key}`" class="block text-sm font-medium text-neutral-300 mb-1">
                                            {{ field.key }}
                                        </label>
                                        <textarea
                                            v-if="field.type === 'text'"
                                            :id="`metadata_${field.key}`"
                                            v-model="accountForm.metadata[field.key]"
                                            rows="3"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            :placeholder="`Enter ${field.key}`"
                                        ></textarea>
                                        <input
                                            v-else-if="field.type === 'number'"
                                            :id="`metadata_${field.key}`"
                                            v-model.number="accountForm.metadata[field.key]"
                                            type="number"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            :placeholder="`Enter ${field.key}`"
                                        />
                                        <input
                                            v-else
                                            :id="`metadata_${field.key}`"
                                            v-model="accountForm.metadata[field.key]"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            :placeholder="`Enter ${field.key}`"
                                        />
                                    </div>
                                </div>
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
            :item-name="accountToDelete?.label"
            :loading="deleteLoading"
            message="Are you sure you want to delete the account"
            warning-text="This action cannot be undone. All data associated with this account will be permanently deleted."
            loading-text="Deleting..."
            @confirm="deleteAccount"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useAffiliateClient } from '@cmmv/affiliate/admin/client'
import { useAdminClient } from '@cmmv/blog/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const affiliateClient = useAffiliateClient()
const adminClient = useAdminClient()

const accounts = ref([])
const loading = ref(true)
const error = ref(null)

const availableNetworks = ref([])
const loadingNetworks = ref(false)
const networkMetadataFields = ref([])
const loadingNetworkMetadata = ref(false)

const showDialog = ref(false)
const isEditing = ref(false)
const accountForm = ref({
    label: '',
    network: '',
    networkName: '',
    metadata: {}
})
const accountToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const accountToDelete = ref(null)
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
    sortBy: 'label',
    sortOrder: 'asc',
    page: 1
})

const showSearchDropdown = ref(false)
const searchInput = ref(null)
const exportLoading = ref(false)

const loadAccounts = async () => {
    try {
        loading.value = true
        error.value = null

        if (availableNetworks.value.length === 0)
            await loadNetworks()

        const apiFilters = {
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage,
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder,
        }

        if (filters.value.search) {
            apiFilters.search = filters.value.search
            apiFilters.searchField = 'label'
        }

        const response = await affiliateClient.accounts.get(apiFilters)

        if (response && response.data) {
            accounts.value = response.data.map(account => {
                const networkInfo = availableNetworks.value.find(n => n.id === account.network)
                return {
                    ...account,
                    networkName: networkInfo ? networkInfo.name : account.networkName
                }
            })

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
            accounts.value = []
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
        console.error('Failed to load accounts:', err)
        loading.value = false
        error.value = err.message || 'Failed to load accounts'
        showNotification('error', 'Failed to load accounts')
    }
}

const loadNetworks = async () => {
    try {
        loadingNetworks.value = true

        const response = await affiliateClient.networks.get({
            limit: 100,
            sortBy: 'name',
            sort: 'asc'
        })

        if (response && response.data) {
            availableNetworks.value = response.data.filter(network => network.active !== false) || []
        } else {
            availableNetworks.value = []
        }

        loadingNetworks.value = false
    } catch (err) {
        console.error('Failed to load networks:', err)
        loadingNetworks.value = false
        showNotification('error', 'Failed to load available networks')
    }
}

const loadNetworkMetadata = async () => {
    if (!accountForm.value.network) {
        networkMetadataFields.value = [];
        accountForm.value.metadata = {};
        return;
    }

    try {
        loadingNetworkMetadata.value = true;

        const selectedNetwork = availableNetworks.value.find(n => n.id === accountForm.value.network);

        if (selectedNetwork) {
            accountForm.value.networkName = selectedNetwork.name;

            if (selectedNetwork.metadata) {
                try {
                    const metadataDefinition = JSON.parse(selectedNetwork.metadata);
                    networkMetadataFields.value = [];

                    for (const key in metadataDefinition) {
                        if (Object.prototype.hasOwnProperty.call(metadataDefinition, key)) {
                            const value = metadataDefinition[key];
                            let type = 'string';

                            if (typeof value === 'number') {
                                type = 'number';
                            } else if (value && value.length > 50) {
                                type = 'text';
                            }

                            networkMetadataFields.value.push({
                                key,
                                type
                            });

                            if (!accountForm.value.metadata[key])
                                accountForm.value.metadata[key] = '';
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse network metadata:', e);
                    networkMetadataFields.value = [];
                    accountForm.value.metadata = {};
                }
            } else {
                networkMetadataFields.value = [];
                accountForm.value.metadata = {};
            }
        } else {
            networkMetadataFields.value = [];
            accountForm.value.metadata = {};
        }

        loadingNetworkMetadata.value = false;
    } catch (err) {
        console.error('Failed to load network metadata:', err);
        loadingNetworkMetadata.value = false;
        networkMetadataFields.value = [];
        accountForm.value.metadata = {};
    }
}

// Refresh data
const refreshData = async () => {
    await loadNetworks()
    await loadAccounts()
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadAccounts()
}, { deep: true })

// Dialog methods
const openAddDialog = async () => {
    isEditing.value = false
    accountForm.value = {
        label: '',
        network: '',
        networkName: '',
        metadata: {}
    }
    networkMetadataFields.value = []
    formErrors.value = {}
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }
}

const openEditDialog = async (account) => {
    isEditing.value = true
    accountToEdit.value = account

    // Parse existing metadata
    let parsedMetadata = {};
    if (account.metadata) {
        try {
            parsedMetadata = JSON.parse(account.metadata);
        } catch (e) {
            console.error('Failed to parse account metadata:', e);
            parsedMetadata = {};
        }
    }

    accountForm.value = {
        label: account.label,
        network: account.network || '',
        networkName: account.networkName || '',
        metadata: parsedMetadata
    }

    formErrors.value = {}
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }

    // Load network metadata fields for the selected network
    if (accountForm.value.network) {
        await loadNetworkMetadata();
    }
}

const closeDialog = () => {
    showDialog.value = false
    accountForm.value = {
        label: '',
        network: '',
        networkName: '',
        metadata: {}
    }
    networkMetadataFields.value = []
    formErrors.value = {}
    accountToEdit.value = null
}

// Save account
const saveAccount = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!accountForm.value.label.trim()) {
            formErrors.value.label = 'Account label is required'
            formLoading.value = false
            return
        }

        if (!accountForm.value.network) {
            formErrors.value.network = 'Please select a network'
            formLoading.value = false
            return
        }

        const accountData = {
            label: accountForm.value.label.trim(),
            network: accountForm.value.network,
            metadata: Object.keys(accountForm.value.metadata).length > 0
                ? JSON.stringify(accountForm.value.metadata)
                : null
        }

        if (isEditing.value) {
            await affiliateClient.accounts.update(accountToEdit.value.id, accountData)
            showNotification('success', 'Account updated successfully')
        } else {
            await affiliateClient.accounts.insert(accountData)
            showNotification('success', 'Account created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save account')
    }
}

const confirmDelete = (account) => {
    accountToDelete.value = account
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    accountToDelete.value = null
}

const deleteAccount = async () => {
    if (!accountToDelete.value) return

    try {
        deleteLoading.value = true
        await affiliateClient.accounts.delete(accountToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Account deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete account:', err)
        showNotification('error', err.message || 'Failed to delete account')
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

const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value
    if (showSearchDropdown.value) {
        searchInput.value.focus()
    }
}

const clearSearch = () => {
    filters.value.search = ''
    showSearchDropdown.value = false
}

const exportAccounts = async () => {
    try {
        exportLoading.value = true;

        // Get signature token first (requires root access)
        let signature;
        try {
            const signatureResponse = await adminClient.settings.getSignature();
            if (signatureResponse) {
                signature = signatureResponse;
            } else {
                throw new Error('Failed to get authentication signature');
            }
        } catch (err) {
            console.error('Error getting signature:', err);
            showNotification('error', 'Only root users can export accounts');
            exportLoading.value = false;
            return;
        }

        window.open(`/api/affiliate/accounts/export?token=${signature}`, '_blank');
        showNotification('success', 'Export started. Your download will begin shortly.');
    } catch (err) {
        console.error('Failed to export accounts:', err);
        showNotification('error', err.message || 'Failed to export accounts');
    } finally {
        exportLoading.value = false;
    }
}

onMounted(() => {
    // Add click-outside handling for search dropdown
    document.addEventListener('click', (event) => {
        const target = event.target
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false
        }
    })

    // Load networks first, then accounts to ensure proper data association
    refreshData()
})
</script>
