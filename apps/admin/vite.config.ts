import path from 'node:path';
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { ConfigEnv, UserConfig } from 'vite'

export default defineConfig(async ({ mode }: ConfigEnv): Promise<UserConfig> => {
    await new Promise((res) => setTimeout(res, 5000));
    const env = loadEnv(mode, process.cwd(), 'VITE')
    const apiUrl = env.VITE_API_URL || 'http://localhost:5000';
    const allowedHosts = env.VITE_ALLOWED_HOSTS || 'blog.cmmv.io';
    const whitelabelApiUrls: Record<string, string> = {};

    const fetchWhitelabelApiUrls = async (retryCount = 0, maxRetries = 10) => {
        if(Object.keys(whitelabelApiUrls).length > 0)
            return true;

        try {
            if (typeof fetch === 'undefined')
                return false;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${apiUrl}/whitelabel/admin`, {
                signal: controller.signal
            }).catch(error => {
                return null;
            });

            clearTimeout(timeoutId);

            if (!response)
                return false;

            if (response.ok) {
                const whitelabels = await response.json();
                let count = 0;

                whitelabels.result.data.forEach((whitelabel: any) => {
                    if (whitelabel.id && whitelabel.apiUrl) {
                        whitelabelApiUrls[whitelabel.id] = whitelabel.apiUrl;
                        count++;
                    }
                });

                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        } finally {
            if (retryCount < maxRetries) {
                const delay = Math.min(2000 * Math.pow(1.5, retryCount), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWhitelabelApiUrls(retryCount + 1, maxRetries);
            } else {
                return false;
            }
        }
    };

    try {
        await fetchWhitelabelApiUrls();
    } catch (error) {
        console.warn('Failed to fetch whitelabel data, continuing with build:', error);
    }

    const generateProxyConfig = () => {
        const proxyConfig: Record<string, any> = {
            '/api': {
                target: apiUrl,
                changeOrigin: true,
                secure: false,
                configure: (proxy: any) => {
                    proxy.on('proxyReq', (proxyReq: any, req: any) => {
                        const refreshToken = req.headers['refresh-token'];
                        const whitelabelId = req.headers['x-whitelabel-id'];

                        if (refreshToken)
                            proxyReq.setHeader('refresh-token', refreshToken);

                        if (whitelabelId)
                            proxyReq.setHeader('x-whitelabel-id', whitelabelId);
                    });
                    // Handle proxy errors gracefully (API may not be ready yet)
                    proxy.on('error', (err: any, req: any, res: any) => {
                        // Only log if response hasn't been sent
                        if (!res.headersSent) {
                            // Silently handle connection refused errors during startup
                            if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                                // API is not ready yet, client will retry
                                return;
                            }
                            // Log other errors
                            console.warn('[Vite Proxy] Error:', err.message);
                        }
                    });
                },
                rewrite: (path: string) => path.replace(/^\/api/, '')
            },
            '/proxy': {
                target: apiUrl,
                changeOrigin: true,
                secure: true,
                configure: (proxy: any) => {
                    proxy.on('proxyReq', (proxyReq: any, req: any) => {
                        const refreshToken = req.headers['refresh-token'];
                        const whitelabelId = req.headers['x-whitelabel-id'];

                        if (refreshToken)
                            proxyReq.setHeader('refresh-token', refreshToken);

                        if (whitelabelId)
                            proxyReq.setHeader('x-whitelabel-id', whitelabelId);
                    });
                    // Handle proxy errors gracefully
                    proxy.on('error', (err: any, req: any, res: any) => {
                        if (!res.headersSent && err.code !== 'ECONNREFUSED' && err.code !== 'ETIMEDOUT') {
                            console.warn('[Vite Proxy] Error:', err.message);
                        }
                    });
                },
            },
            '/images': {
                target: apiUrl,
                changeOrigin: true,
                secure: false,
                configure: (proxy: any) => {
                    proxy.on('error', (err: any, req: any, res: any) => {
                        if (!res.headersSent && err.code !== 'ECONNREFUSED' && err.code !== 'ETIMEDOUT') {
                            console.warn('[Vite Proxy] Error:', err.message);
                        }
                    });
                }
            }
        };

        proxyConfig['/api/admin'] = {
            target: apiUrl,
            changeOrigin: true,
            secure: false,
            configure: (proxy: any) => {
                proxy.on('error', (err: any, req: any, res: any) => {
                    if (!res.headersSent && err.code !== 'ECONNREFUSED' && err.code !== 'ETIMEDOUT') {
                        console.warn('[Vite Proxy] Error:', err.message);
                    }
                });
            },
            rewrite: (path: string) => path.replace(/^\/api\/admin/, '')
        };

        Object.entries(whitelabelApiUrls).forEach(([id, url]) => {
            const pattern = `/${id}`;

            proxyConfig[pattern] = {
                target: url,
                changeOrigin: true,
                secure: false,
                configure: (proxy: any) => {
                    proxy.on('proxyReq', (proxyReq: any, req: any) => {
                        const refreshToken = req.headers['refresh-token'];
                        if (refreshToken) {
                            proxyReq.setHeader('refresh-token', refreshToken);
                        }

                        const whitelabelId = req.headers['x-whitelabel-id'];
                        if (whitelabelId)
                            proxyReq.setHeader('x-whitelabel-id', whitelabelId);
                    });
                    proxy.on('error', (err: any, req: any, res: any) => {
                        if (!res.headersSent && err.code !== 'ECONNREFUSED' && err.code !== 'ETIMEDOUT') {
                            console.warn('[Vite Proxy] Error:', err.message);
                        }
                    });
                },
                rewrite: (path: string) => {
                    return path.replace(new RegExp(`^${pattern}`), '');
                }
            };
        });

        return proxyConfig;
    };

    return {
        root: path.resolve(__dirname, '.'),
        plugins: [vue()],
        build: {
            chunkSizeWarningLimit: 1000000,
            rollupOptions: {
                input: path.resolve(__dirname, 'index.html'),
                output: {
                    manualChunks: {
                        'vue': ['vue', 'vue-router', 'pinia']
                    }
                }
            }
        },
        ssr: {
            noExternal: []
        },
        resolve: {
            preserveSymlinks: true,
            alias: {
                '@cmmv/blog': path.resolve(__dirname, '../../packages/plugin/'),
                '@cmmv/blog/*': path.resolve(__dirname, '../../packages/plugin/*'),
                '@cmmv/access-control': path.resolve(__dirname, '../../packages/access-control/'),
                '@cmmv/access-control/*': path.resolve(__dirname, '../../packages/access-control/*'),
                '@cmmv/rss-aggregation': path.resolve(__dirname, '../../packages/rss-aggregation/'),
                '@cmmv/rss-aggregation/*': path.resolve(__dirname, '../../packages/rss-aggregation/*'),
                '@cmmv/yt-aggregation': path.resolve(__dirname, '../../packages/yt-aggregation/'),
                '@cmmv/yt-aggregation/*': path.resolve(__dirname, '../../packages/yt-aggregation/*'),
                '@cmmv/affiliate': path.resolve(__dirname, '../../packages/affiliate/'),
                '@cmmv/affiliate/*': path.resolve(__dirname, '../../packages/affiliate/*'),
                '@cmmv/odds': path.resolve(__dirname, '../../packages/odds/'),
                '@cmmv/odds/*': path.resolve(__dirname, '../../packages/odds/*'),
                '@cmmv/newsletter': path.resolve(__dirname, '../../packages/newsletter/'),
                '@cmmv/newsletter/*': path.resolve(__dirname, '../../packages/newsletter/*')
            }
        },
        server: {
            allowedHosts: allowedHosts.split(',').map(host => host.trim()),
            port: Number(env.VITE_PORT) || 5002,
            host: "0.0.0.0",
            proxy: generateProxyConfig()
        },
    }
})
