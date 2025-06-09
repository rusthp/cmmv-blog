<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Medias</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload
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
                                    placeholder="Search medias..."
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
                                    <option value="alt">Alt Text</option>
                                    <option value="caption">Caption</option>
                                    <option value="format">Format</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
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
                    <!-- More actions dropdown menu -->
                    <div v-if="showMoreActionsDropdown" class="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="py-1">
                            <button
                                @click="openReprocessDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Process Images
                            </button>
                            <button
                                @click="openThumbnailDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Generate Thumbnails
                            </button>
                            <button
                                @click="openUnusedImagesDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clean Unused Images
                            </button>
                            <button
                                @click="openBulkDeleteDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Mass Exclusion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading medias...</span>
        </div>

        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load medias</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <div v-else-if="medias.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            <p class="text-neutral-300 mb-2">No medias found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by uploading your first media</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Upload Media
            </button>
        </div>

        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-2 py-3 text-center w-8">
                                <div class="flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        class="w-4 h-4 bg-neutral-600 border-neutral-500 rounded text-blue-600 focus:ring-blue-500"
                                        :checked="selectedMedias.length > 0 && selectedMedias.length === medias.length"
                                        :indeterminate.prop="selectedMedias.length > 0 && selectedMedias.length < medias.length"
                                        @change="toggleSelectAll"
                                    />
                                </div>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                Preview
                            </th>
                            <th
                                @click="handleSort('format')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Format
                                <span v-if="filters.sortBy === 'format'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Dimensions
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Size
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="media in medias" :key="media.id" class="hover:bg-neutral-750">
                            <td class="px-2 py-4">
                                <div class="flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        :value="media.id" 
                                        v-model="selectedMedias"
                                        class="w-4 h-4 bg-neutral-600 border-neutral-500 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="media.id">
                                {{ media.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4">
                                <div class="h-14 w-24 overflow-hidden rounded bg-neutral-700 flex items-center justify-center">
                                    <img :src="media.url" :alt="media.alt || ''" class="object-cover w-full h-full" />
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white uppercase">
                                {{ media.format }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ media.width }} × {{ media.height }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ formatFileSize(media.size) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(media)"
                                        title="Edit media"
                                        class="text-neutral-400 hover:text-yellow-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="openInNewTab(media)"
                                        title="Open in new tab"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="copyUrl(media)"
                                        title="Copy URL"
                                        class="text-neutral-400 hover:text-green-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </button>
                                    <button @click="confirmDelete(media)" class="text-neutral-400 hover:text-red-500 p-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <Pagination
            :pagination="pagination"
            @pageChange="handlePageChange"
        />

        <!-- Toast notifications -->
        <ToastNotification
            :show="notification.show"
            :message="notification.message"
            :type="notification.type"
            :duration="notification.duration"
            @close="notification.show = false"
        />

        <!-- Adicionar o diálogo de confirmação para deletar mídia -->
        <DeleteDialog
            :show="showDeleteDialog"
            :loading="false"
            message="Are you sure you want to delete this media?"
            warning-text="This action cannot be undone."
            @confirm="deleteMedia"
            @cancel="showDeleteDialog = false"
        />

        <!-- Media Library Dialog -->
        <MediaDialog
            v-model="showMediaDialog"
            :type="mediaDialogType"
            @select="handleMediaSelected"
        />

        <!-- Reprocess Images Dialog -->
        <div v-if="showReprocessDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Reprocess Images</h3>
                </div>
                <div class="p-6">
                    <div v-if="!isReprocessing">
                        <p class="text-neutral-300 mb-4">
                            This will reprocess all image files in your media directory:
                        </p>
                        <ul class="list-disc pl-5 mb-4 text-neutral-300 space-y-1">
                            <li>Remove database records for files that no longer exist</li>
                            <li>Add records for images that exist but aren't in the database</li>
                            <li>Optimize images for better performance</li>
                            <li>Update file paths for existing records</li>
                        </ul>
                        <p class="text-yellow-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            This process may take a while if you have many images.
                        </p>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button @click="showReprocessDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="startReprocessing"
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                Start Reprocessing
                            </button>
                        </div>
                    </div>

                    <div v-else>
                        <div class="mb-4">
                            <p class="text-white mb-2">{{ reprocessStatus.message }}</p>

                            <div class="w-full bg-neutral-700 rounded-full h-4 mb-2">
                                <div class="bg-blue-600 h-4 rounded-full"
                                    :style="{ width: `${reprocessStatus.percentage || 0}%` }"></div>
                            </div>

                            <p class="text-neutral-400 text-sm">
                                {{ reprocessStatus.processed || 0 }} de {{ reprocessStatus.total || 0 }} processados ({{ reprocessStatus.percentage || 0 }}%)
                            </p>
                        </div>

                        <div class="bg-neutral-700 rounded-md p-3 mb-4">
                            <h4 class="text-white mb-2 font-medium">Progress Details:</h4>
                            <ul class="text-neutral-300 text-sm space-y-1">
                                <li>Optimized: {{ reprocessStatus.details?.optimized || 0 }}</li>
                                <li>Added to DB: {{ reprocessStatus.details?.added || 0 }}</li>
                                <li>Removed from DB: {{ reprocessStatus.details?.removed || 0 }}</li>
                                <li>Failed: {{ reprocessStatus.details?.failed || 0 }}</li>
                                <li v-if="reprocessStatus.details?.bytes_saved > 0">
                                    Space saved: {{ formatFileSize(reprocessStatus.details.bytes_saved) }}
                                </li>
                            </ul>
                        </div>

                        <div class="flex justify-end">
                            <button
                                @click="closeReprocessDialog"
                                :disabled="reprocessStatus.status === 'processing'"
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 text-white rounded-md transition-colors">
                                {{ reprocessStatus.status === 'processing' ? 'Processing...' : 'Close' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cleanup Orphaned Records Dialog -->
        <div v-if="showCleanupDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Clean Orphaned Records</h3>
                </div>
                <div class="p-6">
                    <div v-if="!isProcessing">
                        <p class="text-neutral-300 mb-4">
                            This will scan the database for media records that don't have corresponding files:
                        </p>
                        <ul class="list-disc pl-5 mb-4 text-neutral-300 space-y-1">
                            <li>Check if each record has a valid file</li>
                            <li>Attempt to locate missing files in multiple formats</li>
                            <li>Update file paths for files that were found</li>
                            <li>Remove records that don't have corresponding files</li>
                        </ul>
                        <p class="text-yellow-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            This action will permanently delete orphaned database records.
                        </p>

                        <div class="bg-neutral-700 p-4 rounded-md mb-4">
                            <div class="flex items-center mb-2">
                                <input type="checkbox" id="forceCleanup" v-model="forceCleanup" class="mr-2 h-4 w-4 text-blue-600 rounded">
                                <label for="forceCleanup" class="text-white font-medium">Force Delete Orphaned Records</label>
                            </div>
                            <p class="text-neutral-400 text-sm" :class="{'text-red-400': forceCleanup}">
                                <span v-if="forceCleanup">
                                    <strong>Warning:</strong> This will aggressively remove any record that doesn't have an exact matching file.
                                    Only use this option if your database has many orphaned records.
                                </span>
                                <span v-else>
                                    Normal mode tries to find alternative files for each record before removing it.
                                </span>
                            </p>
                        </div>

                        <div class="flex justify-end space-x-3 mt-6">
                            <button @click="showCleanupDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="startCleanup"
                                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
                                Start Cleanup
                            </button>
                        </div>
                    </div>

                    <div v-else>
                        <div class="mb-4">
                            <p class="text-white mb-2">{{ reprocessStatus.message }}</p>

                            <div class="w-full bg-neutral-700 rounded-full h-4 mb-2">
                                <div class="bg-purple-600 h-4 rounded-full"
                                    :style="{ width: `${reprocessStatus.percentage || 0}%` }"></div>
                            </div>

                            <p class="text-neutral-400 text-sm">
                                {{ reprocessStatus.processed || 0 }} of {{ reprocessStatus.total || 0 }} records checked ({{ reprocessStatus.percentage || 0 }}%)
                            </p>
                        </div>

                        <div class="bg-neutral-700 rounded-md p-3 mb-4" v-if="reprocessStatus.details?.removed > 0">
                            <h4 class="text-white mb-2 font-medium">Cleanup Results:</h4>
                            <p class="text-neutral-300 text-sm">
                                Removed {{ reprocessStatus.details?.removed || 0 }} orphaned database records.
                            </p>
                            <p v-if="cleanupResult && cleanupResult.valid !== undefined" class="text-neutral-300 text-sm mt-1">
                                Kept {{ cleanupResult.valid }} valid records out of {{ cleanupResult.total }} total.
                            </p>
                        </div>

                        <div class="flex justify-end">
                            <button
                                @click="closeCleanupDialog"
                                :disabled="reprocessStatus.status === 'processing'"
                                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 text-white rounded-md transition-colors">
                                {{ reprocessStatus.status === 'processing' ? 'Processing...' : 'Close' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Remove Duplicates Dialog -->
        <div v-if="showDuplicatesDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Remove Duplicate Images</h3>
                </div>
                <div class="p-6">
                    <div v-if="!isDuplicatesProcessing">
                        <p class="text-neutral-300 mb-4">
                            This will scan for duplicate images with numeric suffixes (e.g., image-1.jpg, image-2.png):
                        </p>
                        <ul class="list-disc pl-5 mb-4 text-neutral-300 space-y-1">
                            <li>Find all images with -1, -2, etc. suffixes</li>
                            <li>Check if the original file without suffix exists</li>
                            <li>Update database records to point to the original file</li>
                            <li>Remove the duplicate files</li>
                        </ul>
                        <p class="text-yellow-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            This action will permanently delete duplicate files.
                        </p>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button @click="showDuplicatesDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="startRemoveDuplicates"
                                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
                                Remove Duplicates
                            </button>
                        </div>
                    </div>

                    <div v-else>
                        <div class="mb-4">
                            <p class="text-white mb-2">{{ reprocessStatus.message }}</p>

                            <div class="w-full bg-neutral-700 rounded-full h-4 mb-2">
                                <div class="bg-red-600 h-4 rounded-full"
                                    :style="{ width: `${reprocessStatus.percentage || 0}%` }"></div>
                            </div>

                            <p class="text-neutral-400 text-sm">
                                {{ reprocessStatus.processed || 0 }} of {{ reprocessStatus.total || 0 }} files checked ({{ reprocessStatus.percentage || 0 }}%)
                            </p>
                        </div>

                        <div class="bg-neutral-700 rounded-md p-3 mb-4" v-if="duplicatesResult">
                            <h4 class="text-white mb-2 font-medium">Cleanup Results:</h4>
                            <p class="text-neutral-300 text-sm">
                                Removed {{ duplicatesResult.removed || 0 }} duplicate files from {{ duplicatesResult.identified || 0 }} identified.
                            </p>
                        </div>

                        <div class="flex justify-end">
                            <button
                                @click="closeDuplicatesDialog"
                                :disabled="reprocessStatus.status === 'processing'"
                                class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 text-white rounded-md transition-colors">
                                {{ reprocessStatus.status === 'processing' ? 'Processing...' : 'Close' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Generate Thumbnails Dialog -->
        <div v-if="showThumbnailDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Generate Missing Thumbnails</h3>
                </div>
                <div class="p-6">
                    <div v-if="!isThumbnailProcessing">
                        <p class="text-neutral-300 mb-4">
                            This will scan for images that don't have thumbnails and generate them:
                        </p>
                        <ul class="list-disc pl-5 mb-4 text-neutral-300 space-y-1">
                            <li>Find all images without thumbnails in the database</li>
                            <li>Generate 16x16 WebP thumbnails for each image</li>
                            <li>Upload to external storage or save locally as configured</li>
                            <li>Update database records with thumbnail URLs</li>
                        </ul>
                        <p class="text-blue-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            This process is safe and will not modify existing thumbnails.
                        </p>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button @click="showThumbnailDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="startThumbnailGeneration"
                                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
                                Generate Thumbnails
                            </button>
                        </div>
                    </div>

                    <div v-else>
                        <div class="mb-4">
                            <p class="text-white mb-2">{{ thumbnailStatus.message }}</p>

                            <div class="w-full bg-neutral-700 rounded-full h-4 mb-2">
                                <div class="bg-purple-600 h-4 rounded-full"
                                    :style="{ width: `${thumbnailStatus.percentage || 0}%` }"></div>
                            </div>

                            <p class="text-neutral-400 text-sm">
                                {{ thumbnailStatus.processed || 0 }} of {{ thumbnailStatus.total || 0 }} images processed ({{ thumbnailStatus.percentage || 0 }}%)
                            </p>
                        </div>

                        <div class="bg-neutral-700 rounded-md p-3 mb-4" v-if="thumbnailResult">
                            <h4 class="text-white mb-2 font-medium">Generation Results:</h4>
                            <ul class="text-neutral-300 text-sm space-y-1">
                                <li>Created: {{ thumbnailResult.created || 0 }} thumbnails</li>
                                <li>Failed: {{ thumbnailResult.failed || 0 }} images</li>
                                <li>Total processed: {{ thumbnailResult.processed || 0 }} images</li>
                            </ul>
                        </div>

                        <div class="flex justify-end">
                            <button
                                @click="closeThumbnailDialog"
                                :disabled="thumbnailStatus.status === 'processing'"
                                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 text-white rounded-md transition-colors">
                                {{ thumbnailStatus.status === 'processing' ? 'Processing...' : 'Close' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Unused Images Dialog after Thumbnail Dialog -->
        <div v-if="showUnusedImagesDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Clean Unused Images</h3>
                </div>
                <div class="p-6">
                    <div v-if="!isUnusedImagesProcessing && !unusedImagesResult">
                        <p class="text-neutral-300 mb-4">
                            This will scan for images that are not used in any post or page content:
                        </p>
                        <ul class="list-disc pl-5 mb-4 text-neutral-300 space-y-1">
                            <li>Check all media against post and page content</li>
                            <li>Identify images that aren't referenced in any content</li>
                            <li>Remove unused images from both local storage and cloud storage</li>
                            <li>Delete database records for unused images</li>
                        </ul>
                        <p class="text-yellow-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            This action will permanently delete unused images.
                        </p>

                        <div class="bg-neutral-700 p-4 rounded-md mb-4">
                            <div class="flex items-center mb-2">
                                <input type="checkbox" id="dryRun" v-model="dryRun" class="mr-2 h-4 w-4 text-blue-600 rounded">
                                <label for="dryRun" class="text-white font-medium">Dry Run Mode (Scan Only)</label>
                            </div>
                            <p class="text-neutral-400 text-sm">
                                <span v-if="dryRun">
                                    Only scan and identify unused images without deleting them.
                                </span>
                                <span v-else>
                                    Images will be permanently deleted from storage and database.
                                </span>
                            </p>
                        </div>

                        <div class="flex justify-end space-x-3 mt-6">
                            <button @click="showUnusedImagesDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="startUnusedImagesCleanup"
                                class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
                                {{ dryRun ? 'Scan Unused Images' : 'Clean Unused Images' }}
                            </button>
                        </div>
                    </div>

                    <div v-else-if="isUnusedImagesProcessing && !unusedImagesResult">
                        <div class="mb-4">
                            <p class="text-white mb-2">{{ reprocessStatus.message }}</p>

                            <div class="w-full bg-neutral-700 rounded-full h-4 mb-2">
                                <div class="bg-amber-600 h-4 rounded-full"
                                    :style="{ width: `${reprocessStatus.percentage || 0}%` }"></div>
                            </div>

                            <p class="text-neutral-400 text-sm">
                                {{ reprocessStatus.processed || 0 }} of {{ reprocessStatus.total || 0 }} images checked ({{ reprocessStatus.percentage || 0 }}%)
                            </p>
                        </div>

                        <div class="flex justify-end">
                            <button
                                disabled
                                class="px-4 py-2 bg-neutral-600 text-white rounded-md cursor-not-allowed">
                                Processing...
                            </button>
                        </div>
                    </div>

                    <div v-else-if="unusedImagesResult">
                        <div class="mb-4">
                            <p class="text-white mb-4">{{ unusedImagesResult.message }}</p>

                            <div class="bg-neutral-700 rounded-md p-4 mb-4">
                                <h4 class="text-white mb-2 font-medium">Results:</h4>
                                <ul class="text-neutral-300 text-sm space-y-1">
                                    <li>Total images scanned: {{ unusedImagesResult.total || reprocessStatus.total }}</li>
                                    <li>Unused images identified: {{ unusedImagesResult.identified }}</li>
                                    <li v-if="!unusedImagesResult.dryRun">Unused images removed: {{ unusedImagesResult.removed }}</li>
                                    <li v-if="unusedImagesResult.dryRun" class="text-amber-400">Dry run mode: No images were deleted</li>
                                </ul>
                            </div>

                            <div v-if="unusedImagesResult.dryRun && unusedImagesResult.unusedMedias && unusedImagesResult.unusedMedias.length > 0" class="mb-4">
                                <h4 class="text-white mb-2 font-medium">Unused Images ({{ unusedImagesResult.unusedMedias.length }}):</h4>
                                <div class="max-h-48 overflow-y-auto bg-neutral-750 rounded-md p-2">
                                    <div v-for="(media, index) in unusedImagesResult.unusedMedias" :key="index" class="text-sm text-neutral-400 mb-1 truncate">
                                        {{ media.url }}
                                    </div>
                                </div>
                                <div class="mt-4 flex justify-end">
                                    <button 
                                        v-if="unusedImagesResult.identified > 0"
                                        @click="proceedWithDeletion" 
                                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
                                        Delete {{ unusedImagesResult.identified }} Unused Images
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end">
                            <button
                                @click="closeUnusedImagesDialog"
                                class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Adicionar diálogo de edição de mídia -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Edit Media Details</h3>
                </div>
                <div class="p-6">
                    <div v-if="mediaToEdit" class="space-y-4">
                        <div class="mb-4">
                            <div class="aspect-video overflow-hidden bg-neutral-700 rounded-lg mb-4">
                                <img :src="mediaToEdit.url" :alt="mediaToEdit.alt || ''" class="object-contain w-full h-full" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-1">Alt Text</label>
                            <input
                                v-model="mediaForm.alt"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Image description for accessibility"
                            />
                            <p v-if="formErrors.alt" class="mt-1 text-sm text-red-500">{{ formErrors.alt }}</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-1">Caption</label>
                            <textarea
                                v-model="mediaForm.caption"
                                rows="3"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                placeholder="Image caption (optional)"
                            ></textarea>
                            <p v-if="formErrors.caption" class="mt-1 text-sm text-red-500">{{ formErrors.caption }}</p>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button @click="showDialog = false"
                            class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                            Cancel
                        </button>
                        <button @click="saveMedia"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bulk Delete Dialog -->
        <div v-if="showBulkDeleteDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Mass Exclusion</h3>
                </div>
                <div class="p-6">
                    <div v-if="!isBulkDeleteProcessing">
                        <p class="text-neutral-300 mb-3">Are you sure you want to delete <strong>{{ selectedMedias.length }}</strong> items?</p>
                        <p class="text-red-400 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            This action cannot be undone.
                        </p>

                        <div class="flex justify-between space-x-3 mt-6">
                            <button @click="cancelBulkDelete"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="confirmBulkDelete"
                                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete {{ selectedMedias.length }} Items
                            </button>
                        </div>
                    </div>
                    <div v-else>
                        <div class="mb-4">
                            <p class="text-white mb-2">{{ bulkDeleteStatus.message }}</p>

                            <div class="w-full bg-neutral-700 rounded-full h-4 mb-2">
                                <div class="bg-red-600 h-4 rounded-full"
                                    :style="{ width: `${bulkDeleteStatus.percentage || 0}%` }"></div>
                            </div>

                            <p class="text-neutral-400 text-sm">
                                {{ bulkDeleteStatus.processed || 0 }} of {{ bulkDeleteStatus.total || 0 }} items deleted ({{ bulkDeleteStatus.percentage || 0 }}%)
                            </p>
                        </div>

                        <div class="flex justify-end">
                            <button
                                @click="closeBulkDeleteDialog"
                                :disabled="bulkDeleteStatus.status === 'processing'"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-600 text-white rounded-md transition-colors">
                                {{ bulkDeleteStatus.status === 'processing' ? 'Processing...' : 'Close' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useAdminClient } from '@cmmv/blog/admin/client'
import MediaDialog from '../components/MediaDialog.vue'
import Pagination from '../components/Pagination.vue'
import DeleteDialog from '../components/DeleteDialog.vue'
import ToastNotification from '../components/ToastNotification.vue'
import { useRouter, useRoute } from 'vue-router'

const adminClient = useAdminClient()
const router = useRouter()
const route = useRoute()

const medias = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const mediaForm = ref({
    alt: '',
    caption: '',
    active: true
})
const mediaToEdit = ref(null)
const formErrors = ref({})

const showDeleteDialog = ref(false)
const mediaToDelete = ref(null)

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
    searchField: 'alt',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1
})

const showMediaDialog = ref(false)
const mediaDialogType = ref('all')

const showReprocessDialog = ref(false)
const showCleanupDialog = ref(false)
const showDuplicatesDialog = ref(false)
const showThumbnailDialog = ref(false)
const showUnusedImagesDialog = ref(false)
const isReprocessing = ref(false)
const isProcessing = ref(false)
const isDuplicatesProcessing = ref(false)
const isThumbnailProcessing = ref(false)
const isUnusedImagesProcessing = ref(false)
const forceCleanup = ref(false)
const dryRun = ref(false)
const reprocessStatus = ref({
    total: 0,
    processed: 0,
    percentage: 0,
    status: 'idle',
    message: '',
    details: {
        scanned: 0,
        added: 0,
        removed: 0,
        optimized: 0,
        failed: 0,
        bytes_saved: 0
    }
})
const thumbnailStatus = ref({
    total: 0,
    processed: 0,
    percentage: 0,
    status: 'idle',
    message: '',
    details: {
        scanned: 0,
        added: 0,
        removed: 0,
        optimized: 0,
        failed: 0,
        bytes_saved: 0
    }
})
const duplicatesResult = ref(null)
const cleanupResult = ref(null)
const thumbnailResult = ref(null)
const unusedImagesResult = ref(null)
let progressInterval = null

const showSearchDropdown = ref(false)
const searchInput = ref(null)

const selectedMedias = ref([])
const showMoreActionsDropdown = ref(false)
const showBulkDeleteDialog = ref(false)
const isBulkDeleteProcessing = ref(false)
const bulkDeleteStatus = ref({
    total: 0,
    processed: 0,
    percentage: 0,
    status: 'idle',
    message: '',
    failed: 0
})

function toggleSearchDropdown() {
    showSearchDropdown.value = !showSearchDropdown.value

    if (showSearchDropdown.value) {
        nextTick(() => {
            searchInput.value?.focus()
        })
    }
}

function clearSearch() {
    filters.value.search = ''
    filters.value.page = 1
    loadMedias()
    showSearchDropdown.value = false
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

const loadMedias = async () => {
    try {
        loading.value = true
        error.value = null

        // Incluir timestamp para evitar cache
        const timestamp = new Date().getTime()
        console.log(`Loading medias (timestamp: ${timestamp})...`)

        const apiFilters = {
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage,
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder,
            t: timestamp // Adicionar timestamp para evitar cache
        }

        if (filters.value.search) {
            apiFilters.search = filters.value.search
            apiFilters.searchField = filters.value.searchField
        }

        const response = await adminClient.medias.get(apiFilters)

        if (response && response.data) {
            medias.value = response.data || []
            console.log(`Loaded ${medias.value.length} medias`)

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
            medias.value = []
            console.log('No medias found or empty response')

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
        console.error('Failed to load medias:', err)
        loading.value = false
        error.value = err.message || 'Failed to load medias'
        showNotification('error', 'Failed to load medias')
    }
}

const refreshData = () => {
    console.log('Refreshing media data...')
    // Forçar recarregamento completo dos dados
    loadMedias()
}

const openAddDialog = () => {
    mediaDialogType.value = 'all'
    showMediaDialog.value = true
}

const openEditDialog = (media) => {
    isEditing.value = true
    mediaToEdit.value = media
    mediaForm.value = {
        alt: media.alt || '',
        caption: media.caption || '',
        active: true
    }
    formErrors.value = {}
    showDialog.value = true
}

const confirmDelete = (media) => {
    mediaToDelete.value = media
    showDeleteDialog.value = true
}

const handleSort = (field) => {
    if (filters.value.sortBy === field) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        filters.value.sortBy = field;
        filters.value.sortOrder = 'desc';
    }
    filters.value.page = 1; // Reset to first page when sorting changes
}

const showNotification = (type, message, duration = 3000) => {
    notification.value = {
        show: true,
        type,
        message,
        duration
    }

    setTimeout(() => {
        notification.value.show = false
    }, duration)
}

const getMediaUrl = (media) => {
    return media.url;
}

const openInNewTab = (media) => {
    const url = getMediaUrl(media);
    window.open(url, '_blank');
}

const copyUrl = (media) => {
    const url = getMediaUrl(media);
    navigator.clipboard.writeText(url)
        .then(() => {
            showNotification('success', 'URL copied to clipboard');
        })
        .catch(() => {
            showNotification('error', 'Failed to copy URL');
        });
}

const deleteMedia = async () => {
    if (!mediaToDelete.value) return;

    try {
        // Mostrar estado de carregamento se necessário
        showDeleteDialog.value = false;
        
        console.log('Deleting media with ID:', mediaToDelete.value.id);

        // Chamar a API para excluir a mídia
        await adminClient.medias.delete(mediaToDelete.value.id);

        // Mostrar notificação de sucesso
        showNotification('success', 'Media deleted successfully');

        // Atualizar a lista de mídias forçando uma nova requisição
        setTimeout(() => {
            refreshData();
            console.log('Media list refreshed after deletion');
        }, 500); // Pequeno atraso para garantir que o backend tenha tempo de processar
    } catch (err) {
        console.error('Failed to delete media:', err);
        showNotification('error', err.message || 'Failed to delete media');
    } finally {
        mediaToDelete.value = null;
    }
};

const handleMediaSelected = (media) => {
    refreshData();
    showNotification('success', 'Media added successfully');
}

const saveMedia = async () => {
    if (!mediaToEdit.value) return;

    try {
        // Validar
        const errors = {};
        if (!mediaForm.value.alt.trim()) {
            errors.alt = 'Alt text is required';
        }

        if (Object.keys(errors).length > 0) {
            formErrors.value = errors;
            return;
        }

        // Limpar erros
        formErrors.value = {};

        // Chamar a API para atualizar a mídia
        await adminClient.medias.update(mediaToEdit.value.id, {
            alt: mediaForm.value.alt.trim(),
            caption: mediaForm.value.caption.trim()
        });

        // Atualizar mídia na lista
        const index = medias.value.findIndex(m => m.id === mediaToEdit.value.id);
        if (index !== -1) {
            medias.value[index] = {
                ...medias.value[index],
                alt: mediaForm.value.alt.trim(),
                caption: mediaForm.value.caption.trim()
            };
        }

        // Mostrar notificação de sucesso
        showNotification('success', 'Media updated successfully');

        // Fechar diálogo
        showDialog.value = false;
    } catch (err) {
        console.error('Failed to update media:', err);
        showNotification('error', err.message || 'Failed to update media');
    }
};

const handlePageChange = (newPage) => {
    filters.value.page = newPage
    updateUrlParams()
}

const updateUrlParams = () => {
    const query = {}
    if (filters.value.page !== 1) query.page = filters.value.page.toString()
    if (filters.value.search) query.search = filters.value.search
    if (filters.value.sortBy !== 'createdAt') query.sortBy = filters.value.sortBy
    if (filters.value.sortOrder !== 'desc') query.sortOrder = filters.value.sortOrder

    router.replace({ query })
}

const initializeFromUrl = () => {
    const { query } = route

    if (query.page) filters.value.page = parseInt(query.page) || 1
    if (query.search) filters.value.search = query.search
    if (query.sortBy) filters.value.sortBy = query.sortBy
    if (query.sortOrder) filters.value.sortOrder = query.sortOrder
}

watch(filters, () => {
    loadMedias()
    updateUrlParams()
}, { deep: true })

watch(() => route.query, (newQuery) => {
    // Only update from URL if there's actually a change to prevent loops
    const currentPage = filters.value.page
    const urlPage = newQuery.page ? parseInt(newQuery.page) : 1

    if (
        currentPage !== urlPage ||
        filters.value.search !== (newQuery.search || '') ||
        filters.value.sortBy !== (newQuery.sortBy || 'createdAt') ||
        filters.value.sortOrder !== (newQuery.sortOrder || 'desc')
    ) {
        initializeFromUrl()
        loadMedias()
    }
}, { deep: true })

const openReprocessDialog = () => {
    showReprocessDialog.value = true
    isReprocessing.value = false
    reprocessStatus.value = {
        total: 0,
        processed: 0,
        percentage: 0,
        status: 'idle',
        message: '',
        details: {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }
    }
}

const openCleanupDialog = () => {
    showCleanupDialog.value = true
    isProcessing.value = false
    forceCleanup.value = false
    cleanupResult.value = null
    reprocessStatus.value = {
        total: 0,
        processed: 0,
        percentage: 0,
        status: 'idle',
        message: '',
        details: {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }
    }
}

const startReprocessing = async () => {
    try {
        isReprocessing.value = true
        reprocessStatus.value.status = 'processing'
        reprocessStatus.value.message = 'Starting reprocessing...'
        reprocessStatus.value.processed = 0
        reprocessStatus.value.total = 0
        reprocessStatus.value.percentage = 0
        reprocessStatus.value.details = {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }

        // Limpar qualquer intervalo anterior
        if (progressInterval) {
            clearInterval(progressInterval)
        }

        console.log('Starting progress polling for reprocessing...')

        // Iniciar o polling imediatamente e a cada 1 segundo depois
        const checkProgress = async () => {
            try {
                console.log('Checking reprocess progress...')
                const progress = await adminClient.imports.getReprocessProgress()
                console.log('Progress update:', progress)

                // Atualizar o estado apenas se tivermos dados válidos
                if (progress && typeof progress === 'object') {
                    reprocessStatus.value = {
                        ...reprocessStatus.value,
                        ...progress
                    }

                    // Log para debug
                    console.log(`Progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`)

                    // Verificar se o processo foi concluído
                    if (progress.status === 'completed' || progress.status === 'error') {
                        console.log('Process completed with status:', progress.status)
                        if (progressInterval) {
                            clearInterval(progressInterval)
                            progressInterval = null
                        }
                    }
                }
            } catch (err) {
                console.error('Error getting reprocess progress:', err)
            }
        }

        // Verificar o progresso imediatamente
        await checkProgress()

        // Configurar o intervalo para verificações regulares
        progressInterval = setInterval(checkProgress, 1000)

        // Iniciar o reprocessamento
        console.log('Starting image reprocessing...')
        adminClient.imports.reprocessImages()
            .then(result => {
                console.log('Reprocessing completed:', result)
            })
            .catch(err => {
                console.error('Error reprocessing images:', err)
                reprocessStatus.value.status = 'error'
                reprocessStatus.value.message = `Error: ${err.message || 'Failed to reprocess images'}`
                if (progressInterval) {
                    clearInterval(progressInterval)
                    progressInterval = null
                }
            })

    } catch (err) {
        console.error('Failed to start reprocessing:', err)
        reprocessStatus.value.status = 'error'
        reprocessStatus.value.message = err.message || 'Failed to start reprocessing'

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }
    }
}

const startCleanup = async () => {
    try {
        isProcessing.value = true
        reprocessStatus.value.status = 'processing'
        reprocessStatus.value.message = 'Starting cleanup of orphaned records...'
        reprocessStatus.value.processed = 0
        reprocessStatus.value.total = 0
        reprocessStatus.value.percentage = 0
        reprocessStatus.value.details.removed = 0
        cleanupResult.value = null

        // Limpar qualquer intervalo anterior
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        console.log('Initializing progress tracker...')

        // Inicializar o rastreador de progresso no servidor
        await adminClient.imports.initCleanupProgress()

        console.log('Starting progress polling for cleanup...')

        // Função para verificar o progresso
        const checkProgress = async () => {
            try {
                console.log('Checking cleanup progress...')
                const progress = await adminClient.imports.getCleanupProgress()
                console.log('Cleanup progress update:', progress)

                // Atualizar o estado apenas se tivermos dados válidos
                if (progress && typeof progress === 'object') {
                    reprocessStatus.value = {
                        ...reprocessStatus.value,
                        ...progress
                    }

                    // Log para debug
                    console.log(`Cleanup progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`)

                    // Verificar se o processo foi concluído
                    if (progress.status === 'completed' || progress.status === 'error') {
                        console.log('Cleanup process completed with status:', progress.status)
                        if (progressInterval) {
                            clearInterval(progressInterval)
                            progressInterval = null
                        }

                        if (progress.status === 'completed') {
                            showNotification('success', `Limpeza concluída: ${progress.details.removed} registros órfãos removidos.`)
                        }
                    }
                }
            } catch (err) {
                console.error('Error getting cleanup progress:', err)
            }
        }

        // Verificar o progresso imediatamente
        await checkProgress()

        // Configurar o intervalo para verificações regulares
        progressInterval = setInterval(checkProgress, 1000)

        // Iniciar a limpeza
        console.log(`Starting orphaned records cleanup... Force mode: ${forceCleanup.value}`)
        try {
            const result = await adminClient.imports.cleanupOrphanedMedia(forceCleanup.value)
            console.log('Cleanup completed:', result)

            // Armazenar o resultado para exibição
            cleanupResult.value = result

            // Verificar o progresso final após a conclusão
            await checkProgress()
        } catch (err) {
            console.error('Error during cleanup:', err)
            reprocessStatus.value.status = 'error'
            reprocessStatus.value.message = `Error: ${err.message || 'Failed to clean up orphaned records'}`

            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }

            showNotification('error', err.message || 'Falha ao limpar registros órfãos')
        }
    } catch (err) {
        console.error('Failed to start cleanup:', err)
        reprocessStatus.value.status = 'error'
        reprocessStatus.value.message = err.message || 'Falha ao iniciar a limpeza'

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        showNotification('error', err.message || 'Falha ao limpar registros órfãos')
    }
}

const closeReprocessDialog = () => {
    if (reprocessStatus.value.status !== 'processing') {
        showReprocessDialog.value = false

        // Garantir que o intervalo de verificação seja limpo
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        // Refresh the media list if reprocessing completed
        if (reprocessStatus.value.status === 'completed') {
            refreshData()
        }
    }
}

const closeCleanupDialog = () => {
    if (reprocessStatus.value.status !== 'processing') {
        showCleanupDialog.value = false

        // Garantir que o intervalo de verificação seja limpo
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        // Refresh the media list if cleanup completed
        if (reprocessStatus.value.status === 'completed') {
            refreshData()
        }
    }
}

const openDuplicatesDialog = () => {
    showDuplicatesDialog.value = true
    isDuplicatesProcessing.value = false
    duplicatesResult.value = null
    reprocessStatus.value = {
        total: 0,
        processed: 0,
        percentage: 0,
        status: 'idle',
        message: '',
        details: {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }
    }
}

const startRemoveDuplicates = async () => {
    try {
        isDuplicatesProcessing.value = true
        reprocessStatus.value.status = 'processing'
        reprocessStatus.value.message = 'Starting to scan for duplicate images...'
        reprocessStatus.value.processed = 0
        reprocessStatus.value.total = 0
        reprocessStatus.value.percentage = 0
        duplicatesResult.value = null

        // Limpar qualquer intervalo anterior
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        console.log('Initializing progress tracker...')

        // Inicializar o rastreador de progresso no servidor
        await adminClient.imports.initCleanupProgress()

        console.log('Starting progress polling for duplicate removal...')

        // Função para verificar o progresso
        const checkProgress = async () => {
            try {
                console.log('Checking cleanup progress...')
                const progress = await adminClient.imports.getCleanupProgress()
                console.log('Cleanup progress update:', progress)

                // Atualizar o estado apenas se tivermos dados válidos
                if (progress && typeof progress === 'object') {
                    reprocessStatus.value = {
                        ...reprocessStatus.value,
                        ...progress
                    }

                    // Log para debug
                    console.log(`Cleanup progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`)

                    // Verificar se o processo foi concluído
                    if (progress.status === 'completed' || progress.status === 'error') {
                        console.log('Cleanup process completed with status:', progress.status)
                        if (progressInterval) {
                            clearInterval(progressInterval)
                            progressInterval = null
                        }

                        if (progress.status === 'completed') {
                            showNotification('success', `Cleanup completed: ${progress.details.removed || 0} duplicate files removed.`)
                        }
                    }
                }
            } catch (err) {
                console.error('Error getting cleanup progress:', err)
            }
        }

        // Verificar o progresso imediatamente
        await checkProgress()

        // Configurar o intervalo para verificações regulares
        progressInterval = setInterval(checkProgress, 1000)

        // Iniciar a limpeza
        console.log('Starting duplicate images removal...')
        try {
            const result = await adminClient.imports.cleanupDuplicatedImages()
            console.log('Duplicates removal completed:', result)

            // Armazenar o resultado para exibição
            duplicatesResult.value = result

            // Verificar o progresso final após a conclusão
            await checkProgress()
        } catch (err) {
            console.error('Error during duplicates removal:', err)
            reprocessStatus.value.status = 'error'
            reprocessStatus.value.message = `Error: ${err.message || 'Failed to remove duplicate images'}`

            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }

            showNotification('error', err.message || 'Failed to remove duplicate images')
        }
    } catch (err) {
        console.error('Failed to start duplicates removal:', err)
        reprocessStatus.value.status = 'error'
        reprocessStatus.value.message = err.message || 'Failed to start duplicates removal'

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        showNotification('error', err.message || 'Failed to remove duplicate images')
    }
}

const closeDuplicatesDialog = () => {
    if (reprocessStatus.value.status !== 'processing') {
        showDuplicatesDialog.value = false

        // Garantir que o intervalo de verificação seja limpo
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        // Refresh the media list if cleanup completed
        if (reprocessStatus.value.status === 'completed') {
            refreshData()
        }
    }
}

const openThumbnailDialog = () => {
    showThumbnailDialog.value = true
    isThumbnailProcessing.value = false
    thumbnailResult.value = null
    thumbnailStatus.value = {
        total: 0,
        processed: 0,
        percentage: 0,
        status: 'idle',
        message: '',
        details: {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }
    }
}

const startThumbnailGeneration = async () => {
    try {
        isThumbnailProcessing.value = true
        thumbnailStatus.value.status = 'processing'
        thumbnailStatus.value.message = 'Starting thumbnail generation...'
        thumbnailStatus.value.processed = 0
        thumbnailStatus.value.total = 0
        thumbnailStatus.value.percentage = 0
        thumbnailStatus.value.details = {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }
        thumbnailResult.value = null

        // Clear any previous interval
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        console.log('Starting progress polling for thumbnail generation...')

        // Function to check progress
        const checkProgress = async () => {
            try {
                console.log('Checking thumbnail generation progress...')
                const progress = await adminClient.imports.getReprocessProgress()
                console.log('Thumbnail progress update:', progress)

                // Update state only if we have valid data
                if (progress && typeof progress === 'object') {
                    thumbnailStatus.value = {
                        ...thumbnailStatus.value,
                        ...progress
                    }

                    // Log for debugging
                    console.log(`Thumbnail progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`)

                    // Check if process completed
                    if (progress.status === 'completed' || progress.status === 'error') {
                        console.log('Thumbnail generation completed with status:', progress.status)
                        if (progressInterval) {
                            clearInterval(progressInterval)
                            progressInterval = null
                        }

                        if (progress.status === 'completed') {
                            showNotification('success', `Thumbnail generation completed: ${progress.details?.added || 0} thumbnails created.`)
                        }
                    }
                }
            } catch (err) {
                console.error('Error getting thumbnail generation progress:', err)
            }
        }

        // Check progress immediately
        await checkProgress()

        // Set up interval for regular checks
        progressInterval = setInterval(checkProgress, 1000)

        // Start thumbnail generation
        console.log('Starting thumbnail generation...')
        try {
            const result = await adminClient.imports.generateMissingThumbnails()
            console.log('Thumbnail generation completed:', result)

            // Store result for display
            thumbnailResult.value = result

            // Check final progress after completion
            await checkProgress()
        } catch (err) {
            console.error('Error during thumbnail generation:', err)
            thumbnailStatus.value.status = 'error'
            thumbnailStatus.value.message = `Error: ${err.message || 'Failed to generate thumbnails'}`

            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }

            showNotification('error', err.message || 'Failed to generate thumbnails')
        }
    } catch (err) {
        console.error('Failed to start thumbnail generation:', err)
        thumbnailStatus.value.status = 'error'
        thumbnailStatus.value.message = err.message || 'Failed to start thumbnail generation'

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        showNotification('error', err.message || 'Failed to generate thumbnails')
    }
}

const closeThumbnailDialog = () => {
    if (thumbnailStatus.value.status !== 'processing') {
        showThumbnailDialog.value = false

        // Ensure progress interval is cleared
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        // Refresh the media list if thumbnail generation completed
        if (thumbnailStatus.value.status === 'completed') {
            refreshData()
        }
    }
}

const openUnusedImagesDialog = () => {
    showUnusedImagesDialog.value = true
    isUnusedImagesProcessing.value = false
    unusedImagesResult.value = null
    reprocessStatus.value = {
        total: 0,
        processed: 0,
        percentage: 0,
        status: 'idle',
        message: '',
        details: {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }
    }
}

const startUnusedImagesCleanup = async () => {
    try {
        isUnusedImagesProcessing.value = true
        unusedImagesResult.value = null
        
        // Reset the status object
        reprocessStatus.value = {
            total: 0,
            processed: 0,
            percentage: 0,
            status: 'processing',
            message: 'Iniciando análise de imagens não utilizadas...',
            details: {
                scanned: 0,
                identified: 0,
                removed: 0,
                failed: 0
            }
        }

        // Limpar qualquer intervalo anterior
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        console.log('Starting unused images scan with dryRun=' + dryRun.value)
        
        // Inicializar explicitamente o progresso para garantir que o backend esteja pronto
        await adminClient.imports.initUnusedImagesProgress()
        
        // Iniciar a limpeza primeiro, para obter o resultado inicial
        try {
            console.log('Calling cleanupUnusedImages with dryRun=' + dryRun.value)
            const result = await adminClient.imports.cleanupUnusedImages(dryRun.value)
            console.log('Unused images scan initial result:', result)
            
            // Se já temos um resultado final, não precisamos verificar o progresso
            if (result && (result.success === true || result.success === false)) {
                console.log('Process completed immediately with result:', result)
                unusedImagesResult.value = result
                isUnusedImagesProcessing.value = false
                return
            }
            
            // Se chegamos aqui, o processo está em andamento e precisamos verificar o progresso
            let checkCount = 0
            let lastProgress = 0
            
            // Função para verificar o progresso
            const checkProgress = async () => {
                try {
                    checkCount++
                    console.log(`Checking progress, attempt ${checkCount}`)
                    const progress = await adminClient.imports.getUnusedImagesProgress()
                    
                    if (!progress) {
                        console.log('No progress data received')
                        return
                    }
                    
                    console.log('Progress update:', progress)
                    
                    // Verificar se temos progresso real
                    const hasProgress = progress.processed > 0 && progress.total > 0
                    const hasChangedSinceLastCheck = progress.processed !== lastProgress
                    
                    if (hasProgress) {
                        lastProgress = progress.processed
                        
                        // Atualizar o estado
                        reprocessStatus.value = {
                            ...progress
                        }
                        
                        // Log para debug
                        console.log(`Progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`)
                    }
                    
                    // Verificar se o processo foi concluído ou se estamos travados
                    if (progress.status === 'completed' || progress.status === 'error') {
                        console.log('Process completed with status:', progress.status)
                        clearInterval(progressInterval)
                        progressInterval = null
                        
                        // Tentar obter o resultado final
                        try {
                            const finalResult = await adminClient.imports.getUnusedImagesProgress()
                            unusedImagesResult.value = {
                                success: true,
                                message: finalResult.message,
                                identified: finalResult.details?.identified || 0,
                                removed: finalResult.details?.removed || 0,
                                total: finalResult.total,
                                dryRun: dryRun.value
                            }
                            isUnusedImagesProcessing.value = false
                        } catch (finalErr) {
                            console.error('Error getting final result:', finalErr)
                            isUnusedImagesProcessing.value = false
                        }
                        
                        return
                    }
                    
                    // Se não há progresso após várias tentativas, considere o processo concluído
                    if (checkCount > 15 && !hasChangedSinceLastCheck) {
                        console.log('No progress detected after multiple attempts, assuming process completed')
                        clearInterval(progressInterval)
                        progressInterval = null
                        isUnusedImagesProcessing.value = false
                        
                        // Exibir o resultado parcial
                        unusedImagesResult.value = {
                            success: true,
                            message: 'Processo completado (sem atualizações de progresso)',
                            identified: progress.details?.identified || 0,
                            removed: progress.details?.removed || 0,
                            total: progress.total,
                            dryRun: dryRun.value
                        }
                        
                        return
                    }
                    
                } catch (err) {
                    console.error('Error checking progress:', err)
                    checkCount++
                    
                    // Se falhar muitas vezes, interrompa o intervalo
                    if (checkCount > 10) {
                        console.log('Too many errors checking progress, stopping interval')
                        clearInterval(progressInterval)
                        progressInterval = null
                        isUnusedImagesProcessing.value = false
                        
                        // Exibir mensagem de erro
                        reprocessStatus.value.status = 'error'
                        reprocessStatus.value.message = 'Erro ao verificar progresso'
                    }
                }
            }
            
            // Verificar o progresso imediatamente
            await checkProgress()
            
            // Configurar o intervalo para verificações regulares (a cada 2 segundos)
            progressInterval = setInterval(checkProgress, 2000)
            
        } catch (err) {
            console.error('Error scanning unused images:', err)
            reprocessStatus.value.status = 'error'
            reprocessStatus.value.message = `Erro: ${err.message || 'Falha ao verificar imagens não utilizadas'}`
            
            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }
            
            isUnusedImagesProcessing.value = false
            showNotification('error', err.message || 'Falha ao verificar imagens não utilizadas')
        }
        
    } catch (err) {
        console.error('Failed to start process:', err)
        reprocessStatus.value.status = 'error'
        reprocessStatus.value.message = err.message || 'Falha ao iniciar o processo'
        
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }
        
        isUnusedImagesProcessing.value = false
        showNotification('error', err.message || 'Falha ao iniciar o processo')
    }
}

const closeUnusedImagesDialog = () => {
    showUnusedImagesDialog.value = false

    // Garantir que o intervalo de verificação seja limpo
    if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
    }

    // Refresh the media list if cleanup completed
    if (reprocessStatus.value.status === 'completed') {
        refreshData()
    }
}

const proceedWithDeletion = async () => {
    try {
        // Mostrar estado de carregamento se necessário
        isUnusedImagesProcessing.value = true
        unusedImagesResult.value = null
        reprocessStatus.value.status = 'processing'
        reprocessStatus.value.message = 'Iniciando remoção de imagens não utilizadas...'
        
        // Limpar qualquer intervalo anterior
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }
        
        // Função para verificar o progresso
        const checkProgress = async () => {
            try {
                console.log('Checking unused images progress...')
                const progress = await adminClient.imports.getUnusedImagesProgress()
                console.log('Unused images progress update:', progress)

                // Atualizar o estado apenas se tivermos dados válidos
                if (progress && typeof progress === 'object') {
                    reprocessStatus.value = {
                        ...reprocessStatus.value,
                        ...progress
                    }

                    // Verificar se o processo foi concluído
                    if (progress.status === 'completed' || progress.status === 'error') {
                        console.log('Unused images process completed with status:', progress.status)
                        if (progressInterval) {
                            clearInterval(progressInterval)
                            progressInterval = null
                        }

                        if (progress.status === 'completed') {
                            showNotification('success', `Deleted ${progress.details.removed || 0} unused images successfully`)
                            // Atualizar a lista de mídias após a conclusão bem-sucedida
                            refreshData()
                        }
                    }
                }
            } catch (err) {
                console.error('Error getting unused images progress:', err)
            }
        }
        
        // Configurar o intervalo para verificações regulares
        progressInterval = setInterval(checkProgress, 1000)

        // Chamar a API para excluir as imagens
        const result = await adminClient.imports.deleteUnusedImages()
        console.log('Deletion completed:', result)
        
        // Armazenar o resultado para exibição
        unusedImagesResult.value = result
        
        // Verificar o progresso final
        await checkProgress()
        
        // Forçar a atualização da lista de mídias independentemente do resultado
        refreshData()
    } catch (err) {
        console.error('Failed to remove unused images:', err)
        reprocessStatus.value.status = 'error'
        reprocessStatus.value.message = `Error: ${err.message || 'Failed to remove unused images'}`
        
        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }
        
        showNotification('error', err.message || 'Failed to remove unused images')
    } finally {
        // Garantir que a lista seja atualizada mesmo em caso de erro
        refreshData()
    }
}

// Toggle dropdown for More actions
const toggleMoreActionsDropdown = () => {
    showMoreActionsDropdown.value = !showMoreActionsDropdown.value
}

// Toggle select all medias
const toggleSelectAll = (event) => {
    if (event.target.checked) {
        selectedMedias.value = medias.value.map(media => media.id)
    } else {
        selectedMedias.value = []
    }
}

// Bulk delete functions
const openBulkDeleteDialog = () => {
    if (selectedMedias.value.length === 0) {
        showNotification('error', 'Select at least one item to delete')
        return
    }
    
    showBulkDeleteDialog.value = true
    isBulkDeleteProcessing.value = false
    bulkDeleteStatus.value = {
        total: 0,
        processed: 0,
        percentage: 0,
        status: 'idle',
        message: '',
        failed: 0
    }
}

const cancelBulkDelete = () => {
    showBulkDeleteDialog.value = false
}

const closeBulkDeleteDialog = () => {
    if (bulkDeleteStatus.value.status !== 'processing') {
        showBulkDeleteDialog.value = false
        selectedMedias.value = []
        
        // Refresh data if any deletions were made
        if (bulkDeleteStatus.value.processed > 0) {
            refreshData()
        }
    }
}

const confirmBulkDelete = async () => {
    if (selectedMedias.value.length === 0) return
    
    try {
        isBulkDeleteProcessing.value = true
        bulkDeleteStatus.value.status = 'processing'
        bulkDeleteStatus.value.message = 'Deleting selected media...'
        bulkDeleteStatus.value.total = selectedMedias.value.length
        bulkDeleteStatus.value.processed = 0
        bulkDeleteStatus.value.percentage = 0
        bulkDeleteStatus.value.failed = 0
        
        // Create a copy of the selected items array
        const itemsToDelete = [...selectedMedias.value]
        
        for (let i = 0; i < itemsToDelete.length; i++) {
            const mediaId = itemsToDelete[i]
            
            try {
                // Call API to delete
                await adminClient.medias.delete(mediaId)
                
                // Update progress
                bulkDeleteStatus.value.processed++
                bulkDeleteStatus.value.percentage = Math.round((bulkDeleteStatus.value.processed / bulkDeleteStatus.value.total) * 100)
                bulkDeleteStatus.value.message = `Deleted ${bulkDeleteStatus.value.processed} of ${bulkDeleteStatus.value.total} items...`
            } catch (err) {
                console.error(`Failed to delete media ${mediaId}:`, err)
                bulkDeleteStatus.value.failed++
            }
        }
        
        // Update final status
        bulkDeleteStatus.value.status = 'completed'
        bulkDeleteStatus.value.message = `Deletion completed: ${bulkDeleteStatus.value.processed} items deleted.`
        if (bulkDeleteStatus.value.failed > 0) {
            bulkDeleteStatus.value.message += ` (${bulkDeleteStatus.value.failed} failed)`
        }
        
        // Show notification
        showNotification('success', bulkDeleteStatus.value.message)
        
    } catch (err) {
        console.error('Failed to process bulk delete:', err)
        bulkDeleteStatus.value.status = 'error'
        bulkDeleteStatus.value.message = `Error: ${err.message || 'Failed to delete items'}`
        showNotification('error', bulkDeleteStatus.value.message)
    }
}

onMounted(() => {
    initializeFromUrl()
    loadMedias()

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })

    // Add event listener for more actions dropdown
    document.addEventListener('click', (e) => {
        if (showMoreActionsDropdown.value && !e.target.closest('[data-more-actions-toggle]')) {
            showMoreActionsDropdown.value = false
        }
    })
})

onUnmounted(() => {
    console.log('Component unmounted, cleaning up intervals')
    if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
    }
})
</script>
