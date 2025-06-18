import { defineStore } from 'pinia'

interface SettingsState {
  data: Record<string, any> | null;
}

export const useSettingsStore = defineStore('settings', {
    state: (): SettingsState => ({
        data: null,
    }),
    actions: {
        setSettings(data: any) {
            this.data = data
        },
    },
    getters: {
        getSettings: (state): any => state.data,
        getSetting: (state) => (key: string, defaultValue: any) => state.data?.[key] || defaultValue,

        searchMetaTags: (state) => {
            const getSetting = (key: string, defaultValue: any = null) =>
                state.data?.[`blog.${key}`] || defaultValue;

            const metaTags: Array<{ name: string; content: string }> = [];

            // Google Site Verification
            const googleVerification = getSetting('googleSiteVerification');
            if (googleVerification) {
                metaTags.push({
                    name: 'google-site-verification',
                    content: googleVerification
                });
            }

            // Bing Site Verification
            const bingVerification = getSetting('bingSiteVerification');
            if (bingVerification) {
                metaTags.push({
                    name: 'msvalidate.01',
                    content: bingVerification
                });
            }

            // Yandex Site Verification
            const yandexVerification = getSetting('yandexSiteVerification');
            if (yandexVerification) {
                metaTags.push({
                    name: 'yandex-verification',
                    content: yandexVerification
                });
            }

            // Baidu Site Verification
            const baiduVerification = getSetting('baiduSiteVerification');
            if (baiduVerification) {
                metaTags.push({
                    name: 'baidu-site-verification',
                    content: baiduVerification
                });
            }

            return metaTags;
        },

        additionalMetaTags: (state) => {
            const customMetaTags = state.data?.['blog.additionalMetaTags'];
            if (!customMetaTags) return [];

            try {
                if (typeof window === 'undefined') return [];

                const parser = new DOMParser();
                const doc = parser.parseFromString(`<div>${customMetaTags}</div>`, 'text/html');
                const metaTags = doc.querySelectorAll('meta');

                return Array.from(metaTags).map(tag => {
                    const attributes: Record<string, string> = {};
                    Array.from(tag.attributes).forEach(attr => {
                        attributes[attr.name] = attr.value;
                    });
                    return attributes;
                });
            } catch (e) {
                console.error('Error parsing custom meta tags:', e);
                return [];
            }
        },

        allMetaTags(state): any[] {
            const searchMetaTags = this.searchMetaTags;
            const additionalMetaTags = this.additionalMetaTags;

            const getSetting = (key: string, defaultValue: any = null) =>
                state.data?.[`blog.${key}`] || defaultValue;

            const baseTags = [
                { name: 'description', content: getSetting('metaDescription', '') },
                { name: 'keywords', content: getSetting('metaKeywords', '') },
            ];

            return [...baseTags, ...searchMetaTags, ...additionalMetaTags];
        },

        googleAnalyticsScripts: (state) => {
            const gaId = state.data?.['blog.googleAnalyticsId'];
            if (!gaId) return [];

            return [
                {
                    children: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${gaId}');
                    `,
                    type: 'text/javascript'
                },
                {
                    src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
                    async: true
                }
            ];
        },

        faviconUrl: (state) => {
            return state.data?.['blog.favicon'] || '/src/theme-default/favicon.ico';
        }
    },
})
