<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Feed Channels</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Channel
                </button>

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
                                    placeholder="Search channels..."
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
                                    <option value="url">URL</option>
                                    <option value="rss">RSS</option>
                                </select>
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
                                @click="showProcessFeedsWarning"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                                :disabled="processingFeeds"
                                title="Manual feed processing - Use sparingly as feeds are automatically processed every 30 minutes"
                            >
                                <svg v-if="processingFeeds" class="animate-spin h-3.5 w-3.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                {{ processingFeeds ? 'Processing...' : 'Process All Feeds' }}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading channels...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load channels</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="channels.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">No feed channels found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first feed channel</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Channel
            </button>
        </div>

        <!-- Channels table -->
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
                            <th
                                @click="toggleSort('lastUpdate')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Last Update
                                <span v-if="filters.sortBy === 'lastUpdate'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Source Type
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Update Interval
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
                        <tr v-for="channel in channels" :key="channel.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="channel.id">
                                {{ channel.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ channel.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ formatDate(channel.lastUpdate) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    (channel.sourceType || 'RSS') === 'WEB_SCRAPING' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-blue-600 text-white'
                                ]">
                                    {{ (channel.sourceType || 'RSS') === 'WEB_SCRAPING' ? 'Web Scraping' : 'RSS' }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ formatInterval(channel.intervalUpdate) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <button
                                    @click="toggleActive(channel)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        channel.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="processSingleFeed(channel)"
                                        title="Manual feed processing - Use sparingly as feeds are automatically processed every 30 minutes"
                                        class="text-neutral-400 hover:text-red-500 transition-colors"
                                        :disabled="processingChannels.includes(channel.id)"
                                    >
                                        <template v-if="processingChannels.includes(channel.id)">
                                            <svg class="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </template>
                                        <template v-else>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                            </svg>
                                        </template>
                                    </button>
                                    <button
                                        @click="openEditDialog(channel)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(channel)"
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
            itemName="channels"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Channel Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Channel' : 'Add Channel' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveChannel">
                        <div class="mb-4">
                            <label for="channelName" class="block text-sm font-medium text-neutral-300 mb-1">Channel Name</label>
                            <input
                                id="channelName"
                                v-model="channelForm.name"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Channel name"
                                required
                            />
                            <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="channelUrl" class="block text-sm font-medium text-neutral-300 mb-1">Website URL</label>
                            <input
                                id="channelUrl"
                                v-model="channelForm.url"
                                type="url"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="https://example.com"
                                required
                            />
                            <p v-if="formErrors.url" class="mt-1 text-sm text-red-500">{{ formErrors.url }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="channelSourceType" class="block text-sm font-medium text-neutral-300 mb-2">Source Type</label>
                            <div class="flex gap-4">
                                <label class="flex items-center">
                                    <input
                                        type="radio"
                                        v-model="channelForm.sourceType"
                                        value="RSS"
                                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                    />
                                    <span class="ml-2 text-sm text-neutral-300">RSS Feed</span>
                                </label>
                                <label class="flex items-center">
                                    <input
                                        type="radio"
                                        v-model="channelForm.sourceType"
                                        value="WEB_SCRAPING"
                                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                    />
                                    <span class="ml-2 text-sm text-neutral-300">Web Scraping</span>
                                </label>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">
                                <span v-if="channelForm.sourceType === 'RSS'">Collect news from RSS/Atom feed</span>
                                <span v-else>Scrape news directly from website listing page</span>
                            </p>
                        </div>

                        <div v-if="channelForm.sourceType === 'RSS'" class="mb-4">
                            <label for="channelRss" class="block text-sm font-medium text-neutral-300 mb-1">RSS Feed URL</label>
                            <input
                                id="channelRss"
                                v-model="channelForm.rss"
                                type="url"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="https://example.com/feed.xml"
                                :required="channelForm.sourceType === 'RSS'"
                            />
                            <p v-if="formErrors.rss" class="mt-1 text-sm text-red-500">{{ formErrors.rss }}</p>
                        </div>

                        <div v-if="channelForm.sourceType === 'WEB_SCRAPING'" class="mb-4">
                            <label for="channelListPageUrl" class="block text-sm font-medium text-neutral-300 mb-1">List Page URL</label>
                            <input
                                id="channelListPageUrl"
                                v-model="channelForm.listPageUrl"
                                type="url"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="https://example.com/noticias"
                                :required="channelForm.sourceType === 'WEB_SCRAPING'"
                            />
                            <p class="mt-1 text-sm text-neutral-500">URL of the page containing the list of news articles</p>
                            <p v-if="formErrors.listPageUrl" class="mt-1 text-sm text-red-500">{{ formErrors.listPageUrl }}</p>
                        </div>

                        <div v-if="channelForm.sourceType === 'WEB_SCRAPING'" class="mb-4">
                            <label for="channelScrapingConfig" class="block text-sm font-medium text-neutral-300 mb-1">Scraping Configuration (JSON)</label>
                            <textarea
                                id="channelScrapingConfig"
                                v-model="channelForm.scrapingConfig"
                                rows="6"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                placeholder='{"articleSelector": ".news-item", "titleSelector": "h3 a", "linkSelector": "h3 a", "imageSelector": "img", "dateSelector": ".date"}'
                            ></textarea>
                            <p class="mt-1 text-sm text-neutral-500">Optional: JSON configuration for extraction patterns. Leave empty to use defaults.</p>
                            <p v-if="formErrors.scrapingConfig" class="mt-1 text-sm text-red-500">{{ formErrors.scrapingConfig }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="channelInterval" class="block text-sm font-medium text-neutral-300 mb-1">Update Interval</label>
                            <div class="flex items-center">
                                <input
                                    id="channelInterval"
                                    v-model.number="channelForm.intervalHours"
                                    type="number"
                                    min="1"
                                    max="168"
                                    class="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                <span class="ml-2 text-neutral-300">hours</span>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">How often to check for new content (1-168 hours)</p>
                            <p v-if="formErrors.intervalUpdate" class="mt-1 text-sm text-red-500">{{ formErrors.intervalUpdate }}</p>
                        </div>

                        <div class="mb-4">
                            <div class="flex items-center">
                                <input
                                    id="channelActive"
                                    v-model="channelForm.active"
                                    type="checkbox"
                                    class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                />
                                <label for="channelActive" class="ml-2 block text-sm font-medium text-neutral-300">
                                    Active
                                </label>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">Only active channels will be processed</p>
                        </div>

                        <div class="mb-4">
                            <div class="flex items-center">
                                <input
                                    id="channelRequestLink"
                                    v-model="channelForm.requestLink"
                                    type="checkbox"
                                    class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                />
                                <label for="channelRequestLink" class="ml-2 block text-sm font-medium text-neutral-300">
                                    Request Original Links
                                </label>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">If enabled, the system will fetch the original article content from the source website. Disable for feeds that already include full content.</p>
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

        <!-- Process Feeds Warning Dialog -->
        <div v-if="showProcessWarning" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-4.93 4.93A10 10 0 1119.07 4.93 10 10 0 017.07 19.93z" />
                        </svg>
                        <h3 class="text-lg font-medium text-white">Manual Feed Processing</h3>
                    </div>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <p class="text-neutral-300 mb-3">
                            <strong>Important:</strong> Feeds are automatically processed every 30 minutes by the system.
                        </p>
                        <div class="bg-yellow-900/20 border border-yellow-700 rounded-md p-3 mb-4">
                            <div class="flex">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-4.93 4.93A10 10 0 1119.07 4.93 10 10 0 017.07 19.93z" />
                                </svg>
                                <div class="text-yellow-200 text-sm">
                                    <p class="font-medium mb-1">Please avoid frequent manual processing:</p>
                                    <ul class="list-disc list-inside space-y-1 text-yellow-300">
                                        <li>Can slow down the system</li>
                                        <li>May impact server performance</li>
                                        <li>Automatic processing is more efficient</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <p class="text-neutral-400 text-sm">
                            Only use manual processing if you need immediate updates for testing or urgent content synchronization.
                        </p>
                    </div>
                </div>
                <div class="p-6 border-t border-neutral-700 flex justify-end space-x-3">
                    <button
                        @click="closeProcessWarning"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="confirmProcessFeeds"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        :disabled="processingFeeds"
                    >
                        <span v-if="processingFeeds" class="flex items-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                        <span v-else>
                            Process Anyway
                        </span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="channelToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the channel"
            warning-text="This action cannot be undone. All feed content associated with this channel may be affected."
            loading-text="Deleting..."
            @confirm="deleteChannel"
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
import { useFeedClient } from '@cmmv/rss-aggregation/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const feedClient = useFeedClient()

const channels = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const channelForm = ref({
    name: '',
    url: '',
    rss: '',
    sourceType: 'RSS',
    listPageUrl: '',
    scrapingConfig: '',
    intervalHours: 24,
    active: true,
    requestLink: false
})
const channelToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const channelToDelete = ref(null)
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
    searchField: 'name',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1
})

const processingFeeds = ref(false)
const processingChannels = ref([])

// Process feeds warning dialog
const showProcessWarning = ref(false)

// Search dropdown functionality
const showSearchDropdown = ref(false)
const searchInput = ref(null)

const loadChannels = async () => {
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
            apiFilters.searchField = filters.value.searchField
        }

        const response = await feedClient.channels.get(apiFilters)

        if (response && response.data) {
            channels.value = response.data || []

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
            channels.value = []
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
        console.error('Failed to load channels:', err)
        loading.value = false
        error.value = err.message || 'Failed to load channels'
        showNotification('error', 'Failed to load channels')
    }
}

// Refresh data
const refreshData = () => {
    loadChannels()
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadChannels()
}, { deep: true })

