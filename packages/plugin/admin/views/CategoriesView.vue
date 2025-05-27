<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Categories</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span v-if="recalculatingCounts">
                        <svg class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Recalculating...
                    </span>
                    <span v-else>Refresh</span>
                </button>
                <!-- Add search button with dropdown -->
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
                        <div class="p-3 space-y-2">
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
                            <div>
                                <label class="block text-xs text-neutral-400 mb-1">Search in field:</label>
                                <select
                                    v-model="filters.searchField"
                                    class="bg-neutral-700 w-full h-8 border border-neutral-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="name">Name</option>
                                    <option value="slug">Slug</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Category
                </button>
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
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="categories.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
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
                                Posts
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                                Navigation
                            </th>
                            <th
                                @click="toggleSort('active')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Status
                                <span v-if="filters.sortBy === 'active'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="category in displayedCategories" :key="category.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="category.id">
                                {{ category.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <span :style="{ paddingLeft: category.depth * 20 + 'px' }" class="flex items-center">
                                    <button 
                                        v-if="category.hasChildren"
                                        @click.stop="toggleExpand(category.id)" 
                                        class="mr-2 text-neutral-500 hover:text-neutral-300 focus:outline-none"
                                        :aria-expanded="expandedCategories.has(category.id) ? 'true' : 'false'"
                                        :title="expandedCategories.has(category.id) ? 'Collapse' : 'Expand'"
                                    >
                                        <svg v-if="expandedCategories.has(category.id)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <span v-else-if="category.depth > 0 || (categories.filter(c => c.parentCategory === null).length > 1 && !category.hasChildren)" class="w-4 mr-2"></span> <!-- Espaçador para alinhar com itens que têm botão -->
                                    
                                    <span v-if="category.depth > 0 && !category.hasChildren && !category.children?.length" class="mr-1 text-neutral-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" transform="scale(0.1)" />
                                        </svg> <!-- Ícone de item/documento muito pequeno, quase um ponto -->
                                    </span>
                                    <span class="mr-1 text-neutral-500" v-if="category.depth > 0 && (category.hasChildren || category.children?.length)">↳</span>
                                    {{ category.name }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ category.postCount || 0 }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 hidden md:table-cell">
                                <div v-if="category.mainNav" 
                                     class="flex items-center" 
                                     :title="`Label: ${category.navigationLabel || category.name}\nGroup: ${category.mainNavGroup || 'N/A'}\nOrder: ${category.mainNavIndex !== undefined ? category.mainNavIndex : 'N/A'}`">
                                    <span class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        <span class="text-xs">{{ category.mainNavIndex !== undefined ? category.mainNavIndex : '-' }}</span>
                                    </span>
                                </div>
                                <span v-else class="flex items-center justify-center">-</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                    class="px-2 py-1 text-xs font-medium rounded-full"
                                    :class="category.active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'"
                                >
                                    {{ category.active ? 'Active' : 'Inactive' }}
                                </span>
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
                                    <!-- Change copy URL button to view category button -->
                                    <button
                                        @click="viewCategory(category)"
                                        title="View Category"
                                        class="text-neutral-400 hover:text-blue-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

                <!-- Tab Navigation -->
                <div class="px-6 pt-4 border-b border-neutral-700 flex space-x-1">
                    <button 
                        type="button"
                        @click="activeTab = 'basic'"
                        :class="[
                            'px-4 py-2 text-sm font-medium rounded-t-md',
                            activeTab === 'basic' 
                                ? 'bg-neutral-700 text-white' 
                                : 'text-neutral-400 hover:bg-neutral-750 hover:text-neutral-200'
                        ]"
                    >
                        Basic Info
                    </button>
                    <button 
                        type="button"
                        @click="activeTab = 'navigation'"
                        :class="[
                            'px-4 py-2 text-sm font-medium rounded-t-md',
                            activeTab === 'navigation' 
                                ? 'bg-neutral-700 text-white' 
                                : 'text-neutral-400 hover:bg-neutral-750 hover:text-neutral-200'
                        ]"
                    >
                        Navigation
                    </button>
                </div>

                <div class="p-6">
                    <form @submit.prevent="saveCategory">
                        <!-- Basic Info Tab -->
                        <div v-show="activeTab === 'basic'" class="space-y-4">
                            <div class="mb-4">
                                <label for="categoryName" class="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                                <input
                                    id="categoryName"
                                    v-model="categoryForm.name"
                                    @input="updateSlugAndLabel"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Category name"
                                    required
                                />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="categorySlug" class="block text-sm font-medium text-neutral-300 mb-1">Slug</label>
                                <input
                                    id="categorySlug"
                                    v-model="categoryForm.slug"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="category-slug"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">URL: /category/<span class="text-blue-400">{{ categoryForm.slug || 'your-slug' }}</span></p>
                                <p v-if="formErrors.slug" class="mt-1 text-sm text-red-500">{{ formErrors.slug }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="parentCategory" class="block text-sm font-medium text-neutral-300 mb-1">Parent Category (optional)</label>
                                <select
                                    id="parentCategory"
                                    v-model="categoryForm.parentCategory"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">None</option>
                                    <option v-for="category in allCategoriesForDropdown" :key="category.id" :value="category.id">
                                        {{ category.name }}
                                    </option>
                                </select>
                            </div>

                            <div class="mb-4 flex items-center">
                                <input
                                    id="categoryActive"
                                    v-model="categoryForm.active"
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-neutral-600 text-blue-600 focus:ring-blue-500 bg-neutral-700"
                                />
                                <label for="categoryActive" class="ml-2 block text-sm text-neutral-300">
                                    Active
                                </label>
                            </div>
                        </div>

                        <!-- Navigation Tab -->
                        <div v-show="activeTab === 'navigation'" class="space-y-4">
                            <div class="mb-4">
                                <label for="navigationLabel" class="block text-sm font-medium text-neutral-300 mb-1">Navigation Label (optional)</label>
                                <input
                                    id="navigationLabel"
                                    v-model="categoryForm.navigationLabel"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Custom navigation label"
                                />
                            </div>

                            <div class="mb-4 flex items-center">
                                <input
                                    id="categoryMainNav"
                                    v-model="categoryForm.mainNav"
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-neutral-600 text-blue-600 focus:ring-blue-500 bg-neutral-700"
                                />
                                <label for="categoryMainNav" class="ml-2 block text-sm text-neutral-300">
                                    Show in Main Navigation
                                </label>
                            </div>

                            <div class="mb-4">
                                <label for="categoryMainNavGroup" class="block text-sm font-medium text-neutral-300 mb-1">Navigation Group (optional)</label>
                                <input
                                    id="categoryMainNavGroup"
                                    v-model="categoryForm.mainNavGroup"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Group name for navigation"
                                />
                                <p class="mt-1 text-sm text-neutral-500">Used to create navigation dropdown groups</p>
                            </div>

                            <div class="mb-4">
                                <label for="categoryMainNavIndex" class="block text-sm font-medium text-neutral-300 mb-1">Navigation Order</label>
                                <input
                                    id="categoryMainNavIndex"
                                    v-model.number="categoryForm.mainNavIndex"
                                    type="number"
                                    min="0"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="0"
                                />
                                <p class="mt-1 text-sm text-neutral-500">Lower numbers appear first in navigation</p>
                                <p v-if="formErrors.mainNavIndex" class="mt-1 text-sm text-red-500">{{ formErrors.mainNavIndex }}</p>
                            </div>
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
            warning-text="This action cannot be undone. All posts associated with this category may be affected."
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAdminClient } from '@cmmv/blog/admin/client'
import Pagination from '../components/Pagination.vue'
import DeleteDialog from '../components/DeleteDialog.vue'
import ToastNotification from '../components/ToastNotification.vue'

