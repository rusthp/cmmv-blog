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
            return this.createAndSavePlaceholder(title);
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
     * Validates all <img> tags in HTML content, removing broken ones.
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
            let isValid = false;
            try {
                const resolved = await this.validateAndResolveImage(src, 'Content Image');
                isValid = !!resolved;
            } catch {
                isValid = false;
            }
            if (!isValid) {
                const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const tagRegex = new RegExp(`<img[^>]+src="${escapedSrc}"[^>]*>`, 'g');
                validatedContent = validatedContent.replace(tagRegex, '');
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
     * Creates a branded SVG placeholder and saves it via MediasService.
     */
    async createAndSavePlaceholder(title: string): Promise<string> {
        try {
            const bgColor = '#1e1e2f';
            const textColor = '#ffffff';

            const words = (title || 'No Title').split(' ');
            let lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
                if ((currentLine + word).length > 40) {
                    lines.push(currentLine);
                    currentLine = word + ' ';
                } else {
                    currentLine += word + ' ';
                }
            }
            if (currentLine) lines.push(currentLine);
            lines = lines.slice(0, 3);

            let textElements = '';
            const startY = 200 - (lines.length - 1) * 20;

            lines.forEach((line, index) => {
                textElements += `<text x="50%" y="${startY + index * 40}" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${textColor}" font-weight="bold">${line
                    .trim()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')}</text>`;
            });

            const svg = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${bgColor}"/>
                <g opacity="0.1">
                    <circle cx="10%" cy="20%" r="50" fill="#ffffff"/>
                    <circle cx="90%" cy="80%" r="100" fill="#ffffff"/>
                </g>
                ${textElements}
            </svg>`;

            const buffer = Buffer.from(svg, 'utf-8');
            const base64Data = `data:image/svg+xml;base64,${buffer.toString('base64')}`;

            if (this.mediasServiceInstance) {
                const generatedUrl = await this.mediasServiceInstance.getImageUrl(
                    base64Data, "webp", undefined, undefined, 80, title, title
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