// Dialog methods
const openAddDialog = () => {
    isEditing.value = false
    channelForm.value = {
        name: '',
        url: '',
        rss: '',
        sourceType: 'RSS',
        listPageUrl: '',
        scrapingConfig: '',
        intervalHours: 24,
        active: true,
        requestLink: false
    }
    formErrors.value = {}
    showDialog.value = true
}

const openEditDialog = (channel) => {
    isEditing.value = true
    channelToEdit.value = channel

    // Convert milliseconds to hours for the form
    const intervalHours = channel.intervalUpdate ? Math.floor(channel.intervalUpdate / (1000 * 60 * 60)) : 24

    // Parse scrapingConfig if it's a string
    let scrapingConfig = '';
    if (channel.scrapingConfig) {
        if (typeof channel.scrapingConfig === 'string') {
            scrapingConfig = channel.scrapingConfig;
        } else {
            scrapingConfig = JSON.stringify(channel.scrapingConfig, null, 2);
        }
    }

    channelForm.value = {
        name: channel.name,
        url: channel.url,
        rss: channel.rss || '',
        sourceType: channel.sourceType || 'RSS',
        listPageUrl: channel.listPageUrl || '',
        scrapingConfig: scrapingConfig,
        intervalHours: intervalHours,
        active: channel.active === undefined ? true : channel.active,
        requestLink: channel.requestLink === undefined ? false : channel.requestLink
    }
    formErrors.value = {}
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    channelForm.value = { name: '', url: '', rss: '', sourceType: 'RSS', listPageUrl: '', scrapingConfig: '', intervalHours: 24, active: true, requestLink: false }
    formErrors.value = {}
    channelToEdit.value = null
}

