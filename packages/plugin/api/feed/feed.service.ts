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
     * Escape XML special characters
     * @param str string to escape
     * @returns escaped string
     */
    private escapeXml(str: string | null): string {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

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

        let feed = [`<?xml version=\"1.0\" encoding=\"UTF-8\"?>`];
        feed.push(`<rss xmlns:atom=\"http://www.w3.org/2005/Atom\" xmlns:media=\"http://search.yahoo.com/mrss/\" version=\"2.0\">`);
        feed.push(`<channel>`);
        feed.push(`<title>${this.escapeXml(title)}</title>`);
        feed.push(`<link>${this.escapeXml(url)}</link>`);
        feed.push(`<description>${this.escapeXml(description)}</description>`);
        feed.push(`<language>${this.escapeXml(language.replace('_', '-'))}</language>`);

        if(copyright)
            feed.push(`<copyright>© Copyright ${this.escapeXml(copyright)}</copyright>`);

        feed.push(`<atom:link href=\"${this.escapeXml(url)}/feed\" rel=\"self\" type=\"application/rss+xml\"/>`)

        for (const post of posts.posts) {
            feed.push(`<item>`);
            feed.push(`<title>${this.escapeXml(post.title)}</title>`);
            feed.push(`<link>${this.escapeXml(url)}/post/${this.escapeXml(post.slug)}</link>`);
            feed.push(`<pubDate>${post.publishedAt.toGMTString()}</pubDate>`);
            feed.push(`<guid isPermaLink=\"true\">${this.escapeXml(url)}/post/${this.escapeXml(post.slug)}</guid>`);
            feed.push(`<description><![CDATA[ <img src=\"${this.escapeXml(post.featureImage)}\" /><br /> ]]>${this.stripHtml(post.content)}</description>`);
            feed.push(`<media:content url=\"${this.escapeXml(post.featureImage)}\" medium=\"image\"/>`);

            for (const category of post.categories) {
                feed.push(`<category>${this.escapeXml(category.name)}</category>`);
            }

            feed.push(`</item>`);
        }

        feed.push(`</channel>`);
        feed.push(`</rss>`);

        return feed.join("\n");
    }

    /**
     * Strip the HTML from the post content
     * @param html - The HTML to strip
     * @returns The stripped HTML
     */
    private stripHtml(html: string) {
        if (!html) return '';

        try {
            const textWithoutTags = html.replace(/<[^>]*>?/g, ' ');

            const decodedText = textWithoutTags
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&apos;/g, "'");

            const escapedText = decodedText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');

            const normalizedText = escapedText
                .replace(/\s+/g, ' ')
                .trim();

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
