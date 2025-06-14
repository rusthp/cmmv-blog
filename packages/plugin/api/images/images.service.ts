import {
    Service, Logger
} from "@cmmv/core";

import {
    Repository, MoreThan
} from "@cmmv/repository";

import {
    PostsPublicService
} from "../posts/posts.service";

import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
];

@Service('blog_images')
export class ImagesService {
    private readonly logger = new Logger("ImagesService");
    private readonly uploadsDir = process.env.UPLOADS_DIR || './uploads';
    private readonly tempDir = process.env.TEMP_DIR || './temp';

    constructor(private readonly postsService: PostsPublicService) {
        this.ensureDirectoryExists(this.uploadsDir);
        this.ensureDirectoryExists(this.tempDir);
    }

    private ensureDirectoryExists(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Crop an image to specific coordinates
     * @param imageBuffer The image buffer
     * @param cropParams The crop parameters
     * @returns The cropped image buffer
     */
    async cropImage(imageBuffer: Buffer, cropParams: {
        left: number;
        top: number;
        width: number;
        height: number;
    }): Promise<Buffer> {
        try {
            const { left, top, width, height } = cropParams;
            //@ts-ignore
            return await sharp(imageBuffer)
                .extract({ left, top, width, height })
                .toBuffer();
        } catch (error) {
            this.logger.error(`Erro ao cortar imagem: ${error}`);
            throw new Error('Falha ao processar o corte da imagem');
        }
    }

    /**
     * Resize an image to specific dimensions
     * @param imageBuffer The image buffer
     * @param resizeParams The resize parameters
     * @returns The resized image buffer
     */
    async resizeImage(imageBuffer: Buffer, resizeParams: {
        width?: number;
        height?: number;
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    }): Promise<Buffer> {
        try {
            //@ts-ignore
            return await sharp(imageBuffer)
                .resize(resizeParams)
                .toBuffer();
        } catch (error) {
            this.logger.error(`Erro ao redimensionar imagem: ${error}`);
            throw new Error('Falha ao redimensionar a imagem');
        }
    }

    /**
     * Erase an area of an image using inpainting
     * @param imageBuffer The image buffer
     * @param maskParams The mask parameters
     * @returns The erased image buffer
     */
    async eraseImageArea(
        imageBuffer: Buffer,
        maskParams: {
            left: number;
            top: number;
            width: number;
            height: number;
        }
    ): Promise<Buffer> {
        try {
            const fileName = `${uuidv4()}.png`;
            const tempFilePath = path.join(this.tempDir, fileName);
            const resultFilePath = path.join(this.tempDir, `result_${fileName}`);

            //@ts-ignore
            const imageInfo = await sharp(imageBuffer).metadata();
            const { width, height } = imageInfo;

            //@ts-ignore
            await sharp(imageBuffer).toFile(tempFilePath);

            const maskBuffer = Buffer.from(
                new Uint8Array(width * height).fill(255)
            );

            const { left, top, maskWidth, maskHeight } = {
                left: maskParams.left,
                top: maskParams.top,
                maskWidth: maskParams.width,
                maskHeight: maskParams.height
            };

            for (let y = top; y < top + maskHeight && y < height; y++) {
                for (let x = left; x < left + maskWidth && x < width; x++) {
                    const idx = y * width + x;
                    if (idx < maskBuffer.length) {
                        maskBuffer[idx] = 0;
                    }
                }
            }

            //@ts-ignore
            const blurredImageBuffer = await sharp(imageBuffer)
                .blur(20)
                .toBuffer();

            //@ts-ignore
            const maskImage = await sharp(maskBuffer, {
                raw: {
                    width: width,
                    height: height,
                    channels: 1
                }
            }).toBuffer();

            //@ts-ignore
            const processedBuffer = await sharp(imageBuffer)
                .composite([{
                    input: blurredImageBuffer,
                    blend: 'multiply',
                    raw: {
                        width: width,
                        height: height,
                        channels: 4
                    }
                }])
                .toBuffer();

            return processedBuffer;
        } catch (error) {
            this.logger.error(`Erro ao processar apagamento: ${error}`);
            throw new Error('Falha ao apagar área da imagem');
        }
    }

    /**
     * Process image edit operations
     * @param imageBuffer The image buffer
     * @param operations The edit operations
     * @returns The processed image buffer
     */
    async processImageEdit(
        imageBuffer: Buffer,
        operations: {
            crop?: { left: number; top: number; width: number; height: number; };
            resize?: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; };
            erase?: { left: number; top: number; width: number; height: number; };
        }
    ): Promise<Buffer> {
        try {
            let processedBuffer = imageBuffer;

            if (operations.crop)
                processedBuffer = await this.cropImage(processedBuffer, operations.crop);

            if (operations.resize)
                processedBuffer = await this.resizeImage(processedBuffer, operations.resize);

            if (operations.erase)
                processedBuffer = await this.eraseImageArea(processedBuffer, operations.erase);

            return processedBuffer;
        } catch (error) {
            this.logger.error(`Erro ao processar edição de imagem: ${error}`);
            throw new Error('Falha ao processar as operações de edição de imagem');
        }
    }

