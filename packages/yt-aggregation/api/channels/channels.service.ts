import {
    Service, Cron,
    CronExpression,
    Config
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

interface YouTubeSearchResult {
    kind: string;
    etag: string;
    id: {
        kind: string;
        videoId: string;
    };
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
            default: { url: string, width: number, height: number };
            medium: { url: string, width: number, height: number };
            high: { url: string, width: number, height: number };
        };
        channelTitle: string;
        liveBroadcastContent: string;
    };
}

interface YouTubeSearchResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    prevPageToken?: string;
    regionCode: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: YouTubeSearchResult[];
}

interface YouTubeVideoDetails {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
            default: { url: string, width: number, height: number };
            medium: { url: string, width: number, height: number };
            high: { url: string, width: number, height: number };
            standard?: { url: string, width: number, height: number };
            maxres?: { url: string, width: number, height: number };
        };
        channelTitle: string;
        tags?: string[];
        categoryId: string;
    };
    contentDetails: {
        duration: string;
        dimension: string;
        definition: string;
        caption: string;
        licensedContent: boolean;
        contentRating: {};
    };
    statistics?: {
        viewCount: string;
        likeCount: string;
        dislikeCount: string;
        favoriteCount: string;
        commentCount: string;
    };
}

interface YouTubeVideoResponse {
    kind: string;
    etag: string;
    items: YouTubeVideoDetails[];
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
}

@Service("yt-channels")
export class YTChannelsServiceAdmin {
    private readonly YOUTUBE_API_BASE_URL: string = 'https://www.googleapis.com/youtube/v3';

    @Cron(CronExpression.EVERY_HOUR)
    async handleCronChannelsYoutube() {
        return await this.processChannels.call(this, false);
    }

