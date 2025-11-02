# Media Storage Architecture

## Overview

This document explains how images are processed, stored, and served in the CMMV Blog system.

## Storage Architecture

### 1. Storage Locations

The system supports three storage types:

#### Local Storage (Default)
- **Path**: `./medias/images/` (relative to application root)
- **Full Path**: `{process.cwd()}/medias/images/`
- **Naming**: Files are stored with SHA1 hash as filename: `{hash}.{format}`
- **Example**: `medias/images/a1b2c3d4e5f6.webp`

#### Cloud Storage (Optional)
- **Cloudflare Spaces**: Configured via `blog.storageType = "spaces"`
- **AWS S3**: Configured via `blog.storageType = "s3"`
- Files are uploaded to cloud storage when `blogStorageService.uploadFile()` is called
- Local files are kept as backup even when using cloud storage

### 2. Database Storage (SQLite/PostgreSQL)

The metadata for all images is stored in the `blog_medias` table:

**Table Structure** (`MediasContract`):
```typescript
{
    id: string,              // UUID
    sha1: string,            // SHA1 hash of image (used as filename)
    filepath: string,        // Full URL or local path
    thumbnail?: string,      // Thumbnail URL (16x16 WebP)
    alt?: string,            // Alt text
    caption?: string,        // Caption
    format?: string,         // Image format (webp, jpg, png, etc.)
    width?: number,          // Image width in pixels
    height?: number,         // Image height in pixels
    size?: number,           // File size in bytes
    createdAt: Date,         // Creation timestamp
    updatedAt: Date          // Update timestamp
}
```

## Image Processing Flow

### 1. Image Upload/Import Process

```
┌─────────────────────────────────────────────────────────────┐
│ User Action: Upload or Import from URL                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Image Received (base64 or URL)                          │
│    - Convert URL → base64 via fetch()                      │
│    - Validate image format                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Generate SHA1 Hash                                       │
│    - Hash: SHA1(image_data + format + width + height + q)  │
│    - Used as unique identifier and filename                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Check Cache (File exists?)                               │
│    - Check: medias/images/{hash}.{format} exists?          │
│    - Check: DB record with same SHA1 exists?               │
│    - If exists: Return existing URL                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (if not cached)
┌─────────────────────────────────────────────────────────────┐
│ 4. Process Image (Sharp)                                    │
│    - Resize (if width/height specified)                     │
│    - Convert format (default: WebP)                         │
│    - Optimize quality (default: 80)                         │
│    - Extract metadata (width, height, format)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Save to Storage                                          │
│    - Save locally: fs.writeFileSync()                      │
│    - Upload to cloud (if configured): S3/Spaces            │
│    - Generate thumbnail (16x16 WebP)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Save Metadata to Database                                │
│    - Insert into blog_medias table                          │
│    - Fields: sha1, filepath, width, height, format, etc.   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Return URL                                               │
│    - Local: {API_URL}/images/{hash}.{format}               │
│    - Cloud: {CloudURL}/{hash}.{format}                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Image Serving Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Request: GET /images/{hash}.{format}                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Parse Hash from URL                                      │
│    - Extract: {hash} from /images/{hash}.{format}          │
│    - Example: /images/a1b2c3d4e5.webp → hash = "a1b2c3d4e5"│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check File Location                                      │
│    - If filepath starts with "http/https":                  │
│      → Serve from cloud URL (redirect or proxy)            │
│    - If filepath is local path:                             │
│      → Read from medias/images/{hash}.{format}             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Serve Image                                              │
│    - Set Content-Type: image/{format}                       │
│    - Stream file to response                                │
│    - Add cache headers                                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. MediasService (`packages/plugin/api/medias/medias.service.ts`)

**Main Methods**:
- `getImageUrl()`: Process and store image, return URL
- `importFromUrl()`: Fetch image from remote URL and import
- `buildMediaUrl()`: Convert media record to accessible URL
- `generateAndUploadThumbnail()`: Create 16x16 WebP thumbnail

**Storage Logic**:
```typescript
// Local path
const mediasPath = path.resolve(process.cwd(), "medias", "images");
const imageFullpath = path.join(mediasPath, `${imageHash}.${format}`);

// Save locally
fs.writeFileSync(imageFullpath, finalImageBuffer);

// Upload to cloud (if configured)
const uploadedFile = await blogStorageService.uploadFile({
    buffer: finalImageBuffer,
    originalname: `${imageHash}.${format}`,
    mimetype: `image/${format}`
});

