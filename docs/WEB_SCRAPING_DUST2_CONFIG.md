# Dust2.com.br - Web Scraping Configuration

## Overview

This document provides the configuration for scraping news from Dust2.com.br using the new web scraping feature.

## Configuration

### Channel Setup

To configure Dust2 for web scraping, update the channel with these settings:

```json
{
    "name": "Dust2 Brasil",
    "url": "https://www.dust2.com.br/",
    "rss": "https://www.dust2.com.br/rss",
    "sourceType": "WEB_SCRAPING",
    "listPageUrl": "https://www.dust2.com.br/noticias",
    "requestLink": true,
    "active": true,
    "intervalUpdate": 3600000,
    "scrapingConfig": {
        "articleSelector": ".news-item, .article-card, article",
        "titleSelector": "h3 a, h2 a, .title a",
        "linkSelector": "h3 a, h2 a, .title a",
        "imageSelector": "img, .featured-image img, .thumbnail img",
        "dateSelector": ".date, .published, time",
        "excerptSelector": ".excerpt, .summary, .description"
    }
}
```

## How to Apply

### Via Admin Panel (Recommended)

1. Go to **Admin Panel** → **RSS Aggregation** → **Channels**
2. Find or create the "Dust2 Brasil" channel
3. Update the following fields:
   - **Source Type**: Select `WEB_SCRAPING`
   - **List Page URL**: `https://www.dust2.com.br/noticias`
   - **Scraping Config**: Paste the JSON config above
   - **Request Link**: Enable (to get full content)
   - **Active**: Enable

### Via API

```bash
# Update existing channel
curl -X PUT http://localhost:5000/feed/channels/{channelId} \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "WEB_SCRAPING",
    "listPageUrl": "https://www.dust2.com.br/noticias",
    "scrapingConfig": "{\"articleSelector\":\".news-item\",\"titleSelector\":\"h3 a\",\"linkSelector\":\"h3 a\",\"imageSelector\":\"img\",\"dateSelector\":\".date\"}",
    "requestLink": true
  }'
```

## Expected Results

After configuration and processing:

- ✅ **Images**: Articles will have featured images extracted from the listing page
- ✅ **Content**: Full article content (if `requestLink: true`)
- ✅ **More Articles**: Up to 20 articles per collection (vs 10-20 from RSS)
- ✅ **Better Metadata**: More complete information

## Troubleshooting

### No Articles Found

1. **Check HTML Structure**: The selectors may need adjustment if Dust2 changes their HTML
2. **Verify URL**: Ensure `listPageUrl` is accessible
3. **Check Logs**: Look for scraping errors in the API logs

### Images Not Extracted

1. **Verify Image Selector**: The `imageSelector` may need adjustment
2. **Check HTML**: Images might be lazy-loaded or use different attributes
3. **Fallback**: The system will try meta tag extraction as fallback

### Articles Not Processing

1. **Check `requestLink`**: Must be `true` for full content extraction
2. **Verify Parser**: Ensure parser service is configured and working
3. **Check Timeout**: Articles have 30-second processing timeout

## Testing

To test the configuration:

1. **Manual Process**:
   ```
   GET /feed/channels/processFeed/{channelId}
   ```

2. **Check Logs**:
   - Look for: `Scraping {channelName} from {listPageUrl}`
   - Look for: `Extracted X articles from {url}`
   - Look for: `Processing X articles for {channelName}`

3. **Verify Results**:
   - Go to **Admin Panel** → **RSS Aggregation** → **Raw Feed Items**
   - Check that new articles have images and content

## Notes

- **Rate Limiting**: The scraper includes a 500ms delay between articles
- **Timeout**: 15 seconds for HTML fetch, 30 seconds per article processing
- **Respect**: Follows robots.txt and uses standard browser headers
- **Fallback**: Can still use RSS by setting `sourceType: 'RSS'`

