import {
    Service, OnEvent,
    Config,
    Logger
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

import { NotificationsService } from "../notifications/notifications.service";

interface OneSignalNotificationPayload {
    app_id: string;
    included_segments: string[];
    headings: { [language: string]: string };
    contents: { [language: string]: string };
    url?: string;
    chrome_web_image?: string;
    firefox_icon?: string;
    large_icon?: string;
    data?: any;
}

interface SocialPostPayload {
    title: string;
    excerpt: string;
    content: string;
    url: string;
    tags: string[];
    categories: string[];
    author: string;
    featureImage?: string;
    postId: string;
}

@Service('blog_autopost')
export class AutopostService {
    public static readonly logger = new Logger(AutopostService.name);

    @OnEvent("posts.published")
    async onPostPublished(post: any) {
        try {
            await NotificationsService.sendPostPublishedNotification(post);

            const autoPostOnNewContent = Config.get<boolean>("blog.autoPostOnNewContent", false);

            if (autoPostOnNewContent) {
                const isPost = post.type === 'post';
                const isPage = post.type === 'page';
                const sharePostsEnabled = Config.get<boolean>("blog.autoPostSharePosts", true);
                const sharePagesEnabled = Config.get<boolean>("blog.autoPostSharePages", false);

                if ((isPost && sharePostsEnabled) || (isPage && sharePagesEnabled))
                    await this.sendToSocialNetworks(post);
                else
                    AutopostService.logger.debug(`Skipping auto-post for ${post.id} - content type '${post.type}' is not enabled for sharing`);
            } else {
                AutopostService.logger.debug('Auto-posting for new content is disabled');
            }
        } catch (error: any) {
            console.error(`Error in post published handler: ${error?.message || 'Unknown error'}`);
        }
    }

    /**
     * Send post to all configured social networks
     * @param post - The post to send
     * @returns
     */
    public async sendToSocialNetworks(post: any): Promise<void> {
        try {
            const siteUrl = Config.get<string>("blog.url", "");
            const postUrl = `${siteUrl}/post/${post.slug}`;

            let featureImageUrl: string | undefined = post.featureImage;

            if (featureImageUrl && !featureImageUrl.startsWith('http')) {
                const base = siteUrl.replace(/\/$/, '');
                featureImageUrl = `${base}${featureImageUrl.startsWith('/') ? '' : '/'}${featureImageUrl}`;
            }

            if (featureImageUrl?.includes('localhost')) {
                const base = siteUrl.replace(/\/$/, '');
                const path = featureImageUrl.replace(/^https?:\/\/[^/]+/, '');
                featureImageUrl = `${base}${path}`;
            }

            const payload: SocialPostPayload = {
                title: post.title || "",
                excerpt: post.excerpt || "",
                content: post.content || "",
                url: postUrl,
                tags: post.tags || [],
                categories: post.categories || [],
                author: post.author?.name || "Anonymous",
                featureImage: featureImageUrl,
                postId: post.id
            };

            const delayAutoPosting = Config.get<boolean>("blog.delayAutoPosting", false);

            if (delayAutoPosting) {
                const delayMinutes = Config.get<number>("blog.autoPostDelayMinutes", 0);

                if (delayMinutes > 0) {
                    AutopostService.logger.debug(`Scheduling post to social networks with ${delayMinutes} minute delay`);

                    setTimeout(() => {
                        this.executeAutoPostToNetworks(payload)
                            .catch(err => AutopostService.logger.error(`Error in delayed auto-posting: ${err.message}`));
                    }, delayMinutes * 60 * 1000);

                    return;
                }
            }

            await this.executeAutoPostToNetworks(payload);
        } catch (error: any) {
            AutopostService.logger.error(`Failed to send post to social networks: ${error?.message || 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Execute posting to all configured social networks
     * @param payload - The payload containing post details
     */
    private async executeAutoPostToNetworks(payload: SocialPostPayload): Promise<void> {
        const networks = [
            { name: 'Facebook', enabled: Config.get<boolean>("blog.autoPostFacebook", false), handler: this.postToFacebook.bind(this) },
            { name: 'Twitter', enabled: Config.get<boolean>("blog.autoPostTwitter", false), handler: this.postToTwitter.bind(this) },
            { name: 'LinkedIn', enabled: Config.get<boolean>("blog.autoPostLinkedIn", false), handler: this.postToLinkedIn.bind(this) },
        ];

        if (Config.get<boolean>("blog.enableLinkTracking", false))
            payload.url = this.addUtmParameters(payload.url, payload.postId);

        const timeBetweenPosts = Config.get<number>("blog.timeBetweenPosts", 0);
        let lastPostTime = Date.now();

        for (const network of networks) {
            if (network.enabled) {
                try {
                    if (timeBetweenPosts > 0 && network !== networks[0]) {
                        const elapsedTime = Date.now() - lastPostTime;
                        const waitTime = (timeBetweenPosts * 60 * 1000) - elapsedTime;

                        if (waitTime > 0) {
                            AutopostService.logger.debug(`Waiting ${Math.round(waitTime / 1000)} seconds before posting to ${network.name}`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        }
                    }

                    AutopostService.logger.debug(`Posting to ${network.name}...`);
                    await network.handler(payload);
                    AutopostService.logger.debug(`Successfully posted to ${network.name}`);

                    lastPostTime = Date.now();
                } catch (error: any) {
                    AutopostService.logger.error(`Failed to post to ${network.name}: ${error?.message || 'Unknown error'}`);
                }
            } else {
                AutopostService.logger.debug(`Skipping ${network.name} (disabled)`);
            }
        }
    }

    /**
     * Add UTM tracking parameters to the URL
     * @param url - The URL to add UTM parameters to
     * @param postId - The ID of the post
     * @returns The URL with UTM parameters
     */
    private addUtmParameters(url: string, postId: string): string {
        try {
            const utmSource = Config.get<string>("blog.utmSource", "{network}");
            const utmMedium = Config.get<string>("blog.utmMedium", "social");
            const utmCampaign = Config.get<string>("blog.utmCampaign", "auto-post");
            const utmContent = Config.get<string>("blog.utmContent", "{post_id}");

            const urlObj = new URL(url);

            urlObj.searchParams.append('utm_source', utmSource);
            urlObj.searchParams.append('utm_medium', utmMedium);
            urlObj.searchParams.append('utm_campaign', utmCampaign);
            urlObj.searchParams.append('utm_content', utmContent.replace('{post_id}', postId));

            return urlObj.toString();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            AutopostService.logger.error(`Error adding UTM parameters: ${errorMessage}`);
            return url;
        }
    }

    /**
     * Format post message with template
     * @param payload - The payload containing post details
     * @param template - The template to use for formatting the message
     * @returns The formatted message
     */
    private formatPostMessage(payload: SocialPostPayload, template: string): string {
        let message = template || 'New post: {title} {url}';

        message = message.replace('{title}', payload.title);
        message = message.replace('{excerpt}', payload.excerpt);
        message = message.replace('{url}', payload.url);
        message = message.replace('{author}', payload.author);

        const tagsStr = Array.isArray(payload.tags) ? payload.tags.join(', ') : '';
        const categoriesStr = Array.isArray(payload.categories) ? payload.categories.join(', ') : '';

        message = message.replace('{tags}', tagsStr);
        message = message.replace('{categories}', categoriesStr);

        return message;
    }

    /**
     * Post to Facebook
     * @param payload - The payload containing post details
     * @returns
     */
    private async postToFacebook(payload: SocialPostPayload): Promise<void> {
        const pageId = Config.get<string>("blog.facebookPageId");
        const accessToken = Config.get<string>("blog.facebookAccessToken");
        const postFormat = Config.get<string>("blog.facebookPostFormat");
        const includeImage = Config.get<boolean>("blog.facebookIncludeImage", false);

        if (!pageId || !accessToken)
            throw new Error("Facebook configuration is incomplete. Page ID and Access Token are required.");

        const message = this.formatPostMessage(payload, postFormat);

        let postUrl = payload.url;
        if (postUrl.includes('utm_source={network}'))
            postUrl = postUrl.replace('utm_source={network}', 'utm_source=facebook');

        const requestData: any = {
            message: message,
            link: postUrl
        };

        if (includeImage && payload.featureImage)
            requestData.picture = payload.featureImage;

        try {
            const apiUrl = `https://graph.facebook.com/v21.0/${pageId}/feed`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...requestData,
                    access_token: accessToken
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Facebook API error: ${errorData?.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return;
        } catch (error: any) {
            throw new Error(`Failed to post to Facebook: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Builds an OAuth 1.0a Authorization header for Twitter requests.
     */
    /**
     * Tests the Twitter/X API credentials by calling GET /2/users/me.
     * Returns success + username or an error message.
     */
    async testTwitterConnection(): Promise<{ success: boolean; message: string; username?: string }> {
        const apiKey = Config.get<string>("blog.twitterApiKey");
        const apiSecret = Config.get<string>("blog.twitterApiSecret");
        const accessToken = Config.get<string>("blog.twitterAccessToken");
        const accessTokenSecret = Config.get<string>("blog.twitterAccessTokenSecret");

        if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
            return {
                success: false,
                message: `Credenciais incompletas. Campos vazios: ${[
                    !apiKey && 'API Key',
                    !apiSecret && 'API Secret',
                    !accessToken && 'Access Token',
                    !accessTokenSecret && 'Access Token Secret',
                ].filter(Boolean).join(', ')}`,
            };
        }

        const oauth = { consumer_key: apiKey, consumer_secret: apiSecret, token: accessToken, token_secret: accessTokenSecret };
        const url = 'https://api.twitter.com/2/users/me';

        try {
            const authHeader = this.buildTwitterOAuthHeader('GET', url, oauth);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': authHeader },
            });

            const data = await response.json() as any;

            if (response.ok && data?.data?.username) {
                return { success: true, message: `Conectado como @${data.data.username}`, username: data.data.username };
            }

            return { success: false, message: `Twitter API error ${response.status}: ${data?.detail || data?.title || response.statusText}` };
        } catch (err: any) {
            return { success: false, message: `Erro de conexão: ${err.message}` };
        }
    }

    private buildTwitterOAuthHeader(
        method: string,
        url: string,
        oauth: { consumer_key: string; consumer_secret: string; token: string; token_secret: string },
        extraParams: Record<string, string> = {}
    ): string {
        const crypto = require('crypto');
        const nonce = crypto.randomBytes(16).toString('hex');
        const timestamp = Math.floor(Date.now() / 1000).toString();

        const oauthParams: Record<string, string> = {
            oauth_consumer_key: oauth.consumer_key,
            oauth_nonce: nonce,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: timestamp,
            oauth_token: oauth.token,
            oauth_version: '1.0',
            ...extraParams,
        };

        const parameterString = Object.entries(oauthParams)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');

        const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(parameterString)}`;
        const signingKey = `${encodeURIComponent(oauth.consumer_secret)}&${encodeURIComponent(oauth.token_secret)}`;
        const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

        return 'OAuth ' + [
            ...Object.entries(oauthParams),
            ['oauth_signature', signature],
        ]
            .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
            .join(', ');
    }

    /**
     * Uploads an image to Twitter v1.1 media/upload and returns the media_id.
     * Falls back to null on any error so the tweet still sends without image.
     */
    private async uploadImageToTwitter(
        imageUrl: string,
        oauth: { consumer_key: string; consumer_secret: string; token: string; token_secret: string }
    ): Promise<string | null> {
        try {
            const imgResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
            if (!imgResponse.ok) return null;

            const buffer = Buffer.from(await imgResponse.arrayBuffer());
            if (buffer.length > 5 * 1024 * 1024) return null; // Twitter 5 MB limit

            const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
            const authHeader = this.buildTwitterOAuthHeader('POST', uploadUrl, oauth);

            const form = new FormData();
            form.append('media_data', buffer.toString('base64'));

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Authorization': authHeader },
                body: form,
            });

            if (!uploadResponse.ok) return null;
            const uploadData: any = await uploadResponse.json();
            return uploadData.media_id_string ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Post to Twitter
     * @param payload - The payload containing post details
     */
    private async postToTwitter(payload: SocialPostPayload): Promise<void> {
        const apiKey = Config.get<string>("blog.twitterApiKey");
        const apiSecret = Config.get<string>("blog.twitterApiSecret");
        const accessToken = Config.get<string>("blog.twitterAccessToken");
        const accessTokenSecret = Config.get<string>("blog.twitterAccessTokenSecret");
        const postFormat = Config.get<string>("blog.twitterPostFormat");
        const includeImage = Config.get<boolean>("blog.twitterIncludeImage", false);

        AutopostService.logger.log(
            `[twitter] credentials check: apiKey=${apiKey ? apiKey.substring(0,6)+'…' : 'MISSING'} ` +
            `accessToken=${accessToken ? accessToken.substring(0,8)+'…' : 'MISSING'}`
        );

        if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret)
            throw new Error("Twitter configuration is incomplete. API keys and access tokens are required.");

        const message = this.formatPostMessage(payload, postFormat);

        let postUrl = payload.url;
        if (postUrl.includes('utm_source={network}'))
            postUrl = postUrl.replace('utm_source={network}', 'utm_source=twitter');

        const oauth = {
            consumer_key: apiKey,
            consumer_secret: apiSecret,
            token: accessToken,
            token_secret: accessTokenSecret,
        };

        try {
            let tweetText = message;
            if (tweetText.length > 280)
                tweetText = tweetText.substring(0, 277) + '...';

            const tweetData: any = { text: tweetText };

            if (includeImage && payload.featureImage) {
                const mediaId = await this.uploadImageToTwitter(payload.featureImage, oauth);
                if (mediaId) tweetData.media = { media_ids: [mediaId] };
                else AutopostService.logger.debug('Twitter image upload failed, posting without image');
            }

            const tweetUrl = 'https://api.twitter.com/2/tweets';
            const authHeader = this.buildTwitterOAuthHeader('POST', tweetUrl, oauth);

            const response = await fetch(tweetUrl, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tweetData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Twitter API error: ${errorData?.detail || response.statusText}`);
            }

            const data = await response.json();
            AutopostService.logger.debug(`Twitter API response: ${JSON.stringify(data)}`);
        } catch (error: any) {
            throw new Error(`Failed to post to Twitter: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Post to LinkedIn using the current Posts API (/rest/posts).
     * @param payload - The payload containing post details
     * @returns
     */
    private async postToLinkedIn(payload: SocialPostPayload): Promise<void> {
        const accessToken = Config.get<string>("blog.linkedInAccessToken");
        const postFormat = Config.get<string>("blog.linkedInPostFormat");
        const includeImage = Config.get<boolean>("blog.linkedInIncludeImage", false);

        if (!accessToken)
            throw new Error("LinkedIn configuration is incomplete. Access token is required.");

        const message = this.formatPostMessage(payload, postFormat);

        let postUrl = payload.url;
        if (postUrl.includes('utm_source={network}'))
            postUrl = postUrl.replace('utm_source={network}', 'utm_source=linkedin');

        try {
            // Resolve author URN via /v2/userinfo (works with both person and organization tokens)
            const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(`LinkedIn API error getting profile: ${errorData?.message || profileResponse.statusText}`);
            }

            const profileData = await profileResponse.json();
            const authorUrn = profileData.sub ? `urn:li:person:${profileData.sub}` : null;

            if (!authorUrn)
                throw new Error('Could not retrieve LinkedIn author URN');

            // Build post body using the new /rest/posts API (LinkedIn-Version: 202404)
            const postData: any = {
                author: authorUrn,
                commentary: message,
                visibility: 'PUBLIC',
                distribution: {
                    feedDistribution: 'MAIN_FEED',
                    targetEntities: [],
                    thirdPartyDistributionChannels: [],
                },
                content: {
                    article: {
                        source: postUrl,
                        title: payload.title,
                        description: payload.excerpt || payload.title,
                    },
                },
                lifecycleState: 'PUBLISHED',
                isReshareDisabledByAuthor: false,
            };

            if (includeImage && payload.featureImage)
                postData.content.article.thumbnail = payload.featureImage;

            const shareResponse = await fetch('https://api.linkedin.com/rest/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202404',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
                body: JSON.stringify(postData),
            });

            if (!shareResponse.ok) {
                const errorData = await shareResponse.json();
                throw new Error(`LinkedIn API error posting: ${errorData?.message || shareResponse.statusText}`);
            }

            AutopostService.logger.debug(`LinkedIn post created (status: ${shareResponse.status})`);
        } catch (error: any) {
            throw new Error(`Failed to post to LinkedIn: ${error.message || 'Unknown error'}`);
        }
    }
}
