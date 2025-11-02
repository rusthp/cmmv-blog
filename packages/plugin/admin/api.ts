import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export const getEnv = (key: string): string | undefined => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env)// @ts-ignore
        return import.meta.env[key]

    if (typeof process !== 'undefined' && process.env)
        return process.env[key]

    return undefined
}

const ssrLocalStorage: any =
    typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
          };

export function useApi() {
    const env = getEnv('NODE_ENV');
    const router = useRouter()
    const user = ref<any>(null)
    const token = ref<string | null>(ssrLocalStorage.getItem('token') || null)
    const refreshToken = ref<string | null>(ssrLocalStorage.getItem('refreshToken') || null)
    const isAuthenticated = computed(() => !!token.value)
    const currentWhitelabelId = ref<string | null>(ssrLocalStorage.getItem('currentWhitelabelId') || null)
    const isWhitelabelMode = computed(() => !!currentWhitelabelId.value)
    const whitelabelUrls = ref<Record<string, string>>(JSON.parse(ssrLocalStorage.getItem('whitelabelUrls') || '{}'))

    const fetchWhitelabelUrls = async () => {
        try {
            const response = await fetch('/api/whitelabel/admin', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token.value && { Authorization: `Bearer ${token.value}` })
                }
            });

            if (response.ok) {
                const data = await response.json();
                const urls: Record<string, string> = {};

                if (data.result?.data) {
                    data.result.data.forEach((whitelabel: any) => {
                        if (whitelabel.id && whitelabel.apiUrl) {
                            urls[whitelabel.id] = whitelabel.apiUrl;
                        }
                    });
                }

                whitelabelUrls.value = urls;
                ssrLocalStorage.setItem('whitelabelUrls', JSON.stringify(urls));
                console.log('✅ Whitelabel URLs loaded:', urls);
                return urls;
            }
        } catch (error) {
            console.warn('Failed to fetch whitelabel URLs:', error);
        }
        return {};
    };

    const getApiPath = (path: string) => {
        if (currentWhitelabelId.value && whitelabelUrls.value[currentWhitelabelId.value]) {
            const baseUrl = whitelabelUrls.value[currentWhitelabelId.value];
            return env === 'dev' ?
            `${baseUrl}/${path}` : `${baseUrl}/${path}`;
        }

        return `/api/${path}`;
    }

    const getHeaders = (headers?: object) => {
        const result = {
            Authorization: `Bearer ${token.value}`,
            ...headers,
        };

        if (currentWhitelabelId.value)
            result['x-whitelabel-id'] = currentWhitelabelId.value;

        return result;
    }

    const authRootRequest = async (path: string, method: string, payload?: any, headers?: object) => {
        return await authRequest(path, method, payload, headers, true);
    }

    const authRequest = async (
        path: string, method: string,
        payload?: any, headers?: object,
        isRoot?: boolean
    ) => {
        try {
            if (token.value && token.value !== 'null') {
                if (!headers) headers = {}

                let apiPath = isRoot ? `/api/${path}` : getApiPath(path);
                apiPath += (apiPath.includes("?")) ? `&t=${new Date().getTime()}` : `?t=${new Date().getTime()}`

                const response = await fetch(
                    apiPath,
                    method == 'GET'
                        ? {
                            method: method,
                            mode: "cors",
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token.value}`,
                                ...headers,
                            },
                        }
                        : {
                            method: method,
                            mode: "cors",
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token.value}`,
                                ...headers,
                            },
                            body: payload ? JSON.stringify(payload) : undefined,
                        },
                )

                const contentType = response.headers.get('content-type')?.split(';')[0]

                if (response.status !== 200)
                    return null;

                const data: any =
                    contentType === 'application/json' || contentType === 'text/json'
                        ? await response.json()
                        : await response.text()

                if (data.result) {
                    return {
                        status: response.status,
                        ...data.result,
                    }
                } else {
                    return data
                }
            } else {
                router.push('/login')
            }
        } catch (error: any) {
            // Don't log connection errors during startup (API may not be ready yet)
            if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('Failed to fetch')) {
                // Silently handle - client will retry
                return { status: 503, message: 'API is not ready yet. Please wait...' }
            }
            console.error('API Request failed:', error);
            return { status: 500, message: error }
        }
    }

    const login = async (credentials: { username: string; password: string; token?: string }) => {
        const response = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        })

        const data: any = await response.json()

        if (response.ok && data.result.token) {
            ssrLocalStorage.setItem('token', data.result.token)
            ssrLocalStorage.setItem('refreshToken', data.result.refreshToken)
            token.value = data.result.token
            refreshToken.value = data.result.refreshToken

            // Buscar URLs dos whitelabels após login
            await fetchWhitelabelUrls();

            return data.result
        } else {
            throw new Error(data.result.message || 'Login failed')
        }
    }

    const loginWithFirebase = async (credentials: { token: string; provider: string; user: any }) => {
        const response = await fetch(`/api/accounts/login/firebase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        })

        const data: any = await response.text()

        if (response.ok && data) {
            ssrLocalStorage.setItem('token', data)
            token.value = data

            // Buscar URLs dos whitelabels após login
            await fetchWhitelabelUrls();

            return data
        } else {
            throw new Error(data.result.message || 'Login failed')
        }
    }

    const getSettings = async (root: boolean = false) => {
        const apiPath = getApiPath(`settings?t=${new Date().getTime()}`);

        const response = await fetch(root ? `/api/settings` : apiPath, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data: any = await response.json();
        return data ? data : null;
    }

    const getSignature = async () => {
        const response = await fetch(
            "/api/get-signature",
            {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token.value}`
                },
            }
        )

        const data: any = await response.text();
        return data ? data : null;
    }

    const setSettings = async (key: string, value: any, root: boolean = true) => {
        const response = await authRequest(`settings/set`, 'PUT', { key, value }, {}, root);
        return response.data ? response.data : null;
    }

    const setSettingsWhitelabel = async (key: string, value: any) => {
        const response = await authRequest(`settings/set`, 'PUT', { key, value }, {}, false);
        return response.data ? response.data : null;
    }

    const getRootSettings = async (root: boolean = false) => {
        const response = await authRequest(`settings-root`, 'GET', {}, {}, root);
        return response.data ? response.data : null;
    }

    const updateSettings = async (data: any) => {
        const response = await authRequest(`settings`, 'PUT', data);
        return response.data ? response.data : null;
    }

    const saveSetup = async (data: any) => {
        const apiPath = getApiPath('setup');

        const response = await fetch(apiPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        const responseData: any = await response.json();
        return responseData.result ? responseData.result : null;
    }

    const logout = () => {
        ssrLocalStorage.removeItem('token')
        ssrLocalStorage.removeItem('refreshToken')
        ssrLocalStorage.removeItem('whitelabelUrls')
        token.value = null
        refreshToken.value = null
        user.value = null
        whitelabelUrls.value = {}
        router.push('/login')
    }

    const checkSession = async () => {
        const result = await authRequest('auth/check', 'GET')

        if (!result)
            refreshAuth()
    }

    const refreshAuth = async () => {
        const result = await authRequest('auth/refresh', 'POST', null, {
            'refresh-token': refreshToken.value,
        })

        if (result?.status === 200) {
            ssrLocalStorage.setItem('token', result.token)
            token.value = result.token
        } else {
            ssrLocalStorage.removeItem('token')
            ssrLocalStorage.removeItem('refreshToken')
            ssrLocalStorage.removeItem('whitelabelUrls')
            token.value = null
            refreshToken.value = null
            user.value = null
            whitelabelUrls.value = {}
            router.push('/login')
        }
    }

    const setWhitelabel = async (whitelabelId: string | null) => {
        if (whitelabelId) {
            // Garantir que temos as URLs dos whitelabels
            if (Object.keys(whitelabelUrls.value).length === 0) {
                await fetchWhitelabelUrls();
            }

            currentWhitelabelId.value = whitelabelId;
            ssrLocalStorage.setItem('currentWhitelabelId', whitelabelId);

            console.log(`🏷️  Switched to whitelabel: ${whitelabelId}`);
            console.log(`🔗 URL: ${whitelabelUrls.value[whitelabelId] || 'not found'}`);
        } else {
            currentWhitelabelId.value = null;
            ssrLocalStorage.removeItem('currentWhitelabelId');
            console.log('🏷️  Switched to main API');
        }
    }

    const getWhitelabel = async () => {
        return ssrLocalStorage.getItem('currentWhitelabelId') || null;
    }

    // Inicializar URLs dos whitelabels se já estivermos logados
    if (token.value && Object.keys(whitelabelUrls.value).length === 0) {
        fetchWhitelabelUrls();
    }

    const methods = {}

    return {
        user,
        token,
        isAuthenticated,
        isWhitelabelMode,
        currentWhitelabelId,
        whitelabelUrls,
        getHeaders,
        authRequest,
        authRootRequest,
        checkSession,
        getSettings,
        getRootSettings,
        setSettings,
        setSettingsWhitelabel,
        updateSettings,
        login,
        loginWithFirebase,
        logout,
        saveSetup,
        setWhitelabel,
        getWhitelabel,
        getSignature,
        fetchWhitelabelUrls,
        ...methods,
    }
}

export function defaultCRUD(path: string, auth: boolean = true){
    const { authRequest, authRootRequest } = useApi();

    return {
        get: (queries: Record<string, any>) => {
            const query = new URLSearchParams(queries).toString();
            return auth ? authRootRequest(`${path}?${query}`, 'GET') : authRequest(`${path}?${query}`, 'GET');
        },
        create: (data: any) => auth ? authRootRequest(`${path}`, 'POST', data) : authRequest(`${path}`, 'POST', data),
        insert: (data: any) => auth ? authRootRequest(`${path}`, 'POST', data) : authRequest(`${path}`, 'POST', data),//Compatibility
        update: (id: string, data: any) => auth ? authRootRequest(`${path}/${id}`, 'PUT', data) : authRequest(`${path}/${id}`, 'PUT', data),
        delete: (id: string) => auth ? authRootRequest(`${path}/${id}`, 'DELETE') : authRequest(`${path}/${id}`, 'DELETE'),
    }
}