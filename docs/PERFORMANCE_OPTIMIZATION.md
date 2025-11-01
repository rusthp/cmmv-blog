# Performance Optimization Recommendations

This document outlines performance optimizations for the CMMV Blog project, identified through codebase analysis using MCP vectorizer.

> **📝 Implementation Status**: Several high-priority optimizations have been implemented.  
> **📋 See**: [PERFORMANCE_OPTIMIZATION_CHANGELOG.md](./PERFORMANCE_OPTIMIZATION_CHANGELOG.md) for details on what was implemented.

## Current State Analysis

### Existing Optimizations
- ✅ File-level caching with ETag support (`apps/web/server.ts`)
- ✅ Page-level caching (30 minutes TTL)
- ✅ HTTP compression (gzip/brotli)
- ✅ Static file serving with cache headers
- ✅ Cache manager with filesystem backend (TTL: 600s)

### Identified Areas for Improvement

## 1. Database Query Optimization

### Current Issues
- Multiple sequential `Repository.findOne()` calls
- No batch query support visible
- Potential N+1 query problems

### Recommendations

#### 1.1 Batch Queries
**Location**: `packages/yt-aggregation/api/channels/channels.service.ts`, `packages/odds/api/`

Replace multiple sequential queries with batch operations:

```typescript
// ❌ Current approach (multiple queries)
const existingVideo = await Repository.findOne(YTVideosEntity, { id: videoId });
if (!existingVideo) {
    const channel = await Repository.findOne(YTChannelsEntity, { id: channelId });
}

// ✅ Optimized approach (single query with relations)
const videos = await Repository.findAll(YTVideosEntity, 
    { channelId },
    [],
    { relations: ['channel'] }
);
```

#### 1.2 Query Result Caching
**Location**: `apps/api/src/config.ts`

Add query result caching for frequently accessed data:

```typescript
cache: {
    store: "cache-manager-fs-binary",
    path: "./cache",
    ttl: 600,
    // Add query-specific TTLs
    queryCache: {
        enabled: true,
        defaultTtl: 300, // 5 minutes for queries
        entityTtls: {
            'YTVideosEntity': 600,
            'OddsSettingsEntity': 1800, // 30 minutes for settings
        }
    }
}
```

#### 1.3 SQLite Performance Tuning
**Location**: `apps/api/src/config.ts`

Enable SQLite performance optimizations:

```typescript
repository: {
    type: 'sqlite',
    database: "./database.sqlite",
    synchronize: true,
    logging: false,
    // Add SQLite optimizations
    extra: {
        // Enable WAL mode for better concurrency
        pragma: {
            journal_mode: 'WAL',
            synchronous: 'NORMAL', // Balance between safety and speed
            cache_size: '-64000', // 64MB cache
            temp_store: 'MEMORY',
            mmap_size: 268435456, // 256MB memory-mapped I/O
            page_size: 4096,
            foreign_keys: true
        }
    }
}
```

## 2. Cache Strategy Improvements

### 2.1 Multi-Level Caching
**Location**: `apps/api/src/config.ts`

Implement a multi-tier caching strategy:

```typescript
cache: {
    // Primary: In-memory cache (fastest)
    memory: {
        enabled: true,
        maxSize: 100, // Max number of items
        ttl: 60 // 1 minute for hot data
    },
    // Secondary: Filesystem cache (slower but persistent)
    filesystem: {
        store: "cache-manager-fs-binary",
        path: "./cache",
        ttl: 600 // 10 minutes
    }
}
```

### 2.2 Cache Invalidation Strategy
Implement smart cache invalidation:

```typescript
// Cache tags for related data
interface CacheEntry {
    value: any;
    tags: string[];
    expiresAt: number;
}

// Invalidate by tags
cache.invalidateByTags(['channel:123', 'videos']);
```

### 2.3 SSR Page Cache Optimization
**Location**: `apps/web/server.ts`

Optimize page caching with varying TTLs based on content type:

```typescript
const PAGE_CACHE_DURATION = {
    static: 60 * 60 * 1000, // 1 hour for static pages
    dynamic: 10 * 60 * 1000, // 10 minutes for dynamic content
    api: 5 * 60 * 1000, // 5 minutes for API responses
};

// Cache key includes content hash for better cache hits
const cacheKey = `${url}:${contentHash}`;
```

## 3. Batch Processing Optimization

### 3.1 Batch Inserts/Updates
**Location**: `packages/odds/api/teams/teams.service.ts`, `packages/yt-aggregation/`

Replace individual updates with batch operations:

```typescript
// ❌ Current approach
for (const team of teams) {
    await Repository.update(OddsTeamsEntity, { id: team.id }, team);
}

// ✅ Optimized approach
await Repository.batchUpdate(OddsTeamsEntity, teams, 'id');

// Or using transactions
await Repository.transaction(async (tx) => {
    await tx.batchInsert(OddsTeamsEntity, newTeams);
    await tx.batchUpdate(OddsTeamsEntity, existingTeams);
});
```

### 3.2 Parallel Processing
Use Promise.all for independent operations:

```typescript
// ❌ Current approach
for (const country of countries) {
    await syncVenuesForCountry(country.id);
}

// ✅ Optimized approach (with concurrency limit)
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent operations

await Promise.all(
    countries.map(country => 
        limit(() => syncVenuesForCountry(country.id))
    )
);
```

## 4. Compression Optimization

### 4.1 Pre-compression for Static Assets
**Location**: Build process

Pre-compress static assets during build:

```typescript
// vite.config.ts
import viteCompression from 'vite-plugin-compression';

export default {
    plugins: [
        viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
        }),
        viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
        }),
    ],
};
```

