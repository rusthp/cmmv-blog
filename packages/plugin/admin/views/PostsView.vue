<template>
    <div class="space-y-6">
        <!-- Header with actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Posts</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <a href="/post"
                    class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New
                </a>
                <button @click="openBulkScheduleDialog"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Bulk Schedule
                </button>
                <!-- Add button for batch image processing -->
                <button @click="openBulkImageProcessDialog"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Process Images
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
                            v-if="searchQuery.trim()"
                            class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full"
                            title="Search filter active">
                        </span>
                    </button>
                    <!-- Search dropdown -->
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 relative">
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="Search posts..."
                                class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                @keydown.esc="showSearchDropdown = false"
                                ref="searchInput"
                            >
                            <!-- Clear button -->
                            <button
                                v-if="searchQuery.trim()"
                                @click="clearSearch"
                                class="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
                                title="Clear search">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <button @click="refreshData"
                    class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>

        <!-- Remove the old search box and just keep the status tabs -->
        <!-- Status Tabs -->
        <div class="flex flex-wrap gap-2 mb-4">
            <button
                @click="setStatusFilter('')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === '' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                All
            </button>
            <button
                @click="setStatusFilter('draft')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === 'draft' ? 'bg-yellow-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                Draft
            </button>
            <button
                @click="setStatusFilter('cron')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === 'cron' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                Scheduled
            </button>
            <button
                @click="setStatusFilter('published')"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="filters.status === 'published' ? 'bg-green-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'"
            >
                Published
            </button>
        </div>

        <!-- Add this after the filters and before the table/card views -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading posts...</span>
        </div>

        <div v-else-if="posts.length === 0" class="bg-neutral-800 rounded-lg p-6 text-center text-neutral-400">
            No posts found. Try adjusting your filters or search criteria.
        </div>

        <template v-else>

            <!-- Mobile Card View -->
            <div class="block md:hidden space-y-4 mb-6">
                <div v-for="post in paginatedPosts" :key="post.id" class="bg-neutral-800 rounded-lg overflow-hidden">
                    <div class="p-4 border-b border-neutral-700 flex items-center">
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-white truncate">{{ post.title }}</div>
                            <div class="flex items-center space-x-2 mt-1">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                    :class="getStatusClass(post.status)">
                                    {{ post.status === 'cron' ? 'Scheduled' : post.status.charAt(0).toUpperCase() + post.status.slice(1) }}
                                </span>
                                <span class="text-xs text-neutral-400">
                                    <template v-if="post.status === 'cron' && post.scheduledPublishDate">
                                        <span class="ml-2 text-blue-400 font-medium">
                                            <i class="far fa-clock mr-1"></i> Will be published on: {{ post.scheduledPublishDate }}
                                        </span>
                                    </template>
                                    <template v-else>
                                        {{ formatDate(post.publishedAt || post.createdAt) }}
                                    </template>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-center">
                            <div class="text-neutral-400 text-sm w-24">Author:</div>
                            <div class="text-sm flex items-center text-white">
                                <div v-if="post.authorImage" class="h-5 w-5 rounded-full bg-cover bg-center flex-shrink-0 mr-2 text-white"
                                     :style="{ backgroundImage: `url(${post.authorImage})` }"></div>
                                <div v-else class="h-5 w-5 rounded-full bg-neutral-600 flex-shrink-0 mr-2"></div>
                                {{ post.author }}
                            </div>
                        </div>
                        <div class="flex items-start">
                            <div class="text-neutral-400 text-sm w-24">Categories:</div>
                            <div class="flex flex-wrap gap-1">
                                <span v-for="category in post.categories" :key="category"
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200">
                                    {{ category?.name }}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <div class="text-neutral-400 text-sm w-24">Tags:</div>
                            <div class="flex flex-wrap gap-1">
                                <span v-for="tag in (post.tags || [])" :key="tag"
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-700 text-neutral-300">
                                    {{ tag }}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center mt-2">
                            <div class="flex items-center mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-neutral-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span class="text-xs text-neutral-400">{{ formatNumber(post.views || 0) }}</span>
                            </div>
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-neutral-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span class="text-xs text-neutral-400">{{ formatNumber(post.comments || 0) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="p-3 bg-neutral-750 border-t border-neutral-700 flex justify-between">
                        <button @click="viewPost(post.id)" class="text-neutral-400 hover:text-white p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button @click="editPost(post.id)" class="text-neutral-400 hover:text-white p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                                                <!-- Add button for individual image processing -->
                        <button
                            v-if="post.featureImage && isImageUnprocessed(post.featureImage)"
                            @click="processImage(post.id)"
                            class="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                            title="Process image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button @click="deletePost(post.id)" class="text-neutral-400 hover:text-red-500 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Desktop Table View -->
            <div class="hidden md:block bg-neutral-800 rounded-lg overflow-hidden mb-6">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-neutral-700 text-neutral-300 text-sm">
                            <tr>
                                <th class="p-4 w-16">Image</th>
                                <th class="p-4 min-w-[250px]">Title</th>
                                <th class="p-4 w-44 lg:w-48">Categories</th>
                                <th class="p-4 w-32 hidden lg:table-cell">Stats</th>
                                <th class="p-4 w-28 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-700">
                            <tr v-for="post in paginatedPosts" :key="post.id" class="hover:bg-neutral-750">
                                <td class="p-2">
                                    <div class="h-14 w-24 rounded-md bg-neutral-700 overflow-hidden flex items-center justify-center">
                                        <img v-if="post.featureImage" :src="post.featureImage" alt="Feature image"
                                            class="w-full h-full object-cover">
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-neutral-500" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="flex flex-col">
                                        <div class="text-sm text-white">{{ post.title }}</div>
                                        <div class="flex items-center mt-1 space-x-2">
                                            <div class="flex items-center">
                                                <div v-if="post.authorImage" class="h-5 w-5 rounded-full bg-cover bg-center flex-shrink-0"
                                                     :style="{ backgroundImage: `url(${post.authorImage})` }"></div>
                                                <div v-else class="h-5 w-5 rounded-full bg-neutral-600 flex-shrink-0"></div>
                                                <span class="ml-1.5 text-xs text-neutral-400">{{ post.author }}</span>
                                            </div>
                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                                :class="getStatusClass(post.status)">
                                                {{ post.status === 'cron' ? 'Scheduled' : post.status.charAt(0).toUpperCase() + post.status.slice(1) }}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="text-xs text-neutral-400">
                                                <template v-if="post.status === 'cron' && post.autoPublishAt">
                                                    <span class="text-blue-400 font-medium">
                                                        <i class="far fa-clock mr-1"></i> {{ formatDate(post.autoPublishAt) }} {{ formatTime(post.autoPublishAt) }}
                                                    </span>
                                                </template>
                                                <template v-else>
                                                    {{ formatDate(post.publishedAt || post.createdAt) }} {{ formatTime(post.publishedAt || post.createdAt) }}
                                                </template>
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="flex flex-wrap gap-1">
                                        <span v-for="category in (post.categories || [])" :key="category"
                                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200">
                                            {{ category?.name }}
                                        </span>
                                    </div>
                                </td>
                                <td class="p-4 hidden lg:table-cell text-xs text-neutral-400">
                                    <div class="flex items-center mb-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {{ formatNumber(post.views || 0) }}
                                    </div>
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        {{ formatNumber(post.comments || 0) }}
                                    </div>
                                </td>
                                <td class="p-4 text-right">
                                    <div class="flex items-center justify-end space-x-2">
                                        <button @click="viewPost(post.id)" class="text-neutral-400 hover:text-white p-1 cursor-pointer"
                                            title="View">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button @click="editPost(post.id)" class="text-neutral-400 hover:text-white p-1 cursor-pointer"
                                            title="Edit">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <!-- Add button for individual image processing -->
                                        <button
                                            v-if="post.featureImage && isImageUnprocessed(post.featureImage)"
                                            @click="processImage(post.id)"
                                            class="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                                            title="Process image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button @click="deletePost(post.id)" class="text-neutral-400 hover:text-red-500 p-1 cursor-pointer"
                                            title="Delete">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
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

            <!-- Pagination -->
            <Pagination
                :pagination="pagination"
                itemName="posts"
                @pageChange="handlePageChange"
            />
        </template>
    </div>

    <!-- Add Toast notification component -->
    <ToastNotification
        :show="notification.show"
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        @close="notification.show = false"
    />

    <!-- Bulk Schedule Dialog -->
    <div v-if="showBulkScheduleDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
        <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
            <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                <h3 class="text-lg font-medium text-white">Bulk Schedule Posts</h3>
                <button @click="closeBulkScheduleDialog" class="text-neutral-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="p-6">
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-md font-medium text-white">Select Draft Posts</h4>
                        <div class="flex items-center">
                            <input type="checkbox" id="selectAllDrafts" v-model="selectAllDrafts" @change="toggleSelectAllDrafts" class="mr-2 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-600 bg-neutral-700">
                            <label for="selectAllDrafts" class="text-sm text-neutral-300">Select All</label>
                        </div>
                    </div>
                    <div v-if="loadingDraftPosts" class="py-4 flex justify-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                    <div v-else-if="draftPosts.length === 0" class="py-4 text-center text-neutral-400">
                        No draft posts available for scheduling
                    </div>
                    <div v-else class="max-h-64 overflow-y-auto border border-neutral-700 rounded-md">
                        <div class="divide-y divide-neutral-700">
                            <div v-for="post in draftPosts" :key="post.id" class="flex items-center p-3 hover:bg-neutral-750">
                                <input
                                    type="checkbox"
                                    :id="'post-' + post.id"
                                    v-model="selectedDraftPosts"
                                    :value="post.id"
                                    class="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-600 bg-neutral-700"
                                >
                                <label :for="'post-' + post.id" class="text-sm text-white cursor-pointer flex-1 truncate mr-3">
                                    {{ post.title }}
                                </label>
                                <div class="flex-shrink-0 w-56">
                                    <input
                                        type="datetime-local"
                                        v-model="postScheduleTimes[post.id]"
                                        class="w-full px-2 py-1 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        :disabled="!selectedDraftPosts.includes(post.id)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Scheduling Interval</label>
                    <div class="flex space-x-2">
                        <select
                            v-model="scheduleInterval"
                            class="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="30">Every 30 minutes</option>
                            <option value="60">Every 1 hour</option>
                            <option value="120">Every 2 hours</option>
                        </select>
                        <button
                            @click="updateAllScheduleTimes"
                            class="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors flex items-center"
                            title="Recalculate all scheduling times"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <p class="text-xs text-neutral-400 mt-1">
                        First post will be scheduled 30 minutes from now. Subsequent posts will follow the selected interval.
                    </p>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        @click="closeBulkScheduleDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                        :disabled="bulkScheduleLoading"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        @click="applyBulkSchedule"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        :disabled="selectedDraftPosts.length === 0 || bulkScheduleLoading"
                    >
                        <span v-if="bulkScheduleLoading" class="flex items-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                        <span v-else>Schedule {{ selectedDraftPosts.length }} Posts</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Scheduling Progress Overlay -->
        <div
            v-if="bulkScheduleLoading"
            class="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 px-6"
        >
            <div class="bg-neutral-800 rounded-lg shadow-lg max-w-md w-full p-6">
                <div class="text-center mb-4">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                    <h3 class="text-lg font-medium text-white">Scheduling Posts</h3>
                    <p class="text-neutral-400 mt-1">Please wait while your posts are being scheduled</p>
                </div>

                <!-- Progress bar -->
                <div class="w-full bg-neutral-700 rounded-full h-4 mb-3">
                    <div
                        class="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                        :style="{ width: `${(schedulingProgress.completed / schedulingProgress.total) * 100}%` }"
                    ></div>
                </div>

                <div class="text-center text-sm text-neutral-300 mb-4">
                    <span>{{ schedulingProgress.completed }} of {{ schedulingProgress.total }} posts processed</span>
                </div>

                <!-- Current post being processed -->
                <div v-if="schedulingProgress.currentPost" class="mb-4">
                    <p class="text-sm text-neutral-400">Currently processing:</p>
                    <p class="text-sm font-medium text-white truncate">{{ schedulingProgress.currentPost }}</p>
                </div>

                <!-- Recently processed posts -->
                <div v-if="schedulingProgress.processedPosts.length > 0" class="mt-4">
                    <p class="text-sm text-neutral-400 mb-2">Recently processed:</p>
                    <div class="max-h-32 overflow-y-auto">
                        <div v-for="(post, index) in schedulingProgress.processedPosts.slice().reverse().slice(0, 5)" :key="index"
                            class="flex items-center py-1 border-b border-neutral-700 last:border-b-0">
                            <div :class="post.success ? 'text-green-500' : 'text-red-500'" class="mr-2">
                                <svg v-if="post.success" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div class="flex-1 truncate text-sm">
                                <span v-if="post.success" class="text-neutral-300">{{ post.title }}</span>
                                <span v-else class="text-red-400">{{ post.title }} - {{ post.error }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

        <!-- Batch image processing dialog -->
    <div v-if="showBulkImageProcessDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
        <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
            <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                <h3 class="text-lg font-medium text-white">Batch Image Processing</h3>
                <button @click="closeBulkImageProcessDialog" class="text-neutral-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="p-6">
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-md font-medium text-white">Posts with Unprocessed Images</h4>
                        <div class="flex items-center">
                            <input type="checkbox" id="selectAllImages" v-model="selectAllImages" @change="toggleSelectAllImages" class="mr-2 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-600 bg-neutral-700">
                            <label for="selectAllImages" class="text-sm text-neutral-300">Select All</label>
                        </div>
                    </div>
                    <div v-if="loadingPostsWithImages" class="py-4 flex justify-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                    <div v-else-if="postsWithUnprocessedImages.length === 0" class="py-4 text-center text-neutral-400">
                        All posts already have processed images.
                    </div>
                    <div v-else class="max-h-64 overflow-y-auto border border-neutral-700 rounded-md">
                        <div class="divide-y divide-neutral-700">
                            <div v-for="post in postsWithUnprocessedImages" :key="post.id" class="flex items-center p-3 hover:bg-neutral-750">
                                <input
                                    type="checkbox"
                                    :id="'image-post-' + post.id"
                                    v-model="selectedPostsForImageProcess"
                                    :value="post.id"
                                    class="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-600 bg-neutral-700"
                                >
                                <label :for="'image-post-' + post.id" class="text-sm text-white cursor-pointer flex-1 truncate mr-3">
                                    {{ post.title }}
                                </label>
                                <div class="w-20 h-12 overflow-hidden rounded">
                                    <img v-if="post.featureImage" :src="post.featureImage" alt="Image" class="w-full h-full object-cover">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        @click="closeBulkImageProcessDialog"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                        :disabled="imageProcessingLoading"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        @click="processBulkImages"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        :disabled="selectedPostsForImageProcess.length === 0 || imageProcessingLoading"
                    >
                        <span v-if="imageProcessingLoading" class="flex items-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                        <span v-else>Process {{ selectedPostsForImageProcess.length }} Images</span>
                    </button>
                </div>
            </div>

            <!-- Processing Progress Overlay -->
            <div
                v-if="imageProcessingLoading"
                class="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 px-6"
            >
                <div class="bg-neutral-800 rounded-lg shadow-lg max-w-md w-full p-6">
                    <div class="text-center mb-4">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                        <h3 class="text-lg font-medium text-white">Processing Images</h3>
                        <p class="text-neutral-400 mt-1">Please wait while images are being processed</p>
                    </div>

                    <!-- Progress bar -->
                    <div class="w-full bg-neutral-700 rounded-full h-4 mb-3">
                        <div
                            class="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                            :style="{ width: `${(imageProcessingProgress.completed / imageProcessingProgress.total) * 100}%` }"
                        ></div>
                    </div>

                    <div class="text-center text-sm text-neutral-300 mb-4">
                        <span>{{ imageProcessingProgress.completed }} of {{ imageProcessingProgress.total }} images processed</span>
                    </div>

                    <!-- Currently processing post -->
                    <div v-if="imageProcessingProgress.currentPost" class="mb-4">
                        <p class="text-sm text-neutral-400">Processing post:</p>
                        <p class="text-sm font-medium text-white truncate">{{ imageProcessingProgress.currentPost }}</p>
                    </div>

                    <!-- Recently processed posts -->
                    <div v-if="imageProcessingProgress.processedPosts.length > 0" class="mt-4">
                        <p class="text-sm text-neutral-400 mb-2">Recently processed:</p>
                        <div class="max-h-32 overflow-y-auto">
                            <div v-for="(post, index) in imageProcessingProgress.processedPosts.slice().reverse().slice(0, 5)" :key="index"
                                class="flex items-center py-1 border-b border-neutral-700 last:border-b-0">
                                <div :class="post.success ? 'text-green-500' : 'text-red-500'" class="mr-2">
                                    <svg v-if="post.success" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div class="flex-1 truncate text-sm">
                                    <span v-if="post.success" class="text-neutral-300">{{ post.title }}</span>
                                    <span v-else class="text-amber-400">{{ post.title }} - Original image preserved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Summary of failures -->
                    <div v-if="imageProcessingProgress.failedPosts && imageProcessingProgress.failedPosts.length > 0" class="mt-4 bg-neutral-750 border border-amber-900/50 rounded-md p-3">
                        <p class="text-sm text-amber-400 font-medium mb-2">Attention: Images preserved</p>
                        <p class="text-xs text-neutral-300 mb-2">
                            {{ imageProcessingProgress.failedPosts.length }} images could not be processed,
                            but were preserved in their original formats.
                        </p>
                        <p class="text-xs text-neutral-400">
                            Old images or special formats were kept to avoid content loss.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

        <!-- Image processing results dialog -->
    <div v-if="showImageProcessingResultsDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
        <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
            <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                <h3 class="text-lg font-medium text-white">Image Processing Results</h3>
                <button @click="showImageProcessingResultsDialog = false" class="text-neutral-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="p-6">
                <div class="mb-4">
                    <div class="flex items-center mb-4">
                        <div class="w-1/2 flex items-center">
                            <div class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                                <span>{{ processingResults.success.length }}</span>
                            </div>
                            <span class="text-white">Successfully processed images</span>
                        </div>
                        <div class="w-1/2 flex items-center">
                            <div class="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold mr-3">
                                <span>{{ processingResults.failed.length }}</span>
                            </div>
                            <span class="text-white">Original images preserved</span>
                        </div>
                    </div>

                    <!-- Tabs to switch between processed and preserved -->
                    <div class="border-b border-neutral-700 mb-4">
                        <div class="flex">
                            <button
                                @click="activeResultTab = 'success'"
                                class="px-4 py-2 font-medium text-sm"
                                :class="activeResultTab === 'success' ? 'text-white border-b-2 border-green-500' : 'text-neutral-400 hover:text-white'"
                            >
                                Processed
                            </button>
                            <button
                                @click="activeResultTab = 'failed'"
                                class="px-4 py-2 font-medium text-sm"
                                :class="activeResultTab === 'failed' ? 'text-white border-b-2 border-amber-500' : 'text-neutral-400 hover:text-white'"
                            >
                                Preserved
                            </button>
                        </div>
                    </div>

                    <!-- List of successfully processed images -->
                    <div v-if="activeResultTab === 'success'" class="max-h-96 overflow-y-auto">
                        <div v-if="processingResults.success.length === 0" class="text-center py-6 text-neutral-400">
                            No images were successfully processed.
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="(post, index) in processingResults.success" :key="index" class="bg-neutral-750 p-3 rounded-md">
                                <div class="flex items-center">
                                    <div class="mr-3 w-16 h-12 bg-neutral-700 rounded overflow-hidden flex-shrink-0">
                                        <img v-if="post.newImage" :src="post.newImage" class="w-full h-full object-cover" alt="New image">
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-sm font-medium text-white truncate">{{ post.title }}</h4>
                                        <p class="text-xs text-green-400">Successfully processed</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- List of preserved original images -->
                    <div v-if="activeResultTab === 'failed'" class="max-h-96 overflow-y-auto">
                        <div v-if="processingResults.failed.length === 0" class="text-center py-6 text-neutral-400">
                            All images were successfully processed.
                        </div>
                        <div v-else>
                            <div class="bg-amber-900/20 border border-amber-900/30 rounded-md p-3 mb-4">
                                <p class="text-sm text-amber-400 font-medium">Important information</p>
                                <p class="text-xs text-neutral-300 mt-1">
                                    The images below were preserved in their original format to prevent content loss.
                                    They will continue to work normally but may not benefit from optimizations.
                                </p>
                            </div>
                            <div class="space-y-3">
                                <div v-for="(post, index) in processingResults.failed" :key="index" class="bg-neutral-750 p-3 rounded-md">
                                    <div class="flex items-center">
                                        <div class="mr-3 w-16 h-12 bg-neutral-700 rounded overflow-hidden flex-shrink-0">
                                            <img v-if="post.originalImage" :src="post.originalImage" class="w-full h-full object-cover" alt="Original image">
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <h4 class="text-sm font-medium text-white truncate">{{ post.title }}</h4>
                                            <p class="text-xs text-amber-400">Original image preserved</p>
                                            <p v-if="post.error && post.error !== 'Processing failed - original image preserved'" class="text-xs text-neutral-500 truncate mt-1">
                                                Reason: {{ post.error }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-4">
                    <button
                        type="button"
                        @click="showImageProcessingResultsDialog = false"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminClient } from '@cmmv/blog/admin/client'
import Pagination from '../components/Pagination.vue'
import ToastNotification from '../components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()
const adminClient = useAdminClient()
const loading = ref(false)
const posts = ref([])
const showSearchDropdown = ref(false)
const searchInput = ref(null)

function toggleSearchDropdown() {
    showSearchDropdown.value = !showSearchDropdown.value

    if (showSearchDropdown.value) {
        nextTick(() => {
            searchInput.value?.focus()
        })
    }
}

const itemsPerPage = 10
const currentPage = ref(1)
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)
const endIndex = computed(() => startIndex.value + itemsPerPage)
const totalPosts = ref(0)
const blogUrl = ref('');

const pagination = computed(() => ({
    current: currentPage.value,
    lastPage: totalPages.value,
    perPage: itemsPerPage,
    total: totalPosts.value,
    from: posts.length > 0 ? startIndex.value + 1 : 0,
    to: Math.min(endIndex.value, totalPosts.value)
}));

const loadBlogUrl = async () => {
    try {
        const settings = await adminClient.settings.getRoot();
        const urlSetting = settings.find(s => s.key === 'blog.url');

        if (urlSetting)
            blogUrl.value = urlSetting.value.replace(/\/$/, '');
    } catch (err) {
        console.error('Failed to load blog URL:', err);
        blogUrl.value = '';
    }
};

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

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

async function loadPosts() {
    try {
        loading.value = true

        const params = {
            limit: itemsPerPage,
            offset: (currentPage.value - 1) * itemsPerPage,
            sortBy: 'publishedAt',
            sort: 'desc'
        }

        if (searchQuery.value) {
            params.search = searchQuery.value
            params.searchField = 'title'
        }

        if (filters.value.status) {
            params.status = filters.value.status
        }

        const response = await adminClient.posts.get(params)

        if (response && response.posts) {
            posts.value = response.posts.map(post => {
                const authorData = response.authors?.find(author =>
                    author.user === post.author ||
                    (post.authors && post.authors.includes(author.user))
                );

                return {
                    ...post,
                    author: authorData?.name || 'Unknown',
                    authorImage: authorData?.image || null,
                    categories: Array.isArray(post.categories) ? post.categories : [post.categories],
                    categoryNames: Array.isArray(post.categories)
                        ? response.categories
                            .filter(category => post.categories.includes(category.id))
                            .map(category => category.name)
                        : post.categories?.name ? [post.categories.name] : [],
                    tags: post.tags || []
                }
            });

            totalPosts.value = response.count || posts.value.length;
        } else {
            posts.value = [];
            totalPosts.value = 0;
        }

        loading.value = false
    } catch (error) {
        console.error('Failed to load posts:', error)
        posts.value = [];
        totalPosts.value = 0;
        loading.value = false
        showNotification('error', 'Failed to load posts: ' + error.message)
    }
}

const searchQuery = ref('')
const filters = ref({
    status: '',
    category: ''
})

const handlePageChange = (newPage) => {
    currentPage.value = newPage;
    updateUrlParams();
    loadPosts();
}

const updateUrlParams = () => {
    const query = { ...route.query };

    if (currentPage.value === 1)
        delete query.page;
    else
        query.page = currentPage.value.toString();

    if (!searchQuery.value)
        delete query.search;
    else
        query.search = searchQuery.value;

    if (!filters.value.status)
        delete query.status;
    else
        query.status = filters.value.status;

    router.replace({ query });
}

const initializeFromUrl = () => {
    const { query } = route;

    if (query.page)
        currentPage.value = parseInt(query.page) || 1;

    if (query.search)
        searchQuery.value = query.search;

    if (query.status)
        filters.value.status = query.status;
}

watch(searchQuery, (newValue) => {
    currentPage.value = 1

    if (newValue && newValue.trim() !== '')
        filters.value.status = ''

    updateUrlParams()
    loadPosts()
})

watch([filters], () => {
    loadPosts()
}, { deep: true })

watch(() => filters.value.status, (newStatus) => {
    currentPage.value = 1
    updateUrlParams()
}, { immediate: false })

watch(currentPage, () => {
    updateUrlParams()
    loadPosts()
})

watch(() => route.query, (newQuery, oldQuery) => {
    if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
        initializeFromUrl();
        loadPosts();
    }
}, { deep: true });

const categoryOptions = ref([])

const loadCategories = async () => {
    try {
        const response = await adminClient.categories.get({
            limit: 100,
            sort: 'asc',
            sortBy: 'name'
        })

        if (response && response.data) {
            categoryOptions.value = response.data
        }
    } catch (err) {
        console.error('Failed to load categories:', err)
        showNotification('error', 'Failed to load categories')
    }
}

onMounted(async () => {
    initializeFromUrl()
    loadBlogUrl()
    loadCategories()

    if (!filters.value.status)
        filters.value.status = 'draft'

    loadPosts()

    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })
})

