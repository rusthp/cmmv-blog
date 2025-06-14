<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">YouTube Videos</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshVideos" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
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
                            v-if="filters.search.trim() || filters.channelFilter || filters.publishedFilter !== 'all'"
                            class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full"
                            title="Search or filter active">
                        </span>
                    </button>
                    <!-- Search dropdown -->
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-3">
                            <div class="relative">
                                <input
                                    v-model="filters.search"
                                    type="text"
                                    placeholder="Search videos..."
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
                                    <option value="title">Title</option>
                                    <option value="description">Description</option>
                                    <option value="videoId">Video ID</option>
                                </select>
                            </div>
                            <!-- Channel filter -->
                            <div>
                                <label class="block text-xs text-neutral-400 mb-1">Channel:</label>
                                <select
                                    v-model="filters.channelFilter"
                                    class="bg-neutral-700 w-full h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">All Channels</option>
                                    <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                                        {{ channel.name }}
                                    </option>
                                </select>
                            </div>
                            <!-- Published filter -->
                            <div>
                                <label class="block text-xs text-neutral-400 mb-1">Status:</label>
                                <select
                                    v-model="filters.publishedFilter"
                                    class="bg-neutral-700 w-full h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="all">All Videos</option>
                                    <option value="published">Published Only</option>
                                    <option value="unpublished">Unpublished Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading videos...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load videos</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshVideos" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="videos.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 4h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            <p class="text-neutral-300 mb-2">No videos found</p>
            <p class="text-neutral-400 text-sm mb-4">Try adjusting your filters or processing some YouTube channels first</p>
        </div>

        <!-- Videos Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="video in videos" :key="video.id" class="bg-neutral-800 rounded-lg overflow-hidden flex flex-col">
                <!-- Thumbnail -->
                <div class="relative aspect-video">
                    <img
                        :src="video.thumbnailUrl"
                        :alt="video.title"
                        class="w-full h-full object-cover"
                        @error="handleImageError"
                    />
                    <div class="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                        {{ formatDuration(video.durationSeconds) }}
                    </div>
                </div>

                <!-- Content -->
                <div class="p-4 flex flex-col flex-grow">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="flex items-center space-x-2 text-sm text-neutral-400 mb-1">
                                <span class="bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-xs">
                                    {{ getChannelName(video.channelId) }}
                                </span>
                                <span v-if="video.isPublished" class="bg-green-900 text-green-200 px-2 py-0.5 rounded text-xs flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Published
                                </span>
                                <span v-if="video.blogPostId" class="bg-purple-900 text-purple-200 px-2 py-0.5 rounded text-xs flex items-center">
                                    Blog Post
                                </span>
                            </div>
                            <h3 class="text-base font-semibold text-white mb-2 line-clamp-2">{{ video.title }}</h3>
                        </div>
                    </div>

                    <p class="text-sm text-neutral-400 mb-3 line-clamp-2">{{ video.description }}</p>

                    <div class="text-xs text-neutral-500 mb-3">
                        Published: {{ formatDate(video.publishedAt) }}
                    </div>

                    <!-- Actions -->
                    <div class="mt-auto flex justify-end space-x-2">
                        <a :href="video.url" target="_blank" class="text-blue-400 hover:text-blue-300" title="Watch on YouTube">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <button
                            @click="rejectVideo(video)"
                            class="text-red-400 hover:text-red-300"
                            title="Reject video"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button v-if="!video.blogPostId" @click="createBlogPost(video)" class="text-purple-400 hover:text-purple-300" title="Create blog post">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <a v-else :href="`/admin/posts/edit/${video.blogPostId}`" class="text-purple-400 hover:text-purple-300" title="Edit blog post">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <Pagination
            :pagination="pagination"
            itemName="videos"
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

        <!-- Create Blog Post Dialog -->
        <div v-if="showBlogPostDialog" class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-hidden" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-neutral-700 sticky top-0 bg-neutral-800 z-10">
                    <h3 class="text-xl font-semibold text-white">Generate Blog Post from YouTube Video</h3>
                    <button @click="showBlogPostDialog = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div v-if="selectedVideo" class="p-4 overflow-y-auto flex-grow">
                    <div class="mb-4">
                        <div class="aspect-video rounded-md overflow-hidden mb-4">
                            <img :src="selectedVideo.thumbnailUrl" alt="Video thumbnail" class="w-full h-full object-cover">
                        </div>
                        <h4 class="text-lg font-medium text-white mb-2">{{ selectedVideo.title }}</h4>
                    </div>

                    <div class="space-y-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-1">Post Title</label>
                            <input
                                v-model="blogPost.title"
                                type="text"
                                class="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-white"
                                placeholder="Enter post title"
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-1">Excerpt</label>
                            <textarea
                                v-model="blogPost.excerpt"
                                rows="2"
                                class="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-white"
                                placeholder="Enter excerpt"
                            ></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-1">Content</label>
                            <div class="mb-2 flex items-center">
                                <button
                                    @click="generateAIContent"
                                    class="inline-flex items-center px-3 py-1 bg-purple-700 text-white text-sm rounded-md hover:bg-purple-800"
                                    :disabled="aiLoading"
                                >
                                    <svg v-if="aiLoading" class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    {{ aiLoading ? 'Generating...' : 'Generate with AI' }}
                                </button>
                            </div>
                            <textarea
                                v-model="blogPost.content"
                                rows="6"
                                class="w-full bg-neutral-700 border border-neutral-600 rounded-md px-3 py-2 text-white font-mono text-sm"
                                placeholder="Enter post content or generate with AI"
                            ></textarea>
                        </div>

                        <!-- Add tags section -->
                        <div v-if="blogPost.tags && blogPost.tags.length > 0" class="mt-4">
                            <label class="block text-sm font-medium text-neutral-300 mb-2">Suggested Tags</label>
                            <div class="flex flex-wrap gap-2">
                                <div
                                    v-for="(tag, idx) in blogPost.tags"
                                    :key="idx"
                                    class="bg-purple-900 text-purple-200 px-2.5 py-1 rounded-md text-xs flex items-center"
                                >
                                    <span>{{ tag }}</span>
                                </div>
                            </div>
                            <p class="text-xs text-neutral-400 mt-1">These tags will be added to your post</p>
                        </div>
                    </div>
                </div>

                <div class="p-4 border-t border-neutral-700 bg-neutral-800 sticky bottom-0">
                    <div class="flex justify-end space-x-3">
                        <button
                            @click="showBlogPostDialog = false"
                            class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            @click="saveBlogPost"
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                            :disabled="savingPost"
                        >
                            <span v-if="savingPost" class="flex items-center">
                                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                            <span v-else>Create Post</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
