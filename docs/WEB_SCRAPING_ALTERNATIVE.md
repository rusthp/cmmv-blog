# Web Scraping Alternative for News Collection

## Overview

For sites like **Dust2.com.br** that have limited RSS feeds (only title, description, no images), we can implement **direct web scraping** as an alternative or complement to RSS feeds.

## Current Options

### 1. RSS Feed (Current) ✅
- **URL**: `https://www.dust2.com.br/rss`
- **Pros**: Fast, standardized, automatic updates
- **Cons**: Limited content (no images), only basic info
- **Status**: ✅ Working with meta tag extraction fallback

### 2. Direct Web Scraping (New Option) 🆕
- **Source**: `https://www.dust2.com.br/noticias`
- **Pros**: Full content, images, categories, tags
- **Cons**: More resource-intensive, requires HTML parsing
- **Status**: Can be implemented

### 3. Hybrid Approach (Best) 🎯
- Use RSS for discovery (fast)
- Use scraping for full content + images
- Best of both worlds

## Implementation Strategy

### Option A: List Page Scraping

Scrape the news listing page to get all recent articles:

```
https://www.dust2.com.br/noticias
```

**Extract**:
- Article cards/items
- Title
- Link
- Image thumbnail
- Published date
- Category
- Excerpt

**Advantages**:
- Get multiple articles in one request
- More efficient than scraping individual pages
- Images available in listing

### Option B: Individual Article Scraping

Use existing parser system when `requestLink === true` (already works)

**Advantages**:
- Already implemented
- Full article content
- Images via parser regex

## Recommended: List Page Scraping

This would be the most efficient way to collect news from Dust2 without relying on RSS.

### Implementation Plan

1. **Create Web Scraper Source Type**
   - Similar to RSS channels but for web scraping
   - Store list page URL and extraction patterns

2. **Extract Article List**
   - Parse HTML of listing page
   - Extract article cards/items
   - Get title, link, image, date for each

3. **Process Each Article**
   - Use existing parser system
   - Extract full content
   - Get featured images

4. **Schedule Collection**
   - Similar to RSS cron jobs
   - Run periodically (e.g., every hour)

## Benefits

1. **Better Content**: Full articles with images
2. **More Articles**: Can get more than RSS limit (usually 10-20)
3. **Images Included**: Thumbnails available in listing
4. **Categories**: Better category detection
5. **Tags**: Can extract tags from listing

## Comparison

| Feature | RSS | Web Scraping |
|---------|-----|--------------|
| Speed | ⚡ Fast | 🐢 Slower |
| Images | ❌ Limited | ✅ Full |
| Content | ⚠️ Basic | ✅ Complete |
| Reliability | ✅ Stable | ⚠️ Can break |
| Maintenance | ✅ Low | ⚠️ Higher |

## Recommended Approach: Hybrid

1. **Keep RSS** for:
   - Fast discovery of new articles
   - Quick updates
   - Fallback option

2. **Add Web Scraping** for:
   - Complete content collection
   - Image extraction
   - Better categorization

3. **Combine Both**:
   - RSS finds new articles
   - Scraping enriches with full content/images

---

Would you like me to implement the web scraping alternative for Dust2?

