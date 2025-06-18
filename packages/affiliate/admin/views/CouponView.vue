<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Coupons</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Coupon
                </button>
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
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
                        <span
                            v-if="filters.search.trim()"
                            class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full"
                            title="Search filter active">
                        </span>
                    </button>
                    <!-- Search dropdown -->
                    <div v-if="showSearchDropdown" class="absolute right-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="p-3 space-y-3">
                            <div class="relative">
                                <input
                                    v-model="filters.search"
                                    type="text"
                                    placeholder="Search coupons..."
                                    class="bg-neutral-700 h-9 border border-neutral-600 text-white pl-3 pr-8 py-2 rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    @keydown.esc="showSearchDropdown = false"
                                    ref="searchInput"
                                >
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
                        </div>
                    </div>
                </div>
                <!-- More dropdown -->
                <div class="relative">
                    <button @click="toggleMoreDropdown" data-more-toggle
                        class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        More
                    </button>
                    <!-- More dropdown menu -->
                    <div v-if="showMoreDropdown" class="absolute right-0 mt-2 w-56 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="py-1">
                            <button
                                @click="exportCoupons"
                                :disabled="exportLoading"
                                class="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg v-if="exportLoading" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Coupons
                            </button>
                            <button
                                @click="generateMissingShortUrls"
                                :disabled="shortUrlLoading"
                                class="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg v-if="shortUrlLoading" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Generate Short URLs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading coupons...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load coupons</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="coupons.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p class="text-neutral-300 mb-2">No coupons found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first coupon</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Coupon
            </button>
        </div>

        <!-- Coupons table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Code
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Campaign
                            </th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Expiration
                            </th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Active
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="coupon in coupons" :key="coupon.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="coupon.id">
                                {{ coupon.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                <span class="bg-neutral-700 px-2 py-1 rounded text-xs font-mono">
                                    {{ coupon.code }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-neutral-400">
                                <span
                                    v-if="coupon.campaignName"
                                    class="text-sm"
                                >
                                    {{ coupon.campaignName }}
                                </span>
                                <span v-else class="text-neutral-500 italic">
                                    No campaign
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <span v-if="coupon.expiration" :class="isExpired(coupon.expiration) ? 'text-red-500' : 'text-neutral-400'">
                                    {{ formatDate(coupon.expiration) }}
                                </span>
                                <span v-else class="text-neutral-500 italic">No expiration</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <button
                                    @click="toggleActive(coupon)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        coupon.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(coupon)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(coupon)"
                                        title="Delete"
                                        class="text-neutral-400 hover:text-red-500 transition-colors"
                                    >
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
        <Pagination
            :pagination="pagination"
            itemName="coupons"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Coupon Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Coupon' : 'Add Coupon' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveCoupon" class="max-h-[70vh] overflow-y-auto">
                        <div class="mb-4">
                            <label for="couponTitle" class="block text-sm font-medium text-neutral-300 mb-1">Title</label>
                            <input
                                id="couponTitle"
                                v-model="couponForm.title"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Coupon title"
                                required
                            />
                            <p v-if="formErrors.title" class="mt-1 text-sm text-red-500">{{ formErrors.title }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="couponCode" class="block text-sm font-medium text-neutral-300 mb-1">Code</label>
                            <input
                                id="couponCode"
                                v-model="couponForm.code"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="DISCOUNT50"
                                required
                            />
                            <p v-if="formErrors.code" class="mt-1 text-sm text-red-500">{{ formErrors.code }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="couponDescription" class="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                            <textarea
                                id="couponDescription"
                                v-model="couponForm.description"
                                rows="2"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Coupon description"
                            ></textarea>
                            <p v-if="formErrors.description" class="mt-1 text-sm text-red-500">{{ formErrors.description }}</p>
                        </div>

                        <div class="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="couponType" class="block text-sm font-medium text-neutral-300 mb-1">Type</label>
                                <select
                                    id="couponType"
                                    v-model="couponForm.type"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="Cupom">Coupon</option>
                                    <option value="Oferta">Offer</option>
                                    <option value="Cashback">Cashback</option>
                                </select>
                                <p v-if="formErrors.type" class="mt-1 text-sm text-red-500">{{ formErrors.type }}</p>
                            </div>
                            <div>
                                <label for="couponTypeDiscount" class="block text-sm font-medium text-neutral-300 mb-1">Discount Type</label>
                                <select
                                    id="couponTypeDiscount"
                                    v-model="couponForm.typeDiscount"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="fixed">Fixed Amount</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                                <p v-if="formErrors.typeDiscount" class="mt-1 text-sm text-red-500">{{ formErrors.typeDiscount }}</p>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label for="couponLink" class="block text-sm font-medium text-neutral-300 mb-1">Link</label>
                            <input
                                id="couponLink"
                                v-model="couponForm.link"
                                type="url"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="https://example.com/coupon"
                            />
                            <p class="mt-1 text-sm text-neutral-500">The URL to redeem this coupon</p>
                            <p v-if="formErrors.link" class="mt-1 text-sm text-red-500">{{ formErrors.link }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="couponExpiration" class="block text-sm font-medium text-neutral-300 mb-1">Expiration Date</label>
                            <input
                                id="couponExpiration"
                                v-model="couponForm.expiration"
                                type="date"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p class="mt-1 text-sm text-neutral-500">Leave empty for no expiration</p>
                            <p v-if="formErrors.expiration" class="mt-1 text-sm text-red-500">{{ formErrors.expiration }}</p>
                        </div>

                        <div class="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="couponNetwork" class="block text-sm font-medium text-neutral-300 mb-1">Network</label>
                                <div v-if="loadingNetworks" class="flex items-center py-2">
                                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                    <span class="ml-2 text-neutral-400 text-sm">Loading...</span>
                                </div>
                                <select
                                    v-else
                                    id="couponNetwork"
                                    v-model="couponForm.network"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select a network</option>
                                    <option
                                        v-for="network in availableNetworks"
                                        :key="network.id"
                                        :value="network.id"
                                    >
                                        {{ network.name }}
                                    </option>
                                </select>
                                <p v-if="formErrors.network" class="mt-1 text-sm text-red-500">{{ formErrors.network }}</p>
                            </div>
                            <div>
                                <label for="couponCampaign" class="block text-sm font-medium text-neutral-300 mb-1">Campaign</label>
                                <div v-if="loadingCampaigns" class="flex items-center py-2">
                                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                    <span class="ml-2 text-neutral-400 text-sm">Loading...</span>
                                </div>
                                <select
                                    v-else
                                    id="couponCampaign"
                                    v-model="couponForm.campaign"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select a campaign</option>
                                    <option
                                        v-for="campaign in filteredCampaigns"
                                        :key="campaign.id"
                                        :value="campaign.id"
                                    >
                                        {{ campaign.name }}
                                    </option>
                                </select>
                                <p v-if="formErrors.campaign" class="mt-1 text-sm text-red-500">{{ formErrors.campaign }}</p>
                            </div>
                        </div>

                        <div class="mb-4">
                            <div class="flex items-center">
                                <input
                                    id="couponActive"
                                    v-model="couponForm.active"
                                    type="checkbox"
                                    class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                />
                                <label for="couponActive" class="ml-2 block text-sm font-medium text-neutral-300">
                                    Active
                                </label>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">Only active coupons will be available to users</p>
                        </div>

                        <div class="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                @click="closeDialog"
                                class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                :disabled="formLoading"
                            >
                                <span v-if="formLoading" class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                                <span v-else>
                                    {{ isEditing ? 'Update' : 'Create' }}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="couponToDelete?.title"
            :loading="deleteLoading"
            message="Are you sure you want to delete the coupon"
            warning-text="This action cannot be undone. Users will no longer be able to use this coupon."
            loading-text="Deleting..."
            @confirm="deleteCoupon"
            @cancel="closeDeleteDialog"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useAffiliateClient } from '@cmmv/affiliate/admin/client'
import { useAdminClient } from '@cmmv/blog/admin/client'
import Pagination from '@cmmv/blog/admin/components/Pagination.vue'
import DeleteDialog from '@cmmv/blog/admin/components/DeleteDialog.vue'
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue'

const affiliateClient = useAffiliateClient()
const adminClient = useAdminClient()

const coupons = ref([])
const loading = ref(true)
const error = ref(null)

const availableNetworks = ref([])
const loadingNetworks = ref(false)

const availableCampaigns = ref([])
const loadingCampaigns = ref(false)

const showDialog = ref(false)
const isEditing = ref(false)
const couponForm = ref({
    title: '',
    description: '',
    code: '',
    link: '',
    type: 'Cupom', // Default values from contract
    typeDiscount: 'fixed',
    active: true,
    expiration: '',
    network: '',
    campaign: '',
    campaignName: ''
})
const couponToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const couponToDelete = ref(null)
const deleteLoading = ref(false)

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
    sortBy: 'title',
    sortOrder: 'asc',
    page: 1
})

const showSearchDropdown = ref(false)
const showMoreDropdown = ref(false)
const searchInput = ref(null)
const exportLoading = ref(false)
const shortUrlLoading = ref(false)

const filteredCampaigns = computed(() => {
    if (!couponForm.value.network) {
        return availableCampaigns.value;
    }

    return availableCampaigns.value.filter(campaign =>
        campaign.network === couponForm.value.network
    );
})

const loadCoupons = async () => {
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
            apiFilters.searchField = 'title'
        }

        const response = await affiliateClient.coupons.get(apiFilters)

        if (response && response.data) {
            coupons.value = response.data || []

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
            coupons.value = []

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
    } catch (err) {
        console.error('Failed to load coupons:', err)
        loading.value = false
        error.value = err.message || 'Failed to load coupons'
        showNotification('error', 'Failed to load coupons')
    }
}

const loadNetworks = async () => {
    try {
        loadingNetworks.value = true

        const response = await affiliateClient.networks.get({
            limit: 100,
            sortBy: 'name',
            sort: 'asc'
        })

        if (response && response.data) {
            availableNetworks.value = response.data.filter(network => network.active !== false) || []
        } else {
            availableNetworks.value = []
        }

        loadingNetworks.value = false
    } catch (err) {
        console.error('Failed to load networks:', err)
        loadingNetworks.value = false
        showNotification('error', 'Failed to load available networks')
    }
}

const loadCampaigns = async () => {
    try {
        loadingCampaigns.value = true

        const response = await affiliateClient.campaigns.get({
            limit: 100,
            sortBy: 'name',
            sort: 'asc'
        })

        if (response && response.data) {
            availableCampaigns.value = response.data || []
        } else {
            availableCampaigns.value = []
        }

        loadingCampaigns.value = false
    } catch (err) {
        console.error('Failed to load campaigns:', err)
        loadingCampaigns.value = false
        showNotification('error', 'Failed to load available campaigns')
    }
}

const refreshData = () => {
    loadCoupons()
}

const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

const isExpired = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date < new Date();
}

watch(filters, () => {
    loadCoupons()
}, { deep: true })

watch(() => couponForm.value.campaign, (newValue) => {
    if (newValue) {
        const selectedCampaign = availableCampaigns.value.find(c => c.id === newValue);
        if (selectedCampaign) {
            couponForm.value.campaignName = selectedCampaign.name;
        }
    } else {
        couponForm.value.campaignName = '';
    }
})

const openAddDialog = async () => {
    isEditing.value = false
    couponForm.value = {
        title: '',
        description: '',
        code: '',
        link: '',
        type: 'Cupom',
        typeDiscount: 'fixed',
        active: true,
        expiration: '',
        network: '',
        campaign: '',
        campaignName: ''
    }
    formErrors.value = {}
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }

    if (availableCampaigns.value.length === 0) {
        await loadCampaigns()
    }
}

