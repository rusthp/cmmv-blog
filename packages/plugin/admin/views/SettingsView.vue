<template>
    <div class="-m-4 h-screen overflow-hidden">
        <div v-if="isLoading" class="loading-container">
            <span class="spinner"></span>
        </div>

        <div v-else class="rounded-xl">
            <div class="flex flex-col md:flex-row h-full h-screen">
                <!-- Vertical Tabs Navigation -->
                <div
                    class="w-full md:w-64 p-3 md:border-r border-neutral-800"
                >
                    <h1 class="text-2xl font-bold text-white mb-4">Settings</h1>

                    <div class="flex flex-col space-y-1">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            @click="activeTab = tab.id"
                            :class="[
                                'flex items-center px-3 py-2 rounded-lg text-left transition-colors',
                                activeTab === tab.id
                                    ? 'bg-neutral-600 text-white'
                                    : 'bg-transparent text-neutral-300 hover:bg-neutral-700',
                            ]"
                        >
                            <i v-if="tab.icon" :class="[tab.icon, 'mr-2 w-5 h-5 text-center']"></i>
                            <span>{{ tab.name }}</span>
                        </button>
                    </div>

                    <button
                        @click="saveSettings"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors w-full mt-8"
                        :disabled="saving"
                    >
                        <span v-if="saving" class="flex items-center">
                            <svg
                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Saving...
                        </span>
                        <span v-else>Save Settings</span>
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="flex-1 overflow-y-auto">
                    <!-- General Settings -->
                    <div class="p-6" v-if="activeTab === 'general'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            General Settings
                        </h2>
                        <div class="space-y-6">
                            <div class="grid gap-6 md:grid-cols-2">
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Site Title</label
                                    >
                                    <input
                                        v-model="settings.title"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="My Awesome Blog"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Tagline</label
                                    >
                                    <input
                                        v-model="settings.description"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Just another CMMV blog"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        In a few words, explain what this site
                                        is about.
                                    </p>
                                </div>
                            </div>

                            <div class="grid gap-6 md:grid-cols-2">
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Admin Email</label
                                    >
                                    <input
                                        v-model="settings.adminEmail"
                                        type="email"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="admin@example.com"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        This address is used for admin purposes.
                                    </p>
                                </div>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Site Language</label
                                    >
                                    <select
                                        v-model="settings.language"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="en_US">
                                            English (United States)
                                        </option>
                                        <option value="pt_BR">
                                            Portuguese (Brazil)
                                        </option>
                                        <option value="es_ES">
                                            Spanish (Spain)
                                        </option>
                                        <option value="fr_FR">
                                            French (France)
                                        </option>
                                        <option value="de_DE">
                                            German (Germany)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Site URL</label
                                >
                                <input
                                    v-model="settings.url"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Site Type</label
                                >
                                <select
                                    v-model="settings.siteType"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="blog">
                                        Blog
                                    </option>
                                    <option value="news">
                                        News
                                    </option>
                                    <option value="sports">
                                        Sports
                                    </option>
                                    <option value="coupons">
                                        Coupons
                                    </option>
                                    <option value="odds">
                                        Odds
                                    </option>
                                </select>
                            </div>

                            <!-- Appearance Settings -->
                            <div class="mt-8 pt-6 border-t border-neutral-800">
                                <h3
                                    class="text-lg font-semibold text-white mb-4"
                                >
                                Appearance Settings
                                </h3>

                                <div class="space-y-6">
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Site Logo</label
                                        >
                                        <div class="flex items-center space-x-4">
                                            <div
                                                class="w-16 h-16 bg-neutral-700 rounded-md flex items-center justify-center border border-neutral-600"
                                            >
                                                <img
                                                    v-if="settings.logo"
                                                    :src="settings.logo"
                                                    alt="Site logo"
                                                    class="max-w-full max-h-full p-1"
                                                />
                                                <svg
                                                    v-else
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    class="h-8 w-8 text-neutral-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                            <div class="flex space-x-2">
                                                <input
                                                    type="file"
                                                    ref="logoInput"
                                                    accept="image/*"
                                                    class="hidden"
                                                    @change="handleLogoUpload"
                                                />
                                                <button
                                                    @click="$refs.logoInput.click()"
                                                    class="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-md transition-colors"
                                                >
                                                    Select Logo
                                                </button>
                                                <button
                                                    v-if="settings.logo"
                                                    @click="removeLogo"
                                                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <p class="text-xs text-neutral-500">
                                            Recommended size: 140x79px
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Favicon</label
                                        >
                                        <div class="flex items-center space-x-4">
                                            <div
                                                class="w-10 h-10 bg-neutral-700 rounded-md flex items-center justify-center border border-neutral-600"
                                            >
                                                <img
                                                    v-if="settings.favicon"
                                                    :src="settings.favicon"
                                                    alt="Favicon"
                                                    class="max-w-full max-h-full p-1"
                                                />
                                                <svg
                                                    v-else
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    class="h-6 w-6 text-neutral-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                            <div class="flex space-x-2">
                                                <input
                                                    type="file"
                                                    ref="faviconInput"
                                                    accept=".ico,.png,image/x-icon,image/png"
                                                    class="hidden"
                                                    @change="handleFaviconUpload"
                                                />
                                                <button
                                                    @click="$refs.faviconInput.click()"
                                                    class="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-md transition-colors"
                                                >
                                                    Select Favicon
                                                </button>
                                                <button
                                                    v-if="settings.favicon"
                                                    @click="removeFavicon"
                                                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <p class="text-xs text-neutral-500">
                                            Recommended size: 16x16px (PNG, ICO)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search Integrations -->
                    <div class="p-6" v-if="activeTab === 'search-integrations'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Search Integrations
                        </h2>
                        <div class="space-y-8">
                            <!-- Google Search Console -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Google Search Console
                                </h3>
                                <div class="space-y-4">
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Google Site Verification</label
                                        >
                                        <input
                                            v-model="
                                                settings.googleSiteVerification
                                            "
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="content value from Google meta tag"
                                        />
                                        <p class="text-xs text-neutral-500">
                                            Enter the content value from your
                                            Google verification meta tag
                                        </p>
                                    </div>
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Google Analytics ID</label
                                        >
                                        <input
                                            v-model="settings.googleAnalyticsId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                                        />
                                        <p class="text-xs text-neutral-500">
                                            Your Google Analytics tracking ID
                                            (e.g., G-XXXXXXXXXX)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Google Indexing API -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Google Indexing API
                                </h3>
                                <div class="space-y-4">
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >API Key</label
                                        >
                                        <input
                                            v-model="settings.googleIndexingApiKey"
                                            type="password"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter your Google Indexing API key"
                                        />
                                        <p class="text-xs text-neutral-500">
                                            Required for submitting URLs to Google's index
                                        </p>
                                    </div>
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Service Account JSON</label
                                        >
                                        <textarea
                                            v-model="settings.googleIndexingServiceAccount"
                                            rows="6"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            placeholder='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...",...}'
                                        ></textarea>
                                        <p class="text-xs text-neutral-500">
                                            Paste the entire service account JSON credential file content
                                        </p>
                                    </div>
                                    <div class="mt-4">
                                        <h4
                                            class="text-sm font-medium text-neutral-300 mb-2"
                                        >
                                            How to set up Google Indexing API:
                                        </h4>
                                        <ol
                                            class="list-decimal pl-5 space-y-1 text-sm text-neutral-400"
                                        >
                                            <li>
                                                Go to the
                                                <a
                                                    href="https://console.cloud.google.com/"
                                                    target="_blank"
                                                    class="text-blue-400 hover:underline"
                                                    >Google Cloud Console</a
                                                >
                                            </li>
                                            <li>
                                                Create a new project or select an existing one
                                            </li>
                                            <li>
                                                Enable the "Indexing API" from the API Library
                                            </li>
                                            <li>
                                                Create a service account and download the JSON key file
                                            </li>
                                            <li>
                                                Verify ownership of your site in Search Console
                                            </li>
                                            <li>
                                                Add the service account email as an owner in Search Console
                                            </li>
                                        </ol>
                                        <a
                                            href="https://developers.google.com/search/apis/indexing-api/v3/quickstart"
                                            target="_blank"
                                            class="inline-flex items-center mt-2 text-blue-400 hover:underline"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            Google Indexing API Documentation
                                        </a>
                                    </div>
                                    <div class="space-y-2 mt-4">
                                        <div class="flex items-center">
                                            <input
                                                id="auto-index-post"
                                                type="checkbox"
                                                v-model="
                                                    settings.autoIndexNewContent
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="auto-index-post"
                                                class="text-sm text-neutral-300"
                                                >Auto-submit new content to Google's index</label
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Bing Webmaster Tools -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Bing Webmaster Tools
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Bing Site Verification</label
                                    >
                                    <input
                                        v-model="settings.bingSiteVerification"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="content value from Bing meta tag"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Enter the content value from your Bing
                                        verification meta tag
                                    </p>
                                </div>
                            </div>

                            <!-- Yandex Webmaster -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Yandex Webmaster
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Yandex Site Verification</label
                                    >
                                    <input
                                        v-model="
                                            settings.yandexSiteVerification
                                        "
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="content value from Yandex meta tag"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Enter the content value from your Yandex
                                        verification meta tag
                                    </p>
                                </div>
                            </div>

                            <!-- Additional Meta Tags -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Custom Meta Tags
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Additional Meta Tags</label
                                    >
                                    <textarea
                                        v-model="settings.additionalMetaTags"
                                        rows="5"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                        placeholder="<meta name='example' content='value'>"
                                    ></textarea>
                                    <p class="text-xs text-neutral-500">
                                        Add any additional meta tags to include
                                        in the head section of your site
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Discussion Settings -->
                    <div class="p-6" v-if="activeTab === 'discussion'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Discussion Settings
                        </h2>
                        <div class="space-y-6">
                            <div class="space-y-3">
                                <h3
                                    class="text-base font-medium text-neutral-300"
                                >
                                    Comment System
                                </h3>
                                <div class="space-y-3">
                                    <div class="flex items-center">
                                        <input
                                            id="native-comments"
                                            type="radio"
                                            value="native"
                                            v-model="settings.commentSystem"
                                            class="h-4 w-4 mr-2 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="native-comments"
                                            class="text-sm text-neutral-300"
                                            >Native Comments</label
                                        >
                                    </div>
                                    <div class="flex items-center">
                                        <input
                                            id="facebook-comments"
                                            type="radio"
                                            value="facebook"
                                            v-model="settings.commentSystem"
                                            class="h-4 w-4 mr-2 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="facebook-comments"
                                            class="text-sm text-neutral-300"
                                            >Facebook Comments</label
                                        >
                                    </div>
                                    <div class="flex items-center">
                                        <input
                                            id="disqus-comments"
                                            type="radio"
                                            value="disqus"
                                            v-model="settings.commentSystem"
                                            class="h-4 w-4 mr-2 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="disqus-comments"
                                            class="text-sm text-neutral-300"
                                            >Disqus Comments</label
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Facebook Comments Settings -->
                            <div
                                v-if="settings.commentSystem === 'facebook'"
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Facebook Comments Configuration
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Facebook App ID</label
                                    >
                                    <input
                                        v-model="settings.facebookAppId"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="123456789012345"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Enter your Facebook App ID to enable
                                        Facebook Comments
                                    </p>
                                </div>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Number of Comments to Show</label
                                    >
                                    <input
                                        v-model="settings.facebookCommentsNum"
                                        type="number"
                                        min="1"
                                        max="100"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Color Scheme</label
                                    >
                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input
                                                id="fb-light"
                                                type="radio"
                                                value="light"
                                                v-model="
                                                    settings.facebookColorScheme
                                                "
                                                class="h-4 w-4 mr-2 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="fb-light"
                                                class="text-sm text-neutral-300"
                                                >Light</label
                                            >
                                        </div>
                                        <div class="flex items-center">
                                            <input
                                                id="fb-dark"
                                                type="radio"
                                                value="dark"
                                                v-model="
                                                    settings.facebookColorScheme
                                                "
                                                class="h-4 w-4 mr-2 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="fb-dark"
                                                class="text-sm text-neutral-300"
                                                >Dark</label
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Disqus Comments Settings -->
                            <div
                                v-if="settings.commentSystem === 'disqus'"
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Disqus Comments Configuration
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Disqus Shortname</label
                                    >
                                    <input
                                        v-model="settings.disqusShortname"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="your-disqus-shortname"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Enter your Disqus shortname to enable
                                        Disqus Comments
                                    </p>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex items-center">
                                        <input
                                            id="disqus-lazy-load"
                                            type="checkbox"
                                            v-model="settings.disqusLazyLoad"
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="disqus-lazy-load"
                                            class="text-sm text-neutral-300"
                                            >Lazy load Disqus (improves page
                                            load performance)</label
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Native Comments Settings -->
                            <div
                                v-if="settings.commentSystem === 'native'"
                                class="space-y-6"
                            >
                                <div class="space-y-3">
                                    <h3
                                        class="text-base font-medium text-neutral-300"
                                    >
                                        Default article settings
                                    </h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input
                                                id="allow-comments"
                                                type="checkbox"
                                                v-model="
                                                    settings.enablecomments
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="allow-comments"
                                                class="text-sm text-neutral-300"
                                                >Allow people to submit comments
                                                on new posts</label
                                            >
                                        </div>
                                        <div class="flex items-center">
                                            <input
                                                id="comment-approval"
                                                type="checkbox"
                                                v-model="
                                                    settings.moderatecomments
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="comment-approval"
                                                class="text-sm text-neutral-300"
                                                >Comment must be manually
                                                approved</label
                                            >
                                        </div>
                                        <div class="flex items-center">
                                            <input
                                                id="approve-comments"
                                                type="checkbox"
                                                v-model="
                                                    settings.approveComments
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="approve-comments"
                                                class="text-sm text-neutral-300"
                                                >Enable comment approval
                                                system</label
                                            >
                                        </div>
                                        <div class="flex items-center">
                                            <input
                                                id="require-name-email"
                                                type="checkbox"
                                                v-model="
                                                    settings.requireNameEmail
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="require-name-email"
                                                class="text-sm text-neutral-300"
                                                >Comment author must fill out
                                                name and email</label
                                            >
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-3">
                                    <h3
                                        class="text-base font-medium text-neutral-300"
                                    >
                                        Other comment settings
                                    </h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input
                                                id="nested-comments"
                                                type="checkbox"
                                                v-model="
                                                    settings.nestedComments
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="nested-comments"
                                                class="text-sm text-neutral-300"
                                                >Enable threaded (nested)
                                                comments</label
                                            >
                                        </div>
                                        <div class="flex items-center">
                                            <input
                                                id="comment-pagination"
                                                type="checkbox"
                                                v-model="
                                                    settings.commentPagination
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="comment-pagination"
                                                class="text-sm text-neutral-300"
                                                >Break comments into
                                                pages</label
                                            >
                                        </div>
                                    </div>
                                </div>

                                <div class="grid gap-6 md:grid-cols-2">
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Comments per page</label
                                        >
                                        <input
                                            v-model="settings.commentsPerPage"
                                            type="number"
                                            min="1"
                                            max="100"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <p class="text-xs text-neutral-500">
                                            Only if comment pagination is
                                            enabled
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Email notifications</label
                                        >
                                        <div class="space-y-2">
                                            <div class="flex items-center">
                                                <input
                                                    id="email-me-comments"
                                                    type="checkbox"
                                                    v-model="
                                                        settings.emailOnComment
                                                    "
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="email-me-comments"
                                                    class="text-sm text-neutral-300"
                                                    >Email me whenever anyone
                                                    posts a comment</label
                                                >
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="email-me-moderation"
                                                    type="checkbox"
                                                    v-model="
                                                        settings.emailOnModeration
                                                    "
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="email-me-moderation"
                                                    class="text-sm text-neutral-300"
                                                    >Email me whenever a comment
                                                    is held for
                                                    moderation</label
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Social Settings -->
                    <div class="p-6" v-if="activeTab === 'social'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Social Media Settings
                        </h2>
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Facebook</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://facebook.com/</span
                                    >
                                    <input
                                        v-model="settings.facebook"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Twitter</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://twitter.com/</span
                                    >
                                    <input
                                        v-model="settings.twitter"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Instagram</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://instagram.com/</span
                                    >
                                    <input
                                        v-model="settings.instagram"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >LinkedIn</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://linkedin.com/company/</span
                                    >
                                    <input
                                        v-model="settings.linkedin"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >YouTube</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://youtube.com/</span
                                    >
                                    <input
                                        v-model="settings.youtube"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="@yourchannel"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >GitHub</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://github.com/</span
                                    >
                                    <input
                                        v-model="settings.github"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >WhatsApp</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://chat.whatsapp.com/</span
                                    >
                                    <input
                                        v-model="settings.whatsapp"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="GHcB3w00dtzDiVc9ugrT7S"
                                    />
                                </div>
                                <p class="text-xs text-neutral-500">
                                    Enter the invite code from your WhatsApp
                                    community invite link
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Telegram</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://t.me/</span
                                    >
                                    <input
                                        v-model="settings.telegram"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="yourusername"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Discord</label
                                >
                                <div class="flex items-center">
                                    <span
                                        class="bg-neutral-700 rounded-l-md border border-neutral-600 px-3 py-2 text-neutral-400"
                                        >https://discord.gg/</span
                                    >
                                    <input
                                        v-model="settings.discord"
                                        type="text"
                                        class="flex-1 rounded-none rounded-r-md bg-neutral-700 border border-l-0 border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="MhrTM3cg"
                                    />
                                </div>
                                <p class="text-xs text-neutral-500">
                                    Enter the invite code from your Discord
                                    server
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Social Auto-Posting Settings -->
                    <div class="p-6" v-if="activeTab === 'social-auto-posting'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Auto-Posting Settings
                        </h2>
                        <div class="space-y-8">
                            <!-- Global Settings -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Global Settings
                                </h3>
                                <div class="space-y-2">
                                    <div class="flex items-center">
                                        <input
                                            id="auto-post-new"
                                            type="checkbox"
                                            v-model="
                                                settings.autoPostOnNewContent
                                            "
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="auto-post-new"
                                            class="text-sm text-neutral-300"
                                            >Auto-post when new content is
                                            published</label
                                        >
                                    </div>
                                    <div class="flex items-center">
                                        <input
                                            id="auto-post-update"
                                            type="checkbox"
                                            v-model="
                                                settings.autoPostOnContentUpdate
                                            "
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="auto-post-update"
                                            class="text-sm text-neutral-300"
                                            >Auto-post when content is
                                            updated</label
                                        >
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Default Post Format</label
                                    >
                                    <textarea
                                        v-model="settings.autoPostDefaultFormat"
                                        rows="2"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="New post: {title} - {excerpt} {url}"
                                    ></textarea>
                                    <p class="text-xs text-neutral-500">
                                        Available variables: {title}, {excerpt},
                                        {url}, {tags}, {categories}, {author}
                                    </p>
                                </div>
                            </div>

                            <!-- Facebook -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-white">
                                        Facebook
                                    </h3>
                                    <div>
                                        <label
                                            class="relative inline-flex items-center cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                v-model="
                                                    settings.autoPostFacebook
                                                "
                                                class="sr-only peer"
                                            />
                                            <div
                                                class="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                                            ></div>
                                        </label>
                                    </div>
                                </div>

                                <div
                                    v-if="settings.autoPostFacebook"
                                    class="space-y-4"
                                >
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Facebook Page ID</label
                                        >
                                        <input
                                            v-model="settings.facebookPageId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="123456789012345"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Access Token</label
                                        >
                                        <input
                                            v-model="
                                                settings.facebookAccessToken
                                            "
                                            type="password"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="••••••••••••"
                                        />
                                        <p class="text-xs text-neutral-500">
                                            Page access token with publish_pages
                                            permission
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <a
                                            href="https://developers.facebook.com/tools/explorer/"
                                            target="_blank"
                                            class="text-blue-500 hover:text-blue-400 text-sm flex items-center"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            Generate Facebook Access Token
                                        </a>
                                        <p
                                            class="text-xs text-neutral-500 mt-1"
                                        >
                                            Request 'pages_read_engagement' and
                                            'pages_manage_posts' permissions
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Post Format</label
                                        >
                                        <textarea
                                            v-model="
                                                settings.facebookPostFormat
                                            "
                                            rows="2"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="New post: {title} - {excerpt} {url}"
                                        ></textarea>
                                        <p class="text-xs text-neutral-500">
                                            Leave empty to use default format
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input
                                                id="fb-image"
                                                type="checkbox"
                                                v-model="
                                                    settings.facebookIncludeImage
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="fb-image"
                                                class="text-sm text-neutral-300"
                                                >Include featured image</label
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Twitter -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-white">
                                        Twitter (X)
                                    </h3>
                                    <div>
                                        <label
                                            class="relative inline-flex items-center cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                v-model="
                                                    settings.autoPostTwitter
                                                "
                                                class="sr-only peer"
                                            />
                                            <div
                                                class="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                                            ></div>
                                        </label>
                                    </div>
                                </div>

                                <div
                                    v-if="settings.autoPostTwitter"
                                    class="space-y-4"
                                >
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >API Key</label
                                        >
                                        <input
                                            v-model="settings.twitterApiKey"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="API Key"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >API Secret</label
                                        >
                                        <input
                                            v-model="settings.twitterApiSecret"
                                            type="password"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="••••••••••••"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Access Token</label
                                        >
                                        <input
                                            v-model="
                                                settings.twitterAccessToken
                                            "
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Access Token"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Access Token Secret</label
                                        >
                                        <input
                                            v-model="
                                                settings.twitterAccessTokenSecret
                                            "
                                            type="password"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="••••••••••••"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <a
                                            href="https://developer.twitter.com/en/portal/dashboard"
                                            target="_blank"
                                            class="text-blue-500 hover:text-blue-400 text-sm flex items-center"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            Twitter Developer Portal
                                        </a>
                                        <p
                                            class="text-xs text-neutral-500 mt-1"
                                        >
                                            Create an app and generate your
                                            credentials with read/write
                                            permissions
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Post Format</label
                                        >
                                        <textarea
                                            v-model="settings.twitterPostFormat"
                                            rows="2"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="New post: {title} {url}"
                                        ></textarea>
                                        <p class="text-xs text-neutral-500">
                                            Leave empty to use default format.
                                            Remember Twitter has character
                                            limits.
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input
                                                id="tw-image"
                                                type="checkbox"
                                                v-model="
                                                    settings.twitterIncludeImage
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="tw-image"
                                                class="text-sm text-neutral-300"
                                                >Include featured image</label
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- LinkedIn -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-white">
                                        LinkedIn
                                    </h3>
                                    <div>
                                        <label
                                            class="relative inline-flex items-center cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                v-model="
                                                    settings.autoPostLinkedIn
                                                "
                                                class="sr-only peer"
                                            />
                                            <div
                                                class="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                                            ></div>
                                        </label>
                                    </div>
                                </div>

                                <div
                                    v-if="settings.autoPostLinkedIn"
                                    class="space-y-4"
                                >
                                    <div class="space-y-2">
                                        <div
                                            class="flex justify-between items-center"
                                        >
                                            <label
                                                class="block text-sm font-medium text-neutral-300"
                                                >Access Token</label
                                            >
                                            <button
                                                @click="startLinkedInOAuth"
                                                class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded inline-flex items-center"
                                                :disabled="
                                                    linkedInOAuthInProgress
                                                "
                                            >
                                                <span
                                                    v-if="
                                                        linkedInOAuthInProgress
                                                    "
                                                    >Authorizing...</span
                                                >
                                                <span v-else
                                                    >Authorize LinkedIn</span
                                                >
                                            </button>
                                        </div>
                                        <input
                                            v-model="
                                                settings.linkedInAccessToken
                                            "
                                            type="password"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="••••••••••••"
                                        />
                                        <p class="text-xs text-neutral-500">
                                            Generate a token using the Authorize
                                            button above or enter manually
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <a
                                            href="https://www.linkedin.com/developers/apps"
                                            target="_blank"
                                            class="text-blue-500 hover:text-blue-400 text-sm flex items-center"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            LinkedIn Developer Portal
                                        </a>
                                        <p
                                            class="text-xs text-neutral-500 mt-1"
                                        >
                                            Create an app with r_liteprofile and
                                            w_member_social permissions
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                            >Post Format</label
                                        >
                                        <textarea
                                            v-model="
                                                settings.linkedInPostFormat
                                            "
                                            rows="2"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="New post: {title} - {excerpt} {url}"
                                        ></textarea>
                                        <p class="text-xs text-neutral-500">
                                            Leave empty to use default format
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input
                                                id="li-image"
                                                type="checkbox"
                                                v-model="
                                                    settings.linkedInIncludeImage
                                                "
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="li-image"
                                                class="text-sm text-neutral-300"
                                                >Include featured image</label
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Integrations Settings -->
                    <div class="p-6" v-if="activeTab === 'integrations'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Service Integrations
                        </h2>
                        <div class="space-y-8">
                            <!-- YouTube API Integration -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    YouTube API
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >YouTube API Key</label
                                    >
                                    <input
                                        v-model="settings.youtubeApiKey"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your YouTube API key"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Required for YouTube channel integration
                                        and video feeds.
                                    </p>

                                    <div class="mt-4">
                                        <h4
                                            class="text-sm font-medium text-neutral-300 mb-2"
                                        >
                                            How to get a YouTube API Key:
                                        </h4>
                                        <ol
                                            class="list-decimal pl-5 space-y-1 text-sm text-neutral-400"
                                        >
                                            <li>
                                                Go to the
                                                <a
                                                    href="https://console.cloud.google.com/"
                                                    target="_blank"
                                                    class="text-blue-400 hover:underline"
                                                    >Google Cloud Console</a
                                                >
                                            </li>
                                            <li>
                                                Create a new project or select
                                                an existing one
                                            </li>
                                            <li>
                                                Enable the "YouTube Data API v3"
                                                from the API Library
                                            </li>
                                            <li>
                                                Go to Credentials and create an
                                                API key
                                            </li>
                                            <li>
                                                Copy the API key and paste it
                                                above
                                            </li>
                                        </ol>
                                        <a
                                            href="https://developers.google.com/youtube/v3/getting-started"
                                            target="_blank"
                                            class="inline-flex items-center mt-2 text-blue-400 hover:underline"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            YouTube API Documentation
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Twitter API Integration -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Twitter (X) API
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Twitter Bearer Token</label
                                    >
                                    <input
                                        v-model="settings.twitterBearerToken"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Twitter Bearer Token"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Required for Twitter feeds and social
                                        integration.
                                    </p>

                                    <div class="mt-4">
                                        <h4
                                            class="text-sm font-medium text-neutral-300 mb-2"
                                        >
                                            How to get a Twitter Bearer Token:
                                        </h4>
                                        <ol
                                            class="list-decimal pl-5 space-y-1 text-sm text-neutral-400"
                                        >
                                            <li>
                                                Sign up for a
                                                <a
                                                    href="https://developer.twitter.com/en/portal/dashboard"
                                                    target="_blank"
                                                    class="text-blue-400 hover:underline"
                                                    >Twitter Developer
                                                    Account</a
                                                >
                                            </li>
                                            <li>
                                                Create a project and an app
                                                within that project
                                            </li>
                                            <li>
                                                Navigate to the "Keys and
                                                Tokens" tab
                                            </li>
                                            <li>
                                                Generate or regenerate your
                                                Bearer Token
                                            </li>
                                            <li>
                                                Copy the Bearer Token and paste
                                                it above
                                            </li>
                                        </ol>
                                        <a
                                            href="https://developer.twitter.com/en/docs/authentication/oauth-2-0/bearer-tokens"
                                            target="_blank"
                                            class="inline-flex items-center mt-2 text-blue-400 hover:underline"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            Twitter API Documentation
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Firebase OAuth Integration -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Firebase OAuth
                                </h3>
                                <div class="space-y-4">
                                    <p class="text-sm text-neutral-400">
                                        Configure Firebase Authentication to enable user login with Google, Facebook, Twitter, GitHub, and other providers.
                                    </p>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">API Key</label>
                                        <input
                                            v-model="settings.firebaseApiKey"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter your Firebase API Key"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Auth Domain</label>
                                        <input
                                            v-model="settings.firebaseAuthDomain"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="your-project-id.firebaseapp.com"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Project ID</label>
                                        <input
                                            v-model="settings.firebaseProjectId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="your-project-id"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Storage Bucket</label>
                                        <input
                                            v-model="settings.firebaseStorageBucket"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="your-project-id.appspot.com"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Messaging Sender ID</label>
                                        <input
                                            v-model="settings.firebaseMessagingSenderId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="123456789012"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">App ID</label>
                                        <input
                                            v-model="settings.firebaseAppId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="1:123456789012:web:abcdef1234567890"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Client Email</label>
                                        <input
                                            v-model="settings.firebaseClientEmail"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="your-project-id@appspot.gserviceaccount.com"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Private Key</label>
                                        <textarea
                                            v-model="settings.firebasePrivateKey"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        ></textarea>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Enabled Providers</label>
                                        <div class="grid grid-cols-2 gap-2">
                                            <div class="flex items-center">
                                                <input
                                                    id="provider-google"
                                                    type="checkbox"
                                                    v-model="settings.firebaseProvidersGoogle"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="provider-google" class="text-sm text-neutral-300">Google</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="provider-facebook"
                                                    type="checkbox"
                                                    v-model="settings.firebaseProvidersFacebook"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="provider-facebook" class="text-sm text-neutral-300">Facebook</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="provider-twitter"
                                                    type="checkbox"
                                                    v-model="settings.firebaseProvidersTwitter"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="provider-twitter" class="text-sm text-neutral-300">Twitter</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="provider-github"
                                                    type="checkbox"
                                                    v-model="settings.firebaseProvidersGithub"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="provider-github" class="text-sm text-neutral-300">GitHub</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="provider-email"
                                                    type="checkbox"
                                                    v-model="settings.firebaseProvidersEmail"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="provider-email" class="text-sm text-neutral-300">Email/Password</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="provider-phone"
                                                    type="checkbox"
                                                    v-model="settings.firebaseProvidersPhone"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="provider-phone" class="text-sm text-neutral-300">Phone</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-4">
                                        <h4 class="text-sm font-medium text-neutral-300 mb-2">How to set up Firebase Authentication:</h4>
                                        <ol class="list-decimal pl-5 space-y-1 text-sm text-neutral-400">
                                            <li>Create a project in the <a href="https://console.firebase.google.com/" target="_blank" class="text-blue-400 hover:underline">Firebase Console</a></li>
                                            <li>Add a web app to your project</li>
                                            <li>Enable Authentication and the desired providers</li>
                                            <li>Copy the Firebase configuration from the Firebase SDK snippet</li>
                                        </ol>
                                        <a href="https://firebase.google.com/docs/auth" target="_blank" class="inline-flex items-center mt-2 text-blue-400 hover:underline">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Firebase Auth Documentation
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Supabase OAuth Integration -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Supabase OAuth
                                </h3>
                                <div class="space-y-4">
                                    <p class="text-sm text-neutral-400">
                                        Configure Supabase Authentication to enable user login with multiple OAuth providers.
                                    </p>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Supabase URL</label>
                                        <input
                                            v-model="settings.supabaseUrl"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="https://your-project-id.supabase.co"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">API Key (anon public)</label>
                                        <input
                                            v-model="settings.supabaseAnonKey"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter your Supabase public API Key"
                                        />
                                        <p class="text-xs text-neutral-500">This is your public anon key, safe to use in browser environments</p>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Service Role Key (private)</label>
                                        <input
                                            v-model="settings.supabaseServiceKey"
                                            type="password"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter your Supabase service role key"
                                        />
                                        <p class="text-xs text-neutral-500 text-red-400">WARNING: Keep this key secure. Only use in server environments.</p>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">Enabled Providers</label>
                                        <div class="grid grid-cols-2 gap-2">
                                            <div class="flex items-center">
                                                <input
                                                    id="supabase-google"
                                                    type="checkbox"
                                                    v-model="settings.supabaseProvidersGoogle"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="supabase-google" class="text-sm text-neutral-300">Google</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="supabase-facebook"
                                                    type="checkbox"
                                                    v-model="settings.supabaseProvidersFacebook"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="supabase-facebook" class="text-sm text-neutral-300">Facebook</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="supabase-twitter"
                                                    type="checkbox"
                                                    v-model="settings.supabaseProvidersTwitter"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="supabase-twitter" class="text-sm text-neutral-300">Twitter</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="supabase-github"
                                                    type="checkbox"
                                                    v-model="settings.supabaseProvidersGithub"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="supabase-github" class="text-sm text-neutral-300">GitHub</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="supabase-discord"
                                                    type="checkbox"
                                                    v-model="settings.supabaseProvidersDiscord"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="supabase-discord" class="text-sm text-neutral-300">Discord</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="supabase-apple"
                                                    type="checkbox"
                                                    v-model="settings.supabaseProvidersApple"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label for="supabase-apple" class="text-sm text-neutral-300">Apple</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-4">
                                        <h4 class="text-sm font-medium text-neutral-300 mb-2">How to set up Supabase Authentication:</h4>
                                        <ol class="list-decimal pl-5 space-y-1 text-sm text-neutral-400">
                                            <li>Create a project on <a href="https://app.supabase.com/" target="_blank" class="text-blue-400 hover:underline">Supabase</a></li>
                                            <li>Navigate to Authentication → Providers</li>
                                            <li>Enable and configure the desired OAuth providers</li>
                                            <li>Get your API keys from the Project Settings → API section</li>
                                            <li>Set up redirect URLs in Supabase Authentication settings</li>
                                        </ol>
                                        <a href="https://supabase.com/docs/guides/auth" target="_blank" class="inline-flex items-center mt-2 text-blue-400 hover:underline">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Supabase Auth Documentation
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Reddit API Integration -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Reddit API
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Reddit Client ID</label
                                    >
                                    <input
                                        v-model="settings.redditClientId"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Reddit Client ID"
                                    />

                                    <label
                                        class="block text-sm font-medium text-neutral-300 mt-4"
                                        >Reddit Client Secret</label
                                    >
                                    <input
                                        v-model="settings.redditClientSecret"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Reddit Client Secret"
                                    />

                                    <label
                                        class="block text-sm font-medium text-neutral-300 mt-4"
                                        >Reddit Username</label
                                    >
                                    <input
                                        v-model="settings.redditUsername"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Reddit Username"
                                    />

                                    <label
                                        class="block text-sm font-medium text-neutral-300 mt-4"
                                        >Reddit Password</label
                                    >
                                    <input
                                        v-model="settings.redditPassword"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Reddit Password"
                                    />

                                    <p class="text-xs text-neutral-500 mt-2">
                                        Used for Reddit subreddit integration
                                        and content feeds.
                                    </p>

                                    <div class="mt-4">
                                        <h4
                                            class="text-sm font-medium text-neutral-300 mb-2"
                                        >
                                            How to get Reddit API credentials:
                                        </h4>
                                        <ol
                                            class="list-decimal pl-5 space-y-1 text-sm text-neutral-400"
                                        >
                                            <li>
                                                Go to
                                                <a
                                                    href="https://www.reddit.com/prefs/apps"
                                                    target="_blank"
                                                    class="text-blue-400 hover:underline"
                                                    >Reddit's App Preferences</a
                                                >
                                            </li>
                                            <li>
                                                Scroll down and click "create
                                                app" or "create another app"
                                            </li>
                                            <li>
                                                Fill out the form (select
                                                "script" as the app type)
                                            </li>
                                            <li>
                                                The Client ID is displayed under
                                                your app name after creation
                                            </li>
                                            <li>
                                                The Client Secret is shown as
                                                "secret"
                                            </li>
                                        </ol>
                                        <a
                                            href="https://www.reddit.com/dev/api/"
                                            target="_blank"
                                            class="inline-flex items-center mt-2 text-blue-400 hover:underline"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            Reddit API Documentation
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SEO Settings -->
                    <div class="p-6" v-if="activeTab === 'seo'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            SEO Settings
                        </h2>
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Default Meta Description</label
                                >
                                <textarea
                                    v-model="settings.metaDescription"
                                    rows="3"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Brief description of your site for search engines"
                                ></textarea>
                                <p class="text-xs text-neutral-500">
                                    Used when no specific description is
                                    provided for a page or post. Aim for 150-160
                                    characters.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Default Keywords</label
                                >
                                <input
                                    v-model="settings.metaKeywords"
                                    type="text"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="keyword1, keyword2, keyword3"
                                />
                                <p class="text-xs text-neutral-500">
                                    Comma-separated keywords used when no
                                    specific keywords are provided.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Default Featured Image</label
                                >
                                <div class="flex items-center space-x-4">
                                    <div
                                        class="w-32 h-20 bg-neutral-700 rounded-md flex items-center justify-center border border-neutral-600 overflow-hidden"
                                    >
                                        <img
                                            v-if="settings.defaultFeaturedImage"
                                            :src="settings.defaultFeaturedImage"
                                            alt="Default featured image"
                                            class="object-cover w-full h-full"
                                        />
                                        <svg
                                            v-else
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-10 w-10 text-neutral-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div class="flex space-x-2">
                                        <input
                                            type="file"
                                            ref="featuredImageInput"
                                            accept="image/*"
                                            class="hidden"
                                            @change="
                                                handleDefaultFeaturedImageUpload
                                            "
                                        />
                                        <button
                                            @click="
                                                $refs.featuredImageInput.click()
                                            "
                                            class="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-md transition-colors"
                                        >
                                            Select Image
                                        </button>
                                        <button
                                            v-if="settings.defaultFeaturedImage"
                                            @click="removeDefaultFeaturedImage"
                                            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                <p class="text-xs text-neutral-500">
                                    Used when a post or page doesn't have a
                                    featured image. Recommended size: 1200x630px
                                    for social sharing.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- AI Settings -->
                    <div class="p-6" v-if="activeTab === 'ai'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            AI Settings
                        </h2>
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Default AI Service</label
                                >
                                <select
                                    v-model="settings.aiService"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="gemini">
                                        Google Gemini
                                    </option>
                                    <option value="chatgpt">
                                        OpenAI ChatGPT
                                    </option>
                                    <option value="grok">Grok</option>
                                    <option value="deepseek">DeepSeek</option>
                                </select>
                                <p class="text-xs text-neutral-500">
                                    Select which AI service will be used for
                                    content generation by default.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <input
                                    id="prompts-override"
                                    type="checkbox"
                                    v-model="settings.promptsOverride"
                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                />
                                <label
                                    for="enable-ads"
                                    class="text-sm text-neutral-300"
                                >Enable prompts override</label>

                                <p class="text-xs text-neutral-500">
                                    Enable prompts override to use custom
                                    prompts for AI services.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Classify Prompt</label
                                >
                                <textarea
                                    v-model="settings.classifyPrompt"
                                    rows="6"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="Enter a prompt for classifying content..."
                                ></textarea>
                                <p class="text-xs text-neutral-500">
                                    This prompt will be used to classify content
                                    when auto-categorization is enabled.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Google Gemini API Key</label
                                >
                                <input
                                    v-model="settings.geminiApiKey"
                                    type="password"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter your Gemini API key"
                                />
                                <p class="text-xs text-neutral-500">
                                    Used for content generation and translation
                                    services.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >OpenAI API Key (ChatGPT)</label
                                >
                                <input
                                    v-model="settings.openaiApiKey"
                                    type="password"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter your OpenAI API key"
                                />
                                <p class="text-xs text-neutral-500">
                                    Used for ChatGPT and other OpenAI services.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Grok API Key</label
                                >
                                <input
                                    v-model="settings.grokApiKey"
                                    type="password"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter your Grok API key"
                                />
                                <p class="text-xs text-neutral-500">
                                    Used for Grok AI services.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >DeepSeek API Key</label
                                >
                                <input
                                    v-model="settings.deepseekApiKey"
                                    type="password"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter your DeepSeek API key"
                                />
                                <p class="text-xs text-neutral-500">
                                    Used for DeepSeek AI services.
                                </p>
                            </div>

                            <div class="p-4 bg-neutral-700 rounded-md mt-6">
                                <div class="flex items-start">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-6 w-6 text-blue-400 mr-2 flex-shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p class="text-sm text-neutral-300">
                                        API keys are stored securely and used
                                        only for authorized AI services. These
                                        services may incur usage costs from
                                        their respective providers. Please
                                        ensure you understand the pricing model
                                        of each service before enabling them.
                                    </p>
                                </div>
                            </div>


                        </div>
                    </div>

                    <!-- Advanced Settings -->
                    <div class="p-6" v-if="activeTab === 'advanced'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Advanced Settings
                        </h2>
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Analytics Code</label
                                >
                                <textarea
                                    v-model="settings.analyticsCode"
                                    rows="4"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="<!-- Google Analytics or other tracking code -->"
                                ></textarea>
                                <p class="text-xs text-neutral-500">
                                    Paste your Google Analytics, Tag Manager or
                                    other tracking code.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Custom Head Scripts</label
                                >
                                <textarea
                                    v-model="settings.customCss"
                                    rows="4"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="/* Add your custom CSS here */"
                                ></textarea>
                                <p class="text-xs text-neutral-500">
                                    Add custom CSS to your site. This will be
                                    included in the header.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Custom Body Scripts</label
                                >
                                <textarea
                                    v-model="settings.customJs"
                                    rows="4"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="/* Add your custom JavaScript here */"
                                ></textarea>
                                <p class="text-xs text-neutral-500">
                                    Add custom JavaScript to your site. This
                                    will be included in the footer.
                                </p>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Robots.txt</label
                                >
                                <textarea
                                    v-model="settings.robotsTxt"
                                    rows="4"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="User-agent: *&#10;Allow: /"
                                ></textarea>
                                <p class="text-xs text-neutral-500">
                                    Customize your robots.txt file to control
                                    search engine indexing.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Advertising Settings -->
                    <div class="p-6" v-if="activeTab === 'advertising'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Advertising Settings
                        </h2>
                        <div class="space-y-8">
                            <!-- Global Ad Settings -->
                            <div class="space-y-4">
                                <h3 class="text-lg font-medium text-white border-b border-neutral-700 pb-2">
                                    Global Ad Settings
                                </h3>
                                <div class="space-y-2">
                                    <div class="flex items-center">
                                        <input
                                            id="enable-ads"
                                            type="checkbox"
                                            v-model="settings.enableAds"
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                    <label
                                            for="enable-ads"
                                            class="text-sm text-neutral-300"
                                            >Enable ads across the site</label
                                        >
                                </div>
                            </div>
                                    <div class="space-y-2">
                                    <div class="flex items-center">
                                        <input
                                            id="show-ads-logged-in"
                                            type="checkbox"
                                            v-model="settings.showAdsLoggedIn"
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="show-ads-logged-in"
                                            class="text-sm text-neutral-300"
                                            >Show ads to logged-in users</label
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Google AdSense -->
                            <div class="space-y-4 p-4 border border-neutral-700 rounded-md">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-white">
                                        Google AdSense
                                    </h3>
                                    <div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                        <input
                                                type="checkbox"
                                                v-model="settings.enableAdSense"
                                                class="sr-only peer"
                                            />
                                            <div class="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div v-if="settings.enableAdSense" class="space-y-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            AdSense Publisher ID
                                        </label>
                                        <input
                                            v-model="settings.adSensePublisherId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="pub-xxxxxxxxxxxxxxxx"
                                        />
                                        <p class="text-xs text-neutral-500">
                                            Your Google AdSense publisher ID (e.g., pub-1234567890123456)
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Auto Ads Code
                                        </label>
                                        <textarea
                                            v-model="settings.adSenseAutoAdsCode"
                                            rows="4"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="<script async src=&quot;https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx&quot; crossorigin=&quot;anonymous&quot;></script>"
                                        ></textarea>
                                        <p class="text-xs text-neutral-500">
                                            Paste your AdSense auto ads code here. This will be included in the head section of your site.
                                        </p>
                                </div>

                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input
                                                id="enable-auto-ads"
                                                type="checkbox"
                                                v-model="settings.enableAdSenseAutoAds"
                                                class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                            />
                                            <label
                                                for="enable-auto-ads"
                                                class="text-sm text-neutral-300"
                                                >Enable Auto Ads (let Google place ads automatically)</label
                                            >
                                        </div>
                                        </div>

                                    <div class="space-y-4 mt-4">
                                        <h4 class="text-base font-medium text-neutral-300 border-b border-neutral-700 pb-2">
                                            Ad Unit Codes
                                        </h4>
                                        <p class="text-xs text-neutral-400 mb-4">
                                            Add your individual ad unit codes for specific placements throughout your site.
                                            These will be used if Auto Ads is disabled or for more control over ad placements.
                                        </p>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Header Banner (728x90)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseHeaderBanner"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:728px;height:90px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                        </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                After Article Title (728x90)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseAfterTitle"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:728px;height:90px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                    </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                After Cover Banner (728x90)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseAfterCover"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:728px;height:90px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                </div>

                                <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Sidebar Top (300x250)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseSidebarTop"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:300px;height:250px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                </div>

                                <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Sidebar Middle (300x250)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseSidebarMid"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:300px;height:250px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Sidebar Bottom (300x250)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseSidebarBottom"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:300px;height:250px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                            </div>

                                    <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Left Sidebar (160x600)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseSidebarLeft"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:160px;height:600px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                    </div>

                                    <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                In-Content Ad (Article Middle)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseInArticle"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:728px;height:90px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                </div>

                                    <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Below Content Banner (728x90)
                                            </label>
                                            <textarea
                                                v-model="settings.adSenseBelowContent"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="<ins class=&quot;adsbygoogle&quot; style=&quot;display:inline-block;width:728px;height:90px&quot; data-ad-client=&quot;ca-pub-xxxxxxxxxxxxxxxx&quot; data-ad-slot=&quot;xxxxxxxxxx&quot;></ins>"
                                            ></textarea>
                                        </div>
                                    </div>
                                    </div>
                                </div>

                            <!-- Amazon Affiliate -->
                            <div class="space-y-4 p-4 border border-neutral-700 rounded-md">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-white">
                                        Amazon Affiliate
                                    </h3>
                                    <div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                    <input
                                                type="checkbox"
                                                v-model="settings.enableAmazonAds"
                                                class="sr-only peer"
                                            />
                                            <div class="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div v-if="settings.enableAmazonAds" class="space-y-4">
                                <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Amazon Associate ID
                                        </label>
                                    <input
                                            v-model="settings.amazonAssociateId"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="yourstore-20"
                                    />
                                        <p class="text-xs text-neutral-500">
                                            Your Amazon Associate tracking ID (e.g., yourstore-20)
                                        </p>
                            </div>

                                    <div class="space-y-4 mt-4">
                                        <h4 class="text-base font-medium text-neutral-300 border-b border-neutral-700 pb-2">
                                            Amazon Native Shopping Ads
                                        </h4>

                                <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Sidebar Ad (Recommendation Ads)
                                            </label>
                                            <textarea
                                                v-model="settings.amazonSidebarAd"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            ></textarea>
                                    </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                In-Content Ad (Search Ads)
                                            </label>
                                            <textarea
                                                v-model="settings.amazonInContentAd"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            ></textarea>
                                        </div>

                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Below Content (Responsive Ads)
                                            </label>
                                            <textarea
                                                v-model="settings.amazonBelowContentAd"
                                                rows="3"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                            <!-- Taboola Ads -->
                            <div class="space-y-4 p-4 border border-neutral-700 rounded-md">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-white">
                                        Taboola Ads
                                    </h3>
                                    <div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                v-model="settings.enableTaboolaAds"
                                                class="sr-only peer"
                                            />
                                            <div class="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div v-if="settings.enableTaboolaAds" class="space-y-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Taboola Publisher ID
                                        </label>
                                        <input
                                            v-model="settings.taboolaPublisherId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="yoursite-yourcode"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Below Article Widget
                                        </label>
                                        <textarea
                                            v-model="settings.taboolaBelowArticle"
                                            rows="4"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="<div id='taboola-below-article-thumbnails'></div><script>window._taboola = window._taboola || [];_taboola.push({mode: 'thumbnails-a',container: 'taboola-below-article-thumbnails',placement: 'Below Article Thumbnails',target_type: 'mix'});</script>"
                                        ></textarea>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Right Rail Widget
                                        </label>
                                        <textarea
                                            v-model="settings.taboolaRightRail"
                                            rows="4"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="<div id='taboola-right-rail-thumbnails'></div><script>window._taboola = window._taboola || [];_taboola.push({mode: 'thumbnails-rr',container: 'taboola-right-rail-thumbnails',placement: 'Right Rail Thumbnails',target_type: 'mix'});</script>"
                                        ></textarea>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Footer Widget
                                        </label>
                                        <textarea
                                            v-model="settings.taboolaFooter"
                                            rows="4"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="<div id='taboola-footer'></div><script>window._taboola = window._taboola || [];_taboola.push({mode: 'thumbnails-f',container: 'taboola-footer',placement: 'Footer',target_type: 'mix'});</script>"
                                        ></textarea>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Taboola JS Code (Put at the bottom)
                                        </label>
                                        <textarea
                                            v-model="settings.taboolaJsCode"
                                            rows="4"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="<script>window._taboola = window._taboola || []; _taboola.push({flush: true});</script> <script type='text/javascript' src='//cdn.taboola.com/libtrc/yoursite-yourcode/loader.js' async></script>"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Ad Placement Configuration -->
                            <div class="space-y-4 p-4 border border-neutral-700 rounded-md">
                                <h3 class="text-lg font-medium text-white border-b border-neutral-700 pb-2">
                                    Ad Placement Configuration
                                </h3>

                                <div class="space-y-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Home Page Positions
                                        </label>
                                        <div class="space-y-1">
                                            <div class="flex items-center">
                                                <input
                                                    id="home-header"
                                                    type="checkbox"
                                                    v-model="settings.homePageHeader"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                        <label
                                                    for="home-header"
                                                    class="text-sm text-neutral-300"
                                                    >Header Banner</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                        <input
                                                    id="home-sidebar-top"
                                                    type="checkbox"
                                                    v-model="settings.homePageSidebarTop"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="home-sidebar-top"
                                                    class="text-sm text-neutral-300"
                                                    >Sidebar Top</label
                                                >
                                    </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="home-sidebar-mid"
                                                    type="checkbox"
                                                    v-model="settings.homePageSidebarMid"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                        <label
                                                    for="home-sidebar-mid"
                                                    class="text-sm text-neutral-300"
                                                    >Sidebar Middle</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="home-sidebar-bottom"
                                                    type="checkbox"
                                                    v-model="settings.homePageSidebarBottom"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="home-sidebar-bottom"
                                                    class="text-sm text-neutral-300"
                                                    >Sidebar Bottom</label
                                                >
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="home-sidebar-left"
                                                    type="checkbox"
                                                    v-model="settings.homePageSidebarLeft"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="home-sidebar-left"
                                                    class="text-sm text-neutral-300"
                                                    >Left Sidebar</label
                                                >
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="home-after-cover"
                                                    type="checkbox"
                                                    v-model="settings.homePageAfterCover"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="home-after-cover"
                                                    class="text-sm text-neutral-300"
                                                    >After Cover</label
                                                >
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="home-after-posts"
                                                    type="checkbox"
                                                    v-model="settings.homePageAfterPosts"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                        <label
                                                    for="home-after-posts"
                                                    class="text-sm text-neutral-300"
                                                    >After Post List</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                            <input
                                                    id="home-footer"
                                                type="checkbox"
                                                    v-model="settings.homePageFooter"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="home-footer"
                                                    class="text-sm text-neutral-300"
                                                    >Footer</label
                                                >
                                            </div>
                                    </div>
                                </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Article Page Positions
                                        </label>
                                        <div class="space-y-1">
                                            <div class="flex items-center">
                                                <input
                                                    id="article-header"
                                                    type="checkbox"
                                                    v-model="settings.articlePageHeader"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                        <label
                                                    for="article-header"
                                                    class="text-sm text-neutral-300"
                                                    >Header Banner</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                        <input
                                                    id="article-sidebar-top"
                                                    type="checkbox"
                                                    v-model="settings.articlePageSidebarTop"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                        <label
                                                    for="article-sidebar-top"
                                                    class="text-sm text-neutral-300"
                                                    >Sidebar Top</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                        <input
                                                    id="article-sidebar-mid"
                                                    type="checkbox"
                                                    v-model="settings.articlePageSidebarMid"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                                    for="article-sidebar-mid"
                                                    class="text-sm text-neutral-300"
                                                    >Sidebar Middle</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                        <input
                                                    id="article-sidebar-bottom"
                                                    type="checkbox"
                                                    v-model="settings.articlePageSidebarBottom"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="article-sidebar-bottom"
                                                    class="text-sm text-neutral-300"
                                                    >Sidebar Bottom</label
                                                >
                                    </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="article-sidebar-left"
                                                    type="checkbox"
                                                    v-model="settings.articlePageSidebarLeft"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                        <label
                                                    for="article-sidebar-left"
                                                    class="text-sm text-neutral-300"
                                                    >Left Sidebar</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                        <input
                                                    id="article-after-title"
                                                    type="checkbox"
                                                    v-model="settings.articlePageAfterTitle"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="article-after-title"
                                                    class="text-sm text-neutral-300"
                                                    >After Article Title</label
                                                >
                                    </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="article-in-content"
                                                    type="checkbox"
                                                    v-model="settings.articlePageInContent"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                        <label
                                                    for="article-in-content"
                                                    class="text-sm text-neutral-300"
                                                    >In Content (Middle)</label
                                        >
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="article-after-content"
                                                    type="checkbox"
                                                    v-model="settings.articlePageAfterContent"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="article-after-content"
                                                    class="text-sm text-neutral-300"
                                                    >After Content</label
                                                >
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="article-footer"
                                                    type="checkbox"
                                                    v-model="settings.articlePageFooter"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="article-footer"
                                                    class="text-sm text-neutral-300"
                                                    >Footer</label
                                                >
                                            </div>
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            In-Content Ads Configuration
                                        </label>
                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Paragraph gap (insert ad after every X paragraphs)
                                            </label>
                                            <input
                                                v-model="settings.inContentAdGap"
                                                type="number"
                                                min="1"
                                                max="10"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <p class="text-xs text-neutral-500">
                                                For in-content ads, specify after how many paragraphs to insert an ad
                                            </p>
                                        </div>
                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-neutral-300">
                                                Maximum in-content ads per article
                                            </label>
                                            <input
                                                v-model="settings.maxInContentAds"
                                                type="number"
                                                min="0"
                                                max="5"
                                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <p class="text-xs text-neutral-500">
                                                Limit the number of ads displayed within article content (0 for unlimited)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Email Settings -->
                    <div class="p-6" v-if="activeTab === 'email'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Email Settings
                        </h2>
                        <div class="space-y-8">
                            <!-- Email Provider Selection -->
                            <div class="space-y-4">
                                    <div class="space-y-2">
                                        <label
                                            class="block text-sm font-medium text-neutral-300"
                                        >Email Provider</label
                                        >
                                    <select
                                        v-model="settings.emailProvider"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="us-east-2">US East (Ohio)</option>
                                        <option value="us-west-1">US West (N. California)</option>
                                        <option value="us-west-2">US West (Oregon)</option>
                                        <option value="af-south-1">Africa (Cape Town)</option>
                                        <option value="ap-east-1">Asia Pacific (Hong Kong)</option>
                                        <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                                        <option value="ap-northeast-3">Asia Pacific (Osaka)</option>
                                        <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                        <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                                        <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                                        <option value="ca-central-1">Canada (Central)</option>
                                        <option value="eu-central-1">Europe (Frankfurt)</option>
                                        <option value="eu-west-1">Europe (Ireland)</option>
                                        <option value="eu-west-2">Europe (London)</option>
                                        <option value="eu-south-1">Europe (Milan)</option>
                                        <option value="eu-west-3">Europe (Paris)</option>
                                        <option value="eu-north-1">Europe (Stockholm)</option>
                                        <option value="me-south-1">Middle East (Bahrain)</option>
                                        <option value="sa-east-1">South America (São Paulo)</option>
                                    </select>
                                    <p class="text-xs text-neutral-500">
                                        The AWS region where your CloudFront distribution is located. Default is us-east-1.
                                    </p>
                                </div>

                                <div class="mt-4">
                                    <h4
                                        class="text-sm font-medium text-neutral-300 mb-2"
                                    >
                                        How to set up AWS CloudFront access:
                                    </h4>
                                    <ol
                                        class="list-decimal pl-5 space-y-1 text-sm text-neutral-400"
                                    >
                                        <li>
                                            Create an IAM user with permissions for CloudFront invalidations
                                        </li>
                                        <li>
                                            Generate an Access Key and Secret Key for this user
                                        </li>
                                        <li>
                                            Find your Distribution ID in the CloudFront console
                                        </li>
                                        <li>
                                            Enter the details above to enable cache invalidation
                                        </li>
                                    </ol>
                                    <a
                                        href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessingCloudFront.html"
                                        target="_blank"
                                        class="inline-flex items-center mt-2 text-blue-400 hover:underline"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        CloudFront Documentation
                                    </a>
                                </div>

                                <div class="mt-4">
                                            <button
                                        @click="purgeCloudFrontCacheTest"
                                        class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                        :disabled="cfCachePurgeInProgress"
                                            >
                                        <span v-if="cfCachePurgeInProgress" class="flex items-center">
                                            <svg
                                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    class="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    stroke-width="4"
                                                ></circle>
                                                <path
                                                    class="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Purging...
                                        </span>
                                        <span v-else>Test CloudFront Cache Purge</span>
                                            </button>
                                        </div>
                                    </div>

                            <!-- Global Cache Settings -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Global Cache Settings
                                </h3>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Auto-Purge Cache</label
                                    >
                                    <div class="flex items-center">
                                        <input
                                            id="auto-purge-cache"
                                            type="checkbox"
                                            v-model="settings.autoPurgeCache"
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="auto-purge-cache"
                                            class="text-sm text-neutral-300"
                                            >Automatically purge CDN cache when content is updated</label
                                        >
                                    </div>
                                </div>

                                <div class="mt-4">
                                    <button
                                        @click="purgeAllCaches"
                                        class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                        :disabled="allCachePurgeInProgress"
                                    >
                                        <span v-if="allCachePurgeInProgress" class="flex items-center">
                                            <svg
                                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    class="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    stroke-width="4"
                                                ></circle>
                                                <path
                                                    class="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Purging All Caches...
                                        </span>
                                        <span v-else>Purge All CDN Caches</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CDN Settings -->
                    <div class="p-6" v-if="activeTab === 'cdn'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            CDN Settings
                        </h2>
                        <div class="space-y-8">
                            <!-- Cloudflare CDN -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Cloudflare CDN
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >API Token</label
                                    >
                                    <input
                                        v-model="settings.cloudflareToken"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Cloudflare API token"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Required for Cloudflare cache purging. Create a token with the "Cache Purge" permission.
                                    </p>
                </div>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Zone ID</label
                                    >
                                    <input
                                        v-model="settings.cloudflareZoneId"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Cloudflare Zone ID"
                                    />
                                    <p class="text-xs text-neutral-500">
                                        Your Cloudflare Zone ID found in the Cloudflare dashboard
                                    </p>
            </div>

                                <div class="mt-4">
                                    <h4
                                        class="text-sm font-medium text-neutral-300 mb-2"
                                    >
                                        How to set up Cloudflare API access:
                                    </h4>
                                    <ol
                                        class="list-decimal pl-5 space-y-1 text-sm text-neutral-400"
                                    >
                                        <li>
                                            Go to the Cloudflare dashboard
                                        </li>
                                        <li>
                                            Navigate to "My Profile" > "API Tokens"
                                        </li>
                                        <li>
                                            Create a custom token with "Cache Purge" permissions
                                        </li>
                                        <li>
                                            Grab your Zone ID from the Overview page of your domain
                                        </li>
                                    </ol>
                                    <a
                                        href="https://developers.cloudflare.com/api/tokens/"
                                        target="_blank"
                                        class="inline-flex items-center mt-2 text-blue-400 hover:underline"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        Cloudflare API Documentation
                                    </a>
                                </div>

                                <div class="mt-4">
                                    <button
                                        @click="purgeCloudflareCacheTest"
                                        class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                        :disabled="cachePurgeInProgress"
                                    >
                                        <span v-if="cachePurgeInProgress" class="flex items-center">
                                            <svg
                                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    class="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    stroke-width="4"
                                                ></circle>
                                                <path
                                                    class="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Purging...
                                        </span>
                                        <span v-else>Test Cloudflare Cache Purge</span>
                                    </button>
                                </div>
                            </div>

                            <!-- AWS CloudFront CDN -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    AWS CloudFront CDN
                                </h3>
                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Access Key</label
                                    >
                                    <input
                                        v-model="settings.cloudfrontAccessKey"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your AWS Access Key"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Secret Key</label
                                    >
                                    <input
                                        v-model="settings.cloudfrontSecretKey"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your AWS Secret Key"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Distribution ID</label
                                    >
                                    <input
                                        v-model="settings.cloudfrontDistributionId"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your CloudFront Distribution ID"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >AWS Region</label
                                    >
                                    <select
                                        v-model="settings.cloudfrontRegion"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="us-east-2">US East (Ohio)</option>
                                        <option value="us-west-1">US West (N. California)</option>
                                        <option value="us-west-2">US West (Oregon)</option>
                                        <option value="af-south-1">Africa (Cape Town)</option>
                                        <option value="ap-east-1">Asia Pacific (Hong Kong)</option>
                                        <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                                        <option value="ap-northeast-3">Asia Pacific (Osaka)</option>
                                        <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                        <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                                        <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                                        <option value="ca-central-1">Canada (Central)</option>
                                        <option value="eu-central-1">Europe (Frankfurt)</option>
                                        <option value="eu-west-1">Europe (Ireland)</option>
                                        <option value="eu-west-2">Europe (London)</option>
                                        <option value="eu-south-1">Europe (Milan)</option>
                                        <option value="eu-west-3">Europe (Paris)</option>
                                        <option value="eu-north-1">Europe (Stockholm)</option>
                                        <option value="me-south-1">Middle East (Bahrain)</option>
                                        <option value="sa-east-1">South America (São Paulo)</option>
                                    </select>
                                    <p class="text-xs text-neutral-500">
                                        The AWS region where your CloudFront distribution is located. Default is us-east-1.
                                    </p>
                                </div>

                                <div class="mt-4">
                                    <h4
                                        class="text-sm font-medium text-neutral-300 mb-2"
                                    >
                                        How to set up AWS CloudFront access:
                                    </h4>
                                    <ol
                                        class="list-decimal pl-5 space-y-1 text-sm text-neutral-400"
                                    >
                                        <li>
                                            Create an IAM user with permissions for CloudFront invalidations
                                        </li>
                                        <li>
                                            Generate an Access Key and Secret Key for this user
                                        </li>
                                        <li>
                                            Find your Distribution ID in the CloudFront console
                                        </li>
                                        <li>
                                            Enter the details above to enable cache invalidation
                                        </li>
                                    </ol>
                                    <a
                                        href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessingCloudFront.html"
                                        target="_blank"
                                        class="inline-flex items-center mt-2 text-blue-400 hover:underline"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-4 w-4 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        CloudFront Documentation
                                    </a>
                                </div>

                                <div class="mt-4">
                                    <button
                                        @click="purgeCloudFrontCacheTest"
                                        class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                        :disabled="cfCachePurgeInProgress"
                                    >
                                        <span v-if="cfCachePurgeInProgress" class="flex items-center">
                                            <svg
                                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    class="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    stroke-width="4"
                                                ></circle>
                                                <path
                                                    class="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Purging...
                                        </span>
                                        <span v-else>Test CloudFront Cache Purge</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Global Cache Settings -->
                            <div
                                class="space-y-4 p-4 border border-neutral-700 rounded-md"
                            >
                                <h3
                                    class="text-lg font-medium text-white border-b border-neutral-700 pb-2"
                                >
                                    Global Cache Settings
                                </h3>

                                <div class="space-y-2">
                                    <label
                                        class="block text-sm font-medium text-neutral-300"
                                        >Auto-Purge Cache</label
                                    >
                                    <div class="flex items-center">
                                        <input
                                            id="auto-purge-cache"
                                            type="checkbox"
                                            v-model="settings.autoPurgeCache"
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="auto-purge-cache"
                                            class="text-sm text-neutral-300"
                                            >Automatically purge CDN cache when content is updated</label
                                        >
                                    </div>
                                </div>

                                <div class="mt-4">
                                    <button
                                        @click="purgeAllCaches"
                                        class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                        :disabled="allCachePurgeInProgress"
                                    >
                                        <span v-if="allCachePurgeInProgress" class="flex items-center">
                                            <svg
                                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    class="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    stroke-width="4"
                                                ></circle>
                                                <path
                                                    class="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Purging All Caches...
                                        </span>
                                        <span v-else>Purge All CDN Caches</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Storage Settings -->
                    <div class="p-6" v-if="activeTab === 'storage'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Storage Settings
                        </h2>
                        <div class="space-y-8">
                            <!-- Storage Type -->
                            <div class="space-y-2">
                                <label
                                    class="block text-sm font-medium text-neutral-300"
                                    >Storage Type</label
                                >
                                <select
                                    v-model="settings.storageType"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="local">Local Storage</option>
                                    <option value="s3">AWS S3</option>
                                    <option value="spaces">Digital Ocean Spaces</option>
                                </select>
                                <p class="text-xs text-neutral-500">
                                    Select the storage type for your media files.
                                </p>
                            </div>

                            <!-- AWS S3 Settings -->
                            <div v-if="settings.storageType === 's3'" class="space-y-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Access Key
                                    </label>
                                    <input
                                        v-model="settings.s3AccessKey"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your AWS Access Key"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Secret Key
                                    </label>
                                    <input
                                        v-model="settings.s3SecretKey"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your AWS Secret Key"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Bucket
                                    </label>
                                    <input
                                        v-model="settings.s3Bucket"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your S3 bucket name"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Region
                                    </label>
                                    <select
                                        v-model="settings.s3Region"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="us-east-2">US East (Ohio)</option>
                                        <option value="us-west-1">US West (N. California)</option>
                                        <option value="us-west-2">US West (Oregon)</option>
                                        <option value="af-south-1">Africa (Cape Town)</option>
                                        <option value="ap-east-1">Asia Pacific (Hong Kong)</option>
                                        <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                                        <option value="ap-northeast-3">Asia Pacific (Osaka)</option>
                                        <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                        <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                                        <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                                        <option value="ca-central-1">Canada (Central)</option>
                                        <option value="eu-central-1">Europe (Frankfurt)</option>
                                        <option value="eu-west-1">Europe (Ireland)</option>
                                        <option value="eu-west-2">Europe (London)</option>
                                        <option value="eu-south-1">Europe (Milan)</option>
                                        <option value="eu-west-3">Europe (Paris)</option>
                                        <option value="eu-north-1">Europe (Stockholm)</option>
                                        <option value="me-south-1">Middle East (Bahrain)</option>
                                        <option value="sa-east-1">South America (São Paulo)</option>
                                    </select>
                                    <p class="text-xs text-neutral-500">
                                        The AWS region where your S3 bucket is located. Default is us-east-1.
                                    </p>
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Endpoint
                                    </label>
                                    <input
                                        v-model="settings.s3Endpoint"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your S3 endpoint URL"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Use Path Style
                                    </label>
                                    <div class="flex items-center">
                                        <input
                                            id="s3-use-path-style"
                                            type="checkbox"
                                            v-model="settings.s3UsePathStyle"
                                            class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <label
                                            for="s3-use-path-style"
                                            class="text-sm text-neutral-300"
                                            >Use path style URLs</label
                                        >
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Bucket URL
                                    </label>
                                    <input
                                        v-model="settings.s3BucketUrl"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your S3 bucket URL"
                                    />
                                </div>
                            </div>

                            <!-- Digital Ocean Spaces Settings -->
                            <div v-if="settings.storageType === 'spaces'" class="space-y-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Access Key
                                    </label>
                                    <input
                                        v-model="settings.spacesAccessKey"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Digital Ocean Spaces access key"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Secret Key
                                    </label>
                                    <input
                                        v-model="settings.spacesSecretKey"
                                        type="password"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Digital Ocean Spaces secret key"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Name
                                    </label>
                                    <input
                                        v-model="settings.spacesName"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Digital Ocean Spaces name"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Region
                                    </label>
                                    <select
                                        v-model="settings.spacesRegion"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="nyc3">New York 3</option>
                                        <option value="sfo3">San Francisco 3</option>
                                        <option value="ams3">Amsterdam 3</option>
                                        <option value="sgp1">Singapore 1</option>
                                        <option value="fra1">Frankfurt 1</option>
                                        <option value="lon1">London 1</option>
                                        <option value="blr1">Bangalore 1</option>
                                        <option value="syd1">Sydney 1</option>
                                        <option value="tor1">Toronto 1</option>
                                        <option value="sfo2">San Francisco 2</option>
                                        <option value="ams2">Amsterdam 2</option>
                                        <option value="sgp2">Singapore 2</option>
                                        <option value="lon2">London 2</option>
                                        <option value="blr2">Bangalore 2</option>
                                        <option value="syd2">Sydney 2</option>
                                        <option value="tor2">Toronto 2</option>
                                    </select>
                                    <p class="text-xs text-neutral-500">
                                        The region where your Digital Ocean Spaces is located. Default is nyc3.
                                    </p>
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        Endpoint
                                    </label>
                                    <input
                                        v-model="settings.spacesEndpoint"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Digital Ocean Spaces endpoint URL"
                                    />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-neutral-300">
                                        URL
                                    </label>
                                    <input
                                        v-model="settings.spacesUrl"
                                        type="text"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your Digital Ocean Spaces URL"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Notifications Settings -->
                    <div class="p-6" v-if="activeTab === 'notifications'">
                        <h2 class="text-xl font-bold text-white mb-6">
                            Notification Settings
                        </h2>
                        <div class="space-y-8">
                            <!-- OneSignal Integration -->
                            <div class="space-y-4 p-4 border border-neutral-700 rounded-md">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-white">
                                        OneSignal Web Push Notifications
                                    </h3>
                                    <div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                v-model="settings.oneSignalEnabled"
                                                class="sr-only peer"
                                            />
                                            <div class="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div v-if="settings.oneSignalEnabled" class="space-y-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            OneSignal App ID
                                        </label>
                                        <input
                                            v-model="settings.oneSignalAppId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            OneSignal API Key
                                        </label>
                                        <input
                                            v-model="settings.oneSignalApiKey"
                                            type="password"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="••••••••••••"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-neutral-300">
                                            Safari Web ID (Optional)
                                        </label>
                                        <input
                                            v-model="settings.oneSignalSafariWebId"
                                            type="text"
                                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="web.onesignal.auto.xxxxxxxxxxxx"
                                        />
                                    </div>

                                    <div class="space-y-2 mt-4">
                                        <h4 class="text-sm font-medium text-neutral-300 mb-1">
                                            Notification Settings
                                        </h4>
                                        <div class="space-y-2">
                                            <div class="flex items-center">
                                                <input
                                                    id="notify-new-post"
                                                    type="checkbox"
                                                    v-model="settings.notifyOnNewPost"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="notify-new-post"
                                                    class="text-sm text-neutral-300"
                                                >
                                                    Send notification when new post is published
                                                </label>
                                            </div>
                                            <div class="flex items-center">
                                                <input
                                                    id="notify-new-comment"
                                                    type="checkbox"
                                                    v-model="settings.notifyOnNewComment"
                                                    class="h-4 w-4 mr-2 rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    for="notify-new-comment"
                                                    class="text-sm text-neutral-300"
                                                >
                                                    Send notification for new comments
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <a
                                            href="https://documentation.onesignal.com/docs/web-push-quickstart"
                                            target="_blank"
                                            class="text-blue-500 hover:text-blue-400 text-sm flex items-center"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            OneSignal Documentation
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast notifications -->
        <div
            v-if="notification.show"
            class="fixed bottom-4 right-4 px-6 py-3 rounded-md shadow-lg flex items-center z-50"
            :class="
                notification.type === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
            "
        >
            <span v-if="notification.type === 'success'" class="mr-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                    />
                </svg>
            </span>
            <span v-else class="mr-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
            </span>
            <span>{{ notification.message }}</span>
            <button
                @click="notification.show = false"
                class="ml-4 text-white hover:text-neutral-200"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAdminClient } from "@cmmv/blog/admin/client";

