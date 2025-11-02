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

                <button @click="openBulkDeleteDialog" :disabled="selectedMedias.size === 0" class="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({{ selectedMedias.size }})
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
                    <div v-if="showMoreActionsDropdown" class="absolute right-0 mt-2 w-52 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
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
                                @click="openDeleteAllDialog"
                                class="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-neutral-700 hover:text-red-200 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Delete All Media
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
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                <input
                                    type="checkbox"
                                    :checked="isAllSelected"
                                    @change="toggleSelectAll"
                                    class="h-4 w-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                                />
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
                            <td class="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    :checked="selectedMedias.has(media.id)"
                                    @change="toggleMediaSelection(media.id)"
                                    class="h-4 w-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                                />
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="media.id">
                                {{ media.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4">
                                <div class="h-14 w-24 overflow-hidden rounded bg-neutral-700 flex items-center justify-center">
                                    <img 
                                        v-if="media.url && !isRemoteImage(media.url)"
                                        :src="media.url" 
                                        :alt="media.alt || ''" 
                                        class="object-cover w-full h-full"
                                        @error="handleImageError($event, media)"
                                    />
                                    <div v-else-if="isRemoteImage(media.url)" 
                                         class="flex flex-col items-center justify-center w-full h-full text-neutral-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span class="text-[10px] text-center px-1">Remote</span>
                                    </div>
                                    <div v-else class="flex items-center justify-center w-full h-full text-neutral-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
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
                            <div class="aspect-video overflow-hidden bg-neutral-700 rounded-lg mb-4 flex items-center justify-center">
                                <img 
                                    v-if="mediaToEdit.url && !isRemoteImage(mediaToEdit.url)"
                                    :src="mediaToEdit.url" 
                                    :alt="mediaToEdit.alt || ''" 
                                    class="object-contain w-full h-full"
                                    @error="handleImageError($event, mediaToEdit)"
                                />
                                <div v-else-if="isRemoteImage(mediaToEdit.url)" class="text-center p-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-neutral-400 text-sm mb-2">Remote Image URL</p>
                                    <p class="text-neutral-500 text-xs mb-3 break-all">{{ mediaToEdit.url }}</p>
                                    <button 
                                        @click="importRemoteImage(mediaToEdit)"
                                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                                    >
                                        Import from URL
                                    </button>
                                </div>
                                <div v-else class="text-neutral-600 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-sm mt-2">No Image</p>
                                </div>
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
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Bulk Media Deletion</h3>
                </div>
                <div class="p-6">
                    <div v-if="!bulkDeleteLoading && !bulkDeleteResult">
                        <p class="text-neutral-300 mb-4">
                            You are about to remove <strong class="text-white">{{ selectedMedias.size }}</strong> media:
                        </p>

                        <div class="bg-neutral-700 rounded-md p-4 mb-4 max-h-32 overflow-y-auto">
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div v-for="media in selectedMediasData" :key="media.id" class="text-neutral-300">
                                    • {{ media.id.substring(0, 8) }}... ({{ media.format?.toUpperCase() }})
                                </div>
                            </div>
                        </div>

                        <div class="bg-yellow-600/20 border border-yellow-600/50 rounded-md p-4 mb-4">
                            <div class="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h4 class="text-yellow-200 font-medium mb-1">Safety Check</h4>
                                    <p class="text-yellow-300 text-sm">
                                        The system will automatically check if any of these media are being used in posts.
                                        Media linked to posts <strong>will not be removed</strong> to maintain content integrity.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-blue-600/20 border border-blue-600/50 rounded-md p-4 mb-4">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                <div class="flex-1">
                                    <div class="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id="createBackup"
                                            v-model="createBackupBeforeDelete"
                                            class="mr-2 h-4 w-4 text-blue-600 rounded bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        >
                                        <label for="createBackup" class="text-blue-200 font-medium">Create backup before deletion</label>
                                    </div>
                                    <p class="text-blue-300 text-sm">
                                        <span v-if="createBackupBeforeDelete">
                                            A backup will be created containing the database records and files of all selected media.
                                            This allows you to restore the media if needed later.
                                        </span>
                                        <span v-else>
                                            No backup will be created. Deleted media cannot be recovered.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 mt-6">
                            <button @click="showBulkDeleteDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="executeBulkDelete"
                                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
                                Confirm Deletion
                            </button>
                        </div>
                    </div>

                    <div v-else-if="bulkDeleteLoading">
                        <div class="text-center py-8">
                            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
                            <p class="text-white mb-2">Processing bulk deletion...</p>
                            <p class="text-neutral-400 text-sm">Checking links with posts and removing safe media...</p>
                        </div>
                    </div>

                    <div v-else-if="bulkDeleteResult">
                        <div class="space-y-4">
                            <div class="text-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 class="text-lg font-medium text-white">Process Completed</h4>
                            </div>

                            <div class="bg-neutral-700 rounded-lg p-4">
                                <h5 class="text-white font-medium mb-3">Operation Summary:</h5>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-neutral-400">Total requested:</span>
                                        <span class="text-white ml-2">{{ bulkDeleteResult.summary.requested }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Deleted:</span>
                                        <span class="text-green-400 ml-2">{{ bulkDeleteResult.summary.deleted }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Skipped (linked):</span>
                                        <span class="text-yellow-400 ml-2">{{ bulkDeleteResult.summary.skipped }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Errors:</span>
                                        <span class="text-red-400 ml-2">{{ bulkDeleteResult.summary.errors }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="bulkDeleteResult.skipped.length > 0" class="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
                                <h5 class="text-yellow-200 font-medium mb-2">Protected Media ({{ bulkDeleteResult.skipped.length }})</h5>
                                <div class="max-h-32 overflow-y-auto space-y-1">
                                    <div v-for="skipped in bulkDeleteResult.skipped" :key="skipped.id" class="text-sm">
                                        <span class="text-yellow-300">{{ skipped.id.substring(0, 8) }}...</span>
                                        <span class="text-yellow-400 ml-2">{{ skipped.reason }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="bulkDeleteResult.errors.length > 0" class="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
                                <h5 class="text-red-200 font-medium mb-2">Errors ({{ bulkDeleteResult.errors.length }})</h5>
                                <div class="max-h-32 overflow-y-auto space-y-1">
                                    <div v-for="error in bulkDeleteResult.errors" :key="error.id" class="text-sm">
                                        <span class="text-red-300">{{ error.id.substring(0, 8) }}...</span>
                                        <span class="text-red-400 ml-2">{{ error.error }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="bulkDeleteResult.backup" class="bg-green-600/20 border border-green-600/50 rounded-lg p-4">
                                <h5 class="text-green-200 font-medium mb-2">📦 Backup Created</h5>
                                <div class="text-sm space-y-1">
                                    <div class="text-green-300">
                                        <span class="text-green-400">Filename:</span> {{ bulkDeleteResult.backup.filename }}
                                    </div>
                                    <div class="text-green-300">
                                        <span class="text-green-400">Media Records:</span> {{ bulkDeleteResult.backup.mediasCount }}
                                    </div>
                                    <div class="text-green-300">
                                        <span class="text-green-400">Files Backed Up:</span> {{ bulkDeleteResult.backup.filesCount }}
                                    </div>
                                    <div class="text-green-300 mt-2">
                                        {{ bulkDeleteResult.backup.message }}
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <button @click="closeBulkDeleteDialog"
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete All Media Dialog -->
        <div v-if="showDeleteAllDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Delete All Media</h3>
                </div>
                <div class="p-6">
                    <div v-if="!deleteAllLoading && !deleteAllResult">
                        <div class="bg-red-600/20 border border-red-600/50 rounded-md p-4 mb-6">
                            <div class="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h4 class="text-red-200 font-medium mb-2">⚠️ WARNING - DANGEROUS OPERATION ⚠️</h4>
                                    <p class="text-red-300 text-sm mb-2">
                                        This operation will attempt to remove <strong class="text-white">ALL {{ allMediasCount }} media</strong> from the database.
                                    </p>
                                    <p class="text-red-300 text-sm">
                                        This action <strong>CANNOT BE UNDONE</strong> and may drastically affect your site.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-yellow-600/20 border border-yellow-600/50 rounded-md p-4 mb-6">
                            <div class="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 class="text-yellow-200 font-medium mb-1">Automatic Protection</h4>
                                    <p class="text-yellow-300 text-sm">
                                        The system will automatically check which media are being used in posts.
                                        <strong>Media linked to posts will not be removed</strong> to maintain content integrity.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-neutral-700 rounded-lg p-4 mb-6">
                            <h5 class="text-white font-medium mb-3">What will be done:</h5>
                            <ul class="text-neutral-300 text-sm space-y-2">
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Fetch all {{ allMediasCount }} media from the database
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Check which are linked to posts (these will be protected)
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Remove files from storages (local, S3, Cloudflare Spaces)
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Remove records from database
                                </li>
                            </ul>
                        </div>

                        <div class="bg-blue-600/20 border border-blue-600/50 rounded-md p-4 mb-6">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                <div class="flex-1">
                                    <div class="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id="createBackupAll"
                                            v-model="createBackupBeforeDeleteAll"
                                            class="mr-2 h-4 w-4 text-blue-600 rounded bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        >
                                        <label for="createBackupAll" class="text-blue-200 font-medium">Create backup before deletion</label>
                                    </div>
                                    <p class="text-blue-300 text-sm">
                                        <span v-if="createBackupBeforeDeleteAll">
                                            <strong>Recommended!</strong> A backup will be created containing the database records and files of all media that will be deleted.
                                            This provides a safety net in case something goes wrong.
                                        </span>
                                        <span v-else>
                                            <strong>Warning:</strong> No backup will be created. Deleted media cannot be recovered.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3">
                            <button @click="showDeleteAllDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="executeDeleteAll"
                                class="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md transition-colors border border-red-500">
                                🗑️ CONFIRM TOTAL DELETION
                            </button>
                        </div>
                    </div>

                    <div v-else-if="deleteAllLoading">
                        <div class="text-center py-8">
                            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
                            <p class="text-white mb-2">Processing total deletion...</p>
                            <p class="text-neutral-400 text-sm">Processing {{ allMediasCount }} media in batches of 100...</p>
                            <p class="text-yellow-400 text-xs mt-2">This operation may take several minutes. Please wait...</p>
                            <div class="mt-4 bg-neutral-700 rounded-full h-2">
                                <div class="bg-red-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                            <p class="text-neutral-400 text-xs mt-2">Processing in batches to avoid server timeouts</p>
                        </div>
                    </div>

                    <div v-else-if="deleteAllResult">
                        <div class="space-y-4">
                            <div class="text-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 class="text-lg font-medium text-white">Delete All Completed</h4>
                            </div>

                            <div class="bg-neutral-700 rounded-lg p-4">
                                <h5 class="text-white font-medium mb-3">Total Operation Summary:</h5>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-neutral-400">Total processed:</span>
                                        <span class="text-white ml-2 font-bold">{{ deleteAllResult.summary.requested }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Deleted:</span>
                                        <span class="text-green-400 ml-2 font-bold">{{ deleteAllResult.summary.deleted }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Protected:</span>
                                        <span class="text-yellow-400 ml-2 font-bold">{{ deleteAllResult.summary.skipped }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Errors:</span>
                                        <span class="text-red-400 ml-2 font-bold">{{ deleteAllResult.summary.errors }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="deleteAllResult.summary.deleted > 0" class="bg-green-600/20 border border-green-600/50 rounded-lg p-4">
                                <h5 class="text-green-200 font-medium mb-2">✅ Success!</h5>
                                <p class="text-green-300 text-sm">
                                    {{ deleteAllResult.summary.deleted }} media were successfully removed from storages and database.
                                </p>
                            </div>

                            <div v-if="deleteAllResult.skipped.length > 0" class="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
                                <h5 class="text-yellow-200 font-medium mb-2">🛡️ Protected Media ({{ deleteAllResult.skipped.length }})</h5>
                                <p class="text-yellow-300 text-sm mb-3">These media were not removed because they are being used in posts:</p>
                                <div class="max-h-32 overflow-y-auto space-y-1">
                                    <div v-for="skipped in deleteAllResult.skipped.slice(0, 10)" :key="skipped.id" class="text-sm">
                                        <span class="text-yellow-300">{{ skipped.id.substring(0, 8) }}...</span>
                                        <span class="text-yellow-400 ml-2">{{ skipped.reason }}</span>
                                    </div>
                                    <div v-if="deleteAllResult.skipped.length > 10" class="text-yellow-400 text-xs mt-2">
                                        ... and {{ deleteAllResult.skipped.length - 10 }} more protected media
                                    </div>
                                </div>
                            </div>

                            <div v-if="deleteAllResult.errors.length > 0" class="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
                                <h5 class="text-red-200 font-medium mb-2">❌ Errors ({{ deleteAllResult.errors.length }})</h5>
                                <div class="max-h-32 overflow-y-auto space-y-1">
                                    <div v-for="error in deleteAllResult.errors.slice(0, 10)" :key="error.id" class="text-sm">
                                        <span class="text-red-300">{{ error.id.substring(0, 8) }}...</span>
                                        <span class="text-red-400 ml-2">{{ error.error }}</span>
                                    </div>
                                    <div v-if="deleteAllResult.errors.length > 10" class="text-red-400 text-xs mt-2">
                                        ... and {{ deleteAllResult.errors.length - 10 }} more errors
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <button @click="closeDeleteAllDialog"
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                    Close
                                </button>
                            </div>
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
const isReprocessing = ref(false)
const isProcessing = ref(false)
const isDuplicatesProcessing = ref(false)
const isThumbnailProcessing = ref(false)
const forceCleanup = ref(false)
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
let progressInterval = null

const showSearchDropdown = ref(false)
const searchInput = ref(null)

// More actions dropdown
const showMoreActionsDropdown = ref(false)

// Bulk delete functionality
const selectedMedias = ref(new Set())
const showBulkDeleteDialog = ref(false)
const bulkDeleteLoading = ref(false)
const bulkDeleteResult = ref(null)

// Delete all functionality
const showDeleteAllDialog = ref(false)
const deleteAllLoading = ref(false)
const deleteAllResult = ref(null)
const allMediasCount = ref(0)

// Backup functionality
const createBackupBeforeDelete = ref(false)
const createBackupBeforeDeleteAll = ref(false)

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

function toggleMoreActionsDropdown() {
    showMoreActionsDropdown.value = !showMoreActionsDropdown.value
}

// Bulk delete functions
const isAllSelected = computed(() => {
    return medias.value.length > 0 && medias.value.every(media => selectedMedias.value.has(media.id))
})

const selectedMediasData = computed(() => {
    return medias.value.filter(media => selectedMedias.value.has(media.id))
})

function toggleSelectAll() {
    if (isAllSelected.value) {
        selectedMedias.value.clear()
    } else {
        medias.value.forEach(media => {
            selectedMedias.value.add(media.id)
        })
    }
}

function toggleMediaSelection(mediaId) {
    if (selectedMedias.value.has(mediaId)) {
        selectedMedias.value.delete(mediaId)
    } else {
        selectedMedias.value.add(mediaId)
    }
}

function openBulkDeleteDialog() {
    if (selectedMedias.value.size === 0) {
        showNotification('warning', 'Select at least one media to remove')
        return
    }

    bulkDeleteResult.value = null
    showBulkDeleteDialog.value = true
}

async function executeBulkDelete() {
    if (selectedMedias.value.size === 0) return

    try {
        bulkDeleteLoading.value = true

        const selectedIds = Array.from(selectedMedias.value)
        const response = await adminClient.medias.bulkDelete(selectedIds, createBackupBeforeDelete.value)

        if (!response)
            throw new Error('Empty server response')

        let normalizedResponse = response;
        if (typeof response === 'string' || typeof response === 'boolean' || Array.isArray(response)) {
            normalizedResponse = {
                success: false,
                message: 'Unexpected server response',
                summary: { requested: selectedIds.length, deleted: 0, skipped: 0, errors: selectedIds.length },
                deleted: [],
                skipped: [],
                errors: selectedIds.map(id => ({ id, error: 'Unexpected server response' }))
            };
        }

        if (!normalizedResponse.summary) {
            console.error('Response missing summary:', normalizedResponse)
            throw new Error('Invalid server response: missing summary information')
        }

        const finalResponse = normalizedResponse;
        bulkDeleteResult.value = finalResponse

        if (finalResponse.summary.deleted > 0)
            showNotification('success', `${finalResponse.summary.deleted} media removed successfully`)

        if (finalResponse.summary.skipped > 0)
            showNotification('warning', `${finalResponse.summary.skipped} media protected as they are linked to posts`)

        if (finalResponse.summary.errors > 0)
            showNotification('error', `${finalResponse.summary.errors} error(s) during deletion`)

        if (finalResponse.summary.deleted > 0) {
            selectedMedias.value.clear()
            refreshData()
        }
    } catch (err) {
        console.error('Failed to bulk delete medias:', err)
        showNotification('error', err.message || 'Failed to bulk delete')
        bulkDeleteResult.value = {
            success: false,
            message: err.message || 'Failed to bulk delete',
            summary: { requested: selectedMedias.value.size, deleted: 0, skipped: 0, errors: selectedMedias.value.size },
            deleted: [],
            skipped: [],
            errors: Array.from(selectedMedias.value).map(id => ({ id, error: err.message || 'Unknown error' }))
        }
    } finally {
        bulkDeleteLoading.value = false
    }
}

function closeBulkDeleteDialog() {
    showBulkDeleteDialog.value = false
    bulkDeleteResult.value = null
    bulkDeleteLoading.value = false
}

// Delete all functions
async function openDeleteAllDialog() {
    showMoreActionsDropdown.value = false
    try {
        // Get total count of all medias
        const response = await adminClient.medias.get({ limit: 1, offset: 0 })
        allMediasCount.value = response.count || 0

        if (allMediasCount.value === 0) {
            showNotification('info', 'No media to remove')
            return
        }

        deleteAllResult.value = null
        showDeleteAllDialog.value = true
    } catch (err) {
        console.error('Failed to get medias count:', err)
        showNotification('error', 'Failed to check media count')
    }
}

async function executeDeleteAll() {
    try {
        deleteAllLoading.value = true
        let allMediaIds = []
        let offset = 0
        const batchSize = 1000

        while (true) {
            const response = await adminClient.medias.get({
                limit: batchSize,
                offset: offset
            })

            if (!response.data || response.data.length === 0) {
                break
            }

            allMediaIds.push(...response.data.map(media => media.id))
            offset += batchSize

            if (offset > 50000) {
                console.warn('Stopping at 50k medias for safety')
                break
            }
        }

        if (allMediaIds.length === 0) {
            showNotification('info', 'No media found to remove')
            deleteAllLoading.value = false
            return
        }

        const deleteBatchSize = 100
        let totalDeleted = 0
        let totalSkipped = 0
        let totalErrors = 0
        let allDeletedIds = []
        let allSkippedItems = []
        let allErrorItems = []

        for (let i = 0; i < allMediaIds.length; i += deleteBatchSize) {
            const batch = allMediaIds.slice(i, i + deleteBatchSize)
            const batchNumber = Math.floor(i / deleteBatchSize) + 1
            const totalBatches = Math.ceil(allMediaIds.length / deleteBatchSize)

            try {
                const response = await adminClient.medias.bulkDelete(batch, createBackupBeforeDeleteAll.value && i === 0)

                if (response && response.summary) {
                    totalDeleted += response.summary.deleted || 0
                    totalSkipped += response.summary.skipped || 0
                    totalErrors += response.summary.errors || 0

                    if (response.deleted) allDeletedIds.push(...response.deleted)
                    if (response.skipped) allSkippedItems.push(...response.skipped)
                    if (response.errors) allErrorItems.push(...response.errors)
                }

                if (i + deleteBatchSize < allMediaIds.length)
                    await new Promise(resolve => setTimeout(resolve, 500))
            } catch (batchError) {
                console.error(`Error in batch ${batchNumber}:`, batchError)
                totalErrors += batch.length
                allErrorItems.push(...batch.map(id => ({
                    id,
                    error: batchError.message || 'Batch error'
                })))
            }
        }

        const response = {
            success: totalDeleted > 0,
            message: `Processing completed: ${totalDeleted} deleted, ${totalSkipped} protected, ${totalErrors} errors`,
            summary: {
                requested: allMediaIds.length,
                deleted: totalDeleted,
                skipped: totalSkipped,
                errors: totalErrors
            },
            deleted: allDeletedIds,
            skipped: allSkippedItems,
            errors: allErrorItems
        }

        if (!response)
            throw new Error('Resposta vazia do servidor')

        let normalizedResponse = response;
        if (typeof response === 'string' || typeof response === 'boolean' || Array.isArray(response)) {
            normalizedResponse = {
                success: false,
                message: 'Unexpected server response',
                summary: { requested: allMediaIds.length, deleted: 0, skipped: 0, errors: allMediaIds.length },
                deleted: [],
                skipped: [],
                errors: allMediaIds.map(id => ({ id, error: 'Unexpected server response' }))
            };
        }

        if (!normalizedResponse.summary) {
            console.error('Response missing summary:', normalizedResponse)
            throw new Error('Invalid server response: missing summary information')
        }

        deleteAllResult.value = normalizedResponse

        if (normalizedResponse.summary.deleted > 0)
            showNotification('success', `${normalizedResponse.summary.deleted} media removed successfully`)

        if (normalizedResponse.summary.skipped > 0)
            showNotification('warning', `${normalizedResponse.summary.skipped} media protected as they are linked to posts`)

        if (normalizedResponse.summary.errors > 0)
            showNotification('error', `${normalizedResponse.summary.errors} error(s) during deletion`)

        if (normalizedResponse.summary.deleted > 0) {
            selectedMedias.value.clear()
            refreshData()
        }
    } catch (err) {
        console.error('Failed to delete all medias:', err)
        showNotification('error', err.message || 'Failed to delete all media')
        deleteAllResult.value = {
            success: false,
            message: err.message || 'Failed to delete all media',
            summary: { requested: allMediasCount.value, deleted: 0, skipped: 0, errors: allMediasCount.value },
            deleted: [],
            skipped: [],
            errors: [{ id: 'all', error: err.message || 'Unknown error' }]
        }
    } finally {
        deleteAllLoading.value = false
    }
}

function closeDeleteAllDialog() {
    showDeleteAllDialog.value = false
    deleteAllResult.value = null
    deleteAllLoading.value = false
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

        const response = await adminClient.medias.get(apiFilters)

        if (response && response.data) {
            medias.value = response.data || []

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

        // Clear selection when page changes or data is refreshed
        selectedMedias.value.clear()
    } catch (err) {
        console.error('Failed to load medias:', err)
        loading.value = false
        error.value = err.message || 'Failed to load medias'
        showNotification('error', 'Failed to load medias')
    }
}

const refreshData = () => {
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

const isRemoteImage = (url) => {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        const currentHost = window.location.hostname;
        return urlObj.hostname !== currentHost && (urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
    } catch {
        return false;
    }
}

const handleImageError = (event, media) => {
    console.error('Image failed to load:', media?.url);
    if (event.target) {
        event.target.style.display = 'none';
    }
}

const handleImageLoad = (event) => {
    // Image loaded successfully
}

const importRemoteImage = async (media) => {
    if (!media.url || !isRemoteImage(media.url)) {
        showNotification('error', 'Not a remote image URL');
        return;
    }
    
    try {
        showNotification('info', 'Importing image from URL...');
        const result = await adminClient.medias.importFromUrl({
            url: media.url,
            alt: media.alt || '',
            caption: media.caption || ''
        });
        
        if (result.success && result.url) {
            // Update media with imported URL
            await adminClient.medias.update(media.id, {
                url: result.url,
                filepath: result.url
            });
            showNotification('success', 'Image imported successfully');
            refreshData();
        } else {
            showNotification('error', result.message || 'Failed to import image');
        }
    } catch (error) {
        console.error('Error importing remote image:', error);
        showNotification('error', error.message || 'Failed to import image');
    }
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

        // Chamar a API para excluir a mídia
        await adminClient.medias.delete(mediaToDelete.value.id);

        // Mostrar notificação de sucesso
        showNotification('success', 'Media deleted successfully');

        // Atualizar a lista de mídias
        refreshData();
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
    showMoreActionsDropdown.value = false
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

        if (progressInterval)
            clearInterval(progressInterval)

        const checkProgress = async () => {
            try {
                const progress = await adminClient.imports.getReprocessProgress()

                if (progress && typeof progress === 'object') {
                    reprocessStatus.value = {
                        ...reprocessStatus.value,
                        ...progress
                    }

                    if (progress.status === 'completed' || progress.status === 'error') {
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

        await checkProgress()
        progressInterval = setInterval(checkProgress, 1000)

        adminClient.imports.reprocessImages()
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

        await adminClient.imports.initCleanupProgress()

        const checkProgress = async () => {
            try {
                const progress = await adminClient.imports.getCleanupProgress()

                if (progress && typeof progress === 'object') {
                    reprocessStatus.value = {
                        ...reprocessStatus.value,
                        ...progress
                    }

                    if (progress.status === 'completed' || progress.status === 'error') {
                        if (progressInterval) {
                            clearInterval(progressInterval)
                            progressInterval = null
                        }

                        if (progress.status === 'completed')
                            showNotification('success', `Limpeza concluída: ${progress.details.removed} registros órfãos removidos.`)
                    }
                }
            } catch (err) {
                console.error('Error getting cleanup progress:', err)
            }
        }

        await checkProgress()
        progressInterval = setInterval(checkProgress, 1000)

        try {
            const result = await adminClient.imports.cleanupOrphanedMedia(forceCleanup.value)
            cleanupResult.value = result
            await checkProgress()
        } catch (err) {
            reprocessStatus.value.status = 'error'
            reprocessStatus.value.message = `Error: ${err.message || 'Failed to clean up orphaned records'}`

            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }

            showNotification('error', err.message || 'Falha ao limpar registros órfãos')
        }
    } catch (err) {
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

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        if (reprocessStatus.value.status === 'completed')
            refreshData()
    }
}

const closeCleanupDialog = () => {
    if (reprocessStatus.value.status !== 'processing') {
        showCleanupDialog.value = false

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        if (reprocessStatus.value.status === 'completed')
            refreshData()
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

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        await adminClient.imports.initCleanupProgress()

        const checkProgress = async () => {
            try {
                const progress = await adminClient.imports.getCleanupProgress()

                if (progress && typeof progress === 'object') {
                    reprocessStatus.value = {
                        ...reprocessStatus.value,
                        ...progress
                    }

                    if (progress.status === 'completed' || progress.status === 'error') {
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

        await checkProgress()
        progressInterval = setInterval(checkProgress, 1000)

        try {
            const result = await adminClient.imports.cleanupDuplicatedImages()
            duplicatesResult.value = result
            await checkProgress()
        } catch (err) {
            reprocessStatus.value.status = 'error'
            reprocessStatus.value.message = `Error: ${err.message || 'Failed to remove duplicate images'}`

            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }

            showNotification('error', err.message || 'Failed to remove duplicate images')
        }
    } catch (err) {
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

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        if (reprocessStatus.value.status === 'completed') {
            refreshData()
        }
    }
}

const openThumbnailDialog = () => {
    showMoreActionsDropdown.value = false
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

        const checkProgress = async () => {
            try {
                const progress = await adminClient.imports.getReprocessProgress()

                if (progress && typeof progress === 'object') {
                    thumbnailStatus.value = {
                        ...thumbnailStatus.value,
                        ...progress
                    }

                    if (progress.status === 'completed' || progress.status === 'error') {
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

        await checkProgress()
        progressInterval = setInterval(checkProgress, 1000)

        try {
            const result = await adminClient.imports.generateMissingThumbnails()
            thumbnailResult.value = result
            await checkProgress()
        } catch (err) {
            thumbnailStatus.value.status = 'error'
            thumbnailStatus.value.message = `Error: ${err.message || 'Failed to generate thumbnails'}`

            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }

            showNotification('error', err.message || 'Failed to generate thumbnails')
        }
    } catch (err) {
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

        if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
        }

        if (thumbnailStatus.value.status === 'completed')
            refreshData()
    }
}

onMounted(() => {
    initializeFromUrl()
    loadMedias()

    document.addEventListener('click', (e) => {
        const target = e.target

        if (showSearchDropdown.value && !target.closest('[data-search-toggle]')
            && !target.closest('.absolute')) {
            showSearchDropdown.value = false
        }

        if (!target.closest('[data-more-actions-toggle]') && showMoreActionsDropdown.value) {
            showMoreActionsDropdown.value = false
        }
    })
})

onUnmounted(() => {
    if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
    }
})
</script>
