import {
    Controller, Get
} from "@cmmv/http";

import { Application, Config, Logger } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

import {
    AutoPipelineService
} from "./auto-pipeline.service";

import {
    ChannelsService
} from "../channels/channels.service";

import { ImagePipelineWorker } from "./image-pipeline";

@Controller("pipeline")
export class AutoPipelineController {

    @Get("classify", { exclude: true })
    async runClassify() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.classifyWorker();
        return { result: true, message: "classifyWorker executed" };
    }

    @Get("generate", { exclude: true })
    async runGenerate() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.generateWorker();
        return { result: true, message: "generateWorker executed" };
    }

    @Get("postworker", { exclude: true })
    async runPost() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.postWorker();
        return { result: true, message: "postWorker executed" };
    }

    @Get("keywords", { exclude: true })
    async runKeywords() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.keywordEngineWorker();
        return { result: true, message: "keywordEngineWorker executed" };
    }

    @Get("enrich-keywords", { exclude: true })
    async runEnrichKeywords() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.keywordSuggestionsWorker();
        return { result: true, message: "keywordSuggestionsWorker executed" };
    }

    @Get("update-posts", { exclude: true })
    async runUpdatePosts() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.postUpdateWorker();
        return { result: true, message: "postUpdateWorker executed" };
    }

    @Get("runall", { exclude: true })
    async runAll() {
        const svc: any = Application.resolveProvider(AutoPipelineService);
        await svc.classifyWorker();
        await svc.keywordEngineWorker();
        await svc.generateWorker();
        await svc.postWorker();
        return { result: true, message: "Full pipeline executed" };
    }
    @Get("reprocess-images", { exclude: true })
    async reprocessImages() {
        const logger = new Logger("ImageReprocess");
        logger.log("Starting image reprocessing for posts with placeholder or missing images...");

        const PostsEntity = Repository.getEntity("PostsEntity");
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const MediasEntity = Repository.getEntity("MediasEntity");
        const MediasService = Application.resolveProvider(
            (await import("@cmmv/blog")).MediasService
        );

        const imagePipeline = new ImagePipelineWorker(MediasService);

        // Get all recent posts
        const allPosts = await Repository.findAll(PostsEntity, {
            limit: 200,
            sortBy: 'createdAt',
            sort: 'DESC',
        });

        // Build a set of placeholder image hashes to detect them
        const placeholderHashes = new Set<string>();
        try {
            const smallMedias = await Repository.findAll(MediasEntity, {
                limit: 500,
                sortBy: 'createdAt',
                sort: 'DESC',
            });
            for (const media of smallMedias?.data || []) {
                // Placeholders are SVG-converted-to-webp with very small file sizes (< 15KB)
                // and dimensions matching the placeholder config
                if (media.size && media.size < 15000 && media.width === media.height * 2) {
                    placeholderHashes.add(media.sha1);
                }
            }
        } catch {}

        let fixed = 0;
        let failed = 0;
        let skipped = 0;

        for (const post of allPosts?.data || []) {
            const img = post.featureImage || '';
            const isEmpty = !img.trim();
            const isPlaceholder = !isEmpty && this.looksLikePlaceholder(img, placeholderHashes);

            if (!isEmpty && !isPlaceholder) {
                skipped++;
                continue;
            }

            try {
                const feedRaw = await Repository.findOne(FeedRawEntity, { postRef: post.id });
                let resolvedImage = '';

                // Strategy 1: Try original featureImage from feed
                if (feedRaw?.featureImage) {
                    try {
                        resolvedImage = await imagePipeline.validateAndResolveImage(
                            feedRaw.featureImage, post.title || ''
                        );
                    } catch {}
                }

                // Strategy 2: Scrape og:image from the article page
                if (!resolvedImage && feedRaw?.link) {
                    try {
                        const scraped = await this.scrapeImageFromPage(feedRaw.link);
                        if (scraped) {
                            resolvedImage = await imagePipeline.validateAndResolveImage(
                                scraped, post.title || ''
                            );
                        }
                    } catch {}
                }

                // Strategy 3: First image from post content
                if (!resolvedImage && post.content) {
                    const contentImg = this.extractFirstImage(post.content);
                    if (contentImg) {
                        try {
                            resolvedImage = await imagePipeline.validateAndResolveImage(
                                contentImg, post.title || ''
                            );
                        } catch {}
                    }
                }

                // Strategy 4: Screenshot of the article page
                if (!resolvedImage && feedRaw?.link) {
                    try {
                        resolvedImage = await imagePipeline.captureScreenshot(
                            feedRaw.link, post.title || ''
                        );
                    } catch {}
                }

                if (resolvedImage && resolvedImage !== img) {
                    await Repository.updateOne(
                        PostsEntity,
                        Repository.queryBuilder({ id: post.id }),
                        { featureImage: resolvedImage }
                    );
                    fixed++;
                    logger.log(`Fixed image for "${post.title}" → ${resolvedImage.substring(0, 80)}...`);
                } else {
                    failed++;
                    logger.log(`No real image found for "${post.title}"`);
                }
            } catch (err: any) {
                failed++;
                logger.log(`Error reprocessing "${post.title}": ${err.message}`);
            }
        }

        return {
            result: true,
            message: `Reprocessing complete: ${fixed} fixed, ${failed} no image found, ${skipped} already OK`,
            fixed,
            failed,
            skipped,
        };
    }

    /**
     * Detect if a featureImage URL looks like a placeholder
     */
    private looksLikePlaceholder(url: string, placeholderHashes: Set<string>): boolean {
        // Check if the image hash matches a known placeholder
        const hashMatch = url.match(/\/images\/([a-f0-9]+)\./i);
        if (hashMatch && placeholderHashes.has(hashMatch[1])) return true;

        // Heuristic: placeholder SVGs converted to webp are typically < 10KB
        // and have very uniform colors (gradient backgrounds)
        // We can't check file size from URL alone, so rely on hash detection
        return false;
    }

    /**
     * Scrape og:image / twitter:image / JSON-LD from an article page
     */
    private async scrapeImageFromPage(url: string): Promise<string> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                },
                signal: controller.signal,
                redirect: 'follow',
            });

            clearTimeout(timeoutId);
            if (!response.ok) return '';

            const reader = response.body?.getReader();
            if (!reader) return '';

            let html = '';
            let bytesRead = 0;
            while (bytesRead < 100000) {
                const { done, value } = await reader.read();
                if (done) break;
                html += new TextDecoder().decode(value);
                bytesRead += value.length;
            }
            try { reader.cancel(); } catch {}

            const decode = (s: string) => s
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>').replace(/&quot;/g, '"');

            // og:image
            const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
            if (og?.[1]) {
                const resolved = decode(og[1]);
                return resolved.startsWith('http') ? resolved : new URL(resolved, url).toString();
            }

            // twitter:image
            const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
                    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
            if (tw?.[1]) {
                const resolved = decode(tw[1]);
                return resolved.startsWith('http') ? resolved : new URL(resolved, url).toString();
            }

            // JSON-LD
            const ld = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
            if (ld?.[1]) {
                try {
                    const data = JSON.parse(ld[1]);
                    const img = data.image?.url || data.image?.[0]?.url || data.image?.[0] || data.image || data.thumbnailUrl;
                    if (img && typeof img === 'string') {
                        return img.startsWith('http') ? img : new URL(img, url).toString();
                    }
                } catch {}
            }

            // First large <img>
            const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
            for (const m of imgs) {
                const src = decode(m[1]);
                if (/logo|icon|avatar|badge|emoji|pixel|tracker|ads/i.test(src)) continue;
                if (/\.(svg|gif)$/i.test(src)) continue;
                const w = m[0].match(/width=["']?(\d+)/i);
                if (w && parseInt(w[1]) < 100) continue;
                return src.startsWith('http') ? src : new URL(src, url).toString();
            }
        } catch {}
        return '';
    }

    /**
     * Extract first significant image from HTML content
     */
    private extractFirstImage(content: string): string {
        if (!content) return '';
        const imgs = [...content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
        for (const m of imgs) {
            const src = m[1];
            if (/logo|icon|avatar|badge|emoji|pixel|tracker/i.test(src)) continue;
            if (/\.(svg|gif)$/i.test(src)) continue;
            if (src.startsWith('data:')) continue;
            return src;
        }
        return '';
    }

    @Get("dedup-posts", { exclude: true })
    async dedupPosts() {
        const logger = new Logger("DedupPosts");
        const PostsEntity = Repository.getEntity("PostsEntity");

        // Fetch all posts ordered by createdAt ASC so we keep the oldest
        const all = await Repository.findAll(PostsEntity, {
            limit: 5000,
            sortBy: 'createdAt',
            sort: 'ASC',
            deleted: false,
        });

        const posts = all?.data || [];
        const seen = new Map<string, string>(); // normalizedTitle → id to keep
        const toDelete: string[] = [];

        const normalizeTitle = (t: string) => (t || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        for (const post of posts) {
            const key = normalizeTitle(post.title || '');
            if (!key) continue;
            if (seen.has(key)) {
                toDelete.push(post.id);
            } else {
                seen.set(key, post.id);
            }
        }

        logger.log(`Found ${toDelete.length} duplicate posts to soft-delete`);

        let deleted = 0;
        for (const id of toDelete) {
            try {
                await Repository.updateOne(
                    PostsEntity,
                    Repository.queryBuilder({ id }),
                    { deleted: true }
                );
                deleted++;
            } catch (e: any) {
                logger.log(`Failed to soft-delete post ${id}: ${e.message}`);
            }
        }

        return {
            result: true,
            message: `Dedup complete: ${deleted} duplicate posts soft-deleted`,
            total: posts.length,
            duplicatesFound: toDelete.length,
            deleted,
        };
    }

    @Get("test-full-pipeline", { exclude: true })
    async runTestPipeline() {
        const logger = new Logger("PipelineTest");
        const channelsService: any = Application.resolveProvider(ChannelsService);
        const autoPipelineService: any = Application.resolveProvider(AutoPipelineService);

        logger.log("Starting Full Pipeline Test...");

        // 1. Fetch Feeds
        logger.log("1. Fetching Feeds...");
        await channelsService.processFeeds(true);

        // 2. Classify
        logger.log("2. Running Classify Worker...");
        await autoPipelineService.classifyWorker();

        // 3. Keyword Engine
        logger.log("3. Running Keyword Engine Worker...");
        await autoPipelineService.keywordEngineWorker();

        // 4. Generate
        logger.log("4. Running Generate Worker...");
        await autoPipelineService.generateWorker();

        // 5. Post
        logger.log("5. Running Post Worker...");
        await autoPipelineService.postWorker();

        return {
            result: true,
            message: "Full pipeline test executed",
            steps: ["fetch", "classify", "keywords", "generate", "post"]
        };
    }
}
