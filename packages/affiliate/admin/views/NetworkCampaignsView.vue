<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Advertisers</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
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
                                    placeholder="Search network campaigns..."
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
                <!-- Network filter dropdown -->
                <div class="relative">
                    <button @click="toggleNetworkDropdown" data-network-toggle
                        class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center relative">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Network
                        <!-- Indicator dot for active network filter -->
                        <span
                            v-if="filters.network"
                            class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full"
                            title="Network filter active">
                        </span>
                    </button>
                    <!-- Network dropdown -->
                    <div v-if="showNetworkDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-3">
                            <div v-if="loadingNetworks" class="flex items-center justify-center py-3">
                                <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                                <span class="text-neutral-400 text-sm">Loading networks...</span>
                            </div>
                            <div v-else-if="availableNetworks.length === 0" class="text-center py-3">
                                <span class="text-neutral-400 text-sm">No networks available</span>
                            </div>
                            <div v-else class="max-h-60 overflow-y-auto">
                                <div class="mb-2">
                                    <button
                                        @click="filters.network = ''; closeNetworkDropdown();"
                                        class="w-full px-3 py-2 text-left text-sm bg-neutral-700 hover:bg-neutral-600 text-white rounded-md flex items-center justify-between"
                                    >
                                        <span>All Networks</span>
                                        <svg v-if="!filters.network" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div class="space-y-1">
                                    <button
                                        v-for="network in availableNetworks"
                                        :key="network.id"
                                        @click="filters.network = network.id; closeNetworkDropdown();"
                                        class="w-full px-3 py-2 text-left text-sm bg-neutral-700 hover:bg-neutral-600 text-white rounded-md flex items-center justify-between"
                                    >
                                        <span>{{ network.name }}</span>
                                        <svg v-if="filters.network === network.id" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Advertisers
                </button>
                <div class="relative" data-more-actions-toggle>
                    <button
                        @click="toggleMoreActionsDropdown"
                        class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        More
                    </button>
                    <!-- More actions dropdown menu -->
                    <div v-if="showMoreActionsDropdown" class="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="py-1">
                            <button
                                @click="exportNetworkCampaigns"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                                :disabled="exportLoading"
                            >
                                <svg v-if="exportLoading" class="animate-spin h-3.5 w-3.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Advertisers
                            </button>
                            <button
                                @click="openImportFileDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Import Advertisers
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading advertisers...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load advertisers</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="networkCampaigns.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <p class="text-neutral-300 mb-2">No advertisers found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by importing advertisers from your affiliate networks</p>
            <div class="flex flex-wrap gap-3 justify-center">
                <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                    Add Manually
                </button>
                <button @click="importCampaigns" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                    Import Advertisers
                </button>
            </div>
        </div>

        <!-- Network Campaigns table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
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
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Network
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Campaign ID
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Campaign
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-36">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="campaign in networkCampaigns" :key="campaign.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="campaign.id">
                                {{ campaign.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ campaign.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                <span
                                    v-if="campaign.network"
                                    class="bg-neutral-700 text-xs rounded px-2 py-1"
                                >
                                    {{ getNetworkName(campaign.network) }}
                                </span>
                                <span v-else class="text-neutral-500 italic">
                                    No network
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ campaign.campaignId }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span v-if="campaignExistsInSystem(campaign)" class="bg-green-900 text-green-200 px-2 py-0.5 rounded text-xs">
                                    Exists
                                </span>
                                <span v-else class="bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded text-xs">
                                    Not created
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        v-if="!campaignExistsInSystem(campaign) && campaign.domain"
                                        @click="createSystemCampaign(campaign)"
                                        title="Create System Campaign"
                                        class="text-green-400 hover:text-green-300 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="openEditDialog(campaign)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(campaign)"
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
            itemName="advertisers"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Network Campaign Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Advertiser' : 'Add Advertiser' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveCampaign" class="max-h-[70vh] overflow-y-auto">
                        <div class="mb-4">
                            <label for="campaignName" class="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                            <input
                                id="campaignName"
                                v-model="campaignForm.name"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Campaign name"
                                required
                            />
                            <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="campaignId" class="block text-sm font-medium text-neutral-300 mb-1">Advertisers ID</label>
                            <input
                                id="campaignId"
                                v-model="campaignForm.campaignId"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Advertisers ID"
                                required
                            />
                            <p class="mt-1 text-sm text-neutral-500">The unique identifier for this campaign in the affiliate network</p>
                            <p v-if="formErrors.campaignId" class="mt-1 text-sm text-red-500">{{ formErrors.campaignId }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="campaignStatus" class="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                            <select
                                id="campaignStatus"
                                v-model="campaignForm.status"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Active">Active</option>
                                <option value="Paused">Paused</option>
                                <option value="Pending">Pending</option>
                                <option value="Expired">Expired</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <p v-if="formErrors.status" class="mt-1 text-sm text-red-500">{{ formErrors.status }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="campaignNetwork" class="block text-sm font-medium text-neutral-300 mb-1">Network</label>
                            <div v-if="loadingNetworks" class="flex items-center py-2">
                                <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                <span class="ml-2 text-neutral-400 text-sm">Loading networks...</span>
                            </div>
                            <div v-else-if="availableNetworks.length === 0" class="py-2 text-sm text-neutral-400">
                                No networks available. Please create a network first.
                            </div>
                            <div v-else>
                                <select
                                    id="campaignNetwork"
                                    v-model="campaignForm.network"
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

                        <div class="mb-4">
                            <label for="campaignCurrency" class="block text-sm font-medium text-neutral-300 mb-1">Currency Code</label>
                            <input
                                id="campaignCurrency"
                                v-model="campaignForm.currencyCode"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="USD, EUR, GBP, etc."
                            />
                            <p v-if="formErrors.currencyCode" class="mt-1 text-sm text-red-500">{{ formErrors.currencyCode }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="campaignSector" class="block text-sm font-medium text-neutral-300 mb-1">Sector</label>
                            <input
                                id="campaignSector"
                                v-model="campaignForm.sector"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Retail, Fashion, Technology, etc."
                            />
                            <p v-if="formErrors.sector" class="mt-1 text-sm text-red-500">{{ formErrors.sector }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="campaignDomain" class="block text-sm font-medium text-neutral-300 mb-1">Domain</label>
                            <input
                                id="campaignDomain"
                                v-model="campaignForm.domain"
                                @input="cleanDomain(campaignForm)"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="example.com"
                            />
                            <p class="mt-1 text-sm text-neutral-500">The advertiser's domain (without www. or https://)</p>
                            <p v-if="formErrors.domain" class="mt-1 text-sm text-red-500">{{ formErrors.domain }}</p>
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

        <!-- Import Campaigns Dialog -->
        <div v-if="showImportDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Import Advertisers</h3>
                    <button @click="showImportDialog = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <div class="mb-6">
                        <label for="importNetwork" class="block text-sm font-medium text-neutral-300 mb-2">Select Affiliate Network</label>
                        <div v-if="loadingNetworks" class="flex items-center py-2">
                            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            <span class="ml-2 text-neutral-400 text-sm">Loading networks...</span>
                        </div>
                        <div v-else-if="availableNetworks.length === 0" class="py-2 text-sm text-neutral-400">
                            No networks available. Please create a network first.
                        </div>
                        <div v-else>
                            <select
                                id="importNetwork"
                                v-model="importNetworkId"
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
                        <p class="mt-2 text-sm text-neutral-400">Import campaigns from the selected affiliate network</p>
                    </div>

                    <div class="flex justify-end space-x-3">
                        <button
                            type="button"
                            @click="showImportDialog = false"
                            class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            @click="startNetworkImport"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            :disabled="!importNetworkId || importLoading"
                        >
                            <span v-if="importLoading" class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Importing...
                            </span>
                            <span v-else>
                                Start Import
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="campaignToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the network campaign"
            warning-text="This action cannot be undone. The campaign will be removed from your system but will remain in the affiliate network."
            loading-text="Deleting..."
            @confirm="deleteCampaign"
            @cancel="closeDeleteDialog"
        />

        <!-- Create Campaign Dialog -->
        <div v-if="showCreateCampaignDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Create Campaign from Advertiser</h3>
                    <button @click="closeCreateCampaignDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Tab navigation -->
                <div class="px-6 pt-4 border-b border-neutral-700">
                    <div class="flex space-x-4">
                        <button
                            @click="systemActiveTab = 'basic'"
                            :class="[
                                'pb-2 px-1 text-sm font-medium transition-colors border-b-2',
                                systemActiveTab === 'basic'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-300'
                            ]"
                        >
                            Basic Information
                        </button>
                        <button
                            @click="systemActiveTab = 'extra'"
                            :class="[
                                'pb-2 px-1 text-sm font-medium transition-colors border-b-2',
                                systemActiveTab === 'extra'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-300'
                            ]"
                        >
                            Extra
                        </button>
                    </div>
                </div>

                <div class="p-6 overflow-y-auto" style="max-height: calc(85vh - 168px);">
                    <form @submit.prevent="saveSystemCampaign">
                        <!-- Basic Tab -->
                        <div v-if="systemActiveTab === 'basic'">
                            <div class="mb-4">
                                <label for="systemCampaignName" class="block text-sm font-medium text-neutral-300 mb-1">Campaign Name</label>
                                <input
                                    id="systemCampaignName"
                                    v-model="systemCampaignForm.name"
                                    @input="updateSystemSlug"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Campaign name"
                                    required
                                />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="systemCampaignSlug" class="block text-sm font-medium text-neutral-300 mb-1">Slug</label>
                                <input
                                    id="systemCampaignSlug"
                                    v-model="systemCampaignForm.slug"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="campaign-slug"
                                />
                                <p class="mt-1 text-sm text-neutral-500">URL-friendly name. Generated automatically from the campaign name.</p>
                                <p v-if="formErrors.slug" class="mt-1 text-sm text-red-500">{{ formErrors.slug }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="systemCampaignUrl" class="block text-sm font-medium text-neutral-300 mb-1">URL</label>
                                <input
                                    id="systemCampaignUrl"
                                    v-model="systemCampaignForm.url"
                                    type="url"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="https://example.com"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">The campaign's landing page URL</p>
                                <p v-if="formErrors.url" class="mt-1 text-sm text-red-500">{{ formErrors.url }}</p>
                            </div>

                            <div class="mb-4">
                                <label class="block text-sm font-medium text-neutral-300 mb-2">Logo</label>
                                <div class="flex items-center space-x-4">
                                    <div class="w-40 h-[125px] bg-neutral-700 rounded-md overflow-hidden flex items-center justify-center border border-neutral-600">
                                        <img v-if="systemCampaignForm.logo" :src="systemCampaignForm.logo" alt="Campaign logo" class="w-full h-full object-contain" />
                                        <div v-else class="text-neutral-500 flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span class="text-xs">No logo</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col space-y-2">
                                        <button
                                            type="button"
                                            @click="openSystemLogoUpload"
                                            class="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded-md transition-colors"
                                        >
                                            {{ systemCampaignForm.logo ? 'Change Logo' : 'Upload Logo' }}
                                        </button>
                                        <button
                                            type="button"
                                            v-if="systemCampaignForm.logo"
                                            @click="removeSystemLogo"
                                            class="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded-md transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                <p class="mt-1 text-xs text-neutral-500">Recommended size: 160 × 125 pixels</p>
                                <p v-if="formErrors.logo" class="mt-1 text-sm text-red-500">{{ formErrors.logo }}</p>
                            </div>

                            <!-- Status Options -->
                            <div class="mb-4 flex items-center space-x-6">
                                <div class="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="systemCampaignActive"
                                        v-model="systemCampaignForm.active"
                                        class="w-4 h-4 rounded bg-neutral-700 border-neutral-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-800"
                                    />
                                    <label for="systemCampaignActive" class="ml-2 text-sm text-neutral-300">Active</label>
                                </div>
                                <div class="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="systemCampaignHighlight"
                                        v-model="systemCampaignForm.highlight"
                                        class="w-4 h-4 rounded bg-neutral-700 border-neutral-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-800"
                                    />
                                    <label for="systemCampaignHighlight" class="ml-2 text-sm text-neutral-300">Highlight</label>
                                </div>
                            </div>
                        </div>

                        <!-- Extra Tab -->
                        <div v-if="systemActiveTab === 'extra'">
                            <div class="mb-4">
                                <label for="systemCampaignDomain" class="block text-sm font-medium text-neutral-300 mb-1">Domain</label>
                                <input
                                    id="systemCampaignDomain"
                                    v-model="systemCampaignForm.domain"
                                    @input="cleanDomain(systemCampaignForm)"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="example.com"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">The campaign's landing page domain (without www. or https://)</p>
                                <p v-if="formErrors.domain" class="mt-1 text-sm text-red-500">{{ formErrors.domain }}</p>
                            </div>

                            <div class="mb-6">
                                <label for="systemCampaignNetwork" class="block text-sm font-medium text-neutral-300 mb-1">Network</label>
                                <div v-if="loadingNetworks" class="flex items-center py-2">
                                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                    <span class="ml-2 text-neutral-400 text-sm">Loading networks...</span>
                                </div>
                                <div v-else-if="availableNetworks.length === 0" class="py-2 text-sm text-neutral-400">
                                    No networks available. Please create a network first.
                                </div>
                                <div v-else>
                                    <select
                                        id="systemCampaignNetwork"
                                        v-model="systemCampaignForm.networkId"
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
                                <p v-if="formErrors.networkId" class="mt-1 text-sm text-red-500">{{ formErrors.networkId }}</p>
                            </div>

                            <!-- Categories Section -->
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-neutral-300 mb-2">Categories</label>
                                <div v-if="loadingCategories" class="flex items-center py-2">
                                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                    <span class="ml-2 text-neutral-400 text-sm">Loading categories...</span>
                                </div>
                                <div v-else-if="availableCategories.length === 0" class="py-2 text-sm text-neutral-400">
                                    No categories available. Please create categories first.
                                </div>
                                <div v-else class="bg-neutral-750 p-3 rounded-md mb-2">
                                    <div class="mb-2">
                                        <input
                                            type="text"
                                            v-model="categorySearch"
                                            placeholder="Search categories..."
                                            class="w-full px-2 py-1 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div class="max-h-[200px] overflow-y-auto pr-1 grid grid-cols-2 gap-2">
                                        <div
                                            v-for="category in filteredCategories"
                                            :key="category.id"
                                            class="flex items-center space-x-2"
                                        >
                                            <input
                                                type="checkbox"
                                                :id="`category-${category.id}`"
                                                :value="category.id"
                                                v-model="systemCampaignForm.categories"
                                                class="rounded bg-neutral-700 border-neutral-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-800"
                                            />
                                            <label :for="`category-${category.id}`" class="text-sm text-neutral-300">
                                                {{ category.name }}
                                            </label>
                                        </div>
                                    </div>
                                    <div v-if="systemCampaignForm.categories.length > 0" class="mt-3">
                                        <div class="flex flex-wrap gap-2 mb-2">
                                            <span class="text-xs text-neutral-400">Selected ({{ systemCampaignForm.categories.length }}): </span>
                                            <button
                                                type="button"
                                                @click="systemCampaignForm.categories = []"
                                                class="text-xs text-red-400 hover:text-red-300"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                        <div class="flex flex-wrap gap-1">
                                            <span
                                                v-for="categoryId in systemCampaignForm.categories"
                                                :key="categoryId"
                                                class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-900/40 text-blue-200 border border-blue-800"
                                            >
                                                {{ getCategoryName(categoryId) }}
                                                <button
                                                    type="button"
                                                    @click="removeSystemCategory(categoryId)"
                                                    class="ml-1 text-blue-300 hover:text-blue-100"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="formErrors.categories" class="mt-1 text-sm text-red-500">{{ formErrors.categories }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="systemCampaignDescription" class="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                                <textarea
                                    id="systemCampaignDescription"
                                    v-model="systemCampaignForm.description"
                                    rows="3"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Campaign description"
                                ></textarea>
                                <p v-if="formErrors.description" class="mt-1 text-sm text-red-500">{{ formErrors.description }}</p>
                            </div>

                            <!-- Metadata Section -->
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-neutral-300 mb-2">Metadata</label>
                                <div class="bg-neutral-750 p-3 rounded-md mb-2">
                                    <div class="max-h-[250px] overflow-y-auto pr-1">
                                        <div v-for="(item, index) in systemCampaignForm.metadata" :key="index" class="mb-3 border-b border-neutral-700 pb-3">
                                            <div class="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <label :for="`metadataKey${index}`" class="block text-xs font-medium text-neutral-400 mb-1">Key</label>
                                                    <input
                                                        :id="`metadataKey${index}`"
                                                        v-model="item.key"
                                                        type="text"
                                                        class="w-full px-2 py-1 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Key"
                                                    />
                                                </div>
                                                <div>
                                                    <label :for="`metadataType${index}`" class="block text-xs font-medium text-neutral-400 mb-1">Type</label>
                                                    <select
                                                        :id="`metadataType${index}`"
                                                        v-model="item.type"
                                                        class="w-full px-2 py-1 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="string">String</option>
                                                        <option value="text">Text</option>
                                                        <option value="number">Number</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="mb-2">
                                                <label :for="`metadataValue${index}`" class="block text-xs font-medium text-neutral-400 mb-1">Value</label>
                                                <textarea
                                                    v-if="item.type === 'text'"
                                                    :id="`metadataValue${index}`"
                                                    v-model="item.value"
                                                    rows="2"
                                                    class="w-full px-2 py-1 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Value"
                                                ></textarea>
                                                <input
                                                    v-else-if="item.type === 'string'"
                                                    :id="`metadataValue${index}`"
                                                    v-model="item.value"
                                                    type="text"
                                                    class="w-full px-2 py-1 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Value"
                                                />
                                                <input
                                                    v-else
                                                    :id="`metadataValue${index}`"
                                                    v-model.number="item.value"
                                                    type="number"
                                                    class="w-full px-2 py-1 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Value"
                                                />
                                            </div>
                                            <div class="flex justify-end">
                                                <button
                                                    type="button"
                                                    @click="removeSystemMetadataItem(index)"
                                                    class="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="systemCampaignForm.metadata.length === 0" class="text-center py-3 text-sm text-neutral-500">
                                            No metadata added yet
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        @click="addSystemMetadataItem"
                                        class="mt-2 w-full px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md flex items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Metadata
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="p-6 border-t border-neutral-700 bg-neutral-800 flex justify-end space-x-3">
                    <button
                        type="button"
                        @click="closeCreateCampaignDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="saveSystemCampaign"
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
                            Create Campaign
                        </span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Logo crop modal -->
        <div v-if="systemLogoCropModalOpen" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div class="bg-neutral-800 rounded-lg max-w-md w-full p-6">
                <h3 class="text-lg font-medium text-white mb-4">Crop Campaign Logo</h3>

                <div class="relative mb-4">
                    <div class="w-full max-w-md mx-auto bg-neutral-750 relative overflow-hidden rounded-lg border-2 border-neutral-600">
                        <!-- Canvas for crop preview -->
                        <canvas
                            ref="systemLogoCropCanvas"
                            class="mx-auto"
                            width="320"
                            height="250"
                            @mousedown="startSystemLogoDrag"
                            @mousemove="onSystemLogoDrag"
                            @mouseup="stopSystemLogoDrag"
                            @mouseleave="stopSystemLogoDrag"
                            @wheel="handleSystemLogoWheel"
                            @touchstart="startSystemLogoDrag"
                            @touchmove="onSystemLogoDrag"
                            @touchend="stopSystemLogoDrag"
                        ></canvas>

                        <!-- Crop overlay -->
                        <div class="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                            <div class="absolute left-1/2 top-1/2 w-[160px] h-[125px] -ml-[80px] -mt-[62.5px] border-2 border-white"></div>
                        </div>
                    </div>

                    <!-- Zoom controls -->
                    <div class="flex items-center justify-center mt-4">
                        <button
                            @click="adjustSystemLogoZoom(-0.1)"
                            class="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-l-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <div class="px-4 py-2 bg-neutral-700 text-white text-sm font-medium">
                            Zoom: {{ Math.round(systemLogoZoomLevel * 100) }}%
                        </div>
                        <button
                            @click="adjustSystemLogoZoom(0.1)"
                            class="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-r-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="flex justify-end space-x-2">
                    <button
                        @click="systemLogoCropModalOpen = false"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        @click="cropSystemLogo"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast notifications -->
        <ToastNotification
            :show="notification.show"
            :message="notification.message"
            :type="notification.type"
            :duration="notification.duration"
            @close="notification.show = false"
        />

        <!-- Add file input for logo image -->
        <input
            type="file"
            ref="systemLogoImageInput"
            @change="handleSystemLogoImageSelect"
            accept="image/*"
            class="hidden"
        />

        <!-- Hidden file input for importing JSON files -->
        <input
            type="file"
            ref="importFileInput"
            @change="handleFileSelect"
            accept="application/json"
            class="hidden"
        />

        <!-- Import Progress Dialog -->
        <div v-if="showImportProgress" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Importing Advertisers</h3>
                    <button @click="cancelImport" class="text-neutral-400 hover:text-white" :disabled="importInProgress">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-neutral-300">Progress</span>
                            <span class="text-sm text-neutral-300">{{ importProgress.current }} / {{ importProgress.total }}</span>
                        </div>
                        <div class="w-full bg-neutral-700 rounded-full h-2.5">
                            <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${importProgress.percentage}%` }"></div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-neutral-300">Success</span>
                            <span class="text-sm text-green-500">{{ importProgress.success }}</span>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-neutral-300">Failed</span>
                            <span class="text-sm text-red-500">{{ importProgress.failed }}</span>
                        </div>
                    </div>

                    <div v-if="importProgress.currentItem" class="mb-4 text-sm text-neutral-400">
                        <p class="truncate">Processing: {{ importProgress.currentItem }}</p>
                    </div>

                    <div v-if="importProgress.errorMessage" class="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-300">
                        <p>{{ importProgress.errorMessage }}</p>
                    </div>

                    <div class="flex justify-end">
                        <button
                            @click="closeImportDialog"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            :disabled="importInProgress"
                        >
                            {{ importInProgress ? 'Importing...' : importFinished ? 'Close' : 'Cancel' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
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

const networkCampaigns = ref([])
const systemCampaigns = ref([])
const loading = ref(true)
const error = ref(null)
const loadingSystemCampaigns = ref(false)
const creatingSystemCampaign = ref(false)

// New variables for system campaign form
const showCreateCampaignDialog = ref(false)
const systemCampaignForm = ref({
    name: '',
    url: '',
    domain: '',
    description: '',
    networkId: '',
    logo: '',
    metadata: []
})
const campaignToConvert = ref(null)

// Logo crop state for system campaign
const systemLogoCropModalOpen = ref(false)
const systemLogoZoomLevel = ref(1)
const systemLogoCropCanvas = ref(null)
const systemLogoImageInput = ref(null)
const selectedSystemLogoImage = ref(null)
const systemLogoCropContext = ref(null)
const isSystemLogoDragging = ref(false)
const systemLogoDragStart = ref({ x: 0, y: 0 })
const systemLogoImagePosition = ref({ x: 0, y: 0 })

const availableNetworks = ref([])
const loadingNetworks = ref(false)

const showDialog = ref(false)
const isEditing = ref(false)
const campaignForm = ref({
    name: '',
    campaignId: '',
    network: '',
    status: 'Active',
    currencyCode: '',
    sector: '',
    domain: ''
})
const campaignToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const campaignToDelete = ref(null)
const deleteLoading = ref(false)

const showImportDialog = ref(false)
const importNetworkId = ref('')
const importLoading = ref(false)

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
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    network: '' // Add network filter
})

const showSearchDropdown = ref(false)
const searchInput = ref(null)
const exportLoading = ref(false)

const showNetworkDropdown = ref(false)
const showMoreActionsDropdown = ref(false)

const availableCategories = ref([])
const loadingCategories = ref(false)
const categorySearch = ref('')
const systemActiveTab = ref('basic')

const supportedApis = ref({})

const loadNetworkCampaigns = async () => {
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
            apiFilters.searchField = 'name'
        }

        if (filters.value.network) {
            apiFilters.network = filters.value.network
        }

        const response = await affiliateClient.campaignsNetworks.get(apiFilters)

        if (response && response.data) {
            networkCampaigns.value = response.data || []

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
            networkCampaigns.value = []
            // Reset pagination if data format is unexpected
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
        console.error('Failed to load network campaigns:', err)
        loading.value = false
        error.value = err.message || 'Failed to load network campaigns'
        showNotification('error', 'Failed to load network campaigns')
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

// Load all system campaigns
const loadSystemCampaigns = async () => {
    try {
        loadingSystemCampaigns.value = true

        const response = await affiliateClient.campaigns.get({
            limit: 10000 // Get all campaigns
        })

        if (response && response.data) {
            systemCampaigns.value = response.data || []
        } else {
            systemCampaigns.value = []
        }

        loadingSystemCampaigns.value = false
    } catch (err) {
        console.error('Failed to load system campaigns:', err)
        loadingSystemCampaigns.value = false
        showNotification('error', 'Failed to load system campaigns')
    }
}

// Check if a network campaign exists as a system campaign
const campaignExistsInSystem = (networkCampaign) => {
    if (!networkCampaign.domain) return false
    return systemCampaigns.value.some(sysCampaign =>
        sysCampaign.domain &&
        networkCampaign.domain &&
        sysCampaign.domain.toLowerCase() === networkCampaign.domain.toLowerCase()
    )
}

// Create a system campaign from a network campaign
const createSystemCampaign = async (networkCampaign) => {
    if (!networkCampaign.domain) {
        showNotification('error', 'Cannot create system campaign: No domain specified')
        return
    }

    // Set campaign to convert
    campaignToConvert.value = networkCampaign

    // Pre-fill the form with network campaign data
    // Using the same variable names as CampaignView for consistency
    systemCampaignForm.value = {
        name: networkCampaign.name,
        url: `https://${networkCampaign.domain}`,
        domain: networkCampaign.domain,
        description: networkCampaign.description || '',
        networkId: networkCampaign.network,
        logo: '',
        metadata: [],
        slug: generateSlug(networkCampaign.name),
        _previousName: networkCampaign.name,
        categories: [],
        active: true,
        highlight: false
    }

    // Reset tab to basic
    systemActiveTab.value = 'basic'

    // Show the create campaign dialog
    showCreateCampaignDialog.value = true

    // Load networks if not available
    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }

    // Load categories if not available
    if (availableCategories.value.length === 0) {
        await loadCategories()
    }
}

// Load categories
const loadCategories = async () => {
    try {
        loadingCategories.value = true

        const response = await affiliateClient.categories.get({
            limit: 1000,
            sortBy: 'name',
            sort: 'asc'
        })

        if (response && response.data) {
            availableCategories.value = response.data || []
        } else {
            availableCategories.value = []
        }

        loadingCategories.value = false
    } catch (err) {
        console.error('Failed to load categories:', err)
        loadingCategories.value = false
        showNotification('error', 'Failed to load available categories')
    }
}

// Generate slug from text
const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Update slug based on name
const updateSystemSlug = () => {
    if (!systemCampaignForm.value.slug ||
        systemCampaignForm.value.slug === generateSlug(systemCampaignForm.value._previousName)) {
        systemCampaignForm.value.slug = generateSlug(systemCampaignForm.value.name)
    }

    systemCampaignForm.value._previousName = systemCampaignForm.value.name
}

// Get category name by ID
const getCategoryName = (categoryId) => {
    const category = availableCategories.value.find(c => c.id === categoryId)
    return category ? category.name : 'Unknown Category'
}

// Remove a category from the selection
const removeSystemCategory = (categoryId) => {
    const index = systemCampaignForm.value.categories.indexOf(categoryId)
    if (index !== -1) {
        systemCampaignForm.value.categories.splice(index, 1)
    }
}

// Filter categories based on search
const filteredCategories = computed(() => {
    if (!categorySearch.value.trim()) {
        return availableCategories.value
    }
    const searchLower = categorySearch.value.toLowerCase()
    return availableCategories.value.filter(category =>
        category.name.toLowerCase().includes(searchLower)
    )
})

// Metadata methods for system campaign
const addSystemMetadataItem = () => {
    systemCampaignForm.value.metadata.push({
        key: '',
        value: '',
        type: 'string'
    });
};

const removeSystemMetadataItem = (index) => {
    systemCampaignForm.value.metadata.splice(index, 1);
};

// Logo handling for system campaign
const openSystemLogoUpload = () => {
    systemLogoImageInput.value.click()
}

const removeSystemLogo = () => {
    systemCampaignForm.value.logo = ''
    showNotification('info', 'Logo removed')
}

const handleSystemLogoImageSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select an image file')
        event.target.value = ''
        return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.crossOrigin = "Anonymous"

        img.onload = () => {
            selectedSystemLogoImage.value = img
            systemLogoCropModalOpen.value = true

            // Initialize canvas after modal is open
            setTimeout(() => {
                initSystemLogoCropCanvas()
            }, 100)
        }

        img.onerror = (err) => {
            console.error('Logo image loading error', err)
            showNotification('error', 'Failed to load logo image')
        }

        img.src = e.target.result
    }
    reader.readAsDataURL(file)

    // Reset file input
    event.target.value = ''
}

