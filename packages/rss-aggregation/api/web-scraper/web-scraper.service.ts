import {
    Service, Logger
} from "@cmmv/core";

export interface ScrapingConfig {
    articleSelector: string;
    titleSelector: string;
    linkSelector: string;
    imageSelector: string;
    dateSelector?: string;
    excerptSelector?: string;
}

export interface ScrapedArticle {
    title: string;
    link: string;
    image?: string;
    date?: Date;
    excerpt?: string;
}

@Service()
export class WebScraperService {
    private readonly logger = new Logger("WebScraperService");

    /**
     * Scrape news articles from a listing page
     * @param url - The URL of the listing page
     * @param config - Scraping configuration with selectors
     * @returns Array of scraped articles
     */
    async scrapeNewsList(url: string, config: ScrapingConfig): Promise<ScrapedArticle[]> {
        try {
            this.logger.log(`Scraping news list from: ${url}`);

            // Fetch HTML with timeout
            const html = await this.fetchHTML(url);

            if (!html) {
                throw new Error("Failed to fetch HTML content");
            }

            this.logger.log(`Fetched HTML (${html.length} characters)`);

            // Extract articles using regex (lightweight, no dependencies)
            const articles = this.extractArticles(html, url, config);

            this.logger.log(`Extracted ${articles.length} articles from ${url}`);

            return articles;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error scraping ${url}: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Fetch HTML content from URL
     * @param url - URL to fetch
     * @returns HTML content
     */
    private async fetchHTML(url: string): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();

            // Limit HTML size to prevent memory issues (first 500KB)
            const maxSize = 500 * 1024;
            return html.length > maxSize ? html.substring(0, maxSize) : html;
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to fetch HTML: ${errorMessage}`);
        }
    }

    /**
     * Extract articles from HTML using regex patterns
     * @param html - HTML content
     * @param baseUrl - Base URL for resolving relative links
     * @param config - Scraping configuration
     * @returns Array of scraped articles
     */
    private extractArticles(html: string, baseUrl: string, config: ScrapingConfig): ScrapedArticle[] {
        const articles: ScrapedArticle[] = [];

        try {
            this.logger.log(`Extracting articles with selector: ${config.articleSelector}`);
            
            // Find all article containers
            const articlePattern = this.buildSelectorPattern(config.articleSelector);
            const articleMatches = this.matchAll(html, articlePattern);
            
            this.logger.log(`Found ${articleMatches.length} potential article containers`);
            
            // Fallback: If no articles found with selectors, try to extract from links
            if (articleMatches.length === 0) {
                this.logger.log(`No articles found with selectors. Trying fallback method: extracting from links...`);
                return this.extractArticlesFromLinks(html, baseUrl, config);
            }

            for (const articleMatch of articleMatches) {
                const articleHtml = articleMatch[0];

                try {
                    // Extract title
                    const title = this.extractField(articleHtml, config.titleSelector);

                    // Extract link
                    const link = this.extractLink(articleHtml, config.linkSelector, baseUrl);

                    // Extract image
                    const image = this.extractImage(articleHtml, config.imageSelector, baseUrl);

                    // Extract date (optional)
                    let date: Date | undefined;
                    if (config.dateSelector) {
                        const dateStr = this.extractField(articleHtml, config.dateSelector);
                        date = this.parseDate(dateStr);
                    }

                    // Extract excerpt (optional)
                    const excerpt = config.excerptSelector
                        ? this.extractField(articleHtml, config.excerptSelector)
                        : undefined;

                    if (title && link) {
                        articles.push({
                            title: this.cleanText(title),
                            link: this.resolveUrl(link, baseUrl),
                            image: image ? this.resolveUrl(image, baseUrl) : undefined,
                            date,
                            excerpt: excerpt ? this.cleanText(excerpt) : undefined
                        });
                    }
                } catch (itemError) {
                    this.logger.log(`Error extracting article item: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
                    continue;
                }
            }

