import { Logger, Config, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import * as crypto from 'crypto';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

/**
 * Handles all image-related pipeline logic:
 * - SSRF protection (DNS lookup + private IP detection)
 * - Smart retry with error classification
 * - URL normalization for better cache hits
 * - Dynamic Referer resolution per domain
 * - Image cache (SHA-256 dedup)
 * - SVG placeholder generation
 */
export class ImagePipelineWorker {
    private static readonly logger = new Logger("ImagePipelineWorker");

    constructor(private readonly mediasServiceInstance: any) {}

    // ─── Public API ──────────────────────────────────────────

    /**
     * Validates, downloads, caches, and returns a served URL for the given image.
     * Falls back to a branded SVG placeholder on failure.
     */
    async validateAndResolveImage(
        url: string,
        title: string,
        channelReferer?: string,
    ): Promise<string> {
        if (!url || url.trim() === '') {
            return '';
        }

        const normalizedUrl = this.normalizeImageUrl(url);
        const ImageCacheEntity = Repository.getEntity("ImageCacheEntity");

        // Fast Cache Lookup by normalized URL then original
        if (ImageCacheEntity) {
            const cachedByUrl =
                (await Repository.findOne(ImageCacheEntity, { originalUrl: normalizedUrl })) ||
                (await Repository.findOne(ImageCacheEntity, { originalUrl: url }));

            if (cachedByUrl) {
                await Repository.update(ImageCacheEntity, { id: cachedByUrl.id }, { lastUsedAt: new Date() });

                if (cachedByUrl.localPath.startsWith('http') || cachedByUrl.localPath.startsWith('/images/')) {
                    let apiUrl = Config.get<string>("blog.url", process.env.API_URL || "http://localhost:5000");
                    if (apiUrl.endsWith("/")) apiUrl = apiUrl.slice(0, -1);
                    return cachedByUrl.localPath.startsWith('http')
                        ? cachedByUrl.localPath
                        : `${apiUrl}${cachedByUrl.localPath}`;
                }
            }
        }

        try {
            const parsedUrl = new URL(url);

            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                throw new Error(`Invalid protocol: ${parsedUrl.protocol}`);
            }

            if (parsedUrl.hostname === 'localhost') {
                throw new Error(`SSRF Blocked: Resolves to localhost`);
            }

            const TRUSTED_IMAGE_DOMAINS = ['hltv.org', 'img-cdn.hltv.org', 'thespike.gg', 'www.thespike.gg'];

            if (!TRUSTED_IMAGE_DOMAINS.includes(parsedUrl.hostname)) {
                try {
                    const { address } = await dnsLookup(parsedUrl.hostname);
                    if (this.isPrivateIP(address)) {
                        throw new Error(`SSRF Blocked: Resolves to private IP (${address})`);
                    }
                } catch (dnsErr: any) {
                    if (dnsErr.message.includes('SSRF')) throw dnsErr;
                    ImagePipelineWorker.logger.log(
                        `[pipeline][WARN] DNS lookup failed for ${parsedUrl.hostname}: ${dnsErr.message}. Attempting fetch anyway.`
                    );
                }
            }

            // Smart retry: up to 2 attempts with error-aware strategy
            const MAX_ATTEMPTS = 2;
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
            let lastError: Error | null = null;
            let fullBuffer: Buffer | null = null;
            let contentType = '';
            let totalBytes = 0;

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);

                const attemptReferer: string =
                    attempt > 0 && lastError?.message.includes('403')
                        ? 'https://www.google.com/'
                        : this.getRefererForDomain(parsedUrl.hostname, channelReferer);

                const attemptHeaders: Record<string, string> = {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': attemptReferer,
                };

                try {
                    const response: Response = await fetch(normalizedUrl, {
                        method: 'GET',
                        headers: attemptHeaders,
                        redirect: 'follow',
                        signal: controller.signal,
                    });

                    clearTimeout(timeout);

                    if (!response.ok) {
                        const strategy = this.classifyImageError(response.status);
                        if (strategy === 'discard') throw new Error(`HTTP ${response.status} (discard)`);
                        lastError = new Error(`HTTP ${response.status}`);
                        if (strategy === 'retry' && attempt < MAX_ATTEMPTS - 1) {
                            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                            continue;
                        }
                        if (strategy === 'retry-referer' && attempt < MAX_ATTEMPTS - 1) continue;
                        throw lastError;
                    }

                    contentType = response.headers.get('content-type') || '';
                    if (!contentType.startsWith('image/')) {
                        throw new Error(`Invalid content-type: ${contentType}`);
                    }

                    const contentLengthHeader = response.headers.get('content-length');
                    if (contentLengthHeader) {
                        const size = parseInt(contentLengthHeader, 10);
                        if (size > MAX_SIZE) throw new Error(`Image too large: ${size} bytes`);
                    }

                    const chunks: Uint8Array[] = [];
                    totalBytes = 0;

                    if (response.body) {
                        const reader = response.body.getReader();
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            if (value) {
                                chunks.push(value);
                                totalBytes += value.length;
                                if (totalBytes > MAX_SIZE) {
                                    reader.cancel("Max size exceeded");
                                    throw new Error(`Image exceeded max size limits during streaming (> 5MB).`);
                                }
                            }
                        }
                    } else {
                        const buffer = await response.arrayBuffer();
                        const uint8 = new Uint8Array(buffer);
                        if (uint8.length > MAX_SIZE) throw new Error("Image exceeded max size limits");
                        chunks.push(uint8);
                        totalBytes = uint8.length;
                    }

                    if (totalBytes < 1000) throw new Error("Image too small");

                    fullBuffer = Buffer.concat(chunks);
                    break; // success — exit retry loop
                } catch (err: any) {
                    clearTimeout(timeout);
                    lastError = err;
                    const strategy = this.classifyImageError(err.message || '');
                    if (strategy === 'discard' || attempt >= MAX_ATTEMPTS - 1) throw err;
                    ImagePipelineWorker.logger.log(
                        `[pipeline][RETRY] Attempt ${attempt + 1} failed for ${parsedUrl.hostname}: ${err.message}`
                    );
                    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                }
            }

            if (!fullBuffer) throw new Error("All download attempts failed");

            const hash = this.hashBuffer(fullBuffer);

            let finalUrl = '';

            if (this.mediasServiceInstance) {
                const base64Data = `data:${contentType};base64,${fullBuffer.toString('base64')}`;
                finalUrl = await this.mediasServiceInstance.getImageUrl(
                    base64Data, 'webp', undefined, undefined, 80, title, title
                );
            }

            if (!finalUrl) {
                return this.createAndSavePlaceholder(title);
            }

            if (ImageCacheEntity) {
                const existingHash = await Repository.findOne(ImageCacheEntity, { hash });
                if (!existingHash) {
                    await Repository.insert(ImageCacheEntity, {
                        originalUrl: normalizedUrl,
                        localPath: finalUrl,
                        sourceDomain: parsedUrl.hostname,
                        mimeType: contentType,
                        fileSize: totalBytes,
                        hash,
                        lastUsedAt: new Date(),
                    });
                } else {
                    await Repository.update(
                        ImageCacheEntity,
                        { id: existingHash.id },
                        { lastUsedAt: new Date(), localPath: finalUrl }
                    );
                }
            }

            return finalUrl;
        } catch (error: any) {
            ImagePipelineWorker.logger.log(`[pipeline][ERROR] Failed to fetch external image ${url}: ${error.message}`);

            const ImageCacheEntity = Repository.getEntity("ImageCacheEntity");
            if (ImageCacheEntity) {
                const fallbackCache = await Repository.findOne(ImageCacheEntity, { originalUrl: url });
                if (fallbackCache) {
                    await Repository.update(ImageCacheEntity, { id: fallbackCache.id }, { lastUsedAt: new Date() });
                    if (fallbackCache.localPath.startsWith('http') || fallbackCache.localPath.startsWith('/images/')) {
                        let apiUrl = Config.get<string>("blog.url", process.env.API_URL || "http://localhost:5000");
                        if (apiUrl.endsWith("/")) apiUrl = apiUrl.slice(0, -1);
                        return fallbackCache.localPath.startsWith('http')
                            ? fallbackCache.localPath
                            : `${apiUrl}${fallbackCache.localPath}`;
                    }
                }
            }

            try {
                return await this.createAndSavePlaceholder(title);
            } catch {
                ImagePipelineWorker.logger.error(`[pipeline][ERROR] Failed to save placeholder for ${url}`);
                return '';
            }
        }
    }

    /**
     * Validates all <img> tags in HTML content, rewriting valid ones
     * to use local URLs and removing broken ones.
     */
    async validateContentImages(content: string): Promise<string> {
        if (!content) return "";

        const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/g;
        let validatedContent = content;
        let match;

        const sources: string[] = [];
        while ((match = imgRegex.exec(content)) !== null) {
            sources.push(match[1]);
        }

        for (const src of sources) {
            const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const tagRegex = new RegExp(`(<img[^>]+)src="${escapedSrc}"`, 'g');

            try {
                const resolved = await this.validateAndResolveImage(src, 'Content Image');

                if (resolved) {
                    // Rewrite image src to use resolved (local) URL
                    validatedContent = validatedContent.replace(tagRegex, `$1src="${resolved}"`);
                    ImagePipelineWorker.logger.log(`[pipeline] validateContentImages: Rewrote image ${src} → ${resolved}`);
                } else {
                    // Remove broken image entirely
                    const fullTagRegex = new RegExp(`<img[^>]+src="${escapedSrc}"[^>]*>`, 'g');
                    validatedContent = validatedContent.replace(fullTagRegex, '');
                    ImagePipelineWorker.logger.log(`[pipeline] validateContentImages: Removed broken image ${src}`, 'warn');
                }
            } catch {
                const fullTagRegex = new RegExp(`<img[^>]+src="${escapedSrc}"[^>]*>`, 'g');
                validatedContent = validatedContent.replace(fullTagRegex, '');
                ImagePipelineWorker.logger.log(`[pipeline] validateContentImages: Removed broken image ${src}`, 'warn');
            }
        }

        return validatedContent;
    }

    // ─── Internals (exposed for testing) ─────────────────────

    isPrivateIP(ip: string): boolean {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4) return false;

        return (
            ip === '127.0.0.1' ||
            parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168) ||
            (parts[0] === 169 && parts[1] === 254)
        );
    }

    hashBuffer(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    getExtensionFromContentType(contentType: string): string {
        if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
        if (contentType.includes('png')) return 'png';
        if (contentType.includes('webp')) return 'webp';
        if (contentType.includes('gif')) return 'gif';
        if (contentType.includes('svg')) return 'svg';
        if (contentType.includes('avif')) return 'avif';
        return 'jpg';
    }

    /**
     * Strips tracking/SDK query params from image URLs to improve cache hit rate.
     */
    normalizeImageUrl(rawUrl: string): string {
        try {
            const parsed = new URL(rawUrl);
            const TRACKING_PARAMS = [
                'ixlib', 'ixid', 'utm_source', 'utm_medium', 'utm_campaign',
                's', 'sig', 'token', '_ga', 'fbclid',
            ];
            for (const p of TRACKING_PARAMS) parsed.searchParams.delete(p);
            return parsed.toString();
        } catch {
            return rawUrl;
        }
    }

    /**
     * Resolves the Referer header for a given image domain.
     */
    getRefererForDomain(hostname: string, channelReferer?: string): string {
        if (channelReferer) return channelReferer;

        const REFERER_MAP: Record<string, string> = {
            'img-cdn.hltv.org': 'https://www.hltv.org/',
            'hltv.org': 'https://www.hltv.org/',
            'cdn.thespike.gg': 'https://www.thespike.gg/',
            'www.thespike.gg': 'https://www.thespike.gg/',
            'thespike.gg': 'https://www.thespike.gg/',
        };
        return REFERER_MAP[hostname] ?? `https://${hostname.replace(/^(img-cdn|cdn|static|media|assets)\./, '')}/`;
    }

    /**
     * Classifies an HTTP error to decide retry strategy.
     */
    classifyImageError(statusOrError: number | string): 'retry' | 'retry-referer' | 'discard' {
        if (typeof statusOrError === 'number') {
            if (statusOrError === 403) return 'retry-referer';
            if (statusOrError === 429 || statusOrError >= 500) return 'retry';
            return 'discard';
        }
        const msg = statusOrError.toLowerCase();
        if (msg.includes('timeout') || msg.includes('abort')) return 'retry';
        if (msg.includes('dns') || msg.includes('enotfound')) return 'discard';
        return 'retry';
    }

    /**
     * Uses Puppeteer to render the article page (with JS), then:
     *   1. Searches the rendered DOM for the main article image
     *   2. Extracts the real src (after lazy-load/JS execution)
     *   3. Downloads and processes through the normal pipeline
     *   4. Only takes a cropped screenshot as last resort
     */
    async captureScreenshot(pageUrl: string, title: string): Promise<string> {
        let puppeteer: any;
        let usesStealth = false;

        // Priority: puppeteer-extra + stealth > puppeteer > puppeteer-core
        try {
            const puppeteerExtra = require('puppeteer-extra');
            const StealthPlugin = require('puppeteer-extra-plugin-stealth');
            puppeteerExtra.use(StealthPlugin());
            puppeteer = puppeteerExtra;
            usesStealth = true;
        } catch {
            try {
                puppeteer = require('puppeteer');
            } catch {
                try {
                    puppeteer = require('puppeteer-core');
                } catch {
                    ImagePipelineWorker.logger.log('[pipeline] Puppeteer not available, skipping');
                    return '';
                }
            }
        }

        const width = Config.get<number>("blog.featureImage.width", 960);
        const height = Config.get<number>("blog.featureImage.height", 504);
        const executablePath = this.findChromePath();

        // Rotate user-agents to reduce fingerprinting
        const USER_AGENTS = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        ];
        const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

        const launchOptions: any = {
            headless: 'new',
            args: [
                '--no-sandbox', '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', '--disable-gpu',
                '--disable-extensions',
                '--disable-blink-features=AutomationControlled',
                '--lang=pt-BR,pt,en-US,en',
                `--window-size=${width},${height + 300}`,
            ],
            defaultViewport: { width, height: height + 300 },
            timeout: 15000,
        };

        if (executablePath) launchOptions.executablePath = executablePath;

        let browser: any;
        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (err: any) {
            ImagePipelineWorker.logger.log(`[pipeline] Browser launch failed: ${err.message}`);
            return '';
        }

        try {
            const page = await browser.newPage();

            await page.setUserAgent(randomUA);

            // Extra anti-detection (when stealth plugin is not available)
            if (!usesStealth) {
                await page.evaluateOnNewDocument(() => {
                    // Hide webdriver flag
                    Object.defineProperty(navigator, 'webdriver', { get: () => false });
                    // Fake plugins
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5],
                    });
                    // Fake languages
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['pt-BR', 'pt', 'en-US', 'en'],
                    });
                    // Pass Chrome detection
                    (window as any).chrome = { runtime: {} };
                }).catch(() => {});
            }

            // Set realistic headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            });

            // Block heavy resources but KEEP images (we need them)
            await page.setRequestInterception(true);
            page.on('request', (req: any) => {
                const type = req.resourceType();
                if (['font', 'media', 'websocket'].includes(type)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.goto(pageUrl, {
                waitUntil: 'networkidle2',
                timeout: 15000,
            });

            // Wait for lazy-loaded images to appear
            await new Promise(r => setTimeout(r, 2000));

            // Scroll down slightly to trigger lazy-load
            await page.evaluate(() => window.scrollBy(0, 300)).catch(() => {});
            await new Promise(r => setTimeout(r, 1000));

            // ─── Strategy A: Extract the actual article image URL from the rendered DOM ───
            const extractedImageUrl: string = await page.evaluate(() => {
                const MIN_WIDTH = 200;
                const MIN_HEIGHT = 150;

                // Helper: check if an image is large enough and visible
                const isValidImage = (img: HTMLImageElement): boolean => {
                    if (!img.src || img.src.startsWith('data:')) return false;
                    if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) return false;
                    const rect = img.getBoundingClientRect();
                    if (rect.width < MIN_WIDTH || rect.height < MIN_HEIGHT) return false;
                    // Skip icons, logos, avatars
                    const src = img.src.toLowerCase();
                    const alt = (img.alt || '').toLowerCase();
                    const cls = (img.className || '').toLowerCase();
                    if (/logo|icon|avatar|badge|emoji|pixel|tracker|ads|sprite/i.test(src + alt + cls)) return false;
                    return true;
                };

                // 1) og:image from rendered page (JS may have set it)
                const ogMeta = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                if (ogMeta?.content && ogMeta.content.startsWith('http')) return ogMeta.content;

                // 2) twitter:image
                const twMeta = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
                if (twMeta?.content && twMeta.content.startsWith('http')) return twMeta.content;

                // 3) Look for hero/feature image by common selectors
                const heroSelectors = [
                    'article img',
                    '[class*="article"] img',
                    '[class*="post"] img',
                    '[class*="story"] img',
                    '[class*="content"] img',
                    '[class*="hero"] img',
                    '[class*="feature"] img',
                    '[class*="thumbnail"] img',
                    '[class*="cover"] img',
                    '.entry-content img',
                    '.post-content img',
                    '.article-body img',
                    'main img',
                    '#content img',
                ];

                for (const selector of heroSelectors) {
                    const imgs = document.querySelectorAll(selector) as NodeListOf<HTMLImageElement>;
                    for (const img of imgs) {
                        if (isValidImage(img)) return img.currentSrc || img.src;
                    }
                }

                // 4) Find the largest visible image on the page
                const allImgs = document.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
                let bestImg: HTMLImageElement | null = null;
                let bestArea = 0;

                for (const img of allImgs) {
                    if (!isValidImage(img)) continue;
                    const area = img.naturalWidth * img.naturalHeight;
                    if (area > bestArea) {
                        bestArea = area;
                        bestImg = img;
                    }
                }

                if (bestImg) return bestImg.currentSrc || bestImg.src;

                // 5) Check background images on hero elements
                const bgSelectors = [
                    '[class*="hero"]', '[class*="banner"]', '[class*="cover"]',
                    '[class*="feature"]', '[class*="header-image"]',
                ];
                for (const sel of bgSelectors) {
                    const el = document.querySelector(sel) as HTMLElement;
                    if (el) {
                        const bg = getComputedStyle(el).backgroundImage;
                        const urlMatch = bg?.match(/url\(["']?([^"')]+)["']?\)/);
                        if (urlMatch?.[1] && urlMatch[1].startsWith('http')) return urlMatch[1];
                    }
                }

                return '';
            }).catch(() => '');

            // If we found an image URL, download it through the normal pipeline
            if (extractedImageUrl) {
                ImagePipelineWorker.logger.log(
                    `[pipeline] Browser extracted image from ${pageUrl}: ${extractedImageUrl.substring(0, 100)}`
                );

                await browser.close();
                browser = null;

                // Process through normal image pipeline (download, convert, cache)
                const result = await this.validateAndResolveImage(extractedImageUrl, title);
                if (result) return result;
            }

            // ─── Strategy B: No image found in DOM → screenshot the article area ───
            if (browser) {
                ImagePipelineWorker.logger.log(
                    `[pipeline] No image found in DOM for ${pageUrl}, taking article screenshot`
                );

                // Remove distractions
                await page.evaluate(() => {
                    const removeSelectors = [
                        '[class*="cookie"]', '[class*="consent"]', '[class*="popup"]',
                        '[class*="modal"]', '[class*="overlay"]', '[id*="cookie"]',
                        '[class*="gdpr"]', 'nav', 'header', 'footer',
                        '[class*="sidebar"]', '[class*="widget"]', '[class*="ad-"]',
                        '[class*="advertisement"]', '[class*="social"]',
                    ];
                    removeSelectors.forEach(sel => {
                        document.querySelectorAll(sel).forEach(el => {
                            (el as HTMLElement).style.display = 'none';
                        });
                    });

                    // Try to find the article element and scroll to it
                    const article = document.querySelector('article')
                        || document.querySelector('[class*="article"]')
                        || document.querySelector('[class*="post-content"]')
                        || document.querySelector('main');
                    if (article) article.scrollIntoView({ block: 'start' });
                }).catch(() => {});

                await new Promise(r => setTimeout(r, 500));

                const screenshotBuffer = await page.screenshot({
                    type: 'jpeg',
                    quality: 85,
                    clip: { x: 0, y: 0, width, height },
                });

                await browser.close();
                browser = null;

                if (screenshotBuffer && screenshotBuffer.length > 5000 && this.mediasServiceInstance) {
                    const base64Data = `data:image/jpeg;base64,${Buffer.from(screenshotBuffer).toString('base64')}`;
                    const finalUrl = await this.mediasServiceInstance.getImageUrl(
                        base64Data, 'webp', width, height, 80, title, title
                    );
                    if (finalUrl) {
                        ImagePipelineWorker.logger.log(
                            `[pipeline] Article screenshot saved for "${title}"`
                        );
                        return finalUrl;
                    }
                }
            }
        } catch (err: any) {
            ImagePipelineWorker.logger.log(`[pipeline] captureScreenshot error: ${err.message}`);
        } finally {
            if (browser) { try { await browser.close(); } catch {} }
        }

        return '';
    }

    /**
     * Try to find Chrome/Chromium executable path on the system.
     */
    private findChromePath(): string | null {
        const fs = require('fs');
        const candidates = [
            // Linux
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
            // macOS
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            // Windows
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ];

        for (const path of candidates) {
            try {
                if (fs.existsSync(path)) return path;
            } catch {}
        }

        return null;
    }

    /**
     * Creates a branded SVG placeholder and saves it via MediasService.
     */
    async createAndSavePlaceholder(title: string): Promise<string> {
        try {
            const siteName = Config.get<string>("blog.autoPipelineSiteName", "ProPlay News");
            const placeholderWidth = Config.get<number>("blog.featureImage.width", 960);
            const placeholderHeight = Config.get<number>("blog.featureImage.height", 504);

            const esc = (s: string) => s
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Truncate title to avoid overflow in the SVG
            let displayTitle = (title || 'No Title');
            if (displayTitle.length > 80) displayTitle = displayTitle.substring(0, 77) + '...';

            const words = displayTitle.split(' ');
            let lines: string[] = [];
            let currentLine = '';
            const maxCharsPerLine = Math.floor(placeholderWidth / 28);

            for (const word of words) {
                if ((currentLine + word).length > maxCharsPerLine) {
                    lines.push(currentLine);
                    currentLine = word + ' ';
                } else {
                    currentLine += word + ' ';
                }
            }
            if (currentLine) lines.push(currentLine);
            lines = lines.slice(0, 2);

            let textElements = '';
            const centerY = placeholderHeight / 2;
            const lineHeight = 32;
            const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

            lines.forEach((line, index) => {
                textElements += `<text x="50%" y="${startY + index * lineHeight}" dominant-baseline="middle" text-anchor="middle" font-family="'Segoe UI',Roboto,sans-serif" font-size="22" fill="#ffffff" font-weight="600" letter-spacing="0.3">${line
                    .trim()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')}</text>`;
            });

            const brandY = placeholderHeight - 60;
            const lineY = brandY - 30;

            const svg = `<svg width="${placeholderWidth}" height="${placeholderHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#7c3aed"/>
                        <stop offset="30%" style="stop-color:#1a1a2e"/>
                        <stop offset="70%" style="stop-color:#1a1a2e"/>
                        <stop offset="100%" style="stop-color:#7c3aed"/>
                    </linearGradient>
                    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#ffcc00"/>
                        <stop offset="100%" style="stop-color:#ffa500"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)"/>
                <g opacity="0.08">
                    <circle cx="15%" cy="25%" r="80" fill="#7c3aed"/>
                    <circle cx="85%" cy="75%" r="120" fill="#7c3aed"/>
                    <circle cx="70%" cy="15%" r="40" fill="#ffcc00"/>
                </g>
                <rect x="50%" y="${lineY}" width="120" height="3" rx="1.5" fill="url(#accent)" transform="translate(-60,0)"/>
                ${textElements}
                <text x="50%" y="${brandY}" dominant-baseline="middle" text-anchor="middle" font-family="'Segoe UI',Roboto,sans-serif" font-size="14" fill="#ffcc00" font-weight="600" letter-spacing="2" text-transform="uppercase">${siteName
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
            </svg>`;

            const buffer = Buffer.from(svg, 'utf-8');
            const base64Data = `data:image/svg+xml;base64,${buffer.toString('base64')}`;

            if (this.mediasServiceInstance) {
                const generatedUrl = await this.mediasServiceInstance.getImageUrl(
                    base64Data, "webp", placeholderWidth, placeholderHeight, 80, title, title
                );
                return generatedUrl || '';
            }

            return '';
        } catch (err: any) {
            ImagePipelineWorker.logger.log(
                `[pipeline][CRITICAL] Failed to generate fallback placeholder ${err.message}`,
                'error'
            );
            return '';
        }
    }
}
