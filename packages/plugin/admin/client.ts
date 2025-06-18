import { useApi, defaultCRUD } from './api';

export const useAdminClient = () => {
    const api = useApi();

    const categories = { ...defaultCRUD('categories', false) };
    const tags = { ...defaultCRUD('tags', false) };
    const authors = { ...defaultCRUD('authors', false) };
    const whitelabelAccess = { ...defaultCRUD('whitelabel-access', false) };
    const users = { ...defaultCRUD('user', false) };
    const prompts = { ...defaultCRUD('prompts') };
    const shorturl = {
        ...defaultCRUD('shorturl', false),
        create: (data: any) => api.authRequest('blog/shorturl', 'POST', data),
        insert: (data: any) => api.authRequest('blog/shorturl', 'POST', data),
    };

    const settings = {
        get: (root: boolean = false) => api.getSettings(root),
        getRoot: (root: boolean = false) => api.getRootSettings(root),
        getWhitelabel: () => api.getSettings(false),
        set: (key: string, value: any) => api.setSettings(key, value),
        setWhitelabel: (key: string, value: any) => api.setSettingsWhitelabel(key, value),
        update: (data: any) => api.updateSettings(data),
        saveSetup: (data: any) => api.saveSetup(data),
        getSignature: () => api.getSignature(),
    };

    const profile = {
        get: () => api.authRootRequest('profile', 'GET'),
        update: (data: any) => api.authRootRequest('profile', 'PUT', data),
    };

    const session = {
        check: () => api.checkSession(),
        login: (data: { username: string; password: string }) => api.login(data),
        logout: () => api.logout(),
        loginWithFirebase: async (payload: any) => {
            return await api.loginWithFirebase(payload);
        },
    };

    const posts = {
        get: (filters: Record<string, any>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`blog/posts/admin?${query}&t=${new Date().getTime()}`, 'GET');
        },
        getById: (id: string) => api.authRequest(`blog/posts/${id}?t=${new Date().getTime()}`, 'GET'),
        save: (data: any) => api.authRequest('blog/posts', 'POST', data),
        update: (id: string, data: any) => api.authRequest(`blog/posts/${id}`, 'PUT', data),
        delete: (id: string) => api.authRequest(`blog/posts/${id}`, 'DELETE'),
        generate: (data: any) => api.authRequest('blog/posts/generate', 'POST', data),
        startGenerate: (data: any) => api.authRequest('blog/posts/generate/start', 'POST', data),
        getGenerateStatus: (jobId: string) => api.authRequest(`blog/posts/generate/status/${jobId}`, 'GET'),
        recalculateCategoryCounts: () => api.authRequest('blog/posts/actions/recalculate-category-counts', 'POST'),
    };

    const pages = {
        get: (filters: Record<string, any>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`blog/pages?${query}&t=${new Date().getTime()}`, 'GET');
        },
        getById: (id: string) => api.authRequest(`blog/pages/${id}`, 'GET'),
        save: (data: any) => api.authRequest('blog/pages', 'POST', data),
        update: (id: string, data: any) => api.authRequest(`blog/pages/${id}`, 'PUT', data),
        delete: (id: string) => api.authRequest(`blog/pages/${id}`, 'DELETE'),
    };

    const medias = {
        get: (queries: Record<string, any>) => {
            const query = new URLSearchParams(queries).toString();
            return api.authRequest(`medias?${query}&t=${new Date().getTime()}`, 'GET');
        },
        processImage: (data: {
            image: string;
            format: string;
            maxWidth: number;
            alt: string;
            caption: string;
        }) => api.authRequest('images', 'POST', data),
        update: (id: string, data: {
            alt: string;
            caption: string;
        }) => api.authRequest(`medias/${id}`, 'PUT', data),
        importFromUrl: (data: {
            url: string;
            alt: string;
            caption: string;
        }) => api.authRequest('import-from-url', 'POST', data),
        delete: (id: string) => api.authRequest(`medias/${id}`, 'DELETE'),
        bulkDelete: (ids: string[], createBackup?: boolean) => api.authRequest('bulk-delete', 'POST', { ids, createBackup }),
    };

    const members = {
        create: (data: any) => api.authRequest('members', 'POST', data),
        getProfile: (id: string) => api.authRequest(`blog/members/profile/${id}`, 'GET'),
        getMyProfile: () => api.authRequest('blog/members/me', 'GET'),
        updateProfile: (id: string, data: any) => api.authRequest(`blog/members/profile/${id}`, 'PUT', data),
        get: (filters: Record<string, any>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`member?${query}`, 'GET');
        },
        getById: (id: string) => api.authRequest(`member/${id}`, 'GET'),
        update: (id: string, data: any) => api.authRequest(`member/${id}`, 'PUT', data),
        insert: (data: any) => api.authRequest('member', 'POST', data),
        delete: (id: string) => api.authRequest(`member/${id}`, 'DELETE'),
    };

    const analytics = {
        getSummary: () => api.authRequest('analytics/summary', 'GET').then((res: any) => res.data),
        getPostsMostAccessed: () => api.authRequest('analytics/posts-most-accessed', 'GET'),
        getDashboard: () => api.authRequest('analytics/dashboard', 'GET'),
    };

    const comments = {
        get: (filters: Record<string, any>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`comments?${query}`, 'GET');
        },
        getWithDetails: (filters: Record<string, any>) => {
            const query = new URLSearchParams(filters).toString();
            return api.authRequest(`comments-with-details?${query}`, 'GET');
        },
        getPending: () => api.authRequest('comments/pending', 'GET'),
        getById: (id: string) => api.authRequest(`comments/${id}`, 'GET'),
        save: (data: any) => api.authRequest('comments', 'POST', data),
        update: (id: string, data: any) => api.authRequest(`comments/${id}`, 'PUT', data),
        delete: (id: string) => api.authRequest(`comments/${id}`, 'DELETE'),
    };

    const imports = {
        wordpress: (data: any) => api.authRequest('imports/wordpress', 'POST', data),
        ghost: (data: any) => api.authRequest('imports/blogger', 'POST', data),
        progress: () => api.authRequest('imports/progress', 'GET'),
        progressById: (id: string) => api.authRequest(`imports/progress/${id}`, 'GET'),
        reprocessImages: () => api.authRequest('reprocess-images', 'POST'),
        getReprocessProgress: () => api.authRequest('reprocess-images-progress', 'GET'),
        cleanupOrphanedMedia: (forceCleanup: boolean = false) => api.authRequest('cleanup-orphaned-media', 'POST', { forceCleanup }),
        cleanupDuplicatedImages: () => api.authRequest('cleanup-duplicated-images', 'POST'),
        getCleanupProgress: () => api.authRequest('cleanup-orphaned-media-progress', 'GET'),
        initCleanupProgress: () => api.authRequest('init-cleanup-progress', 'POST'),
        generateMissingThumbnails: () => api.authRequest('generate-missing-thumbnails', 'POST'),
    };

    const images = {
        processEdit: (imageFile: File, operations: any) => {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('operations', JSON.stringify(operations));
            return api.authRequest('blog/images/process', 'POST', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        erase: (imageFile: File, params: { left: number; top: number; width: number; height: number }) => {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('left', params.left.toString());
            formData.append('top', params.top.toString());
            formData.append('width', params.width.toString());
            formData.append('height', params.height.toString());
            return api.authRequest('blog/images/erase', 'POST', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        crop: (imageFile: File, params: { left: number; top: number; width: number; height: number }) => {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('left', params.left.toString());
            formData.append('top', params.top.toString());
            formData.append('width', params.width.toString());
            formData.append('height', params.height.toString());
            return api.authRequest('blog/images/crop', 'POST', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        resize: (imageFile: File, params: { width?: number; height?: number; fit?: string }) => {
            const formData = new FormData();
            formData.append('image', imageFile);
            if (params.width) formData.append('width', params.width.toString());
            if (params.height) formData.append('height', params.height.toString());
            if (params.fit) formData.append('fit', params.fit);
            return api.authRequest('blog/images/resize', 'POST', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }
    };

    const themes = {
        get: () => api.authRequest('blog/themes?t=' + new Date().getTime(), 'GET'),
        install: (data: any) => api.authRequest('blog/themes', 'POST', data),
        uninstall: (id: string) => api.authRequest(`blog/themes/${id}`, 'DELETE'),
        setActive: (themeName: string) => api.authRequest(`blog/themes/active`, 'POST', { themeName }),
    };

    const whitelabel = {
        ...defaultCRUD('whitelabel', false),
        getAccess: (queries: Record<string, any>) => {
            const query = new URLSearchParams(queries).toString();
            return api.authRootRequest(`whitelabel/access?${query}`, 'GET');
        }
    };

    const backup = {
        create: () => api.authRequest('blog/backup/create', 'POST'),
        getBackups: () => api.authRequest('blog/backup', 'GET'),
        download: (filename: string) => api.authRequest(`blog/backup/download?filename=${filename}`, 'GET'),
        delete: (filename: string) => api.authRequest(`blog/backup/delete?filename=${filename}`, 'DELETE'),
        getMediaBackups: () => api.authRequest('blog/backup/medias', 'GET'),
        createMediaBackup: (mediaIds: string[]) => api.authRequest('blog/backup/medias/create', 'POST', { mediaIds }),
        rollbackMediaBackup: (filename: string) => api.authRequest('blog/backup/medias/rollback', 'POST', { filename }),
    };

    return {
        settings,
        profile,
        categories,
        tags,
        session,
        posts,
        pages,
        authors,
        medias,
        members,
        analytics,
        comments,
        imports,
        images,
        themes,
        whitelabel,
        whitelabelAccess,
        users,
        backup,
        prompts,
        shorturl
    };
};
