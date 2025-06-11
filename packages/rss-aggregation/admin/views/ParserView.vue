<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Feed Parsers</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddParserDialog" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Parser
                </button>
                <button @click="openTestUrlDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Test URL Parser
                </button>
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading parsers...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load parsers</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="parsers.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p class="text-neutral-300 mb-2">No parsers found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first parser</p>
            <button @click="openAddParserDialog" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Add Parser
            </button>
        </div>

        <!-- Parsers List -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th
                                @click="toggleSort('title')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Title
                                <span v-if="filters.sortBy === 'title'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th
                                @click="toggleSort('channel')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Channel
                                <span v-if="filters.sortBy === 'channel'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="parser in parsers" :key="parser.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="parser.id">
                                {{ parser.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ parser.title }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ getChannelName(parser.channel) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="editParser(parser)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="testParser(parser)"
                                        title="Test Parser"
                                        class="text-neutral-400 hover:text-green-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="deleteParser(parser.id)"
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
            itemName="parsers"
            @pageChange="handlePageChange"
        />

        <!-- Test URL Parser Dialog -->
        <div v-if="showTestUrlDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">Test URL Parser</h3>
                    <button @click="closeTestUrlDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-neutral-300 mb-1">Enter URL to analyze</label>
                    <div class="flex">
                        <input
                            v-model="urlToTest"
                            type="url"
                            placeholder="https://example.com/article"
                            class="flex-grow px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        />
                        <button
                            @click="parseUrl"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors"
                            :disabled="!urlToTest || parsingUrl"
                        >
                            <div v-if="parsingUrl" class="flex items-center">
                                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </div>
                            <span v-else>Analyze</span>
                        </button>
                    </div>
                </div>

                <!-- URL Parsing Results -->
                <div v-if="parsingResults" class="mt-6 bg-neutral-700 rounded-lg p-4 overflow-x-auto">
                    <!-- Title Section -->
                    <div class="mb-6">
                        <h3 class="text-lg font-medium text-white flex items-center mb-2">
                            <span>Title (Preview)</span>
                            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
                                :class="getConfidenceBadgeClass(parsingResults.title.confidence)">
                                {{ parsingResults.title.confidence }}
                            </span>
                        </h3>
                        <div class="bg-neutral-800 p-3 rounded-md mb-2 max-h-40 overflow-y-auto">
                            <p class="text-white">{{ parsingResults.title.value }}</p>
                        </div>
                        <div class="bg-neutral-900 p-3 rounded-md font-mono text-xs text-blue-300 overflow-x-auto">
                            <p>{{ parsingResults.title.regex }}</p>
                        </div>
                    </div>

                    <!-- Content Section -->
                    <div class="mb-6">
                        <h3 class="text-lg font-medium text-white flex items-center mb-2">
                            <span>Content (Preview)</span>
                            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
                                :class="getConfidenceBadgeClass(parsingResults.content.confidence)">
                                {{ parsingResults.content.confidence }}
                            </span>
                        </h3>
                        <div class="bg-neutral-800 p-3 rounded-md mb-2 max-h-40 overflow-y-auto">
                            <p class="text-white">{{ parsingResults.content.value.substring(0, 300) }}...</p>
                        </div>
                        <div class="bg-neutral-900 p-3 rounded-md font-mono text-xs text-blue-300 overflow-x-auto">
                            <p>{{ parsingResults.content.regex }}</p>
                        </div>
                    </div>

                    <!-- Category Section -->
                    <div class="mb-6">
                        <h3 class="text-lg font-medium text-white flex items-center mb-2">
                            <span>Category</span>
                            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
                                :class="getConfidenceBadgeClass(parsingResults.category.confidence)">
                                {{ parsingResults.category.confidence }}
                            </span>
                        </h3>
                        <div class="bg-neutral-800 p-3 rounded-md mb-2">
                            <p class="text-white">{{ parsingResults.category.value }}</p>
                        </div>
                        <div class="bg-neutral-900 p-3 rounded-md font-mono text-xs text-blue-300 overflow-x-auto">
                            <p>{{ parsingResults.category.regex }}</p>
                        </div>
                    </div>

                    <!-- Featured Image Section -->
                    <div class="mb-6">
                        <h3 class="text-lg font-medium text-white flex items-center mb-2">
                            <span>Featured Image</span>
                            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
                                :class="getConfidenceBadgeClass(parsingResults.featuredImage.confidence)">
                                {{ parsingResults.featuredImage.confidence }}
                            </span>
                        </h3>
                        <div class="bg-neutral-800 p-3 rounded-md mb-2">
                            <div v-if="parsingResults.featuredImage.value" class="mb-3">
                                <img :src="parsingResults.featuredImage.value" alt="Featured image" class="max-h-48 rounded-md" />
                            </div>
                            <p class="text-white break-all">{{ parsingResults.featuredImage.value || 'No image found' }}</p>
                        </div>
                        <div class="bg-neutral-900 p-3 rounded-md font-mono text-xs text-blue-300 overflow-x-auto">
                            <p>{{ parsingResults.featuredImage.regex }}</p>
                        </div>
                    </div>

                    <!-- Tags Section -->
                    <div class="mb-2">
                        <h3 class="text-lg font-medium text-white flex items-center mb-2">
                            <span>Tags</span>
                            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
                                :class="getConfidenceBadgeClass(parsingResults.tags.confidence)">
                                {{ parsingResults.tags.confidence }}
                            </span>
                        </h3>
                        <div class="bg-neutral-800 p-3 rounded-md mb-2">
                            <div class="flex flex-wrap gap-2">
                                <span v-for="(tag, index) in parsingResults.tags.value" :key="index"
                                    class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-sm">
                                    {{ tag }}
                                </span>
                                <span v-if="!parsingResults.tags.value || parsingResults.tags.value.length === 0"
                                    class="text-neutral-400">
                                    No tags found
                                </span>
                            </div>
                        </div>
                        <div class="bg-neutral-900 p-3 rounded-md font-mono text-xs text-blue-300 overflow-x-auto">
                            <p>{{ parsingResults.tags.regex }}</p>
                        </div>
                    </div>

                    <!-- Create Parser button -->
                    <div class="mt-6 flex justify-end">
                        <button
                            @click="createParserFromResults"
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Create Parser
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Test Parser Dialog -->
        <div v-if="showTestParserDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">Test Parser: {{ currentParser?.title }}</h3>
                    <button @click="closeTestParserDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-neutral-300 mb-1">Enter URL to test with this parser</label>
                    <div class="flex">
                        <input
                            v-model="parserTestUrl"
                            type="url"
                            placeholder="https://example.com/article"
                            class="flex-grow px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                        />
                        <button
                            @click="testParserWithUrl"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors"
                            :disabled="!parserTestUrl || testingParser"
                        >
                            <div v-if="testingParser" class="flex items-center">
                                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Testing...
                            </div>
                            <span v-else>Test Parser</span>
                        </button>
                    </div>
                </div>

                <div class="mt-3 flex justify-end">
                    <button
                        @click="testWithAllParsers"
                        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                        :disabled="!parserTestUrl || testingParser"
                    >
                        <div v-if="testingParser" class="flex items-center">
                            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Testing...
                        </div>
                        <div v-else class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Test with all parsers
                        </div>
                    </button>
                </div>

                <!-- Parser Test Results -->
                <div v-if="parserTestResults" class="mt-6 bg-neutral-700 rounded-lg p-4">
                    <h4 class="text-lg font-medium text-white mb-4">Parser Results</h4>

                    <!-- Title -->
                    <div class="mb-4">
                        <h5 class="text-sm font-medium text-neutral-400 mb-1">Title</h5>
                        <div class="bg-neutral-800 p-3 rounded-md">
                            <p class="text-white">{{ parserTestResults.title }}</p>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="mb-4">
                        <h5 class="text-sm font-medium text-neutral-400 mb-1">Content</h5>
                        <div class="bg-neutral-800 p-3 rounded-md max-h-60 overflow-y-auto">
                            <p class="text-white whitespace-pre-wrap">{{ parserTestResults.content }}</p>
                        </div>
                    </div>

                    <!-- Featured Image -->
                    <div class="mb-4">
                        <h5 class="text-sm font-medium text-neutral-400 mb-1">Featured Image</h5>
                        <div class="bg-neutral-800 p-3 rounded-md">
                            <div v-if="parserTestResults.featureImage" class="mb-3">
                                <img :src="parserTestResults.featureImage" alt="Featured image" class="max-h-48 rounded-md" />
                            </div>
                            <p class="text-white break-all">{{ parserTestResults.featureImage || 'No image found' }}</p>
                        </div>
                    </div>

                    <!-- Category -->
                    <div class="mb-4">
                        <h5 class="text-sm font-medium text-neutral-400 mb-1">Category</h5>
                        <div class="bg-neutral-800 p-3 rounded-md">
                            <p class="text-white">{{ parserTestResults.category || 'No category found' }}</p>
                        </div>
                    </div>

                    <!-- Publication Date -->
                    <div class="mb-4">
                        <h5 class="text-sm font-medium text-neutral-400 mb-1">Publication Date</h5>
                        <div class="bg-neutral-800 p-3 rounded-md">
                            <p class="text-white">{{ formatDate(parserTestResults.pubDate) }}</p>
                        </div>
                    </div>

                    <!-- Create Raw button -->
                    <div class="mt-6 flex justify-end">
                        <button
                            @click="createRawFromResults"
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center"
                            :disabled="creatingRaw"
                        >
                            <div v-if="creatingRaw" class="flex items-center">
                                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </div>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Create Raw</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Parser Form Dialog -->
        <div v-if="showParserDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">{{ editMode ? 'Edit Parser' : 'Add New Parser' }}</h3>
                    <button @click="closeParserDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <!-- Channel -->
                    <div>
                        <label for="channel" class="block text-sm font-medium text-neutral-300 mb-1">Channel</label>
                        <select
                            id="channel"
                            v-model="formData.channel"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                            required
                        >
                            <option value="" disabled>Select a channel</option>
                            <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                                {{ channel.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Title Regex Pattern -->
                    <div>
                        <label for="title" class="block text-sm font-medium text-neutral-300 mb-1">Title Pattern</label>
                        <input
                            id="title"
                            v-model="formData.title"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm"
                            placeholder="Regular expression to extract title"
                            required
                        />
                    </div>

                    <!-- Content Regex Pattern -->
                    <div>
                        <label for="content" class="block text-sm font-medium text-neutral-300 mb-1">Content Pattern</label>
                        <input
                            id="content"
                            v-model="formData.content"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm"
                            placeholder="Regular expression to extract content"
                            required
                        />
                    </div>

                    <!-- Category Regex Pattern -->
                    <div>
                        <label for="category" class="block text-sm font-medium text-neutral-300 mb-1">Category Pattern</label>
                        <input
                            id="category"
                            v-model="formData.category"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm"
                            placeholder="Regular expression to extract category"
                        />
                    </div>

                    <!-- Image Regex Pattern -->
                    <div>
                        <label for="image" class="block text-sm font-medium text-neutral-300 mb-1">Image Pattern</label>
                        <input
                            id="featureImage"
                            v-model="formData.featureImage"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm"
                            placeholder="Regular expression to extract image"
                        />
                    </div>

                    <!-- Tags Regex Pattern -->
                    <div>
                        <label for="tags" class="block text-sm font-medium text-neutral-300 mb-1">Tags Pattern</label>
                        <input
                            id="tags"
                            v-model="formData.tags"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm"
                            placeholder="Regular expression to extract tags"
                        />
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button
                        @click="closeParserDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="saveParser"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
                        :disabled="saving"
                    >
                        <svg v-if="saving" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {{ saving ? 'Saving...' : 'Save Parser' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <div v-if="showDeleteDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">Delete Parser</h3>
                    <button @click="showDeleteDialog = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p class="text-neutral-300 mb-4">Are you sure you want to delete this parser? This action cannot be undone.</p>

                <div class="flex justify-end space-x-3">
                    <button
                        @click="showDeleteDialog = false"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="confirmDelete"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
                        :disabled="deleting"
                    >
                        <svg v-if="deleting" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {{ deleting ? 'Deleting...' : 'Delete' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div v-if="notification.show" class="fixed bottom-4 right-4 max-w-xs bg-neutral-800 text-white p-4 rounded-lg shadow-lg z-50 flex items-start"
            :class="{
                'bg-green-600': notification.type === 'success',
                'bg-red-600': notification.type === 'error',
                'bg-blue-600': notification.type === 'info'
            }">
            <div class="flex-shrink-0 mr-2">
                <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <p class="text-sm">{{ notification.message }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useFeedClient } from '@cmmv/rss-aggregation/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const feedClient = useFeedClient()

// Estado
const parsers = ref([])
const channels = ref([])
const loading = ref(true)
const error = ref(null)
const urlToTest = ref('')
const parsingUrl = ref(false)
const parsingResults = ref(null)
const showParserDialog = ref(false)
const showTestUrlDialog = ref(false)
const showDeleteDialog = ref(false)
const editMode = ref(false)
const saving = ref(false)
const deleting = ref(false)
const parserToDelete = ref(null)
const notification = ref({
    show: false,
    type: 'info',
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
    searchField: 'title',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1
})

const formData = ref({
    title: '',
    channel: '',
    content: '',
    tags: '',
    category: ''
})

const currentParser = ref({})
const showTestParserDialog = ref(false)
const parserTestUrl = ref('')
const testingParser = ref(false)
const parserTestResults = ref({})
const creatingRaw = ref(false)

const loadParsers = async () => {
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

        const response = await feedClient.parser.get(apiFilters)

        if (response && response.data) {
            parsers.value = response.data || []

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
            parsers.value = []
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
        console.error('Failed to load parsers:', err)
        loading.value = false
        error.value = err.message || 'Failed to load parsers'
        showNotification('error', 'Failed to load parsers')
    }
}

const loadChannels = async () => {
    try {
        const response = await feedClient.channels.get({
            limit: 100,
            sortBy: 'name',
            sort: 'asc'
        })

        if (response && response.data) {
            channels.value = response.data
        } else {
            channels.value = []
        }
    } catch (err) {
        console.error('Failed to load channels:', err)
        showNotification('error', 'Failed to load channels')
    }
}

const refreshData = () => {
    loadChannels()
    loadParsers()
}

const parseUrl = async () => {
    if (!urlToTest.value) return

    try {
        parsingUrl.value = true
        parsingResults.value = null

        const encodedUrl = encodeURIComponent(urlToTest.value)
        const response = await feedClient.parser.parseURL(encodedUrl)

        if (response) {
            parsingResults.value = response
        } else {
            throw new Error('Invalid response from parser')
        }
    } catch (err) {
        console.error('Failed to parse URL:', err)
        showNotification('error', err.message || 'Failed to parse URL')
    } finally {
        parsingUrl.value = false
    }
}

const createParserFromResults = () => {
    if (!parsingResults.value) return

    formData.value = {
        id: undefined,
        title: parsingResults.value.title.regex || '',
        channel: '',
        content: parsingResults.value.content.regex || '',
        tags: parsingResults.value.tags.regex || '',
        category: parsingResults.value.category.regex || '',
        featureImage: parsingResults.value.featuredImage.regex || ''
    }

    showTestUrlDialog.value = false
    editMode.value = false
    showParserDialog.value = true
}

const openAddParserDialog = () => {
    editMode.value = false
    formData.value = {
        title: '',
        channel: '',
        content: '',
        tags: '',
        category: '',
        featureImage: ''
    }
    showParserDialog.value = true
}

const openTestUrlDialog = () => {
    urlToTest.value = ''
    parsingResults.value = null
    showTestUrlDialog.value = true
}

const closeTestUrlDialog = () => {
    showTestUrlDialog.value = false
}

const editParser = (parser) => {
    editMode.value = true

    formData.value = {
        id: parser.id,
        title: parser.title || '',
        channel: parser.channel || '',
        content: parser.content || '',
        tags: parser.tags || '',
        category: parser.category || '',
        featureImage: parser.featureImage || ''
    }

    showParserDialog.value = true
}

const closeParserDialog = () => {
    showParserDialog.value = false
    formData.value = {
        title: '',
        channel: '',
        content: '',
        tags: '',
        category: '',
        featureImage: ''
    }
}

const saveParser = async () => {
    try {
        saving.value = true

        if (!formData.value.title || !formData.value.channel || !formData.value.content) {
            showNotification('error', 'Please fill in all required fields')
            saving.value = false
            return
        }

        const parserData = {
            title: formData.value.title,
            channel: formData.value.channel,
            content: formData.value.content,
            tags: formData.value.tags,
            category: formData.value.category,
            featureImage: formData.value.featureImage
        }

        if (editMode.value && formData.value.id) {
            await feedClient.parser.update(formData.value.id, parserData)
            showNotification('success', 'Parser updated successfully')
        } else {
            await feedClient.parser.insert(parserData)
            showNotification('success', 'Parser created successfully')
        }

        saving.value = false
        closeParserDialog()
        loadParsers()
    } catch (err) {
        saving.value = false
        console.error('Error saving parser:', err)
        showNotification('error', err.message || 'An error occurred while saving the parser')
    }
}

const deleteParser = (id) => {
    parserToDelete.value = id
    showDeleteDialog.value = true
}

const confirmDelete = async () => {
    if (!parserToDelete.value) return

    try {
        deleting.value = true
        await feedClient.parser.delete(parserToDelete.value)
        deleting.value = false
        showDeleteDialog.value = false
        showNotification('success', 'Parser deleted successfully')
        loadParsers()
    } catch (err) {
        deleting.value = false
        console.error('Failed to delete parser:', err)
        showNotification('error', err.message || 'Failed to delete parser')
    } finally {
        parserToDelete.value = null
    }
}

const getChannelName = (channelId) => {
    const channel = channels.value.find(c => c.id === channelId)
    return channel ? channel.name : channelId
}

const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'

    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (err) {
        return 'Invalid date'
    }
}

const getConfidenceBadgeClass = (confidence) => {
    switch (confidence?.toLowerCase()) {
        case 'high':
            return 'bg-green-500 text-white'
        case 'medium':
            return 'bg-yellow-500 text-white'
        case 'low':
            return 'bg-red-500 text-white'
        default:
            return 'bg-gray-500 text-white'
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

const handlePageChange = (newPage) => {
    filters.value.page = newPage
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'asc'
    }
}

// Watch
watch(filters, () => {
    loadParsers()
}, { deep: true })

const testParser = (parser) => {
    currentParser.value = parser
    parserTestUrl.value = ''
    parserTestResults.value = {}
    showTestParserDialog.value = true
}

const closeTestParserDialog = () => {
    showTestParserDialog.value = false
    currentParser.value = {}
    parserTestUrl.value = ''
    parserTestResults.value = {}
}

const testParserWithUrl = async () => {
    if (!currentParser.value || !currentParser.value.id || !parserTestUrl.value) return

    try {
        testingParser.value = true
        parserTestResults.value = {}

        const response = await feedClient.parser.parseContent(currentParser.value.id, parserTestUrl.value)

        if (response && response.success && response.data) {
            parserTestResults.value = response.data
        } else {
            throw new Error('Failed to parse content')
        }
    } catch (err) {
        console.error('Failed to test parser:', err)
        showNotification('error', err.message || 'Failed to test parser')
    } finally {
        testingParser.value = false
    }
}

const createRawFromResults = async () => {
    if (!parserTestResults.value || !currentParser.value || !currentParser.value.id) return

    try {
        creatingRaw.value = true

        const rawData = {
            channel: currentParser.value.channel,
            link: parserTestUrl.value,
            title: parserTestResults.value.title,
            content: parserTestResults.value.content,
            featureImage: parserTestResults.value.featureImage,
            pubDate: parserTestResults.value.pubDate,
            category: parserTestResults.value.category || '',
            rejected: false,
            feedType: 'Direct',
            status: "imported"
        }

        await feedClient.raw.createRaw(rawData)

        showNotification('success', 'Raw created successfully')
        closeTestParserDialog()
    } catch (err) {
        console.error('Failed to create raw:', err)
        showNotification('error', err.message || 'Failed to create raw')
    } finally {
        creatingRaw.value = false
    }
}

const testWithAllParsers = async () => {
    if (!parserTestUrl.value) return

    try {
        testingParser.value = true
        parserTestResults.value = {}

        const response = await feedClient.parser.parseContentAll(parserTestUrl.value)

        if (response && response.success && response.data) {
            parserTestResults.value = response.data
            // Se tiver um parser melhor, atualize a referência do parser atual
            if (response.data.parserId) {
                const bestParser = parsers.value.find(p => p.id === response.data.parserId)
                if (bestParser) {
                    currentParser.value = bestParser
                }
            }
        } else {
            throw new Error(response.message || 'Failed to parse content')
        }
    } catch (err) {
        console.error('Failed to test with all parsers:', err)
        showNotification('error', err.message || 'Failed to test with all parsers')
    } finally {
        testingParser.value = false
    }
}

onMounted(() => {
    refreshData()
})
</script>
