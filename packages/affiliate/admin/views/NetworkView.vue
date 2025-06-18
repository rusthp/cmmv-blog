<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Networks</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Network
                </button>

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
                                    placeholder="Search networks..."
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

                <!-- More actions dropdown -->
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
                                @click="exportNetworks"
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
                                Export Networks
                            </button>
                            <button
                                @click="openImportDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Import Networks
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading networks...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load networks</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="networks.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">No affiliate networks found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first affiliate network</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Network
            </button>
        </div>

        <!-- Networks table -->
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
                                URL
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
                        <tr v-for="network in networks" :key="network.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="network.id">
                                {{ network.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ network.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 truncate max-w-xs">
                                <a v-if="network.url" :href="network.url" target="_blank" class="hover:text-blue-400">
                                    {{ formatUrl(network.url) }}
                                </a>
                                <span v-else class="text-neutral-500 italic">No URL provided</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <button
                                    @click="toggleActive(network)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        network.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(network)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(network)"
                                        title="Delete"
                                        class="text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="loadNetworkCampaigns(network)"
                                        title="Load Campaigns"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors"
                                        :disabled="network.loadingCampaigns"
                                        v-if="hasApiConfigured(network, 'campaigns')"
                                    >
                                        <svg v-if="!network.loadingCampaigns" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <svg v-else class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        @click="loadNetworkCoupons(network)"
                                        title="Load Coupons"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors"
                                        :disabled="network.loadingCoupons"
                                        v-if="hasApiConfigured(network, 'coupons')"
                                    >
                                        <svg v-if="!network.loadingCoupons" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                        <svg v-else class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            itemName="networks"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Network Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Network' : 'Add Network' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Tab navigation -->
                <div class="px-6 pt-4 border-b border-neutral-700">
                    <div class="flex space-x-4">
                        <button
                            @click="activeTab = 'basic'"
                            :class="[
                                'pb-2 px-1 text-sm font-medium transition-colors border-b-2',
                                activeTab === 'basic'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-300'
                            ]"
                        >
                            Basic Info
                        </button>
                        <button
                            @click="activeTab = 'metadata'"
                            :class="[
                                'pb-2 px-1 text-sm font-medium transition-colors border-b-2',
                                activeTab === 'metadata'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-300'
                            ]"
                        >
                            Metadata
                        </button>
                        <button
                            @click="activeTab = 'api'"
                            :class="[
                                'pb-2 px-1 text-sm font-medium transition-colors border-b-2',
                                activeTab === 'api'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-300'
                            ]"
                        >
                            API Links
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <form @submit.prevent="saveNetwork">
                        <div v-if="activeTab === 'basic'">
                            <div class="mb-4">
                                <label for="networkName" class="block text-sm font-medium text-neutral-300 mb-1">Network Name</label>
                                <input
                                    id="networkName"
                                    v-model="networkForm.name"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Network name"
                                    required
                                />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="networkUrl" class="block text-sm font-medium text-neutral-300 mb-1">Network URL</label>
                                <input
                                    id="networkUrl"
                                    v-model="networkForm.url"
                                    type="url"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="https://example.com"
                                />
                                <p class="mt-1 text-sm text-neutral-500">The affiliate network's website URL</p>
                                <p v-if="formErrors.url" class="mt-1 text-sm text-red-500">{{ formErrors.url }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="networkApiType" class="block text-sm font-medium text-neutral-300 mb-1">API Type</label>
                                <div v-if="loadingApiTypes" class="flex items-center py-2">
                                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                    <span class="ml-2 text-neutral-400 text-sm">Loading API types...</span>
                                </div>
                                <select
                                    v-else
                                    id="networkApiType"
                                    v-model="networkForm.apiType"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select API Type</option>
                                    <option value="Fetch">Fetch (Default)</option>
                                    <option v-for="(details, apiName) in supportedApis" :key="apiName" :value="apiName">
                                        {{ apiName }} (v{{ details.version }})
                                    </option>
                                </select>
                                <p class="mt-1 text-sm text-neutral-500">Select the API integration type for this network</p>
                                <p v-if="currentApiDocs" class="mt-1 text-sm text-blue-400">
                                    <a :href="currentApiDocs" target="_blank" rel="noopener noreferrer" class="hover:underline">
                                        View API Documentation
                                    </a>
                                </p>
                            </div>

                            <div class="mb-4">
                                <div class="flex items-center">
                                    <input
                                        id="networkActive"
                                        v-model="networkForm.active"
                                        type="checkbox"
                                        class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                    />
                                    <label for="networkActive" class="ml-2 block text-sm font-medium text-neutral-300">
                                        Active
                                    </label>
                                </div>
                                <p class="mt-1 text-sm text-neutral-500">Only active networks will be available for affiliate campaigns</p>
                            </div>
                        </div>

                        <!-- Metadata Tab -->
                        <div v-if="activeTab === 'metadata'">
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-neutral-300 mb-2">Metadata</label>
                                <div class="bg-neutral-750 p-3 rounded-md mb-2">
                                    <div class="max-h-[250px] overflow-y-auto pr-1">
                                        <div v-for="(item, index) in networkForm.metadata" :key="index" class="mb-3 border-b border-neutral-700 pb-3">
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
                                            <div class="flex justify-end">
                                                <button
                                                    type="button"
                                                    @click="removeMetadataItem(index)"
                                                    class="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="networkForm.metadata.length === 0" class="text-center py-3 text-sm text-neutral-500">
                                            No metadata added yet
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        @click="addMetadataItem"
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

                        <!-- API Links Tab -->
                        <div v-if="activeTab === 'api'">
                            <div class="space-y-4">
                                <div>
                                    <label for="apiUrlCampaigns" class="block text-sm font-medium text-neutral-300 mb-1">Campaigns API URL</label>
                                    <input
                                        id="apiUrlCampaigns"
                                        v-model="networkForm.apiLinks.campaigns"
                                        type="url"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="https://api.example.com/campaigns"
                                    />
                                    <p class="mt-1 text-sm text-neutral-500">API endpoint for retrieving campaigns</p>
                                </div>

                                <div>
                                    <label for="apiUrlCoupons" class="block text-sm font-medium text-neutral-300 mb-1">Coupons API URL</label>
                                    <input
                                        id="apiUrlCoupons"
                                        v-model="networkForm.apiLinks.coupons"
                                        type="url"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="https://api.example.com/coupons/{campaignId}"
                                    />
                                    <p class="mt-1 text-sm text-neutral-500">API endpoint for retrieving coupons (include {campaignId} parameter)</p>
                                </div>

                                <div>
                                    <label for="apiUrlOffers" class="block text-sm font-medium text-neutral-300 mb-1">Offers API URL</label>
                                    <input
                                        id="apiUrlOffers"
                                        v-model="networkForm.apiLinks.offers"
                                        type="url"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="https://api.example.com/offers/{campaignId}"
                                    />
                                    <p class="mt-1 text-sm text-neutral-500">API endpoint for retrieving offers (include {campaignId} parameter)</p>
                                </div>

                                <div>
                                    <label for="apiUrlReports" class="block text-sm font-medium text-neutral-300 mb-1">Reports API URL</label>
                                    <input
                                        id="apiUrlReports"
                                        v-model="networkForm.apiLinks.reports"
                                        type="url"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="https://api.example.com/reports"
                                    />
                                    <p class="mt-1 text-sm text-neutral-500">API endpoint for retrieving performance reports</p>
                                </div>

                                <div>
                                    <label for="deeplinkGenerator" class="block text-sm font-medium text-neutral-300 mb-1">Deeplink Generator URL</label>
                                    <input
                                        id="deeplinkGenerator"
                                        v-model="networkForm.apiLinks.deeplink"
                                        type="url"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="https://api.example.com/deeplink?url={rawUrl}"
                                    />
                                    <p class="mt-1 text-sm text-neutral-500">API endpoint for generating deeplinks (include {rawUrl} parameter)</p>
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
            :item-name="networkToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the network"
            warning-text="This action cannot be undone. All affiliate campaigns associated with this network may be affected."
            loading-text="Deleting..."
            @confirm="deleteNetwork"
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

        <!-- Hidden file input for import -->
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
                    <h3 class="text-lg font-medium text-white">Importing Networks</h3>
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

const networks = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const activeTab = ref('basic')
const networkForm = ref({
    name: '',
    url: '',
    active: true,
    apiType: 'Fetch',
    metadata: [],
    apiLinks: {
        campaigns: '',
        coupons: '',
        offers: '',
        reports: '',
        deeplink: ''
    }
})
const networkToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const networkToDelete = ref(null)
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
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1
})