const adminClient = useAdminClient();
const saving = ref(false);

const tabs = [
    { id: "general", name: "General", icon: "fas fa-cog" },
    { id: "discussion", name: "Discussion", icon: "fas fa-comments" },
    { id: "social", name: "Social Media", icon: "fas fa-share-alt" },
    { id: "social-auto-posting", name: "Auto-Posting", icon: "fas fa-paper-plane" },
    { id: "integrations", name: "Integrations", icon: "fas fa-plug" },
    { id: "cdn", name: "CDN", icon: "fas fa-server" },
    { id: "storage", name: "Storage", icon: "fas fa-database" },
    { id: "seo", name: "SEO", icon: "fas fa-search" },
    {
        id: "search-integrations",
        name: "Search Integrations",
        icon: "fas fa-search-plus",
    },
    { id: "email", name: "Email", icon: "fas fa-envelope" },
    {
        id: "notifications",
        name: "Notifications",
        icon: "fas fa-bell",
    },
    { id: "ai", name: "AI Tools", icon: "fas fa-robot" },
    { id: "advanced", name: "Advanced", icon: "fas fa-code" },
    { id: "advertising", name: "Advertising", icon: "fas fa-ad" },
];

const activeTab = ref("general");
const isLoading = ref(true);
const originalSettings = ref([]);

