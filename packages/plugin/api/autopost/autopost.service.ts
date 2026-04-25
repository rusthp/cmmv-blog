import {
    Service, OnEvent,
    Config, Application,
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

                if ((isPost && sharePostsEnabled) || (isPage && sharePagesEnabled)) {
                    const instance = (this ?? Application.resolveProvider(AutopostService)) as AutopostService;
                    await instance.sendToSocialNetworks(post);
                } else {
                    AutopostService.logger.debug(`Skipping auto-post for ${post.id} - content type '${post.type}' is not enabled for sharing`);
                }
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
            { name: 'Bluesky', enabled: Config.get<boolean>("blog.autoPostBluesky", false), handler: this.postToBluesky.bind(this) },
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
     * Detect content category from tags and title for prompt specialization.
     */
    private detectContentCategory(payload: SocialPostPayload): string {
        const text = `${payload.title} ${payload.tags.join(' ')} ${payload.categories.join(' ')}`.toLowerCase();

        if (/\b(major|blast|iem|esl|pgl|eswc|faceit|torneio|campeonat|classificat|semifinal|final|champion)\b/.test(text))
            return 'tournament';
        if (/\b(eliminou|eliminad|venceu|ganhou|derrotou|upset|virada|surpreendeu|surpreend)\b/.test(text))
            return 'upset';
        if (/\b(classificou|classificaç|chances|probabilidade|ranking|standings|pontos)\b/.test(text))
            return 'standings';
        if (/\b(cs2|counter.strike|csgo|cs:go)\b/.test(text))
            return 'cs2';
        if (/\b(valorant)\b/.test(text))
            return 'valorant';
        if (/\b(league of legends|lol|cblol)\b/.test(text))
            return 'lol';
        if (/\b(dota|ti\b|the international)\b/.test(text))
            return 'dota';
        if (/\b(rainbow six|r6|siege)\b/.test(text))
            return 'r6';
        if (/\b(furia|pain gaming|loud|nip|natus|team liquid|cloud9|g2|navi|vitality)\b/.test(text))
            return 'team_news';

        return 'general';
    }

    /**
     * Build a specialized prompt based on content category and network.
     */
    private buildSocialPrompt(payload: SocialPostPayload, network: 'facebook' | 'twitter' | 'bluesky', category: string): string {
        const networkName = network === 'facebook' ? 'Facebook' : network === 'twitter' ? 'X/Twitter' : 'Bluesky';
        const maxChars = network === 'twitter' ? 260 : network === 'bluesky' ? 290 : 900;
        const hashtagsStr = this.tagsToHashtags(payload.tags, 6);

        const categoryInstructions: Record<string, string> = {
            tournament: `Este é um artigo sobre torneio/campeonato de esports.
Estilo: empolgante, use dados numéricos se disponíveis, crie suspense sobre quem vai vencer.
Emojis prioritários: 🏆🔥💥🎮✨
CTA: pergunta sobre quem o leitor acha que vai ganhar ou qual time vai surpreender.`,

            upset: `Este é um artigo sobre uma virada ou resultado surpreendente.
Estilo: dramático, use "Incrível!", "Surpreendente!", transmita a emoção do momento.
Emojis prioritários: 😱🔥💪🏆⚡
CTA: pergunte se o leitor esperava esse resultado ou qual a reação dele.`,

            standings: `Este é um artigo sobre classificação/ranking/chances de times.
Estilo: analítico mas empolgante, cite os times brasileiros com destaque, use percentuais se houver.
Emojis prioritários: 🇧🇷🔥💪📊🎯
CTA: pergunte qual time BR o leitor acredita que vai se classificar.`,

            cs2: `Este é um artigo sobre CS2/Counter-Strike.
Estilo: vocabulário de fã de CS (fale em tática, clutch, eco, pistol round quando relevante), empolgante.
Emojis prioritários: 🎮🔫💥🔥🏆
CTA: pergunta relacionada ao meta atual, times favoritos ou jogadas.`,

            valorant: `Este é um artigo sobre Valorant.
Estilo: dinâmico, use vocabulário do jogo (agentes, spike, clutch) quando relevante.
Emojis prioritários: 🎮⚡🔥💥🏆
CTA: pergunta sobre agente favorito, time preferido ou expectativas.`,

            lol: `Este é um artigo sobre League of Legends/CBLOL.
Estilo: apaixonado pela cena BR de LoL, cite o CBLOL quando relevante.
Emojis prioritários: 🎮⚔️🔥🏆🇧🇷
CTA: pergunta sobre time favorito no CBLOL ou expectativas do campeonato.`,

            dota: `Este é um artigo sobre Dota 2.
Estilo: apaixonado pela cena, cite The International ou Dota Play quando relevante.
Emojis prioritários: 🎮🗡️🔥🏆💎
CTA: pergunta sobre heróis, times ou expectativas do TI.`,

            r6: `Este é um artigo sobre Rainbow Six Siege/R6.
Estilo: tático, empolgante, mencione a cena BR quando relevante.
Emojis prioritários: 🎮🔫💥🔥🏆
CTA: pergunta sobre operadores favoritos ou expectativas dos campeonatos.`,

            team_news: `Este é um artigo sobre novidades de times de esports.
Estilo: focado no torcedor, empolgante, destaque o impacto para o time.
Emojis prioritários: 🔥💪🏆🎮✨
CTA: reação dos fãs ao acontecimento, pergunta sobre expectativas.`,

            general: `Este é um artigo geral de games/esports.
Estilo: empolgante e conversacional para fãs de games.
Emojis prioritários: 🎮🔥💥🏆✨
CTA: pergunta aberta para engajar a comunidade gamer.`,
        };

        const instructions = categoryInstructions[category] || categoryInstructions['general'];

        return `Você é o redator oficial das redes sociais do ProplayNews, o maior portal de esports do Brasil.
Crie uma postagem em português para ${networkName} sobre o seguinte artigo:

Título: ${payload.title}
Resumo: ${payload.excerpt || payload.title}
Tags: ${payload.tags.slice(0, 10).join(', ')}
URL: ${payload.url}

${instructions}

Regras obrigatórias:
- Máximo ${maxChars} caracteres no total (contando URL)
- Escreva em português brasileiro informal e empolgante
- Inclua a URL no final (em linha separada)
- Termine com as hashtags: ${hashtagsStr}
- NÃO use aspas no início ou fim do texto
- NÃO inclua prefixos como "Postagem:" ou "Texto:"
- Responda APENAS com o texto final da postagem`;
    }

    /**
     * Generate an engaging social post using AI (Groq or OpenAI).
     * Returns null if AI is not configured or fails — caller falls back to template.
     */
    private async generateAiSocialPost(payload: SocialPostPayload, network: 'facebook' | 'twitter' | 'bluesky'): Promise<string | null> {
        const apiKey = Config.get<string>("blog.groqApiKey") || Config.get<string>("blog.openaiApiKey");
        const useGroq = !!Config.get<string>("blog.groqApiKey");

        if (!apiKey) return null;

        const category = this.detectContentCategory(payload);
        const prompt = this.buildSocialPrompt(payload, network, category);
        const maxChars = network === 'twitter' ? 260 : network === 'bluesky' ? 290 : 900;

        try {
            const endpoint = useGroq
                ? 'https://api.groq.com/openai/v1/chat/completions'
                : 'https://api.openai.com/v1/chat/completions';

            const model = useGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 500,
                    temperature: 0.85,
                }),
                signal: AbortSignal.timeout(15000),
            });

            if (!res.ok) return null;

            const data = await res.json() as any;
            const text: string = data?.choices?.[0]?.message?.content?.trim() || '';

            if (!text) return null;

            if (!text.includes(payload.url)) {
                const withUrl = `${text}\n${payload.url}`;
                return withUrl.length <= maxChars + 100 ? withUrl : `${text.substring(0, maxChars - payload.url.length - 2)}\n${payload.url}`;
            }

            return text;
        } catch {
            return null;
        }
    }

    /**
     * Format post message with template
     * @param payload - The payload containing post details
     * @param template - The template to use for formatting the message
     * @returns The formatted message
     */
    private tagsToHashtags(tags: string[], maxTags = 5): string {
        if (!Array.isArray(tags) || tags.length === 0) return '';
        return tags
            .slice(0, maxTags)
            .map(tag => '#' + tag
                .replace(/[^a-zA-Z0-9\s]/g, '')
                .trim()
                .split(/\s+/)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join('')
            )
            .join(' ');
    }

    private formatPostMessage(payload: SocialPostPayload, template: string): string {
        let message = template || 'New post: {title} {url}';

        message = message.replace('{title}', payload.title);
        message = message.replace('{excerpt}', payload.excerpt || '');
        message = message.replace('{url}', payload.url);
        message = message.replace('{author}', payload.author);

        const tagsStr = Array.isArray(payload.tags) ? payload.tags.join(', ') : '';
        const categoriesStr = Array.isArray(payload.categories) ? payload.categories.join(', ') : '';
        const hashtagsStr = this.tagsToHashtags(payload.tags);

        message = message.replace('{tags}', tagsStr);
        message = message.replace('{categories}', categoriesStr);
        message = message.replace('{hashtags}', hashtagsStr);

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

        let postUrl = payload.url;
        if (postUrl.includes('utm_source={network}'))
            postUrl = postUrl.replace('utm_source={network}', 'utm_source=facebook');

        const useAi = Config.get<boolean>("blog.useAiForSocialPosts", false);
        let message: string;

        if (useAi) {
            const aiText = await this.generateAiSocialPost({ ...payload, url: postUrl }, 'facebook');
            message = aiText || this.formatPostMessage({ ...payload, url: postUrl }, postFormat);
        } else {
            message = this.formatPostMessage({ ...payload, url: postUrl }, postFormat);
        }

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
     * Test Facebook credentials by fetching the page name.
     */
    async testFacebookConnection(): Promise<{ success: boolean; message: string }> {
        const pageId = Config.get<string>("blog.facebookPageId");
        const accessToken = Config.get<string>("blog.facebookAccessToken");

        if (!pageId || !accessToken)
            return { success: false, message: "Page ID e Access Token não configurados." };

        try {
            const res = await fetch(
                `https://graph.facebook.com/v21.0/${pageId}?fields=name&access_token=${accessToken}`
            );
            const data = await res.json() as any;

            if (res.ok && data?.name)
                return { success: true, message: `Conectado à página: ${data.name}` };

            return { success: false, message: `Facebook API error: ${data?.error?.message || res.statusText}` };
        } catch (err: any) {
            return { success: false, message: `Erro de conexão: ${err.message}` };
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

        let postUrl = payload.url;
        if (postUrl.includes('utm_source={network}'))
            postUrl = postUrl.replace('utm_source={network}', 'utm_source=twitter');

        const useAiTwitter = Config.get<boolean>("blog.useAiForSocialPosts", false);
        let message: string;

        if (useAiTwitter) {
            const aiText = await this.generateAiSocialPost({ ...payload, url: postUrl }, 'twitter');
            message = aiText || this.formatPostMessage({ ...payload, url: postUrl }, postFormat);
        } else {
            message = this.formatPostMessage({ ...payload, url: postUrl }, postFormat);
        }

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
     * Post to Bluesky via AT Protocol (no SDK — raw fetch).
     * Supports text + link card with thumbnail.
     * Config keys: blog.blueskySocialHandle, blog.blueskyAppPassword,
     *              blog.blueskyPostFormat, blog.blueskyIncludeImage
     */
    private async postToBluesky(payload: SocialPostPayload): Promise<void> {
        const handle = Config.get<string>("blog.blueskySocialHandle");
        const appPassword = Config.get<string>("blog.blueskyAppPassword");
        const postFormat = Config.get<string>("blog.blueskyPostFormat");
        const includeImage = Config.get<boolean>("blog.blueskyIncludeImage", true);

        if (!handle || !appPassword)
            throw new Error("Bluesky configuration is incomplete. Handle and App Password are required.");

        const pdsUrl = "https://bsky.social";

        // 1. Create session
        const sessionRes = await fetch(`${pdsUrl}/xrpc/com.atproto.server.createSession`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: handle, password: appPassword }),
        });

        if (!sessionRes.ok) {
            const err = await sessionRes.json() as any;
            throw new Error(`Bluesky auth failed: ${err?.message || sessionRes.statusText}`);
        }

        const session = await sessionRes.json() as any;
        const accessToken: string = session.accessJwt;
        const did: string = session.did;

        let postUrl = payload.url;
        if (postUrl.includes("utm_source={network}"))
            postUrl = postUrl.replace("utm_source={network}", "utm_source=bluesky");

        // 2. Build post text (300 char limit on Bluesky)
        const payloadWithBskyUrl = { ...payload, url: postUrl };
        const useAiBsky = Config.get<boolean>("blog.useAiForSocialPosts", false);
        let text: string;

        if (useAiBsky) {
            const aiText = await this.generateAiSocialPost(payloadWithBskyUrl, 'bluesky');
            text = aiText || this.formatPostMessage(payloadWithBskyUrl, postFormat || "{title}\n\n{hashtags}\n\n{url}");
        } else {
            text = this.formatPostMessage(payloadWithBskyUrl, postFormat || "{title}\n\n{hashtags}\n\n{url}");
        }

        if (text.length > 300)
            text = text.substring(0, 297) + "...";

        // 3. Build record
        const record: any = {
            $type: "app.bsky.feed.post",
            text,
            createdAt: new Date().toISOString(),
            langs: ["pt-BR"],
        };

        // 4. Link card embed (external) — upload thumbnail if available
        let thumbBlob: any = null;

        if (includeImage && payload.featureImage) {
            try {
                const imgRes = await fetch(payload.featureImage, { signal: AbortSignal.timeout(10000) });

                if (imgRes.ok) {
                    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

                    // Bluesky limit: 1MB per image
                    if (imgBuffer.length <= 1 * 1024 * 1024) {
                        const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
                        const blobRes = await fetch(`${pdsUrl}/xrpc/com.atproto.repo.uploadBlob`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${accessToken}`,
                                "Content-Type": mimeType,
                            },
                            body: imgBuffer,
                        });

                        if (blobRes.ok) {
                            const blobData = await blobRes.json() as any;
                            thumbBlob = blobData.blob;
                        }
                    }
                }
            } catch {
                AutopostService.logger.debug("Bluesky thumbnail upload failed, posting without image");
            }
        }

        record.embed = {
            $type: "app.bsky.embed.external",
            external: {
                uri: postUrl,
                title: payload.title,
                description: payload.excerpt || payload.title,
                ...(thumbBlob ? { thumb: thumbBlob } : {}),
            },
        };

        // 5. Create post
        const postRes = await fetch(`${pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                repo: did,
                collection: "app.bsky.feed.post",
                record,
            }),
        });

        if (!postRes.ok) {
            const err = await postRes.json() as any;
            throw new Error(`Bluesky post failed: ${err?.message || postRes.statusText}`);
        }

        const postData = await postRes.json() as any;
        AutopostService.logger.debug(`Bluesky post created: ${postData.uri}`);
    }

    /**
     * Test Bluesky credentials by creating and immediately deleting a session.
     */
    async testBlueskyConnection(): Promise<{ success: boolean; message: string; handle?: string }> {
        const handle = Config.get<string>("blog.blueskySocialHandle");
        const appPassword = Config.get<string>("blog.blueskyAppPassword");

        if (!handle || !appPassword)
            return { success: false, message: "Handle e App Password não configurados." };

        try {
            const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: handle, password: appPassword }),
            });

            const data = await res.json() as any;

            if (res.ok && data?.handle)
                return { success: true, message: `Conectado como @${data.handle}`, handle: data.handle };

            return { success: false, message: `Bluesky error: ${data?.message || res.statusText}` };
        } catch (err: any) {
            return { success: false, message: `Erro de conexão: ${err.message}` };
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

        let postUrl = payload.url;
        if (postUrl.includes('utm_source={network}'))
            postUrl = postUrl.replace('utm_source={network}', 'utm_source=linkedin');

        const message = this.formatPostMessage({ ...payload, url: postUrl }, postFormat);

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
