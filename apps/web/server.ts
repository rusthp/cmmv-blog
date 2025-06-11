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
const PAGE_CACHE_DURATION = 30 * 60 * 1000;

const compressHtml = (html: string, acceptEncoding: string = ''): { data: Buffer | string, encoding: string | null } => {
    if (acceptEncoding.includes('br')) {
        return {
            data: zlib.brotliCompressSync(html),
            encoding: 'br'
        };
    } else if (acceptEncoding.includes('gzip')) {
        return {
            data: zlib.gzipSync(html),
            encoding: 'gzip'
        };
    }

    return {
        data: html,
        encoding: null
    };
};

const compressFile = (buffer: Buffer, acceptEncoding: string = ''): { data: Buffer, encoding: string | null } => {
    if (acceptEncoding.includes('br')) {
        return {
            data: zlib.brotliCompressSync(buffer),
            encoding: 'br'
        };
    } else if (acceptEncoding.includes('gzip')) {
        return {
            data: zlib.gzipSync(buffer),
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
            const compressed = compressFile(buffer, acceptEncoding as string);

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

                let analyticsCode = settings["blog.analyticsCode"] || "";
                
                analyticsCode = analyticsCode
                    .replace(/<script(.*?)>/g, (match) => {
                        if (match.includes('defer') || match.includes('async')) {
                            return match;
                        }
                        if (match.includes('googletagmanager')) {
                            return match.replace('<script', '<script defer');
                        }
                        return match.replace('<script', '<script async');
                    });
                
                template = template
                    .replace("<analytics />", analyticsCode)
                    .replace("<analytics>", analyticsCode);
                
                let customJs = settings["blog.customJs"] || "";
                customJs = customJs
                    .replace(/<script(.*?)>/g, (match) => {
                        if (match.includes('defer') || match.includes('async')) {
                            return match;
                        }
                        return match.replace('<script', '<script defer');
                    });
                
                template = template
                    .replace("<custom-js />", customJs)
                    .replace("<custom-js>", customJs);
                
                template = template
                    .replace("<custom-css />", settings["blog.customCss"] || "")
                    .replace("<custom-css>", settings["blog.customCss"] || "");

                // Adicionar script para carregamento sob demanda de anúncios
                if (analyticsCode.includes('googlesyndication') || customJs.includes('googlesyndication')) {
                    const lazyLoadAdsScript = `
<script>
// Função para carregar scripts de anúncios sob demanda
function loadAdScripts() {
  // Verifica se os scripts já foram carregados
  if (window.adScriptsLoaded) return;
  
  // Marcar como carregado para evitar carregamentos duplicados
  window.adScriptsLoaded = true;
  
  // Função para carregar script
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Carregar scripts de anúncios quando necessário
  if (document.querySelector('.adsbygoogle')) {
    loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
  }
}

// Carregar anúncios quando a página estiver ociosa ou quando o usuário interagir
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => loadAdScripts());
} else {
  setTimeout(loadAdScripts, 3000);
}

// Carregar também na interação do usuário
document.addEventListener('scroll', function lazyLoadOnScroll() {
  loadAdScripts();
  document.removeEventListener('scroll', lazyLoadOnScroll);
}, {passive: true});
</script>`;

                    template = template.replace('</body>', lazyLoadAdsScript + '</body>');
                }

                // Otimizar carregamento do Google Tag Manager
                if (analyticsCode.includes('googletagmanager') || customJs.includes('googletagmanager')) {
                    // Extrair o ID do GTM (formato G-XXXXXXXX ou GTM-XXXXXXX)
                    const gtmIdMatch = (analyticsCode + customJs).match(/['"](G-[A-Z0-9]+|GTM-[A-Z0-9]+)['"]/);
                    if (gtmIdMatch && gtmIdMatch[1]) {
                        const gtmId = gtmIdMatch[1];
                        // Substituir o código original por um carregamento otimizado
                        const optimizedGtmScript = `
<script>
// Carregamento otimizado do Google Tag Manager
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gtmId}', {'send_page_view': false});

// Carregar o script completo do GTM quando a página estiver ociosa
function loadGtm() {
  if (window.gtmLoaded) return;
  window.gtmLoaded = true;
  
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=${gtmId}';
  script.defer = true;
  document.head.appendChild(script);
  
  // Enviar pageview depois que o script for carregado
  script.onload = function() {
    gtag('event', 'page_view');
  };
}

// Carregar GTM quando o navegador estiver ocioso ou após 3 segundos
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => loadGtm());
} else {
  setTimeout(loadGtm, 3000);
}
</script>`;

                        // Remover scripts originais do GTM
                        template = template.replace(new RegExp(`<script[^>]*googletagmanager[^>]*>[\\s\\S]*?</script>`, 'g'), '');
                        template = template.replace('</head>', optimizedGtmScript + '</head>');
                    }
                }

                if (process.env.NODE_ENV === 'production') {
                    template = template.replace(/<script[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '');
                    template = template.replace(/<script[^>]*type="[^"]*"[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '');
                }

                for(const key in metadata)
                    template = template.replace(`{${key}}`, metadata[key]);

                const responseHeaders = {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'public, max-age=900'
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

    // @ts-ignore
    serverInstance = server.listen(port, "0.0.0.0", () => {
        console.log(`🚀 SSR server running at http://localhost:${port}`);
    });
}

setTimeout(bootstrap, 4000);
