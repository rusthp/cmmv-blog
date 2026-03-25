<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Contacts</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="loadContacts" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>

        <!-- Status Tabs -->
        <div class="flex flex-wrap gap-2 mb-4">
            <button @click="setFilter('')" class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'">
                All
            </button>
            <button @click="setFilter('new')" class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="statusFilter === 'new' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'">
                New
            </button>
            <button @click="setFilter('read')" class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="statusFilter === 'read' ? 'bg-green-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'">
                Read
            </button>
            <button @click="setFilter('archived')" class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                :class="statusFilter === 'archived' ? 'bg-neutral-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'">
                Archived
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading contacts...</span>
        </div>

        <!-- Empty -->
        <div v-else-if="contacts.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p class="text-neutral-300 mb-2">No contacts found</p>
        </div>

        <!-- Table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Name / Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Subject</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-28">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="c in contacts" :key="c.id" class="hover:bg-neutral-750 cursor-pointer" @click="openDetail(c)">
                            <td class="px-6 py-4">
                                <div class="text-sm font-medium text-white">{{ c.name }}</div>
                                <div class="text-xs text-neutral-400">{{ c.email }}</div>
                            </td>
                            <td class="px-6 py-4 text-sm text-neutral-300">{{ truncate(c.subject, 50) }}</td>
                            <td class="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">{{ formatDate(c.createdAt) }}</td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium rounded-full" :class="statusClass(c.status)">
                                    {{ c.status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right" @click.stop>
                                <div class="flex justify-end space-x-2">
                                    <button v-if="c.status !== 'read'" @click="updateStatus(c, 'read')" title="Mark as read"
                                        class="text-neutral-400 hover:text-green-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button v-if="c.status !== 'archived'" @click="updateStatus(c, 'archived')" title="Archive"
                                        class="text-neutral-400 hover:text-yellow-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                    </button>
                                    <button @click="confirmDelete(c)" title="Delete"
                                        class="text-neutral-400 hover:text-red-500 transition-colors">
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
        <Pagination :pagination="pagination" itemName="contacts" @pageChange="handlePageChange" />

        <!-- Detail Modal -->
        <div v-if="selected" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" style="backdrop-filter:blur(4px)">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ selected.subject }}</h3>
                    <button @click="selected = null" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="text-neutral-400">Name</div>
                            <div class="text-white font-medium">{{ selected.name }}</div>
                        </div>
                        <div>
                            <div class="text-neutral-400">Email</div>
                            <a :href="`mailto:${selected.email}`" class="text-blue-400 hover:underline">{{ selected.email }}</a>
                        </div>
                        <div>
                            <div class="text-neutral-400">Date</div>
                            <div class="text-white">{{ formatDate(selected.createdAt) }}</div>
                        </div>
                        <div>
                            <div class="text-neutral-400">IP</div>
                            <div class="text-neutral-300">{{ selected.ip || '—' }}</div>
                        </div>
                    </div>
                    <div>
                        <div class="text-neutral-400 text-sm mb-1">Message</div>
                        <div class="bg-neutral-700 rounded p-4 text-white text-sm whitespace-pre-wrap">{{ selected.message }}</div>
                    </div>
                    <div class="flex justify-end space-x-3 pt-2">
                        <button v-if="selected.status !== 'read'" @click="updateStatus(selected, 'read'); selected = null"
                            class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors">
                            Mark as Read
                        </button>
                        <button v-if="selected.status !== 'archived'" @click="updateStatus(selected, 'archived'); selected = null"
                            class="px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm transition-colors">
                            Archive
                        </button>
                        <a :href="`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`"
                            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors">
                            Reply via Email
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :loading="deleteLoading"
            message="Delete this contact message?"
            warning-text="This action cannot be undone."
            loading-text="Deleting..."
            @confirm="deleteContact"
            @cancel="showDeleteDialog = false"
        />

        <ToastNotification :show="notification.show" :message="notification.message" :type="notification.type" @close="notification.show = false" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminClient } from '@cmmv/blog/admin/client'
import ToastNotification from '../components/ToastNotification.vue'
import Pagination from '../components/Pagination.vue'
import DeleteDialog from '../components/DeleteDialog.vue'

const adminClient = useAdminClient()

const contacts = ref([])
const loading = ref(true)
const statusFilter = ref('')
const selected = ref(null)
const showDeleteDialog = ref(false)
const deleteLoading = ref(false)
const contactToDelete = ref(null)
const notification = ref({ show: false, type: 'success', message: '' })

const pagination = ref({
    current: 1, lastPage: 1, perPage: 20, total: 0, from: 0, to: 0
})

const loadContacts = async () => {
    loading.value = true
    try {
        const filters = {
            limit: pagination.value.perPage,
            offset: (pagination.value.current - 1) * pagination.value.perPage,
        }
        if (statusFilter.value) filters.status = statusFilter.value

        const res = await adminClient.contact.get(filters)
        if (res?.data) {
            contacts.value = res.data
            const total = res.count || 0
            const limit = res.pagination?.limit || 20
            const offset = res.pagination?.offset || 0
            pagination.value = {
                current: Math.floor(offset / limit) + 1,
                lastPage: Math.ceil(total / limit) || 1,
                perPage: limit,
                total,
                from: total === 0 ? 0 : offset + 1,
                to: Math.min(offset + limit, total)
            }
        } else {
            contacts.value = []
        }
    } catch (e) {
        showNotif('error', 'Failed to load contacts')
    }
    loading.value = false
}

const setFilter = (s) => { statusFilter.value = s; pagination.value.current = 1; loadContacts() }
const handlePageChange = (p) => { pagination.value.current = p; loadContacts() }

const openDetail = (c) => {
    selected.value = c
    if (c.status === 'new') updateStatus(c, 'read')
}

const updateStatus = async (c, status) => {
    try {
        await adminClient.contact.updateStatus(c.id, status)
        c.status = status
    } catch (e) {
        showNotif('error', 'Failed to update status')
    }
}

const confirmDelete = (c) => { contactToDelete.value = c; showDeleteDialog.value = true }
const deleteContact = async () => {
    deleteLoading.value = true
    try {
        await adminClient.contact.delete(contactToDelete.value.id)
        contacts.value = contacts.value.filter(c => c.id !== contactToDelete.value.id)
        showNotif('success', 'Deleted successfully')
    } catch (e) {
        showNotif('error', 'Failed to delete')
    }
    deleteLoading.value = false
    showDeleteDialog.value = false
    contactToDelete.value = null
}

const formatDate = (ts) => {
    if (!ts) return '—'
    try { return new Date(ts).toLocaleString('pt-BR') } catch { return '—' }
}
const truncate = (t, n) => t?.length > n ? t.substring(0, n) + '...' : (t || '')
const statusClass = (s) => ({
    'new': 'bg-blue-900 text-blue-200',
    'read': 'bg-green-900 text-green-200',
    'archived': 'bg-neutral-700 text-neutral-300'
}[s] || 'bg-neutral-700 text-neutral-300')

const showNotif = (type, message) => {
    notification.value = { show: true, type, message }
    setTimeout(() => { notification.value.show = false }, 3000)
}

onMounted(loadContacts)
</script>