const openEditDialog = async (coupon) => {
    isEditing.value = true
    couponToEdit.value = coupon

    let expirationDate = '';
    if (coupon.expiration) {
        const date = new Date(coupon.expiration);
        expirationDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    couponForm.value = {
        title: coupon.title,
        description: coupon.description || '',
        code: coupon.code || '',
        link: coupon.link || '',
        type: coupon.type || 'Cupom',
        typeDiscount: coupon.typeDiscount || 'fixed',
        active: coupon.active !== undefined ? coupon.active : true,
        expiration: expirationDate,
        network: coupon.network || '',
        campaign: coupon.campaign || '',
        campaignName: coupon.campaignName || ''
    }

    formErrors.value = {}
    showDialog.value = true

    if (availableNetworks.value.length === 0) {
        await loadNetworks()
    }

    if (availableCampaigns.value.length === 0) {
        await loadCampaigns()
    }
}

const closeDialog = () => {
    showDialog.value = false
    couponForm.value = {
        title: '',
        description: '',
        code: '',
        link: '',
        type: 'Cupom',
        typeDiscount: 'fixed',
        active: true,
        expiration: '',
        network: '',
        campaign: '',
        campaignName: ''
    }
    formErrors.value = {}
    couponToEdit.value = null
}

const saveCoupon = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        if (!couponForm.value.title.trim()) {
            formErrors.value.title = 'Title is required'
            formLoading.value = false
            return
        }

        if (!couponForm.value.code.trim()) {
            formErrors.value.code = 'Code is required'
            formLoading.value = false
            return
        }

        const couponData = {
            title: couponForm.value.title.trim(),
            description: couponForm.value.description?.trim(),
            code: couponForm.value.code.trim(),
            link: couponForm.value.link?.trim(),
            type: couponForm.value.type,
            typeDiscount: couponForm.value.typeDiscount,
            active: couponForm.value.active,
            network: couponForm.value.network || null,
            campaign: couponForm.value.campaign || null,
            campaignName: couponForm.value.campaignName || null
        }

        if (couponForm.value.expiration)
            couponData.expiration = new Date(couponForm.value.expiration).toISOString();
        else
            couponData.expiration = null;

        if (isEditing.value) {
            await affiliateClient.coupons.update(couponToEdit.value.id, couponData)
            showNotification('success', 'Coupon updated successfully')
        } else {
            await affiliateClient.coupons.insert(couponData)
            showNotification('success', 'Coupon created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save coupon')
    }
}

