import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { cwd } from "node:process";
import * as sharp from "sharp";

import {
    AbstractService,
    Config, Service,
    Application
} from "@cmmv/core";

import {
    Repository, In
} from "@cmmv/repository";

import {
    BlogStorageService
} from "../storage/storage.service";

@Service("blog_medias")
export class MediasService extends AbstractService {
    /**
     * Track progress for reprocessing images
     */
    private static reprocessProgress = {
        total: 0,
        processed: 0,
        status: 'idle',
        message: '',
        details: {
            scanned: 0,
            added: 0,
            removed: 0,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        }
    };

    /**
     * Get the current progress of reprocessing
     * @returns Progress information
     */
    async getReprocessProgress() {
        const progress = MediasService.reprocessProgress;
        const percentage = progress.total > 0
            ? Math.round((progress.processed / progress.total) * 100)
            : 0;

        const result = {
            ...progress,
            percentage
        };

        return result;
    }

    /**
     * Initialize progress tracker with a specific operation
     * @param operation The name of the operation (e.g., "cleaning", "reprocessing")
     * @param totalItems The expected total number of items to process (can be updated later)
     */
    async initializeProgress(operation: string, totalItems: number = 0) {
        this.resetProgress();
        MediasService.reprocessProgress.status = 'processing';
        MediasService.reprocessProgress.message = `Starting ${operation} operation...`;
        MediasService.reprocessProgress.total = totalItems;

        return {
            success: true,
            message: `Progress tracker initialized for ${operation}`
        };
    }

    /**
     * Reset progress tracker
     */
    private resetProgress() {
        MediasService.reprocessProgress = {
            total: 0,
            processed: 0,
            status: 'idle',
            message: '',
            details: {
                scanned: 0,
                added: 0,
                removed: 0,
                optimized: 0,
                failed: 0,
                bytes_saved: 0
            }
        };
    }

    /**
     * Get image URL
     * @param image - Image
     * @param format - Format
     * @param width - Width
     * @param height - Height
     * @param quality - Quality
     * @param alt - Alt text
     * @param caption - Caption
     * @returns Image URL
     */
    async getImageUrl(
        image: string,
        format: string = "webp",
        width?: number,
        height?: number,
        quality: number = 80,
        alt: string = "",
        caption: string = ""
    ) {
        if (!image)
            throw new Error("No image provided");

        if(image.startsWith("http"))
            return image;

        // Usar o diretório correto da aplicação
        const mediasPath = path.resolve(process.cwd(), "medias", "images");
        const blogStorageService = Application.resolveProvider(BlogStorageService);

        try {
            if(!fs.existsSync(mediasPath)) {
                fs.mkdirSync(mediasPath, { recursive: true });
            }
        } catch (error: any) {
            console.error('Error creating medias directory:', error);
            throw new Error(`Failed to create medias directory: ${error.message}`);
        }

        const originalFormatMatch = image.match(/^data:image\/(\w+);base64,/);
        const originalFormat = originalFormatMatch ? originalFormatMatch[1] : 'unknown';

        let apiUrl = Config.get<string>("blog.url", process.env.API_URL);

        if(apiUrl.endsWith("/"))
            apiUrl = apiUrl.slice(0, -1);

        const paramString = `${image}_${format}_${width}_${height}_${quality}`;
        const imageHash = crypto.createHash('sha1').update(paramString).digest('hex');
        const imageFullpath = path.join(mediasPath, `${imageHash}.${format}`);
        const imageUrl = `${apiUrl}/images/${imageHash}.${format}`;

        if(fs.existsSync(imageFullpath)) {
            const MediasEntity = Repository.getEntity("MediasEntity");
            const media = await Repository.findOne(MediasEntity, { sha1: imageHash });
            if (media) {
                return this.buildMediaUrl(media);
            }
        }

        const isValidImage = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/.test(image);

        if (!isValidImage) {
            console.error('Invalid image format provided');
            return null;
        }

        try {
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            // @ts-ignore
            let imageProcessor = sharp(buffer);
            let metadata = await imageProcessor.metadata();
            let finalImageBuffer: Buffer;

            if (format.toLowerCase() !== "gif") {
                const resizeOptions: sharp.ResizeOptions = {};
                if (width) resizeOptions.width = Math.round(width);
                if (height) resizeOptions.height = Math.round(height);

                if (width || height) {
                    imageProcessor = imageProcessor.resize(resizeOptions);
                } else {
                    // Obter configuração padrão de largura máxima
                    const maxWidth = Config.get<number>("blog.featureImage.width", 1920);
                    if (metadata.width > maxWidth) {
                        imageProcessor = imageProcessor.resize({ width: maxWidth });
                    }
                }

                const safeQuality = Math.max(10, Math.min(100, quality || 80));

                imageProcessor = imageProcessor.toFormat(format as any, { quality: safeQuality });
            }

            finalImageBuffer = await imageProcessor.toBuffer();
            // @ts-ignore
            const finalMetadata = await sharp(finalImageBuffer).metadata();
            
            const uploadedFile = await blogStorageService.uploadFile({
                buffer: Buffer.from(finalImageBuffer),
                originalname: `${imageHash}.${format}`,
                mimetype: `image/${format}`
            });

            const thumbnailUrl = await this.generateAndUploadThumbnail(buffer, imageHash, blogStorageService);
            const finalUrl = uploadedFile ? uploadedFile.url : imageUrl;

            const MediasEntity = Repository.getEntity("MediasEntity");
            const mediaExists = await Repository.findOne(MediasEntity, { sha1: imageHash });

            if (!mediaExists) {
                await Repository.insert(MediasEntity, {
                    sha1: imageHash,
                    filepath: finalUrl,
                    name: alt || imageHash,
                    format: format,
                    originalFormat: originalFormat,
                    width: finalMetadata.width,
                    height: finalMetadata.height,
                    alt: alt,
                    caption: caption,
                    size: finalImageBuffer.length,
                    thumbnail: thumbnailUrl
                });
            }

            if (!uploadedFile) {
                try {
                    await fs.promises.writeFile(imageFullpath, finalImageBuffer);
                } catch (writeError: any) {
                    console.error('Error writing file locally:', writeError);
                    throw new Error(`Failed to save image locally: ${writeError.message}`);
                }
            }

            return finalUrl.toLowerCase();

        } catch (error) {
            console.error('Error processing image:', error);
            return null;
        }
    }

    private async generateAndUploadThumbnail(originalBuffer: Buffer, imageHash: string, storageService: BlogStorageService): Promise<string | null> {
        try {
            // @ts-ignore
            const thumbnailBuffer = await sharp(originalBuffer)
                .resize(16, 16, { fit: 'cover', position: 'center' })
                .webp({ quality: 80 })
                .toBuffer();

            const uploadedThumbnail = await storageService.uploadFile({
                buffer: Buffer.from(thumbnailBuffer),
                originalname: `${imageHash}_thumb.webp`,
                mimetype: 'image/webp'
            });

            return uploadedThumbnail?.url || null;
        } catch (error) {
            console.error("Failed to generate thumbnail:", error);
            return null;
        }
    }