    /**
     * Process a specific YouTube channel to fetch new videos
     * @param channelId - The ID of the channel to process
     * @returns The result of the processing
     */
    async processChannel(channelId: string) {
        const youtubeApiKey = Config.get("blog.youtubeApiKey");
        if (!youtubeApiKey) {
            return {
                success: false,
                message: 'YouTube API key is not configured'
            };
        }

        const YTChannelsEntity = Repository.getEntity("YTChannelsEntity");
        const YTVideosEntity = Repository.getEntity("YTVideosEntity");

        const channel = await Repository.findOne(YTChannelsEntity, {
            id: channelId
        });

        if (!channel)
            throw new Error(`Channel not found: ${channelId}`);

        try {
            const videos = await this.fetchVideosFromYouTube(channel.channelId, youtubeApiKey);
            let newVideosCount = 0;

            for (const video of videos) {
                const existingVideo = await Repository.findOne(YTVideosEntity, {
                    videoId: video.id
                });

                if (!existingVideo) {
                    const durationSeconds = this.parseDuration(video.contentDetails.duration);
                    const thumbnailUrl = this.getBestThumbnail(video.snippet.thumbnails);

                    await Repository.insert(YTVideosEntity, {
                        title: video.snippet.title,
                        description: video.snippet.description,
                        videoId: video.id,
                        channelId: channel.id,
                        thumbnailUrl: thumbnailUrl,
                        publishedAt: new Date(video.snippet.publishedAt),
                        url: `https://www.youtube.com/watch?v=${video.id}`,
                        isPublished: channel.autoPublish || false,
                        durationSeconds: durationSeconds
                    });

                    newVideosCount++;
                }
            }

            await Repository.update(YTChannelsEntity, { id: channelId }, {
                lastUpdate: new Date()
            });

            return {
                success: true,
                message: `Channel processed successfully. Added ${newVideosCount} new videos.`
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error processing YouTube channel ${channelId}: ${errorMessage}`);

            try {
                await Repository.update(YTChannelsEntity, { id: channelId }, {
                    lastUpdate: new Date()
                });
            } catch (updateError) {
                console.error('Failed to update lastUpdate timestamp', updateError);
            }

            return {
                success: false,
                message: `Failed to process channel: ${errorMessage}`
            };
        }
    }

    /**
     * Process all YouTube channels that need updating
     * @param force - Force the processing of all channels regardless of update interval
     * @returns The result of the processing
     */
    async processChannels(force: boolean = false) {
        const youtubeApiKey = Config.get("blog.youtubeApiKey");
        if (!youtubeApiKey) {
            return {
                success: false,
                message: 'YouTube API key is not configured'
            };
        }

        const YTChannelsEntity = Repository.getEntity("YTChannelsEntity");

        try {
            const channels = await Repository.findAll(YTChannelsEntity, {
                limit: 1000,
                active: true
            }, [], {
                select: ["id", "name", "channelId", "intervalUpdate", "lastUpdate", "autoPublish"]
            });

            if(!channels || !channels.data || channels.data.length === 0) {
                return {
                    success: true,
                    message: "No channels found to process."
                };
            }

            const results = [];

            const GLOBAL_TIMEOUT = 600000;
            const startTime = Date.now();

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Global timeout reached for channel processing'));
                }, GLOBAL_TIMEOUT);
            });

            const processPromise = (async () => {
                for (const channel of channels.data) {
                    if (Date.now() - startTime > GLOBAL_TIMEOUT - 10000)
                        break;

                    const lastUpdate = channel.lastUpdate ? new Date(channel.lastUpdate).getTime() : 0;
                    const currentTime = Date.now();
                    const shouldUpdate = force || !lastUpdate || (currentTime - lastUpdate > channel.intervalUpdate);

                    if (shouldUpdate) {
                        try {
                            const channelTimeout = 120000;

                            const processResult = await Promise.race([
                                this.processSingleChannel(channel, youtubeApiKey),
                                new Promise((_, reject) => {
                                    setTimeout(() => {
                                        reject(new Error(`Timeout processing channel ${channel.name}`));
                                    }, channelTimeout);
                                })
                            ]);

                            results.push({
                                channel: channel.name,
                                success: true,
                                result: processResult
                            });
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            results.push({ channel: channel.name, success: false, error: errorMessage });

                            try {
                                await Repository.update(YTChannelsEntity, { id: channel.id }, {
                                    lastUpdate: new Date()
                                });
                            } catch (updateError) {}
                        }

                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                return results;
            })();

            const finalResults = await Promise.race([processPromise, timeoutPromise]) as Array<{ channel: string, success: boolean, error?: string, result?: any }>;
            const successes = finalResults.filter(r => r.success).length;
            const failures = finalResults.filter(r => !r.success).length;

            return {
                success: true,
                message: `Processed ${finalResults.length} channels (${successes} successful, ${failures} failed)`,
                results: finalResults
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Global error in processChannels: ${errorMessage}`);
            return {
                success: false,
                message: `Channel processing failed: ${errorMessage}`
            };
        }
    }

