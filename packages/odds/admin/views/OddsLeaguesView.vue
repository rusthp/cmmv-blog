<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Leagues</h1>
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
                                <input v-model="filters.search" type="text" placeholder="Search leagues..." class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" @keydown.esc="showSearchDropdown = false" ref="searchInput">
                                <button v-if="filters.search.trim()" @click="clearSearch" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white" title="Clear search">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div>
                                <label class="block text-xs text-neutral-400 mb-1">Search in field:</label>
                                <select v-model="filters.searchField" class="bg-neutral-700 w-full h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="name">Name</option>
                                    <option value="external_id">External ID</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="relative">
                    <button @click="toggleYearFilterDropdown" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center relative">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Year
                        <span v-if="filters.year" class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full" title="Year filter active"></span>
                    </button>
                    <div v-if="showYearFilterDropdown" class="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-2">
                            <input v-model.number="filters.year" type="number" placeholder="Enter year..." @keydown.enter="toggleYearFilterDropdown" ref="yearInput" class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-2 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            <button @click="clearYearFilter" class="w-full text-center px-2 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors">
                                Clear Filter
                            </button>
                        </div>
                    </div>
                </div>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add League
                </button>
                <button @click="openSyncDialog" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Sync from API
                </button>
                <button
                    @click="processAllLogos"
                    class="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                    :disabled="processingAllLogos"
                >
                    <svg v-if="!processingAllLogos" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <svg v-else class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ processingAllLogos ? 'Processing...' : 'Process All Logos' }}
                </button>
            </div>
        </div>

        <!-- Progress Bar -->
        <div v-if="processingAllLogos && progress.total > 0" class="bg-neutral-800 rounded-lg p-4 space-y-2">
            <div class="flex justify-between text-sm font-medium text-neutral-300">
                <span>Processing Logos...</span>
                <span>{{ progress.processed }} / {{ progress.total }}</span>
            </div>
            <div class="w-full bg-neutral-700 rounded-full h-2.5">
                <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${(progress.processed / progress.total) * 100}%` }"></div>
            </div>
            <div v-if="progress.failed > 0" class="text-xs text-red-400">
                {{ progress.failed }} items failed to process.
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading leagues...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <p class="text-neutral-300 mb-2">Failed to load leagues</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">Try Again</button>
        </div>

        <!-- Empty state -->
        <div v-else-if="leagues.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <p class="text-neutral-300 mb-2">No leagues found</p>
        </div>

        <!-- Leagues table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Logo</th>
                            <th @click="toggleSort('name')" scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white">
                                Name
                                <span v-if="filters.sortBy === 'name'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th @click="toggleSort('external_id')" scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white">
                                External ID
                                <span v-if="filters.sortBy === 'external_id'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Type</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Odds</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Year</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Start Date</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">End Date</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Current</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Country</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="league in leagues" :key="league.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <div class="flex items-center space-x-2">
                                    <img v-if="league.processedLogoUrl || league.logo" :src="league.processedLogoUrl || league.logo" :alt="`${league.name} logo`" class="w-8 h-8 object-contain rounded border border-neutral-600">
                                    <div v-else class="w-8 h-8 bg-neutral-600 rounded"></div>
                                    <button
                                        v-if="league.logo && !league.logoProcessed"
                                        @click="processLogo(league)"
                                        title="Process logo"
                                        class="text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ league.name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ league.external_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ league.type }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="league.odds ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'">
                                    {{ league.odds ? 'Yes' : 'No' }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ league.year }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ formatDate(league.start_date) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ formatDate(league.end_date) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="league.current ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'">
                                    {{ league.current ? 'Yes' : 'No' }}
                                </span>
                            </td>
                             <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                                <div v-if="league.country_id && countriesMap[league.country_id]" class="flex items-center">
                                    <img :src="countriesMap[league.country_id].flag" :alt="countriesMap[league.country_id].name" class="w-6 h-4 mr-2 rounded-sm border border-neutral-600 object-cover">
                                    <span>{{ countriesMap[league.country_id].name }}</span>
                                </div>
                                <span v-else-if="league.country_id" :title="league.country_id">{{ league.country_id.substring(0, 6) }}...</span>
                                <span v-else>N/A</span>
                            </td>
                             <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button @click="openEditDialog(league)" title="Edit" class="text-neutral-400 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button @click="confirmDelete(league)" title="Delete" class="text-neutral-400 hover:text-red-500 transition-colors">
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
        <Pagination :pagination="pagination" itemName="leagues" @pageChange="handlePageChange" />

        <!-- Add/Edit League Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit League' : 'Add League' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6 max-h-[70vh] overflow-y-auto">
                    <form @submit.prevent="saveLeague">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Left Column -->
                            <div class="space-y-4">
                                <div>
                                    <label for="leagueName" class="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                                    <input id="leagueName" v-model="leagueForm.name" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required />
                                </div>
                                <div>
                                    <label for="leagueExternalId" class="block text-sm font-medium text-neutral-300 mb-1">External ID</label>
                                    <input id="leagueExternalId" v-model.number="leagueForm.external_id" type="number" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div>
                                    <label for="leagueType" class="block text-sm font-medium text-neutral-300 mb-1">Type</label>
                                    <input id="leagueType" v-model="leagueForm.type" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div>
                                    <label for="leagueLogo" class="block text-sm font-medium text-neutral-300 mb-1">Logo URL</label>
                                    <input id="leagueLogo" v-model="leagueForm.logo" type="url" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                     <div v-if="leagueForm.logo" class="mt-2">
                                        <p class="text-xs text-neutral-400 mb-1">Preview:</p>
                                        <img
                                            :src="leagueForm.processedLogoUrl || leagueForm.logo"
                                            :alt="`${leagueForm.name} logo preview`"
                                            class="w-12 h-12 object-contain rounded border border-neutral-600"
                                        >
                                    </div>
                                </div>
                                <div v-if="leagueForm.processedLogoUrl" class="mt-4">
                                    <label for="processedLogoUrl" class="block text-sm font-medium text-neutral-300 mb-1">Processed Logo URL</label>
                                    <input
                                        id="processedLogoUrl"
                                        :value="leagueForm.processedLogoUrl"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-neutral-400 cursor-not-allowed"
                                        readonly
                                    />
                                </div>
                                <div>
                                    <label for="leagueCountryId" class="block text-sm font-medium text-neutral-300 mb-1">Country ID</label>
                                    <input id="leagueCountryId" v-model="leagueForm.country_id" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                            </div>
                            <!-- Right Column -->
                            <div class="space-y-4">
                                <div>
                                    <label for="leagueYear" class="block text-sm font-medium text-neutral-300 mb-1">Year</label>
                                    <input id="leagueYear" v-model.number="leagueForm.year" type="number" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div>
                                    <label for="leagueStartDate" class="block text-sm font-medium text-neutral-300 mb-1">Start Date</label>
                                    <input id="leagueStartDate" v-model="leagueForm.start_date" type="date" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div>
                                    <label for="leagueEndDate" class="block text-sm font-medium text-neutral-300 mb-1">End Date</label>
                                    <input id="leagueEndDate" v-model="leagueForm.end_date" type="date" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                                </div>
                                <div class="flex items-center space-x-4 pt-4">
                                    <div class="flex items-center">
                                        <input id="leagueOdds" v-model="leagueForm.odds" type="checkbox" class="h-4 w-4 bg-neutral-600 border-neutral-500 rounded text-blue-500 focus:ring-blue-500" />
                                        <label for="leagueOdds" class="ml-2 block text-sm text-neutral-300">Has Odds</label>
                                    </div>
                                    <div class="flex items-center">
                                        <input id="leagueCurrent" v-model="leagueForm.current" type="checkbox" class="h-4 w-4 bg-neutral-600 border-neutral-500 rounded text-blue-500 focus:ring-blue-500" />
                                        <label for="leagueCurrent" class="ml-2 block text-sm text-neutral-300">Is Current</label>
                                    </div>
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
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="leagueToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the league"
            warning-text="This action cannot be undone."
            loading-text="Deleting..."
            @confirm="deleteLeague"
            @cancel="closeDeleteDialog"
        />

        <!-- Sync from API Dialog -->
        <div v-if="showSyncDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Sync Leagues from API</h3>
                    <button @click="closeSyncDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="runSync">
                        <div class="space-y-4">
                            <div>
                                <label for="apiSetting" class="block text-sm font-medium text-neutral-300 mb-1">API Configuration</label>
                                <select id="apiSetting" v-model="syncForm.settingId" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                                    <option disabled value="">Select a configuration</option>
                                    <option v-for="setting in apiSettings" :key="setting.id" :value="setting.id">{{ setting.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label for="apiEndpoint" class="block text-sm font-medium text-neutral-300 mb-1">API Endpoint</label>
                                <input id="apiEndpoint" v-model="syncForm.endpoint" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="/leagues?current=true" required />
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" @click="closeSyncDialog" class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors" :disabled="syncLoading">
                                <span v-if="syncLoading" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Syncing...
                                </span>
                                <span v-else>Sync Now</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <ToastNotification :show="notification.show" :message="notification.message" :type="notification.type" :duration="notification.duration" @close="notification.show = false"/>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue'
import { useOddsClient } from '../client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'

const oddsClient = useOddsClient();

const leagues = ref([]);
const loading = ref(true);
const error = ref(null);
const refreshing = ref(false);

const showDialog = ref(false);
const isEditing = ref(false);
const leagueForm = ref({});
const leagueToEdit = ref(null);
const formLoading = ref(false);

const showDeleteDialog = ref(false);
const leagueToDelete = ref(null);
const deleteLoading = ref(false);

const showSyncDialog = ref(false);
const syncLoading = ref(false);
const apiSettings = ref([]);
const syncForm = ref({
    settingId: '',
    endpoint: '/leagues?current=true'
});

const notification = ref({ show: false, type: 'success', message: '', duration: 3000 });
const pagination = ref({ current: 1, lastPage: 1, perPage: 50, total: 0, from: 1, to: 50 });
const filters = ref({ search: '', searchField: 'name', sortBy: 'name', sortOrder: 'asc', page: 1, year: null });
const showSearchDropdown = ref(false);
const searchInput = ref(null);

const showYearFilterDropdown = ref(false);
const yearInput = ref(null);

const processingAllLogos = ref(false);
const progress = ref({ total: 0, processed: 0, failed: 0, status: 'idle' });
let progressPollInterval = null;

const countries = ref([]);
const countriesMap = computed(() => Object.fromEntries(countries.value.map(c => [c.id, c])));

const fetchCountries = async () => {
    try {
        const response = await oddsClient.countries.get({ limit: 10000, offset: 0 });
        if (response && response.data) {
            countries.value = response.data;
        }
    } catch (err) {
        console.error("Failed to load countries for flags", err);
        showNotification('error', 'Could not load country flags.');
    }
};

function toggleSearchDropdown() {
    showSearchDropdown.value = !showSearchDropdown.value
    if (showSearchDropdown.value) {
        nextTick(() => searchInput.value?.focus());
    }
}

function toggleYearFilterDropdown() {
    showYearFilterDropdown.value = !showYearFilterDropdown.value;
    if (showYearFilterDropdown.value) {
        nextTick(() => yearInput.value?.focus());
    }
}

function clearSearch() {
    filters.value.search = '';
    filters.value.page = 1;
    loadLeagues();
    showSearchDropdown.value = false;
}

function clearYearFilter() {
    filters.value.year = null;
    filters.value.page = 1;
    showYearFilterDropdown.value = false;
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        filters.value.sortBy = column;
        filters.value.sortOrder = 'asc';
    }
    filters.value.page = 1;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toISOString().split('T')[0];
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().slice(0, 10);
    } catch (e) {
        return '';
    }
};

const showNotification = (type, message) => {
    notification.value = { show: true, type, message, duration: 3000 };
};

const loadLeagues = async () => {
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
        if (filters.value.year) {
            apiFilters.year = filters.value.year.toString();
        }
        const response = await oddsClient.leagues.get(apiFilters);
        if (response && response.data) {
            leagues.value = response.data;
            const { pagination: paginationData, count: totalCount } = response;
            const { offset = 0, limit = 50 } = paginationData || {};
            const currentPage = Math.floor(offset / limit) + 1;
            pagination.value = {
                current: currentPage,
                lastPage: Math.ceil(totalCount / limit),
                perPage: limit,
                total: totalCount,
                from: offset + 1,
                to: Math.min(offset + limit, totalCount)
            };
        } else {
            leagues.value = [];
        }
    } catch (err) {
        error.value = err.message || 'Failed to load leagues';
        showNotification('error', 'Failed to load leagues');
    } finally {
        loading.value = false;
    }
};

const refreshData = async () => {
    if (refreshing.value) return;
    refreshing.value = true;
    await loadLeagues();
    refreshing.value = false;
};

const handlePageChange = (newPage) => {
    filters.value.page = newPage;
};

watch(filters, loadLeagues, { deep: true });

// Dialog Methods
const resetLeagueForm = () => {
    leagueForm.value = {
        name: '',
        external_id: null,
        type: '',
        logo: '',
        odds: false,
        year: new Date().getFullYear(),
        start_date: '',
        end_date: '',
        current: false,
        country_id: '',
        processedLogoUrl: '',
        logoProcessed: false
    };
};

const openAddDialog = () => {
    isEditing.value = false;
    resetLeagueForm();
    showDialog.value = true;
};

const openEditDialog = (league) => {
    isEditing.value = true;
    leagueToEdit.value = league;
    leagueForm.value = {
        ...league,
        start_date: formatDateForInput(league.start_date),
        end_date: formatDateForInput(league.end_date),
        processedLogoUrl: league.processedLogoUrl || '',
        logoProcessed: league.logoProcessed || false
    };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
};

const saveLeague = async () => {
    formLoading.value = true;
    try {
        const dataToSave = { ...leagueForm.value };

        if (isEditing.value) {
            await oddsClient.leagues.update(leagueToEdit.value.id, dataToSave);
            showNotification('success', `League ${leagueToEdit.value.name} updated.`);
        } else {
            await oddsClient.leagues.insert(dataToSave);
            showNotification('success', `League ${dataToSave.name} created.`);
        }
        closeDialog();
        refreshData();
    } catch (err) {
        showNotification('error', err.message || 'Failed to save league.');
    } finally {
        formLoading.value = false;
    }
};

// Delete Methods
const confirmDelete = (league) => {
    leagueToDelete.value = league;
    showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
    leagueToDelete.value = null;
    showDeleteDialog.value = false;
};

const deleteLeague = async () => {
    if (!leagueToDelete.value) return;
    deleteLoading.value = true;
    try {
        await oddsClient.leagues.delete(leagueToDelete.value.id);
        showNotification('success', `League ${leagueToDelete.value.name} deleted.`);
        closeDeleteDialog();
        refreshData();
    } catch (err) {
        showNotification('error', err.message || 'Failed to delete league');
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
    if (!syncForm.value.settingId || !syncForm.value.endpoint) {
        showNotification('error', 'Please select a configuration and provide an endpoint.');
        return;
    }
    syncLoading.value = true;
    try {
        const result = await oddsClient.leagues.sync(syncForm.value.settingId, syncForm.value.endpoint);
        showNotification('success', result.message || 'Synchronization completed.');
        closeSyncDialog();
        refreshData();
    } catch (err) {
        showNotification('error', err.message || 'Failed to start synchronization.');
    } finally {
        syncLoading.value = false;
    }
};

const processLogo = async (league) => {
    try {
        const result = await oddsClient.leagues.processLogo(league.id);

        if (result && result.success) {
            showNotification('success', `Logo processed for ${league.name}`);
            refreshData();
        } else {
            showNotification('error', result.message || 'Failed to process logo');
        }
    } catch (error) {
        showNotification('error', error.message || 'An unexpected error occurred');
    }
};

const processAllLogos = async () => {
    processingAllLogos.value = true;
    progress.value = { total: 0, processed: 0, failed: 0, status: 'starting' };
    showNotification('info', 'Starting batch processing of all logos...', 5000);

    try {
        const { jobId } = await oddsClient.leagues.startProcessAllLogos();

        if (!jobId) {
            throw new Error("Failed to start processing job.");
        }

        // Começar a verificar o progresso
        progressPollInterval = setInterval(async () => {
            try {
                const status = await oddsClient.leagues.getProcessAllLogosStatus(jobId);
                if(status) {
                    progress.value = {
                        total: status.total,
                        processed: status.processed,
                        failed: status.failed,
                        status: status.status
                    };

                    if (status.status === 'completed' || status.status === 'error') {
                        clearInterval(progressPollInterval);
                        processingAllLogos.value = false;
                        if (status.status === 'completed') {
                            showNotification('success', `Processing complete! ${status.processed} logos processed, ${status.failed} failed.`, 5000);
                        } else {
                            showNotification('error', 'An error occurred during processing.', 5000);
                        }
                        refreshData();
                    }
                }
            } catch (err) {
                clearInterval(progressPollInterval);
                processingAllLogos.value = false;
                showNotification('error', 'Failed to get processing status.');
            }
        }, 2000); // Poll every 2 seconds

    } catch (err) {
        console.error('Failed to start processing logos:', err);
        showNotification('error', err.message || 'Failed to start processing job');
        processingAllLogos.value = false;
    }
};

onMounted(() => {
    loadLeagues();
    fetchCountries();
});

onUnmounted(() => {
    if (progressPollInterval) {
        clearInterval(progressPollInterval);
    }
});
</script>