// Initialize logo crop canvas
const initSystemLogoCropCanvas = () => {
    if (!systemLogoCropCanvas.value || !selectedSystemLogoImage.value) return

    const canvas = systemLogoCropCanvas.value
    const ctx = canvas.getContext('2d')
    systemLogoCropContext.value = ctx

    // Reset zoom and position
    systemLogoZoomLevel.value = 1
    systemLogoImagePosition.value = { x: 0, y: 0 }

    // Draw initial image
    drawSystemLogoImageOnCanvas()
}

// Draw logo image on canvas
const drawSystemLogoImageOnCanvas = () => {
    if (!systemLogoCropCanvas.value || !selectedSystemLogoImage.value || !systemLogoCropContext.value) return

    const canvas = systemLogoCropCanvas.value
    const ctx = systemLogoCropContext.value
    const img = selectedSystemLogoImage.value

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate dimensions for centered, zoomed image
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * systemLogoZoomLevel.value
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale

    // Use position for x,y coordinates (for dragging)
    const x = systemLogoImagePosition.value.x + (canvas.width - scaledWidth) / 2
    const y = systemLogoImagePosition.value.y + (canvas.height - scaledHeight) / 2

    // Draw image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

    // Draw overlay to highlight crop area (160x125)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'

    // Top overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2 - 62.5)
    // Bottom overlay
    ctx.fillRect(0, canvas.height / 2 + 62.5, canvas.width, canvas.height / 2 - 62.5)
    // Left overlay
    ctx.fillRect(0, canvas.height / 2 - 62.5, canvas.width / 2 - 80, 125)
    // Right overlay
    ctx.fillRect(canvas.width / 2 + 80, canvas.height / 2 - 62.5, canvas.width / 2 - 80, 125)

    // Draw border around crop area
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.strokeRect(canvas.width / 2 - 80, canvas.height / 2 - 62.5, 160, 125)
}