// @ts-ignore
import { useYTClient } from '@cmmv/yt-aggregation/admin/client';
// @ts-ignore
import { useAdminClient } from '@cmmv/blog/admin/client';

// @ts-ignore
import Pagination from '@cmmv/blog/admin/components/Pagination.vue';
// @ts-ignore
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue';

const ytClient = useYTClient();
const adminClient = useAdminClient();

interface Video {
    id: string;
    title: string;
    description: string;
    videoId: string;
    channelId: string;
    thumbnailUrl: string;
    publishedAt: string;
    url: string;
    isPublished: boolean;
    publishedAtBlog?: string;
    blogPostId?: string;
    durationSeconds: number;
}

interface Channel {
    id: string;
    name: string;
    channelId: string;
}

interface PaginationData {
    current: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number;
    to: number;
}

interface NotificationData {
    show: boolean;
    type: string;
    message: string;
    duration: number;
}

interface Filters {
    search: string;
    searchField: string;
    channelFilter: string;
    publishedFilter: string;
    sortBy: string;
    sortOrder: string;
    page: number;
}

const videos = ref<Video[]>([]);
const channels = ref<Channel[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const showBlogPostDialog = ref<boolean>(false);
const selectedVideo = ref<Video | null>(null);
const savingPost = ref<boolean>(false);
const aiLoading = ref<boolean>(false);

const blogPost = ref({
    title: '',
    excerpt: '',
    content: '',
    tags: [] as string[]
});

const notification = ref<NotificationData>({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
});

const pagination = ref<PaginationData>({
    current: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    from: 1,
    to: 10
});

const filters = ref<Filters>({
    search: '',
    searchField: 'title',
    channelFilter: '',
    publishedFilter: 'all',
    sortBy: 'publishedAt',
    sortOrder: 'desc',
    page: 1
});

const showSearchDropdown = ref<boolean>(false);
const searchInput = ref<HTMLInputElement | null>(null);

const loadVideos = async (): Promise<void> => {
    try {
        loading.value = true;
        error.value = null;

        const queryParams: any = {
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage,
            sortBy: filters.value.sortBy,
            sort: filters.value.sortOrder
        };

        queryParams.blogPostId = "null";

        if (filters.value.search) {
            queryParams.search = filters.value.search;
            queryParams.searchField = filters.value.searchField;
        }

        if (filters.value.channelFilter) {
            queryParams.channelId = filters.value.channelFilter;
        }

        if (filters.value.publishedFilter === 'published') {
            queryParams.isPublished = true;
        } else if (filters.value.publishedFilter === 'unpublished') {
            queryParams.isPublished = false;
        }

        const response = await ytClient.videos.get(queryParams);

        if (response && response.data) {
            videos.value = response.data || [];

            const paginationData = response.pagination || {};
            const totalCount = response.count || 0;
            const currentOffset = paginationData.offset || 0;
            const currentLimit = paginationData.limit || 10;
            const currentPage = Math.floor(currentOffset / currentLimit) + 1;
            const lastPage = Math.ceil(totalCount / currentLimit);

            pagination.value = {
                current: currentPage,
                lastPage: lastPage,
                perPage: currentLimit,
                total: totalCount,
                from: currentOffset + 1,
                to: Math.min(currentOffset + currentLimit, totalCount)
            };
        } else {
            videos.value = [];

            pagination.value = {
                current: 1,
                lastPage: 1,
                perPage: 10,
                total: 0,
                from: 0,
                to: 0
            };
        }

        loading.value = false;
    } catch (err: unknown) {
        console.error('Failed to load videos:', err);
        loading.value = false;
        error.value = err instanceof Error ? err.message : 'Failed to load videos';
        showNotification('error', 'Failed to load videos');
    }
};

const loadChannels = async (): Promise<void> => {
    try {
        const response = await ytClient.channels.get({
            limit: 100,
            sortBy: 'name',
            sort: 'asc'
        });

        if (response && response.data)
            channels.value = response.data || [];
    } catch (err: unknown) {
        console.error('Failed to load channels:', err);
    }
};

const refreshVideos = async (): Promise<void> => {
    await loadChannels();
    await loadVideos();
};

const handlePageChange = (newPage: number): void => {
    filters.value.page = newPage;
};

watch(filters, () => {
    loadVideos();
}, { deep: true });

const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (err) {
        console.error('Date formatting error:', err, dateString);
        return 'N/A';
    }
};