const adminClient = useAdminClient()

const categories = ref([])
const allCategoriesForDropdown = ref([])
const loading = ref(true)
const error = ref(null)

const showDialog = ref(false)
const isEditing = ref(false)
const categoryForm = ref({
    name: '',
    slug: '',
    parentCategory: '',
    navigationLabel: '',
    active: true,
    mainNav: false,
    mainNavGroup: '',
    mainNavIndex: 0
})
const categoryToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const categoryToDelete = ref(null)
const deleteLoading = ref(false)

const recalculatingCounts = ref(false);

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 3000
})

const pagination = ref({
    current: 1,
    lastPage: 1,
    perPage: 50,
    total: 0,
    from: 1,
    to: 50
})

const filters = ref({
    search: '',
    searchField: 'name',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1
})

const blogUrl = ref('');

const showSearchDropdown = ref(false)
const searchInput = ref(null)

const activeTab = ref('basic'); // 'basic' or 'navigation'

const expandedCategories = ref(new Set());

const toggleExpand = (categoryId) => {
    if (expandedCategories.value.has(categoryId)) {
        expandedCategories.value.delete(categoryId);
    } else {
        expandedCategories.value.add(categoryId);
    }
    // É importante que o Vue reaja à mudança no Set. 
    // Forçar uma reatribuição pode ser necessário em alguns casos, mas Set é geralmente reativo.
    // expandedCategories.value = new Set(expandedCategories.value); 
};