### 4.2 Compression Level Tuning
**Location**: `apps/web/server.ts`

Adjust compression levels for better performance:

```typescript
const compressHtml = (html: string, acceptEncoding: string = ''): { data: Buffer | string, encoding: string | null } => {
    if (acceptEncoding.includes('br')) {
        return {
            data: zlib.brotliCompressSync(html, {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // Balance speed/ratio
                    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: html.length
                }
            }),
            encoding: 'br'
        };
    } else if (acceptEncoding.includes('gzip')) {
        return {
            data: zlib.gzipSync(html, {
                level: 6, // Balance speed/ratio
            }),
            encoding: 'gzip'
        };
    }
    // ...
};
```

## 5. API Response Optimization

### 5.1 Response Pagination
**Location**: All API services

Ensure consistent pagination:

```typescript
async findAll(queries: any) {
    const { page = 1, limit = 20, ...filters } = queries;
    const offset = (page - 1) * limit;
    
    return await Repository.findAll(
        Entity,
        { ...filters },
        [],
        {
            limit,
            offset,
            orderBy: { createdAt: 'DESC' }
        }
    );
}
```

### 5.2 Selective Field Loading
Load only required fields:

```typescript
await Repository.findAll(
    Entity,
    filters,
    [],
    {
        select: ['id', 'title', 'publishedAt'], // Only load needed fields
        relations: ['author'] // Only load needed relations
    }
);
```

## 6. Build & Bundle Optimization

### 6.1 Code Splitting
**Location**: `apps/web/vite.config.ts`

Implement route-based code splitting:

```typescript
export default {
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor': ['vue', 'vue-router'],
                    'editor': ['./src/composables/editor'],
                }
            }
        }
    }
};
```

### 6.2 Tree Shaking
Ensure proper tree shaking configuration:

```typescript
export default {
    build: {
        terserOptions: {
            compress: {
                drop_console: process.env.NODE_ENV === 'production',
                drop_debugger: true,
            }
        }
    }
};
```

## 7. Server Optimization

### 7.1 Connection Pooling
**Location**: Database configuration

If using connection pooling (when migrating from SQLite):

```typescript
repository: {
    extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
    }
}
```

### 7.2 Keep-Alive Connections
**Location**: `apps/web/server.ts`

Enable HTTP keep-alive:

```typescript
const server = http.createServer(handler);
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds
```

## 8. Monitoring & Profiling

### 8.1 Add Performance Metrics
Implement performance monitoring:

```typescript
// Add to API responses
res.setHeader('X-Response-Time', `${duration}ms`);
res.setHeader('X-Cache-Status', cacheHit ? 'HIT' : 'MISS');
```

### 8.2 Query Profiling
Enable query profiling in development:

```typescript
repository: {
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : false,
    maxQueryExecutionTime: 1000, // Log slow queries (>1s)
}
```

## Implementation Status

### ✅ Implemented (High Priority)
1. ✅ **SQLite performance tuning** - WAL mode, pragmas, cache optimization
   - **File**: `apps/api/src/config.ts`
   - **Status**: Complete
   - **See**: `docs/PERFORMANCE_OPTIMIZATION_CHANGELOG.md`

2. ✅ **Multi-level caching strategy** - Entity-specific TTLs, query caching
   - **File**: `apps/api/src/config.ts`
   - **Status**: Complete
   - **See**: `docs/PERFORMANCE_OPTIMIZATION_CHANGELOG.md`

3. ✅ **Compression level tuning** - Optimized Brotli/Gzip settings
   - **File**: `apps/web/server.ts`
   - **Status**: Complete
   - **See**: `docs/PERFORMANCE_OPTIMIZATION_CHANGELOG.md`

4. ✅ **HTTP Keep-Alive optimization** - Connection reuse
   - **File**: `apps/web/server.ts`
   - **Status**: Complete
   - **See**: `docs/PERFORMANCE_OPTIMIZATION_CHANGELOG.md`

5. ✅ **Cache duration optimization** - URL-pattern based TTLs
   - **File**: `apps/web/server.ts`
   - **Status**: Complete
   - **See**: `docs/PERFORMANCE_OPTIMIZATION_CHANGELOG.md`

### 📋 Pending (Medium Priority)
6. ⏳ Batch queries instead of loops - Requires repository layer changes
7. ⏳ Parallel processing with concurrency limits - Requires service refactoring
8. ⏳ Pre-compression of static assets - Requires build process changes
9. ⏳ Selective field loading - Requires repository layer support

### 🔮 Future Enhancements (Low Priority)
10. ⏳ Cache invalidation by tags
11. ⏳ Performance metrics headers
12. ⏳ Code splitting optimization

---

**📝 For detailed implementation notes, see**: `docs/PERFORMANCE_OPTIMIZATION_CHANGELOG.md`

## Testing Performance Improvements

After implementing optimizations:

1. **Load Testing**: Use tools like `autocannon` or `k6`
   ```bash
   npx autocannon -c 100 -d 30 http://localhost:5001
   ```

2. **Database Query Analysis**: Enable query logging to identify slow queries

3. **Memory Profiling**: Monitor memory usage with `node --inspect`

4. **Cache Hit Rate**: Track cache hit/miss ratios

## Expected Performance Gains

Based on similar optimizations:
- **Database queries**: 30-50% faster with batch operations
- **Cache hits**: 40-60% improvement with multi-level caching
- **Compression**: 10-20% better compression ratios with tuned levels
- **Overall response time**: 25-40% improvement for typical workloads

## Notes

- These optimizations maintain the existing architecture
- All changes are backward compatible
- Monitor performance after each optimization
- Consider load patterns specific to your deployment

