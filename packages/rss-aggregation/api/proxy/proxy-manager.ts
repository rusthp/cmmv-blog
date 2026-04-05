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
}

export class ProxyManager {
    private static instance: ProxyManager;
    private proxies: ProxyEntry[] = [];
    private currentIndex = 0;
    private readonly logger = new Logger('ProxyManager');

    private readonly FAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 min
    private readonly MAX_FAILS = 3;

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
            }));

            this.logger.log(`[ProxyManager] Loaded ${this.proxies.length} proxies from ${resolved}`);
        } catch (e: any) {
            this.logger.log(`[ProxyManager] Failed to load proxies: ${e.message}`);
        }
    }

    private getNext(): ProxyEntry | null {
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

        const proxy = available[this.currentIndex % available.length];
        this.currentIndex = (this.currentIndex + 1) % available.length;
        return proxy;
    }

    markFailed(proxyUrl: string): void {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (!proxy) return;
        proxy.failCount++;
        proxy.lastFail = Date.now();
        if (proxy.failCount >= this.MAX_FAILS)
            this.logger.log(`[ProxyManager] Blacklisted: ${proxyUrl.substring(7, 40)}...`);
    }

    markSuccess(proxyUrl: string): void {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (proxy && proxy.failCount > 0)
            proxy.failCount = Math.max(0, proxy.failCount - 1);
    }

    get totalCount(): number { return this.proxies.length; }

    get availableCount(): number {
        return this.proxies.filter(p => p.failCount < this.MAX_FAILS).length;
    }

    /**
     * Fetch via rotating proxy. Falls back to direct if no proxy available or on failure.
     */
    async fetch(url: string, options: Record<string, any> = {}): Promise<any> {
        const proxy = this.getNext();

        if (!proxy) {
            return nodeFetch.default(url, options);
        }

        const agent = new HttpsProxyAgent(proxy.url);

        try {
            const response = await nodeFetch.default(url, { ...options, agent });
            this.markSuccess(proxy.url);
            return response;
        } catch (err: any) {
            this.markFailed(proxy.url);
            this.logger.log(
                `[ProxyManager] Proxy error (${proxy.url.substring(7, 35)}): ${err.message} — retrying direct`
            );
            return nodeFetch.default(url, options);
        }
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
