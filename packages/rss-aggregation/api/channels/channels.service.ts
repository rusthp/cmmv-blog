import * as xml2js from 'xml2js';

import {
    Service, Cron,
    CronExpression, Logger
} from "@cmmv/core";

import {
    Repository, LessThan
} from "@cmmv/repository";

import {
    ParserService
} from "../parser/parser.service";

import {
    WebScraperService,
    ScrapingConfig,
    ScrapedArticle
} from "../web-scraper/web-scraper.service";

interface RssItem {
    link: string;
    title: string;
    content?: string;
    'media:content'?: { $?: { url?: string }, url?: string };
    enclosure?: { $?: { url?: string }, url?: string };
    pubDate?: string;
    category?: string | string[];
    'content:encoded'?: string;
}

interface RssFeed {
    rss?: {
        channel?: {
            item?: RssItem | RssItem[];
        }
    }
}

interface AtomEntry {
    link?: { $?: { href?: string } } | Array<{ $?: { href?: string, rel?: string } }>;
    title?: string | { _?: string, $?: { type?: string } };
    summary?: string | { _?: string, $?: { type?: string } };
    content?: string | { _?: string, $?: { type?: string } };
    'media:content'?: { $?: { url?: string } };
    published?: string;
    updated?: string;
    category?: Array<{ $?: { term?: string } }> | { $?: { term?: string } };
}

interface AtomFeed {
    feed?: {
        entry?: AtomEntry | AtomEntry[];
    }
}

@Service()
export class ChannelsService {
    private readonly logger = new Logger("ChannelsService");

    constructor(
        private readonly parserService: ParserService,
        private readonly webScraperService: WebScraperService
    ){}

    @Cron(CronExpression.EVERY_HOUR)
    async handleCronChannels() {
        return await this.processFeeds.call(this, false);
    }

    /**
     * Process the feed for a specific channel
     * @param channelId - The ID of the channel to process
     * @returns The result of the processing
     */
    async processFeed(channelId: string) {
        const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

        const channel = await Repository.findOne(FeedChannelsEntity, {
            id: channelId
        });

        if (!channel)
            throw new Error(`Channel not found: ${channelId}`);

        const sourceType = channel.sourceType || 'RSS';
        
        this.logger.log(`Manual processing requested for channel "${channel.name}" with sourceType: "${sourceType}"`);

        if (sourceType === 'WEB_SCRAPING') {
            this.logger.log(`Using WEB_SCRAPING mode for manual processing of channel "${channel.name}"`);
            await this.processWebScrapingChannel(channel);
        } else {
            this.logger.log(`Using RSS mode for manual processing of channel "${channel.name}"`);
            const feedData = await this.getFeed(channel.rss);
            await this.processFeedItem(feedData, channelId);
        }

        // Update lastUpdate timestamp
        await Repository.update(FeedChannelsEntity, { id: channelId }, {
            lastUpdate: new Date()
        });

        return {
            success: true,
            message: `Feed processed successfully using ${sourceType} mode.`
        };
    }