    /**
     * Process a single YouTube channel safely
     * @param channel The channel to process
     * @param apiKey The YouTube API key
     */
    private async processSingleChannel(channel: any, apiKey: string) {
        const YTChannelsEntity = Repository.getEntity("YTChannelsEntity");
        const YTVideosEntity = Repository.getEntity("YTVideosEntity");

        try {
            const videos = await this.fetchVideosFromYouTube(channel.channelId, apiKey);
            let newVideosCount = 0;

            for (const video of videos) {
                const existingVideo = await Repository.findOne(YTVideosEntity, {
                    videoId: video.id
                });

                if (!existingVideo) {
                    const durationSeconds = this.parseDuration(video.contentDetails.duration);
                    const thumbnailUrl = this.getBestThumbnail(video.snippet.thumbnails);

                    if(durationSeconds < 120)
                        continue;

                    await Repository.insert(YTVideosEntity, {
                        title: video.snippet.title,
                        description: video.snippet.description,
                        videoId: video.id,
                        channelId: channel.id,
                        thumbnailUrl: thumbnailUrl,
                        publishedAt: new Date(video.snippet.publishedAt),
                        url: `https://www.youtube.com/watch?v=${video.id}`,
                        isPublished: channel.autoPublish || false,
                        durationSeconds: durationSeconds
                    });

                    newVideosCount++;
                }
            }

            await Repository.update(YTChannelsEntity, { id: channel.id }, {
                lastUpdate: new Date()
            });

            return {
                success: true,
                videosAdded: newVideosCount
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error in processSingleChannel for ${channel.name}: ${errorMessage}`);

            try {
                await Repository.update(YTChannelsEntity, { id: channel.id }, {
                    lastUpdate: new Date()
                });
            } catch (updateError) {
                console.error(`Failed to update lastUpdate for ${channel.name} after error`);
            }

            throw error;
        }
    }

    /**
     * Fetch videos from YouTube for a specific channel
     * @param channelId The YouTube channel ID
     * @param apiKey The YouTube API key
     * @returns Array of video details
     */
    private async fetchVideosFromYouTube(channelId: string, apiKey: string): Promise<YouTubeVideoDetails[]> {
        try {
            const searchUrl = `${this.YOUTUBE_API_BASE_URL}/search`;
            const searchParams = new URLSearchParams({
                key: apiKey,
                channelId: channelId,
                part: 'snippet',
                order: 'date',
                maxResults: '15',
                type: 'video'
            });

            const searchResponse = await fetch(`${searchUrl}?${searchParams.toString()}`);

            if (!searchResponse.ok) {
                const errorData = await searchResponse.json();
                throw new Error(`YouTube API error: ${searchResponse.status} - ${JSON.stringify(errorData)}`);
            }

            const searchData: YouTubeSearchResponse = await searchResponse.json();

            if (!searchData.items || searchData.items.length === 0)
                return [];

            const videoIds = searchData.items.map(item => item.id.videoId);

            const videoUrl = `${this.YOUTUBE_API_BASE_URL}/videos`;
            const videoParams = new URLSearchParams({
                key: apiKey,
                id: videoIds.join(','),
                part: 'snippet,contentDetails,statistics'
            });

            const videoResponse = await fetch(`${videoUrl}?${videoParams.toString()}`);

            if (!videoResponse.ok) {
                const errorData = await videoResponse.json();
                throw new Error(`YouTube API error: ${videoResponse.status} - ${JSON.stringify(errorData)}`);
            }

            const videoData: YouTubeVideoResponse = await videoResponse.json();

            if (!videoData.items || videoData.items.length === 0)
                return [];

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const filteredVideos = videoData.items.filter(video => {
                const durationSeconds = this.parseDuration(video.contentDetails.duration);
                const isMarkedAsShort =
                    (video.snippet.title && video.snippet.title.toLowerCase().includes('#shorts')) ||
                    (video.snippet.description && video.snippet.description.toLowerCase().includes('#shorts'));
                const isShort = durationSeconds < 60 && isMarkedAsShort;

                if (isShort)
                    return false;

                const publishDate = new Date(video.snippet.publishedAt);
                const isRecent = publishDate >= sevenDaysAgo;

                return isRecent;
            });

            return filteredVideos;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Convert ISO 8601 duration format to seconds
     * @param isoDuration ISO 8601 duration string (e.g. "PT1H30M15S")
     * @returns Duration in seconds
     */
    private parseDuration(isoDuration: string): number {
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');

        return (hours * 3600) + (minutes * 60) + seconds;
    }

    /**
     * Get the best available thumbnail URL from YouTube thumbnail object
     * @param thumbnails The thumbnails object from YouTube API
     * @returns The URL of the best available thumbnail
     */
    private getBestThumbnail(thumbnails: any): string {
        if (thumbnails.maxres) return thumbnails.maxres.url;
        if (thumbnails.standard) return thumbnails.standard.url;
        if (thumbnails.high) return thumbnails.high.url;
        if (thumbnails.medium) return thumbnails.medium.url;
        if (thumbnails.default) return thumbnails.default.url;

        return '';
    }

    /**
     * Extract channel ID and name from a YouTube channel URL
     * @param channelUrl The URL of the YouTube channel
     * @returns Object containing channel ID and name
     */
    async getChannelInfoFromUrl(channelUrl: string) {
        try {
            const cleanUrl = channelUrl.split('?')[0].split('#')[0];
            let channelId = '';

            if (cleanUrl.includes('/channel/')) {
                const parts = cleanUrl.split('/channel/');
                channelId = parts[1];
            } else if (cleanUrl.includes('/@')) {
                const handle = cleanUrl.split('/@')[1];
                channelId = await this.resolveChannelIdFromHandle(handle);
            } else if (cleanUrl.includes('/user/')) {
                const username = cleanUrl.split('/user/')[1];
                channelId = await this.resolveChannelIdFromUsername(username);
            } else if (cleanUrl.includes('/c/')) {
                const customUrl = cleanUrl.split('/c/')[1];
                channelId = await this.resolveChannelIdFromCustomUrl(customUrl);
            } else {
                throw new Error('Invalid YouTube channel URL format');
            }

            if (!channelId) {
                throw new Error('Could not resolve channel ID from the provided URL');
            }

            const channelInfo = await this.fetchChannelInfo(channelId);

            return {
                success: true,
                channelId: channelId,
                channelName: channelInfo.title
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error extracting channel info from URL: ${errorMessage}`);
            return {
                success: false,
                message: `Failed to extract channel info: ${errorMessage}`
            };
        }
    }

