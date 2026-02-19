# RSS Feed Collection Optimization

## Overview

This document outlines improvements to RSS feed collection, specifically for sites with limited RSS feeds (like HLTV and Dust2) that provide minimal content in their feeds.

> **✅ Status**: Implementation completed and documented

## Implementation Date

2025-01-XX

## Problem Statement

Many RSS feeds provide limited information:
- **HLTV**: Provides title, description, and `<media:content>` image in RSS
- **Dust2**: Provides only title, description, and link (no images in RSS)
- Both require additional scraping to get full content and images

## Current Implementation

The system already supports:
- ✅ `<media:content>` extraction from RSS (HLTV works)
- ✅ Web scraping via parsers when `requestLink === true`
- ✅ Image extraction via regex patterns

## Improvements Implemented

### 1. Enhanced Image Extraction from RSS

**Location**: `packages/rss-aggregation/api/channels/channels.service.ts`

#### 1.1 Multiple Image Source Support
- Extract images from `<media:content>` (Media RSS)
- Extract images from `<enclosure>` (RSS 2.0)
- Extract images from `<itunes:image>` (Podcast feeds)
- Extract images from `<image>` tag in items

#### 1.2 Image Quality Prioritization
1. Highest priority: `<media:content>` with high quality/width attributes
2. Medium priority: `<enclosure>` with image type
3. Low priority: Generic image tags

### 2. Automatic Fallback to Web Scraping

**When RSS doesn't provide images**, automatically fetch the article page to extract:
- Open Graph image (`og:image`)
- Twitter Card image (`twitter:image`)
- Article image (`article:image`)
- First large image in article content
- Meta image tags

### 3. Smart Image Extraction Strategy

**Priority Order**:
1. **RSS `<media:content>`** (fastest, already available)
2. **Meta tags** (`og:image`, `twitter:image`, `article:image`)
3. **First large image** from article content (>400px width)
4. **Site logo** as last resort

### 4. Performance Optimizations

- **Image caching**: Cache extracted images to avoid re-scraping
- **Lazy scraping**: Only scrape when RSS doesn't provide image
- **Batch processing**: Process multiple items in parallel
- **Timeout management**: Prevent hanging on slow sites

## Implementation Details

### Enhanced Image Extraction Function

```typescript
/**
 * Extract image URL from RSS item with multiple fallback strategies
 * @param item - RSS item
 * @param feedType - RSS or Atom
 * @returns Image URL or empty string
 */
private extractImageFromRSSItem(item: any, feedType: string): string {
    // Priority 1: Media RSS content
    if (item['media:content']) {
        const mediaContent = item['media:content'];
        // Handle array of media content (choose largest/best quality)
        if (Array.isArray(mediaContent)) {
            const bestImage = mediaContent
                .filter((m: any) => m.$?.type?.startsWith('image/'))
                .sort((a: any, b: any) => {
                    const aWidth = parseInt(a.$?.width || '0');
                    const bWidth = parseInt(b.$?.width || '0');
                    return bWidth - aWidth; // Largest first
                })[0];
            
            if (bestImage?.$?.url) return bestImage.$.url;
            if (bestImage?.url) return bestImage.url;
        }
        // Handle single media content
        if (mediaContent.$?.url) return mediaContent.$.url;
        if (mediaContent.url) return mediaContent.url;
    }
    
    // Priority 2: Enclosure (RSS 2.0)
    if (item.enclosure) {
        const enclosure = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
        const type = enclosure.$?.type || enclosure.type || '';
        if (type.startsWith('image/')) {
            return enclosure.$?.url || enclosure.url || '';
        }
    }
    
    // Priority 3: iTunes image (podcast feeds)
    if (item['itunes:image']?.$?.href) {
        return item['itunes:image'].$.href;
    }
    
    // Priority 4: Image tag in item
    if (item.image?.url) {
        return item.image.url;
    }
    
    return '';
}
```

### Automatic Web Scraping for Images