const settings = ref({
    // General
    title: "",
    description: "",
    url: "",
    language: "en",
    siteType: "blog",
    timezone: "UTC",
    adminEmail: "",

    // Appearance
    logo: "",
    favicon: "",
    primaryColor: "#3490dc",
    secondaryColor: "#38c172",
    fontFamily: "sans-serif",

    // Reading
    homepageDisplay: "latest_posts",
    homepage: "home",
    postsPage: "blog",
    postsperpage: 10,
    rssFeedItems: 10,
    feedContent: "full_text",

    // Discussion
    commentSystem: "native",
    facebookAppId: "",
    facebookCommentsNum: 5,
    facebookColorScheme: "light",

    disqusShortname: "",
    disqusLazyLoad: true,

    // Native Comments
    enablecomments: true,
    moderatecomments: true,
    approveComments: true,
    requireNameEmail: true,
    nestedComments: true,
    commentPagination: false,
    commentsPerPage: 50,
    emailOnComment: true,
    emailOnModeration: true,

    // Social
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    github: "",
    whatsapp: "",
    telegram: "",
    discord: "",

    // Integrations
    youtubeApiKey: "",
    twitterBearerToken: "",
    redditClientId: "",
    redditClientSecret: "",
    redditUsername: "",
    redditPassword: "",

    // SEO
    metaDescription: "",
    metaKeywords: "",
    defaultFeaturedImage: "",

    // AI Integration
    aiService: "gemini",
    geminiApiKey: "",
    openaiApiKey: "",
    grokApiKey: "",
    deepseekApiKey: "",
    classifyPrompt: "",
    promptsOverride: false,

    // Advanced
    analyticsCode: "",
    customCss: "",
    customJs: "",
    robotsTxt: "User-agent: *\nAllow: /",
    searchMetadata: "",

    // Search Integrations
    googleSiteVerification: "",
    googleAnalyticsId: "",
    googleIndexingApiKey: "",
    googleIndexingServiceAccount: "",
    autoIndexNewContent: true,
    bingSiteVerification: "",
    yandexSiteVerification: "",
    baiduSiteVerification: "",
    additionalMetaTags: "",

    // Email Settings
    emailProvider: "none",
    // SMTP Settings
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    smtpEncryption: "tls",
    smtpFromEmail: "",
    smtpFromName: "",
    // AWS SES Settings
    awsAccessKey: "",
    awsSecretKey: "",
    awsRegion: "us-east-1",
    awsFromEmail: "",
    awsFromName: "",

    // OneSignal
    oneSignalEnabled: false,
    oneSignalAppId: "",
    oneSignalApiKey: "",
    oneSignalSafariWebId: "",
    notifyOnNewPost: true,
    notifyOnNewComment: false,
    // Twilio
    twilioEnabled: false,
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioFromNumber: "",
    twilioAdminNumber: "",
    smsOnNewComment: false,
    smsOnNewUser: false,

    autoPostOnNewContent: true,
    autoPostOnContentUpdate: false,
    autoPostFacebook: false,
    autoPostTwitter: false,
    autoPostLinkedIn: false,
    autoPostDefaultFormat: "New post: {title} - {excerpt} {url}",
    autoPostSharePosts: true,
    autoPostSharePages: true,
    delayAutoPosting: false,
    autoPostDelayMinutes: 0,
    timeBetweenPosts: 0,
    preferredPostingTime: "",
    enableLinkTracking: false,
    utmSource: "{network}",
    utmMedium: "social",
    utmCampaign: "auto-post",
    utmContent: "{post_id}",
    facebookPageId: "",
    facebookAccessToken: "",
    facebookPostFormat: "New post: {title} - {excerpt} {url}",
    facebookIncludeImage: false,
    twitterApiKey: "",
    twitterApiSecret: "",
    twitterAccessToken: "",
    twitterAccessTokenSecret: "",
    twitterPostFormat: "New post: {title} {url}",
    twitterIncludeImage: false,
    linkedInAccessToken: "",
    linkedInPostFormat: "New post: {title} - {excerpt} {url}",
    linkedInIncludeImage: false,

    // CDN Settings
    cloudflareToken: "",
    cloudflareZoneId: "",
    cloudfrontAccessKey: "",
    cloudfrontSecretKey: "",
    cloudfrontDistributionId: "",
    cloudfrontRegion: "us-east-1",
    autoPurgeCache: true,

    // Storage Settings
    storageType: "local",
    // AWS S3 Settings
    s3AccessKey: "",
    s3SecretKey: "",
    s3Bucket: "",
    s3Region: "us-east-1",
    s3Endpoint: "",
    s3UsePathStyle: false,
    s3BucketUrl: "",
    // Digital Ocean Spaces Settings
    spacesAccessKey: "",
    spacesSecretKey: "",
    spacesName: "",
    spacesRegion: "nyc3",
    spacesEndpoint: "",
    spacesUrl: "",

    // Advertising Settings
    enableAds: true,
    showAdsLoggedIn: false,

    // Google AdSense
    enableAdSense: false,
    adSensePublisherId: "",
    adSenseAutoAdsCode: "",
    enableAdSenseAutoAds: false,
    adSenseHeaderBanner: "",
    adSenseSidebarTop: "",
    adSenseSidebarBottom: "",
    adSenseInArticle: "",
    adSenseBelowContent: "",
    adSenseSidebarMid: "",
    adSenseSidebarLeft: "",
    adSenseSidebarRight: "",
    adSenseAfterCover: "",

    // Custom Ads
    enableCustomAds: false,
    customHeaderBanner: "",
    customSidebarTop: "",
    customSidebarBottom: "",
    customInArticle: "",
    customBelowContent: "",

    // Amazon Affiliate
    enableAmazonAds: false,
    amazonAssociateId: "",
    amazonSidebarAd: "",
    amazonInContentAd: "",
    amazonBelowContentAd: "",

    // Taboola Ads
    enableTaboolaAds: false,
    taboolaPublisherId: "",
    taboolaBelowArticle: "",
    taboolaRightRail: "",
    taboolaFooter: "",
    taboolaJsCode: "",

    // Ad Placement Configuration
    homePageHeader: true,
    homePageSidebarTop: true,
    homePageSidebarBottom: true,
    homePageAfterPosts: true,
    homePageFooter: false,

    articlePageHeader: true,
    articlePageSidebarTop: true,
    articlePageSidebarBottom: true,
    articlePageAfterTitle: false,
    articlePageInContent: true,
    articlePageAfterContent: true,
    articlePageFooter: false,

    // Firebase
    firebaseApiKey: "",
    firebaseAuthDomain: "",
    firebaseProjectId: "",
    firebaseStorageBucket: "",
    firebaseMessagingSenderId: "",
    firebaseAppId: "",
    firebaseProvidersGoogle: false,
    firebaseProvidersFacebook: false,
    firebaseProvidersTwitter: false,
    firebaseProvidersGithub: false,
    firebaseProvidersEmail: false,
    firebaseProvidersPhone: false,
    firebaseProvidersApple: false,

    // Supabase
    supabaseUrl: "",
    supabaseKey: "",
    supabaseBucket: "",
    supabaseBucketUrl: "",
    supabaseBucketPublicUrl: "",
    supabaseProvidersGoogle: false,
    supabaseProvidersFacebook: false,
    supabaseProvidersTwitter: false,
    supabaseProvidersGithub: false,
    supabaseProvidersEmail: false,
    supabaseProvidersPhone: false,
    supabaseProvidersApple: false,

    inContentAdGap: 3,
    maxInContentAds: 2,
});

