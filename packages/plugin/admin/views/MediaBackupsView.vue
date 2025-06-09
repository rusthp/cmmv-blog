<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold text-white">Media Backups</h1>
                <p class="text-neutral-400 text-sm mt-1">
                    Manage backups created before media deletions
                </p>
            </div>
            <button
                @click="refreshBackups"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 text-white rounded-md transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
            </button>
        </div>

        <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-neutral-400">Loading backups...</p>
        </div>

        <div v-else-if="error" class="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-red-300">{{ error }}</span>
            </div>
        </div>

        <div v-else-if="backups.length === 0" class="text-center py-12 bg-neutral-800 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M7 7h10" />
            </svg>
            <h3 class="text-lg font-medium text-white mb-2">No Backups Found</h3>
            <p class="text-neutral-400">
                No media backups have been created yet.<br>
                Backups are automatically created when you delete media with backup option enabled.
            </p>
        </div>

        <div v-else class="bg-neutral-800 rounded-lg shadow">
            <div class="px-6 py-4 border-b border-neutral-700">
                <h2 class="text-lg font-medium text-white">Available Backups</h2>
                <p class="text-neutral-400 text-sm mt-1">{{ backups.length }} backup(s) found</p>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-900/50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Backup
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Created
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Size
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-700">
                        <tr v-for="backup in backups" :key="backup.filename" class="hover:bg-neutral-700/30">
                            <td class="px-6 py-4">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M7 7h10" />
                                    </svg>
                                    <div>
                                        <div class="text-sm font-medium text-white">{{ backup.filename }}</div>
                                        <div class="text-xs text-neutral-400">Media Backup</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-sm text-neutral-300">
                                {{ formatDate(backup.created) }}
                            </td>
                            <td class="px-6 py-4 text-sm text-neutral-300">
                                {{ backup.formattedSize }}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex items-center justify-end space-x-2">
                                    <button
                                        @click="downloadBackup(backup.filename)"
                                        title="Download backup"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="openRollbackDialog(backup)"
                                        title="Rollback backup"
                                        class="text-neutral-400 hover:text-green-500 transition-colors p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Rollback Confirmation Dialog -->
        <div v-if="showRollbackDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Rollback Media Backup</h3>
                </div>
                <div class="p-6">
                    <div v-if="!rollbackLoading && !rollbackResult">
                        <div class="bg-yellow-600/20 border border-yellow-600/50 rounded-md p-4 mb-4">
                            <div class="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h4 class="text-yellow-200 font-medium mb-1">Rollback Operation</h4>
                                    <p class="text-yellow-300 text-sm">
                                        This will restore media from the backup: <strong>{{ selectedBackup?.filename }}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-neutral-700 rounded-lg p-4 mb-4">
                            <h5 class="text-white font-medium mb-3">What will be done:</h5>
                            <ul class="text-neutral-300 text-sm space-y-2">
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Extract backup file and validate its contents
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Restore image files (upload to cloud storage if configured, otherwise save locally)
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Restore database records for media that don't exist anymore
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-400 mr-2">•</span>
                                    Skip media that already exist in the database
                                </li>
                            </ul>
                        </div>

                        <div class="flex justify-end space-x-3">
                            <button @click="showRollbackDialog = false"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">
                                Cancel
                            </button>
                            <button @click="executeRollback"
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                                Start Rollback
                            </button>
                        </div>
                    </div>

                    <div v-else-if="rollbackLoading">
                        <div class="text-center py-8">
                            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p class="text-white mb-2">Processing rollback...</p>
                            <p class="text-neutral-400 text-sm">Restoring media files and database records...</p>
                        </div>
                    </div>

                    <div v-else-if="rollbackResult">
                        <div class="space-y-4">
                            <div class="text-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 class="text-lg font-medium text-white">Rollback Completed</h4>
                            </div>

                            <div class="bg-neutral-700 rounded-lg p-4">
                                <h5 class="text-white font-medium mb-3">Rollback Summary:</h5>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-neutral-400">Records restored:</span>
                                        <span class="text-green-400 ml-2">{{ rollbackResult.restoredRecords }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Files restored:</span>
                                        <span class="text-green-400 ml-2">{{ rollbackResult.restoredFiles }}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400">Uploaded to cloud:</span>
                                        <span class="text-blue-400 ml-2">{{ rollbackResult.uploadedToCloud }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-green-600/20 border border-green-600/50 rounded-lg p-4">
                                <p class="text-green-300 text-sm">
                                    {{ rollbackResult.message }}
                                </p>
                            </div>

                            <div class="flex justify-end">
                                <button @click="closeRollbackDialog"
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

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
import { ref, onMounted } from 'vue'
import { useAdminClient } from '@cmmv/blog/admin/client'
import ToastNotification from '../components/ToastNotification.vue'

const adminClient = useAdminClient()

const backups = ref([])
const loading = ref(true)
const error = ref(null)

const showRollbackDialog = ref(false)
const rollbackLoading = ref(false)
const rollbackResult = ref(null)
const selectedBackup = ref(null)

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

function showNotification(type, message, duration = 3000) {
    notification.value = {
        show: true,
        type,
        message,
        duration
    }
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
}

async function loadBackups() {
    try {
        loading.value = true
        error.value = null
        
        const response = await adminClient.backup.getMediaBackups()
        
        if (response && response.data) {
            backups.value = response.data
        } else {
            backups.value = []
        }
    } catch (err) {
        console.error('Failed to load backups:', err)
        error.value = err.message || 'Failed to load backups'
        showNotification('error', 'Failed to load backups')
    } finally {
        loading.value = false
    }
}

async function refreshBackups() {
    await loadBackups()
    showNotification('success', 'Backups refreshed')
}

function downloadBackup(filename) {
    try {
        const url = `/api/blog/backup/download?filename=${encodeURIComponent(filename)}`
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        showNotification('success', 'Download started')
    } catch (err) {
        console.error('Failed to download backup:', err)
        showNotification('error', 'Failed to start download')
    }
}

function openRollbackDialog(backup) {
    selectedBackup.value = backup
    rollbackResult.value = null
    showRollbackDialog.value = true
}

async function executeRollback() {
    if (!selectedBackup.value) return

    try {
        rollbackLoading.value = true
        
        const response = await adminClient.backup.rollbackMediaBackup(selectedBackup.value.filename)
        
        if (response && response.success) {
            rollbackResult.value = response
            showNotification('success', 'Rollback completed successfully')
        } else {
            throw new Error(response?.message || 'Rollback failed')
        }
    } catch (err) {
        console.error('Failed to rollback backup:', err)
        showNotification('error', err.message || 'Failed to rollback backup')
        rollbackResult.value = {
            success: false,
            message: err.message || 'Rollback failed',
            restoredRecords: 0,
            restoredFiles: 0,
            uploadedToCloud: 0
        }
    } finally {
        rollbackLoading.value = false
    }
}

function closeRollbackDialog() {
    showRollbackDialog.value = false
    rollbackResult.value = null
    rollbackLoading.value = false
    selectedBackup.value = null
}

onMounted(() => {
    loadBackups()
})
</script> 