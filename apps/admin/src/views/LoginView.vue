<template>
    <div class="main w-full h-screen z-0 select-none">
        <div class="w-full h-screen z-50" style="backdrop-filter: blur(12px)">
            <div
                class="flex items-center justify-center h-screen w-full md:w-6/12 max-w-lg m-auto p-4 z-50 animate-fade-in"
            >
                <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 relative w-full">
                    <div
                        class="absolute w-full h-full top-0 left-0 right-0 bottom-0 bg-black opacity-60 flex items-center justify-center rounded-lg"
                        style="z-index: 9999"
                        v-if="loading"
                    >
                        <div class="flex flex-col items-center justify-center">
                            <div class="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-zinc-200"></div>
                            <div class="mt-2 text-white text-sm">Loading...</div>
                        </div>
                    </div>

                    <div class="m-auto mb-6">
                        <a href="https://cmmv.io/" target="blank">
                            <img
                                src="https://raw.githubusercontent.com/cmmvio/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png"
                                width="150"
                                alt="CMMV Logo"
                                class="m-auto"
                            />
                        </a>
                    </div>

                    <form @submit.prevent="handleSubmit" class="w-full">
                        <div class="w-full">
                            <div class="mb-4">
                                <label for="username" class="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">Email</label>
                                <input
                                    id="username"
                                    v-model="data.username"
                                    type="text"
                                    placeholder="Enter your email"
                                    :disabled="loading"
                                    class="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white select-text"
                                    required
                                />
                                <p v-if="errors.username" class="mt-1 text-sm text-red-600">{{ errors.username }}</p>
                            </div>

                            <div class="mb-4">
                                <label for="password" class="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">Password</label>
                                <input
                                    id="password"
                                    v-model="data.password"
                                    type="password"
                                    placeholder="Enter your password"
                                    :disabled="loading"
                                    class="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white select-text"
                                    required
                                />
                                <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
                            </div>

                            <button
                                type="submit"
                                class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                :disabled="loading"
                            >
                                Login
                            </button>
                        </div>
                    </form>

                    <!-- Social Login Buttons -->
                    <div class="mt-6" v-if="firebaseEnabled">
                        <div class="relative">
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-gray-200 dark:border-neutral-600"></div>
                            </div>
                            <div class="relative flex justify-center text-sm">
                                <span class="px-2 bg-white dark:bg-neutral-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <div class="mt-6 flex flex-col gap-3">
                            <button
                                type="button"
                                @click="handleSocialLogin('google')"
                                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                v-if="settings['blog.firebaseProvidersGoogle'] || settings['blog.supabaseProvidersGoogle']"
                            >
                                <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                                </svg>
                                <span class="ml-2">Google</span>
                            </button>

                            <button
                                type="button"
                                @click="handleSocialLogin('facebook')"
                                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                v-if="settings['blog.firebaseProvidersFacebook'] || settings['blog.supabaseProvidersFacebook']"
                            >
                                <svg class="h-5 w-5 text-[#1877F2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24,12.073c0,5.989-4.394,10.954-10.13,11.855v-8.363h2.789l0.531-3.46H13.87V9.86c0-0.947,0.464-1.869,1.95-1.869h1.509V5.045c0,0-1.37-0.234-2.679-0.234c-2.734,0-4.52,1.657-4.52,4.656v2.637H7.091v3.46h3.039v8.363C4.395,23.025,0,18.061,0,12.073c0-6.627,5.373-12,12-12S24,5.445,24,12.073z"/>
                                </svg>
                                <span class="ml-2">Facebook</span>
                            </button>

                            <button
                                type="button"
                                @click="handleSocialLogin('twitter')"
                                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                v-if="settings['blog.firebaseProvidersTwitter'] || settings['blog.supabaseProvidersTwitter']"
                            >
                                <svg class="h-5 w-5 text-[#1DA1F2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953,4.57a10,10,0,0,1-2.825.775,4.958,4.958,0,0,0,2.163-2.723,9.99,9.99,0,0,1-3.127,1.195A4.92,4.92,0,0,0,11.78,8.288,13.938,13.938,0,0,1,1.64,3.162,4.822,4.822,0,0,0,.974,5.639a4.921,4.921,0,0,0,2.188,4.1A4.9,4.9,0,0,1,.934,9.117v.06A4.923,4.923,0,0,0,4.88,14.059a4.965,4.965,0,0,1-2.212.085,4.937,4.937,0,0,0,4.6,3.417,9.868,9.868,0,0,1-6.115,2.107A10.048,10.048,0,0,1,0,19.588,13.941,13.941,0,0,0,7.548,22,13.909,13.909,0,0,0,21.543,8.2c0-.212,0-.424-.015-.634A9.935,9.935,0,0,0,24,4.59Z"/>
                                </svg>
                                <span class="ml-2">Twitter</span>
                            </button>

                            <button
                                type="button"
                                @click="handleSocialLogin('github')"
                                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                v-if="settings['blog.firebaseProvidersGithub'] || settings['blog.supabaseProvidersGithub']"
                            >
                                <svg class="h-5 w-5 text-[#24292F] dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,2A10,10,0,0,0,8.84,21.5c.5.08.66-.23.66-.5V19.31C6.73,19.91,6.14,18,6.14,18A2.69,2.69,0,0,0,5,16.5c-.91-.62.07-.6.07-.6a2.1,2.1,0,0,1,1.53,1,2.15,2.15,0,0,0,2.91.83,2.16,2.16,0,0,1,.63-1.34C8,16.17,5.62,15.31,5.62,11.5a3.87,3.87,0,0,1,1-2.71,3.58,3.58,0,0,1,.1-2.64s.84-.27,2.75,1a9.63,9.63,0,0,1,5,0c1.91-1.29,2.75-1,2.75-1a3.58,3.58,0,0,1,.1,2.64,3.87,3.87,0,0,1,1,2.71c0,3.82-2.34,4.66-4.57,4.91a2.39,2.39,0,0,1,.69,1.85V21c0,.27.16.59.67.5A10,10,0,0,0,12,2Z"/>
                                </svg>
                                <span class="ml-2">GitHub</span>
                            </button>
                        </div>
                    </div>

                    <div
                        v-if="notification.show"
                        class="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-md shadow-lg flex items-center"
                    >
                        <span class="font-medium">{{ notification.title }}</span>
                        <span class="ml-2">{{ notification.content }}</span>
                        <button
                            @click="notification.show = false"
                            class="ml-4 text-white hover:text-gray-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
