<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Prompts</h1>
            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button @click="refreshData" class="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
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
                                    placeholder="Search prompts..."
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
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Prompt
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="bg-neutral-800 rounded-lg p-12 flex justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-neutral-400">Loading prompts...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-neutral-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-neutral-300 mb-2">Failed to load prompts</p>
            <p class="text-neutral-400 text-sm mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Try Again
            </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="prompts.length === 0" class="bg-neutral-800 rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            <p class="text-neutral-300 mb-2">No prompts found</p>
            <p class="text-neutral-400 text-sm mb-4">Get started by creating your first prompt</p>
            <button @click="openAddDialog" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                Add Prompt
            </button>
        </div>

        <!-- Prompts table -->
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
                                Temp
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                                Top
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                                Max
                            </th>
                            <th
                                @click="toggleSort('relevance')"
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            >
                                Relv
                                <span v-if="filters.sortBy === 'relevance'" class="ml-1">
                                    {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="prompt in prompts" :key="prompt.id" class="hover:bg-neutral-750">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400" :title="prompt.id">
                                {{ prompt.id.substring(0, 6) }}...
                            </td>
                            <td class="px-6 py-4 text-sm text-white">
                                <div class="max-w-xs truncate font-medium">{{ prompt.name || 'Unnamed Prompt' }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ prompt.temperature }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 hidden md:table-cell">
                                {{ prompt.topP }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 hidden md:table-cell">
                                {{ prompt.maxTokens }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                {{ prompt.relevance }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end space-x-2">
                                    <button
                                        @click="openEditDialog(prompt)"
                                        title="Edit"
                                        class="text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="confirmDelete(prompt)"
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
            itemName="prompts"
            @pageChange="handlePageChange"
        />

        <!-- Add/Edit Prompt Dialog -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-5xl mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Edit Prompt' : 'Add Prompt' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <form @submit.prevent="savePrompt" class="flex flex-col md:flex-row gap-6">
                        <!-- Left column - all fields except Prompt Text -->
                        <div class="flex-1">
                            <div class="mb-6">
                                <label for="promptName" class="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                                <input
                                    id="promptName"
                                    v-model="promptForm.name"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter a name for this prompt"
                                    required
                                />
                                <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
                            </div>

                            <div class="mb-6">
                                <label for="temperature" class="block text-sm font-medium text-neutral-300 mb-1">Temperature ({{ promptForm.temperature }})</label>
                                <input
                                    id="temperature"
                                    v-model.number="promptForm.temperature"
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    class="w-full bg-neutral-700 rounded-md appearance-none cursor-pointer"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">Controls randomness: Lower values are more deterministic, higher values more creative.</p>
                                <p v-if="formErrors.temperature" class="mt-1 text-sm text-red-500">{{ formErrors.temperature }}</p>
                            </div>

                            <div class="mb-6">
                                <label for="topP" class="block text-sm font-medium text-neutral-300 mb-1">Top P ({{ promptForm.topP }})</label>
                                <input
                                    id="topP"
                                    v-model.number="promptForm.topP"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    class="w-full bg-neutral-700 rounded-md appearance-none cursor-pointer"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">Alternative to temperature, controls diversity via nucleus sampling.</p>
                                <p v-if="formErrors.topP" class="mt-1 text-sm text-red-500">{{ formErrors.topP }}</p>
                            </div>

                            <div class="mb-6">
                                <label for="maxTokens" class="block text-sm font-medium text-neutral-300 mb-1">Max Tokens</label>
                                <input
                                    id="maxTokens"
                                    v-model.number="promptForm.maxTokens"
                                    type="number"
                                    min="1"
                                    max="32000"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Max tokens to generate"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">The maximum number of tokens to generate.</p>
                                <p v-if="formErrors.maxTokens" class="mt-1 text-sm text-red-500">{{ formErrors.maxTokens }}</p>
                            </div>

                            <div class="mb-6">
                                <label for="relevance" class="block text-sm font-medium text-neutral-300 mb-1">Relevance</label>
                                <input
                                    id="relevance"
                                    v-model.number="promptForm.relevance"
                                    type="number"
                                    min="1"
                                    max="10"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Relevance score (1-10)"
                                    required
                                />
                                <p class="mt-1 text-sm text-neutral-500">Priority relevance score from 1-10.</p>
                                <p v-if="formErrors.relevance" class="mt-1 text-sm text-red-500">{{ formErrors.relevance }}</p>
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
                        </div>

                        <!-- Right column - just the Prompt Text -->
                        <div class="flex-1 flex flex-col">
                            <label for="promptText" class="block text-sm font-medium text-neutral-300 mb-1">Prompt Text</label>
                            <textarea
                                id="promptText"
                                v-model="promptForm.prompt"
                                class="flex-1 min-h-[500px] w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="Enter your prompt text"
                                required
                            ></textarea>
                            <p v-if="formErrors.prompt" class="mt-1 text-sm text-red-500">{{ formErrors.prompt }}</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <DeleteDialog
            :show="showDeleteDialog"
            :item-name="promptToDelete?.prompt ? promptToDelete.prompt.substring(0, 30) + (promptToDelete.prompt.length > 30 ? '...' : '') : ''"
            :loading="deleteLoading"
            message="Are you sure you want to delete the prompt"
            warning-text="This action cannot be undone."
            loading-text="Deleting..."
            @confirm="deletePrompt"
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

const prompts = ref([])
const loading = ref(true)
const error = ref(null)
const defaultPrompt = ref(`2. Creating an engaging title that captures the essence of the content (keep it under 80 characters)
3. Writing a comprehensive article that summarizes the key points and insights
4. Adding context, background information, and your own analysis to enhance the content
5. Preserving important links to sources and reference pages, but adding rel="noindex nofollow" attributes to all links
6. Creating a well-structured HTML article using proper formatting:
    - Use <h2> tags for main sections (2-4 sections recommended)
    - Use <p> tags for paragraphs
    - Use <ul> and <li> tags for lists where appropriate
    - Include a concluding paragraph
    - For links, use: <a href="https://example.com" rel="noindex nofollow" target="_blank">text</a>
7. Start with a strong introductory paragraph
8. Suggesting 3-8 relevant tags for categorizing this content
9. Properly extract and handle all images from the content by following these rules:
    - ONLY use images that exist in the original post - DO NOT create or generate new images that don't exist
    - Extract the best quality image URL from image tags
    - For images with srcset attribute, choose the largest/highest resolution option
    - For WordPress images with data-src or data-srcset, use the src attribute value if available
    - When encountering relative image paths, convert them to absolute URLs using the provided base URL
    - Preserve alt text from original images
    - Format image tags like: <img src="https://example.com/image.jpg" alt="Description" loading="lazy" />
    - Do not include width and height attributes unless absolutely necessary
    - For each image, determine if it's the main/feature image of the article

IMAGE EXTRACTION EXAMPLE:
From a complex WordPress image tag like:
<img decoding="async" src="https://example.com/image-1200x675.webp" alt="Description" data-src="https://example.com/image-1200x675.webp" data-srcset="https://example.com/image-1200x675.webp 1200w, https://example.com/image-640x360.webp 640w, https://example.com/image.webp 1280w" srcset="https://example.com/image-1200x675.webp 1200w, https://example.com/image.webp 1280w">

Extract the highest resolution image URL (in this case: https://example.com/image.webp) and output:
<img src="https://example.com/image.webp" alt="Description" loading="lazy" />

IMPORTANT:
- For titles, DO NOT default to number-based formats (like "5 Ways to..." or "10 Tips for...")
- Only use numbered titles when the content specifically warrants it (such as step-by-step guides or ranked lists)
- Prefer descriptive, narrative or question-based titles that engage readers without relying on numbers
- Avoid sensationalist or clickbait headlines
- IMPORTANT: AVOID clickbait phrases like "The Secret", "Discover", "You Won't Believe", "This Is Why", etc.
- Focus on straightforward, informative titles that clearly communicate the article's value

For titles, prioritize these natural headline formulas:

1. The "How-To Formula":
How to [Achieve Desired Outcome] without [Common Pain Point]

Examples:
- "How to Lose Weight While Still Enjoying Your Meals"
- "How to Learn a New Language with Just 15 Minutes Daily"
- "How to Begin Investing with Minimal Risk"

2. The "Question Formula":
[Straightforward Question That Promises an Answer]?

Examples:
- "What Should You Consider When Buying a New Smartphone?"
- "Are These Skincare Habits Damaging Your Skin?"
- "What Makes Homemade Pizza Better Than Takeout?"

3. The "Practical Insight Formula":
What [Experts/Experience] Teaches About [Topic]

Examples:
- "What Dermatologists Recommend for Healthy Skin"
- "What Professional Bakers Know About Perfect Sourdough"
- "What Travel Experience Reveals About Finding Affordable Flights"

4. The "Why Formula":
Why [Common Belief/Practice] May Not Work and What to Try Instead

Examples:
- "Why Traditional Dieting Often Doesn't Work Long-Term"
- "Why Your Coffee Brewing Method Matters for Flavor"
- "Why Home Security Goes Beyond Just Installing Cameras"

5. The "Comparison Formula":
[Product/Method A] vs [Product/Method B]: Choosing the Right Option for [Goal]

Examples:
- "Air Fryers vs Convection Ovens: Choosing the Right Kitchen Tool"
- "Morning vs Evening Exercise: Fitting Workouts Into Your Schedule"
- "Savings vs Investments: Building Your Financial Foundation"

6. The "Straightforward Guide":
A Practical Guide to [Topic] for [Target Audience]

Examples:
- "A Practical Guide to Home Automation for Beginners"
- "A Realistic Approach to Personal Finance for Young Professionals"
- "A Beginner's Handbook for Smartphone Photography"

7. The "Helpful Advice Formula":
Important Considerations About [Topic] You Should Know

Examples:
- "Important Password Security Practices Worth Implementing"
- "Kitchen Habits That Can Help Reduce Your Grocery Budget"
- "Skincare Ingredients That Might Not Be Right for Your Skin Type"

8. The "Experience-Based Formula":
What I Learned About [Topic] After [Time Period/Experience]

Examples:
- "What I Learned About Remote Work After Three Years"
- "My Experience With Minimalism After Downsizing My Home"
- "Insights From Growing My Own Vegetables For a Full Season"

9. The "Informative Formula":
[Topic]: Understanding [Key Aspect] for Better [Outcome]

Examples:
- "Bluetooth Speakers: Understanding Audio Quality for Better Outdoor Sound"
- "Gaming Chairs: Evaluating Comfort Features for Long Sessions"
- "Noise-Canceling Headphones: Comparing Technologies for Work-from-Home"

IMPORTANT - MAKING TEXT HUMAN-LIKE:
- DO NOT follow a rigid, predictable structure for all articles
- Vary paragraph lengths considerably - mix very short (1-2 sentences) with medium and longer paragraphs
- Insert occasional rhetorical questions to engage the reader
- Include personal opinions or perspectives with phrases like "In my experience," or "I believe"
- Use varied sentence structures - simple, compound, and complex sentences
- Add occasional humor, metaphors, or analogies where appropriate
- Include some conversational elements like contractions, colloquial phrases, or asking the reader questions
- Randomize section lengths rather than making them all similar size
- Sometimes break traditional writing rules (like starting with "And" or "But")
- Vary transitions between paragraphs (don't always use the same connecting phrases)
- Insert occasional first-person anecdotes or stories to illustrate points
- Use asides or parenthetical comments to add personality
- Vary vocabulary richness - mix simple terms with occasional technical or sophisticated language
- Avoid overly perfect structures that sound AI-generated
- Sometimes digress briefly before returning to the main point
- Add occasional expressions of emotion ("I was surprised to learn that..." or "It's frustrating when...")`)

const showDialog = ref(false)
const isEditing = ref(false)
const promptForm = ref({
    name: '',
    prompt: '',
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 8000,
    relevance: 5
})
const promptToEdit = ref(null)
const formErrors = ref({})
const formLoading = ref(false)

const showDeleteDialog = ref(false)
const promptToDelete = ref(null)
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
    loadPrompts()
    showSearchDropdown.value = false
}

const loadPrompts = async () => {
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
        }

        const response = await adminClient.prompts.get(apiFilters)

        if (response && response.data) {
            prompts.value = response.data || []

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
            prompts.value = []
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
        console.error('Failed to load prompts:', err)
        loading.value = false
        error.value = err.message || 'Failed to load prompts'
        showNotification('error', 'Failed to load prompts')
    }
}

const refreshData = () => {
    loadPrompts()
}

const handlePageChange = (newPage) => {
    filters.value.page = newPage;
}

watch(filters, () => {
    loadPrompts()
}, { deep: true })

const openAddDialog = () => {
    isEditing.value = false
    promptForm.value = {
        name: '',
        prompt: defaultPrompt,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 8000,
        relevance: 5
    }
    formErrors.value = {}
    showDialog.value = true
}

const openEditDialog = (prompt) => {
    isEditing.value = true
    promptToEdit.value = prompt
    promptForm.value = {
        name: prompt.name || '',
        prompt: prompt.prompt,
        temperature: prompt.temperature !== undefined ? prompt.temperature : 0.7,
        topP: prompt.topP !== undefined ? prompt.topP : 0.9,
        maxTokens: prompt.maxTokens !== undefined ? prompt.maxTokens : 1024,
        relevance: prompt.relevance !== undefined ? prompt.relevance : 5
    }
    formErrors.value = {}
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    promptForm.value = {
        name: '',
        prompt: '',
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 1024,
        relevance: 5
    }
    formErrors.value = {}
    promptToEdit.value = null
}

const savePrompt = async () => {
    try {
        formLoading.value = true
        formErrors.value = {}

        if (!promptForm.value.name.trim()) {
            formErrors.value.name = 'Prompt name is required'
            formLoading.value = false
            return
        }

        if (!promptForm.value.prompt.trim()) {
            formErrors.value.prompt = 'Prompt text is required'
            formLoading.value = false
            return
        }

        if (promptForm.value.temperature < 0 || promptForm.value.temperature > 2) {
            formErrors.value.temperature = 'Temperature must be between 0 and 2'
            formLoading.value = false
            return
        }

        if (promptForm.value.topP < 0 || promptForm.value.topP > 1) {
            formErrors.value.topP = 'Top P must be between 0 and 1'
            formLoading.value = false
            return
        }

        if (promptForm.value.maxTokens < 1) {
            formErrors.value.maxTokens = 'Max tokens must be at least 1'
            formLoading.value = false
            return
        }

        if (promptForm.value.relevance < 1 || promptForm.value.relevance > 10) {
            formErrors.value.relevance = 'Relevance must be between 1 and 10'
            formLoading.value = false
            return
        }

        const promptData = {
            name: promptForm.value.name.trim(),
            prompt: promptForm.value.prompt.trim(),
            temperature: parseFloat(promptForm.value.temperature),
            topP: parseFloat(promptForm.value.topP),
            maxTokens: parseInt(promptForm.value.maxTokens),
            relevance: parseInt(promptForm.value.relevance)
        }

        if (isEditing.value) {
            await adminClient.prompts.update(promptToEdit.value.id, promptData)
            showNotification('success', 'Prompt updated successfully')
        } else {
            await adminClient.prompts.create(promptData)
            showNotification('success', 'Prompt created successfully')
        }

        formLoading.value = false
        closeDialog()
        refreshData()
    } catch (err) {
        formLoading.value = false

        if (err.response?.data?.errors)
            formErrors.value = err.response.data.errors
        else
            showNotification('error', err.message || 'Failed to save prompt')
    }
}

const confirmDelete = (prompt) => {
    promptToDelete.value = prompt
    showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    promptToDelete.value = null
}

const deletePrompt = async () => {
    if (!promptToDelete.value) return

    try {
        deleteLoading.value = true
        await adminClient.prompts.delete(promptToDelete.value.id)
        deleteLoading.value = false
        closeDeleteDialog()
        showNotification('success', 'Prompt deleted successfully')
        refreshData()
    } catch (err) {
        deleteLoading.value = false
        console.error('Failed to delete prompt:', err)
        showNotification('error', err.message || 'Failed to delete prompt')
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

onMounted(() => {
    loadPrompts()

    document.addEventListener('click', (e) => {
        if (showSearchDropdown.value && !e.target.closest('.relative')
            && e.target !== document.querySelector('button[data-search-toggle]')) {
            showSearchDropdown.value = false
        }
    })
})
</script>