const showSearchDropdown = ref(false)
const searchInput = ref(null)
const exportLoading = ref(false)

const supportedApis = ref({})
const loadingApiTypes = ref(false)

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

// Dropdown state
const showMoreActionsDropdown = ref(false)

const loadNetworks = async () => {
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

        const response = await affiliateClient.networks.get(apiFilters)

        if (response && response.data) {
            networks.value = response.data || []

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
            networks.value = []
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
        console.error('Failed to load networks:', err)
        loading.value = false
        error.value = err.message || 'Failed to load networks'
        showNotification('error', 'Failed to load networks')
    }
}

// Refresh data
const refreshData = () => {
    loadNetworks()
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadNetworks()
}, { deep: true })

// Dialog methods
const openAddDialog = async () => {
    isEditing.value = false
    activeTab.value = 'basic'
    networkForm.value = {
        name: '',
        url: '',
        active: true,
        apiType: 'Fetch',
        metadata: [],
        apiLinks: {
            campaigns: '',
            coupons: '',
            offers: '',
            reports: '',
            deeplink: ''
        }
    }
    formErrors.value = {}
    showDialog.value = true

    // Load supported APIs when opening the dialog
    await loadSupportedApis()
}

const openEditDialog = async (network) => {
    isEditing.value = true
    activeTab.value = 'basic'
    networkToEdit.value = network

    // Parse metadata if exists
    const parsedMetadata = parseMetadata(network.metadata);

    // Parse apiLinks if exists
    const apiLinks = {
        campaigns: '',
        coupons: '',
        offers: '',
        reports: '',
        deeplink: ''
    };

    if (network.apiLinks) {
        try {
            const parsedApiLinks = JSON.parse(network.apiLinks);
            if (parsedApiLinks.campaigns) apiLinks.campaigns = parsedApiLinks.campaigns;
            if (parsedApiLinks.coupons) apiLinks.coupons = parsedApiLinks.coupons;
            if (parsedApiLinks.offers) apiLinks.offers = parsedApiLinks.offers;
            if (parsedApiLinks.reports) apiLinks.reports = parsedApiLinks.reports;
            if (parsedApiLinks.deeplink) apiLinks.deeplink = parsedApiLinks.deeplink;
        } catch (e) {
            console.error('Failed to parse API links:', e);
        }
    }

    networkForm.value = {
        name: network.name,
        url: network.url || '',
        active: network.active === undefined ? true : network.active,
        apiType: network.apiType || '',
        metadata: parsedMetadata,
        apiLinks: apiLinks
    }
    formErrors.value = {}
    showDialog.value = true

    // Load supported APIs when opening the dialog
    await loadSupportedApis()
}

