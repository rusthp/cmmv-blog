<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
                <h1 class="text-2xl font-bold text-white">Hunting Queue</h1>
                <p class="text-neutral-400 text-sm mt-1">Approving a result asks ContentMind for a <strong>draft</strong> article — it is never published automatically, you still review and publish it by hand.</p>
            </div>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <select
                    v-model="filters.status"
                    class="bg-neutral-700 h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>

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
            <span class="ml-3 text-neutral-400">Loading results...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load hunting results</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="results.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-neutral-300 mb-2">No {{ filters.status.toLowerCase() }} results</p>
            <p class="text-neutral-400 text-sm">Results appear here after the hunt runs for your active keywords</p>
        </div>

        <!-- Results table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Title
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Source
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Keyword
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Published
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Draft
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-40">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="result in results" :key="result.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 text-sm text-white max-w-md">
                                <a
                                    :href="result.link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="hover:text-blue-400 transition-colors"
                                    :title="result.link"
                                >
                                    {{ result.title }}
                                </a>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ result.source || '-' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ keywordName(result.keyword) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ formatDate(result.pubDate) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <router-link
                                    v-if="result.generationStatus === 'GENERATED' && result.postRef"
                                    :to="`/post/${result.postRef}`"
                                    class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300 hover:bg-green-800 transition-colors"
                                    title="Open the generated draft — review it before publishing"
                                >
                                    Draft created
                                </router-link>
                                <span
                                    v-else-if="result.generationStatus === 'PENDING'"
                                    class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300"
                                    title="ContentMind is writing the draft"
                                >
                                    Generating...
                                </span>
                                <span
                                    v-else-if="result.generationStatus === 'FAILED'"
                                    class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300 cursor-help"
                                    :title="result.generationError || 'Generation failed'"
                                >
                                    Generation failed
                                </span>
                                <span v-else class="text-neutral-500 text-xs">-</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        v-if="result.status !== 'APPROVED'"
                                        @click="approveResult(result)"
                                        title="Approve and generate a ContentMind draft (requires manual review before publishing)"
                                        class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                                        :disabled="processingResults.includes(result.id)"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        v-if="result.status !== 'REJECTED'"
                                        @click="rejectResult(result)"
                                        title="Reject"
                                        class="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                                        :disabled="processingResults.includes(result.id)"
                                    >
                                        Reject
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
            itemName="results"
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
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useFeedClient } from '@cmmv/rss-aggregation/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const feedClient = useFeedClient()

const results = ref([])
const keywordsMap = ref({})
const loading = ref(true)
const error = ref(null)
const processingResults = ref([])

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

const pagination = ref({
    current: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
    from: 1,
    to: 20
})

const filters = ref({
    status: 'PENDING',
    page: 1
})

const loadKeywords = async () => {
    try {
        const response = await feedClient.huntingKeywords.get({ limit: 1000 })
        const map = {}

        for (const keyword of (response?.data || []))
            map[keyword.id] = keyword.label || keyword.keyword

        keywordsMap.value = map
    } catch (err) {
        console.error('Failed to load hunting keywords:', err)
    }
}

const loadResults = async () => {
    try {
        loading.value = true
        error.value = null

        const apiFilters = {
            status: filters.value.status,
            limit: pagination.value.perPage,
            offset: (filters.value.page - 1) * pagination.value.perPage
        }

        const response = await feedClient.huntingResults.get(apiFilters)

        if (response && response.data) {
            results.value = response.data || []

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 20

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
            results.value = []
            pagination.value = {
                current: 1,
                lastPage: 1,
                perPage: 20,
                total: 0,
                from: 0,
                to: 0
            }
        }

        syncGenerationPolling()
        loading.value = false
    } catch (err) {
        console.error('Failed to load hunting results:', err)
        stopGenerationPolling()
        loading.value = false
        error.value = err.message || 'Failed to load hunting results'
        showNotification('error', 'Failed to load hunting results')
    }
}

const refreshData = () => {
    loadResults()
}

// ContentMind generation runs detached from the approve request (it takes
// minutes), so poll while any row is still being written.
const GENERATION_POLL_INTERVAL = 15000
let generationPollTimer = null

const stopGenerationPolling = () => {
    if (generationPollTimer) {
        clearInterval(generationPollTimer)
        generationPollTimer = null
    }
}

const syncGenerationPolling = () => {
    const hasPending = results.value.some(result => result.generationStatus === 'PENDING')

    if (hasPending && !generationPollTimer)
        generationPollTimer = setInterval(() => loadResults(), GENERATION_POLL_INTERVAL)
    else if (!hasPending)
        stopGenerationPolling()
}

const handlePageChange = (newPage) => {
    filters.value.page = newPage
}

watch(filters, () => {
    loadResults()
}, { deep: true })

const approveResult = async (result) => {
    if (processingResults.value.includes(result.id)) return

    try {
        processingResults.value.push(result.id)
        const response = await feedClient.huntingResults.approve(result.id)
        showNotification('success', response?.message || 'Result approved')
        refreshData()
    } catch (err) {
        console.error('Failed to approve result:', err)
        showNotification('error', err.message || 'Failed to approve result')
    } finally {
        processingResults.value = processingResults.value.filter(id => id !== result.id)
    }
}

const rejectResult = async (result) => {
    if (processingResults.value.includes(result.id)) return

    try {
        processingResults.value.push(result.id)
        await feedClient.huntingResults.reject(result.id)
        showNotification('success', 'Result rejected')
        refreshData()
    } catch (err) {
        console.error('Failed to reject result:', err)
        showNotification('error', err.message || 'Failed to reject result')
    } finally {
        processingResults.value = processingResults.value.filter(id => id !== result.id)
    }
}

const keywordName = (keyword) => {
    if (!keyword) return '-'

    if (typeof keyword === 'object')
        return keyword.label || keyword.keyword || '-'

    return keywordsMap.value[keyword] || '-'
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

const formatDate = (timestamp) => {
    if (!timestamp) return '-'

    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleString()
}

onMounted(async () => {
    await loadKeywords()
    await loadResults()
})

onUnmounted(() => {
    stopGenerationPolling()
})
</script>