// Logo dragging
const startSystemLogoDrag = (e) => {
    isSystemLogoDragging.value = true

    // Get initial position
    if (e.type.includes('mouse')) {
        systemLogoDragStart.value = { x: e.clientX, y: e.clientY }
    } else { // touch event
        systemLogoDragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
}

const onSystemLogoDrag = (e) => {
    if (!isSystemLogoDragging.value) return

    // Prevent default to avoid scrolling on touch devices
    e.preventDefault()

    let currentX, currentY
    if (e.type.includes('mouse')) {
        currentX = e.clientX
        currentY = e.clientY
    } else { // touch event
        currentX = e.touches[0].clientX
        currentY = e.touches[0].clientY
    }

    // Calculate the distance moved
    const deltaX = currentX - systemLogoDragStart.value.x
    const deltaY = currentY - systemLogoDragStart.value.y

    // Update image position
    systemLogoImagePosition.value = {
        x: systemLogoImagePosition.value.x + deltaX,
        y: systemLogoImagePosition.value.y + deltaY
    }

    // Update drag start for next movement
    systemLogoDragStart.value = { x: currentX, y: currentY }

    // Redraw canvas
    drawSystemLogoImageOnCanvas()
}

const stopSystemLogoDrag = () => {
    isSystemLogoDragging.value = false
}

const handleSystemLogoWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    adjustSystemLogoZoom(delta)
}