const closeDialog = () => {
    showDialog.value = false
    networkForm.value = {
        name: '',
        url: '',
        active: true,
        apiType: 'Fetch',
        metadata: [],
        apiLinks: {
            campaigns: '',
            coupons: '',
            offers: '',
            reports: '',
            deeplink: ''
        }
    }
    formErrors.value = {}
    networkToEdit.value = null
}

// Save network
const saveNetwork = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!networkForm.value.name.trim()) {
            formErrors.value.name = 'Network name is required'
            formLoading.value = false
            return
        }

        if (networkForm.value.url && !isValidUrl(networkForm.value.url)) {
            formErrors.value.url = 'Please enter a valid URL'
            formLoading.value = false
            return
        }

        // Process metadata
        const metadataObject = {};
        networkForm.value.metadata.forEach(item => {
            if (item.key.trim()) {
                // For each key, store a default value based on type
                let defaultValue = '';
                if (item.type === 'number') {
                    defaultValue = 0;
                } else if (item.type === 'text') {
                    defaultValue = '';
                } else {
                    defaultValue = '';
                }
                metadataObject[item.key.trim()] = defaultValue;
            }
        });

        // Prepare API links
        const apiLinksObject = {
            campaigns: networkForm.value.apiLinks.campaigns.trim(),
            coupons: networkForm.value.apiLinks.coupons.trim(),
            offers: networkForm.value.apiLinks.offers.trim(),
            reports: networkForm.value.apiLinks.reports.trim(),
            deeplink: networkForm.value.apiLinks.deeplink.trim()
        };

        const networkData = {
            name: networkForm.value.name.trim(),
            url: networkForm.value.url.trim(),
            active: networkForm.value.active,
            apiType: networkForm.value.apiType,
            metadata: Object.keys(metadataObject).length > 0 ? JSON.stringify(metadataObject) : null,
            apiLinks: Object.values(apiLinksObject).some(val => val !== '') ? JSON.stringify(apiLinksObject) : null
        }

        if (isEditing.value) {
            await affiliateClient.networks.update(networkToEdit.value.id, networkData)
            showNotification('success', 'Network updated successfully')
        } else {
            await affiliateClient.networks.insert(networkData)
            showNotification('success', 'Network created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save network')
    }
}

