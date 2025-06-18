<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Special Dates</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Special Date
                </button>
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span v-if="refreshing">Refreshing...</span>
                    <span v-else>Refresh</span>
                </button>
                <div class="relative">
                    <button @click="toggleSearchDropdown" data-search-toggle class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center relative">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                        <span v-if="filters.search.trim()" class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full" title="Search filter active"></span>
                    </button>
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-3">
                            <div class="relative">
                                <input
                                    v-model="filters.search"
                                    type="text"
                                    placeholder="Search by name, slug..."
                                    class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    @keydown.esc="showSearchDropdown = false"
                                    ref="searchInput"
                                >
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
            <span class="ml-3 text-neutral-400">Loading special dates...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load special dates</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="specialDates.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <i class="fas fa-calendar-alt text-6xl text-neutral-500 mb-4"></i>
            <p class="text-neutral-300 mb-2">No special dates found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first special date</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Special Date
            </button>
        </div>

        <!-- Special Dates table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Image</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Name</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Description</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Slug</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-neutral-300 uppercase tracking-wider">Campaigns</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="date in specialDates" :key="date.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="h-10 w-10 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center">
                                    <img v-if="date.image" :src="date.image" class="h-10 w-10 rounded-full object-cover" alt="Special date image" />
                                    <i v-else class="fas fa-calendar-alt text-neutral-500"></i>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{{ date.name }}</td>
                            <td class="px-6 py-4 text-sm text-neutral-300">
                                <div class="max-w-xs truncate" :title="date.description">{{ date.description }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">{{ date.slug }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <div class="flex flex-col items-center">
                                    <span class="text-lg font-medium text-white">
                                        {{ date.campaigns?.length || 0 }}
                                    </span>
                                    <span class="text-xs text-neutral-400">campaigns</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                    @click="toggleActive(date)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        date.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(date)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(date)"
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

        <Pagination :pagination="pagination" itemName="special dates" @pageChange="handlePageChange" />

        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Special Date' : 'Add Special Date' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">&times;</button>
                </div>
                <form @submit.prevent="saveSpecialDate">
                    <div class="p-6 space-y-4">
                        <input v-model="form.name" placeholder="Name" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                        <textarea v-model="form.description" placeholder="Description" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required></textarea>
                        <input v-model="form.slug" @input="isSlugManuallyEdited = true" placeholder="Slug (optional)" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">
                        <input v-model="form.image" placeholder="Image URL (optional)" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">

                        <!-- Campaigns Selection -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-neutral-300">Campanhas Associadas</label>

                            <!-- Search for campaigns -->
                            <div class="relative mb-3">
                                <input
                                    v-model="campaignSearchQuery"
                                    type="text"
                                    placeholder="Search campaigns..."
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute right-3 top-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <!-- Selected count -->
                            <div v-if="form.campaigns.length > 0" class="text-xs text-neutral-400 mb-2">
                                Selected ({{ form.campaigns.length }}):
                                <button @click="clearSelectedCampaigns" class="text-red-400 hover:text-red-300 ml-1">Clear all</button>
                            </div>

                            <!-- Campaigns list -->
                            <div class="max-h-48 overflow-y-auto bg-neutral-700 border border-neutral-600 rounded-md">
                                <div v-if="campaignsLoading" class="p-3 text-neutral-400 text-sm">Carregando campanhas...</div>
                                <div v-else-if="filteredCampaigns.length === 0" class="p-3 text-neutral-400 text-sm">
                                    {{ campaignSearchQuery ? 'Nenhuma campanha encontrada para a busca.' : 'Nenhuma campanha disponível.' }}
                                </div>
                                <div v-else class="grid grid-cols-1 gap-0">
                                    <label v-for="campaign in filteredCampaigns" :key="campaign.id"
                                           class="flex items-center p-3 hover:bg-neutral-600 cursor-pointer border-b border-neutral-600 last:border-b-0 transition-colors">
                                        <input
                                            type="checkbox"
                                            :value="campaign.id"
                                            v-model="form.campaigns"
                                            class="h-4 w-4 text-blue-600 rounded mr-3 flex-shrink-0">
                                        <div class="flex items-center min-w-0 flex-1">
                                            <img v-if="campaign.logo"
                                                 :src="campaign.logo"
                                                 :alt="campaign.name"
                                                 class="w-8 h-8 rounded object-cover mr-3 flex-shrink-0">
                                            <div class="min-w-0 flex-1">
                                                <div class="text-sm text-white font-medium truncate">{{ campaign.name }}</div>
                                                <div v-if="campaign.description" class="text-xs text-neutral-400 truncate">{{ campaign.description }}</div>
                                            </div>
                                            <div v-if="!campaign.active" class="ml-2 px-2 py-1 bg-red-900 text-red-200 text-xs rounded flex-shrink-0">
                                                Inativa
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <label class="flex items-center"><input type="checkbox" v-model="form.active" class="h-4 w-4 text-blue-600 rounded mr-2"><span class="text-sm text-neutral-300">Active</span></label>
                    </div>
                    <div class="p-6 border-t border-neutral-700 flex justify-end space-x-3">
                        <button type="button" @click="closeDialog" class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md" :disabled="formLoading">{{ formLoading ? 'Saving...' : 'Save' }}</button>
                    </div>
                </form>
            </div>
        </div>

        <DeleteDialog :show="showDeleteDialog" :item-name="itemToDelete?.name" @confirm="deleteItem" @cancel="closeDeleteDialog" />
        <ToastNotification :show="notification.show" :message="notification.message" :type="notification.type" @close="notification.show = false" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAffiliateClient } from '@cmmv/affiliate/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const affiliateClient = useAffiliateClient()

