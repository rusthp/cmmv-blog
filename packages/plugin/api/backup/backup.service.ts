import * as path from "node:path";
import * as fs from "node:fs";
import * as zlib from "node:zlib";
import { cwd } from "node:process";
import { promisify } from "node:util";

import {
    Service, Cron,
    CronExpression, Logger,
    Application, Config
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";
import { MediasService } from "../medias/medias.service";
import { BlogStorageService } from "../storage/storage.service";

@Service('blog_backup')
export class BackupService {
    private readonly gzip = promisify(zlib.gzip);

    constructor(
        private readonly mediasService: MediasService,
        private readonly storageService: BlogStorageService
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handleCronBackup() {
        await this.backupDatabase.call(this);
        await this.clearOldBackups.call(this);
    }
    /** */

    /**
     * Backup the database
     * @returns A promise that resolves to an object containing a success property and a message property
     */
    async backupDatabase() {
        const mediasPath = path.join(cwd(), "medias", "backup");

        if (!fs.existsSync(mediasPath))
            fs.mkdirSync(mediasPath, { recursive: true });

        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const backupPrefix = `backup_${timestamp}`;
        const backupDirPath = path.join(mediasPath, backupPrefix);

        if (!fs.existsSync(backupDirPath))
            fs.mkdirSync(backupDirPath, { recursive: true });

        try {
            const UserEntity = Repository.getEntity("UserEntity");
            const GroupsEntity = Repository.getEntity("GroupsEntity");
            const SettingsEntity = Repository.getEntity("SettingsEntity");

            //CMS
            const AnalyticsAccessEntity = Repository.getEntity("AnalyticsAccessEntity");
            const AnalyticsSummaryEntity = Repository.getEntity("AnalyticsSummaryEntity");
            const CategoriesEntity = Repository.getEntity("CategoriesEntity");
            const CommentsEntity = Repository.getEntity("CommentsEntity");
            const CommentsLikesEntity = Repository.getEntity("CommentsLikesEntity");
            const MediasEntity = Repository.getEntity("MediasEntity");
            const MemberEntity = Repository.getEntity("MemberEntity");
            const MetaEntity = Repository.getEntity("MetaEntity");
            const PostsEntity = Repository.getEntity("PostsEntity");
            const PostsHistoryEntity = Repository.getEntity("PostsHistoryEntity");
            const ProfilesEntity = Repository.getEntity("ProfilesEntity");
            const PromptsEntity = Repository.getEntity("PromptsEntity");
            const RedirectsEntity = Repository.getEntity("RedirectsEntity");
            const TagsEntity = Repository.getEntity("TagsEntity");
            const WhitelabelEntity = Repository.getEntity("WhitelabelEntity");
            const WhitelabelAccessEntity = Repository.getEntity("WhitelabelAccessEntity");

            //RSS
            const FeedChannelsEntity = Repository.getEntity("FeedChannelsEntity");
            const FeedParserEntity = Repository.getEntity("FeedParserEntity");
            const FeedRawEntity = Repository.getEntity("FeedRawEntity");

            //YT
            const YTChannelsEntity = Repository.getEntity("YTChannelsEntity");
            const YTVideosEntity = Repository.getEntity("YTVideosEntity");

            //Affiliate
            const AffiliateNetworksEntity = Repository.getEntity("AffiliateNetworksEntity");
            const AffiliateAccountsEntity = Repository.getEntity("AffiliateAccountsEntity");
            const AffiliateCampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");
            const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");
            const AffiliateCategoriesEntity = Repository.getEntity("AffiliateCategoriesEntity");
            const AffiliateCampaignsNetworksEntity = Repository.getEntity("AffiliateCampaignsNetworksEntity");

            const users = await Repository.findAll(UserEntity, { limit: 10000000000 });
            const groups = await Repository.findAll(GroupsEntity, { limit: 10000000000 });
            const settings = await Repository.findAll(SettingsEntity, { limit: 10000000000 });
            const analyticsAccess = await Repository.findAll(AnalyticsAccessEntity, { limit: 10000000000 });
            const analyticsSummary = await Repository.findAll(AnalyticsSummaryEntity, { limit: 10000000000 });
            const categories = await Repository.findAll(CategoriesEntity, { limit: 10000000000 });
            const posts = await Repository.findAll(PostsEntity, { limit: 10000000000 });
            const postsHistory = await Repository.findAll(PostsHistoryEntity, { limit: 10000000000 });
            const comments = await Repository.findAll(CommentsEntity, { limit: 10000000000 });
            const commentsLikes = await Repository.findAll(CommentsLikesEntity, { limit: 10000000000 });
            const medias = await Repository.findAll(MediasEntity, { limit: 10000000000 });
            const members = await Repository.findAll(MemberEntity, { limit: 10000000000 });
            const meta = await Repository.findAll(MetaEntity, { limit: 10000000000 });
            const profiles = await Repository.findAll(ProfilesEntity, { limit: 10000000000 });
            const prompts = await Repository.findAll(PromptsEntity, { limit: 10000000000 });
            const redirects = await Repository.findAll(RedirectsEntity, { limit: 10000000000 });
            const tags = await Repository.findAll(TagsEntity, { limit: 10000000000 });
            const whitelabel = await Repository.findAll(WhitelabelEntity, { limit: 10000000000 });
            const whitelabelAccess = await Repository.findAll(WhitelabelAccessEntity, { limit: 10000000000 });
            const feedChannels = await Repository.findAll(FeedChannelsEntity, { limit: 10000000000 });
            const feedParser = await Repository.findAll(FeedParserEntity, { limit: 10000000000 });
            const feedRaw = await Repository.findAll(FeedRawEntity, { limit: 10000000000 });
            const ytChannels = await Repository.findAll(YTChannelsEntity, { limit: 10000000000 });
            const ytVideos = await Repository.findAll(YTVideosEntity, { limit: 10000000000 });

            //Affiliate
            const affiliateNetworks = await Repository.findAll(AffiliateNetworksEntity, { limit: 10000000000 });
            const affiliateAccounts = await Repository.findAll(AffiliateAccountsEntity, { limit: 10000000000 });
            const affiliateCampaigns = await Repository.findAll(AffiliateCampaignsEntity, { limit: 10000000000 });
            const affiliateCoupons = await Repository.findAll(AffiliateCouponsEntity, { limit: 10000000000 });
            const affiliateCategories = await Repository.findAll(AffiliateCategoriesEntity, { limit: 10000000000 });
            const affiliateCampaignsNetworks = await Repository.findAll(AffiliateCampaignsNetworksEntity, { limit: 10000000000 });

            const backupData = [
                { name: "users.json", data: users },
                { name: "groups.json", data: groups },
                { name: "settings.json", data: settings },
                { name: "analytics_access.json", data: analyticsAccess },
                { name: "analytics_summary.json", data: analyticsSummary },
                { name: "categories.json", data: categories },
                { name: "posts.json", data: posts },
                { name: "posts_history.json", data: postsHistory },
                { name: "comments.json", data: comments },
                { name: "comments_likes.json", data: commentsLikes },
                { name: "medias.json", data: medias },
                { name: "members.json", data: members },
                { name: "meta.json", data: meta },
                { name: "profiles.json", data: profiles },
                { name: "prompts.json", data: prompts },
                { name: "redirects.json", data: redirects },
                { name: "tags.json", data: tags },
                { name: "whitelabel.json", data: whitelabel },
                { name: "whitelabel_access.json", data: whitelabelAccess },
                { name: "feed_channels.json", data: feedChannels },
                { name: "feed_parser.json", data: feedParser },
                { name: "feed_raw.json", data: feedRaw },
                { name: "yt_channels.json", data: ytChannels },
                { name: "yt_videos.json", data: ytVideos },
                { name: "affiliate_networks.json", data: affiliateNetworks },
                { name: "affiliate_accounts.json", data: affiliateAccounts },
                { name: "affiliate_campaigns.json", data: affiliateCampaigns },
                { name: "affiliate_coupons.json", data: affiliateCoupons },
                { name: "affiliate_categories.json", data: affiliateCategories },
                { name: "affiliate_campaigns_networks.json", data: affiliateCampaignsNetworks }
            ];

            for (const item of backupData) {
                const jsonData = JSON.stringify(item.data || {});
                const outputPath = path.join(backupDirPath, item.name);
                fs.writeFileSync(outputPath, jsonData);
            }

            const archivePath = path.join(mediasPath, `${backupPrefix}.tar.gz`);
            await this.createTarGz(backupDirPath, archivePath);

            for (const file of fs.readdirSync(backupDirPath))
                fs.unlinkSync(path.join(backupDirPath, file));

            fs.rmdirSync(backupDirPath);

            return {
                success: true,
                message: "Backup completed successfully",
                filename: path.basename(archivePath)
            };
        } catch (error) {
            console.error(`Error during backup: ${error instanceof Error ? error.message : String(error)}`);

            if (fs.existsSync(backupDirPath)) {
                try {
                    for (const file of fs.readdirSync(backupDirPath))
                        fs.unlinkSync(path.join(backupDirPath, file));

                    fs.rmdirSync(backupDirPath);
                } catch (cleanupError) {
                    console.error(`Error during cleanup: ${cleanupError}`);
                }
            }

            throw error;
        }
    }

    /**
     * Clear old backups
     * @returns A promise that resolves to void
     */
    async clearOldBackups() {
        const mediasPath = path.join(cwd(), "medias", "backup");

        if (!fs.existsSync(mediasPath))
            return;

        const files = fs.readdirSync(mediasPath)
            .filter(file => file.endsWith('.tar.gz') && file.startsWith('backup_'))
            .map(filename => path.join(mediasPath, filename));

        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        for (const file of files) {
            const stats = fs.statSync(file);

            if (stats.birthtime < oneMonthAgo)
                fs.unlinkSync(file);
        }
    }

    /**
     * Create a tar.gz file
     * @param sourceDir - The directory to create the tar.gz file from
     * @param outputPath - The path to save the tar.gz file
     * @returns A promise that resolves to void
     */
    private async createTarGz(sourceDir: string, outputPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const { spawn } = require('child_process');
            const dirName = path.basename(sourceDir);
            const parentDir = path.dirname(sourceDir);

            const tar = spawn('tar', [
                '-czf',
                outputPath,
                '-C', parentDir,
                dirName
            ]);

            tar.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    this.manualTarGz(sourceDir, outputPath)
                        .then(resolve)
                        .catch(reject);
                }
            });

            tar.on('error', (err) => {
                this.manualTarGz(sourceDir, outputPath)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /**
     * Create a tar.gz file
     * @param sourceDir - The directory to create the tar.gz file from
     * @param outputPath - The path to save the tar.gz file
     */
    private async manualTarGz(sourceDir: string, outputPath: string): Promise<void> {
        const files = fs.readdirSync(sourceDir);

        let concatenatedData = Buffer.concat(
            files.map(file => {
                const content = fs.readFileSync(path.join(sourceDir, file));
                const fileHeader = Buffer.from(`FILE:${file}:${content.length}\n`);
                return Buffer.concat([fileHeader, content]);
            })
        );

        const compressed = await this.gzip(concatenatedData);
        fs.writeFileSync(outputPath, compressed);
    }

    /**
     * Get all backups
     * @returns An array of backup files
     */
    async getBackups() {
        const mediasPath = path.join(cwd(), "medias", "backup");

        if (!fs.existsSync(mediasPath)) {
            return [];
        }

        try {
            const files = fs.readdirSync(mediasPath)
                .filter(file => file.endsWith('.tar.gz') && file.startsWith('backup_'))
                .map(filename => {
                    const filePath = path.join(mediasPath, filename);
                    const stats = fs.statSync(filePath);

                    let date = new Date();
                    try {
                        const datePart = filename.replace('backup_', '').replace('.tar.gz', '');
                        const [datePortion, timePortion] = datePart.split('_');
                        const [year, month, day] = datePortion.split('-').map(Number);
                        const [hour, minute] = timePortion.split('-').map(Number);
                        date = new Date(year, month - 1, day, hour, minute);
                    } catch (e) {
                        date = stats.birthtime;
                    }

                    return {
                        filename,
                        path: filePath,
                        size: stats.size,
                        created: date.toISOString(),
                        formattedSize: this.formatFileSize(stats.size)
                    };
                })
                .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

            return { data: files};
        } catch (error) {
            console.error(`Error getting backups: ${error}`);
            return [];
        }
    }

    /**
     * Format a file size
     * @param bytes - The size in bytes
     * @returns A string representing the size in a human-readable format
     */
    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    /**
     * Delete a backup file
     * @param filename - The filename of the backup file to delete
     * @returns A promise that resolves to an object containing a success property and a message property
     */
    async deleteBackup(filename: string) {
        const mediasPath = path.join(cwd(), "medias", "backup");
        const filePath = path.join(mediasPath, filename);

        if (fs.existsSync(filePath))
            fs.unlinkSync(filePath);

        return {
            success: true,
            message: "Backup deleted successfully"
        };
    }

    /**
     * Download a backup file
     * @param filename - The filename of the backup file to download
     * @returns A stream of the backup file
     */
    async downloadBackup(filename: string) {
        const mediasPath = path.join(cwd(), "medias", "backup");
        const filePath = path.join(mediasPath, filename);

        if (!fs.existsSync(filePath))
            throw new Error("Backup file not found");

        return fs.createReadStream(filePath);
    }

    /**
     * Create a backup of specific medias before deletion
     * @param mediaIds - Array of media IDs to backup
     * @returns Backup information
     */
    async backupMediasBeforeDeletion(mediaIds: string[]) {
        const mediasPath = path.join(cwd(), "medias", "backup");
        const imagesPath = path.join(cwd(), "medias", "images");

        if (!fs.existsSync(mediasPath))
            fs.mkdirSync(mediasPath, { recursive: true });

        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
        const backupPrefix = `medias_backup_${timestamp}`;
        const backupDirPath = path.join(mediasPath, backupPrefix);

        if (!fs.existsSync(backupDirPath))
            fs.mkdirSync(backupDirPath, { recursive: true });

        try {
            const MediasEntity = Repository.getEntity("MediasEntity");
            const blogStorageService = Application.resolveProvider(BlogStorageService);
            
            // Get media records that will be deleted
            const medias: any[] = [];
            const downloadedFiles: string[] = [];
            let apiUrl = Config.get<string>("blog.url", process.env.API_URL);
            
            if (apiUrl.endsWith("/"))
                apiUrl = apiUrl.slice(0, -1);

            for (const id of mediaIds) {
                const media = await Repository.findOne(MediasEntity, { id });
                if (media) {
                    medias.push(media);

                    // Download/copy image file
                    let imageBuffer: Buffer | null = null;
                    let filename = '';

                    if (media.filepath && fs.existsSync(media.filepath)) {
                        // Local file
                        imageBuffer = fs.readFileSync(media.filepath);
                        filename = path.basename(media.filepath);
                    } else if (media.filepath && media.filepath.startsWith('http')) {
                        // Remote file - download it
                        try {
                            console.log(`Downloading ${media.filepath} for backup...`);
                            const response = await fetch(media.filepath);
                            if (response.ok) {
                                const arrayBuffer = await response.arrayBuffer();
                                imageBuffer = Buffer.from(arrayBuffer);
                                filename = `${media.sha1}.${media.format}`;
                            }
                        } catch (error) {
                            console.error(`Failed to download ${media.filepath}:`, error);
                        }
                    } else if (media.sha1 && media.format) {
                        // Try to find by hash
                        const hashFilePath = path.join(imagesPath, `${media.sha1}.${media.format}`);
                        if (fs.existsSync(hashFilePath)) {
                            imageBuffer = fs.readFileSync(hashFilePath);
                            filename = `${media.sha1}.${media.format}`;
                        }
                    }

                    if (imageBuffer && filename) {
                        const backupFilePath = path.join(backupDirPath, filename);
                        fs.writeFileSync(backupFilePath, imageBuffer);
                        downloadedFiles.push(filename);

                        // Also backup thumbnail if exists
                        if (media.thumbnail) {
                            let thumbnailBuffer: Buffer | null = null;
                            let thumbnailFilename = '';

                            if (media.thumbnail.startsWith('http')) {
                                try {
                                    const response = await fetch(media.thumbnail);
                                    if (response.ok) {
                                        const arrayBuffer = await response.arrayBuffer();
                                        thumbnailBuffer = Buffer.from(arrayBuffer);
                                        thumbnailFilename = `${media.sha1}_thumb.webp`;
                                    }
                                } catch (error) {
                                    console.error(`Failed to download thumbnail ${media.thumbnail}:`, error);
                                }
                            } else {
                                const localThumbnailPath = media.thumbnail.replace(/.*\/images\//, path.join(cwd(), "medias", "images") + "/");
                                if (fs.existsSync(localThumbnailPath)) {
                                    thumbnailBuffer = fs.readFileSync(localThumbnailPath);
                                    thumbnailFilename = path.basename(localThumbnailPath);
                                }
                            }

                            if (thumbnailBuffer && thumbnailFilename) {
                                const backupThumbnailPath = path.join(backupDirPath, thumbnailFilename);
                                fs.writeFileSync(backupThumbnailPath, thumbnailBuffer);
                                downloadedFiles.push(thumbnailFilename);
                            }
                        }
                    }
                }
            }

            // Save medias database records as JSON
            const mediasDataPath = path.join(backupDirPath, 'medias_records.json');
            fs.writeFileSync(mediasDataPath, JSON.stringify(medias, null, 2));

            // Save backup metadata
            const metadataPath = path.join(backupDirPath, 'backup_metadata.json');
            const metadata = {
                type: 'medias_backup',
                timestamp,
                mediaIds,
                totalMedias: medias.length,
                downloadedFiles: downloadedFiles.length,
                apiUrl,
                created: now.toISOString()
            };
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

            // Create tar.gz archive
            const archivePath = path.join(mediasPath, `${backupPrefix}.tar.gz`);
            await this.createTarGz(backupDirPath, archivePath);

            // Clean up temporary directory
            for (const file of fs.readdirSync(backupDirPath))
                fs.unlinkSync(path.join(backupDirPath, file));
            fs.rmdirSync(backupDirPath);

            return {
                success: true,
                message: `Medias backup created successfully: ${medias.length} media records and ${downloadedFiles.length} files backed up`,
                filename: path.basename(archivePath),
                backupPath: archivePath,
                mediasCount: medias.length,
                filesCount: downloadedFiles.length
            };

        } catch (error) {
            console.error(`Error during medias backup: ${error instanceof Error ? error.message : String(error)}`);

            // Clean up on error
            if (fs.existsSync(backupDirPath)) {
                try {
                    for (const file of fs.readdirSync(backupDirPath))
                        fs.unlinkSync(path.join(backupDirPath, file));
                    fs.rmdirSync(backupDirPath);
                } catch (cleanupError) {
                    console.error(`Error during cleanup: ${cleanupError}`);
                }
            }

            throw error;
        }
    }

    /**
     * Rollback medias from a backup file
     * @param filename - The backup filename to restore from
     * @returns Rollback result
     */
    async rollbackMediasBackup(filename: string) {
        const mediasPath = path.join(cwd(), "medias", "backup");
        const imagesPath = path.join(cwd(), "medias", "images");
        const backupFilePath = path.join(mediasPath, filename);

        if (!fs.existsSync(backupFilePath))
            throw new Error("Backup file not found");

        const tempDir = path.join(mediasPath, `temp_restore_${Date.now()}`);
        
        try {
            // Extract backup
            if (!fs.existsSync(tempDir))
                fs.mkdirSync(tempDir, { recursive: true });

            await this.extractTarGz(backupFilePath, tempDir);

            // Read metadata
            const metadataPath = path.join(tempDir, 'backup_metadata.json');
            if (!fs.existsSync(metadataPath))
                throw new Error("Invalid backup file: metadata not found");

            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            if (metadata.type !== 'medias_backup')
                throw new Error("Invalid backup file: not a medias backup");

            // Read medias records
            const mediasDataPath = path.join(tempDir, 'medias_records.json');
            if (!fs.existsSync(mediasDataPath))
                throw new Error("Invalid backup file: medias records not found");

            const mediasRecords = JSON.parse(fs.readFileSync(mediasDataPath, 'utf8'));

            const MediasEntity = Repository.getEntity("MediasEntity");
            const blogStorageService = Application.resolveProvider(BlogStorageService);
            const storageType = Config.get("blog.storageType");
            
            let restoredRecords = 0;
            let restoredFiles = 0;
            let uploadedToCloud = 0;
            let apiUrl = Config.get<string>("blog.url", process.env.API_URL);
            
            if (apiUrl.endsWith("/"))
                apiUrl = apiUrl.slice(0, -1);

            // Ensure images directory exists
            if (!fs.existsSync(imagesPath))
                fs.mkdirSync(imagesPath, { recursive: true });

            for (const mediaRecord of mediasRecords) {
                try {
                    // Check if media record still exists (shouldn't if it was deleted)
                    const existingMedia = await Repository.findOne(MediasEntity, { id: mediaRecord.id });
                    
                    if (existingMedia) {
                        console.log(`Media record ${mediaRecord.id} still exists, skipping...`);
                        continue;
                    }

                    // Restore image file
                    let filename = '';
                    if (mediaRecord.sha1 && mediaRecord.format)
                        filename = `${mediaRecord.sha1}.${mediaRecord.format}`;
                    else if (mediaRecord.filepath)
                        filename = path.basename(mediaRecord.filepath);

                    if (filename) {
                        const backupImagePath = path.join(tempDir, filename);
                        if (fs.existsSync(backupImagePath)) {
                            const imageBuffer = fs.readFileSync(backupImagePath);
                            
                            // Decide where to restore the image
                            let finalImagePath = '';
                            let finalImageUrl = '';

                            if (storageType && (storageType === 'spaces' || storageType === 's3')) {
                                // Upload back to cloud storage
                                try {
                                    const uploadResult = await blogStorageService.uploadFile({
                                        buffer: imageBuffer,
                                        originalname: filename,
                                        mimetype: mediaRecord.format ? `image/${mediaRecord.format}` : 'image/jpeg'
                                    });

                                    if (uploadResult && uploadResult.url) {
                                        finalImagePath = uploadResult.url;
                                        finalImageUrl = uploadResult.url;
                                        uploadedToCloud++;
                                    } else {
                                        throw new Error('Upload failed');
                                    }
                                } catch (uploadError) {
                                    console.error(`Failed to upload ${filename} to cloud, saving locally:`, uploadError);
                                    // Fallback to local storage
                                    finalImagePath = path.join(imagesPath, filename);
                                    fs.writeFileSync(finalImagePath, imageBuffer);
                                    finalImageUrl = `${apiUrl}/images/${filename}`.toLowerCase();
                                }
                            } else {
                                // Restore to local storage
                                finalImagePath = path.join(imagesPath, filename);
                                fs.writeFileSync(finalImagePath, imageBuffer);
                                finalImageUrl = `${apiUrl}/images/${filename}`.toLowerCase();
                            }

                            restoredFiles++;

                            // Restore thumbnail if exists
                            let thumbnailUrl: string | null = null;
                            const thumbnailFilename = `${mediaRecord.sha1}_thumb.webp`;
                            const backupThumbnailPath = path.join(tempDir, thumbnailFilename);
                            
                            if (fs.existsSync(backupThumbnailPath)) {
                                const thumbnailBuffer = fs.readFileSync(backupThumbnailPath);
                                
                                if (storageType && (storageType === 'spaces' || storageType === 's3')) {
                                    try {
                                        const uploadResult = await blogStorageService.uploadFile({
                                            buffer: thumbnailBuffer,
                                            originalname: thumbnailFilename,
                                            mimetype: 'image/webp'
                                        });

                                        if (uploadResult && uploadResult.url) {
                                            thumbnailUrl = uploadResult.url;
                                        }
                                    } catch (uploadError) {
                                        console.error(`Failed to upload thumbnail ${thumbnailFilename} to cloud, saving locally:`, uploadError);
                                        const localThumbnailPath = path.join(imagesPath, thumbnailFilename);
                                        fs.writeFileSync(localThumbnailPath, thumbnailBuffer);
                                        thumbnailUrl = `${apiUrl}/images/${thumbnailFilename}`.toLowerCase();
                                    }
                                } else {
                                    const localThumbnailPath = path.join(imagesPath, thumbnailFilename);
                                    fs.writeFileSync(localThumbnailPath, thumbnailBuffer);
                                    thumbnailUrl = `${apiUrl}/images/${thumbnailFilename}`.toLowerCase();
                                }
                            }

                            // Restore database record
                            const restoreData = {
                                ...mediaRecord,
                                filepath: finalImagePath,
                                thumbnail: thumbnailUrl
                            };
                            delete restoreData.id; // Let database assign new ID

                            await Repository.insert(MediasEntity, restoreData);
                            restoredRecords++;
                        }
                    }
                } catch (error) {
                    console.error(`Error restoring media record ${mediaRecord.id}:`, error);
                }
            }

            // Clean up temp directory
            for (const file of fs.readdirSync(tempDir))
                fs.unlinkSync(path.join(tempDir, file));
            fs.rmdirSync(tempDir);

            const message = `Rollback completed: ${restoredRecords} media records and ${restoredFiles} files restored. ${uploadedToCloud} files uploaded to cloud storage.`;
            
            return {
                success: true,
                message,
                restoredRecords,
                restoredFiles,
                uploadedToCloud,
                metadata
            };

        } catch (error) {
            // Clean up temp directory on error
            if (fs.existsSync(tempDir)) {
                try {
                    for (const file of fs.readdirSync(tempDir))
                        fs.unlinkSync(path.join(tempDir, file));
                    fs.rmdirSync(tempDir);
                } catch (cleanupError) {
                    console.error(`Error during cleanup: ${cleanupError}`);
                }
            }

            throw error;
        }
    }

    /**
     * Extract a tar.gz file
     * @param archivePath - Path to the tar.gz file
     * @param outputDir - Directory to extract to
     */
    private async extractTarGz(archivePath: string, outputDir: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const { spawn } = require('child_process');
            
            const tar = spawn('tar', [
                '-xzf',
                archivePath,
                '-C',
                outputDir,
                '--strip-components=1'
            ]);

            tar.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    this.manualExtractTarGz(archivePath, outputDir)
                        .then(resolve)
                        .catch(reject);
                }
            });

            tar.on('error', (err) => {
                this.manualExtractTarGz(archivePath, outputDir)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /**
     * Manual extraction of tar.gz file (fallback)
     * @param archivePath - Path to the tar.gz file
     * @param outputDir - Directory to extract to
     */
    private async manualExtractTarGz(archivePath: string, outputDir: string): Promise<void> {
        const compressed = fs.readFileSync(archivePath);
        const gunzip = promisify(zlib.gunzip);
        const decompressed = await gunzip(compressed);
        
        // Simple extraction - this is a basic implementation
        // In a real scenario, you might want to use a proper tar parser
        const files = decompressed.toString('binary').split('FILE:');
        
        for (let i = 1; i < files.length; i++) {
            const parts = files[i].split('\n');
            if (parts.length >= 2) {
                const header = parts[0];
                const [filename, size] = header.split(':');
                
                if (filename && size) {
                    const content = parts.slice(1).join('\n').substring(0, parseInt(size));
                    const outputPath = path.join(outputDir, filename);
                    fs.writeFileSync(outputPath, content, 'binary');
                }
            }
        }
    }

    /**
     * Get media backups (filter only media backup files)
     * @returns Array of media backup files
     */
    async getMediaBackups() {
        const mediasPath = path.join(cwd(), "medias", "backup");

        if (!fs.existsSync(mediasPath)) {
            return { data: [] };
        }

        try {
            const files = fs.readdirSync(mediasPath)
                .filter(file => file.endsWith('.tar.gz') && file.startsWith('medias_backup_'))
                .map(filename => {
                    const filePath = path.join(mediasPath, filename);
                    const stats = fs.statSync(filePath);

                    let date = new Date();
                    try {
                        const datePart = filename.replace('medias_backup_', '').replace('.tar.gz', '');
                        const [datePortion, timePortion] = datePart.split('_');
                        const [year, month, day] = datePortion.split('-').map(Number);
                        const [hour, minute, second] = timePortion.split('-').map(Number);
                        date = new Date(year, month - 1, day, hour, minute, second || 0);
                    } catch (e) {
                        date = stats.birthtime;
                    }

                    return {
                        filename,
                        path: filePath,
                        size: stats.size,
                        created: date.toISOString(),
                        formattedSize: this.formatFileSize(stats.size),
                        type: 'medias_backup'
                    };
                })
                .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

            return { data: files };
        } catch (error) {
            console.error(`Error getting media backups: ${error}`);
            return { data: [] };
        }
    }
}
