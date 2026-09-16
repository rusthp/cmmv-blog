## 1. Local Cache Mechanism
- [x] 1.1 Create `images_cache` schema/model for storing mapped images.
- [x] 1.2 Implement caching function to download and store images securely.

## 2. Validation & Recovery Pipeline
- [x] 2.1 Implement whitelist-based domain validation + DNS SSRF prevention.
- [x] 2.2 Implement HEAD request validation for external images with size limits.
- [x] 2.3 Add fallback logic: Check local cache by originalUrl if external fails.

## 3. Placeholder Generation
- [x] 3.1 Implement generation of automatic SVG placeholders with post title.
- [x] 3.2 Add fallback logic to use generated placeholder as last resort.

## 4. Testing
- [x] 4.1 Write tests for image validation and cache retrieval.
- [/] 4.2 Verify 100% test coverage for the fallback logic.