function toggleSearchDropdown() {
    showSearchDropdown.value = !showSearchDropdown.value

    if (showSearchDropdown.value) {
        nextTick(() => {
            searchInput.value?.focus()
        })
    }
}

function clearSearch() {
    filters.value.search = ''
    filters.value.page = 1
    loadCategories()
    showSearchDropdown.value = false
}

const loadBlogUrl = async () => {
    try {
        const settings = await adminClient.settings.getRoot();
        const urlSetting = settings.find(s => s.key === 'blog.url');

        if (urlSetting)
            blogUrl.value = urlSetting.value.replace(/\/$/, '');
    } catch (err) {
        console.error('Failed to load blog URL:', err);
        blogUrl.value = '';
    }
};

const paginationPages = computed(() => {
    const totalPages = pagination.value.lastPage

    if (totalPages <= 5)
        return Array.from({ length: totalPages }, (_, i) => i + 1)

    const current = pagination.value.current
    const pages = [1]

    if (current > 2) pages.push('...')

    if (current > 1 && current < totalPages) pages.push(current)

    if (current < totalPages - 1) pages.push('...')

    if (totalPages > 1) pages.push(totalPages)

    return pages
})

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
            apiFilters.searchField = filters.value.searchField
        }

        const response = await adminClient.categories.get(apiFilters)

        if (response && response.data) {
            categories.value = response.data || []

            const paginationData = response.pagination || {}
            const totalCount = response.count || 0
            const currentOffset = paginationData.offset || 0
            const currentLimit = paginationData.limit || 50;

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
                perPage: 50,
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

const loadAllCategoriesForDropdown = async () => {
    try {
        const apiFilters = {
            limit: 1000,
            offset: 0,
            sortBy: 'name',
            sort: 'asc',
        }

        const response = await adminClient.categories.get(apiFilters)

        if (response && response.data) {
            if (isEditing.value && categoryToEdit.value) {
                allCategoriesForDropdown.value = response.data.filter(cat => cat.id !== categoryToEdit.value.id) || []
            } else {
                allCategoriesForDropdown.value = response.data || []
            }
        } else {
            allCategoriesForDropdown.value = []
        }
    } catch (err) {
        console.error('Failed to load all categories for dropdown:', err)
        showNotification('error', 'Failed to load categories for dropdown')
    }
}

// Refresh data
const refreshData = async () => {
    if (recalculatingCounts.value) return; // Evita múltiplas chamadas

    recalculatingCounts.value = true;
    showNotification('info', 'Recalculating post counts...');

    try {
        // Assumindo que você adicionará este método ao seu adminClient
        // Exemplo: await adminClient.posts.recalculateCategoryCounts(); 
        // Por enquanto, vamos simular a chamada direta se você não tiver o client atualizado ainda:
        await adminClient.posts.recalculateCategoryCounts();
        showNotification('success', 'Post counts recalculated. Refreshing list...');
    } catch (err) {
        console.error('Failed to recalculate post counts:', err);
        showNotification('error', err.message || 'Failed to trigger post count recalculation');
        // Mesmo se o recálculo falhar, ainda tentamos carregar as categorias
    } finally {
        recalculatingCounts.value = false;
    }

    // Carrega as categorias após a tentativa de recálculo
    await loadCategories();
    // Opcionalmente, recarregar todas as categorias para o dropdown se as contagens são usadas lá
    // await loadAllCategoriesForDropdown(); 
};

// Pagination methods
const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

// Watch for filter changes
watch(filters, () => {
    loadCategories()
}, { deep: true })

// Dialog methods
const openAddDialog = () => {
    isEditing.value = false
    activeTab.value = 'basic'; // Default to basic tab
    categoryForm.value = {
        name: '',
        _previousName: '',
        slug: '',
        parentCategory: '',
        navigationLabel: '',
        active: true,
        mainNav: false,
        mainNavGroup: '',
        mainNavIndex: 0
    }
    formErrors.value = {}
    loadAllCategoriesForDropdown()
    showDialog.value = true
}

const openEditDialog = (category) => {
    isEditing.value = true
    activeTab.value = 'basic'; // Default to basic tab, user can switch
    categoryToEdit.value = category
    categoryForm.value = {
        name: category.name,
        _previousName: category.name,
        slug: category.slug,
        parentCategory: category.parentCategory || '',
        navigationLabel: category.navigationLabel || category.name,
        active: category.active !== undefined ? category.active : true,
        mainNav: category.mainNav !== undefined ? category.mainNav : false,
        mainNavGroup: category.mainNavGroup || '',
        mainNavIndex: category.mainNavIndex !== undefined ? category.mainNavIndex : 0
    }
    formErrors.value = {}
    loadAllCategoriesForDropdown()
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    activeTab.value = 'basic'; // Reset tab on close
    categoryForm.value = {
        name: '',
        _previousName: '',
        slug: '',
        parentCategory: '',
        navigationLabel: '',
        active: true,
        mainNav: false,
        mainNavGroup: '',
        mainNavIndex: 0
    }
    formErrors.value = {}
    categoryToEdit.value = null
}

const validateNavOrder = () => {
    if (!categoryForm.value.mainNav || categoryForm.value.mainNavIndex === undefined || categoryForm.value.mainNavIndex === null) {
        delete formErrors.value.mainNavIndex; // Clear error if not applicable
        return true;
    }

    const currentIndex = Number(categoryForm.value.mainNavIndex);
    const currentParentId = categoryForm.value.parentCategory || null;
    const currentCategoryId = categoryToEdit.value?.id || null; // For excluding self during edit

    const conflictingCategory = allCategoriesForDropdown.value.find(cat => {
        // Skip self when editing
        if (isEditing.value && cat.id === currentCategoryId) {
            return false;
        }

        // Only consider active for main navigation
        if (!cat.mainNav) {
            return false;
        }

        const catParentId = cat.parentCategory || null;
        const catNavIndex = Number(cat.mainNavIndex);

        // Check for same index within the same parent or at root level
        return catParentId === currentParentId && catNavIndex === currentIndex;
    });

    if (conflictingCategory) {
        formErrors.value.mainNavIndex = `Order ${currentIndex} is already used by "${conflictingCategory.name}" within the same parent/level.`;
        return false;
    }

    delete formErrors.value.mainNavIndex; // Clear error if validation passes
    return true;
};

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
            formErrors.value.slug = 'Category slug is required'
            formLoading.value = false
            return
        }

        // Validate Navigation Order
        if (!validateNavOrder()) {
            formLoading.value = false;
            activeTab.value = 'navigation'; // Switch to navigation tab if there's an error there
            showNotification('error', 'Please fix validation errors in the Navigation tab.');
            return;
        }

        const { _previousName, ...categoryData } = {
            name: categoryForm.value.name.trim(),
            slug: categoryForm.value.slug.trim(),
            active: categoryForm.value.active,
            parentCategory: categoryForm.value.parentCategory || null,
            navigationLabel: categoryForm.value.navigationLabel.trim() || null,
            mainNav: categoryForm.value.mainNav,
            mainNavGroup: categoryForm.value.mainNavGroup.trim() || null,
            mainNavIndex: categoryForm.value.mainNavIndex || 0
        }

        if (isEditing.value) {
            await adminClient.categories.update(categoryToEdit.value.id, categoryData)
            showNotification('success', 'Category updated successfully')
        } else {
            await adminClient.categories.insert(categoryData)
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
        await adminClient.categories.delete(categoryToDelete.value.id)
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

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'

    try {
        const date = new Date(timestamp)
        if (isNaN(date.getTime())) return 'N/A'
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch (err) {
        console.error('Date formatting error:', err, timestamp)
        return 'N/A'
    }
}

const toggleSort = (column) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        filters.value.sortBy = column
        filters.value.sortOrder = 'asc'
    }
}