const tabFieldMap = {
    general: [
        "title",
        "description",
        "url",
        "language",
        "siteType",
        "timezone",
        "adminEmail",
        "homepageDisplay",
        "homepage",
        "postsPage",
        "postsperpage",
        "rssFeedItems",
        "feedContent",
    ],
    appearance: [
        "logo",
        "favicon",
        "primaryColor",
        "secondaryColor",
        "fontFamily",
    ],
    discussion: [
        "commentSystem",
        "facebookAppId",
        "facebookCommentsNum",
        "facebookColorScheme",
        "disqusShortname",
        "disqusLazyLoad",
        "enablecomments",
        "moderatecomments",
        "approveComments",
        "requireNameEmail",
        "nestedComments",
        "commentPagination",
        "commentsPerPage",
        "emailOnComment",
        "emailOnModeration",
    ],
    social: [
        "facebook",
        "twitter",
        "instagram",
        "linkedin",
        "youtube",
        "github",
        "whatsapp",
        "telegram",
        "discord",
    ],
    "social-auto-posting": [
        "autoPostOnNewContent",
        "autoPostOnContentUpdate",
        "autoPostDefaultFormat",
        "autoPostSharePosts",
        "autoPostSharePages",
        "delayAutoPosting",
        "autoPostDelayMinutes",
        "timeBetweenPosts",
        "preferredPostingTime",
        "enableLinkTracking",
        "utmSource",
        "utmMedium",
        "utmCampaign",
        "utmContent",
        "autoPostFacebook",
        "facebookPageId",
        "facebookAccessToken",
        "facebookPostFormat",
        "facebookIncludeImage",
        "autoPostTwitter",
        "twitterApiKey",
        "twitterApiSecret",
        "twitterAccessToken",
        "twitterAccessTokenSecret",
        "twitterPostFormat",
        "twitterIncludeImage",
        "autoPostLinkedIn",
        "linkedInAccessToken",
        "linkedInPostFormat",
        "linkedInIncludeImage",
    ],
    integrations: [
        "youtubeApiKey",
        "twitterBearerToken",
        "redditClientId",
        "redditClientSecret",
        "redditUsername",
        "redditPassword",
        "firebaseApiKey",
        "firebaseAuthDomain",
        "firebaseProjectId",
        "firebaseStorageBucket",
        "firebaseMessagingSenderId",
        "firebaseClientEmail",
        "firebasePrivateKey",
        "firebaseAppId",
        "firebaseProvidersGoogle",
        "firebaseProvidersFacebook",
        "firebaseProvidersTwitter",
        "firebaseProvidersGithub",
        "firebaseProvidersEmail",
        "firebaseProvidersPhone",
        "firebaseProvidersApple",
        "supabaseUrl",
        "supabaseKey",
        "supabaseBucket",
        "supabaseBucketUrl",
        "supabaseBucketPublicUrl",
        "supabaseProvidersGoogle",
        "supabaseProvidersFacebook",
        "supabaseProvidersTwitter",
        "supabaseProvidersGithub",
        "supabaseProvidersEmail",
        "supabaseProvidersPhone",
        "supabaseProvidersApple",
    ],
    seo: [
        "metaDescription",
        "metaKeywords",
        "defaultFeaturedImage"
    ],
    ai: [
        "aiService",
        "geminiApiKey",
        "openaiApiKey",
        "grokApiKey",
        "deepseekApiKey",
        "classifyPrompt",
        "promptsOverride",
    ],
    advanced: [
        "analyticsCode",
        "customCss",
        "customJs",
        "robotsTxt",
        "searchMetadata",
    ],
    "search-integrations": [
        "googleSiteVerification",
        "googleAnalyticsId",
        "googleIndexingApiKey",
        "googleIndexingServiceAccount",
        "autoIndexNewContent",
        "bingSiteVerification",
        "yandexSiteVerification",
        "baiduSiteVerification",
        "additionalMetaTags",
    ],
    email: [
        "emailProvider",
        "smtpHost",
        "smtpPort",
        "smtpUsername",
        "smtpPassword",
        "smtpEncryption",
        "smtpFromEmail",
        "smtpFromName",
        "awsAccessKey",
        "awsSecretKey",
        "awsRegion",
        "awsFromEmail",
        "awsFromName",
    ],
    notifications: [
        "oneSignalEnabled",
        "oneSignalAppId",
        "oneSignalApiKey",
        "oneSignalSafariWebId",
        "notifyOnNewPost",
        "notifyOnNewComment",
        "twilioEnabled",
        "twilioAccountSid",
        "twilioAuthToken",
        "twilioFromNumber",
        "twilioAdminNumber",
        "smsOnNewComment",
        "smsOnNewUser",
    ],
    cdn: [
        "cloudflareToken",
        "cloudflareZoneId",
        "cloudfrontAccessKey",
        "cloudfrontSecretKey",
        "cloudfrontDistributionId",
        "cloudfrontRegion",
        "autoPurgeCache"
    ],
    storage: [
        "storageType",
        "s3AccessKey",
        "s3SecretKey",
        "s3Bucket",
        "s3Region",
        "s3Endpoint",
        "s3UsePathStyle",
        "s3BucketUrl",
        "spacesAccessKey",
        "spacesSecretKey",
        "spacesName",
        "spacesRegion",
        "spacesEndpoint",
        "spacesUrl",
    ],
};