body {
    border: 0px;
    margin: 0px;
}

.main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(to bottom, #000000, #00172d);
    overflow: hidden;
    position: relative;
}

.main::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 255, 150, 0.4), transparent 70%);
    filter: blur(150px);
    animation: auroraGreen 8s infinite alternate ease-in-out;
    z-index: 0;
}

.main::after {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(128, 0, 255, 0.4), transparent 70%);
    filter: blur(150px);
    animation: auroraPurple 10s infinite alternate-reverse ease-in-out;
    z-index: 0;
}

@keyframes auroraGreen {
    0% {
        transform: translate(-10%, -20%) rotate(0deg);
    }
    50% {
        transform: translate(15%, 25%) rotate(60deg);
    }
    100% {
        transform: translate(-10%, -20%) rotate(120deg);
    }
}

@keyframes auroraPurple {
    0% {
        transform: translate(10%, 20%) rotate(0deg);
    }
    50% {
        transform: translate(-15%, -25%) rotate(-60deg);
    }
    100% {
        transform: translate(10%, 20%) rotate(-120deg);
    }
}

@keyframes float {
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
    100% {
        transform: translateY(0);
    }
}

@keyframes fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.animate-fade-in {
    animation: fade-in 0.8s ease-in-out;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminClient } from '@cmmv/blog/admin/client'
