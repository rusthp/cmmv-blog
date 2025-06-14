<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Deeplink Generator</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column - Form -->
            <div class="bg-neutral-800 rounded-lg p-6">
                <h2 class="text-lg font-medium text-white mb-4">Deeplink Parameters</h2>

                <!-- Loading state -->
                <div v-if="loading" class="flex items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    <span class="ml-3 text-neutral-400">Loading...</span>
                </div>

                <!-- Error state -->
                <div v-else-if="error" class="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-200 mb-4">
                    <p class="font-medium">Error loading data</p>
                    <p class="text-sm">{{ error }}</p>
                    <button @click="refreshData" class="mt-2 px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs">
                        Try Again
                    </button>
                </div>

                <!-- Form -->
                <form v-else @submit.prevent="generateDeeplink" class="space-y-4">
                    <div>
                        <label for="account" class="block text-sm font-medium text-neutral-300 mb-1">Select Account</label>
                        <div class="relative">
                            <input
                                id="account"
                                v-model="accountSearch"
                                type="text"
                                placeholder="Search account..."
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                @focus="showAccountDropdown = true"
                                @input="showAccountDropdown = true"
                            />
                            <div
                                v-if="showAccountDropdown && filteredAccounts.length > 0"
                                class="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            >
                                <div
                                    v-for="account in filteredAccounts"
                                    :key="account.id"
                                    @click="selectAccount(account)"
                                    class="px-3 py-2 cursor-pointer hover:bg-neutral-700 border-b border-neutral-700 last:border-b-0 text-white"
                                >
                                    {{ account.label }}
                                </div>
                            </div>
                            <div v-if="selectedAccount" class="mt-2 px-3 py-2 bg-neutral-750 rounded-md">
                                <div class="flex justify-between items-center">
                                    <span class="text-white">{{ selectedAccount.label }}</span>
                                    <button
                                        @click="clearSelectedAccount"
                                        class="text-neutral-400 hover:text-white"
                                        title="Clear selection"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label for="networkCampaign" class="block text-sm font-medium text-neutral-300 mb-1">Network Campaign</label>
                        <div v-if="loadingNetworkCampaigns" class="flex items-center py-2">
                            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            <span class="ml-2 text-neutral-400 text-sm">Loading campaigns...</span>
                        </div>
                        <div v-else-if="!selectedAccount" class="py-2 text-sm text-neutral-400">
                            Please select an account first
                        </div>
                        <div v-else-if="networkCampaigns.length === 0" class="py-2 text-sm text-yellow-500">
                            No campaigns available for this account
                        </div>
                        <div v-else class="relative">
                            <input
                                id="networkCampaign"
                                v-model="campaignSearch"
                                type="text"
                                placeholder="Search campaign..."
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                @focus="showCampaignDropdown = true"
                                @input="showCampaignDropdown = true"
                            />
                            <div
                                v-if="showCampaignDropdown && filteredCampaigns.length > 0"
                                class="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            >
                                <div
                                    v-for="campaign in filteredCampaigns"
                                    :key="campaign.id"
                                    @click="selectCampaign(campaign)"
                                    class="px-3 py-2 cursor-pointer hover:bg-neutral-700 border-b border-neutral-700 last:border-b-0 text-white"
                                >
                                    {{ campaign.name }}
                                </div>
                            </div>
                            <div v-if="selectedNetworkCampaign" class="mt-2 px-3 py-2 bg-neutral-750 rounded-md">
                                <div class="flex justify-between items-center">
                                    <span class="text-white">{{ selectedNetworkCampaign.name }}</span>
                                    <button
                                        @click="clearSelectedCampaign"
                                        class="text-neutral-400 hover:text-white"
                                        title="Clear selection"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label for="originalUrl" class="block text-sm font-medium text-neutral-300 mb-1">Original URL</label>
                        <input
                            id="originalUrl"
                            v-model="originalUrl"
                            type="url"
                            placeholder="https://example.com/product"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            @input="findCampaignByDomain"
                            required
                        />
                        <p v-if="matchingCampaignFound" class="mt-1 text-sm text-green-500">
                            Matching campaign found: {{ matchingCampaign.name }}
                        </p>
                    </div>

                    <div class="pt-4">
                        <button
                            type="submit"
                            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            :disabled="!canGenerate || generatingDeeplink"
                        >
                            <span v-if="generatingDeeplink" class="flex items-center justify-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </span>
                            <span v-else>Generate Deeplink</span>
                        </button>
                    </div>
                </form>
            </div>

            <div class="bg-neutral-800 rounded-lg p-6">
                <h2 class="text-lg font-medium text-white mb-4">Generated Deeplink</h2>

                <div v-if="!generatedDeeplink" class="bg-neutral-700 rounded-lg p-8 flex flex-col items-center justify-center h-64 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <p class="text-neutral-400">Your generated deeplink will appear here</p>
                    <p class="text-neutral-500 text-sm mt-2">Fill out the form and click "Generate Deeplink"</p>
                </div>

                <div v-else class="space-y-4">
                    <div class="relative">
                        <textarea
                            ref="deeplinkTextarea"
                            v-model="generatedDeeplink"
                            rows="6"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            readonly
                        ></textarea>
                        <button
                            @click="copyToClipboard"
                            class="absolute top-2 right-2 p-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white"
                            title="Copy to clipboard"
                        >
                            <svg v-if="copied" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                        </button>
                    </div>

                    <div class="bg-neutral-700 rounded-lg p-4">
                        <h3 class="text-sm font-medium text-white mb-2">Deeplink Information</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-neutral-400">Account:</span>
                                <span class="text-white">{{ deeplinkInfo.accountName }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-neutral-400">Campaign:</span>
                                <span class="text-white">{{ deeplinkInfo.campaignName }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-neutral-400">Original URL:</span>
                                <a :href="deeplinkInfo.originalUrl" target="_blank" class="text-blue-400 hover:text-blue-300 truncate max-w-[200px]">
                                    {{ deeplinkInfo.originalUrl }}
                                </a>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-neutral-400">Generated:</span>
                                <span class="text-white">{{ deeplinkInfo.timestamp }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="pt-2">
                        <a
                            :href="generatedDeeplink"
                            target="_blank"
                            class="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-center rounded-md transition-colors"
                        >
                            Test Deeplink
                        </a>
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
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useAffiliateClient } from '@cmmv/affiliate/admin/client'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const affiliateClient = useAffiliateClient()

const accounts = ref([])
const networkCampaigns = ref([])
const systemCampaigns = ref([])
const loading = ref(true)
const loadingNetworkCampaigns = ref(false)
const error = ref(null)

const selectedAccount = ref('')
const selectedNetworkCampaign = ref('')
const originalUrl = ref('')
const matchingCampaign = ref(null)
const matchingCampaignFound = ref(false)
const generatingDeeplink = ref(false)

const accountSearch = ref('')
const campaignSearch = ref('')
const showAccountDropdown = ref(false)
const showCampaignDropdown = ref(false)

const generatedDeeplink = ref('')
const deeplinkInfo = ref({
    accountName: '',
    campaignName: '',
    originalUrl: '',
    timestamp: ''
})
const copied = ref(false)
const deeplinkTextarea = ref(null)

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

const canGenerate = computed(() => {
    return selectedAccount.value &&
           (selectedNetworkCampaign.value || matchingCampaignFound.value) &&
           originalUrl.value
})

const filteredAccounts = computed(() => {
    if (!accountSearch.value.trim()) {
        return accounts.value;
    }

    const search = accountSearch.value.toLowerCase();
    return accounts.value.filter(account =>
        account.label.toLowerCase().includes(search) ||
        (account.name && account.name.toLowerCase().includes(search))
    );
})

const filteredCampaigns = computed(() => {
    if (!campaignSearch.value.trim()) {
        return networkCampaigns.value;
    }

    const search = campaignSearch.value.toLowerCase();
    return networkCampaigns.value.filter(campaign =>
        campaign.name.toLowerCase().includes(search) ||
        (campaign.domain && campaign.domain.toLowerCase().includes(search))
    );
})

const selectAccount = (account) => {
    selectedAccount.value = account;
    accountSearch.value = '';
    showAccountDropdown.value = false;
    onAccountChange();
}

const clearSelectedAccount = () => {
    selectedAccount.value = '';
    networkCampaigns.value = [];
    selectedNetworkCampaign.value = '';
    accountSearch.value = '';
}

const selectCampaign = (campaign) => {
    selectedNetworkCampaign.value = campaign;
    campaignSearch.value = '';
    showCampaignDropdown.value = false;
    onNetworkCampaignChange();
}

const clearSelectedCampaign = () => {
    selectedNetworkCampaign.value = '';
    campaignSearch.value = '';
}

const refreshData = async () => {
    try {
        loading.value = true
        error.value = null

        const accountsResponse = await affiliateClient.accounts.get({
            limit: 1000
        })

        if (accountsResponse && accountsResponse.data) {
            accounts.value = accountsResponse.data
        } else {
            accounts.value = []
        }

        const campaignsResponse = await affiliateClient.campaigns.get({
            limit: 10000
        })

        if (campaignsResponse && campaignsResponse.data) {
            systemCampaigns.value = campaignsResponse.data
        } else {
            systemCampaigns.value = []
        }

        loading.value = false
    } catch (err) {
        console.error('Failed to load data:', err)
        loading.value = false
        error.value = err.message || 'Failed to load accounts and campaigns'
        showNotification('error', 'Failed to load data')
    }
}

const onAccountChange = async () => {
    if (!selectedAccount.value) return

    try {
        loadingNetworkCampaigns.value = true;
        networkCampaigns.value = [];
        selectedNetworkCampaign.value = '';

        const response = await affiliateClient.campaignsNetworks.getNetworkCampaignsList(selectedAccount.value.network);

        if (response && response.data)
            networkCampaigns.value = response.data;
        else
            networkCampaigns.value = [];

        loadingNetworkCampaigns.value = false
    } catch (err) {
        console.error('Failed to load network campaigns:', err)
        loadingNetworkCampaigns.value = false
        showNotification('error', 'Failed to load network campaigns')
    }
}

const onNetworkCampaignChange = () => {
    if (!selectedNetworkCampaign.value) return

    if (selectedNetworkCampaign.value.domain)
        originalUrl.value = `https://${selectedNetworkCampaign.value.domain}`
}

const findCampaignByDomain = () => {
    matchingCampaignFound.value = false
    matchingCampaign.value = null

    if (!originalUrl.value) return

    try {
        const url = new URL(originalUrl.value)
        const domain = url.hostname

        const match = systemCampaigns.value.find(campaign =>
            campaign.domain &&
            (campaign.domain.toLowerCase() === domain.toLowerCase() ||
             domain.toLowerCase().includes(campaign.domain.toLowerCase()))
        )

        if (match) {
            matchingCampaign.value = match
            matchingCampaignFound.value = true

            if (networkCampaigns.value.length > 0) {
                const matchingNetworkCampaign = networkCampaigns.value.find(
                    campaign => campaign.domain && campaign.domain.toLowerCase() === domain.toLowerCase()
                )

                if (matchingNetworkCampaign)
                    selectedNetworkCampaign.value = matchingNetworkCampaign
            }
        }
    } catch (err) {}
}

const generateDeeplink = async () => {
    if (!canGenerate.value) return

    try {
        generatingDeeplink.value = true
        const campaign = selectedNetworkCampaign.value || matchingCampaign.value

        const accountId = selectedAccount.value.id
        const campaignId = campaign.id

        const response = await affiliateClient.deeplink.getDeeplink(accountId, campaignId, originalUrl.value)

        generatedDeeplink.value = response.deeplink;

        deeplinkInfo.value = {
            accountName: selectedAccount.value.label,
            campaignName: campaign.name,
            originalUrl: originalUrl.value,
            timestamp: new Date().toLocaleString()
        }

        showNotification('success', 'Deeplink generated successfully')

        generatingDeeplink.value = false
    } catch (err) {
        console.error('Failed to generate deeplink:', err)
        generatingDeeplink.value = false
        showNotification('error', err.message || 'Failed to generate deeplink')
    }
}

const copyToClipboard = async () => {
    if (!generatedDeeplink.value) return

    try {
        await navigator.clipboard.writeText(generatedDeeplink.value)
        copied.value = true
        showNotification('success', 'Copied to clipboard')

        setTimeout(() => {
            copied.value = false
        }, 2000)
    } catch (err) {
        console.error('Failed to copy to clipboard:', err)
        showNotification('error', 'Failed to copy to clipboard')
    }
}

const showNotification = (type, message) => {
    notification.value = {
        show: true,
        type,
        message,
        duration: 3000
    }
}

onMounted(() => {
    refreshData()

    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#account') && !event.target.closest('.account-dropdown')) {
            showAccountDropdown.value = false
        }
        if (!event.target.closest('#networkCampaign') && !event.target.closest('.campaign-dropdown')) {
            showCampaignDropdown.value = false
        }
    })
})

onUnmounted(() => {
    document.removeEventListener('click', () => {})
})
</script>