const mapApiSettingsToForm = (apiSettings) => {
    originalSettings.value = apiSettings;

    apiSettings.forEach((setting) => {
        const { key, value, type } = setting;

        if (!key.startsWith("blog.")) return;

        const fieldName = key.replace("blog.", "");
        let convertedValue = value;

        if (type === "boolean") {
            convertedValue = (value === "1" || value === "true") ? true : false;
        } else if (type === "number") {
            convertedValue = parseInt(value, 10);
        }

        settings.value[fieldName] = convertedValue;
    });
};

const mapFormToApiSettings = () => {
    const apiSettings = [...originalSettings.value];

    const settingsMap = new Map();
    apiSettings.forEach((setting, index) => {
        settingsMap.set(setting.key, { value: setting.value, index });
    });

    for (const field in settings.value) {
        const key = `blog.${field}`;
        const value = settings.value[field];

        let type = typeof value;
        if (type === "number") {
            type = "number";
        } else if (type === "boolean") {
            type = "boolean";
        } else {
            type = "string";
        }

        let apiValue = value;
        if (type === "boolean") {
            apiValue = value ? "1" : "0";
        } else if (value !== null && value !== undefined) {
            apiValue = String(value);
        }

        if (settingsMap.has(key)) {
            const { index } = settingsMap.get(key);
            apiSettings[index].value = apiValue;
        } else if (value !== null && value !== undefined && value !== "") {
            apiSettings.push({
                group: "blog",
                key,
                value: apiValue,
                type,
                flags: ["PUBLIC"],
            });
        }
    }

    return apiSettings;
};