const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getChannelName = (channelId: string): string => {
    if (!channelId) return 'No Channel';

    const channel = channels.value.find(c => c.id === channelId);
    if (channel) return channel.name;

    return 'Unknown Channel';
};

const handleImageError = (event: Event): void => {
    const target = event.target as HTMLImageElement;
    if (target) {
        // Set a default thumbnail image
        target.src = 'https://via.placeholder.com/640x360?text=Video+Thumbnail+Not+Available';
    }
};

const showNotification = (type: string, message: string): void => {
    notification.value = {
        show: true,
        type,
        message,
        duration: 3000
    };

    setTimeout(() => {
        notification.value.show = false;
    }, notification.value.duration);
};

const publishVideo = async (video: Video): Promise<void> => {
    try {
        showNotification('info', 'Publishing video...');

        await ytClient.videos.update(video.id, {
            isPublished: true
        });

        showNotification('success', 'Video published successfully');
        await refreshVideos();
    } catch (err: unknown) {
        console.error('Failed to publish video:', err);
        showNotification('error', err instanceof Error ? err.message : 'Failed to publish video');
    }
};

const createBlogPost = (video: Video): void => {
    selectedVideo.value = video;
    blogPost.value = {
        title: video.title,
        excerpt: video.description.substring(0, 150) + (video.description.length > 150 ? '...' : ''),
        content: `<p>${video.description}</p>\n\n<div class="video-embed aspect-video mb-6">\n  <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${video.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n</div>`,
        tags: ['YouTube', 'Video', getChannelName(video.channelId)]
    };
    showBlogPostDialog.value = true;

    // Não gerar conteúdo automaticamente - usuário deve clicar no botão "Generate with AI"
    // generateAIContent();
};

const generateAIContent = async (): Promise<void> => {
    if (!selectedVideo.value || aiLoading.value) return;

    try {
        aiLoading.value = true;
        showNotification('info', 'Generating content with AI...');

        // Use the proper YouTube AI endpoint
        const response = await ytClient.videos.getAI(selectedVideo.value.id);

        if (response) {
            blogPost.value.title = response.title || selectedVideo.value.title;
            blogPost.value.content = `${response.content || ''}`;
            blogPost.value.excerpt = response.excerpt ||
                (selectedVideo.value.description?.substring(0, 150) + (selectedVideo.value.description?.length > 150 ? '...' : ''));

            if (response.suggestedTags && Array.isArray(response.suggestedTags)) {
                blogPost.value.tags = [...response.suggestedTags, 'YouTube', getChannelName(selectedVideo.value.channelId)];
            } else {
                blogPost.value.tags = ['YouTube', 'Video', getChannelName(selectedVideo.value.channelId)];
            }

            showNotification('success', 'AI content generated successfully');
        } else {
            throw new Error('AI response did not contain content');
        }
    } catch (err: unknown) {
        console.error('Failed to generate AI content:', err);
        showNotification('warning', 'AI content generation failed. Using default template instead.');

        // Create a fallback template that still looks professional
        const embedCode = `
<div class="video-embed aspect-video mb-6">
  <iframe
    width="100%"
    height="100%"
    src="https://www.youtube.com/embed/${selectedVideo.value.videoId}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>`;

        const defaultContent = `
<h2>About This Video</h2>
<p>${selectedVideo.value.description}</p>

<p>This video by ${getChannelName(selectedVideo.value.channelId)} explores interesting topics related to ${selectedVideo.value.title}. Watch the full video above to learn more about the subject.</p>

<h3>Key Points</h3>
<ul>
  <li>Watch the video to discover insights on ${selectedVideo.value.title}</li>
  <li>Learn from ${getChannelName(selectedVideo.value.channelId)}'s expertise</li>
  <li>Gain a deeper understanding of the topic</li>
</ul>

<p>Feel free to leave comments below with your thoughts about the video or any questions you might have.</p>`;

        const videoAttribution = `
<p class="text-sm text-gray-500 mt-4">
  <em>Originally published on <a href="${selectedVideo.value.url}" target="_blank" rel="noopener noreferrer">YouTube</a>
  by ${getChannelName(selectedVideo.value.channelId)} on ${formatDate(selectedVideo.value.publishedAt)}</em>
</p>`;

        blogPost.value.content = `${embedCode}\n\n${defaultContent}\n\n${videoAttribution}`;
    } finally {
        aiLoading.value = false;
    }
};

