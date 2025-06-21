<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Venues</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span v-if="refreshing">Refreshing...</span>
                    <span v-else>Refresh</span>
                </button>
                <div class="relative">
                    <button @click="toggleSearchDropdown" data-search-toggle
                        class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center relative">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                        <span v-if="filters.search.trim()" class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full" title="Search filter active"></span>
                    </button>
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-2">
                            <div class="relative">
                                <input v-model="filters.search" type="text" placeholder="Search venues..." class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" @keydown.esc="showSearchDropdown = false" ref="searchInput">
                                <button v-if="filters.search.trim()" @click="clearSearch" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white" title="Clear search">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div>
                                <label class="block text-xs text-neutral-400 mb-1">Search in field:</label>
                                <select v-model="filters.searchField" class="bg-neutral-700 w-full h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="name">Name</option>
                                    <option value="city">City</option>
                                    <option value="external_id">External ID</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Venue
                </button>
                <button @click="openSyncDialog" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Sync from API
                </button>
                <button @click="openSyncAllDialog" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                    Sync All Countries
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
                <span>Processing Venue Images...</span>
                <span>{{ imageProgress.processed }} / {{ imageProgress.total }}</span>
            </div>
            <div class="w-full bg-neutral-700 rounded-full h-2.5">
                <div class="bg-teal-600 h-2.5 rounded-full" :style="{ width: `${(imageProgress.processed / imageProgress.total) * 100}%` }"></div>
            </div>
            <div v-if="imageProgress.failed > 0" class="text-xs text-red-400">
                {{ imageProgress.failed }} images failed to process.
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading venues...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <p class="text-neutral-300 mb-2">Failed to load venues</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">Try Again</button>
        </div>

        <!-- Empty state -->
        <div v-else-if="venues.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <p class="text-neutral-300 mb-2">No venues found</p>
        </div>

        <!-- Venues table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Image</th>
                            <th @click="toggleSort('name')" scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white">Name</th>
                            <th @click="toggleSort('city')" scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white">City</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Country</th>
                            <th @click="toggleSort('capacity')" scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white">Capacity</th>
                            <th @click="toggleSort('surface')" scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white">Surface</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="venue in venues" :key="venue.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <div class="flex items-center space-x-2">
                                    <img v-if="venue.processedImageUrl || venue.image" :src="venue.processedImageUrl || venue.image" :alt="venue.name" class="w-16 h-10 object-cover rounded border border-neutral-600">
                                    <div v-else class="w-16 h-10 bg-neutral-600 rounded"></div>
                                    <button
                                        v-if="venue.image && !venue.imageProcessed"
                                        @click="processImage(venue)"
                                        title="Process image"
                                        class="text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ venue.name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ venue.city }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                                <div v-if="venue.country_id && countriesMap[venue.country_id]" class="flex items-center">
                                    <img :src="countriesMap[venue.country_id].flag" :alt="countriesMap[venue.country_id].name" class="w-6 h-4 mr-2 rounded-sm border border-neutral-600 object-cover">
                                    <span>{{ countriesMap[venue.country_id].name }}</span>
                                </div>
                                <span v-else>N/A</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ venue.capacity?.toLocaleString() }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 capitalize">{{ venue.surface }}</td>
                             <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button @click="openEditDialog(venue)" title="Edit" class="text-neutral-400 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button @click="confirmDelete(venue)" title="Delete" class="text-neutral-400 hover:text-red-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <Pagination :pagination="pagination" itemName="venues" @pageChange="handlePageChange" />

        <!-- Add/Edit Venue Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Venue' : 'Add Venue' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6 max-h-[70vh] overflow-y-auto">
                    <form @submit.prevent="saveVenue">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div>
                                    <label for="venueName" class="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                                    <input id="venueName" v-model="venueForm.name" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required />
                                </div>
                                <div>
                                    <label for="venueExternalId" class="block text-sm font-medium text-neutral-300 mb-1">External ID</label>
                                    <input id="venueExternalId" v-model.number="venueForm.external_id" type="number" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                 <div>
                                    <label for="venueCountryId" class="block text-sm font-medium text-neutral-300 mb-1">Country</label>
                                    <select id="venueCountryId" v-model="venueForm.country_id" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white">
                                        <option value="">Select a country</option>
                                        <option v-for="country in countries" :key="country.id" :value="country.id">{{ country.name }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="venueCity" class="block text-sm font-medium text-neutral-300 mb-1">City</label>
                                    <input id="venueCity" v-model="venueForm.city" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div>
                                    <label for="venueAddress" class="block text-sm font-medium text-neutral-300 mb-1">Address</label>
                                    <input id="venueAddress" v-model="venueForm.address" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div>
                                    <label for="venueCapacity" class="block text-sm font-medium text-neutral-300 mb-1">Capacity</label>
                                    <input id="venueCapacity" v-model.number="venueForm.capacity" type="number" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div>
                                    <label for="venueSurface" class="block text-sm font-medium text-neutral-300 mb-1">Surface</label>
                                    <input id="venueSurface" v-model="venueForm.surface" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div>
                                    <label for="venueImage" class="block text-sm font-medium text-neutral-300 mb-1">Image URL</label>
                                    <input id="venueImage" v-model="venueForm.image" type="url" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                     <div v-if="venueForm.image" class="mt-2">
                                        <p class="text-xs text-neutral-400 mb-1">Preview:</p>
                                        <img
                                            :src="venueForm.processedImageUrl || venueForm.image"
                                            :alt="`${venueForm.name} image preview`"
                                            class="w-24 h-16 object-cover rounded border border-neutral-600"
                                        >
                                    </div>
                                </div>
                                <div v-if="venueForm.processedImageUrl" class="mt-4">
                                    <label for="processedImageUrl" class="block text-sm font-medium text-neutral-300 mb-1">Processed Image URL</label>
                                    <input
                                        id="processedImageUrl"
                                        :value="venueForm.processedImageUrl"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-neutral-400 cursor-not-allowed"
                                        readonly
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" @click="closeDialog" class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors" :disabled="formLoading">
                                <span v-if="formLoading">Saving...</span>
                                <span v-else>{{ isEditing ? 'Update' : 'Create' }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog :show="showDeleteDialog" :item-name="venueToDelete?.name" :loading="deleteLoading" message="Are you sure you want to delete this venue?" @confirm="deleteVenue" @cancel="closeDeleteDialog" />

        <!-- Sync from API Dialog -->
        <div v-if="showSyncDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Sync Venues from API</h3>
                    <button @click="closeSyncDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="runSync">
                        <div class="space-y-4">
                            <div>
                                <label for="apiSetting" class="block text-sm font-medium text-neutral-300 mb-1">API Configuration</label>
                                <select id="apiSetting" v-model="syncForm.settingId" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                                    <option disabled value="">Select a configuration</option>
                                    <option v-for="setting in apiSettings" :key="setting.id" :value="setting.id">{{ setting.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label for="apiEndpoint" class="block text-sm font-medium text-neutral-300 mb-1">API Endpoint</label>
                                <input id="apiEndpoint" v-model="syncForm.endpoint" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white font-mono" placeholder="/venues" required />
                            </div>
                            <div>
                                <label for="syncCountry" class="block text-sm font-medium text-neutral-300 mb-1">Country (Optional)</label>
                                <input id="syncCountry" v-model="syncForm.country" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="e.g. England" />
                                <p class="text-xs text-neutral-400 mt-1">Filter venues by country name.</p>
                            </div>
                            <div>
                                <label for="syncSearch" class="block text-sm font-medium text-neutral-300 mb-1">Search Term (Optional)</label>
                                <input id="syncSearch" v-model="syncForm.search" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="e.g. stadium" />
                                <p class="text-xs text-neutral-400 mt-1">Search for venues by name, city or country.</p>
                            </div>
                            <div>
                                <label for="syncId" class="block text-sm font-medium text-neutral-300 mb-1">Venue ID (Optional)</label>
                                <input id="syncId" v-model.number="syncForm.id" type="number" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="e.g. 556" />
                                <p class="text-xs text-neutral-400 mt-1">Get a specific venue by ID.</p>
                            </div>
                            <div>
                                <label for="syncName" class="block text-sm font-medium text-neutral-300 mb-1">Venue Name (Optional)</label>
                                <input id="syncName" v-model="syncForm.name" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="e.g. Old Trafford" />
                                <p class="text-xs text-neutral-400 mt-1">Get a specific venue by exact name.</p>
                            </div>
                            <div>
                                <label for="syncCity" class="block text-sm font-medium text-neutral-300 mb-1">City (Optional)</label>
                                <input id="syncCity" v-model="syncForm.city" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="e.g. Manchester" />
                                <p class="text-xs text-neutral-400 mt-1">Filter venues by city.</p>
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" @click="closeSyncDialog" class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors" :disabled="syncLoading">
                                <span v-if="syncLoading">Syncing...</span>
                                <span v-else>Sync Now</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Sync All Countries Dialog -->
        <div v-if="showSyncAllDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Sync Venues from All Countries</h3>
                    <button @click="closeSyncAllDialog" class="text-neutral-400 hover:text-white" :disabled="syncAllLoading">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6">
                    <div v-if="!syncInProgress">
                        <form @submit.prevent="runSyncAllCountries">
                            <div class="space-y-4">
                                <div>
                                    <label for="apiSettingAll" class="block text-sm font-medium text-neutral-300 mb-1">API Configuration</label>
                                    <select id="apiSettingAll" v-model="syncAllForm.settingId" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                                        <option disabled value="">Select a configuration</option>
                                        <option v-for="setting in apiSettings" :key="setting.id" :value="setting.id">{{ setting.name }}</option>
                                    </select>
                                </div>
                                <div class="bg-yellow-800/30 p-4 rounded-md">
                                    <p class="text-yellow-300 text-sm mb-2 font-medium">⚠️ Warning</p>
                                    <p class="text-neutral-300 text-sm">This operation will sync venues from all countries in your database. It may take a long time and make many API requests. Make sure you have enough API quota available.</p>
                                </div>
                            </div>
                            <div class="flex justify-end space-x-3 mt-6">
                                <button type="button" @click="closeSyncAllDialog" class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">Cancel</button>
                                <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors" :disabled="syncAllLoading">
                                    <span v-if="syncAllLoading">Starting...</span>
                                    <span v-else>Sync All Countries</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Progress display -->
                    <div v-else class="space-y-6">
                        <div class="space-y-2">
                            <div class="flex justify-between items-center text-sm mb-1">
                                <span class="text-neutral-300">Progress:</span>
                                <span class="text-white font-medium">{{ syncProgress.percentage }}%</span>
                            </div>
                            <div class="w-full bg-neutral-700 rounded-full h-2.5">
                                <div class="bg-purple-600 h-2.5 rounded-full" :style="`width: ${syncProgress.percentage}%`"></div>
                            </div>
                        </div>
                        
                        <div class="bg-neutral-700/50 rounded-lg p-4 space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-neutral-400">Current country:</span>
                                <span class="text-white">{{ syncProgress.currentCountry }}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-neutral-400">Countries processed:</span>
                                <span class="text-white">{{ syncProgress.processedCountries }} / {{ syncProgress.totalCountries }}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-neutral-400">Venues created:</span>
                                <span class="text-white">{{ syncProgress.totalCreated }}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-neutral-400">Venues updated:</span>
                                <span class="text-white">{{ syncProgress.totalUpdated }}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-neutral-400">Status:</span>
                                <span :class="statusColor">{{ statusText }}</span>
                            </div>
                        </div>
                        
                        <div v-if="syncProgress.status === 'error'" class="bg-red-900/30 border border-red-800 rounded-lg p-4">
                            <p class="text-red-300 text-sm">Error: {{ syncProgress.error }}</p>
                        </div>
                        
                        <div class="flex justify-end space-x-3 mt-6">
                            <button 
                                v-if="syncProgress.status !== 'running'" 
                                @click="closeSyncAllDialog" 
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                v-if="syncProgress.status === 'completed'" 
                                @click="refreshData(); closeSyncAllDialog()" 
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                            >
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <ToastNotification :show="notification.show" :message="notification.message" :type="notification.type" :duration="notification.duration" @close="notification.show = false"/>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed, onBeforeUnmount } from 'vue'
import { useOddsClient } from '../client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'

const oddsClient = useOddsClient();

const venues = ref([]);
const loading = ref(true);
const error = ref(null);
const refreshing = ref(false);

const showDialog = ref(false);
const isEditing = ref(false);
const venueForm = ref({});
const venueToEdit = ref(null);
const formLoading = ref(false);

const showDeleteDialog = ref(false);
const venueToDelete = ref(null);
const deleteLoading = ref(false);

const showSyncDialog = ref(false);
const syncLoading = ref(false);
const apiSettings = ref([]);
const syncForm = ref({
    settingId: '',
    endpoint: '/venues',
    country: '',
    search: '',
    id: null,
    name: '',
    city: ''
});

const showSyncAllDialog = ref(false);
const syncAllLoading = ref(false);
const syncAllForm = ref({
    settingId: ''
});

// Image processing progress
const processingAllImages = ref(false);
const imageProgress = ref({ total: 0, processed: 0, failed: 0, status: 'idle' });
let imageProgressPollInterval = null;

// Variáveis para acompanhar o progresso da sincronização
const syncInProgress = ref(false);
const currentSyncId = ref(null);
const syncProgressEventSource = ref(null);
const syncProgress = ref({
    totalCountries: 0,
    processedCountries: 0,
    currentCountry: '',
    totalCreated: 0,
    totalUpdated: 0,
    status: 'running',
    percentage: 0,
    error: null
});

// Texto e cor do status formatados
const statusText = computed(() => {
    switch (syncProgress.value.status) {
        case 'running': return 'Running';
        case 'completed': return 'Completed';
        case 'error': return 'Error';
        default: return 'Unknown';
    }
});

const statusColor = computed(() => {
    switch (syncProgress.value.status) {
        case 'running': return 'text-blue-300';
        case 'completed': return 'text-green-300';
        case 'error': return 'text-red-300';
        default: return 'text-white';
    }
});

const notification = ref({ show: false, type: 'success', message: '', duration: 3000 });
const pagination = ref({ current: 1, lastPage: 1, perPage: 50, total: 0, from: 1, to: 50 });
const filters = ref({ search: '', searchField: 'name', sortBy: 'name', sortOrder: 'asc', page: 1 });
const showSearchDropdown = ref(false);
const searchInput = ref(null);

const countries = ref([]);
const countriesMap = computed(() => Object.fromEntries(countries.value.map(c => [c.id, c])));

const fetchCountries = async () => {
    try {
        const response = await oddsClient.countries.get({ limit: 10000, offset: 0 });
        if (response && response.data) {
            countries.value = response.data;
        }
    } catch (err) {
        console.error("Failed to load countries", err);
        showNotification('error', 'Could not load countries.');
    }
};

function toggleSearchDropdown() {
    showSearchDropdown.value = !showSearchDropdown.value
    if (showSearchDropdown.value) {
        nextTick(() => searchInput.value?.focus());
    }
}

function clearSearch() {
    filters.value.search = '';
    loadVenues();
    showSearchDropdown.value = false;
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        filters.value.sortBy = column;
        filters.value.sortOrder = 'asc';
    }
};

const showNotification = (type, message) => {
    notification.value = { show: true, type, message, duration: 3000 };
};

const loadVenues = async () => {
    loading.value = true;
    error.value = null;
    try {
        const apiFilters = {
            limit: pagination.value.perPage.toString(),
            offset: ((filters.value.page - 1) * pagination.value.perPage).toString(),
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder,
        };
        if (filters.value.search) {
            apiFilters.search = filters.value.search;
            apiFilters.searchField = filters.value.searchField;
        }
        
        const response = await oddsClient.venues.get(apiFilters);
        if (response && response.data) {
            venues.value = response.data;
            const { pagination: paginationData, count: totalCount } = response;
            const { offset = 0, limit = 50 } = paginationData || {};
            pagination.value = {
                current: Math.floor(offset / limit) + 1,
                lastPage: Math.ceil(totalCount / limit),
                perPage: limit,
                total: totalCount,
                from: offset + 1,
                to: Math.min(offset + limit, totalCount)
            };
        } else {
            venues.value = [];
        }
    } catch (err) {
        error.value = err.message || 'Failed to load venues';
        showNotification('error', 'Failed to load venues');
    } finally {
        loading.value = false;
    }
};

const refreshData = async () => {
    if (refreshing.value) return;
    refreshing.value = true;
    await loadVenues();
    refreshing.value = false;
};

const handlePageChange = (newPage) => {
    filters.value.page = newPage;
};

watch(filters, loadVenues, { deep: true });

const resetVenueForm = () => {
    venueForm.value = {
        name: '',
        external_id: null,
        address: '',
        city: '',
        country_id: '',
        capacity: null,
        surface: '',
        image: '',
        imageProcessed: false,
        processedImageUrl: ''
    };
};

const openAddDialog = () => {
    isEditing.value = false;
    resetVenueForm();
    showDialog.value = true;
};

const openEditDialog = (venue) => {
    isEditing.value = true;
    venueToEdit.value = venue;
    venueForm.value = { ...venue };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
};

const saveVenue = async () => {
    formLoading.value = true;
    try {
        const dataToSave = { ...venueForm.value };

        if (isEditing.value) {
            await oddsClient.venues.update(venueToEdit.value.id, dataToSave);
            showNotification('success', `Venue ${venueToEdit.value.name} updated.`);
        } else {
            await oddsClient.venues.insert(dataToSave);
            showNotification('success', `Venue ${dataToSave.name} created.`);
        }
        closeDialog();
        refreshData();
    } catch (err) {
        showNotification('error', err.message || 'Failed to save venue.');
    } finally {
        formLoading.value = false;
    }
};

const confirmDelete = (venue) => {
    venueToDelete.value = venue;
    showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
    showDeleteDialog.value = false;
};

const deleteVenue = async () => {
    if (!venueToDelete.value) return;
    deleteLoading.value = true;
    try {
        await oddsClient.venues.delete(venueToDelete.value.id);
        showNotification('success', `Venue ${venueToDelete.value.name} deleted.`);
        closeDeleteDialog();
        refreshData();
    } catch (err) {
        showNotification('error', err.message || 'Failed to delete venue');
    } finally {
        deleteLoading.value = false;
    }
};

const fetchApiSettings = async () => {
    try {
        const response = await oddsClient.settings.get({});
        if (response && response.data) {
            apiSettings.value = response.data;
        }
    } catch (err) {
        showNotification('error', 'Failed to load API settings.');
    }
};

const openSyncDialog = () => {
    fetchApiSettings();
    syncForm.value.settingId = '';
    showSyncDialog.value = true;
};

const closeSyncDialog = () => showSyncDialog.value = false;

const runSync = async () => {
    const { settingId, endpoint, country, search, id, name, city } = syncForm.value;
    if (!settingId || !endpoint) {
        showNotification('error', 'Please select a configuration and provide an endpoint.');
        return;
    }
    syncLoading.value = true;
    try {
        const result = await oddsClient.venues.sync(settingId, endpoint, country, search, id, name, city);
        showNotification('success', result.message || 'Synchronization completed.');
        closeSyncDialog();
        refreshData();
    } catch (err) {
        showNotification('error', err.message || 'Failed to start synchronization.');
    } finally {
        syncLoading.value = false;
    }
};

const openSyncAllDialog = () => {
    fetchApiSettings();
    syncAllForm.value.settingId = '';
    syncInProgress.value = false;
    showSyncAllDialog.value = true;
};

const closeSyncAllDialog = () => {
    // Se houver uma conexão SSE ativa, feche-a
    if (syncProgressEventSource.value) {
        syncProgressEventSource.value.close();
        syncProgressEventSource.value = null;
    }
    
    showSyncAllDialog.value = false;
};

const runSyncAllCountries = async () => {
    const { settingId } = syncAllForm.value;
    if (!settingId) {
        showNotification('error', 'Please select a configuration.');
        return;
    }
    
    syncAllLoading.value = true;
    
    try {
        const result = await oddsClient.venues.syncAllCountries(settingId);
        
        if (result && result.syncId) {
            syncInProgress.value = true;
            currentSyncId.value = result.syncId;
            startProgressMonitoring(result.syncId);
        } else {
            showNotification('error', 'Failed to start synchronization: No sync ID returned');
        }
    } catch (err) {
        showNotification('error', err.message || 'Failed to start synchronization.');
        syncAllLoading.value = false;
    }
};

const startProgressMonitoring = (syncId) => {
    // Primeiro, buscar o status inicial
    oddsClient.venues.getSyncProgress(syncId)
        .then(progress => {
            syncProgress.value = progress;
            
            // Iniciar o monitoramento em tempo real
            syncProgressEventSource.value = oddsClient.venues.getSyncProgressStream(syncId);
            
            syncProgressEventSource.value.onmessage = (event) => {
                const data = JSON.parse(event.data);
                syncProgress.value = data;
                
                // Se o processo terminou, podemos fechar a conexão SSE
                if (data.status === 'completed' || data.status === 'error') {
                    syncAllLoading.value = false;
                    
                    if (data.status === 'completed') {
                        showNotification('success', `Synchronization completed. Created: ${data.totalCreated}, Updated: ${data.totalUpdated}`);
                    } else if (data.status === 'error') {
                        showNotification('error', `Synchronization failed: ${data.error}`);
                    }
                    
                    // Manter a conexão aberta por mais alguns segundos para garantir que recebemos todas as atualizações
                    setTimeout(() => {
                        if (syncProgressEventSource.value) {
                            syncProgressEventSource.value.close();
                            syncProgressEventSource.value = null;
                        }
                    }, 5000);
                }
            };
            
            syncProgressEventSource.value.onerror = () => {
                console.error('SSE connection error');
                // Tentar reconectar ou mostrar erro
                if (syncProgressEventSource.value) {
                    syncProgressEventSource.value.close();
                    syncProgressEventSource.value = null;
                }
                syncAllLoading.value = false;
            };
        })
        .catch(err => {
            console.error('Failed to get initial progress', err);
            syncAllLoading.value = false;
            showNotification('error', 'Failed to monitor synchronization progress.');
        });
};

const processImage = async (venue) => {
    try {
        const result = await oddsClient.venues.processImage(venue.id);
        if (result && result.success) {
            showNotification('success', `Image processed for ${venue.name}`);
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
    showNotification('info', 'Starting batch processing of all venue images...', 5000);

    try {
        const { jobId } = await oddsClient.venues.startProcessAllImages();
        if (!jobId) throw new Error("Failed to start processing job.");

        imageProgressPollInterval = setInterval(async () => {
            try {
                const status = await oddsClient.venues.getProcessAllImagesStatus(jobId);
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

// Limpar recursos ao desmontar o componente
onBeforeUnmount(() => {
    if (syncProgressEventSource.value) {
        syncProgressEventSource.value.close();
        syncProgressEventSource.value = null;
    }
    if(imageProgressPollInterval) {
        clearInterval(imageProgressPollInterval);
    }
});

onMounted(() => {
    loadVenues();
    fetchCountries();
});
</script> 