    /**
     * Process image with full validation and conversion from base64
     * @param imageBase64 Base64 image string
     * @param operations Edit operations to apply
     * @returns Processed image data with base64 result
     */
    async processImageFromBase64(
        imageBase64: string,
        operations: {
            crop?: { left: number; top: number; width: number; height: number; };
            resize?: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; };
            erase?: { left: number; top: number; width: number; height: number; };
        }
    ) {
        if (!imageBase64)
            throw new Error('Nenhuma imagem foi enviada');

        const imageBuffer = this.base64ToBuffer(imageBase64);
        const mimeType = this.getMimeTypeFromBase64(imageBase64);
        const processedBuffer = await this.processImageEdit(imageBuffer, operations || {});
        const base64Image = processedBuffer.toString('base64');

        return {
            success: true,
            processedImage: `data:${mimeType};base64,${base64Image}`
        };
    }

    /**
     * Erase image area with full validation and conversion from base64
     * @param imageBase64 Base64 image string
     * @param left Left position
     * @param top Top position
     * @param width Width of area
     * @param height Height of area
     * @returns Processed image data with base64 result
     */
    async eraseImageAreaFromBase64(
        imageBase64: string,
        left: number,
        top: number,
        width: number,
        height: number
    ) {
        if (!imageBase64)
            throw new Error('Nenhuma imagem foi enviada');

        const imageBuffer = this.base64ToBuffer(imageBase64);
        const mimeType = this.getMimeTypeFromBase64(imageBase64);

        const maskParams = {
            left: left || 0,
            top: top || 0,
            width: width || 100,
            height: height || 100
        };

        const processedBuffer = await this.eraseImageArea(imageBuffer, maskParams);
        const base64Image = processedBuffer.toString('base64');

        return {
            success: true,
            processedImage: `data:${mimeType};base64,${base64Image}`
        };
    }

    /**
     * Crop image with full validation and conversion from base64
     * @param imageBase64 Base64 image string
     * @param left Left position
     * @param top Top position
     * @param width Width of crop
     * @param height Height of crop
     * @returns Processed image data with base64 result
     */
    async cropImageFromBase64(
        imageBase64: string,
        left: number,
        top: number,
        width: number,
        height: number
    ) {
        if (!imageBase64)
            throw new Error('Nenhuma imagem foi enviada');

        const imageBuffer = this.base64ToBuffer(imageBase64);
        const mimeType = this.getMimeTypeFromBase64(imageBase64);

        const cropParams = {
            left: left || 0,
            top: top || 0,
            width: width || 100,
            height: height || 100
        };

        const processedBuffer = await this.cropImage(imageBuffer, cropParams);
        const base64Image = processedBuffer.toString('base64');

        return {
            success: true,
            processedImage: `data:${mimeType};base64,${base64Image}`
        };
    }

    /**
     * Resize image with full validation and conversion from base64
     * @param imageBase64 Base64 image string
     * @param width New width
     * @param height New height
     * @param fit Resize fit mode
     * @returns Processed image data with base64 result
     */
    async resizeImageFromBase64(
        imageBase64: string,
        width?: number,
        height?: number,
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    ) {
        if (!imageBase64)
            throw new Error('Nenhuma imagem foi enviada');

        const imageBuffer = this.base64ToBuffer(imageBase64);
        const mimeType = this.getMimeTypeFromBase64(imageBase64);

        const resizeParams = {
            width: width,
            height: height,
            fit: fit || 'cover'
        };

        const processedBuffer = await this.resizeImage(imageBuffer, resizeParams);
        const base64Image = processedBuffer.toString('base64');

        return {
            success: true,
            processedImage: `data:${mimeType};base64,${base64Image}`
        };
    }

    /**
     * Convert a base64 string to Buffer
     * @param base64String Base64 image string, may include data:image/... prefix
     * @returns Buffer with binary image data
     */
    private base64ToBuffer(base64String: string): Buffer {
        const base64Data = base64String.includes(';base64,')
            ? base64String.split(';base64,')[1]
            : base64String;

        return Buffer.from(base64Data, 'base64');
    }

    /**
     * Extract MIME type from a base64 string
     * @param base64String Base64 image string with data:image/... prefix
     * @returns MIME type of the image
     */
    private getMimeTypeFromBase64(base64String: string): string {
        if (base64String.includes('data:') && base64String.includes(';base64,'))
            return base64String.split(';base64,')[0].split(':')[1];

        return 'image/jpeg'; // Default fallback
    }
}