    /**
     * Resolve channel ID from a YouTube handle
     * @param handle The YouTube handle (without @)
     * @returns The channel ID
     */
    private async resolveChannelIdFromHandle(handle: string): Promise<string> {
        const youtubeApiKey = Config.get("blog.youtubeApiKey");

        if (!youtubeApiKey)
            throw new Error('YouTube API key is not configured');

        const searchUrl = `${this.YOUTUBE_API_BASE_URL}/search`;
        const searchParams = new URLSearchParams({
            key: youtubeApiKey,
            q: `@${handle}`,
            part: 'snippet',
            type: 'channel',
            maxResults: '1'
        });

        const response = await fetch(`${searchUrl}?${searchParams.toString()}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`YouTube API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            throw new Error(`No channel found for handle @${handle}`);
        }

        return data.items[0].snippet.channelId;
    }

    /**
     * Resolve channel ID from a YouTube username
     * @param username The YouTube username
     * @returns The channel ID
     */
    private async resolveChannelIdFromUsername(username: string): Promise<string> {
        const youtubeApiKey = Config.get("blog.youtubeApiKey");

        if (!youtubeApiKey)
            throw new Error('YouTube API key is not configured');

        const url = `${this.YOUTUBE_API_BASE_URL}/channels`;

        const params = new URLSearchParams({
            key: youtubeApiKey,
            forUsername: username,
            part: 'id'
        });

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`YouTube API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            throw new Error(`No channel found for username ${username}`);
        }

        return data.items[0].id;
    }

    /**
     * Resolve channel ID from a YouTube custom URL
     * @param customUrl The custom URL portion
     * @returns The channel ID
     */
    private async resolveChannelIdFromCustomUrl(customUrl: string): Promise<string> {
        const youtubeApiKey = Config.get("blog.youtubeApiKey");

        if (!youtubeApiKey)
            throw new Error('YouTube API key is not configured');

        const searchUrl = `${this.YOUTUBE_API_BASE_URL}/search`;
        const searchParams = new URLSearchParams({
            key: youtubeApiKey,
            q: customUrl,
            part: 'snippet',
            type: 'channel',
            maxResults: '1'
        });

        const response = await fetch(`${searchUrl}?${searchParams.toString()}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`YouTube API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            throw new Error(`No channel found for custom URL ${customUrl}`);
        }

        return data.items[0].snippet.channelId;
    }

    /**
     * Fetch channel information using the channel ID
     * @param channelId The YouTube channel ID
     * @returns Channel information
     */
    private async fetchChannelInfo(channelId: string): Promise<{title: string}> {
        const youtubeApiKey = Config.get("blog.youtubeApiKey");

        if (!youtubeApiKey)
            throw new Error('YouTube API key is not configured');

        const url = `${this.YOUTUBE_API_BASE_URL}/channels`;

        const params = new URLSearchParams({
            key: youtubeApiKey,
            id: channelId,
            part: 'snippet'
        });

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`YouTube API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0)
            throw new Error(`No channel found for ID ${channelId}`);

        return {
            title: data.items[0].snippet.title
        };
    }
}