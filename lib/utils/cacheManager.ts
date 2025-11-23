/**
 * Cache Management Utility
 * Handles clearing segments from cache
 */

const CACHE_NAME = 'video-cache-v1';

export async function clearSegmentsForUrl(url: string): Promise<void> {
    if (!('caches' in window)) return;

    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();

        // Parse the base URL to match against
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

        let deletedCount = 0;
        for (const request of requests) {
            if (request.url.startsWith(baseUrl)) {
                await cache.delete(request);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(`[CacheManager] Deleted ${deletedCount} segments for ${url}`);
        }
    } catch (error) {
        console.error('[CacheManager] Error clearing cache:', error);
    }
}

export async function clearAllCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
        const deleted = await caches.delete(CACHE_NAME);
        if (deleted) {
            console.log('[CacheManager] Cleared all cached segments');
            // Recreate the cache for future use
            await caches.open(CACHE_NAME);
        }
    } catch (error) {
        console.error('[CacheManager] Error clearing all cache:', error);
    }
}
