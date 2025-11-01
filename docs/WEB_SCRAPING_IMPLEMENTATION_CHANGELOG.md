# Web Scraping Implementation - Changelog

## Summary

Implemented web scraping as an alternative source type for RSS aggregation, allowing collection of news from sites like Dust2.com.br that have limited RSS feeds.

## Date
2025-11-01

## Changes

### 1. Extended FeedChannelsContract

**File**: `packages/rss-aggregation/contracts/feed-channels.contract.ts`

**Added Fields**:
- `sourceType`: `'RSS' | 'WEB_SCRAPING'` (default: `'RSS'`)
- `listPageUrl`: URL of the listing page to scrape
- `scrapingConfig`: JSON configuration for extraction patterns

**Impact**: 
- Existing channels continue to work (defaults to RSS)
- New channels can use web scraping mode
- Database schema will be updated on next migration

### 2. Created WebScraperService

**File**: `packages/rss-aggregation/api/web-scraper/web-scraper.service.ts`

**Features**:
- Fetches HTML from listing pages
- Extracts articles using configurable selectors
- Supports CSS selectors and regex patterns
- Resolves relative URLs to absolute
- Parses Portuguese date formats
- Handles timeouts and errors gracefully

**Key Methods**:
- `scrapeNewsList(url, config)`: Main scraping method
- `fetchHTML(url)`: Fetches HTML with proper headers
- `extractArticles(html, baseUrl, config)`: Extracts article data
- `buildSelectorPattern(selector)`: Converts CSS selectors to regex

### 3. Created WebScraperModule

**File**: `packages/rss-aggregation/api/web-scraper/web-scraper.module.ts`

**Purpose**: Module registration for dependency injection

### 4. Updated RSSAggregationModule

**File**: `packages/rss-aggregation/api/rss-aggregation.module.ts`

**Changes**: Added `WebScraperModule` to submodules

### 5. Enhanced ChannelsService

**File**: `packages/rss-aggregation/api/channels/channels.service.ts`

**Changes**:

1. **Injected WebScraperService**:
   ```typescript
   constructor(
       private readonly parserService: ParserService,
       private readonly webScraperService: WebScraperService
   )
   ```

2. **Updated `processSingleChannel`**:
   - Checks `sourceType` field
   - Routes to `processWebScrapingChannel` if `WEB_SCRAPING`
   - Falls back to RSS for backward compatibility

3. **Added `processWebScrapingChannel`**:
   - Validates `listPageUrl`
   - Parses `scrapingConfig` (JSON or object)
   - Calls `webScraperService.scrapeNewsList`
   - Processes up to 20 articles
   - Includes 500ms delay between articles

4. **Added `getDefaultScrapingConfig`**:
   - Provides sensible defaults for common patterns
   - Can be overridden per channel

5. **Added `processScrapedArticle`**:
   - Checks for existing articles (by link)
   - Formats scraped data to RSS-like structure
   - Reuses `processFeedItemSafely` for consistency

6. **Extended `processFeedItemSafely`**:
   - Added `WEB_SCRAPING` feed type handling
   - Processes scraped articles same as RSS items
   - Supports full content extraction via parser (if `requestLink: true`)

## Benefits

### For Dust2.com.br Specifically

1. **Images**: Articles now include featured images from listing page
2. **More Content**: Can collect more articles than RSS limit
3. **Full Content**: Can get full article content with parser
4. **Better Metadata**: More complete article information

### General Benefits

1. **Flexibility**: Can use RSS or scraping per channel
2. **Backward Compatible**: Existing RSS channels unaffected
3. **Configurable**: Per-channel scraping patterns
4. **Resilient**: Error handling and timeouts
5. **Respectful**: Rate limiting and proper headers

## Technical Details

### Selector Support

The scraper supports:
- **Class selectors**: `.class-name`
- **ID selectors**: `#id-name`
- **Tag selectors**: `tag-name`
- **Complex selectors**: `parent .child` (extracts last part)

### Date Parsing

Supports:
- ISO format: `2025-10-31T19:00:00Z`
- Portuguese format: `31 Out 2025`, `31 Outubro 2025`
- English format: Standard Date.parse()

### URL Resolution

- Absolute URLs: Passed through
- Protocol-relative: `//example.com` → `https://example.com`
- Absolute paths: `/path` → `https://domain.com/path`
- Relative paths: `path` → `https://domain.com/path`

## Testing Recommendations

1. **Unit Tests**:
   - Test `WebScraperService` with sample HTML
   - Test selector pattern building
   - Test date parsing (Portuguese formats)

2. **Integration Tests**:
   - Test end-to-end scraping flow
   - Test with Dust2.com.br page
   - Verify image extraction

3. **Manual Testing**:
   - Configure Dust2 channel for scraping
   - Process channel manually
   - Verify articles in admin panel

## Migration Path

### For Existing Channels

No action required. Existing channels continue using RSS mode.

### For New Scraping Channels

1. Create or update channel
2. Set `sourceType: 'WEB_SCRAPING'`
3. Set `listPageUrl` to listing page
4. Optionally set `scrapingConfig` (uses defaults otherwise)
5. Set `requestLink: true` for full content
6. Enable `active: true`

## Performance Considerations

- **Fetch Time**: ~1-2 seconds per listing page
- **Processing Time**: ~1-2 seconds per article (with 500ms delay)
- **Total Time**: ~30-60 seconds for 20 articles
- **Memory**: HTML limited to 500KB per page
- **Timeout**: 15 seconds fetch, 30 seconds per article

## Future Enhancements

Potential improvements:
1. **Caching**: Cache listing page HTML (5-10 minutes)
2. **Pagination**: Support multiple pages of articles
3. **Better Selectors**: Add XPath or CSS selector library
4. **Image Validation**: Check if images exist before saving
5. **Incremental Updates**: Only fetch new articles

## Breaking Changes

**None** - Fully backward compatible

## Rollback Plan

If issues occur:

1. Set `sourceType: 'RSS'` for affected channels
2. Remove `listPageUrl` and `scrapingConfig`
3. Channels will fall back to RSS mode

## Related Documentation

- `docs/WEB_SCRAPING_ALTERNATIVE.md` - Comparison of options
- `docs/WEB_SCRAPING_IMPLEMENTATION_PLAN.md` - Implementation plan
- `docs/WEB_SCRAPING_DUST2_CONFIG.md` - Dust2-specific configuration