const paginatedPosts = computed(() => {
    return posts.value
})

const totalPages = computed(() => {
    if (totalPosts.value > 0) {
        return Math.ceil(totalPosts.value / itemsPerPage)
    }
    return Math.max(1, Math.ceil(posts.value.length / itemsPerPage))
})

const selectedPosts = ref([])
const bulkAction = ref('')
const isAllSelected = computed(() =>
    posts.value.length > 0 && selectedPosts.value.length === posts.value.length
)

function toggleSelectAll(e) {
    if (e.target.checked) {
        selectedPosts.value = posts.value.map(post => post.id)
    } else {
        selectedPosts.value = []
    }
}

async function applyBulkAction() {
    if (!bulkAction.value || selectedPosts.value.length === 0) return

    try {
        loading.value = true

        const action = bulkAction.value
        const ids = selectedPosts.value

        await adminClient.bulkUpdatePosts({
            ids,
            action
        })

        selectedPosts.value = []
        bulkAction.value = ''
        await loadPosts()

        loading.value = false
    } catch (error) {
        console.error('Failed to apply bulk action:', error)
        loading.value = false
    }
}

function editPost(id) {
    router.push(`/post/${id}`)
}

function viewPost(id) {
    const post = posts.value.find(p => p.id === id)

    if (post)
        window.open(`${blogUrl.value}/preview/${post.id}`, '_blank')
}