const specialDates = ref([]);
const loading = ref(true);
const error = ref(null);
const refreshing = ref(false);

const showDialog = ref(false);
const isEditing = ref(false);
const form = ref({ name: '', description: '', slug: '', image: '', campaigns: [], active: true });
const formLoading = ref(false);
const editId = ref(null);
const isSlugManuallyEdited = ref(false);
const availableCampaigns = ref([]);

const showDeleteDialog = ref(false)
const itemToDelete = ref(null)
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
    page: 1
})

const showSearchDropdown = ref(false)
const searchInput = ref(null)

const campaignSearchQuery = ref('');
const campaignsLoading = ref(false);

// Computed property for filtered campaigns
const filteredCampaigns = computed(() => {
    if (!availableCampaigns.value) return [];

    let campaigns = availableCampaigns.value;

    // Filter by search query
    if (campaignSearchQuery.value.trim()) {
        const query = campaignSearchQuery.value.toLowerCase().trim();
        campaigns = campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(query) ||
            (campaign.description && campaign.description.toLowerCase().includes(query))
        );
    }

    // Sort: active campaigns first, then by name
    return campaigns.sort((a, b) => {
        // Active campaigns first
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;

        // Then sort by name
        return a.name.localeCompare(b.name);
    });
});

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const params = {
            limit: pagination.value.perPage.toString(),
            offset: ((filters.value.page - 1) * pagination.value.perPage).toString(),
            search: filters.value.search,
        };
        const response = await affiliateClient.specialDates.get(params);
        specialDates.value = response.data;
        pagination.value.total = response.count;
        pagination.value.lastPage = Math.ceil(response.count / pagination.value.perPage);
    } catch (e) {
        error.value = 'Failed to load special dates.';
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    refreshing.value = true;
    loadData().finally(() => refreshing.value = false);
};

const handlePageChange = (newPage) => {
    filters.value.page = newPage;
    loadData();
};

watch(() => filters.value.search, () => {
    filters.value.page = 1;
    loadData();
});

const generateSlug = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/&/g, '-and-')      // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
        .replace(/\-\-+/g, '-')      // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
};

watch(() => form.value.name, (newName) => {
    if (!isSlugManuallyEdited.value) {
        form.value.slug = generateSlug(newName);
    }
});

const resetForm = () => {
    form.value = { name: '', description: '', slug: '', image: '', campaigns: [], active: true };
    editId.value = null;
    isEditing.value = false;
    isSlugManuallyEdited.value = false;
};

const openAddDialog = async () => {
    resetForm();
    await loadCampaigns();
    showDialog.value = true;
};

const openEditDialog = async (item) => {
    resetForm();
    isEditing.value = true;
    editId.value = item.id;
    form.value = {
        ...item,
        campaigns: item.campaigns || []
    };
    isSlugManuallyEdited.value = true;
    await loadCampaigns();
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
};

const saveSpecialDate = async () => {
    formLoading.value = true;
    try {
        if (isEditing.value) {
            await affiliateClient.specialDates.update(editId.value, form.value);
            showNotification('success', 'Special date updated successfully.');
        } else {
            await affiliateClient.specialDates.insert(form.value);
            showNotification('success', 'Special date created successfully.');
        }
        closeDialog();
        loadData();
    } catch (e) {
        showNotification('error', 'Failed to save special date.');
    } finally {
        formLoading.value = false;
    }
};

const confirmDelete = (item) => {
    itemToDelete.value = item;
    showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
    itemToDelete.value = null;
    showDeleteDialog.value = false;
};

const deleteItem = async () => {
    if (!itemToDelete.value) return

    try {
        deleteLoading.value = true
        await affiliateClient.specialDates.delete(itemToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Special date deleted successfully')
        loadData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete special date:', err)
        showNotification('error', err.message || 'Failed to delete special date')
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

const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value
    if (showSearchDropdown.value) {
        setTimeout(() => {
            searchInput.value?.focus()
        }, 100)
    }
}

const loadCampaigns = async () => {
    campaignsLoading.value = true;
    try {
        const apiFilters = {
            limit: 1000,
            offset: 0,
            sortBy: 'name',
            sort: 'asc',
            active: 'true'
        };

        // Use the same logic as CampaignView.vue
        const response = await affiliateClient.campaigns.getAllCampaignsWithCouponCounts ?
            await affiliateClient.campaigns.getAllCampaignsWithCouponCounts(apiFilters) :
            await affiliateClient.campaigns.get(apiFilters);

        if (response && response.data) {
            availableCampaigns.value = response.data || [];
        } else {
            availableCampaigns.value = [];
        }
    } catch (e) {
        console.error('Failed to load campaigns:', e);
        availableCampaigns.value = [];
        showNotification('error', 'Failed to load campaigns: ' + (e.message || 'Unknown error'));
    } finally {
        campaignsLoading.value = false;
    }
};

const clearSelectedCampaigns = () => {
    form.value.campaigns = [];
};

const clearSearch = () => {
    filters.value.search = ''
    showSearchDropdown.value = false
}

const toggleActive = async (item) => {
    try {
        const updatedItem = {
            ...item,
            active: !item.active
        }

        await affiliateClient.specialDates.update(item.id, updatedItem)
        const index = specialDates.value.findIndex(d => d.id === item.id)

        if (index !== -1) {
            specialDates.value[index].active = !item.active
        }

        showNotification('success', `Special date ${updatedItem.active ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
        console.error('Failed to toggle special date active state:', err)
        showNotification('error', err.message || 'Failed to update special date status')
        // Revert the change
        item.active = !item.active
    }
}

onMounted(() => {
    // Handle click outside to close dropdowns
    document.addEventListener('click', (event) => {
        const target = event.target

        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false
        }
    })

    loadData()
})
</script>