    /**
     * Get image with on-the-fly optimization
     * @param hash - Hash of the image file
     * @returns Optimized image buffer or null if not found
     */
    async getImage(hash: string) {
        const mediasPath = path.resolve(process.cwd(), "medias", "images");
        const imageFullpath = path.join(mediasPath, hash);

        if (!fs.existsSync(imageFullpath))
            return null;

        try {
            const originalStats = fs.statSync(imageFullpath);
            const originalSize = originalStats.size;
            const format = path.extname(imageFullpath).substring(1).toLowerCase();
            const isOptimizableFormat = ['jpeg', 'jpg', 'png', 'webp', 'avif'].includes(format);

            if (!isOptimizableFormat)
                return fs.readFileSync(imageFullpath);

            const imageBuffer = fs.readFileSync(imageFullpath);

            //@ts-ignore
            let processor = sharp(imageBuffer);
            const metadata = await processor.metadata();

            if (metadata.size && metadata.size < 10 * 1024)
                return imageBuffer;

            // Obter configuração padrão de qualidade
            const defaultQuality = Config.get<number>("blog.featureImage.quality", 60);

            switch (format) {
                case 'webp':
                    processor = processor.webp({
                        quality: defaultQuality,
                        lossless: false,
                        effort: 4
                    });
                    break;
                case 'jpeg':
                case 'jpg':
                    processor = processor.jpeg({
                        quality: defaultQuality,
                        progressive: true,
                        mozjpeg: true
                    });
                    break;
                case 'png':
                    processor = processor.png({
                        quality: defaultQuality,
                        compressionLevel: 9,
                        progressive: false,
                        adaptiveFiltering: true,
                        palette: metadata.width && metadata.width < 1000 ? true : false // Use palette for smaller images
                    });
                    break;
                case 'avif':
                    processor = processor.avif({
                        quality: defaultQuality,
                        lossless: false,
                        effort: 7
                    });
                    break;
                default:
                    // Use default settings if format is not recognized
                    break;
            }

            const optimizedBuffer = await processor.toBuffer();

            if (optimizedBuffer.length < originalSize * 0.9) {
                fs.writeFileSync(imageFullpath, optimizedBuffer);
                const MediasEntity = Repository.getEntity("MediasEntity");

                await Repository.update(MediasEntity, { sha1: hash.split('.')[0] }, {
                    size: optimizedBuffer.length
                }).catch(err => console.error('Failed to update media record:', err));

                return optimizedBuffer;
            }

            return imageBuffer;
        } catch (error) {
            return fs.readFileSync(imageFullpath);
        }
    }

    /**
     * Get medias
     * @param queries - Queries
     * @returns Medias
     */
    async getMedias(queries: any){
        const MediasEntity = Repository.getEntity("MediasEntity");
        delete queries.type;

        if(queries.type === "image")
            queries.format = In(["webp", "jpeg", "jpg", "png", "avif", "gif", "svg", "svg+xml"]);
        else if(queries.type === "video")
            queries.format = In(["mp4", "webm", "ogg", "mov", "avi", "wmv", "flv", "mkv", "m4v", "3gp", "3g2", "m3u8", "m3u"]);

        delete queries.t;

        const medias = await Repository.findAll(MediasEntity, queries);
        const apiUrl = Config.get<string>("blog.url", process.env.API_URL);
        const mediasPath = path.resolve(process.cwd(), "medias", "images");

        for(const media of medias?.data){
            if (media.sha1 && media.format && !media.filepath.startsWith("https://")) {
                media.format = media.format.toLowerCase(); //bugfix
                const hashFilePath = path.join(mediasPath, `${media.sha1}.${media.format}`);

                if (fs.existsSync(hashFilePath)) {
                    media.url = `${apiUrl}/images/${media.sha1}.${media.format}`;
                    continue;
                }
            }

            if(media.filepath && media.filepath.startsWith("https://")){
                media.url = media.filepath;
                continue;
            }
            else if (media.filepath && !media.filepath.startsWith("https://")) {
                const filename = path.basename(media.filepath);
                media.url = `${apiUrl}/images/${filename}`;
            } else {
                if (media.sha1 && media.format)
                    media.url = `${apiUrl}/images/${media.sha1}.${media.format}`;
                else
                    media.url = null;
            }

            media.url = media.url.toLowerCase();
        }

        return medias;
    }

    /**
     * Update media
     * @param id - ID
     * @param data - Data
     * @returns True if updated
     */
    async updateMedia(id: number, data: {
        alt: string;
        caption: string;
    }) {
        const MediasEntity = Repository.getEntity("MediasEntity");
        const media = await Repository.findOne(MediasEntity, { id });

        if(!media)
            throw new Error("Media not found");

        await Repository.update(MediasEntity, { id }, {
            alt: data.alt,
            caption: data.caption
        });

        return { result: true };
    }

    /**
     * Delete media
     * @param id - ID
     * @returns True if deleted
     */
    async deleteMedia(id: number) {
        const MediasEntity = Repository.getEntity("MediasEntity");
        const media = await Repository.findOne(MediasEntity, { id });

        if(!media)
            throw new Error("Media not found");

        // Remove from external storage if it's a remote URL
        if(media.filepath && media.filepath.startsWith('http')) {
            const blogStorageService = Application.resolveProvider(BlogStorageService);
            await blogStorageService.deleteFile(media.filepath);
        }

        // Remove thumbnail from external storage if it's a remote URL
        if(media.thumbnail && media.thumbnail.startsWith('http')) {
            const blogStorageService = Application.resolveProvider(BlogStorageService);
            await blogStorageService.deleteFile(media.thumbnail);
        }

        // Remove local files
        if(media.filepath && fs.existsSync(media.filepath))
            await fs.unlinkSync(media.filepath);

        // Remove local thumbnail
        if(media.thumbnail && !media.thumbnail.startsWith('http')) {
            const thumbnailPath = media.thumbnail.replace(/.*\/images\//, path.resolve(process.cwd(), "medias", "images") + "/");
            if (fs.existsSync(thumbnailPath)) {
                await fs.unlinkSync(thumbnailPath);
            }
        }

        await Repository.delete(MediasEntity, { id });

        return { result: true };
    }

    /**
     * Clean up orphaned media records in the database
     * This removes database entries that don't have corresponding files in the media directory
     * @param forceCleanup Force removal of orphaned records without looking for alternative files
     * @returns Statistics about the cleanup operation
     */
    async cleanupOrphanedRecords(forceCleanup: boolean = false) {
        this.resetProgress();
        MediasService.reprocessProgress.status = 'processing';
        MediasService.reprocessProgress.message = 'Scanning for orphaned database records...';
        MediasService.reprocessProgress.details.removed = 0;

        const mediasPath = path.resolve(process.cwd(), "medias", "images");

        if (!fs.existsSync(mediasPath)) {
            await fs.promises.mkdir(mediasPath, { recursive: true });

            MediasService.reprocessProgress.status = 'completed';
            MediasService.reprocessProgress.message = 'Media directory created, no cleanup needed.';

            return {
                success: true,
                message: "Media directory created, no cleanup needed.",
                removed: 0
            };
        }

        const files = await fs.promises.readdir(mediasPath);
        const physicalFiles = new Set(files);
        const physicalFilePaths = new Set();

        for (const file of files) {
            physicalFilePaths.add(path.join(mediasPath, file));
            physicalFilePaths.add(file);
        }

        const MediasEntity = Repository.getEntity("MediasEntity");

        try {
            const allMediasResult = await Repository.findAll(MediasEntity, {
                limit: 10000
            });
            const allMedias = allMediasResult?.data || [];

            if (allMedias.length === 0) {
                MediasService.reprocessProgress.status = 'completed';
                MediasService.reprocessProgress.message = 'No media records found in database.';

                return {
                    success: true,
                    message: "No media records found in database.",
                    removed: 0
                };
            }

            MediasService.reprocessProgress.message = `Found ${allMedias.length} media records in database. Checking for orphaned entries...`;
            MediasService.reprocessProgress.total = allMedias.length;
            MediasService.reprocessProgress.processed = 0;

            const orphanedRecords: string[] = [];
            const validRecords: any[] = [];

            for (let i = 0; i < allMedias.length; i++) {
                const media = allMedias[i];

                MediasService.reprocessProgress.processed = i + 1;

                if (i % 100 === 0 || i === allMedias.length - 1)
                    MediasService.reprocessProgress.message = `Checking media records: ${i+1} of ${allMedias.length}`;

                if (media.filepath && fs.existsSync(media.filepath)) {
                    validRecords.push(media);
                    continue;
                }

                if (media.sha1 && media.format) {
                    const expectedFilename = `${media.sha1}.${media.format}`;
                    if (physicalFiles.has(expectedFilename)) {
                        const correctPath = path.join(mediasPath, expectedFilename);
                        await Repository.update(MediasEntity, { id: media.id }, {
                            filepath: correctPath
                        });
                        validRecords.push(media);
                        continue;
                    }
                }

                if (media.filepath) {
                    const filename = path.basename(media.filepath);
                    if (physicalFiles.has(filename)) {
                        const correctPath = path.join(mediasPath, filename);
                        await Repository.update(MediasEntity, { id: media.id }, {
                            filepath: correctPath
                        });
                        validRecords.push(media);
                        continue;
                    }
                }

                if (!forceCleanup) {
                    const possibleFilepaths: string[] = [];

                    if (media.sha1) {
                        const commonExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif'];

                        if (media.format)
                            possibleFilepaths.push(path.join(mediasPath, `${media.sha1}.${media.format}`));

                        for (const ext of commonExtensions)
                            possibleFilepaths.push(path.join(mediasPath, `${media.sha1}.${ext}`));
                    }

                    if (media.filepath) {
                        const filename = path.basename(media.filepath);
                        const baseName = path.parse(filename).name;
                        const ext = path.parse(filename).ext.substring(1);

                        possibleFilepaths.push(path.join(mediasPath, filename));
                        const commonExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif'];

                        for (const e of commonExtensions) {
                            if (e !== ext)
                                possibleFilepaths.push(path.join(mediasPath, `${baseName}.${e}`));
                        }
                    }

                    let fileExists = false;
                    let foundPath = '';

                    for (const filepath of possibleFilepaths) {
                        if (fs.existsSync(filepath)) {
                            await Repository.update(MediasEntity, { id: media.id }, {
                                filepath: filepath
                            });
                            fileExists = true;
                            foundPath = filepath;
                            break;
                        }
                    }

                    if (fileExists) {
                        validRecords.push({...media, filepath: foundPath});
                        continue;
                    }
                }

                orphanedRecords.push(media.id);
            }

            if (orphanedRecords.length > 0) {
                MediasService.reprocessProgress.message = `Removing ${orphanedRecords.length} orphaned database records...`;
                const batchSize = 100;

                for (let i = 0; i < orphanedRecords.length; i += batchSize) {
                    const batch = orphanedRecords.slice(i, i + batchSize);
                    await Repository.delete(MediasEntity, { id: In(batch) as any });
                }

                MediasService.reprocessProgress.details.removed = orphanedRecords.length;
            }

            const resultMessage = `Cleanup completed: ${orphanedRecords.length} orphaned records removed from database (${validRecords.length} valid records kept). Started with ${allMedias.length} total records, now have ${validRecords.length}.`;
            MediasService.reprocessProgress.status = 'completed';
            MediasService.reprocessProgress.message = resultMessage;

            return {
                success: true,
                message: resultMessage,
                removed: orphanedRecords.length,
                valid: validRecords.length,
                total: allMedias.length
            };

        } catch (error: any) {
            console.error('Error during cleanup of orphaned records:', error);
            MediasService.reprocessProgress.status = 'error';
            MediasService.reprocessProgress.message = `Error: ${error.message || 'Unknown error during cleanup'}`;

            throw error;
        }
    }

    /**
     * Remove duplicate images with numeric suffixes (-1, -2, etc.)
     * @returns Statistics about the removed duplicates
     */
    async cleanupDuplicatedImages() {
        interface FileInfo {
            filename: string;
            fullPath: string;
            duplicates: DuplicateFile[];
        }

        interface DuplicateFile {
            filename: string;
            fullPath: string;
            originalFilename: string;
            originalFullPath: string;
            suffix: number;
        }

        this.resetProgress();
        MediasService.reprocessProgress.status = 'processing';
        MediasService.reprocessProgress.message = 'Scanning for duplicate images with numeric suffixes...';

        const mediasPath = path.resolve(process.cwd(), "medias", "images");
        const MediasEntity = Repository.getEntity("MediasEntity");

        if (!fs.existsSync(mediasPath)) {
            await fs.promises.mkdir(mediasPath, { recursive: true });

            MediasService.reprocessProgress.status = 'completed';
            MediasService.reprocessProgress.message = 'Media directory created, no cleanup needed.';

            return {
                success: true,
                message: "Media directory created, no cleanup needed.",
                removed: 0
            };
        }

        const files = await fs.promises.readdir(mediasPath);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase().substring(1);
            return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(ext);
        });