async function deletePost(id) {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            loading.value = true
            await adminClient.posts.delete(id)
            await loadPosts()
            showNotification('success', 'Post deleted successfully')
            loading.value = false
        } catch (error) {
            console.error('Failed to delete post:', error)
            loading.value = false
            showNotification('error', 'Failed to delete post: ' + error.message)
        }
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getStatusClass(status) {
    switch (status) {
        case 'published': return 'bg-green-900 text-green-200'
        case 'draft': return 'bg-yellow-900 text-yellow-200'
        case 'scheduled':
        case 'cron': return 'bg-blue-900 text-blue-200'
        default: return 'bg-neutral-700 text-neutral-200'
    }
}

function formatNumber(num) {
    if (!num && num !== 0) return '0';

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function refreshData() {
    loadPosts();
}

function setStatusFilter(status) {
    if (searchQuery.value.trim() !== '') {
        searchQuery.value = ''
    }

    filters.value.status = status
}

function clearSearch() {
    searchQuery.value = ''
    updateUrlParams()
    loadPosts()
}

const showBulkScheduleDialog = ref(false)
const draftPosts = ref([])
const loadingDraftPosts = ref(false)
const selectedDraftPosts = ref([])
const selectAllDrafts = ref(false)
const scheduleInterval = ref('60')
const bulkScheduleLoading = ref(false)
const postScheduleTimes = ref({})
const schedulingProgress = ref({
    total: 0,
    completed: 0,
    currentPost: null,
    processedPosts: []
})

function openBulkScheduleDialog() {
    showBulkScheduleDialog.value = true
    loadingDraftPosts.value = true
    selectedDraftPosts.value = []
    selectAllDrafts.value = false
    postScheduleTimes.value = {}
    loadDraftPosts()
}

function closeBulkScheduleDialog() {
    showBulkScheduleDialog.value = false
    draftPosts.value = []
    selectedDraftPosts.value = []
}

async function loadDraftPosts() {
    try {
        loadingDraftPosts.value = true

        const response = await adminClient.posts.get({
            limit: 100,
            status: 'draft',
            sortBy: 'createdAt',
            sort: 'asc'
        })

        if (response && response.posts) {
            draftPosts.value = response.posts
            updateAllScheduleTimes()
        } else {
            draftPosts.value = []
        }

        loadingDraftPosts.value = false
    } catch (error) {
        console.error('Failed to load draft posts:', error)
        draftPosts.value = []
        loadingDraftPosts.value = false
        showNotification('error', 'Failed to load draft posts')
    }
}

function toggleSelectAllDrafts() {
    if (selectAllDrafts.value) {
        selectedDraftPosts.value = draftPosts.value.map(post => post.id)
    } else {
        selectedDraftPosts.value = []
    }
}

watch(selectedDraftPosts, (newVal) => {
    selectAllDrafts.value = newVal.length > 0 && newVal.length === draftPosts.value.length
})

async function applyBulkSchedule() {
    if (selectedDraftPosts.value.length === 0) return

    try {
        bulkScheduleLoading.value = true

        schedulingProgress.value = {
            total: selectedDraftPosts.value.length,
            completed: 0,
            currentPost: null,
            processedPosts: []
        }

        const results = []

        for (const postId of selectedDraftPosts.value) {
            try {
                const post = draftPosts.value.find(p => p.id === postId)
                schedulingProgress.value.currentPost = post ? post.title : postId
                const postDetails = await adminClient.posts.getById(postId)
                const scheduledTimeStr = postScheduleTimes.value[postId]
                const scheduledTime = new Date(scheduledTimeStr)

                const updateData = {
                    post: {
                        ...postDetails,
                        status: 'cron',
                        autoPublishAt: scheduledTime.getTime(),
                        categories: postDetails.categories
                            ? postDetails.categories.map(cat => (typeof cat === 'object' && cat.id != null) ? cat.id : cat).filter(id => id != null)
                            : [],
                        tags: postDetails.tags
                            ? postDetails.tags.map(tag => (typeof tag === 'object' && tag.name != null) ? tag.name : tag).filter(name => name != null)
                            : []
                    }
                }

                await adminClient.posts.save(updateData)

                const result = {
                    id: postId,
                    title: postDetails.title,
                    scheduledTime: scheduledTime.toLocaleString(),
                    success: true
                }

                results.push(result)
                schedulingProgress.value.completed++
                schedulingProgress.value.processedPosts.push(result)
            } catch (err) {
                const failedResult = {
                    id: postId,
                    title: draftPosts.value.find(p => p.id === postId)?.title || postId,
                    error: err.message,
                    success: false
                }
                results.push(failedResult)
                schedulingProgress.value.completed++
                schedulingProgress.value.processedPosts.push(failedResult)
            }
        }

        const successCount = results.filter(r => r.success).length

        if (successCount === selectedDraftPosts.value.length)
            showNotification('success', `Successfully scheduled ${successCount} posts`)
        else
            showNotification('warning', `Scheduled ${successCount} out of ${selectedDraftPosts.value.length} posts`)

        bulkScheduleLoading.value = false
        closeBulkScheduleDialog()
        loadPosts()
    } catch (error) {
        console.error('Failed to apply bulk scheduling:', error)
        bulkScheduleLoading.value = false
        showNotification('error', 'Failed to apply bulk scheduling: ' + error.message)
    }
}

function updateAllScheduleTimes() {
    let baseTime = new Date()
    baseTime.setMinutes(baseTime.getMinutes() + 30)

    const intervalMinutes = parseInt(scheduleInterval.value)
    const newScheduleTimes = {}

    const manuallyEdited = {}
    const oldTimes = {...postScheduleTimes.value}

    draftPosts.value.forEach((post, index) => {
        const postTime = new Date(baseTime.getTime() + (index * intervalMinutes * 60 * 1000))
        newScheduleTimes[post.id] = formatDateTimeForInput(postTime)
    })

    postScheduleTimes.value = newScheduleTimes
}

watch(scheduleInterval, (newInterval, oldInterval) => {
    console.log(`Interval changed from ${oldInterval} to ${newInterval}`)
    updateAllScheduleTimes()
}, { immediate: false })

watch(selectedDraftPosts, () => {
    for (const postId of selectedDraftPosts.value) {
        if (!postScheduleTimes.value[postId]) {
            updateAllScheduleTimes()
            break
        }
    }
})

function formatDateTimeForInput(date) {
    if (!date) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

const showBulkImageProcessDialog = ref(false)
const postsWithUnprocessedImages = ref([])
const loadingPostsWithImages = ref(false)
const selectedPostsForImageProcess = ref([])
const selectAllImages = ref(false)
const imageProcessingLoading = ref(false)
const imageProcessingProgress = ref({
    total: 0,
    completed: 0,
    currentPost: null,
    processedPosts: [],
    failedPosts: []
})

function openBulkImageProcessDialog() {
    showBulkImageProcessDialog.value = true
    loadingPostsWithImages.value = true
    selectedPostsForImageProcess.value = []
    selectAllImages.value = false
    loadPostsWithUnprocessedImages()
}

function closeBulkImageProcessDialog() {
    showBulkImageProcessDialog.value = false
    postsWithUnprocessedImages.value = []
    selectedPostsForImageProcess.value = []
}

async function loadPostsWithUnprocessedImages() {
    try {
        loadingPostsWithImages.value = true;

        const response = await adminClient.posts.get({
            limit: 100,
            status: 'draft' || 'cron',
            sortBy: 'createdAt',
            sort: 'desc'
        });

        if (response && response.posts) {
            postsWithUnprocessedImages.value = response.posts.filter(post =>
                post.featureImage && isImageUnprocessed(post.featureImage)
            ).map(post => ({
                ...post,
                author: typeof post.author === 'object' ? post.author.name : post.author,
                authorImage: typeof post.author === 'object' ? post.author.image : null,
            }));
        } else {
            postsWithUnprocessedImages.value = [];
        }

        loadingPostsWithImages.value = false;
    } catch (error) {
        console.error('Falha ao carregar posts com imagens não processadas:', error);
        postsWithUnprocessedImages.value = [];
        loadingPostsWithImages.value = false;
        showNotification('error', 'Falha ao carregar posts com imagens não processadas');
    }
}

function toggleSelectAllImages() {
    if (selectAllImages.value) {
        selectedPostsForImageProcess.value = postsWithUnprocessedImages.value.map(post => post.id)
    } else {
        selectedPostsForImageProcess.value = []
    }
}

watch(selectedPostsForImageProcess, (newVal) => {
    selectAllImages.value = newVal.length > 0 && newVal.length === postsWithUnprocessedImages.value.length
})

async function processImage(postId) {
    try {
        const postResponse = await adminClient.posts.getById(postId);

        if (!postResponse || !postResponse.featureImage)
            throw new Error('Post ou imagem não encontrada');

        const post = postResponse;
        const originalImageUrl = post.featureImage;

        if (!isImageUnprocessed(originalImageUrl))
            return;

        let processedImageUrl = '';
        let success = false;

        try {
            if (originalImageUrl.startsWith('data:')) {
                const formData = new FormData();
                try {
                    const blob = await fetch(originalImageUrl).then(r => r.blob());
                    formData.append('file', blob, 'feature-image.jpg');
                    const response = await adminClient.medias.upload(formData);

                    if (response && response.url) {
                        processedImageUrl = response.url;
                        success = true;
                    } else {
                        console.warn('Resultado de upload sem URL, usando imagem original');
                    }
                } catch (uploadError) {
                    console.error('Erro ao processar imagem base64:', uploadError);
                }
            } else if (originalImageUrl.includes('://')) {
                try {
                    const response = await adminClient.medias.importFromUrl({
                        url: originalImageUrl,
                        alt: post.featureImageAlt || '',
                        caption: post.featureImageCaption || ''
                    });

                    if (response && response.url) {
                        processedImageUrl = response.url;
                        success = true;
                    } else {
                        console.warn('Resultado de importação sem URL, usando imagem original');
                    }
                } catch (importError) {
                    console.error('Erro ao importar imagem externa:', importError);
                }
            }

            if (!success || !processedImageUrl)
                return false;

            const updateData = {
                post: {
                    ...post,
                    featureImage: processedImageUrl,
                    originalFeatureImage: originalImageUrl,
                    categories: post.categories
                        ? post.categories.map(cat => (typeof cat === 'object' && cat.id != null) ? cat.id : cat).filter(id => id != null)
                        : [],
                    tags: post.tags
                        ? post.tags.map(tag => (typeof tag === 'object' && tag.name != null) ? tag.name : tag).filter(name => name != null)
                        : []
                }
            };

            await adminClient.posts.save(updateData);
            const postIndex = posts.value.findIndex(p => p.id === postId);

            if (postIndex !== -1)
                posts.value[postIndex].featureImage = processedImageUrl;

            return true;
        } catch (processingError) {
            return false;
        }
    } catch (err) {
        return false;
    }
}

async function processBulkImages() {
    if (selectedPostsForImageProcess.value.length === 0) return;

    try {
        imageProcessingLoading.value = true;
        imageProcessingProgress.value = {
            total: selectedPostsForImageProcess.value.length,
            completed: 0,
            currentPost: null,
            processedPosts: [],
            failedPosts: []
        };

        processingResults.value = {
            success: [],
            failed: []
        };

        const results = [];
        const failedImages = [];

        for (const postId of selectedPostsForImageProcess.value) {
            try {
                const post = postsWithUnprocessedImages.value.find(p => p.id === postId);
                imageProcessingProgress.value.currentPost = post ? post.title : postId;
                const processResult = await processImage(postId);

                if (processResult === true) {
                    const updatedPost = await adminClient.posts.getById(postId);
                    const result = {
                        id: postId,
                        title: post.title,
                        newImage: updatedPost.featureImage,
                        success: true
                    };
                    results.push(result);
                    processingResults.value.success.push(result);
                    imageProcessingProgress.value.processedPosts.push(result);
                } else {
                    const failedResult = {
                        id: postId,
                        title: post.title,
                        originalImage: post.featureImage,
                        error: "Processamento falhou - imagem original preservada",
                        success: false
                    };
                    failedImages.push(failedResult);
                    processingResults.value.failed.push(failedResult);
                    results.push(failedResult);
                    imageProcessingProgress.value.processedPosts.push(failedResult);
                    imageProcessingProgress.value.failedPosts.push(failedResult);
                }

                imageProcessingProgress.value.completed++;
            } catch (err) {
                console.error(`Falha ao processar imagem para o post ${postId}:`, err);
                const failedResult = {
                    id: postId,
                    title: postsWithUnprocessedImages.value.find(p => p.id === postId)?.title || postId,
                    originalImage: postsWithUnprocessedImages.value.find(p => p.id === postId)?.featureImage,
                    error: err.message,
                    success: false
                };
                results.push(failedResult);
                processingResults.value.failed.push(failedResult);
                failedImages.push(failedResult);
                imageProcessingProgress.value.completed++;
                imageProcessingProgress.value.processedPosts.push(failedResult);
                imageProcessingProgress.value.failedPosts.push(failedResult);
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failedCount = failedImages.length;

        if (successCount === selectedPostsForImageProcess.value.length) {
            showNotification('success', `${successCount} imagens processadas com sucesso`);
        } else if (failedCount === selectedPostsForImageProcess.value.length) {
            showNotification('error', `Nenhuma imagem pôde ser processada. As imagens originais foram preservadas.`);
        } else {
            showNotification('warning', `Processadas ${successCount} de ${selectedPostsForImageProcess.value.length} imagens. ${failedCount} imagens não puderam ser processadas mas foram preservadas.`);
        }

        if (failedImages.length > 0)
            console.log('Imagens que não puderam ser processadas (preservadas):', failedImages);

        imageProcessingLoading.value = false;
        closeBulkImageProcessDialog();

        if (processingResults.value.success.length > 0 || processingResults.value.failed.length > 0) {
            activeResultTab.value = processingResults.value.failed.length > 0 ? 'failed' : 'success';
            showImageProcessingResultsDialog.value = true;
        }

        loadPosts();
    } catch (error) {
        console.error('Falha ao processar imagens em lote:', error);
        imageProcessingLoading.value = false;
        showNotification('error', 'Falha ao processar imagens em lote: ' + error.message);
    }
}

function isImageUnprocessed(imageUrl) {
    if(!imageUrl)
        return false;

    if(imageUrl.startsWith("https://static") || imageUrl.startsWith("https://cdn"))
        return false;

    if(!imageUrl.includes(window.location.hostname) &&
        !imageUrl.includes(blogUrl.value))
        return true;

    if (imageUrl && (
        imageUrl.startsWith('data:') ||
        (imageUrl.startsWith('/') && !imageUrl.includes('://')) ||
        imageUrl.includes('imageProxy')
    )) {
        return true;
    }

    return false;
}

const showImageProcessingResultsDialog = ref(false)
const activeResultTab = ref('success')
const processingResults = ref({
    success: [],
    failed: []
})
</script>
