<template>
  <div class="p-3 rounded-lg shadow-md text-white" :style="nodeStyle">
    <Handle id="source-right" type="source" :position="Position.Right" :style="{ top: '50%' }" />

    <!-- Edit Mode -->
    <div v-if="isEditing" class="space-y-2">
        <h4 class="font-bold text-center mb-3 border-b border-white/20 pb-2">Edit Channel</h4>
        <div class="space-y-3 px-1 text-xs">
            <div>
                <label class="font-medium text-neutral-300">Name</label>
                <input v-model="form.name" type="text" placeholder="Channel Name" class="nodrag w-full mt-1 px-2 py-1 bg-neutral-800 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>
            <div>
                <label class="font-medium text-neutral-300">Website URL</label>
                <input v-model="form.url" type="url" placeholder="https://example.com" class="nodrag w-full mt-1 px-2 py-1 bg-neutral-800 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>
            <div>
                <label class="font-medium text-neutral-300">RSS Feed URL</label>
                <input v-model="form.rss" type="url" placeholder="https://example.com/feed" class="nodrag w-full mt-1 px-2 py-1 bg-neutral-800 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>
            <div>
                <label class="font-medium text-neutral-300">Update Interval (hours)</label>
                <input v-model.number="form.intervalHours" type="number" min="1" class="nodrag w-full mt-1 px-2 py-1 bg-neutral-800 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>
            <div class="flex justify-between pt-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" v-model="form.active" class="nodrag h-4 w-4 text-blue-500 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500">
                    <span>Active</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" v-model="form.requestLink" class="nodrag h-4 w-4 text-blue-500 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500">
                    <span>Request Link</span>
                </label>
            </div>
        </div>
        <div class="mt-4 pt-2 border-t border-white/20 flex justify-end space-x-2">
            <button @click="onCancel" class="px-3 py-1 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-xs">Cancel</button>
            <button @click="onSave" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs">Save</button>
        </div>
    </div>

    <!-- Display Mode -->
    <div v-else>
        <div class="font-bold text-sm">{{ data.name }}</div>
        <div class="text-xs text-neutral-300 mt-1 truncate" :title="data.url">
            {{ data.url }}
        </div>

        <div class="mt-3 text-xs flex items-center justify-between text-neutral-300 space-x-3">
             <div class="flex items-center" :title="data.active ? 'Channel is active' : 'Channel is inactive'">
                <span class="h-2 w-2 rounded-full mr-1.5" :class="data.active ? 'bg-green-400' : 'bg-red-400'"></span>
                <span>{{ data.active ? 'Active' : 'Inactive' }}</span>
            </div>
            <div class="flex items-center" title="Update Interval">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{{ intervalText }}</span>
            </div>
            <div v-if="data.requestLink" class="flex items-center" title="Requests original link">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
        </div>

        <div class="mt-3 pt-2 border-t border-white/20 flex justify-end items-center">
            <div class="flex space-x-1">
                <button @click.stop="onExecute" title="Execute Channel" class="text-white hover:text-green-300 transition-colors p-1 rounded-full hover:bg-white/10">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button @click.stop="onViewRaws" title="View Raws" class="text-white hover:text-blue-300 transition-colors p-1 rounded-full hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
                 <button @click.stop="onEdit" title="Edit Channel" class="text-white hover:text-yellow-300 transition-colors p-1 rounded-full hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['view-raws', 'execute', 'update'])

const isEditing = ref(false)
const form = ref({})

const msToHours = (ms) => ms ? Math.floor(ms / (3600 * 1000)) : 24

const resetForm = () => {
  form.value = {
    name: props.data.name || '',
    url: props.data.url || '',
    rss: props.data.rss || '',
    intervalHours: msToHours(props.data.intervalUpdate),
    active: props.data.active === undefined ? true : props.data.active,
    requestLink: props.data.requestLink === undefined ? false : props.data.requestLink,
  }
}

watch(() => props.data, resetForm, { deep: true, immediate: true })

const onEdit = () => {
  isEditing.value = true
}

const onCancel = () => {
  isEditing.value = false
  resetForm()
}

const onSave = () => {
  const payload = {
    ...props.data,
    name: form.value.name,
    url: form.value.url,
    rss: form.value.rss,
    active: form.value.active,
    requestLink: form.value.requestLink,
    intervalUpdate: form.value.intervalHours * 3600 * 1000
  }
  emit('update', payload)
  isEditing.value = false
}

const onViewRaws = () => {
  emit('view-raws', { type: 'channel', data: props.data })
}

const onExecute = () => {
    emit('execute', { type: 'channel', data: props.data })
}

const nodeStyle = computed(() => ({
  backgroundColor: props.data.active ? 'rgba(39, 100, 204, 0.7)' : 'rgba(80, 80, 80, 0.7)',
  borderColor: props.data.active ? '#2764cc' : '#505050',
  borderWidth: '1px',
  width: isEditing.value ? '320px' : '280px',
}))

const intervalText = computed(() => {
    const hours = msToHours(props.data.intervalUpdate)
    return `${hours}h`
})
</script> 