import { initializeApp } from 'firebase/app'
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    TwitterAuthProvider,
    GithubAuthProvider,
    signInWithCredential
} from 'firebase/auth'

const adminClient = useAdminClient();
const router = useRouter();
adminClient.session.check();
let firebaseApp = null;

const providers = {
    google: new GoogleAuthProvider(),
    facebook: new FacebookAuthProvider(),
    twitter: new TwitterAuthProvider(),
    github: new GithubAuthProvider()
}

const settings = ref({});
const loading = ref(false);
const firebaseEnabled = ref(false);
const errors = ref({
    username: '',
    password: ''
});

const notification = ref({
    show: false,
    title: '',
    content: '',
    duration: 3000
});

const data = ref({
    username: '',
    password: '',
});

const showNotification = (title, content) => {
    notification.value = {
        show: true,
        title,
        content,
        duration: 3000
    };

    setTimeout(() => {
        notification.value.show = false
    }, notification.value.duration);
}

const validateForm = () => {
    let isValid = true;
    errors.value = {};

    if (!data.value.username) {
        errors.value.username = 'Email is required';
        isValid = false;
    }

    if (!data.value.password) {
        errors.value.password = 'Password is required';
        isValid = false;
    }

    return isValid;
}

const handleSubmit = async () => {
    if (!validateForm())
        return;

    try {
        loading.value = true;
        const result = await adminClient.session.login(data.value);
        loading.value = false;

        if (result.token)
            router.push('/');
    } catch (err) {
        loading.value = false
        showNotification('Error!', 'Unable to login')
    }
}

const handleSocialLogin = async (provider) => {
    try {
        const auth = getAuth(firebaseApp)
        loading.value = true

        if (!providers[provider])
            throw new Error(`Provider ${provider} not supported`)

        const result = await signInWithPopup(auth, providers[provider])

        let credential
        switch(provider) {
            case 'google':
                credential = GoogleAuthProvider.credentialFromResult(result)
                break
            case 'facebook':
                credential = FacebookAuthProvider.credentialFromResult(result)
                break
            case 'twitter':
                credential = TwitterAuthProvider.credentialFromResult(result)
                break
            case 'github':
                credential = GithubAuthProvider.credentialFromResult(result)
                break
        }

        const token = credential.accessToken
        const user = result.user

        const loginResult = await adminClient.session.loginWithFirebase({
            token: await user.getIdToken(),
            provider: provider,
            user: result.user
        })

        loading.value = false

        if (loginResult)
            router.push('/')
    } catch (err) {
        loading.value = false

        if (err.code) {
            switch(err.code) {
                case 'auth/popup-closed-by-user':
                    showNotification('Info', 'Login cancelled')
                    break
                case 'auth/account-exists-with-different-credential':
                    showNotification('Error!', 'An account already exists with the same email address but different sign-in credentials.')
                    break
                default:
                    showNotification('Error!', `Unable to login with ${provider}: ${err.message}`)
            }
        } else {
            showNotification('Error!', `Unable to login with ${provider}`)
        }
    }
}

onMounted(async () => {
    const settingsData = await adminClient.settings.get(true);
    settings.value = settingsData;

    const firebaseConfig = {
        apiKey: settingsData["blog.firebaseApiKey"],
        authDomain: settingsData["blog.firebaseAuthDomain"],
        projectId: settingsData["blog.firebaseProjectId"],
        storageBucket: settingsData["blog.firebaseStorageBucket"],
        messagingSenderId: settingsData["blog.firebaseMessagingSenderId"],
        appId: settingsData["blog.firebaseAppId"]
    }

    if(firebaseConfig.apiKey) {
        firebaseEnabled.value = true;
        firebaseApp = initializeApp(firebaseConfig)
    }

    if(!settingsData.setupFinish && !settingsData["blog.url"])
        router.push('/setup');
})
</script>
