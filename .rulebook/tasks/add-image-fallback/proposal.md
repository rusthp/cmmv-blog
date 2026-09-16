# Add Image Fallback

## Why
Images often fail to load due to 403 errors, expired links, or deleted source images. A fallback strategy ensures that posts always have images, maintaining the visual quality of the platform.

## What Changes
We will implement an image fallback pipeline:
1. Validate original images via HEAD request and whitelist.
2. If successful, cache the image locally in `images_cache` table and storage.
3. If original fails, use the locally cached version.
4. If there's no cached version, generate a contextual automatic placeholder.

## Impact
- Affected specs: image-pipeline
- Affected code: rss-aggregation channels service, auto-pipeline service
- Breaking change: NO
- User benefit: 100% of posts will have visible and working images.