    /**
     * Process the feeds
     * @param force - Force the processing of the feeds
     * @returns The result of the processing
     */
    async processFeeds(force: boolean = false) {
        const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

        try {
            const channels = await Repository.findAll(FeedChannelsEntity, {
                active: true,
                limit: 1000
            }, [], {
                select: ["id", "rss", "name", "intervalUpdate", "lastUpdate"]
            });

            if(!channels || !channels.data || channels.data.length === 0) {
                return {
                    success: true,
                    message: "No channels found to process."
                };
            }

            let itemsAdded = 0;

            const GLOBAL_TIMEOUT = 600000;
            const startTime = Date.now();
            const results = [];

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Global timeout reached for feed processing'));
                }, GLOBAL_TIMEOUT);
            });

            const processPromise = (async () => {
                for (const channel of channels.data) {
                    if (Date.now() - startTime > GLOBAL_TIMEOUT - 10000)
                        break;

                    if(channel.lastUpdate < new Date(Date.now() - channel.intervalUpdate) || force){
                        try {
                            const channelTimeout = 120000;

                            await Promise.race([
                                this.processSingleChannel(channel),
                                new Promise((_, reject) => {
                                    setTimeout(() => {
                                        reject(new Error(`Timeout processing channel ${channel.name}`));
                                    }, channelTimeout);
                                })
                            ]);

                            results.push({ channel: channel.name, success: true });
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            results.push({ channel: channel.name, success: false, error: errorMessage });

                            try {
                                await Repository.update(FeedChannelsEntity, { id: channel.id }, {
                                    lastUpdate: new Date()
                                });
                            } catch (updateError) {}
                        }

                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                return results;
            })();

            const finalResults = await Promise.race([processPromise, timeoutPromise]) as Array<{ channel: string, success: boolean, error?: string }>;
            const successes = finalResults.filter(r => r.success).length;
            const failures = finalResults.filter(r => !r.success).length;

            return {
                success: true,
                message: `Processed ${finalResults.length} channels (${successes} successful, ${failures} failed)`,
                results: finalResults
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            return {
                success: false,
                message: `Feed processing failed: ${errorMessage}`
            };
        }
    }

    /**
     * Process a single channel safely
     * @param channel The channel to process
     */
    private async processSingleChannel(channel: any) {
        const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

        try {
            // Reload channel from database to ensure we have the latest configuration
            const updatedChannel = await Repository.findOne(FeedChannelsEntity, {
                id: channel.id
            });

            if (!updatedChannel) {
                throw new Error(`Channel ${channel.id} not found`);
            }

            const sourceType = updatedChannel.sourceType || 'RSS';
            
            this.logger.log(`Processing channel "${updatedChannel.name}" with sourceType: "${sourceType}" (channel.id: ${updatedChannel.id})`);

            if (sourceType === 'WEB_SCRAPING') {
                this.logger.log(`Using WEB_SCRAPING mode for channel "${updatedChannel.name}"`);
                await this.processWebScrapingChannel(updatedChannel);
            } else {
                this.logger.log(`Using RSS mode for channel "${updatedChannel.name}" (rss: ${updatedChannel.rss})`);
                const feedData = await this.getFeed(updatedChannel.rss);
                await this.processFeedItem(feedData, updatedChannel.id);
            }

            await Repository.update(FeedChannelsEntity, { id: channel.id }, {
                lastUpdate: new Date()
            });

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error in processSingleChannel for ${channel.name}: ${errorMessage}`);

            try {
                await Repository.update(FeedChannelsEntity, { id: channel.id }, {
                    lastUpdate: new Date()
                });
            } catch (updateError) {
                console.error(`Failed to update lastUpdate for ${channel.name} after error`);
            }

            throw error;
        }
    }

    /**
     * Process a channel using web scraping
     * @param channel The channel to process
     */
    private async processWebScrapingChannel(channel: any) {
        try {
            if (!channel.listPageUrl) {
                throw new Error("listPageUrl is required for WEB_SCRAPING source type");
            }

            let scrapingConfig: ScrapingConfig;
            
            if (channel.scrapingConfig) {
                try {
                    scrapingConfig = typeof channel.scrapingConfig === 'string'
                        ? JSON.parse(channel.scrapingConfig)
                        : channel.scrapingConfig;
                } catch (parseError) {
                    this.logger.error(`Failed to parse scrapingConfig for ${channel.name}, using defaults`);
                    scrapingConfig = this.getDefaultScrapingConfig();
                }
            } else {
                scrapingConfig = this.getDefaultScrapingConfig();
            }

            this.logger.log(`Scraping ${channel.name} from ${channel.listPageUrl}`);

            // Scrape articles from listing page
            const articles = await this.webScraperService.scrapeNewsList(
                channel.listPageUrl,
                scrapingConfig
            );

            if (!articles || articles.length === 0) {
                this.logger.log(`No articles found for ${channel.name}`);
                return;
            }

            // Limit number of articles processed
            const MAX_ITEMS = 20;
            const articlesToProcess = articles.slice(0, MAX_ITEMS);

            this.logger.log(`Processing ${articlesToProcess.length} articles for ${channel.name}`);

            let itemsAdded = 0;
            let processedCount = 0;

            // Process each scraped article
            for (const article of articlesToProcess) {
                processedCount++;

                try {
                    const itemPromise = this.processScrapedArticle(article, channel);

                    const result = await Promise.race([
                        itemPromise,
                        new Promise((_, reject) => {
                            setTimeout(() => {
                                reject(new Error(`Timeout processing article: ${article.title}`));
                            }, 30000); // 30 seconds per article
                        })
                    ]) as { success: boolean, added?: boolean };

                    if (result.success && result.added) {
                        itemsAdded++;
                    }
                } catch (itemError) {
                    const errorMessage = itemError instanceof Error ? itemError.message : String(itemError);
                    this.logger.log(`Error processing article ${processedCount}/${articlesToProcess.length}: ${errorMessage}`);
                    continue;
                }

                // Small delay between articles to be respectful
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.logger.log(`Completed processing ${channel.name}: ${itemsAdded} new items added, ${processedCount - itemsAdded} already existed or failed`);

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error processing web scraping channel ${channel.name}: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Get default scraping configuration
     * Can be overridden per channel
     */
    private getDefaultScrapingConfig(): ScrapingConfig {
        return {
            // Default selectors - will use fallback method if these don't work
            articleSelector: '.article-card, .news-item, .post-item, article',
            titleSelector: '.news-item-header, h3 a, h2 a, .title a',
            linkSelector: 'a.news-item, h3 a, h2 a, .title a',
            imageSelector: '.news-item-image img, img, .image img',
            dateSelector: '.news-item-time, .date, .published, time',
            excerptSelector: '.news-item-content, .excerpt, .summary'
        };
    }

    /**
     * Process a scraped article and save it
     * @param article The scraped article
     * @param channel The channel configuration
     */
    private async processScrapedArticle(article: ScrapedArticle, channel: any): Promise<{ success: boolean, added?: boolean }> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");

        try {
            // Check if article already exists
            const existing = await Repository.findOne(FeedRawEntity, {
                link: article.link
            });

            if (existing) {
                return { success: true, added: false };
            }

            // Prepare item data similar to RSS format
            const itemData = {
                title: article.title,
                link: article.link,
                description: article.excerpt || '',
                pubDate: article.date ? article.date.toISOString() : new Date().toISOString(),
                category: '',
                'media:content': article.image ? { $: { url: article.image } } : undefined
            };

            this.logger.log(`Processing scraped article: "${article.title}" with image: ${article.image || 'none'}`);

            // Process the item (reuse existing logic)
            // This will use parser if requestLink === true to get full content
            await this.processFeedItemSafely(itemData, 'WEB_SCRAPING', channel.id);

            return { success: true, added: true };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.log(`Error processing scraped article ${article.title}: ${errorMessage}`);
            return { success: false };
        }
    }

    /**
     * Get the feed from the RSS URL
     * @param rss - The RSS URL
     * @returns The parsed feed JSON
     */
    async getFeed(rss: string): Promise<RssFeed> {
        try {
            const response = await fetch(rss);

            if (!response.ok)
                throw new Error(`HTTP error! Status: ${response.status}`);

            const xml = await response.text();

            const parser = new xml2js.Parser({
                explicitArray: false,
                normalize: true,
                normalizeTags: false,
                mergeAttrs: false,
                attrkey: '$'
            });

            return new Promise<RssFeed>((resolve, reject) => {
                parser.parseString(xml, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result as RssFeed);
                    }
                });
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error fetching or parsing feed from ${rss}: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Process the feed item
     * @param feedData - The feed data
     * @param channelId - The ID of the channel
     */
    async processFeedItem(feedData: any, channelId: string) {
        try {
            let items = [];
            let feedType = '';

            if (feedData.rss && feedData.rss.channel) {
                const feedItems = feedData.rss.channel.item;
                feedType = 'RSS';

                if (!feedItems)
                    return;

                items = Array.isArray(feedItems) ? feedItems : [feedItems];
            }
            else if (feedData.feed && feedData.feed.entry) {
                const feedEntries = feedData.feed.entry;
                feedType = 'Atom';

                if (!feedEntries)
                    return;

                items = Array.isArray(feedEntries) ? feedEntries : [feedEntries];
            } else {
                console.error(`Unsupported feed format for channel: ${channelId}`);
                return;
            }

            const MAX_ITEMS = 10;

            if (items.length > MAX_ITEMS) {
                items = items.slice(0, MAX_ITEMS);
            }

            let itemsAdded = 0;
            let processedCount = 0;

            for (const item of items) {
                processedCount++;

                try {
                    const itemPromise = this.processFeedItemSafely(item, feedType, channelId);

                    const result = await Promise.race([
                        itemPromise,
                        new Promise((_, reject) => {
                            setTimeout(() => {
                                reject(new Error(`Item processing timeout for item ${processedCount} in channel: ${channelId}`));
                            }, 15000);
                        })
                    ]) as { success: boolean, message?: string };

                    if (result && result.success)
                        itemsAdded++;
                } catch (itemError) {}

                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            return itemsAdded;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Process a single feed item safely with proper typing
     * @param item The feed item to process
     * @param feedType The type of feed (RSS or Atom)
     * @param channelId The channel ID
     * @returns Processing result
     */
    private async processFeedItemSafely(item: any, feedType: string, channelId: string): Promise<{ success: boolean, message?: string }> {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");

        try {
            const channel = await Repository.findOne(FeedChannelsEntity, {
                id: channelId
            });

            if (!channel)
                return { success: false, message: "Channel not found" };

            let link = '';
            let title = '';
            let content = '';
            let featureImage = '';
            let pubDate = new Date();
            let category = '';

            if (feedType === 'RSS') {
                link = item.link;
                title = item.title;

                if (item['content:encoded'])
                    content = item['content:encoded'];
                else if (item.content)
                    content = item.content;
                else if (item.description)
                    content = item.description;
                else
                    content = item.content || '';

                // Enhanced image extraction with priority order
                featureImage = this.extractImageFromRSSItem(item, 'RSS');

                if (item.pubDate)
                    pubDate = new Date(item.pubDate);

                if (Array.isArray(item.category))
                    category = item.category.join(', ');
                else if (item.category)
                    category = item.category;
            }
            else if (feedType === 'WEB_SCRAPING') {
                link = item.link;
                title = item.title;
                // Use description/excerpt from scraping as initial content
                // Will be replaced by parser if requestLink is enabled
                content = item.description || item.content || '';

                // Extract image from media:content (same as RSS)
                // For web scraping, images are already in media:content from scraping
                featureImage = this.extractImageFromRSSItem(item, 'RSS');
                
                // Decode HTML entities in image URL (common issue: &amp; instead of &)
                if (featureImage) {
                    featureImage = featureImage
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"');
                }
                
                this.logger.log(`WEB_SCRAPING: Extracted image for "${title}": ${featureImage || 'none'}`);

                if (item.pubDate)
                    pubDate = new Date(item.pubDate);

                if (Array.isArray(item.category))
                    category = item.category.join(', ');
                else if (item.category)
                    category = item.category;
            } else {
                if (Array.isArray(item.link)) {
                    const alternateLink = item.link.find((l: any) => l.$ && l.$.rel === 'alternate');
                    link = alternateLink ? alternateLink.$.href : (item.link[0].$ ? item.link[0].$.href : '');
                } else if (item.link && item.link.$) {
                    link = item.link.$.href;
                }

                if (typeof item.title === 'string')
                    title = item.title;
                else if (item.title) {
                    title = item.title._ || (item.title.$ && item.title.$._) || '';

                    if (title.startsWith('<![CDATA[') && title.endsWith(']]>'))
                        title = title.substring(9, title.length - 3).trim();
                }

                if (item.content)
                    content = typeof item.content === 'string' ? item.content : (item.content._ || '');
                else if (item.summary)
                    content = typeof item.summary === 'string' ? item.summary : (item.summary._ || '');

                if (content.startsWith('<![CDATA[') && content.endsWith(']]>'))
                    content = content.substring(9, content.length - 3).trim();

                // Enhanced image extraction for Atom feeds
                featureImage = this.extractImageFromRSSItem(item, 'Atom');

                if (item.published)
                    pubDate = new Date(item.published);
                else if (item.updated)
                    pubDate = new Date(item.updated);

                if (Array.isArray(item.category) && item.category.length > 0 && item.category[0].$)
                    category = item.category[0].$.term || '';
                else if (item.category && item.category.$)
                    category = item.category.$.term || '';
            }

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (pubDate < sevenDaysAgo)
                return { success: false, message: "Item is older than 7 days" };

            if (!link)
                return { success: false, message: "Empty link" };

            const existingItem = await Repository.findOne(FeedRawEntity, {
                link: link
            });

            if (existingItem)
                return { success: false, message: "Item already exists" };

            // If no image from RSS, try to extract from page meta tags (lightweight)
            if (!featureImage) {
                try {
                    this.logger.log(`No image in RSS for ${link}, attempting meta tag extraction...`);
                    featureImage = await this.extractImageFromPageMeta(link);
                    if (featureImage) {
                        this.logger.log(`Successfully extracted image from meta tags: ${featureImage}`);
                    }
                } catch (error) {
                    // Silent fail - will try full parsing if enabled
                    this.logger.log(`Meta tag extraction failed for ${link}, will try full parsing if enabled`);
                }
            }

            let parsingAttempted = false;
            let parsedResult: any = null;

            if (channel.requestLink === true) {
                // Try parser service first (if parsers are configured)
                try {
                    const parsePromise = this.parserService.parseContent(null, link);

                    parsedResult = await Promise.race([
                        parsePromise,
                        new Promise((_, reject) => {
                            setTimeout(() => {
                                reject(new Error('Parser timeout after 20 seconds'));
                            }, 20000);
                        })
                    ]);

                    parsingAttempted = true;

                    if (parsedResult &&
                        typeof parsedResult === 'object' &&
                        'success' in parsedResult &&
                        parsedResult.success === true &&
                        'data' in parsedResult &&
                        parsedResult.data) {

                        const data = parsedResult.data as any;

                        if (data && typeof data === 'object') {
                            if ('title' in data && data.title) title = data.title;
                            if ('content' in data && data.content) content = data.content;
                            if ('featureImage' in data && data.featureImage) featureImage = data.featureImage;
                        }
                    }
                } catch (parseError) {
                    // Parser failed or not configured, try direct extraction
                    this.logger.log(`Parser service failed for ${link}, trying direct content extraction...`);
                }

                // If parser didn't provide content, try direct extraction (fallback)
                // Especially useful for Dust2 and similar sites
                if (!content || content.length < 100) {
                    try {
                        const directContent = await this.extractContentFromDust2Page(link);
                        if (directContent && directContent.length > 50) {
                            content = directContent;
                            this.logger.log(`Successfully extracted content directly from ${link} (${content.length} chars)`);
                        }
                    } catch (extractError) {
                        const errorMessage = extractError instanceof Error ? extractError.message : String(extractError);
                        this.logger.log(`Direct content extraction failed for ${link}: ${errorMessage}`);
                    }
                }
            }

            const newItem = {
                title,
                content: content,
                featureImage,
                link,
                pubDate,
                category,
                channel: channelId,
                feedType,
                hasParser: parsingAttempted && parsedResult && parsedResult.success ? true : false,
                parsedBy: parsingAttempted && parsedResult && parsedResult.success && parsedResult.data?.parserId ? parsedResult.data.parserId : null,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await Repository.insert(FeedRawEntity, newItem);
            return { success: true };
        } catch (error) {
            console.error(`Error processing feed item: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, message: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Extract image URL from RSS item with multiple fallback strategies
     * Supports media:content arrays, enclosures, and other image sources
     * 
     * @param item - RSS or Atom feed item
     * @param feedType - 'RSS' or 'Atom'
     * @returns Image URL or empty string
     */
    private extractImageFromRSSItem(item: any, feedType: string): string {
        // Priority 1: Media RSS content (supports arrays)
        if (item['media:content']) {
            const mediaContent = item['media:content'];
            
            // Handle array of media content (choose best quality/largest)
            if (Array.isArray(mediaContent)) {
                const imageMedia = mediaContent
                    .filter((m: any) => {
                        const type = m.$?.type || m.type || '';
                        return type.startsWith('image/');
                    })
                    .sort((a: any, b: any) => {
                        // Sort by width (largest first), then by quality
                        const aWidth = parseInt(a.$?.width || a.width || '0');
                        const bWidth = parseInt(b.$?.width || b.width || '0');
                        if (bWidth !== aWidth) return bWidth - aWidth;
                        
                        const aQuality = parseInt(a.$?.quality || a.quality || '0');
                        const bQuality = parseInt(b.$?.quality || b.quality || '0');
                        return bQuality - aQuality;
                    });
                
                if (imageMedia.length > 0) {
                    const bestImage = imageMedia[0];
                    const imageUrl = bestImage.$?.url || bestImage.url || '';
                    // Decode HTML entities in URL
                    return imageUrl
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"');
                }
            }
            
            // Handle single media content object
            if (mediaContent.$?.url) {
                const type = mediaContent.$?.type || '';
                if (type.startsWith('image/') || !type) {
                    const imageUrl = mediaContent.$.url;
                    // Decode HTML entities in URL
                    return imageUrl
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"');
                }
            }
            if (mediaContent.url) {
                const imageUrl = mediaContent.url;
                // Decode HTML entities in URL
                return imageUrl
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"');
            }
        }
        
        // Priority 2: Enclosure (RSS 2.0) - only for images
        if (item.enclosure) {
            const enclosure = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
            const type = enclosure.$?.type || enclosure.type || '';
            if (type.startsWith('image/')) {
                return enclosure.$?.url || enclosure.url || '';
            }
        }
        
        // Priority 3: iTunes image (podcast feeds)
        if (item['itunes:image']) {
            const itunesImage = Array.isArray(item['itunes:image']) 
                ? item['itunes:image'][0] 
                : item['itunes:image'];
            return itunesImage?.$?.href || itunesImage?.href || '';
        }
        
        // Priority 4: Image tag in item
        if (item.image) {
            const image = Array.isArray(item.image) ? item.image[0] : item.image;
            return image?.url || image?.$?.url || '';
        }
        
        // Priority 5: Thumbnail (some feeds use this)
        if (item.thumbnail) {
            const thumbnail = Array.isArray(item.thumbnail) ? item.thumbnail[0] : item.thumbnail;
            return thumbnail?.$?.url || thumbnail?.url || '';
        }
        
        return '';
    }

    /**
     * Extract image from article page meta tags (lightweight scraping)
     * Only fetches HTML and extracts meta tags, doesn't parse full content
     * 
     * @param link - Article URL
     * @returns Image URL or empty string
     */
    private async extractImageFromPageMeta(link: string): Promise<string> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for meta-only fetch

            const response = await fetch(link, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) return '';

            // Only read first 50KB for meta tags (faster)
            const reader = response.body?.getReader();
            if (!reader) return '';

            let html = '';
            let bytesRead = 0;
            const maxBytes = 50000; // 50KB should contain all meta tags

            while (bytesRead < maxBytes) {
                const { done, value } = await reader.read();
                if (done) break;

                html += new TextDecoder().decode(value);
                bytesRead += value.length;

                // If we found </head>, we have enough
                if (html.includes('</head>')) break;
            }

            reader.releaseLock();

            // Decode HTML entities in any extracted URLs
            const decodeHtmlEntities = (url: string): string => {
                return url
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
            };

            // Try Open Graph image first (most common)
            let image = this.extractMetaImage(html, 'property="og:image"');
            if (image) {
                image = decodeHtmlEntities(image);
                return this.resolveUrl(image, link);
            }

            // Try Twitter Card image
            image = this.extractMetaImage(html, 'name="twitter:image"');
            if (image) {
                image = decodeHtmlEntities(image);
                return this.resolveUrl(image, link);
            }

            // Try Article image
            image = this.extractMetaImage(html, 'property="article:image"');
            if (image) {
                image = decodeHtmlEntities(image);
                return this.resolveUrl(image, link);
            }

            // Try generic meta image
            image = this.extractMetaImage(html, 'name="image"');
            if (image) {
                image = decodeHtmlEntities(image);
                return this.resolveUrl(image, link);
            }

        } catch (error) {
            // Silent fail - this is a fallback, not critical
        }

        return '';
    }

    /**
     * Extract image URL from meta tag
     * 
     * @param html - HTML content
     * @param pattern - Meta tag pattern (e.g., 'property="og:image"')
     * @returns Image URL or empty string
     */
    private extractMetaImage(html: string, pattern: string): string {
        // Flexible regex to match various meta tag formats
        const regex = new RegExp(
            `<meta[^>]+${pattern}[^>]+content=["']([^"']+)["']`,
            'i'
        );
        const match = html.match(regex);
        return match ? match[1].trim() : '';
    }

    /**
     * Extract full article content directly from Dust2 article page
     * Fallback method when parser is not configured
     * 
     * @param link - Article URL
     * @returns Article content or empty string
     */
    private async extractContentFromDust2Page(link: string): Promise<string> {
        try {
            // Only process Dust2 URLs
            if (!link.includes('dust2.com.br/noticias/')) {
                return '';
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(link, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            
            // Extract main article content
            // Dust2 uses specific structure for article content
            // Look for article content between specific markers or in specific containers
            
            // Strategy 1: Look for main content area (common patterns)
            let content = '';
            
            // Try to find article body - common patterns in Dust2
            const articlePatterns = [
                /<article[^>]*>([\s\S]*?)<\/article>/i,
                /<div[^>]*class=["'][^"']*article-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
                // Look for content after the main heading (h1 or h2)
                /<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p[^>]*>(.*?)(?:<div[^>]*class=["'][^"']*(?:footer|comments|sidebar)[^"']*["']|<\/body>)/is,
            ];

            for (const pattern of articlePatterns) {
                const match = html.match(pattern);
                if (match && match[1] && match[1].length > 200) {
                    content = match[1];
                    break;
                }
            }

            // Strategy 2: Extract all paragraphs between title and "Leia também" or footer
            if (!content || content.length < 200) {
                const paragraphsMatch = html.match(/<h1[^>]*>.*?<\/h1>([\s\S]*?)(?:<h2[^>]*>Leia também|<\/div>\s*<div[^>]*class=["'][^"']*footer|<footer)/is);
                if (paragraphsMatch && paragraphsMatch[1]) {
                    content = paragraphsMatch[1];
                }
            }

            // Clean up HTML and extract text
            if (content) {
                // Remove scripts and styles
                content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
                content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
                
                // Remove ads and unwanted elements
                content = content.replace(/<div[^>]*class=["'][^"']*ad[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
                
                // Convert common HTML tags to readable format
                content = content
                    .replace(/<p[^>]*>/gi, '\n\n')
                    .replace(/<\/p>/gi, '')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<h[1-6][^>]*>/gi, '\n\n**')
                    .replace(/<\/h[1-6]>/gi, '**\n\n')
                    .replace(/<strong[^>]*>/gi, '**')
                    .replace(/<\/strong>/gi, '**')
                    .replace(/<em[^>]*>/gi, '*')
                    .replace(/<\/em>/gi, '*')
                    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
                    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
                    .trim();

                // Only return if we got meaningful content
                if (content.length > 100) {
                    return content;
                }
            }

            return '';
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error extracting content from Dust2 page ${link}: ${errorMessage}`);
            return '';
        }
    }

    /**
     * Resolve relative URLs to absolute URLs
     * 
     * @param url - Relative or absolute URL
     * @param baseUrl - Base URL for resolution
     * @returns Absolute URL
     */
    private resolveUrl(url: string, baseUrl: string): string {
        try {
            if (url.startsWith('http://') || url.startsWith('https://'))
                return url;

            const base = new URL(baseUrl);

            if (url.startsWith('//'))
                return `${base.protocol}${url}`;

            if (url.startsWith('/'))
                return `${base.protocol}//${base.host}${url}`;

            // Relative URL
            let basePath = base.pathname;
            if (!basePath.endsWith('/'))
                basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);

            return `${base.protocol}//${base.host}${basePath}${url}`;
        } catch (e) {
            return url;
        }
    }
}
