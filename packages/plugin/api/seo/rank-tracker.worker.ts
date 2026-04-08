import { Logger, Config } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { SearchConsoleService, SearchConsoleRow } from "./search-console.service";

/**
 * RankTrackerWorker — runs daily (24h cycle).
 *
 * 1. Fetches search analytics from Google Search Console (last 30 days)
 * 2. Matches rows to posts by slug in the URL
 * 3. Saves metrics to PostSeoMetricsEntity
 * 4. Identifies "opportunity posts" (high impressions, low position)
 *    and marks them with needsSeoUpdate = true
 */
export class RankTrackerWorker {
    private static readonly logger = new Logger("RankTrackerWorker");
    private static isRunning = false;

    private searchConsoleService = new SearchConsoleService();

    async run(): Promise<void> {
        if (RankTrackerWorker.isRunning) {
            RankTrackerWorker.logger.log("[seo] RankTracker already running, skipping");
            return;
        }

        RankTrackerWorker.isRunning = true;

        try {
            const siteUrl = Config.get<string>("blog.googleSearchConsoleSiteUrl", "");

            if (!siteUrl) {
                RankTrackerWorker.logger.log("[seo] Search Console not configured, skipping rank tracking");
                return;
            }

            RankTrackerWorker.logger.log("[seo] RankTracker: Starting daily cycle");

            // 1. Fetch search analytics
            let rows: SearchConsoleRow[];

            try {
                rows = await this.searchConsoleService.fetchSearchAnalytics(30);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                RankTrackerWorker.logger.error(`[seo] RankTracker: Failed to fetch Search Console data: ${msg}`);
                return;
            }

            if (rows.length === 0) {
                RankTrackerWorker.logger.log("[seo] RankTracker: No data from Search Console");
                return;
            }

            const PostSeoMetricsEntity = Repository.getEntity("PostSeoMetricsEntity");
            const PostsEntity = Repository.getEntity("PostsEntity");
            const collectedAt = new Date();

            // 2. Load all posts for slug matching
            const allPosts = await Repository.findAll(PostsEntity, {
                limit: 10000,
                sortBy: "createdAt",
                sort: "DESC",
            });

            if (!allPosts || !allPosts.data || allPosts.data.length === 0) {
                RankTrackerWorker.logger.log("[seo] RankTracker: No posts found in database");
                return;
            }

            // Build slug → postId map
            const slugToPost = new Map<string, { id: string; slug: string }>();
            for (const post of allPosts.data) {
                if (post.slug) {
                    slugToPost.set(post.slug, { id: post.id, slug: post.slug });
                }
            }

            let savedCount = 0;
            let opportunityCount = 0;
            const opportunityPostIds = new Set<string>();

            // 3. Process rows and save metrics
            for (const row of rows) {
                // Extract slug from URL — match last path segment
                const urlSlug = this.extractSlugFromUrl(row.url);

                if (!urlSlug) continue;

                const matchedPost = slugToPost.get(urlSlug);

                if (!matchedPost) continue;

                try {
                    await Repository.insert(PostSeoMetricsEntity, {
                        postId: matchedPost.id,
                        url: row.url,
                        keyword: row.keyword,
                        impressions: row.impressions,
                        clicks: row.clicks,
                        ctr: row.ctr,
                        position: row.position,
                        collectedAt,
                    });
                    savedCount++;
                } catch (err) {
                    // Likely duplicate — skip silently
                    const msg = err instanceof Error ? err.message : String(err);
                    RankTrackerWorker.logger.log(`[seo] RankTracker: Insert warning for ${urlSlug}: ${msg}`);
                }

                // 4. Identify opportunities: high impressions, position 8-25 (page 1-3 borderline)
                if (row.impressions > 100 && row.position > 8 && row.position < 25) {
                    opportunityPostIds.add(matchedPost.id);
                }
            }

            // 5. Mark opportunity posts
            for (const postId of opportunityPostIds) {
                try {
                    await Repository.updateOne(
                        PostsEntity,
                        Repository.queryBuilder({ id: postId }),
                        { needsSeoUpdate: true }
                    );
                    opportunityCount++;
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    RankTrackerWorker.logger.error(`[seo] RankTracker: Failed to mark post ${postId}: ${msg}`);
                }
            }

            RankTrackerWorker.logger.log(
                `[seo] RankTracker: Cycle complete. Saved ${savedCount} metrics, marked ${opportunityCount} opportunity posts.`
            );
        } catch (error) {
            RankTrackerWorker.logger.error(
                `[seo] RankTracker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            RankTrackerWorker.isRunning = false;
        }
    }

    /**
     * Extract the slug from a URL path.
     * E.g. "https://proplaynews.com.br/cs2-update-april-2026" → "cs2-update-april-2026"
     *       "https://proplaynews.com.br/esports/cs2-update" → "cs2-update"
     */
    private extractSlugFromUrl(url: string): string {
        try {
            const parsed = new URL(url);
            const segments = parsed.pathname.split("/").filter(Boolean);
            return segments[segments.length - 1] || "";
        } catch {
            // Fallback: extract last path segment manually
            const lastSlash = url.lastIndexOf("/");
            if (lastSlash >= 0) {
                const slug = url.substring(lastSlash + 1).split("?")[0].split("#")[0];
                return slug;
            }
            return "";
        }
    }
}
