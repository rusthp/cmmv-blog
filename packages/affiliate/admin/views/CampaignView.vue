<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Campaigns</h1>
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
                                    placeholder="Search campaigns..."
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
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Campaign
                </button>
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
                    <div v-if="showMoreActionsDropdown" class="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="py-1">
                            <button
                                @click="exportCampaigns"
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
                                Export Campaigns
                            </button>
                            <button
                                @click="openImportFileDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Import Campaigns
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading campaigns...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load campaigns</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="campaigns.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <p class="text-neutral-300 mb-2">No affiliate campaigns found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first affiliate campaign</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Campaign
            </button>
        </div>

        <!-- Campaigns table -->
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
                                Slug
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Network
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
                        <tr v-for="campaign in campaigns" :key="campaign.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="campaign.id">
                                {{ campaign.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <div class="flex items-center">
                                    <img v-if="campaign.logo" :src="campaign.logo" alt="Campaign logo" class="h-8 w-8 mr-3 rounded-full object-cover" />
                                    <span>{{ campaign.name }}</span>
                                    <span v-if="campaign.highlight" class="ml-2 bg-yellow-500 text-xs rounded-full px-2 py-0.5 text-black font-medium">Highlight</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 truncate max-w-xs">
                                <span v-if="campaign.slug" class="font-mono">
                                    {{ campaign.slug }}
                                </span>
                                <span v-else class="text-neutral-500 italic">No slug</span>
                            </td>
                            <td class="px-6 py-4 text-sm text-neutral-400">
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
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <button
                                    @click="toggleActive(campaign)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        campaign.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="collectCouponsWithAI(campaign)"
                                        title="Collect Coupons via AI"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors"
                                        :disabled="aiLoadingMap[campaign.id]"
                                    >
                                        <div v-if="aiLoadingMap[campaign.id]" class="animate-spin h-5 w-5">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        <i v-else class="fas fa-ticket-alt text-center" style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;"></i>
                                    </button>
                                    <button
                                        @click="generatePostPreview(campaign)"
                                        title="Generate AI Post"
                                        class="text-neutral-400 hover:text-purple-500 transition-colors"
                                        :disabled="postGeneratingMap[campaign.id]"
                                    >
                                        <div v-if="postGeneratingMap[campaign.id]" class="animate-spin h-5 w-5">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
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
            itemName="campaigns"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Campaign Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Campaign' : 'Add Campaign' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

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
                            Basic Information
                        </button>
                        <button
                            @click="activeTab = 'extra'"
                            :class="[
                                'pb-2 px-1 text-sm font-medium transition-colors border-b-2',
                                activeTab === 'extra'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-300'
                            ]"
                        >
                            Extra
                        </button>
                        <button
                            @click="activeTab = 'seo'"
                            :class="[
                                'pb-2 px-1 text-sm font-medium transition-colors border-b-2',
                                activeTab === 'seo'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-300'
                            ]"
                        >
                            SEO
                        </button>
                    </div>
                </div>

                <div class="p-6 overflow-y-auto" style="max-height: calc(85vh - 168px);">
                    <form @submit.prevent="saveCampaign">
                        <div v-if="activeTab === 'basic'">
                            <div class="mb-4">
                                <label for="campaignName" class="block text-sm font-medium text-neutral-300 mb-1">Campaign Name</label>
                                <input
                                    id="campaignName"
                                    v-model="campaignForm.name"
                                    @input="updateSlug"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Campaign name"
                                    required
                                />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="campaignSlug" class="block text-sm font-medium text-neutral-300 mb-1">Slug</label>
                                <input
                                    id="campaignSlug"
                                    v-model="campaignForm.slug"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="campaign-slug"
                                />
                                <p class="mt-1 text-sm text-neutral-500">URL-friendly name. Generated automatically from the campaign name.</p>
                                <p v-if="formErrors.slug" class="mt-1 text-sm text-red-500">{{ formErrors.slug }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="campaignUrl" class="block text-sm font-medium text-neutral-300 mb-1">URL</label>
                                <input
                                    id="campaignUrl"
                                    v-model="campaignForm.url"
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
                                        <img v-if="campaignForm.logo" :src="campaignForm.logo" alt="Campaign logo" class="w-full h-full object-contain" />
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
                                            @click="openLogoUpload"
                                            class="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded-md transition-colors"
                                        >
                                            {{ campaignForm.logo ? 'Change Logo' : 'Upload Logo' }}
                                        </button>
                                        <button
                                            type="button"
                                            v-if="campaignForm.logo"
                                            @click="removeLogo"
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
                                        id="campaignActive"
                                        v-model="campaignForm.active"
                                        class="w-4 h-4 rounded bg-neutral-700 border-neutral-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-800"
                                    />
                                    <label for="campaignActive" class="ml-2 text-sm text-neutral-300">Active</label>
                                </div>
                                <div class="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="campaignHighlight"
                                        v-model="campaignForm.highlight"
                                        class="w-4 h-4 rounded bg-neutral-700 border-neutral-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-800"
                                    />
                                    <label for="campaignHighlight" class="ml-2 text-sm text-neutral-300">Highlight</label>
                                </div>
                            </div>
                        </div>

                        <!-- Extra Tab -->
                        <div v-if="activeTab === 'extra'">
                            <div class="mb-4">
                                <label for="campaignDomain" class="block text-sm font-medium text-neutral-300 mb-1">Domain</label>
                                <input
                                    id="campaignDomain"
                                    v-model="campaignForm.domain"
                                    @input="cleanDomain"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="example.com"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">The campaign's landing page domain (without www. or https://)</p>
                                <p v-if="formErrors.domain" class="mt-1 text-sm text-red-500">{{ formErrors.domain }}</p>
                            </div>

                            <div class="mb-6">
                                <label for="campaignNetwork" class="block text-sm font-medium text-neutral-300 mb-1">Network</label>
                                <div v-if="loadingNetworks" class="flex items-center py-2">
                                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                    <span class="ml-2 text-neutral-400 text-sm">Loading networks...</span>
                                </div>
                                <div v-else-if="availableNetworks.length === 0" class="py-2 text-sm text-neutral-400">
                                    No networks available. Please create a network first.
                                </div>
                                <div v-else>
                                    <!-- Network dropdown - sin buscador -->
                                    <select
                                        id="campaignNetwork"
                                        v-model="campaignForm.networkId"
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
                                                v-model="campaignForm.categories"
                                                class="rounded bg-neutral-700 border-neutral-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-800"
                                            />
                                            <label :for="`category-${category.id}`" class="text-sm text-neutral-300">
                                                {{ category.name }}
                                            </label>
                                        </div>
                                    </div>
                                    <div v-if="campaignForm.categories.length > 0" class="mt-3">
                                        <div class="flex flex-wrap gap-2 mb-2">
                                            <span class="text-xs text-neutral-400">Selected ({{ campaignForm.categories.length }}): </span>
                                            <button
                                                type="button"
                                                @click="campaignForm.categories = []"
                                                class="text-xs text-red-400 hover:text-red-300"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                        <div class="flex flex-wrap gap-1">
                                            <span
                                                v-for="categoryId in campaignForm.categories"
                                                :key="categoryId"
                                                class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-900/40 text-blue-200 border border-blue-800"
                                            >
                                                {{ getCategoryName(categoryId) }}
                                                <button
                                                    type="button"
                                                    @click="removeCategory(categoryId)"
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
                                <label for="campaignDescription" class="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                                <textarea
                                    id="campaignDescription"
                                    v-model="campaignForm.description"
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
                                        <div v-for="(item, index) in campaignForm.metadata" :key="index" class="mb-3 border-b border-neutral-700 pb-3">
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
                                                    @click="removeMetadataItem(index)"
                                                    class="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="campaignForm.metadata.length === 0" class="text-center py-3 text-sm text-neutral-500">
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

                        <!-- SEO Tab -->
                        <div v-if="activeTab === 'seo'">
                            <div class="mb-6">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-medium text-white">SEO Content</h3>
                                    <button
                                        type="button"
                                        @click="generateSEOWithAI"
                                        :disabled="seoGenerating || !campaignForm.domain"
                                        class="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors flex items-center"
                                    >
                                        <svg v-if="seoGenerating" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {{ seoGenerating ? 'Generating...' : 'Generate with AI' }}
                                    </button>
                                </div>
                                <p v-if="!campaignForm.domain" class="text-sm text-yellow-400 mb-4">
                                    ⚠️ Domain is required to generate SEO content with AI. Please fill the domain in the Extra tab first.
                                </p>
                            </div>

                            <div class="mb-4">
                                <label for="seoTitle" class="block text-sm font-medium text-neutral-300 mb-1">SEO Title</label>
                                <input
                                    id="seoTitle"
                                    v-model="campaignForm.seoTitle"
                                    type="text"
                                    maxlength="60"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="SEO optimized title (max 60 characters)"
                                />
                                <p class="mt-1 text-xs text-neutral-500">{{ campaignForm.seoTitle?.length || 0 }}/60 characters</p>
                                <p v-if="formErrors.seoTitle" class="mt-1 text-sm text-red-500">{{ formErrors.seoTitle }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="seoSubtitle" class="block text-sm font-medium text-neutral-300 mb-1">SEO Subtitle</label>
                                <input
                                    id="seoSubtitle"
                                    v-model="campaignForm.seoSubtitle"
                                    type="text"
                                    maxlength="120"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Engaging subtitle (max 120 characters)"
                                />
                                <p class="mt-1 text-xs text-neutral-500">{{ campaignForm.seoSubtitle?.length || 0 }}/120 characters</p>
                                <p v-if="formErrors.seoSubtitle" class="mt-1 text-sm text-red-500">{{ formErrors.seoSubtitle }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="seoSmallText" class="block text-sm font-medium text-neutral-300 mb-1">SEO Small Text (Meta Description)</label>
                                <textarea
                                    id="seoSmallText"
                                    v-model="campaignForm.seoSmallText"
                                    rows="3"
                                    maxlength="160"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Short description for search results (max 160 characters)"
                                ></textarea>
                                <p class="mt-1 text-xs text-neutral-500">{{ campaignForm.seoSmallText?.length || 0 }}/160 characters</p>
                                <p v-if="formErrors.seoSmallText" class="mt-1 text-sm text-red-500">{{ formErrors.seoSmallText }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="seoLongText" class="block text-sm font-medium text-neutral-300 mb-1">SEO Long Text (Page Content)</label>
                                <textarea
                                    id="seoLongText"
                                    v-model="campaignForm.seoLongText"
                                    rows="8"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Detailed content about the store, how to use coupons, benefits, etc."
                                ></textarea>
                                <p class="mt-1 text-xs text-neutral-500">{{ campaignForm.seoLongText?.length || 0 }} characters</p>
                                <p v-if="formErrors.seoLongText" class="mt-1 text-sm text-red-500">{{ formErrors.seoLongText }}</p>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="p-6 border-t border-neutral-700 bg-neutral-800 flex justify-end space-x-3">
                    <button
                        type="button"
                        @click="closeDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="saveCampaign"
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
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="campaignToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the campaign"
            warning-text="This action cannot be undone. All related data will be permanently deleted."
            loading-text="Deleting..."
            @confirm="deleteCampaign"
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

        <!-- Add file input for logo image -->
        <input
            type="file"
            ref="logoImageInput"
            @change="handleLogoImageSelect"
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
                    <h3 class="text-lg font-medium text-white">Importing Campaigns</h3>
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

        <!-- Logo crop modal -->
        <div v-if="logoCropModalOpen" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div class="bg-neutral-800 rounded-lg max-w-md w-full p-6">
                <h3 class="text-lg font-medium text-white mb-4">Crop Campaign Logo</h3>

                <div class="relative mb-4">
                    <div class="w-full max-w-md mx-auto bg-neutral-750 relative overflow-hidden rounded-lg border-2 border-neutral-600">
                        <!-- Canvas for crop preview -->
                        <canvas
                            ref="logoCropCanvas"
                            class="mx-auto"
                            width="320"
                            height="250"
                            @mousedown="startLogoDrag"
                            @mousemove="onLogoDrag"
                            @mouseup="stopLogoDrag"
                            @mouseleave="stopLogoDrag"
                            @wheel="handleLogoWheel"
                            @touchstart="startLogoDrag"
                            @touchmove="onLogoDrag"
                            @touchend="stopLogoDrag"
                        ></canvas>

                        <!-- Crop overlay -->
                        <div class="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                            <div class="absolute left-1/2 top-1/2 w-[160px] h-[125px] -ml-[80px] -mt-[62.5px] border-2 border-white"></div>
                        </div>
                    </div>

                    <!-- Zoom controls -->
                    <div class="flex items-center justify-center mt-4">
                        <button
                            @click="adjustLogoZoom(-0.1)"
                            class="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-l-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <div class="px-4 py-2 bg-neutral-700 text-white text-sm font-medium">
                            Zoom: {{ Math.round(logoZoomLevel * 100) }}%
                        </div>
                        <button
                            @click="adjustLogoZoom(0.1)"
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
                        @click="logoCropModalOpen = false"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        @click="cropLogo"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>

        <!-- Post Preview Modal -->
        <div v-if="showPostPreview" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-hidden" style="backdrop-filter: blur(4px);" @click.self="closePostPreview">
            <div class="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div class="flex items-center space-x-4">
                        <h1 class="text-xl font-bold text-gray-900">{{ generatedPost?.title }}</h1>
                        <span class="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">AI Generated</span>
                        <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{{ previewCampaign?.name }}</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button @click="closePostPreview" class="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 overflow-y-auto">
                    <!-- Main Content -->
                    <div class="p-6 lg:w-2/3">
                        <div v-if="generatedPost">
                            <!-- Campaign Info -->
                            <div class="mb-6">
                                <div class="flex items-center space-x-4 mb-4">
                                    <img v-if="previewCampaign?.logo" :src="previewCampaign.logo" alt="Campaign logo" class="h-12 w-12 rounded-full object-cover" />
                                    <div>
                                        <h2 class="text-lg font-semibold text-gray-900">{{ previewCampaign?.name }}</h2>
                                        <p class="text-sm text-gray-600">{{ generatedPost.month }} • {{ generatedPost.couponsCount }} cupons encontrados</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Cover Image Preview -->
                            <div v-if="generatedPost.coverImage" class="mb-6">
                                <h3 class="text-sm font-medium text-gray-800 mb-2">Imagem de Capa Sugerida</h3>
                                <div class="rounded-lg overflow-hidden border border-gray-200">
                                    <img :src="generatedPost.coverImage" alt="Cover image" class="w-full h-48 object-cover" />
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Imagem encontrada automaticamente pela IA</p>
                            </div>

                            <!-- Generated Content -->
                            <div class="prose prose-lg max-w-none text-gray-800" v-html="generatedPost.content"></div>

                            <!-- Campaign Stats -->
                            <div v-if="generatedPost" class="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h3 class="text-sm font-medium text-gray-800 mb-2">Estatísticas da Geração</h3>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-600">Cupons analisados:</span>
                                        <span class="font-medium text-gray-900 ml-1">{{ generatedPost.couponsCount }}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Gerado em:</span>
                                        <span class="font-medium text-gray-900 ml-1">{{ new Date(generatedPost.generatedAt).toLocaleString() }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="p-6 lg:w-1/3">
                        <!-- Tags Section -->
                        <div v-if="generatedPost?.suggestedTags && generatedPost.suggestedTags.length > 0" class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Tags Sugeridas</h3>
                            <div class="flex flex-wrap gap-2">
                                <div
                                    v-for="(tag, index) in generatedPost.suggestedTags"
                                    :key="index"
                                    class="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm flex items-center cursor-pointer hover:bg-purple-200 transition-colors"
                                    :class="{'bg-green-100 text-green-800': selectedTags.includes(tag)}"
                                    @click="toggleTagSelection(tag)"
                                >
                                    <span>{{ tag }}</span>
                                    <svg v-if="selectedTags.includes(tag)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Categories Section -->
                        <div v-if="generatedPost?.suggestedCategories && generatedPost.suggestedCategories.length > 0" class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Categorias Sugeridas pela IA</h3>
                            <div class="flex flex-wrap gap-2 mb-4">
                                <div
                                    v-for="(suggestedCategory, index) in generatedPost.suggestedCategories"
                                    :key="index"
                                    class="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm flex items-center"
                                >
                                    <span>{{ suggestedCategory }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Available Categories -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Categorias Disponíveis</h3>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div v-if="loadingCategories" class="flex justify-center py-4">
                                    <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                                <div v-else-if="availableCategories.length === 0" class="text-center py-4 text-gray-500">
                                    Nenhuma categoria encontrada
                                </div>
                                <div v-else class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                                    <div v-for="category in availableCategories" :key="category.id" class="flex items-center">
                                        <input
                                            :id="'cat-' + category.id"
                                            type="checkbox"
                                            :value="category.id"
                                            v-model="selectedCategories"
                                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        >
                                        <label :for="'cat-' + category.id" class="ml-2 text-sm text-gray-700">{{ category.name }}</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="space-y-3">
                            <button
                                @click="createPostFromGenerated"
                                class="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Criar Post
                            </button>

                            <button
                                @click="generatePostPreview(previewCampaign)"
                                class="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Regenerar
                            </button>
                        </div>
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

const campaigns = ref([])
const loading = ref(true)
const error = ref(null)

const availableNetworks = ref([])
const loadingNetworks = ref(false)
const availableCategories = ref([])
const loadingCategories = ref(false)

const showDialog = ref(false)
const isEditing = ref(false)
const campaignForm = ref({
    name: '',
    _previousName: '',
    url: '',
    logo: '',
    description: '',
    networkId: '',
    metadata: [],
    domain: '',
    categories: [],
    active: true,
    highlight: false,
    slug: '',
    seoTitle: '',
    seoSubtitle: '',
    seoSmallText: '',
    seoLongText: ''
})
const campaignToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)
const categorySearch = ref('')

const showDeleteDialog = ref(false)
const campaignToDelete = ref(null)
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

const aiLoadingMap = ref({});
const exportLoading = ref(false);
const seoGenerating = ref(false);
const postGeneratingMap = ref({});
const showPostPreview = ref(false);
const previewCampaign = ref(null);
const generatedPost = ref(null);
const postGeneratingError = ref(null);
const selectedTags = ref([]);
const selectedCategories = ref([]);
const logoCropModalOpen = ref(false)
const logoZoomLevel = ref(1)
const logoCropCanvas = ref(null)
const logoImageInput = ref(null)
const selectedLogoImage = ref(null)
const logoCropContext = ref(null)
const isLogoDragging = ref(false)
const logoDragStart = ref({ x: 0, y: 0 })
const logoImagePosition = ref({ x: 0, y: 0 })

const showSearchDropdown = ref(false)
const searchInput = ref(null)

// More actions dropdown state
const showMoreActionsDropdown = ref(false)

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

const activeTab = ref('basic')

const loadCampaigns = async () => {
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

        const response = await affiliateClient.campaigns.get(apiFilters)

        if (response && response.data) {
            campaigns.value = response.data || []

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
            campaigns.value = []
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
        console.error('Failed to load campaigns:', err)
        loading.value = false
        error.value = err.message || 'Failed to load campaigns'
        showNotification('error', 'Failed to load campaigns')
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

const refreshData = () => {
    loadCampaigns()
}

const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

watch(filters, () => {
    loadCampaigns()
}, { deep: true })


const openAddDialog = async () => {
    isEditing.value = false
    activeTab.value = 'basic'
    campaignForm.value = {
        name: '',
        _previousName: '',
        url: '',
        logo: '',
        description: '',
        networkId: '',
        metadata: [],
        domain: '',
        categories: [],
        active: true,
        highlight: false,
        slug: '',
        seoTitle: '',
        seoSubtitle: '',
        seoSmallText: '',
        seoLongText: ''
    }
    formErrors.value = {}
    categorySearch.value = ''
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }

    if (availableCategories.value.length === 0) {
        await loadCategories()
    }
}

const openEditDialog = async (campaign) => {
    isEditing.value = true
    activeTab.value = 'basic'
    campaignToEdit.value = campaign
    const parsedMetadata = parseMetadata(campaign.metadata);

    campaignForm.value = {
        name: campaign.name,
        _previousName: campaign.name,
        url: campaign.url || '',
        logo: campaign.logo || '',
        description: campaign.description || '',
        networkId: campaign.network || '',
        metadata: parsedMetadata,
        domain: campaign.domain || '',
        categories: campaign.categories || [],
        active: campaign.active !== false,
        highlight: campaign.highlight === true,
        slug: campaign.slug || '',
        seoTitle: campaign.seoTitle || '',
        seoSubtitle: campaign.seoSubtitle || '',
        seoSmallText: campaign.seoSmallText || '',
        seoLongText: campaign.seoLongText || ''
    }
    formErrors.value = {}
    categorySearch.value = ''
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }

    if (availableCategories.value.length === 0) {
        await loadCategories()
    }
}

const closeDialog = () => {
    showDialog.value = false
    categorySearch.value = ''
    campaignForm.value = {
        name: '',
        url: '',
        logo: '',
        description: '',
        networkId: '',
        metadata: [],
        categories: [],
        active: true,
        highlight: false,
        slug: '',
        seoTitle: '',
        seoSubtitle: '',
        seoSmallText: '',
        seoLongText: ''
    }
    formErrors.value = {}
    campaignToEdit.value = null
}

const saveCampaign = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        if (!campaignForm.value.name.trim()) {
            formErrors.value.name = 'Campaign name is required'
            formLoading.value = false
            return
        }

        if (!campaignForm.value.url.trim()) {
            formErrors.value.url = 'Campaign URL is required'
            formLoading.value = false
            return
        }

        if (!campaignForm.value.networkId) {
            formErrors.value.networkId = 'Please select a network'
            formLoading.value = false
            return
        }

        // Clean domain before saving
        cleanDomain();

        const metadataObject = {};
        campaignForm.value.metadata.forEach(item => {
            if (item.key.trim()) {
                let value = item.value;
                if (item.type === 'number' && !isNaN(Number(value))) {
                    value = Number(value);
                }
                metadataObject[item.key.trim()] = value;
            }
        });

        const campaignData = {
            name: campaignForm.value.name.trim(),
            url: campaignForm.value.url.trim(),
            logo: campaignForm.value.logo,
            description: campaignForm.value.description?.trim(),
            network: campaignForm.value.networkId,
            domain: campaignForm.value.domain,
            metadata: Object.keys(metadataObject).length > 0 ? JSON.stringify(metadataObject) : null,
            categories: campaignForm.value.categories,
            active: campaignForm.value.active,
            highlight: campaignForm.value.highlight,
            slug: campaignForm.value.slug.trim() || undefined,
            seoTitle: campaignForm.value.seoTitle || '',
            seoSubtitle: campaignForm.value.seoSubtitle || '',
            seoSmallText: campaignForm.value.seoSmallText || '',
            seoLongText: campaignForm.value.seoLongText || ''
        }

        if (campaignForm.value.logo && campaignForm.value.logo.startsWith('data:')) {
            try {
                const logoBackup = campaignForm.value.logo;

                if (isEditing.value && campaignToEdit.value)
                    campaignData.logo = campaignToEdit.value.logo || '';
                else
                    campaignData.logo = '';

                let campaign;
                let campaignId;

                if (isEditing.value && campaignToEdit.value) {
                    campaignId = campaignToEdit.value.id;
                    campaign = await affiliateClient.campaigns.update(campaignId, campaignData);
                } else {
                    campaign = await affiliateClient.campaigns.insert(campaignData);
                    campaignId = campaign.id;
                }

                if (!campaignId) {
                    console.error('Failed to get campaign ID for logo update', campaign);
                    throw new Error('Unable to update logo: Missing campaign ID');
                }

                await affiliateClient.campaigns.updateLogo(campaignId, logoBackup);

                showNotification('success', isEditing.value
                    ? 'Campaign updated successfully'
                    : 'Campaign created successfully'
                );

                formLoading.value = false;
                closeDialog();
                refreshData();
                return;
            } catch (err) {
                formLoading.value = false;

                if (err.response?.data?.errors)
                    formErrors.value = err.response.data.errors;
                else
                    showNotification('error', err.message || 'Failed to save campaign');

                return;
            }
        } else {
            try {
                if (isEditing.value && campaignToEdit.value) {
                    await affiliateClient.campaigns.update(campaignToEdit.value.id, campaignData);
                    showNotification('success', 'Campaign updated successfully');
                } else {
                    await affiliateClient.campaigns.insert(campaignData);
                    showNotification('success', 'Campaign created successfully');
                }

                formLoading.value = false;
                closeDialog();
                refreshData();
            } catch (err) {
                formLoading.value = false;

                if (err.response?.data?.errors)
                    formErrors.value = err.response.data.errors;
                else
                    showNotification('error', err.message || 'Failed to save campaign');
            }
        }
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save campaign')
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
        await affiliateClient.campaigns.delete(campaignToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Campaign deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete campaign:', err)
        showNotification('error', err.message || 'Failed to delete campaign')
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

const addMetadataItem = () => {
    campaignForm.value.metadata.push({
        key: '',
        value: '',
        type: 'string'
    });
};

const removeMetadataItem = (index) => {
    campaignForm.value.metadata.splice(index, 1);
};

const parseMetadata = (metadataJson) => {
    try {
        if (!metadataJson) return [];

        const metadata = JSON.parse(metadataJson);
        const result = [];

        for (const key in metadata) {
            if (Object.prototype.hasOwnProperty.call(metadata, key)) {
                const value = metadata[key];
                let type = 'string';

                if (typeof value === 'number') {
                    type = 'number';
                } else if (value && value.length > 50) {
                    type = 'text';
                }

                result.push({ key, value, type });
            }
        }

        return result;
    } catch (e) {
        console.error('Failed to parse metadata:', e);
        return [];
    }
};

const generateSEOWithAI = async () => {
    if (!campaignForm.value.domain) {
        showNotification('error', 'Domain is required to generate SEO content');
        return;
    }

    try {
        seoGenerating.value = true;

        let campaignId;

        // If editing existing campaign, use its ID
        if (isEditing.value && campaignToEdit.value) {
            campaignId = campaignToEdit.value.id;
        } else {
            // If creating new campaign, we need to save it first
            if (!campaignForm.value.name.trim()) {
                showNotification('error', 'Campaign name is required before generating SEO content');
                seoGenerating.value = false;
                return;
            }

            // Create a temporary campaign to get SEO content
            const tempCampaignData = {
                name: campaignForm.value.name.trim(),
                url: campaignForm.value.url.trim() || 'https://example.com',
                domain: campaignForm.value.domain,
                network: campaignForm.value.networkId || null,
                active: false, // Keep it inactive until user saves
                description: campaignForm.value.description?.trim() || '',
                categories: campaignForm.value.categories || [],
                highlight: false,
                metadata: null
            };

            const tempCampaign = await affiliateClient.campaigns.insert(tempCampaignData);
            campaignId = tempCampaign.id;
        }

        // Start the asynchronous job
        showNotification('info', 'Starting SEO content generation... This may take a few minutes.');
        const jobResponse = await affiliateClient.campaigns.startSEOJob(campaignId);

        if (!jobResponse || !jobResponse.jobId) {
            throw new Error('Failed to start SEO generation job');
        }

        const jobId = jobResponse.jobId;

        // Poll for job completion
        const pollJob = async () => {
            try {
                const statusResponse = await affiliateClient.campaigns.getJobStatus(jobId);

                if (statusResponse.status === 'completed') {
                    const seoContent = statusResponse.result?.seoContent;

                    if (seoContent) {
                        // Update form with generated content
                        campaignForm.value.seoTitle = seoContent.seoTitle || '';
                        campaignForm.value.seoSubtitle = seoContent.seoSubtitle || '';
                        campaignForm.value.seoSmallText = seoContent.seoSmallText || '';
                        campaignForm.value.seoLongText = seoContent.seoLongText || '';

                        showNotification('success', 'SEO content generated successfully!');
                    } else {
                        showNotification('error', 'SEO content was generated but could not be retrieved');
                    }

                    seoGenerating.value = false;
                    return;
                } else if (statusResponse.status === 'error') {
                    throw new Error(statusResponse.error || 'SEO generation failed');
                } else if (statusResponse.status === 'processing') {
                    showNotification('info', 'SEO content is being generated by AI... Please wait.');
                    setTimeout(pollJob, 5000); // Poll every 5 seconds
                } else {
                    // Still pending
                    setTimeout(pollJob, 3000); // Poll every 3 seconds
                }
            } catch (pollError) {
                console.error('Error polling job status:', pollError);
                showNotification('error', 'Failed to check SEO generation status');
                seoGenerating.value = false;
            }
        };

        // Start polling after a short delay
        setTimeout(pollJob, 2000);

    } catch (err) {
        console.error('Failed to start SEO generation:', err);
        showNotification('error', err.message || 'Failed to start SEO generation');
        seoGenerating.value = false;
    }
};

const collectCouponsWithAI = async (campaign) => {
    if (aiLoadingMap.value[campaign.id]) return;

    try {
        aiLoadingMap.value[campaign.id] = true;
        const response = await affiliateClient.coupons.getCouponsWithAI(campaign.id);

        if (response && response.success) {
            const couponsCount = response.coupons?.length || 0;
            showNotification(
                'success',
                `Successfully collected ${couponsCount} coupons for "${campaign.name}"`
            );
        } else {
            showNotification(
                'error',
                response.message || 'Failed to collect coupons using AI'
            );
        }
    } catch (err) {
        console.error('Failed to collect coupons with AI:', err);
        showNotification(
            'error',
            err.message || 'Failed to collect coupons using AI'
        );
    } finally {
        aiLoadingMap.value[campaign.id] = false;
    }
}

const generatePostPreview = async (campaign) => {
    if (postGeneratingMap.value[campaign.id]) return;

    try {
        postGeneratingMap.value[campaign.id] = true;
        postGeneratingError.value = null;

        showNotification('info', `Iniciando geração de conteúdo para ${campaign.name}... Isso pode levar alguns minutos.`);

        // Start the asynchronous job
        const jobResponse = await affiliateClient.coupons.startPostJob(campaign.id);

        if (!jobResponse || !jobResponse.jobId) {
            throw new Error('Failed to start post generation job');
        }

        const jobId = jobResponse.jobId;

        // Poll for job completion
        const pollJob = async () => {
            try {
                const statusResponse = await affiliateClient.coupons.getPostJobStatus(jobId);

                if (statusResponse.status === 'completed') {
                    const result = statusResponse.result;

                    if (result && result.success && result.data) {
                        generatedPost.value = result.data;
                        previewCampaign.value = campaign;
                        selectedTags.value = result.data.suggestedTags || [];
                        selectedCategories.value = [];
                        showPostPreview.value = true;
                        document.body.style.overflow = 'hidden';

                        // Load categories for selection
                        await loadCategories();

                        showNotification('success', 'Post preview generated successfully!');
                    } else {
                        throw new Error('Post content was generated but could not be retrieved');
                    }

                    postGeneratingMap.value[campaign.id] = false;
                    return;
                } else if (statusResponse.status === 'error') {
                    throw new Error(statusResponse.error || 'Post generation failed');
                } else if (statusResponse.status === 'processing') {
                    showNotification('info', `Gerando conteúdo para ${campaign.name}... A IA está processando, aguarde.`);
                    setTimeout(pollJob, 8000);
                } else {
                    setTimeout(pollJob, 5000);
                }
            } catch (pollError) {
                console.error('Error polling post job status:', pollError);

                let errorMessage = 'Failed to check post generation status';

                if (pollError.message?.includes('timeout') || pollError.message?.includes('Timeout')) {
                    errorMessage = 'A geração demorou mais que o esperado. Tente novamente em alguns minutos.';
                } else if (pollError.message?.includes('fetch failed') || pollError.message?.includes('connect')) {
                    errorMessage = 'Problemas de conexão com o serviço de IA. Verifique sua internet e tente novamente.';
                } else if (pollError.message?.includes('No active coupons found')) {
                    errorMessage = `Nenhum cupom ativo encontrado para ${campaign.name}. Adicione cupons primeiro.`;
                } else if (pollError.message?.includes('after 3 attempts')) {
                    errorMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.';
                }

                postGeneratingError.value = errorMessage;
                showNotification('error', errorMessage);
                postGeneratingMap.value[campaign.id] = false;
            }
        };

        setTimeout(pollJob, 3000);

    } catch (err) {
        console.error('Failed to start post generation:', err);
        postGeneratingError.value = err.message || 'Failed to generate post content';

        let errorMessage = 'Failed to start post generation';

        if (err.message?.includes('No active coupons found')) {
            errorMessage = `Nenhum cupom ativo encontrado para ${campaign.name}. Adicione cupons primeiro.`;
        } else if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
            errorMessage = 'A geração demorou mais que o esperado. Tente novamente em alguns minutos.';
        } else if (err.message?.includes('fetch failed') || err.message?.includes('connect')) {
            errorMessage = 'Problemas de conexão com o serviço de IA. Verifique sua internet e tente novamente.';
        }

        showNotification('error', errorMessage);
        postGeneratingMap.value[campaign.id] = false;
    }
}

const closePostPreview = () => {
    showPostPreview.value = false;
    previewCampaign.value = null;
    generatedPost.value = null;
    postGeneratingError.value = null;
    selectedTags.value = [];
    selectedCategories.value = [];
    document.body.style.overflow = '';
}

const createPostFromGenerated = async () => {
    if (!generatedPost.value || !previewCampaign.value) return;

    try {
        showNotification('info', 'Creating post from generated content...');

        const slug = generatedPost.value.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const tags = selectedTags.value.length > 0
            ? selectedTags.value
            : [previewCampaign.value.name, 'Cupons', 'Descontos'];

        const postData = {
            post: {
                title: generatedPost.value.title,
                slug: slug,
                content: generatedPost.value.content,
                status: 'draft',
                excerpt: generatedPost.value.content.substring(0, 200).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                featureImage: generatedPost.value.coverImage || previewCampaign.value.logo || null,
                tags: tags,
                categories: selectedCategories.value
            },
            meta: {
                metaTitle: generatedPost.value.title,
                metacontent: generatedPost.value.content.substring(0, 155).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                ogTitle: generatedPost.value.title,
                ogcontent: generatedPost.value.content.substring(0, 155).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                ogImage: generatedPost.value.coverImage || previewCampaign.value.logo || null,
                twitterTitle: generatedPost.value.title,
                twittercontent: generatedPost.value.content.substring(0, 155).replace(/<\/?[^>]+(>|$)/g, "") + '...',
                twitterImage: generatedPost.value.coverImage || previewCampaign.value.logo || null
            }
        };

        const saveResponse = await adminClient.posts.save(postData);

        if (!saveResponse || !saveResponse.id)
            throw new Error("Failed to create post");

        showNotification('success', 'Post created successfully!');
        closePostPreview();

        setTimeout(() => {
            window.open(`/admin/posts/edit/${saveResponse.id}`, '_blank');
        }, 1000);

    } catch (err) {
        console.error('Failed to create post:', err);
        showNotification('error', 'Failed to create post: ' + (err.message || 'Unknown error'));
    }
}

const toggleTagSelection = (tag) => {
    const index = selectedTags.value.indexOf(tag);
    if (index !== -1) {
        selectedTags.value.splice(index, 1);
    } else {
        selectedTags.value.push(tag);
    }
}

const openLogoUpload = () => {
    logoImageInput.value.click()
}

const removeLogo = () => {
    campaignForm.value.logo = ''
    showNotification('info', 'Logo removed')
}

const handleLogoImageSelect = (event) => {
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
            console.log('Logo image loaded', { width: img.width, height: img.height })
            selectedLogoImage.value = img
            logoCropModalOpen.value = true

            setTimeout(() => {
                initLogoCropCanvas()
            }, 100)
        }

        img.onerror = (err) => {
            console.error('Logo image loading error', err)
            showNotification('error', 'Failed to load logo image')
        }

        img.src = e.target.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
}

const initLogoCropCanvas = () => {
    if (!logoCropCanvas.value || !selectedLogoImage.value) return

    const canvas = logoCropCanvas.value
    const ctx = canvas.getContext('2d')
    logoCropContext.value = ctx
    logoZoomLevel.value = 1
    logoImagePosition.value = { x: 0, y: 0 }

    drawLogoImageOnCanvas()
}

const drawLogoImageOnCanvas = () => {
    if (!logoCropCanvas.value || !selectedLogoImage.value || !logoCropContext.value) return

    const canvas = logoCropCanvas.value
    const ctx = logoCropContext.value
    const img = selectedLogoImage.value

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * logoZoomLevel.value
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale

    const x = logoImagePosition.value.x + (canvas.width - scaledWidth) / 2
    const y = logoImagePosition.value.y + (canvas.height - scaledHeight) / 2

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'

    ctx.fillRect(0, 0, canvas.width, canvas.height / 2 - 62.5)
    ctx.fillRect(0, canvas.height / 2 + 62.5, canvas.width, canvas.height / 2 - 62.5)
    ctx.fillRect(0, canvas.height / 2 - 62.5, canvas.width / 2 - 80, 125)
    ctx.fillRect(canvas.width / 2 + 80, canvas.height / 2 - 62.5, canvas.width / 2 - 80, 125)

    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.strokeRect(canvas.width / 2 - 80, canvas.height / 2 - 62.5, 160, 125)
}

const startLogoDrag = (e) => {
    isLogoDragging.value = true

    if (e.type.includes('mouse'))
        logoDragStart.value = { x: e.clientX, y: e.clientY }
    else
        logoDragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
}

const onLogoDrag = (e) => {
    if (!isLogoDragging.value) return

    e.preventDefault()

    let currentX, currentY
    if (e.type.includes('mouse')) {
        currentX = e.clientX
        currentY = e.clientY
    } else {
        currentX = e.touches[0].clientX
        currentY = e.touches[0].clientY
    }

    const deltaX = currentX - logoDragStart.value.x
    const deltaY = currentY - logoDragStart.value.y

    logoImagePosition.value = {
        x: logoImagePosition.value.x + deltaX,
        y: logoImagePosition.value.y + deltaY
    }

    logoDragStart.value = { x: currentX, y: currentY }
    drawLogoImageOnCanvas()
}

const stopLogoDrag = () => {
    isLogoDragging.value = false
}

const handleLogoWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    adjustLogoZoom(delta)
}

const adjustLogoZoom = (delta) => {
    logoZoomLevel.value = Math.max(0.5, Math.min(3, logoZoomLevel.value + delta))
    drawLogoImageOnCanvas()
}

const cropLogo = async () => {
    if (!logoCropCanvas.value || !selectedLogoImage.value || !logoCropContext.value) return

    const canvas = logoCropCanvas.value
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    tempCanvas.width = 160
    tempCanvas.height = 125

    const cropArea = {
        x: canvas.width / 2 - 80,
        y: canvas.height / 2 - 62.5,
        width: 160,
        height: 125
    }

    const scale = Math.max(canvas.width / selectedLogoImage.value.width, canvas.height / selectedLogoImage.value.height) * logoZoomLevel.value
    const scaledWidth = selectedLogoImage.value.width * scale
    const scaledHeight = selectedLogoImage.value.height * scale

    const x = logoImagePosition.value.x + (canvas.width - scaledWidth) / 2
    const y = logoImagePosition.value.y + (canvas.height - scaledHeight) / 2

    const srcX = (cropArea.x - x) / scale
    const srcY = (cropArea.y - y) / scale
    const srcWidth = cropArea.width / scale
    const srcHeight = cropArea.height / scale

    tempCtx.drawImage(
        selectedLogoImage.value,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, 160, 125
    )

    try {
        const webpData = await convertToWebP(tempCanvas, 0.8)
        campaignForm.value.logo = webpData
        logoCropModalOpen.value = false

        showNotification('success', 'Logo updated')
    } catch (err) {
        console.error('Failed to convert image to WebP:', err)
        const jpegData = tempCanvas.toDataURL('image/jpeg', 0.8)
        campaignForm.value.logo = jpegData

        logoCropModalOpen.value = false
        showNotification('success', 'Logo updated (as JPEG)')
    }
}

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

const toggleMoreActionsDropdown = () => {
    showMoreActionsDropdown.value = !showMoreActionsDropdown.value;
}

const openImportFileDialog = () => {
    importFileInput.value.click();
}

// Handle JSON file selection
const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
        showNotification('error', 'Please select a valid JSON file');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);

            if (!Array.isArray(jsonData)) {
                showNotification('error', 'Invalid JSON format. Expected an array of campaigns.');
                return;
            }

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
    event.target.value = '';
}

const startImport = (campaigns) => {
    importProgress.value = {
        current: 0,
        total: campaigns.length,
        percentage: 0,
        success: 0,
        failed: 0,
        currentItem: '',
        errorMessage: ''
    };

    showImportProgress.value = true;
    importInProgress.value = true;
    importFinished.value = false;
    importCancelled.value = false;

    processCampaigns(campaigns);
}

const processCampaigns = async (campaigns) => {
    for (let i = 0; i < campaigns.length; i++) {
        if (importCancelled.value)
            break;

        const campaign = campaigns[i];
        importProgress.value.current = i + 1;
        importProgress.value.percentage = Math.round((importProgress.value.current / importProgress.value.total) * 100);

        try {
            importProgress.value.currentItem = campaign.name || `Campaign ${i + 1}`;
            importProgress.value.errorMessage = '';

            if (!campaign.name || !campaign.url)
                throw new Error('Campaign requires name and URL fields');

            const campaignData = {
                name: campaign.name.trim(),
                url: campaign.url.trim(),
                slug: campaign.slug || '',
                logo: campaign.logo || '',
                description: campaign.description || '',
                network: campaign.network || campaign.networkId || '',
                domain: campaign.domain || '',
                metadata: campaign.metadata ? (typeof campaign.metadata === 'string' ? campaign.metadata : JSON.stringify(campaign.metadata)) : null,
                categories: campaign.categories || [],
                active: campaign.active !== undefined ? campaign.active : true,
                highlight: campaign.highlight || false
            };

            await affiliateClient.campaigns.insert(campaignData);

            importProgress.value.success++;
        } catch (err) {
            console.error(`Failed to import campaign ${i + 1}:`, err);
            importProgress.value.failed++;
            importProgress.value.errorMessage = err.message || 'Failed to import campaign';
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Import completed
    importInProgress.value = false;
    importFinished.value = true;
    refreshData();

    if (importCancelled.value) {
        showNotification('info', `Import cancelled. ${importProgress.value.success} campaigns imported successfully.`);
    } else {
        showNotification('success', `Import completed. ${importProgress.value.success} campaigns imported successfully, ${importProgress.value.failed} failed.`);
    }
}

// Cancel the import process
const cancelImport = () => {
    if (importInProgress.value) {
        importCancelled.value = true;
    } else {
        closeImportDialog();
    }
}

// Close import dialog
const closeImportDialog = () => {
    showImportProgress.value = false;
    importCancelled.value = false;
}

const getCategoryName = (categoryId) => {
    const category = availableCategories.value.find(c => c.id === categoryId)
    return category ? category.name : 'Unknown Category'
}

const removeCategory = (categoryId) => {
    const index = campaignForm.value.categories.indexOf(categoryId)
    if (index !== -1) {
        campaignForm.value.categories.splice(index, 1)
    }
}

const filteredCategories = computed(() => {
    if (!categorySearch.value.trim()) {
        return availableCategories.value
    }
    const searchLower = categorySearch.value.toLowerCase()
    return availableCategories.value.filter(category =>
        category.name.toLowerCase().includes(searchLower)
    )
})

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

const updateSlug = () => {
    if (!campaignForm.value.slug ||
        campaignForm.value.slug === generateSlug(campaignForm.value._previousName)) {
        campaignForm.value.slug = generateSlug(campaignForm.value.name)
    }

    campaignForm.value._previousName = campaignForm.value.name
}

const toggleActive = async (campaign) => {
    try {
        const updatedCampaign = {
            ...campaign,
            active: !campaign.active
        };

        await affiliateClient.campaigns.update(campaign.id, updatedCampaign);
        const index = campaigns.value.findIndex(c => c.id === campaign.id);

        if (index !== -1)
            campaigns.value[index].active = !campaign.active;

        showNotification('success', `Campaign ${updatedCampaign.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        console.error('Failed to toggle campaign active state:', err);
        showNotification('error', err.message || 'Failed to update campaign status');
        campaign.active = !campaign.active;
    }
}

const exportCampaigns = async () => {
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
            showNotification('error', 'Only root users can export campaigns');
            exportLoading.value = false;
            return;
        }

        window.open(`/api/affiliate/campaigns/export?token=${signature}`, '_blank');
    } catch (err) {
        console.error('Failed to export campaigns:', err);
        showNotification('error', err.message || 'Failed to export campaigns');
    } finally {
        exportLoading.value = false;
    }
}

onMounted(() => {
    document.addEventListener('click', (event) => {
        const target = event.target
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false
        }

        // Handle more actions dropdown
        if (!target.closest('[data-more-actions-toggle]') && showMoreActionsDropdown.value) {
            showMoreActionsDropdown.value = false
        }
    })

    loadCampaigns()
    loadNetworks()
    loadCategories()
})

// Add this to the script section, somewhere before the saveCampaign method
const cleanDomain = () => {
    if (campaignForm.value.domain) {
        // Remove http:// or https:// protocol
        let cleanedDomain = campaignForm.value.domain.replace(/^https?:\/\//, '');
        // Remove www.
        cleanedDomain = cleanedDomain.replace(/^www\./, '');
        // Remove trailing slashes
        cleanedDomain = cleanedDomain.replace(/\/+$/, '');

        campaignForm.value.domain = cleanedDomain;
    }
}
</script>
