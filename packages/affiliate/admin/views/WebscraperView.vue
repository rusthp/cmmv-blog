<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Webscraper</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Filter
                </button>
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
                <!-- Search dropdown -->
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
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-3">
                            <div class="relative">
                                <input
                                    v-model="filters.search"
                                    type="text"
                                    placeholder="Search filters..."
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
            <span class="ml-3 text-neutral-400">Loading webscraper filters...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load webscraper filters</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="webscrapers.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <p class="text-neutral-300 mb-2">No webscraper filters found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first webscraper filter</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Filter
            </button>
        </div>

        <!-- Webscrapers table -->
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
                            <th
                                @click="toggleSort('domain')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Domain
                                <span v-if="filters.sortBy === 'domain'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Fields
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
                        <tr v-for="webscraper in webscrapers" :key="webscraper.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="webscraper.id">
                                {{ webscraper.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ webscraper.label }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                <span class="font-mono">{{ webscraper.domain }}</span>
                            </td>
                            <td class="px-6 py-4 text-sm text-neutral-400">
                                <div class="flex flex-wrap gap-1">
                                    <span
                                        v-for="field in getDisplayFields(webscraper.fields)"
                                        :key="field.name || field"
                                        class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-900/40 text-blue-200 border border-blue-800"
                                        :title="typeof field === 'object' ? `Regex: ${field.regex}` : field"
                                    >
                                        {{ typeof field === 'object' ? field.name : field }}
                                    </span>
                                    <span v-if="!getDisplayFields(webscraper.fields) || getDisplayFields(webscraper.fields).length === 0" class="text-neutral-500">
                                        No fields
                                    </span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <button
                                    @click="toggleActive(webscraper)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        webscraper.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(webscraper)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(webscraper)"
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
            itemName="filters"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Webscraper Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto max-h-full flex flex-col">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center flex-shrink-0">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Webscraper' : 'Add Webscraper' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto flex-1">
                    <form @submit.prevent="saveWebscraper">
                        <div class="mb-4">
                            <label for="webscraperLabel" class="block text-sm font-medium text-neutral-300 mb-1">Label</label>
                            <input
                                id="webscraperLabel"
                                v-model="webscraperForm.label"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Filter label"
                                required
                            />
                            <p class="mt-1 text-sm text-neutral-500">A descriptive name for this webscraper filter</p>
                            <p v-if="formErrors.label" class="mt-1 text-sm text-red-500">{{ formErrors.label }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="webscraperDomain" class="block text-sm font-medium text-neutral-300 mb-1">Domain</label>
                            <input
                                id="webscraperDomain"
                                v-model="webscraperForm.domain"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="example.com"
                                required
                                @input="cleanDomain"
                            />
                            <p class="mt-1 text-sm text-neutral-500">The domain to scrape (without protocol or www)</p>
                            <p v-if="formErrors.domain" class="mt-1 text-sm text-red-500">{{ formErrors.domain }}</p>
                        </div>

                        <!-- AI Field Extraction Section -->
                        <div class="mb-4">
                            <div class="bg-neutral-750 p-4 rounded-md border border-neutral-600">
                                <h4 class="text-sm font-medium text-neutral-300 mb-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    AI Field Extraction
                                </h4>
                                <p class="text-xs text-neutral-400 mb-3">Automatically analyze a webpage and generate field extraction patterns using AI</p>

                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-xs font-medium text-neutral-400 mb-1">Sample URL</label>
                                        <input
                                            v-model="aiExtractionForm.url"
                                            type="url"
                                            class="w-full px-2 py-1 text-sm bg-neutral-600 border border-neutral-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="https://example.com/product-page"
                                        />
                                        <p class="text-xs text-neutral-500 mt-1">Enter a sample URL from the website to analyze</p>
                                    </div>

                                    <div>
                                        <label class="block text-xs font-medium text-neutral-400 mb-1">Content Type</label>
                                        <select
                                            v-model="aiExtractionForm.type"
                                            class="w-full px-2 py-1 text-sm bg-neutral-600 border border-neutral-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Select content type</option>
                                            <option value="coupon">Coupon/Discount Page</option>
                                            <option value="product">Product Page</option>
                                        </select>
                                        <p class="text-xs text-neutral-500 mt-1">Choose the type of content to extract</p>
                                    </div>

                                    <div class="flex space-x-2">
                                        <button
                                            type="button"
                                            @click="extractFieldsWithAI"
                                            :disabled="!aiExtractionForm.url || !aiExtractionForm.type || aiExtractionLoading"
                                            class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center"
                                        >
                                            <span v-if="aiExtractionLoading" class="flex items-center">
                                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Analyzing...
                                            </span>
                                            <span v-else class="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Extract Fields
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            @click="testExtractedFields"
                                            :disabled="!aiExtractionForm.url || webscraperForm.fields.length === 0 || testRegexLoading"
                                            class="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors flex items-center"
                                            title="Test the current regex patterns against the sample URL"
                                        >
                                            <span v-if="testRegexLoading" class="flex items-center">
                                                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </span>
                                            <span v-else>
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>

                                    <!-- Test Results -->
                                    <div v-if="testResults" class="mt-3 p-3 bg-neutral-700 rounded border border-neutral-600">
                                        <h5 class="text-xs font-medium text-neutral-300 mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Test Results
                                        </h5>
                                        <div class="space-y-2 max-h-32 overflow-y-auto">
                                            <div v-for="(result, fieldName) in testResults" :key="fieldName" class="text-xs">
                                                <div class="flex items-center justify-between">
                                                    <span class="font-medium text-neutral-300">{{ fieldName }}:</span>
                                                    <span :class="result.success ? 'text-green-400' : 'text-red-400'">
                                                        {{ result.success ? `${result.count} matches` : 'Failed' }}
                                                    </span>
                                                </div>
                                                <div v-if="result.success && result.matches.length > 0" class="ml-2 text-neutral-400">
                                                    <div v-for="(match, index) in result.matches.slice(0, 2)" :key="index" class="truncate">
                                                        "{{ match.groups[0] || match.fullMatch }}"
                                                    </div>
                                                    <div v-if="result.matches.length > 2" class="text-neutral-500">
                                                        +{{ result.matches.length - 2 }} more...
                                                    </div>
                                                </div>
                                                <div v-if="!result.success" class="ml-2 text-red-400 text-xs">
                                                    {{ result.error }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-neutral-300 mb-2">Fields to Extract</label>
                            <div class="bg-neutral-750 p-3 rounded-md mb-2">
                                <div v-if="webscraperForm.fields.length === 0" class="text-center py-4 text-neutral-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p class="text-sm">No fields added yet</p>
                                    <p class="text-xs text-neutral-600 mt-1">Click "Add Field" to get started</p>
                                </div>

                                <div v-else class="space-y-3 max-h-[300px] overflow-y-auto">
                                    <div
                                        v-for="(field, index) in webscraperForm.fields"
                                        :key="index"
                                        class="bg-neutral-700 p-3 rounded border border-neutral-600"
                                    >
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-sm font-medium text-neutral-300">Field {{ index + 1 }}</span>
                                            <button
                                                type="button"
                                                @click="removeField(index)"
                                                class="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                title="Remove field"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="space-y-2">
                                            <div>
                                                <label class="block text-xs font-medium text-neutral-400 mb-1">Field Name</label>
                                                <input
                                                    v-model="webscraperForm.fields[index].name"
                                                    type="text"
                                                    class="w-full px-2 py-1 text-sm bg-neutral-600 border border-neutral-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="e.g., title, price, description"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label class="block text-xs font-medium text-neutral-400 mb-1">Regex Pattern</label>
                                                <input
                                                    v-model="webscraperForm.fields[index].regex"
                                                    type="text"
                                                    class="w-full px-2 py-1 text-sm bg-neutral-600 border border-neutral-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                    placeholder="e.g., <title>(.*?)</title>"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    @click="addField"
                                    class="mt-3 w-full px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-md flex items-center justify-center transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Field
                                </button>

                                <div v-if="webscraperForm.fields.length > 0" class="mt-3 pt-2 border-t border-neutral-600">
                                    <div class="flex items-center justify-between text-sm text-neutral-400">
                                        <span>{{ webscraperForm.fields.length }} field{{ webscraperForm.fields.length !== 1 ? 's' : '' }} added</span>
                                        <button
                                            type="button"
                                            @click="clearAllFields"
                                            class="text-red-400 hover:text-red-300 text-xs"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">Specify which fields should be extracted from the website and their corresponding regex patterns</p>
                        </div>

                        <div class="mb-4">
                            <div class="flex items-center">
                                <input
                                    id="webscraperActive"
                                    v-model="webscraperForm.active"
                                    type="checkbox"
                                    class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                />
                                <label for="webscraperActive" class="ml-2 block text-sm font-medium text-neutral-300">
                                    Active
                                </label>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">Only active filters will be used for webscraping</p>
                        </div>

                    </form>
                </div>
                <div class="p-6 border-t border-neutral-700 flex justify-end space-x-3 flex-shrink-0">
                    <button
                        type="button"
                        @click="closeDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        @click="saveWebscraper"
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
            :item-name="webscraperToDelete?.label"
            :loading="deleteLoading"
            message="Are you sure you want to delete the webscraper filter"
            warning-text="This action cannot be undone. This may affect webscraping operations."
            loading-text="Deleting..."
            @confirm="deleteWebscraper"
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
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const affiliateClient = useAffiliateClient()

const webscrapers = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const webscraperForm = ref({
    label: '',
    domain: '',
    active: true,
    fields: []
})
const webscraperToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const webscraperToDelete = ref(null)
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

// AI Extraction form and state
const aiExtractionForm = ref({
    url: '',
    type: ''
})
const aiExtractionLoading = ref(false)
const testRegexLoading = ref(false)
const testResults = ref(null)

const loadWebscrapers = async () => {
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
            apiFilters.searchField = 'label'
        }

        const response = await affiliateClient.webscraper.get(apiFilters)

        if (response && response.data) {
            webscrapers.value = response.data || []

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
            webscrapers.value = []
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
        console.error('Failed to load webscraper filters:', err)
        loading.value = false
        error.value = err.message || 'Failed to load webscraper filters'
        showNotification('error', 'Failed to load webscraper filters')
    }
}

const refreshData = () => {
    loadWebscrapers()
}

const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

watch(filters, () => {
    loadWebscrapers()
}, { deep: true })

const openAddDialog = () => {
    isEditing.value = false
    webscraperForm.value = {
        label: '',
        domain: '',
        active: true,
        fields: []
    }
    formErrors.value = {}

    // Clear AI extraction form and results
    aiExtractionForm.value = {
        url: '',
        type: ''
    }
    testResults.value = null

    showDialog.value = true
}

const openEditDialog = (webscraper) => {
    isEditing.value = true
    webscraperToEdit.value = webscraper

    // Handle different field formats: JSON string, object array, or string array
    let normalizedFields = []

    if (webscraper.fields) {
        try {
            // If fields is a string, try to parse as JSON
            if (typeof webscraper.fields === 'string') {
                const parsedFields = JSON.parse(webscraper.fields)
                if (Array.isArray(parsedFields)) {
                    normalizedFields = parsedFields.map(field => {
                        if (typeof field === 'string') {
                            return { name: field, regex: '' }
                        }
                        return { name: field.name || '', regex: field.regex || '' }
                    })
                }
            }
            // If fields is already an array
            else if (Array.isArray(webscraper.fields)) {
                normalizedFields = webscraper.fields.map(field => {
                    if (typeof field === 'string') {
                        return { name: field, regex: '' }
                    }
                    return { name: field.name || '', regex: field.regex || '' }
                })
            }
        } catch (error) {
            console.warn('Failed to parse webscraper fields:', error)
            normalizedFields = []
        }
    }

    webscraperForm.value = {
        label: webscraper.label,
        domain: webscraper.domain,
        active: webscraper.active === undefined ? true : webscraper.active,
        fields: normalizedFields
    }
    formErrors.value = {}
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    webscraperForm.value = {
        label: '',
        domain: '',
        active: true,
        fields: []
    }
    formErrors.value = {}
    webscraperToEdit.value = null

    // Clear AI extraction form and results
    aiExtractionForm.value = {
        url: '',
        type: ''
    }
    testResults.value = null
}

const saveWebscraper = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        if (!webscraperForm.value.label.trim()) {
            formErrors.value.label = 'Label is required'
            formLoading.value = false
            return
        }

        if (!webscraperForm.value.domain.trim()) {
            formErrors.value.domain = 'Domain is required'
            formLoading.value = false
            return
        }

        const webscraperData = {
            label: webscraperForm.value.label.trim(),
            domain: webscraperForm.value.domain.trim(),
            active: webscraperForm.value.active,
            fields: JSON.stringify(webscraperForm.value.fields)
        }

        if (isEditing.value) {
            await affiliateClient.webscraper.update(webscraperToEdit.value.id, webscraperData)
            showNotification('success', 'Webscraper filter updated successfully')
        } else {
            await affiliateClient.webscraper.insert(webscraperData)
            showNotification('success', 'Webscraper filter created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save webscraper filter')
    }
}

const toggleActive = async (webscraper) => {
    try {
        const updatedWebscraper = {
            ...webscraper,
            active: !webscraper.active
        };

        await affiliateClient.webscraper.update(webscraper.id, updatedWebscraper);

        const index = webscrapers.value.findIndex(w => w.id === webscraper.id);
        if (index !== -1) {
            webscrapers.value[index].active = !webscraper.active;
        }

        showNotification('success', `Webscraper filter ${updatedWebscraper.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        console.error('Failed to toggle webscraper active state:', err);
        showNotification('error', err.message || 'Failed to update webscraper filter status');
    }
}

const confirmDelete = (webscraper) => {
    webscraperToDelete.value = webscraper
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    webscraperToDelete.value = null
}

const deleteWebscraper = async () => {
    if (!webscraperToDelete.value) return

    try {
        deleteLoading.value = true
        await affiliateClient.webscraper.delete(webscraperToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Webscraper filter deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete webscraper filter:', err)
        showNotification('error', err.message || 'Failed to delete webscraper filter')
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
        setTimeout(() => {
            searchInput.value?.focus()
        }, 100)
    }
}

const clearSearch = () => {
    filters.value.search = ''
    showSearchDropdown.value = false
}

const cleanDomain = () => {
    if (webscraperForm.value.domain) {
        let cleanedDomain = webscraperForm.value.domain.replace(/^https?:\/\//, '');
        cleanedDomain = cleanedDomain.replace(/^www\./, '');
        cleanedDomain = cleanedDomain.replace(/\/+$/, '');
        webscraperForm.value.domain = cleanedDomain;
    }
}

const addField = () => {
    webscraperForm.value.fields.push({ name: '', regex: '' })
}

const removeField = (index) => {
    webscraperForm.value.fields.splice(index, 1)
}

const clearAllFields = () => {
    webscraperForm.value.fields = []
    showNotification('info', 'All fields cleared')
}

// Helper function to parse and display fields correctly
const getDisplayFields = (fields) => {
    if (!fields) return []

    try {
        // If fields is a string, try to parse as JSON
        if (typeof fields === 'string') {
            const parsedFields = JSON.parse(fields)
            if (Array.isArray(parsedFields)) {
                return parsedFields
            }
            return []
        }

        // If fields is already an array, return as is
        if (Array.isArray(fields)) {
            return fields
        }

        return []
    } catch (error) {
        console.warn('Failed to parse fields for display:', error)
        return []
    }
}

// AI Field Extraction Functions
const extractFieldsWithAI = async () => {
    try {
        aiExtractionLoading.value = true
        testResults.value = null

        if (!aiExtractionForm.value.url || !aiExtractionForm.value.type) {
            showNotification('error', 'Please provide both URL and content type')
            return
        }

        // Make API call to analyze URL using SDK
        const result = await affiliateClient.webscraper.analyze({
            url: aiExtractionForm.value.url,
            type: aiExtractionForm.value.type
        })

        if (!result.success) {
            throw new Error(result.error || 'Analysis failed')
        }

        // Auto-fill domain from URL if not already set
        if (!webscraperForm.value.domain && aiExtractionForm.value.url) {
            try {
                const urlObj = new URL(aiExtractionForm.value.url)
                let domain = urlObj.hostname
                domain = domain.replace(/^www\./, '')
                webscraperForm.value.domain = domain
            } catch (e) {
                // Ignore domain extraction errors
            }
        }

        // Replace existing fields with AI-generated ones
        if (result.fields && result.fields.length > 0) {
            webscraperForm.value.fields = result.fields.map(field => ({
                name: field.name,
                regex: field.regex
            }))

            showNotification('success', `Successfully extracted ${result.fields.length} fields using AI`)
        } else {
            showNotification('warning', 'No fields were extracted from the URL')
        }

    } catch (error) {
        console.error('AI extraction error:', error)
        showNotification('error', error.message || 'Failed to extract fields with AI')
    } finally {
        aiExtractionLoading.value = false
    }
}

const testExtractedFields = async () => {
    try {
        testRegexLoading.value = true
        testResults.value = null

        if (!aiExtractionForm.value.url) {
            showNotification('error', 'Please provide a URL to test against')
            return
        }

        if (webscraperForm.value.fields.length === 0) {
            showNotification('error', 'No fields to test')
            return
        }

        // Prepare fields for testing
        const fieldsToTest = webscraperForm.value.fields
            .filter(field => field.name && field.regex)
            .map(field => ({
                name: field.name,
                regex: field.regex
            }))

        if (fieldsToTest.length === 0) {
            showNotification('error', 'No valid fields with regex patterns to test')
            return
        }

        // Make API call to test regex patterns using SDK
        const result = await affiliateClient.webscraper.testRegex({
            url: aiExtractionForm.value.url,
            fields: fieldsToTest
        })

        if (!result.success) {
            throw new Error(result.error || 'Regex testing failed')
        }

        testResults.value = result.results

        // Count successful matches
        const successCount = Object.values(result.results).filter(r => r.success && r.count > 0).length
        const totalCount = Object.keys(result.results).length

        if (successCount === totalCount) {
            showNotification('success', `All ${totalCount} regex patterns matched successfully`)
        } else if (successCount > 0) {
            showNotification('warning', `${successCount} of ${totalCount} regex patterns matched`)
        } else {
            showNotification('error', 'No regex patterns matched the content')
        }

    } catch (error) {
        console.error('Regex testing error:', error)
        showNotification('error', error.message || 'Failed to test regex patterns')
    } finally {
        testRegexLoading.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', (event) => {
        const target = event.target
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false
        }
    })

    loadWebscrapers()
})
</script>