        MediasService.reprocessProgress.message = `Found ${imageFiles.length} image files. Checking for duplicates...`;
        MediasService.reprocessProgress.total = imageFiles.length;
        MediasService.reprocessProgress.processed = 0;

        const fileMap = new Map<string, FileInfo>();
        const duplicateRegex = /^(.+)-(\d+)(\..+)$/;

        for (const file of imageFiles) {
            const match = file.match(duplicateRegex);

            if (!match) {
                const baseName = path.parse(file).name;
                const ext = path.parse(file).ext;
                fileMap.set(baseName + ext, {
                    filename: file,
                    fullPath: path.join(mediasPath, file),
                    duplicates: []
                });
            }

            MediasService.reprocessProgress.processed++;
        }

        MediasService.reprocessProgress.processed = 0;
        MediasService.reprocessProgress.message = "Identifying duplicate files...";

        const duplicatesToRemove: DuplicateFile[] = [];

        for (const file of imageFiles) {
            const match = file.match(duplicateRegex);
            if (match) {
                const originalBaseName = match[1];
                const suffix = match[2];
                const ext = match[3];
                const originalFilename = originalBaseName + ext;

                if (fileMap.has(originalFilename)) {
                    const originalFileInfo = fileMap.get(originalFilename)!;

                    const duplicate: DuplicateFile = {
                        filename: file,
                        fullPath: path.join(mediasPath, file),
                        originalFilename,
                        originalFullPath: originalFileInfo.fullPath,
                        suffix: parseInt(suffix)
                    };

                    duplicatesToRemove.push(duplicate);
                    originalFileInfo.duplicates.push(duplicate);
                } else {
                    fileMap.set(originalBaseName + "-" + suffix + ext, {
                        filename: file,
                        fullPath: path.join(mediasPath, file),
                        duplicates: []
                    });
                }
            }

            MediasService.reprocessProgress.processed++;
        }

        MediasService.reprocessProgress.processed = 0;
        MediasService.reprocessProgress.total = duplicatesToRemove.length;
        MediasService.reprocessProgress.message = `Found ${duplicatesToRemove.length} duplicate files. Removing...`;

        let removedCount = 0;

        for (let i = 0; i < duplicatesToRemove.length; i++) {
            const duplicate = duplicatesToRemove[i];
            MediasService.reprocessProgress.processed = i + 1;

            try {
                const recordsUsingDuplicate = await Repository.findAll(MediasEntity, {
                    filepath: duplicate.fullPath
                });

                if (recordsUsingDuplicate && recordsUsingDuplicate.data && recordsUsingDuplicate.data.length > 0) {
                    for (const record of recordsUsingDuplicate.data) {
                        await Repository.update(MediasEntity, { id: record.id }, {
                            filepath: duplicate.originalFullPath
                        });
                    }
                }

                await fs.promises.unlink(duplicate.fullPath);
                removedCount++;

            } catch (error) {
                console.error(`Error removing duplicate ${duplicate.filename}:`, error);
            }
        }

        const resultMessage = `Cleanup completed: ${removedCount} duplicate files removed from ${duplicatesToRemove.length} identified.`;
        MediasService.reprocessProgress.status = 'completed';
        MediasService.reprocessProgress.message = resultMessage;