onMounted(() => {
    loadCategories()
    loadAllCategoriesForDropdown()
    loadBlogUrl()

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })
})

const updateSlugAndLabel = () => {
    categoryForm.value.slug = generateSlug(categoryForm.value.name)

    if (!categoryForm.value.navigationLabel ||
        categoryForm.value.navigationLabel === categoryToEdit?.value?.name ||
        categoryForm.value.navigationLabel === categoryForm.value._previousName) {
        categoryForm.value.navigationLabel = categoryForm.value.name
    }

    categoryForm.value._previousName = categoryForm.value.name
}

const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/&/g, '-and-')      // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
        .replace(/\-\-+/g, '-')      // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
}

// Add view category function
const viewCategory = (category) => {
    if (!blogUrl.value) {
        showNotification('error', 'Blog URL is not available');
        return;
    }

    const url = `${blogUrl.value}/category/${category.slug}`;
    console.log('Opening category URL:', url); // For debugging
    window.open(url, '_blank');
}

// Função para ajudar a construir a árvore (ou lista ordenada com profundidade)
const buildCategoryHierarchy = (categoriesRaw) => {
    if (!categoriesRaw || categoriesRaw.length === 0) return [];

    const categoriesMap = new Map();
    categoriesRaw.forEach(cat => {
        categoriesMap.set(cat.id, { ...cat, children: [], _visited: false });
    });

    const tree = [];
    categoriesRaw.forEach(catRaw => {
        const catNode = categoriesMap.get(catRaw.id);
        if (catRaw.parentCategory && categoriesMap.has(catRaw.parentCategory)) {
            const parentNode = categoriesMap.get(catRaw.parentCategory);
            if (parentNode) { // Certifique-se de que o pai existe no mapa
                // Adicionamos a informação se tem filhos diretamente no nó para facilitar no template
                catNode.hasChildren = catNode.children && catNode.children.length > 0;
                parentNode.children.push(catNode);
                parentNode.hasChildren = true; 
            }
        } else {
            catNode.hasChildren = catNode.children && catNode.children.length > 0;
            tree.push(catNode); // Categoria de nível superior
        }
    });

    const flattenedList = [];
    function flatten(nodes, depth) {
        nodes.sort((a, b) => {
            const aHasNav = a.mainNav && (a.mainNavIndex !== undefined && a.mainNavIndex !== null);
            const bHasNav = b.mainNav && (b.mainNavIndex !== undefined && b.mainNavIndex !== null);

            if (aHasNav && bHasNav) {
                if (a.mainNavIndex !== b.mainNavIndex) {
                    return Number(a.mainNavIndex) - Number(b.mainNavIndex);
                }
            } else if (aHasNav) {
                return -1; // a vem primeiro
            } else if (bHasNav) {
                return 1;  // b vem primeiro
            }
            return a.name.localeCompare(b.name);
        });
        
        for (const node of nodes) {
            if (node._visited && !flattenedList.find(n => n.id === node.id)) {
                 // Se já visitado mas não está na lista (acontece se um pai foi recolhido e depois reexpandido)
                 // precisamos resetar _visited para reprocessar seus filhos se ele estiver expandido agora.
                 // No entanto, a lógica atual de _visited é para evitar loops infinitos em estruturas malformadas,
                 // o que não deveria ser o caso aqui. Vamos simplificar e remover _visited por enquanto
                 // já que a estrutura é uma árvore a partir das raízes.
            }
            // node._visited = true; // Removendo _visited por enquanto
            node.depth = depth;
            // Adiciona a informação se tem filhos no nó achatado, para o template
            // Esta já foi definida quando construímos categoriesMap e tree.
            // node.hasChildren = categoriesMap.get(node.id)?.children?.length > 0;
            flattenedList.push(node);

            // Só achata os filhos se o nó atual estiver expandido e tiver filhos
            if (expandedCategories.value.has(node.id) && node.children && node.children.length > 0) {
                flatten(node.children, depth + 1);
            }
        }
    }

    // Processar nós raiz (aqueles sem pai ou cujo pai não está no mapa)
    const rootNodes = Array.from(categoriesMap.values()).filter(node => !node.parentCategory || !categoriesMap.has(node.parentCategory));
    rootNodes.forEach(rn => rn.hasChildren = rn.children && rn.children.length > 0); // Garante que hasChildren está setado para raízes

    flatten(rootNodes, 0);
    
    // Limpar _visited não é mais necessário
    // flattenedList.forEach(node => delete node._visited);

    return flattenedList;
};

const displayedCategories = computed(() => {
    if (categories.value && categories.value.length > 0) {
        // Usar deep copy para não mutar o ref original ou causar loops de re-renderização infinitos
        return buildCategoryHierarchy(JSON.parse(JSON.stringify(categories.value)));
    }
    return [];
});
</script>
