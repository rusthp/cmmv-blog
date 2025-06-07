import { useSettingsStore } from "../store/settings.js";

export async function useTheme() {
    const isSSR = import.meta.env.SSR;
    const settingsStore = useSettingsStore();
    const routerModules = import.meta.glob('../theme-*/router.ts');

    if(isSSR){
        let theme = settingsStore.getSetting('blog.theme', null);
        
        // Se não tem tema definido, usar proplaynews como padrão fixo
        if (!theme) {
            theme = 'proplaynews';
        }
        
        const importFn = routerModules[`../theme-${theme}/router.ts`];
        //@ts-ignore
        const { createRouter } = await importFn();
        const router = createRouter();
        return { theme, router }
    }
    else{
        const pinia = (window as any).__PINIA__;
        let theme = pinia?.settings?.data?.["blog.theme"];
        
        // Se não tem tema definido no pinia, tentar buscar do settingsStore
        if (!theme) {
            theme = settingsStore.getSetting('blog.theme', null);
        }
        
        // Último fallback para proplaynews
        if (!theme) {
            theme = 'proplaynews';
        }
        
        const importFn = routerModules[`../theme-${theme}/router.ts`];
        //@ts-ignore
        const { createRouter } = await importFn();
        const router = createRouter();
        return { theme, router }
    }
}
