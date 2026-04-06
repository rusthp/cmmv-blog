import * as fs from 'fs';
import * as path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Config, Logger } from '@cmmv/core';

const nodeFetch = require('node-fetch') as {
    default: (url: string, init?: any) => Promise<any>;
};

interface ProxyEntry {
    url: string;
    failCount: number;
    lastFail: number;
    lastSuccess: number;
}

export class ProxyManager {
    private static instance: ProxyManager;
    private proxies: ProxyEntry[] = [];
    private currentIndex = 0;
    private readonly logger = new Logger('ProxyManager');

    private readonly FAIL_COOLDOWN_MS = 15 * 60 * 1000; // 15 min
    private readonly MAX_FAILS = 3;
    private readonly RECENT_SUCCESS_MS = 30 * 60 * 1000; // 30 min

    private constructor() {
        this.loadProxies();
    }

    static getInstance(): ProxyManager {
        if (!ProxyManager.instance)
            ProxyManager.instance = new ProxyManager();
        return ProxyManager.instance;
    }

    reload(): void {
        this.proxies = [];
        this.currentIndex = 0;
        this.loadProxies();
    }

    private loadProxies(): void {
        const filePath = Config.get<string>('blog.proxiesFile', 'proxies.txt');
        const resolved = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);

        try {
            if (!fs.existsSync(resolved)) {
                this.logger.log(`[ProxyManager] File not found: ${resolved}`);
                return;
            }

            const lines = fs.readFileSync(resolved, 'utf-8')
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('http'));

            this.proxies = lines.map(url => ({
                url,
                failCount: 0,
                lastFail: 0,
                lastSuccess: 0,
            }));

            this.logger.log(`[ProxyManager] Loaded ${this.proxies.length} proxies from ${resolved}`);
        } catch (e: any) {
            this.logger.log(`[ProxyManager] Failed to load proxies: ${e.message}`);
        }
    }

    /**
     * Select the best proxy: prefer ones with recent success, skip blacklisted ones.
     */
    private getNext(preferHealthy: boolean = true): ProxyEntry | null {
        if (this.proxies.length === 0) return null;

        const now = Date.now();

        // Reset proxies that have cooled down
        for (const p of this.proxies) {
            if (p.failCount >= this.MAX_FAILS && now - p.lastFail > this.FAIL_COOLDOWN_MS) {
                p.failCount = 0;
            }
        }

        const available = this.proxies.filter(p => p.failCount < this.MAX_FAILS);

        if (available.length === 0) {
            this.logger.log('[ProxyManager] All proxies blacklisted — using direct connection');
            return null;
        }

        // Prefer proxies with recent successful use
        if (preferHealthy) {
            const healthy = available.filter(p =>
                now - p.lastSuccess < this.RECENT_SUCCESS_MS
            );
            if (healthy.length > 0) {
                const proxy = healthy[this.currentIndex % healthy.length];
                this.currentIndex = (this.currentIndex + 1) % healthy.length;
                return proxy;
            }
        }

        // Fallback: round-robin among all available
        const proxy = available[this.currentIndex % available.length];
        this.currentIndex = (this.currentIndex + 1) % available.length;
        return proxy;
    }

    markFailed(proxyUrl: string, httpStatus?: number): void {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (!proxy) return;
        proxy.failCount++;
        proxy.lastFail = Date.now();
        // If server returned 403/404, the proxy IP is likely permanently banned — blacklist immediately
        if (httpStatus === 403 || httpStatus === 404) {
            proxy.failCount = this.MAX_FAILS;
        }
        if (proxy.failCount >= this.MAX_FAILS)
            this.logger.log(`[ProxyManager] Blacklisted: ${proxyUrl.substring(7, 40)}...`);
    }

    markSuccess(proxyUrl: string): void {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (!proxy) return;
        proxy.lastSuccess = Date.now();
        if (proxy.failCount > 0)
            proxy.failCount = Math.max(0, proxy.failCount - 1);
    }

    get totalCount(): number { return this.proxies.length; }

    get availableCount(): number {
        return this.proxies.filter(p => p.failCount < this.MAX_FAILS).length;
    }

    /**
     * Fetch via rotating proxy. Tries up to 3 different proxies before falling back to direct.
     * Adds a connect timeout to avoid hanging on dead proxies.
     */
    async fetch(url: string, options: Record<string, any> = {}): Promise<any> {
        const MAX_PROXY_ATTEMPTS = 3;
        const CONNECT_TIMEOUT_MS = 6000;

        // Prefer "known good" proxies on the first attempt
        const preferHealthy = true;

        for (let attempt = 0; attempt < MAX_PROXY_ATTEMPTS; attempt++) {
            const proxy = this.getNext(attempt === 0 && preferHealthy);

            if (!proxy) {
                return nodeFetch.default(url, options);
            }

            if (attempt > 0) {
                this.logger.log(
                    `[ProxyManager] Attempt ${attempt + 1} with another proxy (${proxy.url.substring(7, 35)}...)`
                );
            }

            const agent = new HttpsProxyAgent(proxy.url);

            // Wrap with connect timeout to avoid hanging proxies (only if caller didn't provide one)
            let internalController: AbortController | null = null;
            let connectTimer: ReturnType<typeof setTimeout> | null = null;
            const effectiveSignal = options.signal || (() => {
                internalController = new AbortController();
                connectTimer = setTimeout(() => internalController!.abort(), CONNECT_TIMEOUT_MS);
                return internalController.signal;
            })();

            try {
                const response = await nodeFetch.default(url, {
                    ...options,
                    agent,
                    signal: effectiveSignal,
                });
                if (connectTimer) clearTimeout(connectTimer);
                this.markSuccess(proxy.url);
                return response;
            } catch (err: any) {
                clearTimeout(connectTimer);
                // Extract HTTP status if available (node-fetch puts it on response)
                const httpStatus = err.response?.status as number | undefined;
                if (httpStatus === 403 || httpStatus === 404) {
                    this.markFailed(proxy.url, httpStatus);
                    this.logger.log(
                        `[ProxyManager] HTTP ${httpStatus} (${proxy.url.substring(7, 35)}): IP likely banned`
                    );
                } else {
                    this.markFailed(proxy.url);
                    this.logger.log(
                        `[ProxyManager] Proxy error (${proxy.url.substring(7, 35)}): ${err.message} — trying another proxy`
                    );
                }
                // If we hit 403 or it's the last attempt, fall back to direct
                if (httpStatus === 403 || httpStatus === 404 || attempt >= MAX_PROXY_ATTEMPTS - 1) {
                    break;
                }
                // Otherwise try next proxy
            }
        }

        // After exhausting proxy attempts, try direct
        this.logger.log('[ProxyManager] All proxy attempts failed — retrying direct');
        return nodeFetch.default(url, options);
    }

    /**
     * Download a URL as Buffer via proxy. Handles size limit.
     */
    async fetchBuffer(
        url: string,
        options: Record<string, any> = {},
        maxBytes = 5 * 1024 * 1024
    ): Promise<{ buffer: Buffer; contentType: string; status: number }> {
        const response = await this.fetch(url, options);

        const contentType = response.headers.get('content-type') || '';
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

        if (contentLength > maxBytes)
            throw new Error(`Content-Length ${contentLength} exceeds limit ${maxBytes}`);

        const buffer: Buffer = await response.buffer();

        if (buffer.length > maxBytes)
            throw new Error(`Response body ${buffer.length} exceeds limit ${maxBytes}`);

        return { buffer, contentType, status: response.status };
    }
}

export const proxyManager = ProxyManager.getInstance();
