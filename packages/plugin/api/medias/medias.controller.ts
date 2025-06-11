import {
    Controller, Get, Param,
    Response, Queries,
    ContentType, Raw, Post,
    Body, Delete, Put
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import { Application } from "@cmmv/core";

import {
    MediasService
} from "./medias.service";

interface ProcessImageInterface {
    image: string;
    format: string;
    width?: number;
    height?: number;
    quality?: number;
    alt: string;
    caption: string;
}

@Controller()
export class MediasController {
    constructor(private readonly mediasService: MediasService){}

    @Get("medias", { exclude: true })
    @ContentType("application/json")
    @Raw()
    async getMedias(@Queries() queries: any, @Response() res: any){
        return await this.mediasService.getMedias(queries);
    }

    @Get("images/:hash", { exclude: true })
    async get(@Param("hash") hash: string, @Response() res: any) {
        const image = await this.mediasService.getImage(hash);

        if(!image){
            res.code(404).end();
        }
        else{
            res.code(200).set({
                "Content-Type": "image/webp",
                "Cache-Control": "public, max-age=31536000, immutable",
                "Expires": new Date(Date.now() + 31536000).toUTCString()
            }).contentType("image/webp").send(image);
        }
    }

    @Post("images", { exclude: true })
    @Auth("media:process")
    @ContentType("application/json")
    @Raw()
    async processImage(@Body() body: ProcessImageInterface) {
        return this.mediasService.getImageUrl(
            body.image,
            body.format,
            body.width,
            body.height,
            body.quality,
            body.alt,
            body.caption
        );
    }

    @Put("medias/:id", { exclude: true })
    @Auth("media:update")
    async updateMedia(@Param("id") id: number, @Body() body: any) {
        return await this.mediasService.updateMedia(id, body);
    }

    @Delete("medias/:id", { exclude: true })
    @Auth("media:delete")
    async deleteMedia(@Param("id") id: number) {
        return await this.mediasService.deleteMedia(id);
    }

    @Get("reprocess-images-progress", { exclude: true })
    @Auth("media:process")
    async getReprocessProgress() {
        return await this.mediasService.getReprocessProgress();
    }

    @Get("cleanup-orphaned-media-progress", { exclude: true })
    @Auth("media:process")
    async getCleanupProgress() {
        return await this.mediasService.getReprocessProgress();
    }

    @Post("init-cleanup-progress", { exclude: true })
    @Auth("media:process")
    async initCleanupProgress() {
        return await this.mediasService.initializeProgress("cleanup");
    }

    @Post("cleanup-duplicated-images", { exclude: true })
    @Auth("media:process")
    async cleanupDuplicatedImages() {
        return await this.mediasService.cleanupDuplicatedImages();
    }

    @Post("cleanup-orphaned-media", { exclude: true })
    @Auth("media:process")
    async cleanupOrphanedMedia(@Body() body: {forceCleanup?: boolean} = {}) {
        return await this.mediasService.cleanupOrphanedRecords(body.forceCleanup || false);
    }

    @Post("reprocess-images", { exclude: true })
    @Auth("media:process")
    async reprocessImages() {
        return await this.mediasService.reprocessAllImages();
    }

    @Post("import-from-url", { exclude: true })
    @Auth("media:process")
    async importFromUrl(@Body() body: {url: string, alt: string, caption: string}) {
        return await this.mediasService.importFromUrl(body.url, body.alt, body.caption);
    }

    @Post("generate-missing-thumbnails", { exclude: true })
    @Auth("media:process")
    async generateMissingThumbnails() {
        return await this.mediasService.generateMissingThumbnails();
    }

    @Post("bulk-delete", { exclude: true })
    @Auth("media:delete")
    async bulkDeleteMedias(@Body() body: {ids: string[], createBackup?: boolean}) {
        try {
            let backupResult: any = null;
            if (body.createBackup) {
                try {
                    let backupService: any;

                    try {
                        const backupModulePath = require.resolve('../backup/backup.service');
                        delete require.cache[backupModulePath];
                        const { BackupService } = require('../backup/backup.service');

                        const storageModulePath = require.resolve('../storage/storage.service');
                        const { BlogStorageService } = require('../storage/storage.service');

                        const storageService = new BlogStorageService();
                        backupService = new BackupService(this.mediasService, storageService);
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

                    backupResult = await backupService.backupMediasBeforeDeletion(body.ids);
                } catch (backupError: any) {
                    console.error('Backup creation failed:', backupError);
                    return {
                        success: false,
                        message: `Backup creation failed: ${backupError.message}`,
                        summary: { requested: body.ids.length, deleted: 0, skipped: 0, errors: body.ids.length },
                        deleted: [],
                        skipped: [],
                        errors: body.ids.map((id: string) => ({ id, error: `Backup failed: ${backupError.message}` })),
                        backup: null
                    };
                }
            }

            const result = await this.mediasService.bulkDeleteMedias(body.ids, false);

            if (backupResult)
                result.backup = backupResult;

            return result;
        } catch (error) {
            throw error;
        }
    }
}
