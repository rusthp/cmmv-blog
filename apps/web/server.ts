import {
    createServer, loadEnv,
} from 'vite';

import { transformHtmlTemplate } from '@unhead/vue/server';
import { useSettingsStore } from './src/store/settings.js';

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import * as crypto from 'node:crypto';
import * as mime from 'mime-types';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'VITE');
const fileCache = new Map<string, { buffer: Buffer, etag: string, mtime: number }>();

interface PageCacheEntry {
    html: string;
    compressedVersions: {
        gzip?: Buffer;
        br?: Buffer;
        uncompressed: string;
    };
    timestamp: number;
    headers: Record<string, string>;
}

const pageCache = new Map<string, PageCacheEntry>();

/**
 * Cache duration configuration based on page type
 * Optimized TTLs for different content types
 */
const PAGE_CACHE_DURATION = {
    // Static pages (home, about, etc.) - rarely change
    static: 60 * 60 * 1000, // 1 hour
    
    // Dynamic content pages (posts, categories) - change more frequently
    dynamic: 10 * 60 * 1000, // 10 minutes
    
    // API responses - short cache for freshness
    api: 5 * 60 * 1000, // 5 minutes
    
    // Default fallback
    default: 30 * 60 * 1000, // 30 minutes
};

/**
 * Determine cache duration based on URL pattern
 * 
 * @param url - Request URL
 * @returns Cache duration in milliseconds
 */
const getCacheDuration = (url: string): number => {
    // Static routes that rarely change
    if (url === '/' || url.match(/^\/about|\/contact|\/privacy/)) {
        return PAGE_CACHE_DURATION.static;
    }
    
    // API routes - shorter cache
    if (url.startsWith('/api/')) {
        return PAGE_CACHE_DURATION.api;
    }
    
    // Dynamic content (posts, categories, etc.)
    return PAGE_CACHE_DURATION.dynamic;
};

/**
 * Compress HTML content with optimized compression levels
 * Balances compression ratio with CPU usage for better performance
 * 
 * @param html - HTML content to compress
 * @param acceptEncoding - Accept-Encoding header value
 * @returns Compressed data and encoding type
 */
const compressHtml = (html: string, acceptEncoding: string = ''): { data: Buffer | string, encoding: string | null } => {
    if (acceptEncoding.includes('br')) {
        // Brotli: Quality 4 provides good compression ratio with faster compression
        // Lower quality = faster compression, higher quality = better ratio but slower
        return {
            data: zlib.brotliCompressSync(html, {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // Balance: 1-11 (4 = good balance)
                    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: html.length, // Helps optimize compression
                    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT, // Optimized for text
                }
            }),
            encoding: 'br'
        };
    } else if (acceptEncoding.includes('gzip')) {
        // Gzip: Level 6 provides good balance (default is 6, but explicit is better)
        // Levels 1-3: Fast but poor compression
        // Levels 4-6: Good balance (recommended)
        // Levels 7-9: Better compression but much slower
        return {
            data: zlib.gzipSync(html, {
                level: 6, // Optimal balance
                chunkSize: 16 * 1024, // 16KB chunks for efficient processing
            }),
            encoding: 'gzip'
        };
    }

    return {
        data: html,
        encoding: null
    };
};

/**
 * Compress file buffer with optimized compression levels
 * Different compression settings for different file types
 * 
 * @param buffer - File buffer to compress
 * @param acceptEncoding - Accept-Encoding header value
 * @param contentType - Content type hint for optimization
 * @returns Compressed data and encoding type
 */
const compressFile = (buffer: Buffer, acceptEncoding: string = '', contentType: string = ''): { data: Buffer, encoding: string | null } => {
    // Determine optimal compression based on content type
    const isText = contentType.includes('text/') || 
                   contentType.includes('application/javascript') ||
                   contentType.includes('application/json') ||
                   contentType.includes('application/xml') ||
                   contentType.includes('image/svg+xml');
    
    // Text files benefit from higher compression, binary files use faster compression
    const quality = isText ? 5 : 3;
    const level = isText ? 6 : 4;

    if (acceptEncoding.includes('br')) {
        return {
            data: zlib.brotliCompressSync(buffer, {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: quality,
                    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
                    [zlib.constants.BROTLI_PARAM_MODE]: isText 
                        ? zlib.constants.BROTLI_MODE_TEXT 
                        : zlib.constants.BROTLI_MODE_GENERIC,
                }
            }),
            encoding: 'br'
        };
    } else if (acceptEncoding.includes('gzip')) {
        return {
            data: zlib.gzipSync(buffer, {
                level: level,
                chunkSize: 16 * 1024, // 16KB chunks
            }),
            encoding: 'gzip'
        };
    }

    return {
        data: buffer,
        encoding: null
    };
};

