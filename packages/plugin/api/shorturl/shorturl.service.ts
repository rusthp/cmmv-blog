import { Service, Config } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

@Service('blog_shorturl')
export class ShortUrlServiceTools {
    /**
     * Get the original URL from a short URL
     * @param slug - The slug of the short URL
     * @returns The original URL
     */
    async getShortUrl(slug: string) {
        const ShortUrlEntity = Repository.getEntity("ShortUrlEntity");

        const shortUrl = await Repository.findOne(ShortUrlEntity, {
            slug: slug
        }, {
            select: [
                "originalUrl",
                "statusHTTP"
            ]
        });

        if (!shortUrl)
            throw new Error("Short URL not found");

        return shortUrl;
    }

    /**
     * Generate a random slug
     * @param length - The length of the slug
     * @returns The random slug
     */
    private generateRandomSlug(length: number = 8): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        return result;
    }

    /**
     * Check if a slug is unique
     * @param slug - The slug to check
     * @returns True if the slug is unique, false otherwise
     */
    private async isSlugUnique(slug: string): Promise<boolean> {
        const ShortUrlEntity = Repository.getEntity("ShortUrlEntity");

        const existing = await Repository.findOne(ShortUrlEntity, {
            slug: slug
        });

        return !existing;
    }

    /**
     * Generate a unique slug
     * @param maxAttempts - The maximum number of attempts to generate a unique slug
     * @returns The unique slug
     */
    private async generateUniqueSlug(maxAttempts: number = 10): Promise<string> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const slug = this.generateRandomSlug();

            if (await this.isSlugUnique(slug))
                return slug;
        }

        const fallbackSlug = this.generateRandomSlug() + Date.now().toString().slice(-4);
        return fallbackSlug;
    }

    /**
     * Create a short URL
     * @param originalUrl - The original URL
     * @param customSlug - The custom slug
     * @param statusHTTP - The status HTTP
     * @returns The complete short URL
     */
    public async createShortUrl(originalUrl: string, customSlug?: string, statusHTTP: number = 301): Promise<string> {
        if (!originalUrl)
            throw new Error("Original URL is required");

        try {
            new URL(originalUrl);
        } catch {
            throw new Error("Invalid URL format");
        }

        const ShortUrlEntity = Repository.getEntity("ShortUrlEntity");
        let slug: string;

        if (customSlug) {
            if (!(await this.isSlugUnique(customSlug)))
                throw new Error("Slug already exists");

            slug = customSlug;
        } else {
            slug = await this.generateUniqueSlug();
        }

        const shortUrlData = {
            originalUrl: originalUrl.trim(),
            slug: slug,
            statusHTTP: statusHTTP
        };

        await Repository.insert(ShortUrlEntity, shortUrlData);
        const baseUrl = Config.get("blog.url")?.replace(/\/$/, '') || '';
        return `${baseUrl}/s/${slug}`;
    }
}
