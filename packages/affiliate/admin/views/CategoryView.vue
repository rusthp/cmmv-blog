<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Categories</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Category
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
                        <!-- Indicator dot for active search -->
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
                                    placeholder="Search categories..."
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
                        </div>
                    </div>
                </div>

                <!-- More actions dropdown -->
                <div class="relative" data-more-actions-toggle>
                    <button
                        @click="toggleMoreActionsDropdown"
                        class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        More
                    </button>
                    <!-- More actions dropdown menu -->
                    <div v-if="showMoreActionsDropdown" class="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10">
                        <div class="py-1">
                            <button
                                @click="exportCategories"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                                :disabled="exportLoading"
                            >
                                <svg v-if="exportLoading" class="animate-spin h-3.5 w-3.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Categories
                            </button>
                            <button
                                @click="openImportFileDialog"
                                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Import Categories
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading categories...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load categories</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="categories.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p class="text-neutral-300 mb-2">No categories found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first category</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Category
            </button>
        </div>

        <!-- Categories table -->
        <div v-else class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider w-16">
                                ID
                            </th>
                            <th
                                @click="toggleSort('name')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Name
                                <span v-if="filters.sortBy === 'name'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Slug
                            </th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                Icon
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
                        <tr v-for="category in categories" :key="category.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="category.id">
                                {{ category.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {{ category.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                <span class="font-mono">{{ category.slug }}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <i v-if="category.icon" :class="[category.icon, 'text-xl text-white']" :title="category.icon"></i>
                                <span v-else class="text-neutral-500">—</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <button
                                    @click="toggleActive(category)"
                                    :class="[
                                        'rounded-full p-1 w-12 h-6 flex items-center transition-colors',
                                        category.active ? 'bg-green-600 justify-end' : 'bg-neutral-600 justify-start'
                                    ]"
                                >
                                    <span class="bg-white rounded-full w-4 h-4"></span>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(category)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(category)"
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
            itemName="categories"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Category Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Category' : 'Add Category' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="saveCategory">
                        <div class="mb-4">
                            <label for="categoryName" class="block text-sm font-medium text-neutral-300 mb-1">Category Name</label>
                            <input
                                id="categoryName"
                                v-model="categoryForm.name"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Category name"
                                required
                                @input="generateSlug"
                            />
                            <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="categorySlug" class="block text-sm font-medium text-neutral-300 mb-1">Slug</label>
                            <input
                                id="categorySlug"
                                v-model="categoryForm.slug"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="category-slug"
                                required
                            />
                            <p class="mt-1 text-sm text-neutral-500">The slug is used in URLs and should be unique</p>
                            <p v-if="formErrors.slug" class="mt-1 text-sm text-red-500">{{ formErrors.slug }}</p>
                        </div>

                        <div class="mb-4">
                            <label for="categoryIcon" class="block text-sm font-medium text-neutral-300 mb-1">Icon</label>
                            <div class="flex items-center space-x-2">
                                <div class="relative">
                                    <button
                                        type="button"
                                        @click="showIconSelector = true"
                                        class="flex items-center space-x-2 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white hover:bg-neutral-650 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <i v-if="categoryForm.icon" :class="['text-lg text-white', categoryForm.icon]"></i>
                                        <span v-else class="text-neutral-400">Select Icon</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    v-if="categoryForm.icon"
                                    type="button"
                                    @click="categoryForm.icon = ''"
                                    class="text-neutral-400 hover:text-white"
                                    title="Clear icon"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">Select an icon for this category</p>
                        </div>

                        <div class="mb-4">
                            <div class="flex items-center">
                                <input
                                    id="categoryActive"
                                    v-model="categoryForm.active"
                                    type="checkbox"
                                    class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 bg-neutral-700 border-neutral-600"
                                />
                                <label for="categoryActive" class="ml-2 block text-sm font-medium text-neutral-300">
                                    Active
                                </label>
                            </div>
                            <p class="mt-1 text-sm text-neutral-500">Only active categories will be visible to users</p>
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
            :item-name="categoryToDelete?.name"
            :loading="deleteLoading"
            message="Are you sure you want to delete the category"
            warning-text="This action cannot be undone. This may affect associated data."
            loading-text="Deleting..."
            @confirm="deleteCategory"
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

        <!-- Hidden file input for importing JSON files -->
        <input
            type="file"
            ref="importFileInput"
            @change="handleFileSelect"
            accept="application/json"
            class="hidden"
        />

        <!-- Import Progress Dialog -->
        <div v-if="showImportProgress" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Importing Categories</h3>
                    <button @click="cancelImport" class="text-neutral-400 hover:text-white" :disabled="importInProgress">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-neutral-300">Progress</span>
                            <span class="text-sm text-neutral-300">{{ importProgress.current }} / {{ importProgress.total }}</span>
                        </div>
                        <div class="w-full bg-neutral-700 rounded-full h-2.5">
                            <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${importProgress.percentage}%` }"></div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-neutral-300">Success</span>
                            <span class="text-sm text-green-500">{{ importProgress.success }}</span>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm text-neutral-300">Failed</span>
                            <span class="text-sm text-red-500">{{ importProgress.failed }}</span>
                        </div>
                    </div>

                    <div v-if="importProgress.currentItem" class="mb-4 text-sm text-neutral-400">
                        <p class="truncate">Processing: {{ importProgress.currentItem }}</p>
                    </div>

                    <div v-if="importProgress.errorMessage" class="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-300">
                        <p>{{ importProgress.errorMessage }}</p>
                    </div>

                    <div class="flex justify-end">
                        <button
                            @click="closeImportDialog"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            :disabled="importInProgress"
                        >
                            {{ importInProgress ? 'Importing...' : importFinished ? 'Close' : 'Cancel' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Icon Selector Modal -->
        <div v-if="showIconSelector" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-3xl mx-auto max-h-[80vh] flex flex-col">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Select an Icon</h3>
                    <button @click="showIconSelector = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-4 border-b border-neutral-700">
                    <div class="relative">
                        <input
                            v-model="iconSearch"
                            type="text"
                            placeholder="Search icons..."
                            class="w-full px-3 py-2 pl-9 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-neutral-400 absolute left-2 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <button
                            v-if="iconSearch"
                            @click="iconSearch = ''"
                            class="absolute right-2 top-2.5 text-neutral-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex flex-wrap mt-2 gap-2">
                        <button
                            v-for="type in iconTypes"
                            :key="type.name"
                            @click="activeIconType = type.prefix"
                            :class="[
                                'px-2 py-1 text-xs rounded',
                                activeIconType === type.prefix ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                            ]"
                        >
                            {{ type.name }}
                        </button>
                    </div>
                </div>
                <div class="overflow-y-auto flex-grow p-4">
                    <div v-if="filteredIcons.length === 0" class="flex flex-col items-center justify-center h-full text-neutral-400 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No icons found</p>
                    </div>
                    <div v-else class="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        <button
                            v-for="icon in filteredIcons"
                            :key="icon"
                            @click="selectIcon(icon)"
                            class="flex items-center justify-center p-3 bg-neutral-700 rounded hover:bg-neutral-600 text-xl transition-colors"
                            :class="{ 'ring-2 ring-blue-500 bg-neutral-600': categoryForm.icon === icon }"
                        >
                            <i :class="[icon, 'text-white']"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4 border-t border-neutral-700 flex justify-end">
                    <button
                        @click="showIconSelector = false"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
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

const categories = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const categoryForm = ref({
    name: '',
    slug: '',
    active: true,
    icon: ''
})
const categoryToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const categoryToDelete = ref(null)
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
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1
})

const showSearchDropdown = ref(false)
const searchInput = ref(null)
const exportLoading = ref(false)

// More actions dropdown state
const showMoreActionsDropdown = ref(false)

// Import functionality
const importFileInput = ref(null)
const showImportProgress = ref(false)
const importInProgress = ref(false)
const importFinished = ref(false)
const importCancelled = ref(false)
const importProgress = ref({
    current: 0,
    total: 0,
    percentage: 0,
    success: 0,
    failed: 0,
    currentItem: '',
    errorMessage: ''
})

const showIconSelector = ref(false)
const iconSearch = ref('')
const activeIconType = ref('fas')

const iconTypes = [
    { name: 'Solid', prefix: 'fas' },
    { name: 'Regular', prefix: 'far' },
    { name: 'Brands', prefix: 'fab' },
    { name: 'All Icons', prefix: 'all' }
]

const fontAwesomeIcons = computed(() => {
    // Get all icons from the CDN
    if (activeIconType.value === 'all') {
        // Return all icons combined
        return [...getSolidIcons(), ...getRegularIcons(), ...getBrandIcons()];
    }

    if (activeIconType.value === 'fas') return getSolidIcons();
    if (activeIconType.value === 'far') return getRegularIcons();
    if (activeIconType.value === 'fab') return getBrandIcons();

    // Default fallback
    return getSolidIcons();
})

const filteredIcons = computed(() => {
    let icons = fontAwesomeIcons.value;

    // Apply search filter if there's a search query
    if (iconSearch.value) {
        const search = iconSearch.value.toLowerCase();
        icons = icons.filter(icon => {
            // Extract the icon name (remove the prefix)
            const iconName = icon.split('fa-')[1];
            return iconName && iconName.includes(search);
        });
    }

    return icons;
})

const selectIcon = (icon) => {
    categoryForm.value.icon = icon
    showIconSelector.value = false
}

const loadCategories = async () => {
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
            apiFilters.searchField = 'name'
        }

        const response = await affiliateClient.categories.get(apiFilters)

        if (response && response.data) {
            categories.value = response.data || []

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 10

            // Calculate current page from offset and limit
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
            categories.value = []
            // Reset pagination if data format is unexpected
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
        console.error('Failed to load categories:', err)
        loading.value = false
        error.value = err.message || 'Failed to load categories'
        showNotification('error', 'Failed to load categories')
    }
}

// Refresh data
const refreshData = () => {
    loadCategories()
}

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Generate a slug from the category name
const generateSlug = () => {
    if (!categoryForm.value.name) return;

    // Only auto-generate the slug if it's a new category or if the slug is empty
    if (!isEditing.value || !categoryForm.value.slug) {
        categoryForm.value.slug = categoryForm.value.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/-+/g, '-')      // Replace multiple hyphens with a single one
            .trim();
    }
}

// Watch for filter changes
watch(filters, () => {
    loadCategories()
}, { deep: true })

// Dialog methods
const openAddDialog = () => {
    isEditing.value = false
    categoryForm.value = {
        name: '',
        slug: '',
        active: true,
        icon: ''
    }
    formErrors.value = {}
    showDialog.value = true
}

const openEditDialog = (category) => {
    isEditing.value = true
    categoryToEdit.value = category

    categoryForm.value = {
        name: category.name,
        slug: category.slug,
        active: category.active === undefined ? true : category.active,
        icon: category.icon || ''
    }
    formErrors.value = {}
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    categoryForm.value = {
        name: '',
        slug: '',
        active: true,
        icon: ''
    }
    formErrors.value = {}
    categoryToEdit.value = null
}

// Save category
const saveCategory = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        // Validate
        if (!categoryForm.value.name.trim()) {
            formErrors.value.name = 'Category name is required'
            formLoading.value = false
            return
        }

        if (!categoryForm.value.slug.trim()) {
            formErrors.value.slug = 'Slug is required'
            formLoading.value = false
            return
        }

        const categoryData = {
            name: categoryForm.value.name.trim(),
            slug: categoryForm.value.slug.trim(),
            active: categoryForm.value.active,
            icon: categoryForm.value.icon
        }

        if (isEditing.value) {
            await affiliateClient.categories.update(categoryToEdit.value.id, categoryData)
            showNotification('success', 'Category updated successfully')
        } else {
            await affiliateClient.categories.insert(categoryData)
            showNotification('success', 'Category created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save category')
    }
}

const toggleActive = async (category) => {
    try {
        const updatedCategory = {
            ...category,
            active: !category.active
        };

        await affiliateClient.categories.update(category.id, updatedCategory);

        // Update the local state
        const index = categories.value.findIndex(c => c.id === category.id);
        if (index !== -1) {
            categories.value[index].active = !category.active;
        }

        showNotification('success', `Category ${updatedCategory.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        console.error('Failed to toggle category active state:', err);
        showNotification('error', err.message || 'Failed to update category status');
    }
}

const confirmDelete = (category) => {
    categoryToDelete.value = category
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    categoryToDelete.value = null
}

const deleteCategory = async () => {
    if (!categoryToDelete.value) return

    try {
        deleteLoading.value = true
        await affiliateClient.categories.delete(categoryToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Category deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete category:', err)
        showNotification('error', err.message || 'Failed to delete category')
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

const toggleSearchDropdown = () => {
    showSearchDropdown.value = !showSearchDropdown.value
    if (showSearchDropdown.value) {
        searchInput.value.focus()
    }
}

const clearSearch = () => {
    filters.value.search = ''
    showSearchDropdown.value = false
}

// Helper functions to get icons by type - these separate functions help keep the code organized
const getSolidIcons = () => {
    return [
        // Common solid icons (fas) - first batch
        'fas fa-address-book', 'fas fa-address-card', 'fas fa-adjust', 'fas fa-air-freshener', 'fas fa-align-center',
        'fas fa-align-justify', 'fas fa-align-left', 'fas fa-align-right', 'fas fa-allergies', 'fas fa-ambulance',
        'fas fa-american-sign-language-interpreting', 'fas fa-anchor', 'fas fa-angle-double-down', 'fas fa-angle-double-left',
        'fas fa-angle-double-right', 'fas fa-angle-double-up', 'fas fa-angle-down', 'fas fa-angle-left', 'fas fa-angle-right',
        'fas fa-angle-up', 'fas fa-angry', 'fas fa-ankh', 'fas fa-apple-alt', 'fas fa-archive', 'fas fa-archway',
        'fas fa-arrow-alt-circle-down', 'fas fa-arrow-alt-circle-left', 'fas fa-arrow-alt-circle-right', 'fas fa-arrow-alt-circle-up',
        'fas fa-arrow-circle-down', 'fas fa-arrow-circle-left', 'fas fa-arrow-circle-right', 'fas fa-arrow-circle-up',
        'fas fa-arrow-down', 'fas fa-arrow-left', 'fas fa-arrow-right', 'fas fa-arrow-up', 'fas fa-arrows-alt',
        'fas fa-arrows-alt-h', 'fas fa-arrows-alt-v', 'fas fa-assistive-listening-systems', 'fas fa-asterisk',
        'fas fa-at', 'fas fa-atlas', 'fas fa-atom', 'fas fa-audio-description', 'fas fa-award',

        // Common icons relevant for categories
        'fas fa-home', 'fas fa-user', 'fas fa-cog', 'fas fa-wrench', 'fas fa-shopping-cart',
        'fas fa-star', 'fas fa-heart', 'fas fa-bars', 'fas fa-bell', 'fas fa-envelope',
        'fas fa-search', 'fas fa-phone', 'fas fa-calendar', 'fas fa-clock', 'fas fa-map-marker-alt',
        'fas fa-credit-card', 'fas fa-dollar-sign', 'fas fa-tag', 'fas fa-bookmark', 'fas fa-file',
        'fas fa-image', 'fas fa-video', 'fas fa-music', 'fas fa-camera', 'fas fa-microphone',
        'fas fa-headphones', 'fas fa-tv', 'fas fa-desktop', 'fas fa-mobile-alt', 'fas fa-tablet-alt',
        'fas fa-book', 'fas fa-newspaper', 'fas fa-graduation-cap', 'fas fa-briefcase', 'fas fa-building',
        'fas fa-car', 'fas fa-plane', 'fas fa-train', 'fas fa-ship', 'fas fa-bus',
        'fas fa-bicycle', 'fas fa-motorcycle', 'fas fa-truck', 'fas fa-tractor', 'fas fa-rocket',
        'fas fa-utensils', 'fas fa-coffee', 'fas fa-glass-martini', 'fas fa-wine-glass', 'fas fa-beer',
        'fas fa-pizza-slice', 'fas fa-hamburger', 'fas fa-ice-cream', 'fas fa-cookie', 'fas fa-carrot',
        'fas fa-apple-alt', 'fas fa-lemon', 'fas fa-pepper-hot', 'fas fa-bread-slice', 'fas fa-egg',
        'fas fa-cheese', 'fas fa-drumstick-bite', 'fas fa-fish', 'fas fa-bone', 'fas fa-candy-cane',

        // Electronics & tech
        'fas fa-mobile', 'fas fa-laptop', 'fas fa-keyboard', 'fas fa-mouse', 'fas fa-battery-full',
        'fas fa-wifi', 'fas fa-bluetooth', 'fas fa-signal', 'fas fa-sd-card', 'fas fa-memory',
        'fas fa-hdd', 'fas fa-microchip', 'fas fa-sim-card', 'fas fa-plug',

        // Shopping & commerce
        'fas fa-store', 'fas fa-shopping-bag', 'fas fa-shopping-basket', 'fas fa-cart-plus', 'fas fa-cash-register',
        'fas fa-receipt', 'fas fa-money-bill', 'fas fa-money-bill-wave', 'fas fa-money-check', 'fas fa-piggy-bank',
        'fas fa-coins', 'fas fa-gift', 'fas fa-percentage', 'fas fa-tags', 'fas fa-hand-holding-usd',

        // Media & entertainment
        'fas fa-film', 'fas fa-photo-video', 'fas fa-podcast', 'fas fa-gamepad', 'fas fa-dice',
        'fas fa-chess', 'fas fa-theater-masks', 'fas fa-ticket-alt', 'fas fa-compact-disc',

        // Sports & fitness
        'fas fa-football-ball', 'fas fa-basketball-ball', 'fas fa-baseball-ball', 'fas fa-volleyball-ball',
        'fas fa-futbol', 'fas fa-golf-ball', 'fas fa-bowling-ball', 'fas fa-dumbbell', 'fas fa-running',
        'fas fa-biking', 'fas fa-swimmer', 'fas fa-hiking', 'fas fa-skiing', 'fas fa-snowboarding',

        // Travel & transportation
        'fas fa-map', 'fas fa-compass', 'fas fa-globe', 'fas fa-passport', 'fas fa-suitcase',
        'fas fa-concierge-bell', 'fas fa-hotel', 'fas fa-umbrella-beach', 'fas fa-mountain', 'fas fa-road',

        // Home & living
        'fas fa-couch', 'fas fa-bed', 'fas fa-bath', 'fas fa-chair', 'fas fa-toilet',
        'fas fa-shower', 'fas fa-hot-tub', 'fas fa-sink', 'fas fa-house-user', 'fas fa-door-open',
        'fas fa-lightbulb', 'fas fa-fan', 'fas fa-temperature-high', 'fas fa-temperature-low', 'fas fa-wind',

        // Beauty & fashion
        'fas fa-tshirt', 'fas fa-shoe-prints', 'fas fa-hat-cowboy', 'fas fa-glasses', 'fas fa-socks',
        'fas fa-vest', 'fas fa-ring', 'fas fa-gem', 'fas fa-cut', 'fas fa-spray-can',

        'fas fa-ring'
    ];
}

const getRegularIcons = () => {
    return [
        'far fa-address-book', 'far fa-address-card', 'far fa-angry', 'far fa-arrow-alt-circle-down', 'far fa-arrow-alt-circle-left',
        'far fa-arrow-alt-circle-right', 'far fa-arrow-alt-circle-up', 'far fa-bell', 'far fa-bell-slash', 'far fa-bookmark',
        'far fa-building', 'far fa-calendar', 'far fa-calendar-alt', 'far fa-calendar-check', 'far fa-calendar-minus',
        'far fa-calendar-plus', 'far fa-calendar-times', 'far fa-caret-square-down', 'far fa-caret-square-left',
        'far fa-caret-square-right', 'far fa-caret-square-up', 'far fa-chart-bar', 'far fa-check-circle', 'far fa-check-square',
        'far fa-circle', 'far fa-clipboard', 'far fa-clock', 'far fa-clone', 'far fa-closed-captioning', 'far fa-comment',
        'far fa-comment-alt', 'far fa-comment-dots', 'far fa-comments', 'far fa-compass', 'far fa-copy', 'far fa-copyright',
        'far fa-credit-card', 'far fa-dizzy', 'far fa-dot-circle', 'far fa-edit', 'far fa-envelope', 'far fa-envelope-open',
        'far fa-eye', 'far fa-eye-slash', 'far fa-file', 'far fa-file-alt', 'far fa-file-archive', 'far fa-file-audio',
        'far fa-file-code', 'far fa-file-excel', 'far fa-file-image', 'far fa-file-pdf', 'far fa-file-powerpoint',
        'far fa-file-video', 'far fa-file-word', 'far fa-flag', 'far fa-flushed', 'far fa-folder', 'far fa-folder-open',
        'far fa-frown', 'far fa-frown-open', 'far fa-futbol', 'far fa-gem', 'far fa-grimace', 'far fa-grin',
        'far fa-grin-alt', 'far fa-grin-beam', 'far fa-grin-beam-sweat', 'far fa-grin-hearts', 'far fa-grin-squint',
        'far fa-grin-squint-tears', 'far fa-grin-stars', 'far fa-grin-tears', 'far fa-grin-tongue',
        'far fa-grin-tongue-squint', 'far fa-grin-tongue-wink', 'far fa-grin-wink', 'far fa-hand-lizard',
        'far fa-hand-paper', 'far fa-hand-peace', 'far fa-hand-point-down', 'far fa-hand-point-left',
        'far fa-hand-point-right', 'far fa-hand-point-up', 'far fa-hand-pointer', 'far fa-hand-rock',
        'far fa-hand-scissors', 'far fa-hand-spock', 'far fa-handshake', 'far fa-hdd', 'far fa-heart',
        'far fa-hospital', 'far fa-hourglass', 'far fa-id-badge', 'far fa-id-card', 'far fa-image',
        'far fa-images', 'far fa-keyboard', 'far fa-kiss', 'far fa-kiss-beam', 'far fa-kiss-wink-heart',
        'far fa-laugh', 'far fa-laugh-beam', 'far fa-laugh-squint', 'far fa-laugh-wink', 'far fa-lemon',
        'far fa-life-ring', 'far fa-lightbulb', 'far fa-list-alt', 'far fa-map', 'far fa-meh',
        'far fa-meh-blank', 'far fa-meh-rolling-eyes', 'far fa-minus-square', 'far fa-money-bill-alt',
        'far fa-moon', 'far fa-newspaper', 'far fa-object-group', 'far fa-object-ungroup', 'far fa-paper-plane',
        'far fa-pause-circle', 'far fa-play-circle', 'far fa-plus-square', 'far fa-question-circle',
        'far fa-registered', 'far fa-sad-cry', 'far fa-sad-tear', 'far fa-save', 'far fa-share-square',
        'far fa-smile', 'far fa-smile-beam', 'far fa-smile-wink', 'far fa-snowflake', 'far fa-square',
        'far fa-star', 'far fa-star-half', 'far fa-sticky-note', 'far fa-stop-circle', 'far fa-sun',
        'far fa-surprise', 'far fa-thumbs-down', 'far fa-thumbs-up', 'far fa-times-circle', 'far fa-tired',
        'far fa-trash-alt', 'far fa-user', 'far fa-user-circle', 'far fa-window-close', 'far fa-window-maximize',
        'far fa-window-minimize', 'far fa-window-restore'
    ];
}

const getBrandIcons = () => {
    return [
        'fab fa-500px', 'fab fa-accessible-icon', 'fab fa-accusoft', 'fab fa-acquisitions-incorporated', 'fab fa-adn',
        'fab fa-adversal', 'fab fa-affiliatetheme', 'fab fa-airbnb', 'fab fa-algolia', 'fab fa-alipay',
        'fab fa-amazon', 'fab fa-amazon-pay', 'fab fa-amilia', 'fab fa-android', 'fab fa-angellist',
        'fab fa-angrycreative', 'fab fa-angular', 'fab fa-app-store', 'fab fa-app-store-ios', 'fab fa-apple',
        'fab fa-apple-pay', 'fab fa-artstation', 'fab fa-asymmetrik', 'fab fa-atlassian', 'fab fa-audible',
        'fab fa-autoprefixer', 'fab fa-avianex', 'fab fa-aviato', 'fab fa-aws', 'fab fa-bandcamp',
        'fab fa-behance', 'fab fa-behance-square', 'fab fa-bimobject', 'fab fa-bitbucket', 'fab fa-bitcoin',
        'fab fa-bity', 'fab fa-black-tie', 'fab fa-blackberry', 'fab fa-blogger', 'fab fa-blogger-b',
        'fab fa-bluetooth', 'fab fa-bluetooth-b', 'fab fa-bootstrap', 'fab fa-btc', 'fab fa-buffer',
        'fab fa-buromobelexperte', 'fab fa-buy-n-large', 'fab fa-buysellads', 'fab fa-canadian-maple-leaf',
        'fab fa-cc-amazon-pay', 'fab fa-cc-amex', 'fab fa-cc-apple-pay', 'fab fa-cc-diners-club',
        'fab fa-cc-discover', 'fab fa-cc-jcb', 'fab fa-cc-mastercard', 'fab fa-cc-paypal', 'fab fa-cc-stripe',
        'fab fa-cc-visa', 'fab fa-centercode', 'fab fa-centos', 'fab fa-chrome', 'fab fa-chromecast',
        'fab fa-cloudflare', 'fab fa-cloudscale', 'fab fa-cloudsmith', 'fab fa-cloudversify', 'fab fa-codepen',
        'fab fa-codiepie', 'fab fa-confluence', 'fab fa-connectdevelop', 'fab fa-contao', 'fab fa-cotton-bureau',
        'fab fa-cpanel', 'fab fa-creative-commons', 'fab fa-css3', 'fab fa-css3-alt', 'fab fa-cuttlefish',
        'fab fa-dailymotion', 'fab fa-dashcube', 'fab fa-deezer', 'fab fa-delicious', 'fab fa-deploydog',
        'fab fa-deskpro', 'fab fa-dev', 'fab fa-deviantart', 'fab fa-dhl', 'fab fa-diaspora',
        'fab fa-digg', 'fab fa-digital-ocean', 'fab fa-discord', 'fab fa-discourse', 'fab fa-dochub',
        'fab fa-docker', 'fab fa-draft2digital', 'fab fa-dribbble', 'fab fa-dribbble-square', 'fab fa-dropbox',
        'fab fa-drupal', 'fab fa-dyalog', 'fab fa-earlybirds', 'fab fa-ebay', 'fab fa-edge',
        'fab fa-edge-legacy', 'fab fa-elementor', 'fab fa-ello', 'fab fa-ember', 'fab fa-empire',
        'fab fa-envira', 'fab fa-erlang', 'fab fa-ethereum', 'fab fa-etsy', 'fab fa-evernote',
        'fab fa-expeditedssl', 'fab fa-facebook', 'fab fa-facebook-f', 'fab fa-facebook-messenger',
        'fab fa-facebook-square', 'fab fa-fantasy-flight-games', 'fab fa-fedex', 'fab fa-fedora', 'fab fa-figma',
        'fab fa-firefox', 'fab fa-firefox-browser', 'fab fa-first-order', 'fab fa-first-order-alt',
        'fab fa-firstdraft', 'fab fa-flickr', 'fab fa-flipboard', 'fab fa-fly', 'fab fa-font-awesome',
        'fab fa-font-awesome-alt', 'fab fa-font-awesome-flag', 'fab fa-fonticons', 'fab fa-fonticons-fi',
        'fab fa-fort-awesome', 'fab fa-fort-awesome-alt', 'fab fa-forumbee', 'fab fa-foursquare',
        'fab fa-free-code-camp', 'fab fa-freebsd', 'fab fa-fulcrum', 'fab fa-galactic-republic',
        'fab fa-galactic-senate', 'fab fa-get-pocket', 'fab fa-gg', 'fab fa-gg-circle', 'fab fa-git',
        'fab fa-git-alt', 'fab fa-git-square', 'fab fa-github', 'fab fa-github-alt', 'fab fa-github-square',
        'fab fa-gitkraken', 'fab fa-gitlab', 'fab fa-gitter', 'fab fa-glide', 'fab fa-glide-g',
        'fab fa-gofore', 'fab fa-google', 'fab fa-google-drive', 'fab fa-google-pay', 'fab fa-google-play',
        'fab fa-google-plus', 'fab fa-google-plus-g', 'fab fa-google-plus-square', 'fab fa-google-wallet',
        'fab fa-gratipay', 'fab fa-grav', 'fab fa-gripfire', 'fab fa-grunt', 'fab fa-guilded',
        'fab fa-gulp', 'fab fa-hacker-news', 'fab fa-hacker-news-square', 'fab fa-hackerrank', 'fab fa-hips',
        'fab fa-hire-a-helper', 'fab fa-hive', 'fab fa-hooli', 'fab fa-hornbill', 'fab fa-hotjar',
        'fab fa-houzz', 'fab fa-html5', 'fab fa-hubspot', 'fab fa-ideal', 'fab fa-imdb',
        'fab fa-instagram', 'fab fa-instagram-square', 'fab fa-intercom', 'fab fa-internet-explorer',
        'fab fa-invision', 'fab fa-ioxhost', 'fab fa-itch-io', 'fab fa-itunes', 'fab fa-itunes-note',
        'fab fa-java', 'fab fa-jedi-order', 'fab fa-jenkins', 'fab fa-jira', 'fab fa-joget',
        'fab fa-joomla', 'fab fa-js', 'fab fa-js-square', 'fab fa-jsfiddle', 'fab fa-kaggle',
        'fab fa-keybase', 'fab fa-keycdn', 'fab fa-kickstarter', 'fab fa-kickstarter-k', 'fab fa-korvue',
        'fab fa-laravel', 'fab fa-lastfm', 'fab fa-lastfm-square', 'fab fa-leanpub', 'fab fa-less',
        'fab fa-line', 'fab fa-linkedin', 'fab fa-linkedin-in', 'fab fa-linode', 'fab fa-linux',
        'fab fa-lyft', 'fab fa-magento', 'fab fa-mailchimp', 'fab fa-mandalorian', 'fab fa-markdown',
        'fab fa-mastodon', 'fab fa-maxcdn', 'fab fa-mdb', 'fab fa-medapps', 'fab fa-medium',
        'fab fa-medium-m', 'fab fa-medrt', 'fab fa-meetup', 'fab fa-megaport', 'fab fa-mendeley',
        'fab fa-microblog', 'fab fa-microsoft', 'fab fa-mix', 'fab fa-mixcloud', 'fab fa-mixer',
        'fab fa-mizuni', 'fab fa-modx', 'fab fa-monero', 'fab fa-napster', 'fab fa-neos',
        'fab fa-nimblr', 'fab fa-node', 'fab fa-node-js', 'fab fa-npm', 'fab fa-ns8',
        'fab fa-nutritionix', 'fab fa-odnoklassniki', 'fab fa-odnoklassniki-square', 'fab fa-old-republic',
        'fab fa-opencart', 'fab fa-openid', 'fab fa-opera', 'fab fa-optin-monster', 'fab fa-orcid',
        'fab fa-osi', 'fab fa-page4', 'fab fa-pagelines', 'fab fa-palfed', 'fab fa-patreon',
        'fab fa-paypal', 'fab fa-penny-arcade', 'fab fa-periscope', 'fab fa-phabricator', 'fab fa-phoenix-framework',
        'fab fa-phoenix-squadron', 'fab fa-php', 'fab fa-pinterest', 'fab fa-pinterest-p', 'fab fa-pinterest-square',
        'fab fa-playstation', 'fab fa-product-hunt', 'fab fa-pushed', 'fab fa-python', 'fab fa-qq',
        'fab fa-quinscape', 'fab fa-quora', 'fab fa-r-project', 'fab fa-raspberry-pi', 'fab fa-ravelry',
        'fab fa-react', 'fab fa-reacteurope', 'fab fa-readme', 'fab fa-rebel', 'fab fa-red-river',
        'fab fa-reddit', 'fab fa-reddit-alien', 'fab fa-reddit-square', 'fab fa-redhat', 'fab fa-renren',
        'fab fa-replyd', 'fab fa-researchgate', 'fab fa-resolving', 'fab fa-rev', 'fab fa-rocketchat',
        'fab fa-rockrms', 'fab fa-rust', 'fab fa-safari', 'fab fa-salesforce', 'fab fa-sass',
        'fab fa-schlix', 'fab fa-scribd', 'fab fa-searchengin', 'fab fa-sellcast', 'fab fa-sellsy',
        'fab fa-servicestack', 'fab fa-shirtsinbulk', 'fab fa-shopify', 'fab fa-shopware', 'fab fa-simplybuilt',
        'fab fa-sistrix', 'fab fa-sith', 'fab fa-sketch', 'fab fa-skyatlas', 'fab fa-skype',
        'fab fa-slack', 'fab fa-slack-hash', 'fab fa-slideshare', 'fab fa-snapchat', 'fab fa-snapchat-ghost',
        'fab fa-snapchat-square', 'fab fa-soundcloud', 'fab fa-sourcetree', 'fab fa-speakap', 'fab fa-speaker-deck',
        'fab fa-spotify', 'fab fa-squarespace', 'fab fa-stack-exchange', 'fab fa-stack-overflow',
        'fab fa-stackpath', 'fab fa-staylinked', 'fab fa-steam', 'fab fa-steam-square', 'fab fa-steam-symbol',
        'fab fa-sticker-mule', 'fab fa-strava', 'fab fa-stripe', 'fab fa-stripe-s', 'fab fa-studiovinari',
        'fab fa-stumbleupon', 'fab fa-stumbleupon-circle', 'fab fa-superpowers', 'fab fa-supple', 'fas fa-guitar',
    ];
}

const exportCategories = async () => {
    try {
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
            showNotification('error', 'Only root users can export categories');
            exportLoading.value = false;
            return;
        }

        window.open(`/api/affiliate/categories/export?token=${signature}`, '_blank');
        showNotification('success', 'Export started. Your download will begin shortly.');
    } catch (err) {
        console.error('Failed to export categories:', err);
        showNotification('error', err.message || 'Failed to export categories');
    } finally {
        exportLoading.value = false;
    }
}

// Function to toggle the more actions dropdown
const toggleMoreActionsDropdown = () => {
    showMoreActionsDropdown.value = !showMoreActionsDropdown.value;
}

// Function to open the file dialog for import
const openImportFileDialog = () => {
    // Trigger the hidden file input
    importFileInput.value.click();
}

// Function to handle file selection
const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's a JSON file
    if (file.type !== 'application/json') {
        showNotification('error', 'Please select a valid JSON file');
        event.target.value = ''; // Clear the input
        return;
    }

    // Read file contents
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);

            // Validate that it's an array of categories
            if (!Array.isArray(jsonData)) {
                showNotification('error', 'Invalid JSON format. Expected an array of categories.');
                return;
            }

            // Start import process
            startImport(jsonData);
        } catch (err) {
            console.error('Failed to parse JSON:', err);
            showNotification('error', 'Failed to parse JSON file');
        }
    };

    reader.onerror = () => {
        showNotification('error', 'Failed to read file');
    };

    reader.readAsText(file);
    event.target.value = ''; // Clear the input
}