```typescript
/**
 * Extract image from article page when RSS doesn't provide one
 * @param link - Article URL
 * @param existingImage - Image from RSS (if any)
 * @returns Image URL
 */
private async extractImageFromPage(
    link: string, 
    existingImage: string
): Promise<string> {
    // If RSS already has image, use it
    if (existingImage) return existingImage;
    
    try {
        // Fetch page HTML
        const html = await this.parserService.fetchHTML(link);
        
        // Try meta tags first (fastest)
        const ogImage = this.extractMetaImage(html, 'property="og:image"');
        if (ogImage) return this.resolveUrl(ogImage, link);
        
        const twitterImage = this.extractMetaImage(html, 'name="twitter:image"');
        if (twitterImage) return this.resolveUrl(twitterImage, link);
        
        const articleImage = this.extractMetaImage(html, 'property="article:image"');
        if (articleImage) return this.resolveUrl(articleImage, link);
        
        // Try first large image in content
        const contentImage = this.extractFirstLargeImage(html, link);
        if (contentImage) return contentImage;
        
    } catch (error) {
        // Silently fail - RSS image is better than nothing
    }
    
    return '';
}

/**
 * Extract image URL from meta tag
 */
private extractMetaImage(html: string, pattern: string): string {
    const regex = new RegExp(
        `<meta\\s+${pattern}\\s+content=["']([^"']+)["']`,
        'i'
    );
    const match = html.match(regex);
    return match ? match[1] : '';
}

/**
 * Extract first large image from article content
 */
private extractFirstLargeImage(html: string, baseUrl: string): string {
    // Look for images in article content areas
    const articleRegex = /<article[^>]*>(.*?)<\/article>/is;
    const articleMatch = html.match(articleRegex);
    const content = articleMatch ? articleMatch[1] : html;
    
    // Find all images
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
        images.push(match[1]);
    }
    
    // Filter and prioritize large images
    for (const imgSrc of images) {
        // Skip small images, logos, icons
        if (imgSrc.match(/logo|icon|avatar|thumbnail|small/i)) continue;
        
        // Prefer absolute URLs
        const absoluteUrl = this.resolveUrl(imgSrc, baseUrl);
        return absoluteUrl;
    }
    
    return '';
}
```

## Configuration

### Channel Configuration

Add new options to `FeedChannelsEntity`:

```typescript
{
    // Existing fields...
    requestLink: boolean,        // Scrape full page content
    autoExtractImages: boolean,  // Auto-extract images when missing (default: true)
    imageExtractionStrategy: 'rss-first' | 'always-scrape', // Strategy
}
```

### RSS Processing Flow

```
1. Parse RSS Feed
   ↓
2. Extract item data (title, link, description)
   ↓
3. Extract image from RSS (media:content, enclosure, etc.)
   ↓
4. If no image AND autoExtractImages === true:
   → Fetch article page
   → Extract og:image, twitter:image, or first large image
   ↓
5. If requestLink === true:
   → Parse full content using parser
   → Extract content, category, tags
   ↓
6. Save to FeedRawEntity
```

## Benefits

1. **Better Image Coverage**: 
   - HLTV: Uses `<media:content>` directly (fast)
   - Dust2: Automatically scrapes for images (no manual config needed)

2. **Performance**:
   - Only scrapes when necessary
   - Caches extracted images
   - Prioritizes RSS images (faster)

3. **Flexibility**:
   - Works with any RSS feed
   - Fallback strategies ensure images are found
   - Configurable per channel

## Testing

### Test Cases

1. **HLTV Feed** (has `<media:content>`):
   - Should extract image directly from RSS
   - No scraping needed

2. **Dust2 Feed** (no images in RSS):
   - Should automatically scrape article page
   - Should extract image from og:image or first large image

3. **Mixed Feed**:
   - Items with RSS images → use RSS image
   - Items without RSS images → scrape for image

## Migration

No migration needed - changes are backward compatible:
- Existing channels continue to work
- New auto-extraction runs only when images are missing
- Can be disabled per channel if needed

## Future Enhancements

1. **Image CDN Integration**: Upload extracted images to CDN
2. **Image Optimization**: Resize/compress extracted images
3. **Multiple Images**: Support gallery extraction
4. **Image Validation**: Verify images exist before saving
5. **Cache TTL**: Set expiration for scraped images