// Save channel
const saveChannel = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!channelForm.value.name.trim()) {
            formErrors.value.name = 'Channel name is required'
            formLoading.value = false
            return
        }

        if (!channelForm.value.url.trim()) {
            formErrors.value.url = 'Website URL is required'
            formLoading.value = false
            return
        }

        // Validate based on source type
        if (channelForm.value.sourceType === 'RSS') {
            if (!channelForm.value.rss.trim()) {
                formErrors.value.rss = 'RSS feed URL is required'
                formLoading.value = false
                return
            }
        } else if (channelForm.value.sourceType === 'WEB_SCRAPING') {
            if (!channelForm.value.listPageUrl.trim()) {
                formErrors.value.listPageUrl = 'List page URL is required for web scraping'
                formLoading.value = false
                return
            }

            // Validate JSON if provided
            if (channelForm.value.scrapingConfig.trim()) {
                try {
                    JSON.parse(channelForm.value.scrapingConfig)
                } catch (e) {
                    formErrors.value.scrapingConfig = 'Invalid JSON format'
                    formLoading.value = false
                    return
                }
            }
        }

        if (!channelForm.value.intervalHours || channelForm.value.intervalHours < 1 || channelForm.value.intervalHours > 168) {
            formErrors.value.intervalUpdate = 'Update interval must be between 1 and 168 hours'
            formLoading.value = false
            return
        }

        // Convert hours to milliseconds
        const intervalUpdate = channelForm.value.intervalHours * 60 * 60 * 1000

        // Prepare scraping config (validate JSON and store as string)
        let scrapingConfig = null;
        if (channelForm.value.sourceType === 'WEB_SCRAPING' && channelForm.value.scrapingConfig.trim()) {
            try {
                const parsed = JSON.parse(channelForm.value.scrapingConfig.trim());
                scrapingConfig = JSON.stringify(parsed);
            } catch (e) {
                // Already validated above, but just in case
                formErrors.value.scrapingConfig = 'Invalid JSON format'
                formLoading.value = false
                return
            }
        }

        const channelData = {
            name: channelForm.value.name.trim(),
            url: channelForm.value.url.trim(),
            rss: channelForm.value.rss.trim() || null,
            sourceType: channelForm.value.sourceType,
            listPageUrl: channelForm.value.sourceType === 'WEB_SCRAPING' ? channelForm.value.listPageUrl.trim() : null,
            scrapingConfig: scrapingConfig,
            intervalUpdate: intervalUpdate,
            active: channelForm.value.active,
            requestLink: channelForm.value.requestLink
        }

        if (isEditing.value) {
            await feedClient.channels.update(channelToEdit.value.id, channelData)
            showNotification('success', 'Channel updated successfully')
        } else {
            await feedClient.channels.insert(channelData)
            showNotification('success', 'Channel created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save channel')
    }
}