// Function to start the import process
const startImport = (categories) => {
    // Reset progress
    importProgress.value = {
        current: 0,
        total: categories.length,
        percentage: 0,
        success: 0,
        failed: 0,
        currentItem: '',
        errorMessage: ''
    };

    // Show progress dialog
    showImportProgress.value = true;
    importInProgress.value = true;
    importFinished.value = false;
    importCancelled.value = false;

    // Start processing categories
    processCategories(categories);
}

// Function to process categories one by one
const processCategories = async (categories) => {
    for (let i = 0; i < categories.length; i++) {
        // Check if import was cancelled
        if (importCancelled.value) {
            break;
        }

        const category = categories[i];
        importProgress.value.current = i + 1;
        importProgress.value.percentage = Math.round((importProgress.value.current / importProgress.value.total) * 100);

        try {
            // Update current item being processed
            importProgress.value.currentItem = category.name || `Category ${i + 1}`;
            importProgress.value.errorMessage = '';

            // Check if category has required fields
            if (!category.name || !category.slug) {
                throw new Error('Category requires name and slug fields');
            }

            // Prepare category data for API
            const categoryData = {
                name: category.name.trim(),
                slug: category.slug.trim(),
                active: category.active !== undefined ? category.active : true,
                icon: category.icon || ''
            };

            // Insert category using API
            await affiliateClient.categories.insert(categoryData);

            // Update success count
            importProgress.value.success++;
        } catch (err) {
            console.error(`Failed to import category ${i + 1}:`, err);
            importProgress.value.failed++;
            importProgress.value.errorMessage = err.message || 'Failed to import category';

            // Small delay to let user see the error message
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Small delay to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Import completed
    importInProgress.value = false;
    importFinished.value = true;

    // Refresh category list after import
    refreshData();

    // Show notification
    if (importCancelled.value) {
        showNotification('info', `Import cancelled. ${importProgress.value.success} categories imported successfully.`);
    } else {
        showNotification('success', `Import completed. ${importProgress.value.success} categories imported successfully, ${importProgress.value.failed} failed.`);
    }
}

// Function to cancel the import
const cancelImport = () => {
    if (importInProgress.value) {
        importCancelled.value = true;
    } else {
        closeImportDialog();
    }
}

// Function to close the import dialog
const closeImportDialog = () => {
    showImportProgress.value = false;
    importCancelled.value = false;
}

onMounted(() => {
    // Add click-outside handling for search dropdown
    document.addEventListener('click', (event) => {
        const target = event.target
        if (!target.closest('[data-search-toggle]') && !target.closest('.absolute') && showSearchDropdown.value) {
            showSearchDropdown.value = false
        }

        // Handle more actions dropdown
        if (!target.closest('[data-more-actions-toggle]') && showMoreActionsDropdown.value) {
            showMoreActionsDropdown.value = false
        }
    })

    loadCategories()
})
</script>
