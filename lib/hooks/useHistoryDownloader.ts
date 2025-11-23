/**
 * History Downloader Hook
 * Downloads all segments for videos in watch history
 */

'use client';

import { useEffect, useRef } from 'react';
import { useHistoryStore } from '@/lib/store/history-store';
import { parseHLSManifest } from '@/lib/utils/hlsManifestParser';
import { downloadSegmentQueue } from '@/lib/utils/segmentDownloader';

export function useHistoryDownloader() {
    const viewingHistory = useHistoryStore((state) => state.viewingHistory);
    const processedUrlsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (viewingHistory.length === 0) return;

        const downloadHistoryVideos = async () => {
            for (const item of viewingHistory) {
                const { url } = item;

                // Skip if already processed
                if (processedUrlsRef.current.has(url)) continue;

                // Skip if not m3u8
                if (!url.endsWith('.m3u8')) continue;

                console.log(`[HistoryDownloader] Queueing background download for: ${item.title}`);
                processedUrlsRef.current.add(url);

                try {
                    const segments = await parseHLSManifest(url);
                    const controller = new AbortController();

                    // Download all segments (not just from playback position)
                    downloadSegmentQueue({
                        segments,
                        startIndex: 0,
                        signal: controller.signal,
                        onProgress: (current, total) => {
                            if (current % 50 === 0) {
                                console.log(`[HistoryDownloader] ${item.title}: ${current}/${total}`);
                            }
                        }
                    });
                } catch (error) {
                    console.error(`[HistoryDownloader] Failed to download ${item.title}:`, error);
                }
            }
        };

        downloadHistoryVideos();
    }, [viewingHistory]);
}

export function HistoryDownloader() {
    useHistoryDownloader();
    return null;
}