const adjustSystemLogoZoom = (delta) => {
    systemLogoZoomLevel.value = Math.max(0.5, Math.min(3, systemLogoZoomLevel.value + delta))
    drawSystemLogoImageOnCanvas()
}

// Crop the logo and save
const cropSystemLogo = async () => {
    if (!systemLogoCropCanvas.value || !selectedSystemLogoImage.value || !systemLogoCropContext.value) return

    const canvas = systemLogoCropCanvas.value

    // Create a temporary canvas for the crop
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    // Set output dimensions (target size is 160x125)
    tempCanvas.width = 160
    tempCanvas.height = 125

    // Calculate the crop area (center of the canvas)
    const cropArea = {
        x: canvas.width / 2 - 80,
        y: canvas.height / 2 - 62.5,
        width: 160,
        height: 125
    }

    // Scale factor of the image
    const scale = Math.max(canvas.width / selectedSystemLogoImage.value.width, canvas.height / selectedSystemLogoImage.value.height) * systemLogoZoomLevel.value
    const scaledWidth = selectedSystemLogoImage.value.width * scale
    const scaledHeight = selectedSystemLogoImage.value.height * scale

    const x = systemLogoImagePosition.value.x + (canvas.width - scaledWidth) / 2
    const y = systemLogoImagePosition.value.y + (canvas.height - scaledHeight) / 2

    const srcX = (cropArea.x - x) / scale
    const srcY = (cropArea.y - y) / scale
    const srcWidth = cropArea.width / scale
    const srcHeight = cropArea.height / scale

    tempCtx.drawImage(
        selectedSystemLogoImage.value,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, 160, 125
    )

    try {
        const webpData = await convertToWebP(tempCanvas, 0.8)
        systemCampaignForm.value.logo = webpData
        systemLogoCropModalOpen.value = false

        showNotification('success', 'Logo updated')
    } catch (err) {
        console.error('Failed to convert image to WebP:', err)
        const jpegData = tempCanvas.toDataURL('image/jpeg', 0.8)
        systemCampaignForm.value.logo = jpegData

        systemLogoCropModalOpen.value = false
        showNotification('success', 'Logo updated (as JPEG)')
    }
}

