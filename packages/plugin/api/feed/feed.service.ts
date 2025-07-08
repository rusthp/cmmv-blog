import {
    Service, Config
} from "@cmmv/core";

import {
    PostsPublicService
} from "../posts/posts.service";

@Service('blog_feed')
export class FeedService {
    constructor(
        private readonly postsService: PostsPublicService
    ){}

    /**
     * Get the RSS feed for the blog
     * @param queries - The queries to get the feed for
     * @param req - The request object
     * @returns The RSS feed
     */
    async getFeed(queries: any, req: any) {
        const limit = Config.get<number>("blog.rssFeedItems", 10);
        const url = Config.get<string>("blog.url", process.env.API_URL);
        const title = Config.get<string>("blog.title", "CMMV Blog");
        const description = Config.get<string>("blog.description", "CMMV Blog");
        const language = Config.get<string>("blog.language", "en");
        const copyright = Config.get<string>("blog.copyright", "CMMV");

        const posts = await this.postsService.getAllPosts({
            limit: limit,
            sortBy: "publishedAt",
            sort: "desc",
            status: "published"
        }, req);

        let feed = [`<?xml version="1.0" encoding="UTF-8"?>`];
        feed.push(`<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">`);
        feed.push(`<channel>`);
        feed.push(`<title>${this.escapeXml(title)}</title>`);
        feed.push(`<link>${this.escapeXml(url)}</link>`);
        feed.push(`<description>${this.escapeXml(description)}</description>`);
        feed.push(`<language>${language.replace('_', '-')}</language>`);

        if(copyright)
            feed.push(`<copyright>© Copyright ${this.escapeXml(copyright)}</copyright>`);

        feed.push(`<atom:link href="${this.escapeXml(url)}/feed" rel="self" type="application/rss+xml"/>`)

        for (const post of posts.posts) {
            const postUrl = `${url}/post/${post.slug}`;
            const cleanContent = this.stripHtml(post.content);
            const imageTag = post.featureImage ? `<img src="${this.escapeXml(post.featureImage)}" alt="${this.escapeXml(post.title)}" /><br />` : '';
            
            feed.push(`<item>`);
            feed.push(`<title>${this.escapeXml(post.title)}</title>`);
            feed.push(`<link>${this.escapeXml(postUrl)}</link>`);
            feed.push(`<pubDate>${post.publishedAt.toUTCString()}</pubDate>`);
            feed.push(`<guid isPermaLink="true">${this.escapeXml(postUrl)}</guid>`);
            feed.push(`<description><![CDATA[${imageTag}${cleanContent}]]></description>`);
            
            if (post.featureImage) {
                feed.push(`<media:content url="${this.escapeXml(post.featureImage)}" medium="image"/>`);
            }

            if (post.categories && post.categories.length > 0) {
                for (const category of post.categories) {
                    feed.push(`<category>${this.escapeXml(category.name)}</category>`);
                }
            }

            feed.push(`</item>`);
        }

        feed.push(`</channel>`);
        feed.push(`</rss>`);

        return feed.join("\n");
    }

    /**
     * Escape XML special characters
     * @param text - The text to escape
     * @returns The escaped text
     */
    private escapeXml(text: string): string {
        if (!text) return '';
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Strip the HTML from the post content and prepare for CDATA
     * @param html - The HTML to strip
     * @returns The cleaned text
     */
    private stripHtml(html: string): string {
        if (!html) return '';

        try {
            // Remove HTML tags
            let textWithoutTags = html.replace(/<[^>]*>?/g, ' ');

            // Decode HTML entities
            textWithoutTags = textWithoutTags
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&apos;/g, "'")
                .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
                .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

            // Normalize whitespace
            const normalizedText = textWithoutTags
                .replace(/\s+/g, ' ')
                .trim();

            // Truncate if too long
            const maxLength = 500;
            if (normalizedText.length > maxLength) {
                return normalizedText.substring(0, maxLength) + '...';
            }

            return normalizedText;
        } catch (error) {
            console.error('Error stripping HTML:', error);
            return '';
        }
    }
}
