importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

const {
    registerRoute,
    setCatchHandler
} = workbox.routing;
const {
    CacheFirst,
    NetworkFirst,
    StaleWhileRevalidate
} = workbox.strategies;
const {
    ExpirationPlugin
} = workbox.expiration;
const {
    CacheableResponsePlugin
} = workbox.cacheableResponse;
const {
    BackgroundSyncPlugin
} = workbox.backgroundSync;
const {
    skipWaiting,
    clientsClaim
} = workbox.core;

self.addEventListener("install", e => {
    e.waitUntil(self.skipWaiting());
});
clientsClaim();

const VERSION = "v0.0.7";

const CACHE_NAMES = {
    ASSETS: "assets-cache-" + VERSION,
    STATIC: "static-cache-" + VERSION,
    LAST_VISITED: "last-visited-" + VERSION,
    COUPONS: `coupons-pages-${VERSION}-${(new Date).toLocaleDateString("pt-BR").replace(/\//g, "")}`,
    OFFLINE_QUEUE: "offline-queue-" + VERSION
};

const ROUTE_REGEX = {
    IMAGES: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
    ASSETS: /\.(?:js|css|woff2?|eot|ttf|otf|map)$/i,
    COUPONS: /(?:\?|&)c=(\d+)(?:&|#|$)/,
    LAST_VISITED: /.*(?:static\.com\.br\/widget\/lastvisitedstores)/,
};

const assetsExpirationPlugin = new ExpirationPlugin({
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
    purgeOnQuotaError: true
});

const imagesExpirationPlugin = new ExpirationPlugin({
    maxEntries: 100,
    maxAgeSeconds: 60 * 24 * 60 * 60, // 60 dias
    purgeOnQuotaError: true
});

const couponsExpirationPlugin = new ExpirationPlugin({
    maxEntries: 40,
    maxAgeSeconds: 1800,
    purgeOnQuotaError: true
});

const lastVisitedStoresExpirationPlugin = new ExpirationPlugin({
    maxEntries: 8,
    maxAgeSeconds: 60,
    purgeOnQuotaError: true
});

// Lista de domínios do Google Ads/AdSense que devem ser excluídos do cache
const GOOGLE_ADS_DOMAINS = [
    'googlesyndication.com',
    'googleadservices.com',
    'doubleclick.net',
    'adtrafficquality.google',
    'googletagmanager.com',
    'googletagservices.com',
    'gstatic.com',
    'adsystem.google.com',
    'pagead2.googlesyndication.com'
];

// Função helper para verificar se uma URL é do Google Ads
const isGoogleAdsUrl = (url) => {
    return GOOGLE_ADS_DOMAINS.some(domain => url.hostname.includes(domain)) ||
           url.hostname.includes('google') && url.pathname.includes('/pagead/');
};

// 🚫 Excluir completamente requisições do Google Ads/AdSense do service worker
registerRoute(
    ({ url }) => isGoogleAdsUrl(url) || 
                 url.hostname.includes('google') && url.pathname.includes('/pagead/') ||
                 url.pathname.includes('sodar'),
    new NetworkFirst({
        networkTimeoutSeconds: 3,
        plugins: [
            new CacheableResponsePlugin({ 
                statuses: [0, 200] // Aceita respostas opacas também
            })
        ]
    })
);

// ⚡️ Cache JS/CSS com CacheFirst (exceto AdSense)
registerRoute(
    ({ request, url }) =>
        (request.destination === 'script' || request.destination === 'style') &&
        !isGoogleAdsUrl(url),
    new CacheFirst({
        cacheName: CACHE_NAMES.ASSETS,
        plugins: [
            new CacheableResponsePlugin({ statuses: [200] }),
            assetsExpirationPlugin
        ]
    })
);

// ⚡️ Cache imagens
registerRoute(
    ({ request }) => request.destination === 'image' || ROUTE_REGEX.IMAGES.test(request.url),
    new CacheFirst({
        cacheName: 'images-cache-' + VERSION,
        plugins: [
            new CacheableResponsePlugin({ statuses: [200] }),
            imagesExpirationPlugin
        ]
    })
);

// 🔄 Cache fontes do Google
registerRoute(
    ({ url }) => url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
            new CacheableResponsePlugin({ statuses: [200] }),
            new ExpirationPlugin({ maxEntries: 20 })
        ]
    })
);

// 🏷 Cupons
registerRoute(ROUTE_REGEX.COUPONS, new CacheFirst({
    cacheName: CACHE_NAMES.COUPONS,
    plugins: [
        new BackgroundSyncPlugin(CACHE_NAMES.OFFLINE_QUEUE, {
            maxRetentionTime: 1440
        }),
        couponsExpirationPlugin
    ]
}));

// 🛍 Últimas lojas
registerRoute(ROUTE_REGEX.LAST_VISITED, new CacheFirst({
    cacheName: CACHE_NAMES.LAST_VISITED,
    plugins: [lastVisitedStoresExpirationPlugin]
}));

// 🛡️ Catch handler para requisições que falham (evita erros no console)
setCatchHandler(async ({ event, request, url }) => {
    // Se for uma requisição do Google Ads/AdSense que falhou, ignore silenciosamente
    if (isGoogleAdsUrl(url) || 
        url.hostname.includes('google') || 
        url.pathname.includes('pagead') ||
        url.pathname.includes('sodar')) {
        console.log('Ignorando falha em requisição do Google Ads:', url.href);
        return;
    }

    // Para outras requisições, tente o cache ou retorne uma resposta offline
    switch (request.destination) {
        case 'document':
            // Para páginas, retorne uma resposta de offline se disponível
            return caches.match('/offline.html') || new Response('Página offline indisponível', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        
        case 'image':
            // Para imagens, retorne um placeholder se disponível
            return caches.match('/assets/offline-image.svg') || new Response();
        
        default:
            console.log('Requisição falhou:', url.href);
            return new Response();
    }
});

// 🎯 Mensagens
self.addEventListener("message", e => {
    if (e.data === "clear_coupons") {
        couponsExpirationPlugin.deleteCacheAndMetadata().finally(() => {
            e.source.postMessage("coupons_cleared");
        });
    } else if (e.data === "clear_assets") {
        assetsExpirationPlugin.deleteCacheAndMetadata().finally(() => {
            e.source.postMessage("assets_cleared");
        });
    } else if (e.data === "logout") {
        lastVisitedStoresExpirationPlugin.deleteCacheAndMetadata().finally(() => {
            e.source.postMessage("last_visited_cleared");
        });
    } else if (e.data?.type === "force_update") {
        self.skipWaiting();
        clientsClaim();
    }
});