const loadSettings = async () => {
    try {
        isLoading.value = true;
        const apiSettings = await adminClient.settings.getRoot();
        mapApiSettingsToForm(apiSettings);
    } catch (error) {
        console.error("Failed to load settings:", error);
    } finally {
        isLoading.value = false;
    }
};

const notification = ref({
    show: false,
    type: "success",
    message: "",
    duration: 3000,
});

const showNotification = (type, message) => {
    notification.value = {
        show: true,
        type,
        message,
        duration: 3000,
    };

    setTimeout(() => {
        notification.value.show = false;
    }, notification.value.duration);
};

const saveSettings = async () => {
    try {
        const apiSettings = mapFormToApiSettings();
        await adminClient.settings.update(apiSettings);
        showNotification("success", "Settings saved successfully!");
    } catch (error) {
        console.error("Failed to save settings:", error);
        showNotification(
            "error",
            "Failed to save settings: " + (error.message || "Unknown error"),
        );
    }
};

const logoInput = ref(null);
const faviconInput = ref(null);
const imageLoading = ref(false);

const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = maxWidth;
                canvas.height = maxHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, maxWidth, maxHeight);

                const dataUrl = canvas.toDataURL(file.type);
                resolve(dataUrl);
            };
        };
    });
};

const uploadImage = async (base64Image) => {
    try {
        const response = await adminClient.medias.processImage({
            image: base64Image,
        });

        return response.url;
    } catch (error) {
        console.error("Failed to upload image:", error);
        showNotification(
            "error",
            "Failed to upload image: " + (error.message || "Unknown error"),
        );
        return null;
    }
};