const confirmDelete = (network) => {
    networkToDelete.value = network
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    networkToDelete.value = null
}

const deleteNetwork = async () => {
    if (!networkToDelete.value) return

    try {
        deleteLoading.value = true
        await affiliateClient.networks.delete(networkToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Network deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete network:', err)
        showNotification('error', err.message || 'Failed to delete network')
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

const toggleActive = async (network) => {
    try {
        const updatedNetwork = {
            ...network,
            active: !network.active
        };

        await affiliateClient.networks.update(network.id, updatedNetwork);

        // Update the local state
        const index = networks.value.findIndex(n => n.id === network.id);
        if (index !== -1) {
            networks.value[index].active = !network.active;
        }

        showNotification('success', `Network ${updatedNetwork.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        console.error('Failed to toggle network active state:', err);
        showNotification('error', err.message || 'Failed to update network status');
    }
}

const formatUrl = (url) => {
    if (!url) return '';

    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname + (parsedUrl.pathname !== '/' ? parsedUrl.pathname : '');
    } catch (e) {
        return url;
    }
}

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Add metadata item
const addMetadataItem = () => {
    networkForm.value.metadata.push({
        key: '',
        type: 'string'
    });
};

// Remove metadata item
const removeMetadataItem = (index) => {
    networkForm.value.metadata.splice(index, 1);
};

// Parse metadata JSON when editing
const parseMetadata = (metadataJson) => {
    try {
        if (!metadataJson) return [];

        const metadata = JSON.parse(metadataJson);
        const result = [];

        // Convert to our format with types
        for (const key in metadata) {
            if (Object.prototype.hasOwnProperty.call(metadata, key)) {
                const value = metadata[key];
                let type = 'string';

                if (typeof value === 'number') {
                    type = 'number';
                } else if (value && typeof value === 'string' && value.length > 50) {
                    type = 'text';
                }

                result.push({ key, type });
            }
        }

        return result;
    } catch (e) {
        console.error('Failed to parse metadata:', e);
        return [];
    }
};

const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value
    if (showSearchDropdown.value) {
        setTimeout(() => {
            searchInput.value.focus()
        }, 100)
    }
}

const clearSearch = () => {
    filters.value.search = ''
    showSearchDropdown.value = false
}

const loadSupportedApis = async () => {
    try {
        loadingApiTypes.value = true
        const response = await affiliateClient.campaignsNetworks.getApisSupported()

        if (response && typeof response === 'object') {
            supportedApis.value = response
        } else {
            supportedApis.value = {}
        }

        loadingApiTypes.value = false
    } catch (err) {
        console.error('Failed to load supported APIs:', err)
        supportedApis.value = {}
        loadingApiTypes.value = false
    }
}

// Computed property to get the documentation URL for the currently selected API
const currentApiDocs = computed(() => {
    if (!networkForm.value.apiType || !supportedApis.value[networkForm.value.apiType]) {
        return null
    }
    return supportedApis.value[networkForm.value.apiType].docs
})

const loadNetworkCampaigns = async (network) => {
    try {
        // Set loading state for this specific network
        network.loadingCampaigns = true;

        // Call the API to load campaigns
        await affiliateClient.networks.getNetworkCampaigns(network.id);

        // Show success notification
        showNotification('success', `Campaigns loaded successfully for ${network.name}`);
    } catch (err) {
        console.error('Failed to load campaigns:', err);
        showNotification('error', err.message || 'Failed to load campaigns');
    } finally {
        // Clear loading state
        network.loadingCampaigns = false;
    }
};

const loadNetworkCoupons = async (network) => {
    try {
        // Set loading state for this specific network
        network.loadingCoupons = true;

        // Call the API to load coupons
        await affiliateClient.networks.getCouponsByNetwork(network.id);

        // Show success notification
        showNotification('success', `Coupons loaded successfully for ${network.name}`);
    } catch (err) {
        console.error('Failed to load coupons:', err);
        showNotification('error', err.message || 'Failed to load coupons');
    } finally {
        // Clear loading state
        network.loadingCoupons = false;
    }
};

// Add this function to check if the network has the necessary API configuration
const hasApiConfigured = (network, apiType) => {
    if (!network.apiLinks) return false;

    try {
        const parsedApiLinks = JSON.parse(network.apiLinks);
        return parsedApiLinks && parsedApiLinks[apiType] && parsedApiLinks[apiType].trim() !== '';
    } catch (e) {
        console.error('Failed to parse API links:', e);
        return false;
    }
};

const exportNetworks = async () => {
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
            showNotification('error', 'Only root users can export networks');
            exportLoading.value = false;
            return;
        }

        window.open(`/api/affiliate/networks/export?token=${signature}`, '_blank');
        showNotification('success', 'Export started. Your download will begin shortly.');
    } catch (err) {
        console.error('Failed to export networks:', err);
        showNotification('error', err.message || 'Failed to export networks');
    } finally {
        exportLoading.value = false;
    }
}

const openImportDialog = () => {
    // Trigger the hidden file input
    importFileInput.value.click();
}

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

            // Validate that it's an array of networks
            if (!Array.isArray(jsonData)) {
                showNotification('error', 'Invalid JSON format. Expected an array of networks.');
                return;
            }

            // Start import process
            startImport(jsonData);
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

const startImport = (networks) => {
    // Reset progress
    importProgress.value = {
        current: 0,
        total: networks.length,
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

    // Start processing networks
    processNetworks(networks);
}

const processNetworks = async (networks) => {
    for (let i = 0; i < networks.length; i++) {
        // Check if import was cancelled
        if (importCancelled.value) {
            break;
        }

        const network = networks[i];
        importProgress.value.current = i + 1;
        importProgress.value.percentage = Math.round((importProgress.value.current / importProgress.value.total) * 100);

        try {
            // Update current item being processed
            importProgress.value.currentItem = network.name || `Network ${i + 1}`;
            importProgress.value.errorMessage = '';

            // Check if network has required fields
            if (!network.name) {
                throw new Error('Network name is required');
            }

            // Prepare network data for API
            const networkData = {
                name: network.name.trim(),
                url: network.url?.trim() || '',
                active: network.active === undefined ? true : network.active,
                apiType: network.apiType || '',
                metadata: network.metadata || null,
                apiLinks: network.apiLinks || null
            };

            // Insert network using API
            await affiliateClient.networks.insert(networkData);

            // Update success count
            importProgress.value.success++;
        } catch (err) {
            console.error(`Failed to import network ${i + 1}:`, err);
            importProgress.value.failed++;
            importProgress.value.errorMessage = err.message || 'Failed to import network';

            // Small delay to let user see the error message
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Small delay to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Import completed
    importInProgress.value = false;
    importFinished.value = true;

    // Refresh networks list after import
    refreshData();

    // Show notification
    if (importCancelled.value) {
        showNotification('info', `Import cancelled. ${importProgress.value.success} networks imported successfully.`);
    } else {
        showNotification('success', `Import completed. ${importProgress.value.success} networks imported successfully, ${importProgress.value.failed} failed.`);
    }
}

const cancelImport = () => {
    if (importInProgress.value) {
        importCancelled.value = true;
    } else {
        closeImportDialog();
    }
}

const closeImportDialog = () => {
    showImportProgress.value = false;
    importCancelled.value = false;
}

const toggleMoreActionsDropdown = () => {
    showMoreActionsDropdown.value = !showMoreActionsDropdown.value;
}

onMounted(() => {
    // Add click-outside handling for search dropdown
    document.addEventListener('click', (event) => {
        const target = event.target;
        // Handle search dropdown
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false;
        }

        // Handle more actions dropdown
        if (!target.closest('[data-more-actions-toggle]') && showMoreActionsDropdown.value) {
            showMoreActionsDropdown.value = false;
        }
    })

    loadNetworks()
})
</script>
