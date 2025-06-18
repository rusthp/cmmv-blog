<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">API Settings</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add API Config
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading settings...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load settings</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="loadSettings" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="settings.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <p class="text-neutral-300 mb-2">No API configurations found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by adding your first API configuration</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add API Config
            </button>
        </div>

        <!-- Settings table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Name
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Base URL
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Auth Type
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="setting in settings" :key="setting.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                {{ setting.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">
                                {{ setting.baseUrl }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getAuthTypeClass(setting.authType)">
                                    {{ setting.authType }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button @click="openEditDialog(setting)" title="Edit" class="text-neutral-400 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button @click="confirmDelete(setting)" title="Delete" class="text-neutral-400 hover:text-red-500 transition-colors">
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

        <!-- Add/Edit Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit API Config' : 'Add API Config' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="p-6 max-h-[70vh] overflow-y-auto">
                    <form @submit.prevent="saveSetting">
                        <div class="space-y-4">
                            <!-- Name -->
                            <div>
                                <label for="settingName" class="block text-sm font-medium text-neutral-300 mb-1">Configuration Name</label>
                                <input id="settingName" v-model="settingForm.name" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. API-Football" required />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <!-- Auth Type -->
                            <div>
                                <label for="authType" class="block text-sm font-medium text-neutral-300 mb-1">Authentication Type</label>
                                <select id="authType" v-model="settingForm.authType" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option>API Key</option>
                                    <option>Bearer Token</option>
                                    <option>Basic Auth</option>
                                </select>
                                <p v-if="formErrors.authType" class="mt-1 text-sm text-red-500">{{ formErrors.authType }}</p>
                            </div>

                            <!-- Base URL -->
                            <div>
                                <label for="baseUrl" class="block text-sm font-medium text-neutral-300 mb-1">Base URL</label>
                                <input id="baseUrl" v-model="settingForm.baseUrl" type="url" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="https://api.example.com/v1" required />
                                <p v-if="formErrors.baseUrl" class="mt-1 text-sm text-red-500">{{ formErrors.baseUrl }}</p>
                            </div>

                            <!-- API Key / Token -->
                            <div v-if="settingForm.authType === 'API Key' || settingForm.authType === 'Bearer Token'">
                                <label for="apiKey" class="block text-sm font-medium text-neutral-300 mb-1">{{ settingForm.authType }}</label>
                                <div class="relative">
                                    <input id="apiKey" v-model="settingForm.apiKey" :type="apiKeyVisible ? 'text' : 'password'" class="w-full pl-3 pr-10 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Your secret key" />
                                    <button type="button" @click="apiKeyVisible = !apiKeyVisible" class="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-400 hover:text-white">
                                        <svg v-if="apiKeyVisible" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.127 2.452.364m-6.024 4.458A3 3 0 1012.6 15.05M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 2l20 20" /></svg>
                                    </button>
                                </div>
                                <p v-if="formErrors.apiKey" class="mt-1 text-sm text-red-500">{{ formErrors.apiKey }}</p>
                            </div>

                            <!-- Basic Auth -->
                            <div v-if="settingForm.authType === 'Basic Auth'" class="space-y-4">
                                <div>
                                    <label for="username" class="block text-sm font-medium text-neutral-300 mb-1">Username</label>
                                    <input id="username" v-model="settingForm.username" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Your username" />
                                    <p v-if="formErrors.username" class="mt-1 text-sm text-red-500">{{ formErrors.username }}</p>
                                </div>
                                <div>
                                    <label for="password" class="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                                    <div class="relative">
                                        <input id="password" v-model="settingForm.password" :type="apiKeyVisible ? 'text' : 'password'" class="w-full pl-3 pr-10 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Your password" />
                                         <button type="button" @click="apiKeyVisible = !apiKeyVisible" class="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-400 hover:text-white">
                                            <svg v-if="apiKeyVisible" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.127 2.452.364m-6.024 4.458A3 3 0 1012.6 15.05M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 2l20 20" /></svg>
                                        </button>
                                    </div>
                                    <p v-if="formErrors.password" class="mt-1 text-sm text-red-500">{{ formErrors.password }}</p>
                                </div>
                            </div>

                            <!-- Headers -->
                            <div>
                                <label for="headers" class="block text-sm font-medium text-neutral-300 mb-1">Headers (JSON format)</label>
                                <textarea id="headers" v-model="settingForm.headers" rows="5" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder='{\n  "x-rapidapi-key": "{{apiKey}}",\n  "x-rapidapi-host": "v3.football.api-sports.io"\n}'></textarea>
                                <p class="mt-1 text-sm text-neutral-500">Use <code v-pre class="bg-neutral-900 px-1 rounded text-xs">{{apiKey}}</code> to reference the key/token above.</p>
                                <p v-if="formErrors.headers" class="mt-1 text-sm text-red-500">{{ formErrors.headers }}</p>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" @click="closeDialog" class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors" :disabled="formLoading">
                                <span v-if="formLoading" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </span>
                                <span v-else>{{ isEditing ? 'Update' : 'Create' }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog :show="showDeleteDialog" :item-name="settingToDelete?.name" :loading="deleteLoading" message="Are you sure you want to delete this API configuration?" warning-text="This action cannot be undone." loading-text="Deleting..." @confirm="deleteSetting" @cancel="closeDeleteDialog" />
        <!-- Toast notifications -->
        <ToastNotification :show="notification.show" :message="notification.message" :type="notification.type" :duration="notification.duration" @close="notification.show = false" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useOddsClient } from '../client'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const oddsClient = useOddsClient()

const settings = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const settingForm = ref({
    name: '',
    authType: 'API Key',
    baseUrl: '',
    apiKey: '',
    headers: '',
    username: '',
    password: ''
})
const settingToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)
const apiKeyVisible = ref(false)

const showDeleteDialog = ref(false)
const settingToDelete = ref(null)
const deleteLoading = ref(false)

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

const loadSettings = async () => {
    try {
        loading.value = true
        error.value = null
        const response = await oddsClient.settings.get({})
        if (response && response.data) {
            settings.value = response.data
        } else {
            settings.value = []
        }
    } catch (err) {
        console.error('Failed to load settings:', err)
        error.value = err.message || 'An unknown error occurred'
        showNotification('error', 'Failed to load settings.')
    } finally {
        loading.value = false
    }
}

const openAddDialog = () => {
    isEditing.value = false
    settingForm.value = {
        name: '',
        authType: 'API Key',
        baseUrl: '',
        apiKey: '',
        headers: '',
        username: '',
        password: ''
    }
    formErrors.value = {}
    apiKeyVisible.value = false
    showDialog.value = true
}

const openEditDialog = (setting) => {
    isEditing.value = true
    settingToEdit.value = setting
    settingForm.value = { ...setting }
    formErrors.value = {}
    apiKeyVisible.value = false
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    settingToEdit.value = null
}

const saveSetting = async () => {
    formLoading.value = true
    formErrors.value = {}

    // Basic validation
    if (!settingForm.value.name.trim()) formErrors.value.name = 'Name is required.';
    if (!settingForm.value.baseUrl.trim()) formErrors.value.baseUrl = 'Base URL is required.';
    
    // JSON validation for headers
    if (settingForm.value.headers.trim()) {
        try {
            JSON.parse(settingForm.value.headers);
        } catch (e) {
            formErrors.value.headers = 'Headers must be valid JSON.';
        }
    }

    if (Object.keys(formErrors.value).length > 0) {
        formLoading.value = false
        return
    }

    try {
        const payload = { ...settingForm.value }

        if (payload.authType === 'Basic Auth') {
            payload.apiKey = null;
        } else {
            payload.username = null;
            payload.password = null;
        }

        if (isEditing.value) {
            await oddsClient.settings.update(settingToEdit.value.id, payload)
            showNotification('success', 'Configuration updated successfully!')
        } else {
            await oddsClient.settings.insert(payload)
            showNotification('success', 'Configuration added successfully!')
        }
        closeDialog()
        loadSettings()
    } catch (err) {
        console.error('Failed to save setting:', err)
        if (err.response?.data?.errors) {
            formErrors.value = err.response.data.errors
        } else {
            showNotification('error', err.message || 'Failed to save configuration.')
        }
    } finally {
        formLoading.value = false
    }
}

const confirmDelete = (setting) => {
    settingToDelete.value = setting
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    settingToDelete.value = null
}

const deleteSetting = async () => {
    if (!settingToDelete.value) return
    deleteLoading.value = true
    try {
        await oddsClient.settings.delete(settingToDelete.value.id)
        showNotification('success', 'Configuration deleted successfully.')
        closeDeleteDialog()
        loadSettings()
    } catch (err) {
        console.error('Failed to delete setting:', err)
        showNotification('error', err.message || 'Failed to delete configuration.')
    } finally {
        deleteLoading.value = false
    }
}

const showNotification = (type, message) => {
    notification.value = { show: true, type, message, duration: 3000 }
}

const getAuthTypeClass = (authType) => {
    switch (authType) {
        case 'API Key': return 'bg-blue-500/20 text-blue-300';
        case 'Bearer Token': return 'bg-purple-500/20 text-purple-300';
        case 'Basic Auth': return 'bg-yellow-500/20 text-yellow-300';
        default: return 'bg-neutral-500/20 text-neutral-300';
    }
}

onMounted(loadSettings)
</script>