        return {
            success: true,
            message: resultMessage,
            removed: removedCount,
            identified: duplicatesToRemove.length
        };
    }

    /**
     * Reprocess all images in the media directory
     * - Remove database records that don't have corresponding files
     * - Add records for files that exist but aren't in the database
     * - Optimize all images for better performance
     * @returns Statistics about the operation
     */
    async reprocessAllImages() {
        this.resetProgress();
        MediasService.reprocessProgress.status = 'processing';
        MediasService.reprocessProgress.message = 'Starting image reprocessing...';

        const mediasPath = path.resolve(process.cwd(), "medias", "images");

        if (!fs.existsSync(mediasPath)) {
            await fs.promises.mkdir(mediasPath, { recursive: true });

            MediasService.reprocessProgress.status = 'completed';
            MediasService.reprocessProgress.message = 'Media directory created, no images to process.';

            return {
                success: true,
                message: "Media directory created, no images to process.",
                stats: { scanned: 0, added: 0, removed: 0, optimized: 0, failed: 0, bytes_saved: 0 }
            };
        }

        MediasService.reprocessProgress.message = 'Cleaning up duplicated images...';
        const duplicatesResult = await this.cleanupDuplicatedImages();

        MediasService.reprocessProgress.message = 'Cleaning up orphaned database records...';
        const cleanupResult = await this.cleanupOrphanedRecords();

        const files = await fs.promises.readdir(mediasPath);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase().substring(1);
            return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(ext);
        });

        MediasService.reprocessProgress.message = `Found ${imageFiles.length} image files to process.`;
        MediasService.reprocessProgress.total = imageFiles.length;
        MediasService.reprocessProgress.processed = 0;

        const MediasEntity = Repository.getEntity("MediasEntity");
        const allMediasResult = await Repository.findAll(MediasEntity, {});
        const allMedias = allMediasResult?.data || [];

        const fileHashMap = new Map();
        const filePathMap = new Map();

        for (const file of imageFiles) {
            const fullPath = path.join(mediasPath, file);
            const fileStats = fs.statSync(fullPath);

            if (!fileStats.isFile()) continue;

            const fileParts = path.parse(file);

            if (/^[a-f0-9]{40}$/i.test(fileParts.name))
                fileHashMap.set(fileParts.name, file);

            filePathMap.set(fullPath, file);
        }

        const dbHashMap = new Map();
        const dbPathMap = new Map();

        for (const media of allMedias) {
            if (media.sha1)
                dbHashMap.set(media.sha1, media);

            if (media.filepath)
                dbPathMap.set(media.filepath, media);
        }

        const stats = {
            scanned: imageFiles.length,
            added: 0,
            removed: cleanupResult.removed,
            optimized: 0,
            failed: 0,
            bytes_saved: 0
        };

        MediasService.reprocessProgress.details = stats;

        for (const [hash, filename] of Array.from(fileHashMap.entries())) {
            try {
                MediasService.reprocessProgress.message = `Processing image: ${filename}`;
                const fullPath = path.join(mediasPath, filename);
                const fileStats = fs.statSync(fullPath);
                const originalSize = fileStats.size;
                const ext = path.extname(filename).substring(1).toLowerCase();
                const existingMediaByHash = dbHashMap.get(hash);

                if (existingMediaByHash && existingMediaByHash.filepath !== fullPath) {
                    await Repository.update(MediasEntity, { id: existingMediaByHash.id }, {
                        filepath: fullPath,
                        format: ext
                    });
                }

                const imageBuffer = fs.readFileSync(fullPath);

                if (originalSize < 5 * 1024) {
                    if (!existingMediaByHash) {
                        try {
                            //@ts-ignore
                            const metadata = await sharp(imageBuffer).metadata();
                            // Make sure width and height are valid before inserting
                            if (metadata.width && metadata.height && metadata.width > 0 && metadata.height > 0) {
                                await Repository.insert(MediasEntity, {
                                    sha1: hash,
                                    filepath: fullPath,
                                    format: ext,
                                    width: metadata.width,
                                    height: metadata.height,
                                    size: originalSize,
                                    alt: '',
                                    caption: ''
                                });
                                stats.added++;
                                MediasService.reprocessProgress.details.added = stats.added;
                            } else {
                                console.error(`Skipping invalid image ${filename}: Missing or invalid dimensions (${metadata.width}x${metadata.height})`);
                                stats.failed++;
                                MediasService.reprocessProgress.details.failed = stats.failed;
                            }
                        } catch (error) {
                            console.error(`Error processing small image ${filename}:`, error);
                            stats.failed++;
                            MediasService.reprocessProgress.details.failed = stats.failed;
                        }
                    }

                    MediasService.reprocessProgress.processed++;
                    continue;
                }

                await this.optimizeImage(hash, fullPath, filename, ext, imageBuffer, originalSize, existingMediaByHash, stats);

            } catch (error) {
                console.error(`Failed to process file ${filename}:`, error);
                stats.failed++;
                MediasService.reprocessProgress.details.failed = stats.failed;
            }

            MediasService.reprocessProgress.processed++;
        }

        const processedPaths = new Set();

        for (const [filepath, filename] of Array.from(filePathMap.entries())) {
            const fileParts = path.parse(filename);

            if (/^[a-f0-9]{40}$/i.test(fileParts.name)) {
                processedPaths.add(filepath);
                continue;
            }

            if (processedPaths.has(filepath))
                continue;

            try {
                MediasService.reprocessProgress.message = `Processing imported image: ${filename}`;
                const fullPath = filepath;
                const fileStats = fs.statSync(fullPath);
                const originalSize = fileStats.size;
                const ext = path.extname(filename).substring(1).toLowerCase();
                const existingMediaByPath = dbPathMap.get(fullPath);
                const imageBuffer = fs.readFileSync(fullPath);

                const contentHash = crypto.createHash('sha1').update(imageBuffer).digest('hex');
                const existingMediaByHash = dbHashMap.get(contentHash);

                if (existingMediaByHash && existingMediaByPath && existingMediaByHash.id !== existingMediaByPath.id) {
                    await Repository.update(MediasEntity, { id: existingMediaByPath.id }, {
                        sha1: contentHash
                    });

                    await Repository.delete(MediasEntity, { id: existingMediaByHash.id });
                    const mediaToUse = existingMediaByPath;

                    await this.optimizeImage(contentHash, fullPath, filename, ext, imageBuffer, originalSize, mediaToUse, stats);
                } else if (existingMediaByHash && !existingMediaByPath) {
                    await Repository.update(MediasEntity, { id: existingMediaByHash.id }, {
                        filepath: fullPath
                    });

                    await this.optimizeImage(contentHash, fullPath, filename, ext, imageBuffer, originalSize, existingMediaByHash, stats);
                } else if (!existingMediaByHash && existingMediaByPath) {
                    await Repository.update(MediasEntity, { id: existingMediaByPath.id }, {
                        sha1: contentHash
                    });

                    await this.optimizeImage(contentHash, fullPath, filename, ext, imageBuffer, originalSize, existingMediaByPath, stats);
                } else {
                    if (originalSize < 5 * 1024) {
                        if (!existingMediaByHash && !existingMediaByPath) {
                            try {
                                //@ts-ignore
                                const metadata = await sharp(imageBuffer).metadata();
                                // Make sure width and height are valid before inserting
                                if (metadata.width && metadata.height && metadata.width > 0 && metadata.height > 0) {
                                    await Repository.insert(MediasEntity, {
                                        sha1: contentHash,
                                        filepath: fullPath,
                                        format: ext,
                                        width: metadata.width,
                                        height: metadata.height,
                                        size: originalSize,
                                        alt: '',
                                        caption: ''
                                    });
                                    stats.added++;
                                    MediasService.reprocessProgress.details.added = stats.added;
                                } else {
                                    console.error(`Skipping invalid imported image ${filename}: Missing or invalid dimensions (${metadata.width}x${metadata.height})`);
                                    stats.failed++;
                                    MediasService.reprocessProgress.details.failed = stats.failed;
                                }
                            } catch (error) {
                                console.error(`Error processing small imported image ${filename}:`, error);
                                stats.failed++;
                                MediasService.reprocessProgress.details.failed = stats.failed;
                            }
                        }
                    } else {
                        const mediaToUse = existingMediaByHash || existingMediaByPath;
                        await this.optimizeImage(contentHash, fullPath, filename, ext, imageBuffer, originalSize, mediaToUse, stats);
                    }
                }

                processedPaths.add(filepath);

            } catch (error) {
                console.error(`Failed to process imported file ${filename}:`, error);
                stats.failed++;
                MediasService.reprocessProgress.details.failed = stats.failed;
            }

            MediasService.reprocessProgress.processed++;
        }

        const megabytes_saved = (stats.bytes_saved / (1024 * 1024)).toFixed(2);
        const resultMessage = `Processed ${stats.scanned} images: ${stats.optimized} optimized, ${stats.added} added to DB, ${stats.removed} removed from DB, ${stats.failed} failed. Total space saved: ${megabytes_saved} MB`;

        MediasService.reprocessProgress.status = 'completed';
        MediasService.reprocessProgress.message = resultMessage;

        return {
            success: true,
            message: resultMessage,
            stats
        };
    }

    /**
     * Helper method to optimize an image with Sharp
     * @param hash The hash (sha1) of the image
     * @param fullPath The full path to the image file
     * @param filename The filename of the image
     * @param ext The extension/format of the image
     * @param imageBuffer The buffer containing the image data
     * @param originalSize The original size of the image
     * @param existingMedia Existing media record if any
     * @param stats Statistics object to update
     */
    private async optimizeImage(
        hash: string,
        fullPath: string,
        filename: string,
        ext: string,
        imageBuffer: Buffer,
        originalSize: number,
        existingMedia: any,
        stats: any
    ) {
        try {
            const MediasEntity = Repository.getEntity("MediasEntity");

            //@ts-ignore
            let processor = sharp(imageBuffer);
            const metadata = await processor.metadata();

            // Obter configuração padrão de qualidade
            const defaultQuality = Config.get<number>("blog.featureImage.quality", 60);

            switch (ext) {
                case 'webp':
                    processor = processor.webp({
                        quality: defaultQuality,
                        lossless: false,
                        effort: 4
                    });
                    break;
                case 'jpeg':
                case 'jpg':
                    processor = processor.jpeg({
                        quality: defaultQuality,
                        progressive: true,
                        mozjpeg: true
                    });
                    break;
                case 'png':
                    processor = processor.png({
                        quality: defaultQuality,
                        compressionLevel: 9,
                        progressive: false,
                        adaptiveFiltering: true,
                        palette: metadata.width && metadata.width < 1000 ? true : false
                    });
                    break;
                case 'avif':
                    processor = processor.avif({
                        quality: defaultQuality,
                        lossless: false,
                        effort: 7
                    });
                    break;
                default:
                    // For other formats, just get metadata
                    break;
            }

            if (['webp', 'jpeg', 'jpg', 'png', 'avif'].includes(ext)) {
                const optimizedBuffer = await processor.toBuffer();

                if (optimizedBuffer.length < originalSize * 0.95) {
                    await fs.promises.writeFile(fullPath, optimizedBuffer);
                    stats.bytes_saved += (originalSize - optimizedBuffer.length);
                    stats.optimized++;
                    MediasService.reprocessProgress.details.bytes_saved = stats.bytes_saved;
                    MediasService.reprocessProgress.details.optimized = stats.optimized;

                    if (existingMedia) {
                        await Repository.update(MediasEntity, { id: existingMedia.id }, {
                            size: optimizedBuffer.length,
                            width: metadata.width,
                            height: metadata.height,
                            filepath: fullPath,
                            sha1: hash,
                            format: ext
                        });
                    } else {
                        // Make sure dimensions are valid
                        if (metadata.width && metadata.height && metadata.width > 0 && metadata.height > 0) {
                            await Repository.insert(MediasEntity, {
                                sha1: hash,
                                filepath: fullPath,
                                format: ext,
                                width: metadata.width,
                                height: metadata.height,
                                size: optimizedBuffer.length,
                                alt: '',
                                caption: ''
                            });
                            stats.added++;
                            MediasService.reprocessProgress.details.added = stats.added;
                        } else {
                            console.error(`Skipping invalid image ${filename}: Missing or invalid dimensions (${metadata.width}x${metadata.height})`);
                            stats.failed++;
                            MediasService.reprocessProgress.details.failed = stats.failed;
                        }
                    }
                } else {
                    if (!existingMedia) {
                        // Make sure dimensions are valid
                        if (metadata.width && metadata.height && metadata.width > 0 && metadata.height > 0) {
                            await Repository.insert(MediasEntity, {
                                sha1: hash,
                                filepath: fullPath,
                                format: ext,
                                width: metadata.width,
                                height: metadata.height,
                                size: originalSize,
                                alt: '',
                                caption: ''
                            });
                            stats.added++;
                            MediasService.reprocessProgress.details.added = stats.added;
                        } else {
                            console.error(`Skipping invalid image ${filename}: Missing or invalid dimensions (${metadata.width}x${metadata.height})`);
                            stats.failed++;
                            MediasService.reprocessProgress.details.failed = stats.failed;
                        }
                    } else {
                        await Repository.update(MediasEntity, { id: existingMedia.id }, {
                            filepath: fullPath,
                            sha1: hash,
                            format: ext
                        });
                    }
                }
            } else {
                if (!existingMedia) {
                    // Make sure dimensions are valid
                    if (metadata.width && metadata.height && metadata.width > 0 && metadata.height > 0) {
                        await Repository.insert(MediasEntity, {
                            sha1: hash,
                            filepath: fullPath,
                            format: ext,
                            width: metadata.width || 0,
                            height: metadata.height || 0,
                            size: originalSize,
                            alt: '',
                            caption: ''
                        });
                        stats.added++;
                        MediasService.reprocessProgress.details.added = stats.added;
                    } else {
                        console.error(`Skipping invalid image ${filename}: Missing or invalid dimensions (${metadata.width}x${metadata.height})`);
                        stats.failed++;
                        MediasService.reprocessProgress.details.failed = stats.failed;
                    }
                } else {
                    await Repository.update(MediasEntity, { id: existingMedia.id }, {
                        filepath: fullPath,
                        sha1: hash,
                        format: ext
                    });
                }
            }
        } catch (error) {
            console.error(`Error optimizing image ${filename}:`, error);
            stats.failed++;
            MediasService.reprocessProgress.details.failed = stats.failed;

            if (!existingMedia) {
                try {
                    console.error(`Cannot validate image dimensions for ${filename} due to processing error`);
                    stats.failed++;
                    MediasService.reprocessProgress.details.failed = stats.failed;
                    stats.added++;
                    MediasService.reprocessProgress.details.added = stats.added;
                } catch (err) {
                    console.error(`Failed to add record for ${filename}:`, err);
                }
            }
        }
    }

    /**
     * Import an image from a URL
     * @param url The URL of the image
     * @param alt The alt text of the image
     * @param caption The caption of the image
     * @returns The imported image
     */
    async importFromUrl(url: string, alt: string, caption: string) {
        try {
            // Preserve query parameters (some CDNs like HLTV need them)
            // Only remove fragment (#)
            const cleanUrl = url.split('#')[0];
            
            // Extract filename early (needed for retry logic)
            let filename = cleanUrl.split('/').pop() || 'image';
            if (filename && filename.includes('?')) {
                filename = filename.split('?')[0];
            }
            
            // Parse URL to get origin and path
            const urlObj = new URL(cleanUrl);
            
            // Detect CDN/host and choose optimal headers strategy
            // Some CDNs (like HLTV) work better with minimal headers
            const isHLTV = cleanUrl.includes('img-cdn.hltv.org') || cleanUrl.includes('hltv.org');
            
            // Fetch with proper headers for image requests
            // Use minimal headers for HLTV CDN (proven to work), full headers for others
            const response = await fetch(cleanUrl, {
                headers: isHLTV ? {
                    // Minimal headers work best for HLTV CDN
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*',
                } : {
                    // Full browser headers for other CDNs
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,pt-BR,pt;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': `${urlObj.origin}/`,
                    'Origin': urlObj.origin,
                    'Sec-Fetch-Dest': 'image',
                    'Sec-Fetch-Mode': 'no-cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                },
                redirect: 'follow',
            });

            if (!response.ok) {
                // For 403 errors, try multiple strategies as fallback
                if (response.status === 403) {
                    console.log(`Received 403 Forbidden for ${cleanUrl}, trying alternative strategies...`);
                    
                    // Strategy 1: Try with minimal headers
                    let retryStrategies = [
                        {
                            name: 'minimal headers',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': 'image/*',
                            }
                        },
                        {
                            name: 'no referer',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                            }
                        },
                        {
                            name: 'chrome headers',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Referer': 'https://www.hltv.org/',
                                'Origin': 'https://www.hltv.org',
                            }
                        }
                    ];
                    
                    for (const strategy of retryStrategies) {
                        try {
                            console.log(`Trying ${strategy.name} for ${cleanUrl}...`);
                            const retryResponse = await fetch(cleanUrl, {
                                headers: strategy.headers,
                                redirect: 'follow',
                            });
                            
                            if (retryResponse.ok) {
                                console.log(`Success with ${strategy.name} for ${cleanUrl}`);
                                
                                // Use retry response
                                const retryBuffer = await retryResponse.arrayBuffer();
                                const retryImageBuffer = Buffer.from(retryBuffer);
                                
                                console.log(`Downloaded ${retryImageBuffer.length} bytes with ${strategy.name}`);
                                
                                if (retryImageBuffer && retryImageBuffer.length > 0) {
                                    const retryContentType = retryResponse.headers.get('content-type') || '';
                                    const retryExt = path.extname(filename).substring(1).toLowerCase() || 
                                                   (retryContentType.includes('jpeg') ? 'jpg' :
                                                    retryContentType.includes('png') ? 'png' :
                                                    retryContentType.includes('webp') ? 'webp' : 'jpg');
                                    
                                    console.log(`Processing image with format detection: ext=${retryExt}, contentType=${retryContentType}`);
                                    
                                    // Process retry image
                                    try {
                                        const retryMetadata = await sharp(retryImageBuffer).metadata();
                                        console.log(`Image metadata: format=${retryMetadata.format}, width=${retryMetadata.width}, height=${retryMetadata.height}`);
                                        
                                        if (retryMetadata.format && retryMetadata.width && retryMetadata.height) {
                                            const defaultWidth = Config.get<number>("blog.featureImage.width", 1920);
                                            const defaultHeight = Config.get<number>("blog.featureImage.height", 1080);
                                            const defaultFormat = Config.get<string>("blog.featureImage.format", "webp");
                                            const defaultQuality = Config.get<number>("blog.featureImage.quality", 80);
                                            
                                            console.log(`Calling getImageUrl for processing...`);
                                            const base64 = retryImageBuffer.toString('base64');
                                            const imageUrl = `data:image/${retryExt};base64,${base64}`;
                                            const imageUrlResponse = await this.getImageUrl(imageUrl, defaultFormat, defaultWidth, defaultHeight, defaultQuality, alt, caption);
                                            
                                            if (imageUrlResponse) {
                                                console.log(`Successfully processed image with ${strategy.name}, returning result`);
                                                return {
                                                    success: true,
                                                    message: `Image imported successfully (using ${strategy.name} strategy)`,
                                                    url: imageUrlResponse
                                                };
                                            } else {
                                                console.error(`getImageUrl returned null/undefined for ${cleanUrl}`);
                                            }
                                        } else {
                                            console.error(`Invalid metadata: format=${retryMetadata.format}, width=${retryMetadata.width}, height=${retryMetadata.height}`);
                                        }
                                    } catch (sharpError) {
                                        const errorMsg = sharpError instanceof Error ? sharpError.message : String(sharpError);
                                        console.error(`Sharp processing failed with ${strategy.name}: ${errorMsg}`);
                                        // Continue to next strategy - this one failed processing
                                    }
                                } else {
                                    console.error(`Empty buffer received with ${strategy.name}`);
                                }
                            } else {
                                console.log(`${strategy.name} failed: HTTP ${retryResponse.status}`);
                            }
                        } catch (retryError) {
                            const errorMsg = retryError instanceof Error ? retryError.message : String(retryError);
                            console.error(`Error in ${strategy.name} strategy: ${errorMsg}`);
                            // Continue to next strategy
                            continue;
                        }
                    }
                    
                    // All strategies failed
                    console.error(`All retry strategies failed for ${cleanUrl}. CDN is blocking all requests.`);
                }
                
                // Return error object instead of throwing for 404/other HTTP errors
                const statusMessage = response.status === 404 
                    ? 'Image not found (404). The URL may be broken or the image was removed.' 
                    : `Failed to fetch image: HTTP ${response.status} ${response.statusText}`;
                
                return {
                    success: false,
                    message: statusMessage,
                    url: null
                };
            }

            // Check Content-Type
            const contentType = response.headers.get('content-type') || '';
            const isImage = contentType.startsWith('image/');
            
            if (!isImage) {
                // Try to detect from URL extension
                const urlExt = path.extname(new URL(cleanUrl).pathname).substring(1).toLowerCase();
                const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];
                if (!imageExts.includes(urlExt)) {
                    throw new Error(`URL does not appear to be an image. Content-Type: ${contentType}`);
                }
            }

            const buffer = await response.arrayBuffer();
            const imageBuffer = Buffer.from(buffer);

            // Validate buffer is not empty
            if (!imageBuffer || imageBuffer.length === 0) {
                throw new Error('Received empty image buffer');
            }

            // filename is already defined above (before retry logic)

            const ext = path.extname(filename).substring(1).toLowerCase() || 
                       (contentType.includes('jpeg') ? 'jpg' :
                        contentType.includes('png') ? 'png' :
                        contentType.includes('webp') ? 'webp' :
                        contentType.includes('gif') ? 'gif' :
                        contentType.includes('svg') ? 'svg' : 'jpg');

            try {
                // @ts-ignore
                const metadata = await sharp(imageBuffer).metadata();

                // Validate image format
                if (!metadata.format) {
                    console.error(`Unsupported image format for URL: ${cleanUrl}. Buffer size: ${imageBuffer.length} bytes`);
                    throw new Error(`Unsupported image format. Content-Type: ${contentType}, Buffer size: ${imageBuffer.length} bytes`);
                }

                if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
                    console.error(`Invalid image dimensions (${metadata.width}x${metadata.height}) for URL: ${cleanUrl}`);
                    return {
                        success: false,
                        message: "Invalid image: Missing or invalid dimensions",
                        url: null
                    };
                }

                // Obter configurações padrão do sistema
                const defaultWidth = Config.get<number>("blog.featureImage.width", 1920);
                const defaultHeight = Config.get<number>("blog.featureImage.height", 1080);
                const defaultFormat = Config.get<string>("blog.featureImage.format", "webp");
                const defaultQuality = Config.get<number>("blog.featureImage.quality", 80);

                // Convert to base64
                const base64 = imageBuffer.toString('base64');
                const imageUrl = `data:image/${ext};base64,${base64}`;
                const imageUrlResponse = await this.getImageUrl(imageUrl, defaultFormat, defaultWidth, defaultHeight, defaultQuality, alt, caption);

                if (!imageUrlResponse) {
                    return {
                        success: false,
                        message: "Failed to process image",
                        url: null
                    };
                }

                return {
                    success: true,
                    message: "Image imported successfully",
                    url: imageUrlResponse
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Error processing image from URL ${cleanUrl}:`, errorMessage);
                
                // Check for network/HTTP errors that weren't caught above
                if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
                    return {
                        success: false,
                        message: `Network error: Unable to reach the image URL. The server may be down or unreachable.`,
                        url: null
                    };
                }
                
                // Provide more specific error messages
                if (errorMessage.includes('unsupported image format') || errorMessage.includes('Input buffer')) {
                    // Try to detect if it's actually HTML or text instead of image
                    // Note: imageBuffer and contentType are in outer scope
                    if (typeof imageBuffer !== 'undefined' && imageBuffer && imageBuffer.length > 0) {
                        const isText = (
                            imageBuffer.toString('utf8', 0, Math.min(100, imageBuffer.length)).trim().startsWith('<') ||
                            imageBuffer.toString('utf8', 0, Math.min(100, imageBuffer.length)).includes('<!DOCTYPE')
                        );
                        
                        if (isText) {
                            return {
                                success: false,
                                message: `URL returned HTML/text instead of image. Server may be blocking image requests or URL is incorrect.`,
                                url: null
                            };
                        }
                        
                        return {
                            success: false,
                            message: `Unsupported image format. Received ${imageBuffer.length} bytes. Content-Type: ${typeof contentType !== 'undefined' ? contentType : 'unknown'}`,
                            url: null
                        };
                    }
                    
                    return {
                        success: false,
                        message: `Unsupported image format: ${errorMessage}`,
                        url: null
                    };
                }
                
                return {
                    success: false,
                    message: `Image processing error: ${errorMessage}`,
                    url: null
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error fetching URL ${url}:`, errorMessage);
            
            // Provide more specific error messages
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ECONNREFUSED')) {
                return {
                    success: false,
                    message: `Network error: Could not connect to image server.`,
                    url: null
                };
            }
            
            if (errorMessage.includes('HTTP')) {
                return {
                    success: false,
                    message: errorMessage,
                    url: null
                };
            }
            
            return {
                success: false,
                message: `Failed to fetch image: ${errorMessage}`,
                url: null
            };
        }
    }

    /**
     * Bulk delete medias, checking for post associations first
     * @param ids - Array of media IDs to delete
     * @param createBackup - Whether to create a backup before deletion
     * @returns Result with statistics about what was deleted and what was skipped
     */
    async bulkDeleteMedias(ids: string[], createBackup: boolean = false) {
        try {
            if (!ids || ids.length === 0) {
                return {
                    success: false,
                    message: "No media IDs provided",
                    summary: { requested: 0, deleted: 0, skipped: 0, errors: 0 },
                    deleted: [],
                    skipped: [],
                    errors: [],
                    backup: null
                };
            }

            let backupResult: any = null;

            // Handle backup creation if requested
            if (createBackup) {
                try {
                    backupResult = await this.createBackupBeforeDeletion(ids);
                } catch (backupError: any) {
                    console.error('Backup creation failed:', backupError);
                    return {
                        success: false,
                        message: `Backup creation failed: ${backupError.message}`,
                        summary: { requested: ids.length, deleted: 0, skipped: 0, errors: ids.length },
                        deleted: [],
                        skipped: [],
                        errors: ids.map((id: string) => ({ id, error: `Backup failed: ${backupError.message}` })),
                        backup: null
                    };
                }
            }

            const MediasEntity = Repository.getEntity("MediasEntity");
            const PostsEntity = Repository.getEntity("PostsEntity");
            const CampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");

            const deleted: string[] = [];
            const skipped: Array<{id: string, reason: string, posts?: string[], campaigns?: string[]}> = [];
            const errors: Array<{id: string, error: string}> = [];

            for (const id of ids) {
                try {
                    const media = await Repository.findOne(MediasEntity, { id });

                    if (!media) {
                        errors.push({ id, error: "Media not found" });
                        continue;
                    }

                    const mediaUrl = this.buildMediaUrl(media);
                    const linkedPosts = await this.findPostsUsingMedia(mediaUrl, PostsEntity);

                    if (linkedPosts.length > 0) {
                        const postTitles = linkedPosts.map(p => p.title || p.slug || p.id).slice(0, 3);
                        const reason = `Used in ${linkedPosts.length} post(s): ${postTitles.join(', ')}${linkedPosts.length > 3 ? '...' : ''}`;

                        skipped.push({
                            id,
                            reason,
                            posts: postTitles
                        });
                        continue;
                    }

                    const linkedCampaigns = await this.findCampaignsUsingMedia(mediaUrl, CampaignsEntity);
                    if (linkedCampaigns.length > 0) {
                        const campaignNames = linkedCampaigns.map(c => c.name || c.id).slice(0, 3);
                        const reason = `Used in ${linkedCampaigns.length} campaign(s): ${campaignNames.join(', ')}${linkedCampaigns.length > 3 ? '...' : ''}`;

                        skipped.push({
                            id,
                            reason,
                            campaigns: campaignNames
                        });
                        continue;
                    }

                    if (media.filepath && media.filepath.startsWith('http')) {
                        const blogStorageService = Application.resolveProvider(BlogStorageService);
                        await blogStorageService.deleteFile(media.filepath);
                    }

                    if (media.thumbnail && media.thumbnail.startsWith('http')) {
                        const blogStorageService = Application.resolveProvider(BlogStorageService);
                        await blogStorageService.deleteFile(media.thumbnail);
                    }

                    if (media.filepath && fs.existsSync(media.filepath))
                        await fs.promises.unlink(media.filepath);

                    if (media.thumbnail && !media.thumbnail.startsWith('http')) {
                        const thumbnailPath = media.thumbnail.replace(/.*\/images\//, path.resolve(process.cwd(), "medias", "images") + "/");

                        if (fs.existsSync(thumbnailPath))
                            await fs.promises.unlink(thumbnailPath);
                    }

                    await Repository.delete(MediasEntity, { id });
                    deleted.push(id);
                } catch (error: any) {
                    console.error(`Error deleting media ${id}:`, error);
                    errors.push({ id, error: error.message || 'Unknown error' });
                }
            }

            const totalRequested = ids.length;
            const totalDeleted = deleted.length;
            const totalSkipped = skipped.length;
            const totalErrors = errors.length;

            const result = {
                success: true,
                message: `Bulk delete completed: ${totalDeleted} deleted, ${totalSkipped} skipped, ${totalErrors} errors from ${totalRequested} requested`,
                summary: {
                    requested: totalRequested,
                    deleted: totalDeleted,
                    skipped: totalSkipped,
                    errors: totalErrors
                },
                deleted,
                skipped,
                errors,
                backup: backupResult
            };

            return result;
        } catch (error: any) {
            console.error('Bulk delete method error:', error);
            return {
                success: false,
                message: error.message || 'Erro interno durante remoção em massa',
                summary: { requested: ids.length, deleted: 0, skipped: 0, errors: ids.length },
                deleted: [],
                skipped: [],
                errors: ids.map(id => ({ id, error: error.message || 'Erro interno' })),
                backup: null
            };
        }
    }

    /**
     * Create backup before deletion using dynamic import of BackupService
     * @param ids Array of media IDs to backup
     * @returns Backup result
     */
    private async createBackupBeforeDeletion(ids: string[]): Promise<any> {
        let backupService: any;

        try {
            const backupModulePath = require.resolve('../backup/backup.service');
            delete require.cache[backupModulePath];
            const { BackupService } = require('../backup/backup.service');

            const storageModulePath = require.resolve('../storage/storage.service');
            const { BlogStorageService } = require('../storage/storage.service');

            const storageService = new BlogStorageService();
            backupService = new BackupService(this, storageService);
        } catch (importError: any) {
            console.error('Failed to import BackupService:', importError);
            throw new Error(`Failed to import BackupService: ${importError.message}`);
        }

        if (!backupService) {
            throw new Error('BackupService could not be instantiated');
        }

        if (typeof backupService.backupMediasBeforeDeletion !== 'function') {
            throw new Error('BackupService does not have backupMediasBeforeDeletion method');
        }

        return await backupService.backupMediasBeforeDeletion(ids);
    }

    /**
     * Helper method to build media URL from media record
     * @param media Media record
     * @returns Media URL
     */
    private buildMediaUrl(media: any): string {
        const apiUrl = Config.get<string>("blog.url", process.env.API_URL);

        if (media.filepath && media.filepath.startsWith("https://")) {
            return media.filepath;
        }

        if (media.sha1 && media.format) {
            return `${apiUrl}/images/${media.sha1}.${media.format}`.toLowerCase();
        }

        if (media.filepath) {
            const filename = path.basename(media.filepath);
            return `${apiUrl}/images/${filename}`.toLowerCase();
        }

        return '';
    }

    /**
     * Find posts that use a specific media URL
     * @param mediaUrl The media URL to search for
     * @param PostsEntity Posts entity
     * @returns Array of posts using the media
     */
    private async findPostsUsingMedia(mediaUrl: string, PostsEntity: any): Promise<any[]> {
        if (!mediaUrl) return [];

        try {
            const posts = await Repository.findAll(PostsEntity, {
                limit: 1000
            });

            const linkedPosts: any[] = [];
            const mediaVariations = this.getMediaUrlVariations(mediaUrl);

            if (posts && posts.data) {
                for (const post of posts.data) {
                    if (this.postUsesMedia(post, mediaVariations)) {
                        linkedPosts.push(post);
                    }
                }
            }

            return linkedPosts;
        } catch (error) {
            console.error('Error searching for posts using media:', error);
            return [];
        }
    }

    /**
     * Get various URL variations for media to check against
     * @param mediaUrl Original media URL
     * @returns Array of URL variations
     */
    private getMediaUrlVariations(mediaUrl: string): string[] {
        const variations = [mediaUrl];

        if (mediaUrl.startsWith('http://')) {
            variations.push(mediaUrl.replace('http://', 'https://'));
            variations.push(mediaUrl.replace('http://', '//'));
            variations.push(mediaUrl.replace('http://', ''));
        } else if (mediaUrl.startsWith('https://')) {
            variations.push(mediaUrl.replace('https://', 'http://'));
            variations.push(mediaUrl.replace('https://', '//'));
            variations.push(mediaUrl.replace('https://', ''));
        }

        const filename = path.basename(mediaUrl);

        if (filename)
            variations.push(filename);

        return variations;
    }

    /**
     * Check if a post uses any of the media URL variations
     * @param post Post record
     * @param mediaVariations Array of media URL variations
     * @returns True if post uses the media
     */
    private postUsesMedia(post: any, mediaVariations: string[]): boolean {
        // Check image field
        if (post.image) {
            for (const variation of mediaVariations) {
                if (post.image.includes(variation)) {
                    return true;
                }
            }
        }

        // Check featureImage field
        if (post.featureImage) {
            for (const variation of mediaVariations) {
                if (post.featureImage.includes(variation)) {
                    return true;
                }
            }
        }

        // Check content field
        if (post.content) {
            for (const variation of mediaVariations) {
                if (post.content.includes(variation)) {
                    return true;
                }
            }
        }

        // Check lexicalContent field (if it's a string)
        if (post.lexicalContent && typeof post.lexicalContent === 'string') {
            for (const variation of mediaVariations) {
                if (post.lexicalContent.includes(variation)) {
                    return true;
                }
            }
        }

        // Check lexicalContent field (if it's an object)
        if (post.lexicalContent && typeof post.lexicalContent === 'object') {
            const contentStr = JSON.stringify(post.lexicalContent);
            for (const variation of mediaVariations) {
                if (contentStr.includes(variation)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Find campaigns that use a specific media URL
     * @param mediaUrl The media URL to search for
     * @param CampaignsEntity Campaigns entity
     * @returns Array of campaigns using the media
     */
    private async findCampaignsUsingMedia(mediaUrl: string, CampaignsEntity: any): Promise<any[]> {
        if (!mediaUrl) return [];

        try {
            const campaigns = await Repository.findAll(CampaignsEntity, {
                limit: 10000
            });

            const linkedCampaigns: any[] = [];
            const mediaVariations = this.getMediaUrlVariations(mediaUrl);

            if (campaigns && campaigns.data) {
                for (const campaign of campaigns.data) {
                    if (this.campaignUsesMedia(campaign, mediaVariations)) {
                        linkedCampaigns.push(campaign);
                    }
                }
            }

            return linkedCampaigns;
        } catch (error) {
            console.error('Error searching for campaigns using media:', error);
            return [];
        }
    }

    /**
     * Check if a campaign uses any of the media URL variations
     * @param campaign Campaign record
     * @param mediaVariations Array of media URL variations
     * @returns True if campaign uses the media
     */
    private campaignUsesMedia(campaign: any, mediaVariations: string[]): boolean {
        // Check logo field
        if (campaign.logo) {
            for (const variation of mediaVariations) {
                if (campaign.logo.includes(variation)) {
                    return true;
                }
            }
        }

        // Check seoLongText field
        if (campaign.seoLongText) {
             for (const variation of mediaVariations) {
                if (campaign.seoLongText.includes(variation)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generate thumbnails for all images that don't have them
     * @returns Statistics about the thumbnail generation operation
     */
    async generateMissingThumbnails() {
        this.resetProgress();
        MediasService.reprocessProgress.status = 'processing';
        MediasService.reprocessProgress.message = 'Scanning for images without thumbnails...';

        const MediasEntity = Repository.getEntity("MediasEntity");
        const blogStorageService = Application.resolveProvider(BlogStorageService);
        const mediasPath = path.resolve(process.cwd(), "medias", "images");

        if (!fs.existsSync(mediasPath)) {
            await fs.promises.mkdir(mediasPath, { recursive: true });
        }

        try {
            // Find all media records without thumbnails
            const allMediasResult = await Repository.findAll(MediasEntity, {
                limit: 10000,
                thumbnail: null // Only get records without thumbnails
            });
            const mediasWithoutThumbnails = allMediasResult?.data || [];

            if (mediasWithoutThumbnails.length === 0) {
                MediasService.reprocessProgress.status = 'completed';
                MediasService.reprocessProgress.message = 'All images already have thumbnails.';

                return {
                    success: true,
                    message: "All images already have thumbnails.",
                    processed: 0,
                    created: 0,
                    failed: 0
                };
            }

            MediasService.reprocessProgress.message = `Found ${mediasWithoutThumbnails.length} images without thumbnails. Starting generation...`;
            MediasService.reprocessProgress.total = mediasWithoutThumbnails.length;
            MediasService.reprocessProgress.processed = 0;
            MediasService.reprocessProgress.details = {
                scanned: mediasWithoutThumbnails.length,
                added: 0,
                removed: 0,
                optimized: 0,
                failed: 0,
                bytes_saved: 0
            };

            let created = 0;
            let failed = 0;
            let apiUrl = Config.get<string>("blog.url", process.env.API_URL);

            if (apiUrl.endsWith("/")) {
                apiUrl = apiUrl.slice(0, -1);
            }

            for (let i = 0; i < mediasWithoutThumbnails.length; i++) {
                const media = mediasWithoutThumbnails[i];
                MediasService.reprocessProgress.processed = i + 1;
                MediasService.reprocessProgress.message = `Processing thumbnail ${i + 1} of ${mediasWithoutThumbnails.length}: ${media.sha1}`;

                try {
                    let imageBuffer: Buffer | null = null;

                    if (media.filepath && fs.existsSync(media.filepath)) {
                        imageBuffer = fs.readFileSync(media.filepath);
                    } else if (media.filepath && (media.filepath.startsWith('http://') || media.filepath.startsWith('https://'))) {
                        try {
                            const response = await fetch(media.filepath);

                            if (!response.ok)
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);

                            const arrayBuffer = await response.arrayBuffer();
                            imageBuffer = Buffer.from(arrayBuffer);
                        } catch (fetchError: any) {
                            console.error(`Failed to fetch image from URL ${media.filepath}:`, fetchError.message);
                            failed++;
                            MediasService.reprocessProgress.details.failed = failed;
                            continue;
                        }
                    } else if (media.sha1 && media.format) {
                        const hashFilePath = path.join(mediasPath, `${media.sha1}.${media.format}`);
                        if (fs.existsSync(hashFilePath)) {
                            imageBuffer = fs.readFileSync(hashFilePath);
                            await Repository.update(MediasEntity, { id: media.id }, {
                                filepath: hashFilePath
                            });
                        }
                    }

                    if (!imageBuffer) {
                        console.error(`Could not find or fetch image file for media ID ${media.id} (filepath: ${media.filepath})`);
                        failed++;
                        MediasService.reprocessProgress.details.failed = failed;
                        continue;
                    }

                    //@ts-ignore
                    const metadata = await sharp(imageBuffer).metadata();
                    if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
                        console.error(`Invalid image dimensions for media ID ${media.id}: ${metadata.width}x${metadata.height}`);
                        failed++;
                        MediasService.reprocessProgress.details.failed = failed;
                        continue;
                    }

                    //@ts-ignore
                    const thumbnailBuffer = await sharp(imageBuffer)
                        .resize(16, 16, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .webp({ quality: 80 })
                        .toBuffer();

                    let thumbnailUrl: string | null = null;

                    try {
                        const cleanThumbnailBuffer = Buffer.from(new Uint8Array(thumbnailBuffer));

                        const uploadedThumbnail = await blogStorageService.uploadFile({
                            buffer: cleanThumbnailBuffer,
                            originalname: `${media.sha1}_thumb.webp`,
                            mimetype: 'image/webp'
                        });

                        if (uploadedThumbnail && uploadedThumbnail.url) {
                            thumbnailUrl = uploadedThumbnail.url;
                        }
                    } catch (uploadError: any) {}

                    if (!thumbnailUrl) {
                        const thumbnailPath = path.join(mediasPath, `${media.sha1}_thumb.webp`);
                        await fs.promises.writeFile(thumbnailPath, thumbnailBuffer);
                        thumbnailUrl = `${apiUrl}/images/${media.sha1}_thumb.webp`;
                    }

                    await Repository.update(MediasEntity, { id: media.id }, {
                        thumbnail: thumbnailUrl
                    });

                    created++;
                    MediasService.reprocessProgress.details.added = created;
                } catch (error) {
                    console.error(`Error generating thumbnail for media ID ${media.id}:`, error);
                    failed++;
                    MediasService.reprocessProgress.details.failed = failed;
                }
            }

            const resultMessage = `Thumbnail generation completed: ${created} thumbnails created, ${failed} failed out of ${mediasWithoutThumbnails.length} images processed.`;
            MediasService.reprocessProgress.status = 'completed';
            MediasService.reprocessProgress.message = resultMessage;

            return {
                success: true,
                message: resultMessage,
                processed: mediasWithoutThumbnails.length,
                created,
                failed
            };

        } catch (error: any) {
            console.error('Error during thumbnail generation:', error);
            MediasService.reprocessProgress.status = 'error';
            MediasService.reprocessProgress.message = `Error: ${error.message || 'Unknown error during thumbnail generation'}`;

            throw error;
        }
    }
}
