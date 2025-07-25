import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import type { IncomingMessage } from 'http';
import { unheadVueComposablesImports } from '@unhead/vue'
import AutoImport from 'unplugin-auto-import/vite'
import { VitePWA } from 'vite-plugin-pwa';
//@ts-ignore
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE');
    const apiUrl = env.VITE_API_URL || 'http://localhost:5000';
    const adminUrl = env.VITE_API_URL || 'http://localhost:5002';
    const allowedHosts = env.VITE_ALLOWED_HOSTS || 'blog.cmmv.io';

    const forwardRefreshToken = (proxy: any) => {
        proxy.on('proxyReq', (proxyReq: any, req: IncomingMessage) => {
            const refreshToken = req.headers['refresh-token'];
            const signature = req.headers['signature'];

            if (refreshToken)
                proxyReq.setHeader('refresh-token', refreshToken);

            if (signature)
                proxyReq.setHeader('signature', signature);
        });
    };

    return {
        plugins: [
            vue(),
            AutoImport({
                imports: [
                  unheadVueComposablesImports,
                ],
            }),
            tailwindcss(),
        ],
        ssr: {
            noExternal: [],
        },
        build: {
            sourcemap: true,
            minify: 'terser',
            outDir: 'dist',
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, 'index.html'),
                },
            },
            manualChunks(id: string) {
                if (id.includes('node_modules')) {
                    if (id.includes('vue-router'))
                        return 'vendor-vue-router';

                    if (id.includes('vue'))
                        return 'vendor-vue';

                    return 'vendor';
                }
            }
        },
        resolve: {
            preserveSymlinks: true,
            alias: {
                '@cmmv/blog': path.resolve(__dirname, '../../packages/plugin/'),
                '@cmmv/blog/*': path.resolve(__dirname, '../../packages/plugin/*'),
                '@cmmv/affiliate': path.resolve(__dirname, '../../packages/affiliate/'),
                '@cmmv/affiliate/*': path.resolve(__dirname, '../../packages/affiliate/*'),
                '@cmmv/odds': path.resolve(__dirname, '../../packages/odds/'),
                '@cmmv/odds/*': path.resolve(__dirname, '../../packages/odds/*'),
                '@cmmv/newsletter': path.resolve(__dirname, '../../packages/newsletter/'),
                '@cmmv/newsletter/*': path.resolve(__dirname, '../../packages/newsletter/*')
            },
        },
        server: {
            allowedHosts: allowedHosts.split(',').map(host => host.trim()),
            host: "0.0.0.0",
            proxy: {
                '/api': {
                    target: apiUrl,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/api/, ''),
                    configure: forwardRefreshToken,
                },
                '/admin': {
                    target: adminUrl,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/admin/, ''),
                    configure: forwardRefreshToken,
                },
                '/feed': { target: apiUrl },
                '/sitemap': { target: apiUrl },
                '/sitemap.xml': { target: apiUrl },
                '/post-sitemap.xml': { target: apiUrl },
                '/page-sitemap.xml': { target: apiUrl },
                '/category-sitemap.xml': { target: apiUrl },
                '/tag-sitemap.xml': { target: apiUrl },
                '/affiliate/sitemap.xml': { target: apiUrl },
                '/affiliate/affiliate-campaign-sitemap.xml': { target: apiUrl },
                '/affiliate/affiliate-category-sitemap.xml': { target: apiUrl },
                '/robots.txt': { target: apiUrl },
                '/s/': { target: apiUrl },
                '/images': {
                    target: apiUrl,
                    changeOrigin: true,
                    secure: false
                },
            },
        },
    };
});