// Convert canvas to WebP
const convertToWebP = (canvas, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        if (typeof canvas.toBlob === 'function') {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result)
                        reader.onerror = reject
                        reader.readAsDataURL(blob)
                    } else {
                        reject(new Error('Failed to create WebP blob'))
                    }
                },
                'image/webp',
                quality
            )
        } else {
            try {
                const dataUrl = canvas.toDataURL('image/webp', quality)
                resolve(dataUrl)
            } catch (err) {
                reject(err)
            }
        }
    })
}

const saveSystemCampaign = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        if (!systemCampaignForm.value.name.trim()) {
            formErrors.value.name = 'Campaign name is required'
            formLoading.value = false
            return
        }

        if (!systemCampaignForm.value.url.trim()) {
            formErrors.value.url = 'Campaign URL is required'
            formLoading.value = false
            return
        }

        if (!systemCampaignForm.value.domain.trim()) {
            formErrors.value.domain = 'Campaign domain is required'
            formLoading.value = false
            return
        }

        if (!systemCampaignForm.value.networkId) {
            formErrors.value.networkId = 'Please select a network'
            formLoading.value = false
            return
        }

        // Clean domain before saving
        cleanDomain(systemCampaignForm.value)

        const metadataObject = {};
        systemCampaignForm.value.metadata.forEach(item => {
            if (item.key.trim()) {
                let value = item.value;
                if (item.type === 'number' && !isNaN(Number(value))) {
                    value = Number(value);
                }
                metadataObject[item.key.trim()] = value;
            }
        });

        const campaignData = {
            name: systemCampaignForm.value.name.trim(),
            url: systemCampaignForm.value.url.trim(),
            domain: systemCampaignForm.value.domain.trim(),
            description: systemCampaignForm.value.description?.trim() || '',
            network: systemCampaignForm.value.networkId,
            networkCampaignId: campaignToConvert.value.id,
            metadata: Object.keys(metadataObject).length > 0 ? JSON.stringify(metadataObject) : null,
            slug: systemCampaignForm.value.slug.trim() || undefined,
            categories: systemCampaignForm.value.categories,
            active: systemCampaignForm.value.active,
            highlight: systemCampaignForm.value.highlight
        }

        if (systemCampaignForm.value.logo && systemCampaignForm.value.logo.startsWith('data:')) {
            try {
                const logoBackup = systemCampaignForm.value.logo;
                campaignData.logo = '';

                const campaign = await affiliateClient.campaigns.insert(campaignData);
                const campaignId = campaign.data.id;

                if (!campaignId)
                    throw new Error('Unable to update logo: Missing campaign ID');

                await affiliateClient.campaigns.updateLogo(campaignId, logoBackup);

                showNotification('success', 'Campaign created successfully');
                await loadSystemCampaigns();

                closeCreateCampaignDialog();
                formLoading.value = false;

            } catch (err) {
                console.error('Error creating campaign with logo:', err);
                formLoading.value = false;

                if (err.response?.data?.errors)
                    formErrors.value = err.response.data.errors;
                else
                    showNotification('error', err.message || 'Failed to save campaign');

                return;
            }
        } else {
            try {
                console.log('Creating campaign without special logo handling:', campaignData);
                await affiliateClient.campaigns.insert(campaignData);
                showNotification('success', 'Campaign created successfully');

                await loadSystemCampaigns();
                closeCreateCampaignDialog();
                formLoading.value = false;
            } catch (err) {
                console.error('Error creating campaign without logo:', err);
                formLoading.value = false;

                if (err.response?.data?.errors)
                    formErrors.value = err.response.data.errors;
                else
                    showNotification('error', err.message || 'Failed to create campaign');
            }
        }
    } catch (err) {
        console.error('Failed to create system campaign:', err)
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to create system campaign')
    }
}