const toggleActive = async (coupon) => {
    try {
        const updatedCoupon = {
            ...coupon,
            active: !coupon.active
        };

        await affiliateClient.coupons.update(coupon.id, updatedCoupon);
        const index = coupons.value.findIndex(c => c.id === coupon.id);

        if (index !== -1)
            coupons.value[index].active = !coupon.active;

        showNotification('success', `Coupon ${updatedCoupon.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        console.error('Failed to toggle coupon active state:', err);
        showNotification('error', err.message || 'Failed to update coupon status');
    }
}

const confirmDelete = (coupon) => {
    couponToDelete.value = coupon
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    couponToDelete.value = null
}

const deleteCoupon = async () => {
    if (!couponToDelete.value) return

    try {
        deleteLoading.value = true
        await affiliateClient.coupons.delete(couponToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Coupon deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete coupon:', err)
        showNotification('error', err.message || 'Failed to delete coupon')
    }
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

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'asc'
    }
}

const truncateTitle = (title, maxLength = 25) => {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
};

const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value;
    if (showSearchDropdown.value) {
        searchInput.value.focus();
    }
}

const toggleMoreDropdown = () => {
    showMoreDropdown.value = !showMoreDropdown.value;
}

const clearSearch = () => {
    filters.value.search = '';
    showSearchDropdown.value = false;
}

const exportCoupons = async () => {
    try {
        showMoreDropdown.value = false;
        exportLoading.value = true;

        // Get signature token first (requires root access)
        let signature;
        try {
            const signatureResponse = await adminClient.settings.getSignature();
            if (signatureResponse) {
                signature = signatureResponse;
            } else {
                throw new Error('Failed to get authentication signature');
            }
        } catch (err) {
            console.error('Error getting signature:', err);
            showNotification('error', 'Only root users can export coupons');
            exportLoading.value = false;
            return;
        }

        window.open(`/api/affiliate/coupons/export?token=${signature}`, '_blank');
        showNotification('success', 'Export started. Your download will begin shortly.');
    } catch (err) {
        console.error('Failed to export coupons:', err);
        showNotification('error', err.message || 'Failed to export coupons');
    } finally {
        exportLoading.value = false;
    }
}

const generateMissingShortUrls = async () => {
    try {
        showMoreDropdown.value = false;
        shortUrlLoading.value = true;

        showNotification('info', 'Starting to generate short URLs for coupons...');

        const response = await affiliateClient.coupons.generateMissingShortUrls(50);

        if (response.success) {
            showNotification('success',
                `Short URL generation completed! Processed ${response.processed} coupons, updated ${response.updated} successfully.` +
                (response.errors > 0 ? ` ${response.errors} errors occurred.` : '')
            );

            // Refresh the coupons list to show updated data
            await refreshData();
        } else {
            throw new Error(response.message || 'Failed to generate short URLs');
        }

    } catch (err) {
        console.error('Failed to generate short URLs:', err);
        showNotification('error', err.message || 'Failed to generate short URLs for coupons');
    } finally {
        shortUrlLoading.value = false;
    }
}

onMounted(() => {
    // Add click-outside handling for search and more dropdowns
    document.addEventListener('click', (event) => {
        const target = event.target

        // Handle search dropdown
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false
        }

        // Handle more dropdown
        if (!target.closest('[data-more-toggle]') && !target.closest('.absolute') && showMoreDropdown.value) {
            showMoreDropdown.value = false
        }
    })

    loadCoupons()
    loadNetworks()
    loadCampaigns()
})
</script>