// Store in DB
await Repository.insert(MediasEntity, {
    sha1: imageHash,
    filepath: uploadedFile?.url || `${apiUrl}/images/${imageHash}.${format}`,
    // ... other fields
});
```

### 2. BlogStorageService (`packages/plugin/api/storage/storage.service.ts`)

**Storage Types**:
- **"spaces"**: Cloudflare Spaces (S3-compatible)
- **"s3"**: AWS S3 or S3-compatible storage
- **default/null**: Local storage only

**Configuration**:
```typescript
blog.storageType        // "spaces" | "s3" | null
blog.spacesAccessKey    // Cloudflare access key
blog.spacesSecretKey    // Cloudflare secret key
blog.spacesRegion       // Cloudflare region
blog.spacesName         // Space name
blog.spacesEndpoint     // Cloudflare endpoint
blog.spacesUrl          // Public URL prefix
blog.s3AccessKey        // S3 access key
blog.s3SecretKey        // S3 secret key
blog.s3Bucket           // S3 bucket name
blog.s3Region           // S3 region
blog.s3Endpoint         // S3 endpoint
blog.s3BucketUrl        // Public URL prefix
```

### 3. Images Service (`apps/api/src/modules/images/`)

**Responsibility**: Serve images from local filesystem or cloud storage

**Flow**:
1. Extract hash from URL path
2. Query database for media record
3. Check if `filepath` is remote URL or local path
4. Serve file accordingly

## Image URL Formats

### Local Storage
```
{API_URL}/images/{sha1}.{format}
Example: http://localhost:5000/images/a1b2c3d4e5f6.webp
```

### Cloud Storage (if configured)
```
{CloudURL}/{sha1}.{format}
Example: https://cdn.example.com/a1b2c3d4e5f6.webp
```

### Remote URLs (not imported)
```
{OriginalURL}
Example: https://proplaynews.com.br/images/image.webp
Note: These are not processed/stored, just referenced
```

## Common Issues & Solutions

### Issue: "Image not found (404)"

**Cause**: The image URL in the database points to a remote URL that no longer exists.

**Check**:
1. Query database: `SELECT * FROM blog_medias WHERE filepath LIKE '%proplaynews%'`
2. Check if file exists locally: `ls medias/images/{hash}.webp`
3. Check if file exists in cloud storage (if configured)

**Solution**:
- If local file exists: Update DB `filepath` to local URL
- If cloud file exists: Verify cloud URL is correct
- If file doesn't exist: Re-import from original source or remove record

### Issue: Images showing as "Remote" in admin

**Cause**: The `filepath` in database is still pointing to remote URL instead of local/cloud URL.

**Check**:
```sql
SELECT id, sha1, filepath FROM blog_medias WHERE filepath LIKE 'http%';
```

**Solution**:
1. Ensure images were properly imported (not just URL stored)
2. Run reprocess to import remote images
3. Manually update `filepath` if local file exists

### Issue: Missing thumbnails

**Location**: Thumbnails stored alongside images or in cloud
**Generation**: Automatic when image is processed
**Size**: 16x16 WebP
**Storage**: Same location as main image (local or cloud)

## Database Queries

### Find all remote URLs
```sql
SELECT * FROM blog_medias WHERE filepath LIKE 'http%';
```

### Find images by hash
```sql
SELECT * FROM blog_medias WHERE sha1 = 'a1b2c3d4e5f6';
```

### Find images without local files
```sql
SELECT * FROM blog_medias 
WHERE filepath NOT LIKE 'http%' 
AND filepath NOT LIKE '%/images/%';
```

### Count images by format
```sql
SELECT format, COUNT(*) as count 
FROM blog_medias 
GROUP BY format;
```

## File System Structure

```
project-root/
├── medias/
│   └── images/
│       ├── a1b2c3d4e5f6.webp      # Processed image
│       ├── a1b2c3d4e5f6_thumb.webp # Thumbnail (if separate)
│       ├── b2c3d4e5f6a1.webp
│       └── ...
├── database.sqlite                 # SQLite database
│                                   # Table: blog_medias
└── ...
```

## Best Practices

1. **Always use `getImageUrl()` or `importFromUrl()`** instead of storing URLs directly
2. **Check hash before processing** to avoid duplicate processing
3. **Use cloud storage** for production to reduce server load
4. **Regular cleanup** of orphaned files (files without DB records)
5. **Backup medias directory** along with database