// Refresh data
const refreshData = () => {
    loadNetworkCampaigns()
    loadSystemCampaigns()
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadNetworkCampaigns()
}, { deep: true })

// Dialog methods
const openAddDialog = async () => {
    isEditing.value = false
    campaignForm.value = {
        name: '',
        campaignId: '',
        network: '',
        status: 'Active',
        currencyCode: '',
        sector: '',
        domain: ''
    }
    formErrors.value = {}
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }
}

const openEditDialog = async (campaign) => {
    isEditing.value = true
    campaignToEdit.value = campaign

    campaignForm.value = {
        name: campaign.name,
        campaignId: campaign.campaignId || '',
        network: campaign.network || '',
        status: campaign.status || 'Active',
        currencyCode: campaign.currencyCode || '',
        sector: campaign.sector || '',
        domain: campaign.domain || ''
    }
    formErrors.value = {}
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }
}

const closeDialog = () => {
    showDialog.value = false
    campaignForm.value = {
        name: '',
        campaignId: '',
        network: '',
        status: 'Active',
        currencyCode: '',
        sector: '',
        domain: ''
    }
    formErrors.value = {}
    campaignToEdit.value = null
}

// Save campaign
const saveCampaign = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!campaignForm.value.name.trim()) {
            formErrors.value.name = 'Campaign name is required'
            formLoading.value = false
            return
        }

        if (!campaignForm.value.campaignId.trim()) {
            formErrors.value.campaignId = 'Campaign ID is required'
            formLoading.value = false
            return
        }

        if (!campaignForm.value.network) {
            formErrors.value.network = 'Please select a network'
            formLoading.value = false
            return
        }

        // Clean domain before saving
        cleanDomain(campaignForm.value)

        const campaignData = {
            name: campaignForm.value.name.trim(),
            campaignId: campaignForm.value.campaignId.trim(),
            network: campaignForm.value.network,
            status: campaignForm.value.status,
            currencyCode: campaignForm.value.currencyCode?.trim() || null,
            sector: campaignForm.value.sector?.trim() || null,
            domain: campaignForm.value.domain?.trim() || null
        }

        if (isEditing.value && campaignToEdit.value) {
            await affiliateClient.campaignsNetworks.update(campaignToEdit.value.id, campaignData)
            showNotification('success', 'Network campaign updated successfully')
        } else {
            await affiliateClient.campaignsNetworks.insert(campaignData)
            showNotification('success', 'Network campaign created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save network campaign')
    }
}