const handleLogoUpload = async (event) => {
    if (!event.target.files || !event.target.files[0]) return;

    try {
        imageLoading.value = true;
        const file = event.target.files[0];
        const resizedImage = await resizeImage(file, 140, 79);
        const imageUrl = await uploadImage(resizedImage);

        if (imageUrl) {
            settings.value.logo = imageUrl;
            showNotification("success", "Logo uploaded successfully!");
        }
    } catch (error) {
        console.error("Error processing logo:", error);
        showNotification(
            "error",
            "Failed to process logo: " + (error.message || "Unknown error"),
        );
    } finally {
        imageLoading.value = false;
        event.target.value = "";
    }
};

const handleFaviconUpload = async (event) => {
    if (!event.target.files || !event.target.files[0]) return;

    try {
        imageLoading.value = true;
        const file = event.target.files[0];

        if (
            !file.type.match(/image\/(png|x-icon)/) &&
            !file.name.endsWith(".ico")
        ) {
            showNotification(
                "error",
                "Invalid file type. Please select a PNG or ICO file.",
            );
            return;
        }

        const resizedImage = await resizeImage(file, 16, 16);
        const imageUrl = await uploadImage(resizedImage);

        if (imageUrl) {
            settings.value.favicon = imageUrl;
            showNotification("success", "Favicon uploaded successfully!");
        }
    } catch (error) {
        console.error("Error processing favicon:", error);
        showNotification(
            "error",
            "Failed to process favicon: " + (error.message || "Unknown error"),
        );
    } finally {
        imageLoading.value = false;
        event.target.value = "";
    }
};