            return articles;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error extracting articles: ${errorMessage}`);
            return [];
        }
    }

    /**
     * Build regex pattern from CSS selector
     * Supports: tag, .class, #id, [attribute="value"]
     */
    private buildSelectorPattern(selector: string): RegExp {
        // Simple selector to regex conversion
        // For complex cases, we'll use common patterns

        // Class selector: .class-name
        if (selector.startsWith('.')) {
            const className = selector.substring(1).replace(/-/g, '[-_]?');
            return new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>.*?</[^>]+>`, 'gis');
        }

        // ID selector: #id-name
        if (selector.startsWith('#')) {
            const idName = selector.substring(1).replace(/-/g, '[-_]?');
            return new RegExp(`<[^>]*id=["'][^"']*${idName}[^"']*["'][^>]*>.*?</[^>]+>`, 'gis');
        }

        // Tag selector: tag-name
        if (/^[a-z][a-z0-9-]*$/i.test(selector)) {
            return new RegExp(`<${selector}[^>]*>.*?</${selector}>`, 'gis');
        }

        // Default: try to find the selector as-is in HTML
        return new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gis');
    }

    /**
     * Extract field value from HTML using selector
     */
    private extractField(html: string, selector: string): string {
        // Try multiple extraction methods

        // Method 1: Extract from tag content
        if (selector.includes(' ')) {
            // Complex selector - extract last part
            const parts = selector.trim().split(/\s+/);
            const lastPart = parts[parts.length - 1];

            if (lastPart.includes('.')) {
                const className = lastPart.substring(1);
                const pattern = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)</[^>]+>`, 'gis');
                const match = pattern.exec(html);
                if (match && match[1]) {
                    return this.stripHtmlTags(match[1]);
                }
            }

            if (lastPart.match(/^[a-z]+$/i)) {
                const tag = lastPart.toLowerCase();
                const pattern = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gis');
                const match = pattern.exec(html);
                if (match && match[1]) {
                    return this.stripHtmlTags(match[1]);
                }
            }
        }

        // Method 2: Direct tag/class extraction
        if (selector.startsWith('.')) {
            const className = selector.substring(1).replace(/-/g, '[-_]?');
            const pattern = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)</[^>]+>`, 'gis');
            const match = pattern.exec(html);
            if (match && match[1]) {
                return this.stripHtmlTags(match[1]);
            }
        }

        // Method 3: Tag extraction
        if (selector.match(/^[a-z]+$/i)) {
            const tag = selector.toLowerCase();
            const pattern = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gis');
            const match = pattern.exec(html);
            if (match && match[1]) {
                return this.stripHtmlTags(match[1]);
            }
        }

        return '';
    }

    /**
     * Extract link URL from HTML
     */
    private extractLink(html: string, selector: string, baseUrl: string): string {
        // Try to find <a> tag within the selector context
        let searchHtml = html;

        if (selector.includes('a')) {
            // Direct link extraction
            const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/i;
            const match = linkPattern.exec(searchHtml);
            if (match && match[1]) {
                return match[1];
            }
        }

        // Try to find link in the selector area
        const selectorPattern = this.buildSelectorPattern(selector);
        const selectorMatch = selectorPattern.exec(html);
        if (selectorMatch) {
            const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/i;
            const match = linkPattern.exec(selectorMatch[0]);
            if (match && match[1]) {
                return match[1];
            }
        }

        return '';
    }

    /**
     * Extract image URL from HTML
     */
    private extractImage(html: string, selector: string, baseUrl: string): string {
        // Try to find <img> tag
        let searchHtml = html;

        if (selector.includes('img')) {
            const imgPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/i;
            const match = imgPattern.exec(searchHtml);
            if (match && match[1]) {
                return match[1];
            }
        }

        // Try to find image in the selector area
        const selectorPattern = this.buildSelectorPattern(selector);
        const selectorMatch = selectorPattern.exec(html);
        if (selectorMatch) {
            const imgPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/i;
            const match = imgPattern.exec(selectorMatch[0]);
            if (match && match[1]) {
                return match[1];
            }
        }

        return '';
    }

    /**
     * Parse date string to Date object
     * Supports Portuguese and English formats
     */
    private parseDate(dateStr: string): Date | undefined {
        if (!dateStr || !dateStr.trim()) {
            return undefined;
        }

        try {
            // Try ISO format
            const isoDate = new Date(dateStr);
            if (!isNaN(isoDate.getTime())) {
                return isoDate;
            }

            // Try common formats
            // "31 Out 2025" or "31 Outubro 2025"
            const ptMonths: { [key: string]: string } = {
                'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
                'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
                'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
                'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
                'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
                'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
            };

            const dateMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
            if (dateMatch) {
                const day = dateMatch[1].padStart(2, '0');
                const monthKey = dateMatch[2].toLowerCase().substring(0, 3);
                const month = ptMonths[monthKey] || '01';
                const year = dateMatch[3];
                const isoStr = `${year}-${month}-${day}T00:00:00`;
                return new Date(isoStr);
            }

            return undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Resolve relative URL to absolute
     */
    private resolveUrl(url: string, baseUrl: string): string {
        if (!url) return '';

        // Already absolute
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        try {
            const base = new URL(baseUrl);
            
            // Protocol-relative
            if (url.startsWith('//')) {
                return `${base.protocol}${url}`;
            }

            // Absolute path
            if (url.startsWith('/')) {
                return `${base.protocol}//${base.host}${url}`;
            }

            // Relative path
            return new URL(url, baseUrl).toString();
        } catch {
            return url;
        }
    }

    /**
     * Strip HTML tags from text
     */
    private stripHtmlTags(html: string): string {
        return html
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Clean and normalize text
     */
    private cleanText(text: string): string {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();
    }

    /**
     * Fallback method: Extract articles directly from links
     * Used when article selectors don't match the HTML structure
     * Optimized for Dust2 structure with .news-item class
     */
    private extractArticlesFromLinks(html: string, baseUrl: string, config: ScrapingConfig): ScrapedArticle[] {
        const articles: ScrapedArticle[] = [];
        const seenLinks = new Set<string>();

        try {
            // Try to find .news-item containers first (Dust2 structure)
            // Match complete <a> tags with news-item class - including nested content
            // Strategy: Find opening <a> tags with news-item, then find matching closing </a>
            const newsItemOpenTags: Array<{start: number, tag: string, href: string}> = [];
            const newsItemMatches: Array<RegExpExecArray> = [];
            
            // Find all opening <a> tags with news-item class
            const openTagPattern = /<a\s+[^>]*class=["'][^"']*news-item[^"']*["'][^>]*>/gi;
            let openMatch;
            while ((openMatch = openTagPattern.exec(html)) !== null) {
                const tagHtml = openMatch[0];
                const hrefMatch = tagHtml.match(/href=["']([^"']*\/(?:noticias|news)\/[^"']+)["']/i);
                if (hrefMatch && hrefMatch[1]) {
                    newsItemOpenTags.push({
                        start: openMatch.index,
                        tag: tagHtml,
                        href: hrefMatch[1]
                    });
                }
            }
            
            this.logger.log(`Found ${newsItemOpenTags.length} opening .news-item tags`);
            
            // For each opening tag, find the matching closing </a>
            for (const openTag of newsItemOpenTags) {
                let depth = 0;
                let foundClosing = false;
                
                // Start searching after the opening tag
                for (let i = openTag.start + openTag.tag.length; i < html.length; i++) {
                    if (html.substring(i, i + 2) === '</') {
                        // Check if it's closing an <a> tag
                        const closeTagMatch = html.substring(i).match(/^<\/a>/i);
                        if (closeTagMatch) {
                            if (depth === 0) {
                                // Found matching closing tag
                                const itemHtml = html.substring(openTag.start + openTag.tag.length, i);
                                // Create a RegExpExecArray-like object
                                const mockMatch: any = [
                                    html.substring(openTag.start, i + 4), // Full match
                                    openTag.href, // href (group 1)
                                    itemHtml, // content (group 2)
                                ];
                                mockMatch.index = openTag.start;
                                newsItemMatches.push(mockMatch);
                                foundClosing = true;
                                break;
                            } else {
                                depth--; // Closing a nested tag
                            }
                            i += 3; // Skip </a>
                        }
                    } else if (html.substring(i, i + 1) === '<' && html.substring(i, i + 2) !== '</') {
                        // Check if it's opening an <a> tag (nested)
                        const nestedTagMatch = html.substring(i).match(/^<a\s+/i);
                        if (nestedTagMatch) {
                            depth++; // Found nested <a>
                        }
                    }
                }
            }

            if (newsItemMatches.length > 0) {
                this.logger.log(`Fallback: Found ${newsItemMatches.length} .news-item containers`);
                
                for (const match of newsItemMatches) {
                    if (!match || match.length < 3) continue;

                    // Our manual parsing creates: [fullMatch, href, content]
                    const href = match[1] || '';
                    const itemHtml = match[2] || '';
                    
                    if (!href || (!href.includes('/noticias/') && !href.includes('/news/'))) {
                        continue; // Skip if no valid href
                    }

                    // Skip if we've already seen this link
                    if (seenLinks.has(href)) continue;

                    // Extract title from news-item-header
                    let title = '';
                    const titlePattern = /<div[^>]*class=["'][^"']*news-item-header[^"']*["'][^>]*>(.*?)<\/div>/gis;
                    const titleMatch = titlePattern.exec(itemHtml);
                    if (titleMatch && titleMatch[1]) {
                        title = this.stripHtmlTags(titleMatch[1]).trim();
                    }

                    // If no title found in header, try to extract from link content
                    if (!title) {
                        title = this.stripHtmlTags(itemHtml).trim();
                        // Take first meaningful line (usually the title)
                        const lines = title.split('\n').map(l => l.trim()).filter(l => l.length > 10);
                        title = lines[0] || '';
                    }

                    // Skip if title is too short or empty
                    if (!title || title.length < 5) continue;

                    // Extract image from news-item-image
                    let image = '';
                    const imagePattern = /<div[^>]*class=["'][^"']*news-item-image[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/gis;
                    const imageMatch = imagePattern.exec(itemHtml);
                    if (imageMatch && imageMatch[1]) {
                        image = this.resolveUrl(imageMatch[1], baseUrl);
                        this.logger.log(`Extracted image from .news-item-image: ${image}`);
                    }

                    // Extract date from news-item-time
                    let date: Date | undefined;
                    const datePattern = /<div[^>]*class=["'][^"']*news-item-time[^"']*["'][^>]*>.*?(\d{1,2})\s+(?:horas|hours?|dias?|days?)\s+atr[áa]s/gi;
                    const dateMatch = datePattern.exec(itemHtml);
                    if (dateMatch) {
                        const hoursAgo = parseInt(dateMatch[1]) || 0;
                        const isDays = itemHtml.toLowerCase().includes('dia');
                        date = new Date();
                        if (isDays) {
                            date.setDate(date.getDate() - hoursAgo);
                        } else {
                            date.setHours(date.getHours() - hoursAgo);
                        }
                    }

                    // Extract excerpt from news-item-content (if available)
                    let excerpt: string | undefined;
                    const contentPattern = /<div[^>]*class=["'][^"']*news-item-content[^"']*["'][^>]*>(.*?)<\/div>/gis;
                    const contentMatch = contentPattern.exec(itemHtml);
                    if (contentMatch && contentMatch[1]) {
                        const content = this.stripHtmlTags(contentMatch[1]).trim();
                        // Remove title and footer from content
                        const contentWithoutTitle = content.replace(title, '').trim();
                        const contentWithoutFooter = contentWithoutTitle.replace(/\d+\s+(?:horas|hours?|dias?|days?)\s+atr[áa]s.*$/i, '').trim();
                        if (contentWithoutFooter.length > 20 && contentWithoutFooter.length < 300) {
                            excerpt = contentWithoutFooter;
                        }
                    }

                    const fullLink = this.resolveUrl(href, baseUrl);

                    articles.push({
                        title: title,
                        link: fullLink,
                        image: image || undefined,
                        date: date,
                        excerpt: excerpt
                    });

                    seenLinks.add(href);
                }
            }

            // If no .news-item found, fallback to generic link extraction
            if (articles.length === 0) {
                this.logger.log(`Fallback: No .news-item found, trying generic link extraction...`);
                const articleLinkPattern = /<a[^>]*href=["']([^"']*\/(?:noticias|news)\/[^"']+)["'][^>]*>(.*?)<\/a>/gis;
                const matches = this.matchAll(html, articleLinkPattern);

                this.logger.log(`Fallback: Found ${matches.length} potential article links`);

                for (const match of matches) {
                    if (match.length < 3) continue;

                    const href = match[1];
                    const linkContent = match[2];

                    // Skip if we've already seen this link
                    if (seenLinks.has(href)) continue;

                    // Extract title from link content
                    const title = this.stripHtmlTags(linkContent).trim();
                    
                    // Skip if title is too short or empty
                    if (!title || title.length < 5) continue;

                    // Resolve URL
                    const fullLink = this.resolveUrl(href, baseUrl);

                    // Try to find image near this link (look in larger context)
                    const linkIndex = match.index || 0;
                    const contextStart = Math.max(0, linkIndex - 1000);
                    const contextEnd = Math.min(html.length, linkIndex + match[0].length + 1000);
                    const context = html.substring(contextStart, contextEnd);

                    let image = '';
                    // Look for images in img tags (prefer gallerypicture URLs for Dust2)
                    const imgPattern = /<img[^>]*src=["']([^"']+(?:gallerypicture|img-cdn)[^"']+)["'][^>]*>/gi;
                    const imgMatches = this.matchAll(context, imgPattern);
                    if (imgMatches.length > 0) {
                        // Use the first image found
                        image = this.resolveUrl(imgMatches[0][1], baseUrl);
                    }

                    // Try to find date
                    let date: Date | undefined;
                    const datePattern = /(\d{1,2})\s+(?:horas|hours?|dias?|days?)\s+atr[áa]s/i;
                    const dateMatch = datePattern.exec(context);
                    if (dateMatch) {
                        const hoursAgo = parseInt(dateMatch[1]) || 0;
                        const isDays = context.toLowerCase().includes('dia');
                        date = new Date();
                        if (isDays) {
                            date.setDate(date.getDate() - hoursAgo);
                        } else {
                            date.setHours(date.getHours() - hoursAgo);
                        }
                    }

                    articles.push({
                        title: title,
                        link: fullLink,
                        image: image || undefined,
                        date: date,
                        excerpt: undefined
                    });

                    seenLinks.add(href);
                }
            }

            this.logger.log(`Fallback: Extracted ${articles.length} unique articles`);
            return articles;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error in extractArticlesFromLinks: ${errorMessage}`);
            return [];
        }
    }

    /**
     * Match all occurrences of pattern (polyfill for older JS)
     */
    private matchAll(str: string, regex: RegExp): RegExpExecArray[] {
        const matches: RegExpExecArray[] = [];
        let match: RegExpExecArray | null;

        // Reset regex lastIndex
        regex.lastIndex = 0;

        while ((match = regex.exec(str)) !== null) {
            matches.push(match);
            // Prevent infinite loop on zero-length matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        }

        return matches;
    }
}