const confirmDelete = (campaign) => {
    campaignToDelete.value = campaign
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    campaignToDelete.value = null
}

const deleteCampaign = async () => {
    if (!campaignToDelete.value) return

    try {
        deleteLoading.value = true
        await affiliateClient.campaignsNetworks.delete(campaignToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Network campaign deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete network campaign:', err)
        showNotification('error', err.message || 'Failed to delete network campaign')
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

const getNetworkName = (networkId) => {
    const network = availableNetworks.value.find(n => n.id === networkId)
    return network ? network.name : 'Unknown Network'
}

const getStatusClass = (status) => {
    switch(status) {
        case 'Active':
            return 'bg-green-900 text-green-200 px-2 py-0.5 rounded text-xs'
        case 'Paused':
            return 'bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded text-xs'
        case 'Pending':
            return 'bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-xs'
        case 'Expired':
            return 'bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded text-xs'
        case 'Rejected':
            return 'bg-red-900 text-red-200 px-2 py-0.5 rounded text-xs'
        default:
            return 'bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded text-xs'
    }
}

// Import functions
const importCampaigns = async () => {
    importNetworkId.value = ''
    showImportDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }
}

const startNetworkImport = async () => {
    if (!importNetworkId.value) return

    try {
        importLoading.value = true

        // Call API to get network campaigns
        const response = await affiliateClient.campaignsNetworks.getNetworkCampaigns()

        if (response && response.success) {
            showNotification('success', `Successfully imported ${response.count || 0} campaigns`)
            showImportDialog.value = false
            refreshData()
        } else {
            showNotification('error', response.message || 'Failed to import campaigns')
        }

        importLoading.value = false
    } catch (err) {
        console.error('Failed to import campaigns:', err)
        showNotification('error', err.message || 'Failed to import campaigns')
        importLoading.value = false
    }
}

const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value
    if (showSearchDropdown.value) {
        setTimeout(() => {
            searchInput.value?.focus()
        }, 100)
    }
}

const clearSearch = () => {
    filters.value.search = ''
    showSearchDropdown.value = false
}

const exportNetworkCampaigns = async () => {
    try {
        exportLoading.value = true;
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
            showNotification('error', 'Only root users can export advertisers');
            exportLoading.value = false;
            return;
        }

        window.open(`/api/affiliate/campaigns-networks/export?token=${signature}`, '_blank');
        showNotification('success', 'Export started. Your download will begin shortly.');
    } catch (err) {
        console.error('Failed to export advertisers:', err);
        showNotification('error', err.message || 'Failed to export advertisers');
    } finally {
        exportLoading.value = false;
    }
}