const confirmDelete = (channel) => {
    channelToDelete.value = channel
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    channelToDelete.value = null
}

const deleteChannel = async () => {
    if (!channelToDelete.value) return

    try {
        deleteLoading.value = true
        await feedClient.channels.delete(channelToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Channel deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete channel:', err)
        showNotification('error', err.message || 'Failed to delete channel')
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

const formatUrl = (url) => {
    if (!url) return '';

    try {
        const parsedUrl = new URL(url);
        // Return the hostname part plus path if it's not just '/'
        return parsedUrl.hostname + (parsedUrl.pathname !== '/' ? parsedUrl.pathname : '');
    } catch (e) {
        return url;
    }
}

const formatInterval = (interval) => {
    if (!interval) return '24 hours';

    const hours = Math.floor(interval / (1000 * 60 * 60));

    if (hours === 1) return '1 hour';
    return `${hours} hours`;
}

const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Never';

    return date.toLocaleString();
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'asc'
    }
}

const toggleActive = async (channel) => {
    try {
        const updatedChannel = {
            ...channel,
            active: !channel.active
        };

        await feedClient.channels.update(channel.id, updatedChannel);

        // Update the local state
        const index = channels.value.findIndex(c => c.id === channel.id);
        if (index !== -1) {
            channels.value[index].active = !channel.active;
        }

        showNotification('success', `Channel ${updatedChannel.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        console.error('Failed to toggle channel active state:', err);
        showNotification('error', err.message || 'Failed to update channel status');
    }
}

const showProcessFeedsWarning = () => {
    showMoreActionsDropdown.value = false
    showProcessWarning.value = true
}

const closeProcessWarning = () => {
    showProcessWarning.value = false
}

const confirmProcessFeeds = async () => {
    showProcessWarning.value = false
    await processFeeds()
}

const processFeeds = async () => {
    try {
        processingFeeds.value = true
        await feedClient.channels.processFeeds()
        showNotification('success', 'Feeds processed successfully')
        refreshData()
    } catch (err) {
        showNotification('error', err.message || 'Failed to process feeds')
    } finally {
        processingFeeds.value = false
    }
}

const processSingleFeed = async (channel) => {
    if (processingChannels.value.includes(channel.id)) return;

    try {
        processingChannels.value.push(channel.id);
        await feedClient.channels.processFeed(channel.id);
        showNotification('success', `Feed "${channel.name}" processed successfully`);

        // Refresh data to update last update time
        refreshData();
    } catch (err) {
        console.error('Failed to process feed:', err);
        showNotification('error', err.message || `Failed to process feed "${channel.name}"`);
    } finally {
        // Remove from processing list
        processingChannels.value = processingChannels.value.filter(id => id !== channel.id);
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
    loadChannels()
    showSearchDropdown.value = false
}

// More actions dropdown functionality
const showMoreActionsDropdown = ref(false)
const toggleMoreActionsDropdown = () => {
    showMoreActionsDropdown.value = !showMoreActionsDropdown.value
}

onMounted(() => {
    loadChannels()

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // Close search dropdown
        if (showSearchDropdown.value &&
            !e.target.closest('[data-search-toggle]') &&
            !e.target.closest('.absolute')) {
            showSearchDropdown.value = false
        }

        // Close more actions dropdown
        if (showMoreActionsDropdown.value &&
            !e.target.closest('[data-more-actions-toggle]')) {
            showMoreActionsDropdown.value = false
        }
    })
})
</script>
