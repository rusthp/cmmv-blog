# Web Scraping Implementation Plan for Dust2

## Problem

**Dust2.com.br RSS feed limitations:**
- ❌ No images in RSS items
- ⚠️ Limited to 10-20 most recent items
- ⚠️ Only basic title + description

**Solution**: Direct web scraping of the news listing page

## Implementation Options

### Option 1: Add Web Scraping Mode to Existing Channels ✅ (Recommended)

**Approach**: Extend `FeedChannelsContract` to support web scraping

**Changes Needed**:
1. Add `sourceType` field: `'RSS' | 'WEB_SCRAPING'`
2. Add `listPageUrl` field (for scraping mode)
3. Add scraping patterns/config
4. Extend `ChannelsService` to handle scraping

**Advantages**:
- ✅ Reuses existing infrastructure
- ✅ Same admin interface
- ✅ Unified processing logic
- ✅ Minimal changes

### Option 2: Create Separate Web Scraper Module

**Approach**: New module similar to affiliate webscraper

**Disadvantages**:
- ❌ More code duplication
- ❌ Separate admin interface needed
- ❌ More maintenance

## Recommended: Option 1

### Step 1: Extend Contract

```typescript
// packages/rss-aggregation/contracts/feed-channels.contract.ts

@ContractField({
    protoType: 'string',
    nullable: true,
    defaultValue: 'RSS'
})
sourceType!: 'RSS' | 'WEB_SCRAPING';

@ContractField({
    protoType: 'string',
    nullable: true
})
listPageUrl!: string; // e.g., "https://www.dust2.com.br/noticias"

@ContractField({
    protoType: 'string',
    nullable: true
})
scrapingConfig!: string; // JSON with extraction patterns
```

### Step 2: Create Web Scraper Service

```typescript
// packages/rss-aggregation/api/web-scraper/web-scraper.service.ts

@Service()
export class WebScraperService {
    async scrapeNewsList(url: string, config: ScrapingConfig): Promise<ArticleItem[]> {
        // 1. Fetch HTML
        // 2. Extract article cards using config patterns
        // 3. Return array of articles with title, link, image, date
    }
}
```

### Step 3: Update ChannelsService

```typescript
// In processFeeds()
if (channel.sourceType === 'WEB_SCRAPING') {
    articles = await this.webScraperService.scrapeNewsList(
        channel.listPageUrl,
        JSON.parse(channel.scrapingConfig)
    );
} else {
    // Existing RSS logic
}
```

### Step 4: Dust2 Specific Configuration

For Dust2, we need to extract:

**HTML Structure** (from homepage):
```html
<!-- Article cards in listing -->
<div class="article-card">
    <img src="..."> <!-- Featured image -->
    <h3><a href="/noticias/...">Title</a></h3>
    <span class="date">...</span>
</div>
```

**Extraction Patterns** (using regex or CSS selectors):
```json
{
    "articleSelector": ".article-card, .news-item",
    "titleSelector": "h3 a, .title",
    "linkSelector": "h3 a",
    "imageSelector": "img",
    "dateSelector": ".date, .published",
    "excerptSelector": ".excerpt, .description"
}
```

## Implementation Details

### Dust2 News Page Structure

Based on the website analysis:
- **Main news page**: `https://www.dust2.com.br/noticias`
- Articles appear as cards with:
  - Featured image
  - Title + link
  - Published date
  - Excerpt/summary

### Extraction Strategy

1. **Fetch listing page HTML**
   ```typescript
   const response = await fetch('https://www.dust2.com.br/noticias', {
       headers: {
           'User-Agent': 'Mozilla/5.0...'
       }
   });
   ```

2. **Parse HTML** (using cheerio or regex)
   ```typescript
   const $ = cheerio.load(html);
   const articles = $('.article-card').map((i, el) => {
       return {
           title: $(el).find('h3 a').text(),
           link: resolveUrl($(el).find('h3 a').attr('href'), baseUrl),
           image: resolveUrl($(el).find('img').attr('src'), baseUrl),
           date: parseDate($(el).find('.date').text()),
           excerpt: $(el).find('.excerpt').text()
       };
   }).get();
   ```

3. **Process each article** (reuse existing logic)
   - If `requestLink === true`: Use parser service for full content
   - Extract featured image
   - Store in database

### Advantages Over RSS

| Feature | RSS | Web Scraping |
|---------|-----|--------------|
| **Images** | ❌ None | ✅ Full thumbnails |
| **Article Limit** | ⚠️ 10-20 | ✅ All visible |
| **Content** | ⚠️ Description only | ✅ Can get full content |
| **Categories** | ✅ Yes | ✅ Better |
| **Reliability** | ✅ Stable | ⚠️ Can break if HTML changes |

## Migration Path

1. **Phase 1**: Add scraping as alternative source type
2. **Phase 2**: Keep RSS for discovery, scraping for enrichment
3. **Phase 3**: Hybrid mode (RSS + scraping)

## Example Configuration

For Dust2 channel in admin:

```json
{
    "name": "Dust2 Brasil",
    "sourceType": "WEB_SCRAPING",
    "listPageUrl": "https://www.dust2.com.br/noticias",
    "rss": "", // Optional fallback
    "requestLink": true, // Get full content
    "scrapingConfig": {
        "articleSelector": ".article-card, .news-card",
        "titleSelector": "h3 a, .title a",
        "linkSelector": "h3 a, .title a",
        "imageSelector": "img.featured, .article-image img",
        "dateSelector": ".date, .published-date",
        "excerptSelector": ".excerpt, .summary"
    },
    "active": true,
    "intervalUpdate": 3600000 // 1 hour
}
```

## Testing Strategy

1. **Test extraction patterns** on Dust2 page
2. **Verify image URLs** are absolute
3. **Check date parsing** (Portuguese dates)
4. **Validate links** resolve correctly
5. **Monitor performance** (slower than RSS)

## Performance Considerations

- **Caching**: Cache HTML of listing page (5-10 min)
- **Rate Limiting**: Respect robots.txt
- **Error Handling**: Fallback to RSS if scraping fails
- **Timeouts**: 10-15 seconds max per page

## Next Steps

1. ✅ Document the plan (this file)
2. ⏳ Implement contract changes
3. ⏳ Create WebScraperService
4. ⏳ Update ChannelsService
5. ⏳ Test with Dust2
6. ⏳ Add admin UI for scraping config

---

**Would you like me to start implementing this?**

