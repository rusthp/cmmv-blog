<template>
    <div class="min-h-screen bg-neutral-900 flex">
        <aside
            class="fixed h-full z-30 transition-all duration-300 ease-in-out bg-neutral-900 border-r border-neutral-800 shadow-md"
            :class="{ 'w-20': isCollapsed, 'w-50': !isCollapsed, '-translate-x-full md:translate-x-0': isMobileMenuHidden }">
            <div class="flex items-center h-16 px-4 border-b border-neutral-800">
                <div class="flex items-center">
                    <div class="relative" ref="whitelabelDropdownRef">
                        <button @click="toggleWhitelabelDropdown" class="flex items-center space-x-2 text-neutral-300 hover:text-white px-2 py-1 rounded">
                            <img
                                v-if="currentWhitelabel?.faviconUrl"
                                :src="currentWhitelabel.faviconUrl"
                                alt="Favicon"
                                class="h-5 w-5 mr-2 object-contain"
                                @error="handleFaviconError"
                            />
                            <div v-else class="h-5 w-5 mr-2 flex items-center justify-center bg-neutral-700 rounded-full overflow-hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                            <span v-if="currentWhitelabel" class="text-sm truncate max-w-32">{{ currentWhitelabel.name }}</span>
                            <span v-else class="text-sm truncate max-w-32">Select Domain</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <!-- Dropdown menu -->
                        <div v-if="whitelabelDropdownOpen" class="absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-neutral-800 ring-1 ring-black ring-opacity-5 z-50">
                            <div class="py-1" role="menu" aria-orientation="vertical">
                                <div v-if="loadingWhitelabels" class="px-4 py-2 text-sm text-neutral-400">
                                    Loading...
                                </div>
                                <div v-else-if="whitelabels.length === 0" class="px-4 py-2 text-sm text-neutral-400">
                                    No domains found
                                </div>
                                <template v-else>
                                    <a
                                        v-for="whitelabel in whitelabels"
                                        :key="whitelabel.id"
                                        href="#"
                                        @click.prevent="switchWhitelabel(whitelabel)"
                                        class="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white flex items-center"
                                        :class="{'bg-neutral-700': currentWhitelabel && currentWhitelabel.id === whitelabel.id}"
                                    >
                                        <img
                                            v-if="whitelabel.faviconUrl"
                                            :src="whitelabel.faviconUrl"
                                            alt="Favicon"
                                            class="h-4 w-4 mr-2 object-contain"
                                            @error="handleFaviconError"
                                        />
                                        <div v-else class="h-4 w-4 mr-2"></div>
                                        <div>
                                            {{ whitelabel.name }}
                                        </div>
                                    </a>
                                </template>
                                <div class="border-t border-neutral-700 mt-1 pt-1">
                                    <router-link to="/whitelabel" class="block px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-700 hover:text-white">
                                        Manage Domains
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="h-[calc(100%-144px)] py-4 overflow-y-auto">
                <nav class="space-y-1 px-2">
                    <template v-for="(items, groupName) in navbarItems" :key="groupName">
                        <div
                            v-if="!isCollapsed && groupName !== 'ungrouped'"
                            @click="toggleGroup(groupName)"
                            class="pt-3 pb-1 flex items-center justify-between cursor-pointer group">
                            <p class="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ groupName }}</p>
                            <div class="px-2 text-neutral-500 group-hover:text-neutral-400" v-if="!isCollapsed">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200"
                                    :class="{'rotate-180': !isGroupCollapsed(groupName)}"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div v-if="!isGroupCollapsed(groupName) || isCollapsed || groupName === 'ungrouped'">
                            <router-link
                                v-for="item in items"
                                :key="item.to"
                                :to="item.to"
                                class="flex items-center px-4 py-1.5 text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-md group transition-all duration-200 text-sm"
                                :class="{ 'justify-center': isCollapsed }"
                                :title="isCollapsed ? item.label : ''"
                            >
                                <!-- FontAwesome Icon -->
                                <i v-if="typeof item.icon === 'string' && item.icon.includes('fa-')"
                                   :class="[item.icon, 'h-5 w-5 text-neutral-400 group-hover:text-white flex-shrink-0 flex items-center justify-center']"
                                   style="min-width: 1.25rem; display: inline-flex;"></i>

                                <!-- SVG Icon (Legacy support) -->
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-neutral-400 group-hover:text-white"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path v-if="typeof item.icon === 'string'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                                    <path v-else v-for="icon in item.icon" :key="icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
                                </svg>

                                <span class="ml-3 transition-opacity duration-200 text-xs"
                                    :class="isCollapsed ? 'opacity-0 absolute' : 'opacity-100'">{{ item.label }}</span>
                            </router-link>
                        </div>
                    </template>
                </nav>
            </div>

            <div class="absolute bottom-0 left-0 right-0 border-t border-neutral-800 p-4 bg-neutral-800 transition-all duration-300">
                <div class="flex items-center" :class="{ 'justify-center': isCollapsed }">
                    <div v-if="user" class="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden bg-blue-600 text-white">
                        <img
                            v-if="userAvatar"
                            :src="userAvatar"
                            :alt="userDisplayName"
                            class="h-full w-full object-cover"
                        />
                        <span v-else class="text-sm font-medium">{{ userInitials }}</span>
                    </div>
                    <div v-else class="h-8 w-8 rounded-full bg-neutral-600"></div>

                    <div class="ml-3 transition-opacity duration-200"
                        :class="isCollapsed ? 'opacity-0 absolute' : 'opacity-100'">
                        <p class="text-sm font-medium text-neutral-200">{{ userDisplayName }}</p>
                        <div class="flex items-center gap-2 text-xs text-neutral-400">
                            <p class="text-xs text-neutral-400"><router-link to="/profile">View Profile</router-link></p> -
                            <p class="text-xs text-neutral-400"><a href="#" @click="logout">Logout</a></p>
                        </div>

                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col transition-all duration-300 overflow-hidden"
            :class="{ 'md:ml-20': isCollapsed, 'md:ml-50': !isCollapsed }">
            <div class="lg:hidden absolute top-4 left-4 z-50">
                <button @click="toggleMobileMenu"
                    class="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <main class="flex-1 bg-neutral-900 p-4 overflow-y-auto">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'