const saveBlogPost = async (): Promise<void> => {
    if (!selectedVideo.value) return;

    try {
        savingPost.value = true;
        showNotification('info', 'Creating blog post...');

        const slug = blogPost.value.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Process the image for the blog post
        let processedImage = null;
        try {
            const response = await adminClient.medias.importFromUrl({
                url: selectedVideo.value.thumbnailUrl,
                alt: blogPost.value.title,
                caption: ''
            });

            if (response && response.url) {
                processedImage = response.url;
            }
        } catch (imgErr) {
            console.error('Failed to process image:', imgErr);
        }

        // Determine tags - either use AI-suggested tags or defaults
        const tags = blogPost.value.tags ||
                    ['YouTube', 'Video', getChannelName(selectedVideo.value.channelId)];

        const postData = {
            post: {
                title: blogPost.value.title,
                slug: slug,
                content: blogPost.value.content,
                status: 'draft',
                excerpt: blogPost.value.excerpt,
                featureImage: processedImage,
                tags: tags,
                categories: []
            },
            meta: {
                metaTitle: blogPost.value.title,
                metaDescription: blogPost.value.excerpt,
                ogTitle: blogPost.value.title,
                ogDescription: blogPost.value.excerpt,
                ogImage: processedImage,
                twitterTitle: blogPost.value.title,
                twitterDescription: blogPost.value.excerpt,
                twitterImage: processedImage
            }
        };

        const saveResponse = await adminClient.posts.save(postData);

        if (!saveResponse || !saveResponse.id) {
            throw new Error('Failed to create blog post');
        }

        // Update the video with the blog post reference
        await ytClient.videos.update(selectedVideo.value.id, {
            blogPostId: saveResponse.id,
            publishedAtBlog: new Date().toISOString()
        });

        showNotification('success', 'Blog post created successfully');
        showBlogPostDialog.value = false;
        await refreshVideos();

    } catch (err: unknown) {
        console.error('Failed to create blog post:', err);
        showNotification('error', err instanceof Error ? err.message : 'Failed to create blog post');
    } finally {
        savingPost.value = false;
    }
};

const rejectVideo = async (video: Video): Promise<void> => {
    try {
        if (!confirm(`Are you sure you want to reject the video "${video.title}"? This will remove it from the list.`)) {
            return;
        }

        showNotification('info', 'Rejecting video...');
        await ytClient.videos.reject(video.id);
        videos.value = videos.value.filter(v => v.id !== video.id);

        showNotification('success', 'Video rejected successfully');
    } catch (err: unknown) {
        console.error('Failed to reject video:', err);
        showNotification('error', err instanceof Error ? err.message : 'Failed to reject video');
    }
};

const toggleSearchDropdown = (): void => {
    showSearchDropdown.value = !showSearchDropdown.value;
    if (showSearchDropdown.value) {
        setTimeout(() => {
            searchInput.value?.focus();
        }, 0);
    }
};

const clearSearch = (): void => {
    filters.value = {
        ...filters.value,
        search: '',
        channelFilter: '',
        publishedFilter: 'all'
    };
    showSearchDropdown.value = false;
    refreshVideos();
};

onMounted(async () => {
    // Add click-outside handling for search dropdown
    document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false;
        }
    });

    await loadChannels();
    await loadVideos();
});
</script>

<style>
.line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
}

.aspect-video {
    aspect-ratio: 16 / 9;
}
</style>