const removeLogo = () => {
    settings.value.logo = "";
    showNotification("success", "Logo removed");
};

const removeFavicon = () => {
    settings.value.favicon = "";
    showNotification("success", "Favicon removed");
};

const featuredImageInput = ref(null);

const handleDefaultFeaturedImageUpload = async (event) => {
    if (!event.target.files || !event.target.files[0]) return;

    try {
        imageLoading.value = true;
        const file = event.target.files[0];
        const img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const aspectRatio = img.height / img.width;
        const targetWidth = 1200;
        const targetHeight = Math.round(targetWidth * aspectRatio);
        const resizedImage = await resizeImage(file, targetWidth, targetHeight);
        const imageUrl = await uploadImage(resizedImage);

        if (imageUrl) {
            settings.value.defaultFeaturedImage = imageUrl;
            showNotification(
                "success",
                "Default featured image uploaded successfully!",
            );
        }
    } catch (error) {
        console.error("Error processing default featured image:", error);
        showNotification(
            "error",
            "Failed to process image: " + (error.message || "Unknown error"),
        );
    } finally {
        imageLoading.value = false;
        event.target.value = "";
    }
};

const removeDefaultFeaturedImage = () => {
    settings.value.defaultFeaturedImage = "";
    showNotification("success", "Default featured image removed");
};

onMounted(() => {
    loadSettings();
});

const linkedInOAuthInProgress = ref(false);
const linkedInOAuthWindow = ref(null);

const LINKEDIN_CLIENT_ID = "your-linkedin-client-id";
const LINKEDIN_REDIRECT_URI = window.location.origin + "/linkedin-callback";

const startLinkedInOAuth = () => {
    linkedInOAuthInProgress.value = true;

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=r_liteprofile%20w_member_social`;
    linkedInOAuthWindow.value = window.open(
        authUrl,
        "LinkedIn Authorization",
        "width=600,height=600",
    );
    window.addEventListener("message", handleLinkedInCallback);

    const checkClosed = setInterval(() => {
        if (linkedInOAuthWindow.value && linkedInOAuthWindow.value.closed) {
            clearInterval(checkClosed);
            linkedInOAuthInProgress.value = false;
            window.removeEventListener("message", handleLinkedInCallback);
        }
    }, 1000);
};

const handleLinkedInCallback = async (event) => {
    if (event.origin !== window.location.origin) return;

    if (
        event.data &&
        event.data.type === "linkedin-oauth-callback" &&
        event.data.code
    ) {
        if (linkedInOAuthWindow.value) {
            linkedInOAuthWindow.value.close();
            linkedInOAuthWindow.value = null;
        }

        try {
            const response = await adminClient.oauth.exchangeLinkedInCode({
                code: event.data.code,
                redirectUri: LINKEDIN_REDIRECT_URI,
            });

            if (response && response.accessToken) {
                settings.value.linkedInAccessToken = response.accessToken;
                showNotification(
                    "success",
                    "LinkedIn authentication successful!",
                );
            } else {
                throw new Error("Failed to get LinkedIn access token");
            }
        } catch (error) {
            console.error("LinkedIn OAuth error:", error);
            showNotification(
                "error",
                "LinkedIn authentication failed: " +
                    (error.message || "Unknown error"),
            );
        } finally {
            linkedInOAuthInProgress.value = false;
            window.removeEventListener("message", handleLinkedInCallback);
        }
    }
};

const cachePurgeInProgress = ref(false);
const cfCachePurgeInProgress = ref(false);
const allCachePurgeInProgress = ref(false);

const purgeCloudflareCacheTest = async () => {
    if (cachePurgeInProgress.value) return;

    cachePurgeInProgress.value = true;
    try {
        const response = await adminClient.cdn.purgeCloudflareCDN();
        if (response.success) {
            showNotification("success", "Cloudflare cache purged successfully!");
        } else {
            showNotification("error", `Failed to purge Cloudflare cache: ${response.message}`);
        }
    } catch (error) {
        console.error("Error purging Cloudflare cache:", error);
        showNotification("error", "Error purging Cloudflare cache: " + (error.message || "Unknown error"));
    } finally {
        cachePurgeInProgress.value = false;
    }
};

const purgeCloudFrontCacheTest = async () => {
    if (cfCachePurgeInProgress.value) return;

    cfCachePurgeInProgress.value = true;
    try {
        const response = await adminClient.cdn.purgeCloudfrontCDN();
        if (response.success) {
            showNotification("success", "CloudFront cache purged successfully!");
        } else {
            showNotification("error", `Failed to purge CloudFront cache: ${response.message}`);
        }
    } catch (error) {
        console.error("Error purging CloudFront cache:", error);
        showNotification("error", "Error purging CloudFront cache: " + (error.message || "Unknown error"));
    } finally {
        cfCachePurgeInProgress.value = false;
    }
};

const purgeAllCaches = async () => {
    if (allCachePurgeInProgress.value) return;

    allCachePurgeInProgress.value = true;
    try {
        const response = await adminClient.cdn.purgeCDN();
        if (response.cloudflare.success || response.cloudfront.success) {
            let message = "Cache purged successfully: ";
            if (response.cloudflare.success) message += "Cloudflare ";
            if (response.cloudfront.success) message += "CloudFront ";
            showNotification("success", message);
        } else {
            showNotification("error", "Failed to purge CDN caches. Check your settings.");
        }
    } catch (error) {
        console.error("Error purging CDN caches:", error);
        showNotification("error", "Error purging CDN caches: " + (error.message || "Unknown error"));
    } finally {
        allCachePurgeInProgress.value = false;
    }
};
</script>