const serveStaticFile = async (req: http.IncomingMessage, res: http.ServerResponse, filePath: string): Promise<boolean> => {
    const url = req.url || '/';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const ifNoneMatch = req.headers['if-none-match'] || '';

    try {
        if (!fs.existsSync(filePath))
            return false;

        const stats = fs.statSync(filePath);

        if (!stats.isFile())
            return false;

        const mtime = stats.mtime.getTime();
        let cacheEntry = fileCache.get(filePath);

        let etag: string;
        let buffer: Buffer;

        if (cacheEntry && cacheEntry.mtime === mtime) {
            buffer = cacheEntry.buffer;
            etag = cacheEntry.etag;
        } else {
            buffer = fs.readFileSync(filePath);
            etag = crypto.createHash('md5').update(buffer).digest('hex');
            fileCache.set(filePath, { buffer, etag, mtime });
        }

        const contentType = mime.lookup(filePath) || 'application/octet-stream';

        if (ifNoneMatch === etag) {
            res.writeHead(304, {
                'ETag': etag
            });
            res.end();
            return true;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', `public, max-age=900`);

        const compressibleTypes = ['text/', 'application/javascript', 'application/json', 'image/svg+xml', 'application/xml'];
        const isCompressible = compressibleTypes.some(type => contentType.includes(type));

        if (isCompressible) {
            const compressed = compressFile(buffer, acceptEncoding as string, contentType);

            if (compressed.encoding) {
                res.setHeader('Content-Encoding', compressed.encoding);
                res.setHeader('Vary', 'Accept-Encoding');
            }

            res.end(compressed.data);
        } else {
            res.end(buffer);
        }

        return true;
    } catch (error) {
        console.error(`Error serving ${filePath}:`, error);
        return false;
    }
};

let serverInstance: http.Server | null = null;

async function bootstrap() {
    const isDev = process.env.NODE_ENV !== 'production';

    const vite = await createServer({
        server: {
            middlewareMode: true,
            hmr: isDev ? true : false
        },
        appType: 'custom'
    });

    const themesDir = path.resolve(process.cwd(), 'src');
    const themeFolders = fs.readdirSync(themesDir)
        .filter(folder => folder.startsWith('theme-') && fs.statSync(path.join(themesDir, folder)).isDirectory());

    const themes: Record<string, any> = {};
    for (const folder of themeFolders) {
        const themeJsonPath = path.join(themesDir, folder, 'theme.json');
        if (fs.existsSync(themeJsonPath)) {
            try {
                const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'));
                themes[`./${folder}/theme.json`] = {
                    namespace: folder.replace('theme-', ''),
                    name: themeData.name,
                    description: themeData.description,
                    author: themeData.author,
                    version: themeData.version,
                    preview: `${env.VITE_WEBSITE_URL}${themeData.preview}`
                };
            } catch (error) {
                console.error(`Error loading theme from ${themeJsonPath}:`, error);
            }
        }
    }

    const server = http.createServer(async (req, res) => {
        const url = req.url || '';
        const acceptEncoding = req.headers['accept-encoding'] || '';

        if (url === '/themas' && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');

            try {
                const themeList = Object.keys(themes).map(path => {
                    return themes[path];
                });

                res.statusCode = 200;
                res.end(JSON.stringify(themeList));
                return;
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify([]));
                return;
            }
        }

        if (url === '/set-thema' && req.method === 'POST') {
            const authHeader = req.headers.authorization || '';
            const expectedAuth = `Bearer ${env.VITE_SIGNATURE}`;

            if (authHeader !== expectedAuth) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Unauthorized');
                return;
            }

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const { theme } = JSON.parse(body);

                    if (!theme) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            error: 'Theme name is required'
                        }));
                        return;
                    }

                    const themeExists = Object.keys(themes).some(path => {
                        const themeName = path.match(/\.\/theme-([^/]+)\/theme\.json/)?.[1] || '';
                        return themeName === theme;
                    });

                    if (!themeExists) {
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('Theme not found');
                        return;
                    }

                    const settingsStore = useSettingsStore();
                    const settings = await fetch(`${env.VITE_API_URL}/settings`);
                    const settingsData = await settings.json();
                    settingsData["blog.theme"] = theme;
                    settingsStore.setSettings(settingsData);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Theme set successfully. Server will restart to apply changes.');

                    setTimeout(() => {
                        if (serverInstance) {
                            serverInstance.close();
                            bootstrap();
                        }
                    }, 500);
                } catch (error) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Invalid request body');
                }
            });

            return;
        }

        if (url.startsWith('/assets/')) {
            const assetPath = path.resolve('dist', '.' + url);
            const served = await serveStaticFile(req, res, assetPath);
            if (served) return;
        }

        if (url !== '/' && !url.includes('?') && /\.\w+$/.test(url)) {
            const staticPath = path.resolve('dist', '.' + url);
            const served = await serveStaticFile(req, res, staticPath);
            if (served) return;
        }

        let template = '';
        let render: (url: string) => Promise<any>;

        if (process.env.NODE_ENV === 'production') {
            template = fs.readFileSync(path.resolve('dist/index.html'), 'utf-8');
            const mod = await (new Function('return import("./entry-server.js")')());
            render = mod.render;
        } else if(vite) {
            template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
            const { render: devRender } = await vite.ssrLoadModule('/src/entry-server.ts');
            render = devRender;
        }

        vite?.middlewares(req, res, async () => {
            try {
                if (/\.\w+$/.test(url)) {
                    res.statusCode = 404;
                    return res.end(`Not found: ${url}`);
                }

                template = await vite.transformIndexHtml(url, template);

                const {
                    html: appHtml, head, metadata, redirect,
                    piniaState, settings, posts, prefetchCache
                } = await render(url);

                const piniaScript = `\n<script>window.__PINIA__ = ${JSON.stringify(piniaState).replace(/</g, '\\u003c')}</script>`;

                if (redirect) {
                    res.writeHead(301, { Location: redirect });
                    return res.end();
                }

                globalThis.__SSR_DATA__ = { ...globalThis.__SSR_DATA__, posts };

                const ssrData = { ...globalThis.__SSR_DATA__, prefetchCache };
                const serializedData = JSON.stringify(ssrData).replace(/</g, '\\u003c');
                const dataScript = `<script>window.__CMMV_DATA__ = ${serializedData};</script>${piniaScript}`;

                template = await transformHtmlTemplate(head, template.replace(`<div id="app"></div>`, `<div id="app">${appHtml}</div>${dataScript}`));

                template = template.replace("<analytics />", settings["blog.analyticsCode"] || "").replace("<analytics>", settings["blog.analyticsCode"] || "");
                template = template.replace("<custom-js />", settings["blog.customJs"] || "").replace("<custom-js>", settings["blog.customJs"] || "");
                template = template.replace("<custom-css />", settings["blog.customCss"] || "").replace("<custom-css>", settings["blog.customCss"] || "");

                if (process.env.NODE_ENV === 'production') {
                    template = template.replace(/<script[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '');
                    template = template.replace(/<script[^>]*type="[^"]*"[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '');
                }

                for(const key in metadata)
                    template = template.replace(`{${key}}`, metadata[key]);

                // Use optimized cache duration based on URL type
                const cacheDuration = getCacheDuration(url);
                const maxAge = Math.floor(cacheDuration / 1000); // Convert to seconds

                const responseHeaders = {
                    'Content-Type': 'text/html',
                    'Cache-Control': `public, max-age=${maxAge}`,
                    // Add ETag for better cache validation
                    'ETag': crypto.createHash('md5').update(template).digest('hex'),
                };

                Object.entries(responseHeaders).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });

                const compressed = compressHtml(template, acceptEncoding as string);

                if (compressed.encoding)
                    res.setHeader('Content-Encoding', compressed.encoding);

                res.end(compressed.data);
            } catch (e) {
                vite.ssrFixStacktrace(e as Error);
                res.statusCode = 500;
                res.end((e as Error).message);
            }
        });
    });

    const port = env.VITE_SSR_PORT || 5001;

    // Enable HTTP keep-alive for better connection reuse
    server.keepAliveTimeout = 65000; // 65 seconds (slightly higher than default 60s)
    server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)

    // @ts-ignore
    serverInstance = server.listen(port, "0.0.0.0", () => {
        console.log(`🚀 SSR server running at http://localhost:${port}`);
        console.log(`📊 Performance optimizations enabled:`);
        console.log(`   - Compression: Brotli/Gzip with optimized levels (Quality 4/6)`);
        console.log(`   - Caching: URL-pattern based TTLs (Static: 1h, Dynamic: 10m, API: 5m)`);
        console.log(`   - Keep-Alive: ${server.keepAliveTimeout}ms`);
        console.log(`   - Database: SQLite optimizations (WAL mode, 64MB cache)`);
    });
}

setTimeout(bootstrap, 4000);