import { useAdminClient } from '../client';
import { useNavbar } from '../composable/useNavbar';

const api = useAdminClient()
api.session.check();

const route = useRoute()
const isCollapsed = ref(false)
const isMobileMenuHidden = ref(true)
const user = ref(null)
const navbarStore = useNavbar()
const navbarItems = ref(navbarStore.getItems())
const collapsedGroups = ref({})

const whitelabels = ref([])
const loadingWhitelabels = ref(true)
const currentWhitelabel = ref(null)
const whitelabelDropdownOpen = ref(false)
const whitelabelDropdownRef = ref(null)

const userDisplayName = computed(() => {
    if (!user.value) return 'Loading...'

    if (user.value.profile && user.value.profile.name)
        return user.value.profile.name

    const email = user.value.email || ''
    return email.length > 10 ? `${email.substring(0, 10)}...` : email
})

const userInitials = computed(() => {
    if (!user.value) return '?'

    if (user.value.profile && user.value.profile.name)
        return user.value.profile.name.substring(0, 1).toUpperCase()

    return user.value.email ? user.value.email.substring(0, 1).toUpperCase() : '?'
})

const userAvatar = computed(() => {
    if (user.value && user.value.profile && user.value.profile.image)
        return user.value.profile.image

    return null
})

const refreshUserProfile = async () => {
    try {
        user.value = await api.profile.get()
    } catch (error) {
        console.error('Failed to refresh user profile:', error)
    }
}

function toggleMobileMenu() {
    isMobileMenuHidden.value = !isMobileMenuHidden.value
}

function toggleGroup(groupName) {
    collapsedGroups.value[groupName] = !isGroupCollapsed(groupName)
    saveCollapsedGroupsState()
}

function isGroupCollapsed(groupName) {
    return collapsedGroups.value[groupName] === true
}

function saveCollapsedGroupsState() {
    localStorage.setItem('collapsedGroups', JSON.stringify(collapsedGroups.value))
}

function loadCollapsedGroupsState() {
    const savedState = localStorage.getItem('collapsedGroups')
    if (savedState) {
        try {
            collapsedGroups.value = JSON.parse(savedState)
        } catch (error) {
            console.error('Failed to parse collapsed groups state:', error)
            collapsedGroups.value = {}
        }
    }
}

const updateNavbarItems = () => {
    navbarItems.value = useNavbar().getItems()
}

const loadWhitelabels = async () => {
    try {
        loadingWhitelabels.value = true
        const response = await api.whitelabel.getAccess();
        whitelabels.value = response?.data || []
        const savedWhitelabelId = localStorage.getItem('currentWhitelabelId')

        if (savedWhitelabelId) {
            const found = whitelabels.value.find(w => w.id === savedWhitelabelId);

            if (found)
                currentWhitelabel.value = found
            else if (whitelabels.value.length > 0)
                currentWhitelabel.value = whitelabels.value[0]
        } else if (whitelabels.value.length > 0) {
            currentWhitelabel.value = whitelabels.value[0]
        }
    } catch (err) {
        console.error('Failed to load whitelabel domains:', err)
    } finally {
        loadingWhitelabels.value = false
    }
}

const toggleWhitelabelDropdown = () => {
    whitelabelDropdownOpen.value = !whitelabelDropdownOpen.value
}

const switchWhitelabel = (whitelabel) => {
    currentWhitelabel.value = whitelabel
    localStorage.setItem('currentWhitelabelId', whitelabel.id)
    whitelabelDropdownOpen.value = false
    window.location = window.location.href
}

const handleClickOutside = (event) => {
    if (whitelabelDropdownRef.value && !whitelabelDropdownRef.value.contains(event.target)) {
        whitelabelDropdownOpen.value = false
    }
}

const handleFaviconError = (event) => {
    event.target.style.display = 'none'
}

const logout = () => {
    api.session.logout()
    window.location = window.location.href
}

onMounted(async () => {
    const savedPreference = localStorage.getItem('sidebarCollapsed')
    updateNavbarItems()
    loadCollapsedGroupsState()

    if (savedPreference !== null)
        isCollapsed.value = savedPreference === 'true'

    try {
        user.value = await api.profile.get()

        watch(() => route.path, (newPath, oldPath) => {
            if (oldPath.includes('/profile'))
                refreshUserProfile()
        })
    } catch (error) {
        console.error('Failed to load user profile:', error)
    }

    loadWhitelabels()
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>
