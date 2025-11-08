# Image Caching Implementation

This application implements a comprehensive multi-layer image caching strategy for League of Legends champion icons.

## Caching Layers

### 1. HTTP Cache Headers (`image-cache.interceptor.ts`)

- Intercepts HTTP requests for images
- Adds `Cache-Control: public, max-age=86400, immutable` headers
- Enables browser HTTP cache for 24 hours
- Automatically detects image URLs (png, jpg, jpeg, webp, gif)
- Specifically targets League of Legends CDN URLs

### 2. Cache API (`image-preload.service.ts`)

- Uses browser Cache API for persistent storage
- Cache name: `lol-champion-images-v1`
- Cache expiry: 7 days
- Features:
    - Preloads images immediately after first render (no idle callback delay)
    - First 20 images loaded with high priority for instant availability
    - Remaining images preloaded in batches of 10
    - Automatic cleanup of expired cache entries
    - Adds custom metadata (`x-cached-date`) to track cache age
    - Checks cache before fetching from network
    - Preloads images into both Cache API and browser HTTP cache

### 3. Service Worker (Production Only)

- Angular Service Worker configuration (`ngsw-config.json`)
- Two data groups:
    - **champion-api**: Caches API responses for 1 day
    - **champion-images**: Caches champion images for 7 days
- Strategy: `performance` (cache-first, network fallback)
- Only active in production builds (`!isDevMode()`)
- Registers immediately to intercept image requests as soon as possible

### 4. Local Storage (`champion-data.service.ts`)

- Caches champion data (not images) for 24 hours
- Prevents unnecessary API calls
- Version-controlled cache with automatic invalidation

## How It Works

1. **First Load**:
    - App fetches champion data from API
    - Data is cached in LocalStorage
    - Images are preloaded immediately in the background:
        - First 20 images loaded with high priority
        - Remaining images loaded in batches
    - Images cached in both Cache API and browser HTTP cache
    - Service Worker installs and activates for future requests

2. **Subsequent Loads**:
    - Champion data loaded from LocalStorage
    - Images loaded from Cache API (instant)
    - If cache miss, browser HTTP cache serves images
    - If HTTP cache miss, network fetch with automatic caching

3. **Production Builds**:
    - Service Worker adds additional caching layer
    - Offline support for previously loaded images
    - Automatic cache updates on new versions

## Cache Management

### Clear Image Cache

The `ImagePreloadService` provides a `clearCache()` method:

```typescript
inject(ImagePreloadService).clearCache();
```

### Clear Champion Data Cache

The `ChampionDataService` provides a `clearCache()` method:

```typescript
inject(ChampionDataService).clearCache();
```

## Browser Optimization

- Preconnect hints to CDN in `index.html`
- DNS prefetch for faster connections
- Progressive Web App manifest for installability
- Theme color for native app experience

## Cache Sizes

- Champion API: Max 100 entries
- Champion Images: Max 200 images
- Automatic cleanup when limits exceeded
- Age-based expiration (7 days for images)

## Development vs Production

**Development** (ng serve):

- HTTP cache only
- Cache API preloading
- No service worker

**Production** (ng build):

- All caching layers active
- Service worker enabled
- Maximum performance and offline support

## Testing Cache

1. Open DevTools > Application > Cache Storage
2. See `lol-champion-images-v1` with cached images
3. Network tab shows cached responses (200 from cache)
4. Offline mode works for previously loaded content

## Benefits

- **Instant Load Times**: Images load instantly from cache
- **Reduced Bandwidth**: Images only fetched once
- **Offline Support**: Works without internet (after first load)
- **Better UX**: No flickering or loading delays
- **CDN Cost Savings**: Fewer requests to external CDN
