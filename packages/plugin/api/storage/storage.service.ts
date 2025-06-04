import {
    S3Client,
    PutObjectCommand
} from "@aws-sdk/client-s3";

import {
    Service, Config, Logger
} from "@cmmv/core";

export interface IFile {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
}

@Service('blog_storage')
export class BlogStorageService {
    private readonly logger = new Logger("BlogStorageService");

    /**
     * Upload a file to the storage
     * @param file - The file to upload
     * @returns The file url
     */
    async uploadFile(file: IFile) {
        const storageType = Config.get("blog.storageType");

        switch (storageType) {
            case "spaces":
                return await this.uploadFileToCloudflare(file);
            case "s3":
                return await this.uploadFileToS3(file);
            default:
                return null;
        }
    }

    /**
     * Upload a file to Cloudflare Spaces
     * @param file - The file to upload
     * @returns The file url
     */
    private async uploadFileToCloudflare(file: IFile) {
        const spacesAccessKey = Config.get("blog.spacesAccessKey");
        const spacesSecretKey = Config.get("blog.spacesSecretKey");
        const spacesRegion = Config.get("blog.spacesRegion");
        const spacesName = Config.get("blog.spacesName");
        const spacesEndpoint = Config.get("blog.spacesEndpoint");
        const spacesUrl = Config.get("blog.spacesUrl");

        const client = new S3Client({
            endpoint: spacesEndpoint,
            region: spacesRegion,
            credentials: {
                accessKeyId: spacesAccessKey,
                secretAccessKey: spacesSecretKey,
            },
            forcePathStyle: false,
        });

        const command = new PutObjectCommand({
            Bucket: spacesName,
            Key: file.originalname,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read"
        });

        try {
            await client.send(command);
            const host = new URL(spacesEndpoint).host;
            const publicUrl = (spacesUrl) ? `${spacesUrl}/${file.originalname}` : `https://${spacesName}.${host}/${file.originalname}`;
            return { success: true, url: publicUrl };
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Upload a file to S3
     * @param file - The file to upload
     * @returns The file url
     */
    private async uploadFileToS3(file: IFile) {
        const s3AccessKey = Config.get("blog.s3AccessKey");
        const s3SecretKey = Config.get("blog.s3SecretKey");
        const s3Bucket = Config.get("blog.s3Bucket");
        const s3Region = Config.get("blog.s3Region");
        const s3Endpoint = Config.get("blog.s3Endpoint");
        const s3UsePathStyle = Config.get("blog.s3UsePathStyle");
        const s3BucketUrl = Config.get("blog.s3BucketUrl");

        const client = new S3Client({
            region: s3Region,
            endpoint: s3Endpoint,
            credentials: {
                accessKeyId: s3AccessKey,
                secretAccessKey: s3SecretKey
            },
            forcePathStyle: s3UsePathStyle === true || s3UsePathStyle === "true"
        });

        const command = new PutObjectCommand({
            Bucket: s3Bucket,
            Key: file.originalname,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read"
        });

        try {
            await client.send(command);
            const publicUrl = (s3BucketUrl) ? `${s3BucketUrl}/${file.originalname}` : `${s3Endpoint}/${s3Bucket}/${file.originalname}`;
            return { success: true, url: publicUrl };
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}
