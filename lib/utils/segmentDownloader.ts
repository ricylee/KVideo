/**
 * Segment Downloader Utility
 * Handles parallel segment downloading with concurrency control
 */

import type { Segment } from './hlsManifestParser';

interface DownloadQueueOptions {
    segments: Segment[];
    startIndex: number;
    signal: AbortSignal;
    onProgress?: (current: number, total: number) => void;
}

const CONCURRENCY = 1000;
const TIMEOUT_MS = 15000;
const CACHE_NAME = 'video-cache-v1';

export async function downloadSegmentQueue(options: DownloadQueueOptions): Promise<void> {
    const { segments, startIndex, signal, onProgress } = options;

    if (!('caches' in window)) return;

    const cache = await caches.open(CACHE_NAME);
    let activeCount = 0;
    let currentIndex = startIndex;

    const processNext = async () => {
        if (signal.aborted || currentIndex >= segments.length) return;

        const segment = segments[currentIndex];
        const url = segment.url;
        currentIndex++;
        activeCount++;

        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);
        const fetchSignal = anySignal([signal, timeoutController.signal]);

        try {
            const match = await cache.match(url, { ignoreSearch: true });
            if (match) {
                onProgress?.(currentIndex, segments.length);
                console.log(`[Preloader] 已缓存，跳过: ${currentIndex}/${segments.length}`);
            } else {
                console.log(`[Preloader] 正在下载片段 ${currentIndex}/${segments.length}`);
                const response = await fetch(url, { signal: fetchSignal });
                if (response.ok) {
                    try {
                        await cache.put(url, response.clone());
                        onProgress?.(currentIndex, segments.length);
                    } catch (e) { /* ignore quota errors */ }
                }
            }
        } catch (err) {
            // Ignore errors
        } finally {
            clearTimeout(timeoutId);
            activeCount--;
            if (!signal.aborted) processNext();
        }
    };

    // Start initial batch
    for (let i = 0; i < CONCURRENCY && currentIndex < segments.length; i++) {
        processNext();
    }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort();
            return signal;
        }
        signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    return controller.signal;
}
