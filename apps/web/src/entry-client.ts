import { createSSRApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import { createPiniaInstance } from './store/index.js';
import App from './App.vue';
import './style.css';

console.warn = (msg) => { return; };
console.error = (msg) => { return; };

declare global {
    interface Window {
        __CMMV_DATA__: Record<string, any>;
        __PINIA__: Record<string, any>;
    }
}

try{
    async function main() {
        try{
            const head = createHead();
            const app = createSSRApp(App)
            const pinia = createPiniaInstance();
            const preloadedData = window.__CMMV_DATA__ || {};
            const routerModules = import.meta.glob('./theme-*/router.ts');

            app.provide('preloaded', preloadedData)
            app.use(head)
            app.use(pinia);

            if ((window as any).__PINIA__)
                pinia.state.value = (window as any).__PINIA__;

            //@ts-ignore
            const theme = window.__PINIA__?.settings?.data?.["blog.theme"] || import.meta.env.VITE_DEFAULT_THEME;
            const importFn = routerModules[`./theme-${theme}/router.ts`];
            //@ts-ignore
            const { createRouter } = await importFn();
            const router = createRouter();

            app.use(router);
            router.isReady().then(() => app.mount('#app', true))
        }
        catch(error){
            console.error(error);
        }
    }

    function waitForCMMVData() {
        if (window.__CMMV_DATA__ && window.__PINIA__) {
            main();
        } else {
            const checkInterval = setInterval(() => {
                if (window.__CMMV_DATA__ && window.__PINIA__) {
                    clearInterval(checkInterval);
                    main();
                }
            }, 10);
        }
    }

    waitForCMMVData();
}
catch(error){}