const toggleNetworkDropdown = () => {
    showNetworkDropdown.value = !showNetworkDropdown.value;
}

const closeNetworkDropdown = () => {
    showNetworkDropdown.value = false;
}

const toggleMoreActionsDropdown = () => {
    showMoreActionsDropdown.value = !showMoreActionsDropdown.value;
}

onMounted(() => {
    // Add click-outside handling for search dropdown
    document.addEventListener('click', (event) => {
        const target = event.target
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false
        }

        if (!target.closest('[data-network-toggle]') && !target.closest('.absolute') && showNetworkDropdown.value) {
            showNetworkDropdown.value = false
        }

        // Handle more actions dropdown
        if (!target.closest('[data-more-actions-toggle]') && showMoreActionsDropdown.value) {
            showMoreActionsDropdown.value = false
        }
    })

    loadNetworkCampaigns()
    loadNetworks()
    loadSystemCampaigns()
})

// Close the create campaign dialog
const closeCreateCampaignDialog = () => {
    showCreateCampaignDialog.value = false
    campaignToConvert.value = null
    categorySearch.value = ''

    // Reset form
    systemCampaignForm.value = {
        name: '',
        url: '',
        domain: '',
        description: '',
        networkId: '',
        logo: '',
        metadata: [],
        slug: '',
        _previousName: '',
        categories: [],
        active: true,
        highlight: false
    }
}

// Import functionality
const importFileInput = ref(null)
const showImportProgress = ref(false)
const importInProgress = ref(false)
const importFinished = ref(false)
const importCancelled = ref(false)
const importProgress = ref({
    current: 0,
    total: 0,
    percentage: 0,
    success: 0,
    failed: 0,
    currentItem: '',
    errorMessage: ''
})

// Function to open the file dialog
const openImportFileDialog = () => {
    // Trigger the hidden file input
    importFileInput.value.click();
}

// Function to handle file selection
const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's a JSON file
    if (file.type !== 'application/json') {
        showNotification('error', 'Please select a valid JSON file');
        event.target.value = ''; // Clear the input
        return;
    }

    // Read file contents
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);

            // Validate that it's an array of advertisers
            if (!Array.isArray(jsonData)) {
                showNotification('error', 'Invalid JSON format. Expected an array of advertisers.');
                return;
            }

            // Start import process
            startFileImport(jsonData);
        } catch (err) {
            console.error('Failed to parse JSON:', err);
            showNotification('error', 'Failed to parse JSON file');
        }
    };

    reader.onerror = () => {
        showNotification('error', 'Failed to read file');
    };

    reader.readAsText(file);
    event.target.value = ''; // Clear the input
}

// Function to start the import process for file uploads
const startFileImport = (advertisers) => {
    // Reset progress
    importProgress.value = {
        current: 0,
        total: advertisers.length,
        percentage: 0,
        success: 0,
        failed: 0,
        currentItem: '',
        errorMessage: ''
    };

    // Show progress dialog
    showImportProgress.value = true;
    importInProgress.value = true;
    importFinished.value = false;
    importCancelled.value = false;

    // Start processing advertisers
    processAdvertisers(advertisers);
}

// Function to process advertisers one by one
const processAdvertisers = async (advertisers) => {
    for (let i = 0; i < advertisers.length; i++) {
        // Check if import was cancelled
        if (importCancelled.value) {
            break;
        }

        const advertiser = advertisers[i];
        importProgress.value.current = i + 1;
        importProgress.value.percentage = Math.round((importProgress.value.current / importProgress.value.total) * 100);

        try {
            // Update current item being processed
            importProgress.value.currentItem = advertiser.name || `Advertiser ${i + 1}`;
            importProgress.value.errorMessage = '';

            // Check if advertiser has required fields
            if (!advertiser.name || !advertiser.campaignId || !advertiser.network) {
                throw new Error('Advertiser requires name, campaignId, and network fields');
            }

            // Prepare advertiser data for API
            const advertiserData = {
                name: advertiser.name.trim(),
                campaignId: advertiser.campaignId.trim(),
                network: advertiser.network,
                status: advertiser.status || 'Active',
                currencyCode: advertiser.currencyCode || null,
                sector: advertiser.sector || null,
                domain: advertiser.domain || null
            };

            // Insert advertiser using API
            await affiliateClient.campaignsNetworks.insert(advertiserData);

            // Update success count
            importProgress.value.success++;
        } catch (err) {
            console.error(`Failed to import advertiser ${i + 1}:`, err);
            importProgress.value.failed++;
            importProgress.value.errorMessage = err.message || 'Failed to import advertiser';

            // Small delay to let user see the error message
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Small delay to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Import completed
    importInProgress.value = false;
    importFinished.value = true;

    // Refresh advertiser list after import
    refreshData();

    // Show notification
    if (importCancelled.value) {
        showNotification('info', `Import cancelled. ${importProgress.value.success} advertisers imported successfully.`);
    } else {
        showNotification('success', `Import completed. ${importProgress.value.success} advertisers imported successfully, ${importProgress.value.failed} failed.`);
    }
}

// Function to cancel the import
const cancelImport = () => {
    if (importInProgress.value) {
        importCancelled.value = true;
    } else {
        closeImportDialog();
    }
}

// Function to close the import dialog
const closeImportDialog = () => {
    showImportProgress.value = false;
    importCancelled.value = false;
}

// Add the cleanDomain function somewhere in the script
// Add this near other utility functions like generateSlug
const cleanDomain = (form) => {
    if (form.domain) {
        // Remove http:// or https:// protocol
        let cleanedDomain = form.domain.replace(/^https?:\/\//, '');
        // Remove www.
        cleanedDomain = cleanedDomain.replace(/^www\./, '');
        // Remove trailing slashes
        cleanedDomain = cleanedDomain.replace(/\/+$/, '');

        form.domain = cleanedDomain;
    }
}
</script>
