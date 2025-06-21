<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Teams</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add Team
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Search
                        <span v-if="filters.search.trim()" class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full"></span>
                    </button>
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3">
                            <input v-model="filters.search" type="text" placeholder="Search teams..." class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" @keydown.esc="showSearchDropdown = false" ref="searchInput">
                        </div>
                    </div>
                </div>
                <button @click="openSyncDialog" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    Sync from API
                </button>
                <button
                    @click="processAllImages"
                    class="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                    :disabled="processingAllImages"
                >
                    <svg v-if="!processingAllImages" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <svg v-else class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {{ processingAllImages ? 'Processing...' : 'Process All Images' }}
                </button>
            </div>
        </div>

        <!-- Image Processing Progress Bar -->
        <div v-if="processingAllImages && imageProgress.total > 0" class="bg-neutral-800 rounded-lg p-4 space-y-2">
            <div class="flex justify-between text-sm font-medium text-neutral-300">
                <span>Processing Team Logos...</span>
                <span>{{ imageProgress.processed }} / {{ imageProgress.total }}</span>
            </div>
            <div class="w-full bg-neutral-700 rounded-full h-2.5">
                <div class="bg-teal-600 h-2.5 rounded-full" :style="{ width: `${(imageProgress.processed / imageProgress.total) * 100}%` }"></div>
            </div>
            <div v-if="imageProgress.failed > 0" class="text-xs text-red-400">
                {{ imageProgress.failed }} images failed to process.
            </div>
        </div>

        <!-- Progresso da Sincronização -->
        <div class="row mb-4" v-if="syncProgress && syncProgress.status === 'running'">
            <div class="col">
                <div class="bg-neutral-800 rounded-lg p-4">
                    <h5 class="text-white mb-3">Sync Progress</h5>
                    <div class="mb-3">
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar" role="progressbar" :style="{ width: `${syncProgress.percentage}%` }" :class="{'bg-success': syncProgress.status === 'completed', 'bg-danger': syncProgress.status === 'error', 'progress-bar-striped progress-bar-animated': syncProgress.status === 'running'}">
                                {{ syncProgress.percentage }}%
                            </div>
                        </div>
                    </div>
                    <div class="text-white">
                        <p><strong>Status:</strong> {{ syncProgress.status }}</p>
                        <p><strong>Current Item:</strong> {{ syncProgress.currentItem }}</p>
                        <p><strong>Processed:</strong> {{ syncProgress.processedItems }} / {{ syncProgress.totalItems }}</p>
                        <p><strong>Created:</strong> {{ syncProgress.totalCreated }} | <strong>Updated:</strong> {{ syncProgress.totalUpdated }}</p>
                        <p v-if="syncProgress.error" class="text-danger"><strong>Error:</strong> {{ syncProgress.error }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading/Error/Empty/Table states -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center text-white">
            <p>Failed to load teams: {{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors mt-4">Try Again</button>
        </div>
        <div v-else-if="teams.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center text-white">
            <p>No teams found.</p>
        </div>
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Logo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Code</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Country</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Founded</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">National</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Venue</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="team in teams" :key="team.id">
                            <td class="px-6 py-4">
                                <div class="flex items-center space-x-2">
                                    <img v-if="team.processedImageUrl || team.logo" :src="team.processedImageUrl || team.logo" class="w-8 h-8 object-contain rounded border border-neutral-600">
                                    <div v-else class="w-8 h-8 bg-neutral-700 rounded"></div>
                                    <button
                                        v-if="team.logo && !team.imageProcessed"
                                        @click="processImage(team)"
                                        title="Process image"
                                        class="text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-white">{{ team.name }}</td>
                            <td class="px-6 py-4 text-neutral-300">{{ team.code }}</td>
                            <td class="px-6 py-4 text-neutral-300">{{ countriesMap[team.country_id]?.name || 'N/A' }}</td>
                            <td class="px-6 py-4 text-neutral-300">{{ team.founded }}</td>
                            <td class="px-6 py-4 text-neutral-300">{{ team.national ? 'Yes' : 'No' }}</td>
                            <td class="px-6 py-4 text-neutral-300">{{ venuesMap[team.venue_id]?.name || 'N/A' }}</td>
                            <td class="px-6 py-4 text-right">
                                <button @click="openEditDialog(team)" class="text-neutral-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button @click="confirmDelete(team)" class="text-neutral-400 hover:text-red-500 ml-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <Pagination :pagination="pagination" itemName="teams" @pageChange="handlePageChange"/>

        <!-- Add/Edit Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Team' : 'Add Team' }}</h3>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveTeam" class="space-y-4">
                        <input v-model="teamForm.name" placeholder="Name" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                        <input v-model="teamForm.code" placeholder="Code" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">
                        <select v-model="teamForm.country_id" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">
                            <option value="">Select Country</option>
                            <option v-for="country in countries" :key="country.id" :value="country.id">{{ country.name }}</option>
                        </select>
                        <select v-model="teamForm.venue_id" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">
                            <option value="">Select Venue</option>
                            <option v-for="venue in venues" :key="venue.id" :value="venue.id">{{ venue.name }}</option>
                        </select>
                        <input v-model.number="teamForm.founded" type="number" placeholder="Founded Year" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">
                        <input v-model="teamForm.logo" placeholder="Logo URL" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">
                        <div class="flex items-center"><input v-model="teamForm.national" type="checkbox" class="h-4 w-4"><label class="ml-2 text-white">National Team</label></div>
                        <div v-if="teamForm.processedImageUrl" class="mt-2">
                            <label class="block text-sm font-medium text-neutral-400 mb-1">Processed Image URL</label>
                            <input
                                :value="teamForm.processedImageUrl"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-neutral-400 cursor-not-allowed"
                                readonly
                            />
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" @click="closeDialog" class="px-4 py-2 bg-neutral-700 text-white rounded-md">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md" :disabled="formLoading">{{ formLoading ? 'Saving...' : 'Save' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Sync Dialog -->
        <div v-if="showSyncDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
             <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg">
                <div class="p-6 border-b border-neutral-700"><h3 class="text-lg font-medium text-white">Sync Teams from API</h3></div>
                <div class="p-6">
                    <form @submit.prevent="runSync" class="space-y-4">
                        <select v-model="syncForm.settingId" class="w-full px-3 py-2 bg-neutral-700 rounded-md text-white" required>
                            <option value="">Select API Configuration</option>
                            <option v-for="setting in apiSettings" :key="setting.id" :value="setting.id">{{ setting.name }}</option>
                        </select>
                        <div class="grid grid-cols-2 gap-4">
                            <input v-model="syncForm.params.country" placeholder="Country Name" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                            <input v-model="syncForm.params.search" placeholder="Search Term" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                            <input v-model="syncForm.params.id" placeholder="Team ID" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                            <input v-model="syncForm.params.name" placeholder="Exact Team Name" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                            <input v-model="syncForm.params.code" placeholder="Team Code" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                            <input v-model="syncForm.params.venue" placeholder="Venue ID" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                            <input v-model="syncForm.params.league" placeholder="League ID" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                            <input v-model="syncForm.params.season" placeholder="Season Year" class="px-3 py-2 bg-neutral-700 rounded-md text-white">
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" @click="closeSyncDialog" class="px-4 py-2 bg-neutral-600 text-white rounded-md">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md" :disabled="syncLoading">{{ syncLoading ? 'Syncing...' : 'Sync Now' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog :show="showDeleteDialog" :item-name="teamToDelete?.name" @confirm="deleteTeam" @cancel="closeDeleteDialog" />
        <ToastNotification :show="notification.show" :message="notification.message" :type="notification.type" @close="notification.show = false"/>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useOddsClient } from '../client';
import Pagination from '@cmmv/blog/admin/components/Pagination.vue';
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue';
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue';

const oddsClient = useOddsClient();

const teams = ref([]);
const countries = ref([]);
const venues = ref([]);
const apiSettings = ref([]);
const loading = ref(true);
const refreshing = ref(false);
const error = ref(null);

const countriesMap = computed(() => Object.fromEntries(countries.value.map(c => [c.id, c])));
const venuesMap = computed(() => Object.fromEntries(venues.value.map(v => [v.id, v])));

const showDialog = ref(false);
const isEditing = ref(false);
const teamForm = ref({});
const teamToDelete = ref(null);
const formLoading = ref(false);
const showDeleteDialog = ref(false);

const showSyncDialog = ref(false);
const syncLoading = ref(false);
const syncForm = ref({
    settingId: '',
    params: { id: '', name: '', country: '', code: '', venue: '', league: '', season: '', search: '' }
});
const syncProgress = ref(null);
let progressInterval = null;

const processingAllImages = ref(false);
const imageProgress = ref({ total: 0, processed: 0, failed: 0, status: 'idle' });
let imageProgressPollInterval = null;

const notification = ref({ show: false, message: '', type: 'success' });

const pagination = ref({ current: 1, lastPage: 1, perPage: 10, total: 0, from: 0, to: 0 });
const filters = ref({ search: '', searchField: 'name', sortBy: 'name', sortOrder: 'asc', page: 1 });
const showSearchDropdown = ref(false);
const searchInput = ref(null);

const loadTeams = async () => {
    loading.value = true;
    error.value = null;
    try {
        const apiFilters = {
            limit: pagination.value.perPage.toString(),
            offset: ((filters.value.page - 1) * pagination.value.perPage).toString(),
            search: filters.value.search,
            searchField: filters.value.searchField
        };

        const response = await oddsClient.teams.get(apiFilters);

        if (response && response.data) {
            teams.value = response.data;

            const paginationData = response.pagination || {};
            const totalCount = response.count || 0;
            const currentOffset = paginationData.offset || 0;
            const currentLimit = paginationData.limit || 10;

            const currentPage = Math.floor(currentOffset / currentLimit) + 1;
            const lastPage = Math.ceil(totalCount / currentLimit);

            pagination.value = {
                current: currentPage,
                lastPage: lastPage,
                perPage: currentLimit,
                total: totalCount,
                from: currentOffset + 1,
                to: Math.min(currentOffset + currentLimit, totalCount)
            };
        } else {
            teams.value = [];
            pagination.value = { current: 1, lastPage: 1, perPage: 10, total: 0, from: 0, to: 0 };
        }
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const loadInitialData = async () => {
    await Promise.all([
        loadTeams(),
        oddsClient.countries.get({ limit: 10000 }).then(res => countries.value = res.data),
        oddsClient.venues.get({ limit: 10000 }).then(res => venues.value = res.data),
        oddsClient.settings.get({}).then(res => apiSettings.value = res.data),
    ]);
};

const refreshData = async () => {
    refreshing.value = true;
    await loadTeams();
    refreshing.value = false;
};

const handlePageChange = (page) => {
    filters.value.page = page;
};

watch(filters, loadTeams, { deep: true });

const openAddDialog = () => {
    isEditing.value = false;
    teamForm.value = { name: '', code: '', country_id: '', founded: null, national: false, logo: '', venue_id: '', imageProcessed: false, processedImageUrl: '' };
    showDialog.value = true;
};

const openEditDialog = (team) => {
    isEditing.value = true;
    teamForm.value = { ...team };
    showDialog.value = true;
};

const closeDialog = () => showDialog.value = false;

const saveTeam = async () => {
    formLoading.value = true;
    try {
        if (isEditing.value) {
            await oddsClient.teams.update(teamForm.value.id, teamForm.value);
        } else {
            await oddsClient.teams.insert(teamForm.value);
        }
        showNotification('success', `Team ${isEditing.value ? 'updated' : 'created'}.`);
        closeDialog();
        loadTeams();
    } catch (err) {
        showNotification('error', err.message);
    } finally {
        formLoading.value = false;
    }
};

const confirmDelete = (team) => {
    teamToDelete.value = team;
    showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
    teamToDelete.value = null;
    showDeleteDialog.value = false;
};

const deleteTeam = async () => {
    if (!teamToDelete.value) return;
    try {
        await oddsClient.teams.delete(teamToDelete.value.id);
        showNotification('success', 'Team deleted.');
        closeDeleteDialog();
        loadTeams();
    } catch (err) {
        showNotification('error', err.message);
    }
};

const openSyncDialog = () => showSyncDialog.value = true;
const closeSyncDialog = () => showSyncDialog.value = false;

const runSync = async () => {
    syncLoading.value = true;
    syncProgress.value = null;
    try {
        const response = await oddsClient.teams.sync(syncForm.value.settingId, syncForm.value.params);
        if (response.syncId) {
            closeSyncDialog();
            showNotification('success', 'Sync started...');
            trackSyncProgress(response.syncId);
        } else {
            throw new Error(response.message || "Failed to start sync.");
        }
    } catch (err) {
        showNotification('error', err.message);
    } finally {
        syncLoading.value = false;
    }
};

const trackSyncProgress = (syncId) => {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(async () => {
        try {
            const progress = await oddsClient.teams.getSyncProgress(syncId);
            if (progress && !progress.error) {
                syncProgress.value = progress;
                if (progress.status === 'completed' || progress.status === 'error') {
                    clearInterval(progressInterval);
                    progressInterval = null;
                    showNotification(progress.status === 'completed' ? 'success' : 'error', `Sync ${progress.status}.`);
                    if (progress.status === 'completed') refreshData();
                }
            } else {
                clearInterval(progressInterval);
            }
        } catch (err) {
            clearInterval(progressInterval);
            showNotification('error', "Failed to track sync progress.");
        }
    }, 2000);
};

const processImage = async (team) => {
    try {
        const result = await oddsClient.teams.processImage(team.id);
        if (result && result.success) {
            showNotification('success', `Image processed for ${team.name}`);
            refreshData();
        } else {
            showNotification('error', result.message || 'Failed to process image');
        }
    } catch (err) {
        showNotification('error', err.message || 'An unexpected error occurred');
    }
};

const processAllImages = async () => {
    processingAllImages.value = true;
    imageProgress.value = { total: 0, processed: 0, failed: 0, status: 'starting' };
    showNotification('info', 'Starting batch processing of all team logos...', 5000);

    try {
        const { jobId } = await oddsClient.teams.startProcessAllImages();
        if (!jobId) throw new Error("Failed to start processing job.");

        imageProgressPollInterval = setInterval(async () => {
            try {
                const status = await oddsClient.teams.getProcessAllImagesStatus(jobId);
                if (status) {
                    imageProgress.value = { ...status };
                    if (status.status === 'completed' || status.status === 'error') {
                        clearInterval(imageProgressPollInterval);
                        processingAllImages.value = false;
                        const message = status.status === 'completed'
                            ? `Processing complete! ${status.processed} images processed, ${status.failed} failed.`
                            : 'An error occurred during image processing.';
                        showNotification(status.status === 'completed' ? 'success' : 'error', message, 5000);
                        refreshData();
                    }
                }
            } catch (err) {
                clearInterval(imageProgressPollInterval);
                processingAllImages.value = false;
                showNotification('error', 'Failed to get image processing status.');
            }
        }, 2000);
    } catch (err) {
        showNotification('error', err.message || 'Failed to start image processing job');
        processingAllImages.value = false;
    }
};

const showNotification = (type, message) => {
    notification.value = { show: true, type, message };
    setTimeout(() => notification.value.show = false, 3000);
};

const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value;
    if (showSearchDropdown.value) nextTick(() => searchInput.value?.focus());
};

onBeforeUnmount(() => {
    if (progressInterval) clearInterval(progressInterval);
    if(imageProgressPollInterval) clearInterval(imageProgressPollInterval);
});

onMounted(loadInitialData);
</script>
