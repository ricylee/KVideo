import { useEffect, useRef, useState } from 'react';
import { parseHLSManifest, type Segment } from '@/lib/utils/hlsManifestParser';
import { downloadSegmentQueue } from '@/lib/utils/segmentDownloader';

interface UseHLSPreloaderProps {
    src: string;
    currentTime: number;
}

export function useHLSPreloader({ src, currentTime }: UseHLSPreloaderProps) {
    const abortControllerRef = useRef<AbortController | null>(null);
    const segmentsRef = useRef<Segment[]>([]);
    const [isManifestLoaded, setIsManifestLoaded] = useState(false);
    const lastStartIndexRef = useRef<number>(-1);

    // Fetch and parse manifest when src changes
    useEffect(() => {
        if (!src || !src.endsWith('.m3u8')) return;

        const fetchManifest = async () => {
            try {
                console.log('[Preloader] Fetching manifest:', src);

                // Clear cache for this video on mount (fresh start each time)
                if ('caches' in window) {
                    const cache = await caches.open('video-cache-v1');
                    const requests = await cache.keys();
                    const baseUrl = src.substring(0, src.lastIndexOf('/') + 1);

                    for (const request of requests) {
                        if (request.url.startsWith(baseUrl)) {
                            await cache.delete(request);
                        }
                    }
                    console.log('[Preloader] Cleared previous cache for this video');
                }

                const segments = await parseHLSManifest(src);
                segmentsRef.current = segments;
                setIsManifestLoaded(true);
                const totalDuration = segments[segments.length - 1]?.startTime + segments[segments.length - 1]?.duration || 0;
                console.log(`[Preloader] Parsed ${segments.length} segments. Total duration: ${totalDuration.toFixed(2)}s`);
            } catch (error) {
                console.error('[Preloader] Error fetching manifest:', error);
            }
        };

        fetchManifest();
    }, [src]);

    // Manage downloads based on currentTime
    useEffect(() => {
        if (!isManifestLoaded || segmentsRef.current.length === 0) return;

        // Find segment index for currentTime
        let startIndex = 0;
        for (let i = 0; i < segmentsRef.current.length; i++) {
            if (currentTime < segmentsRef.current[i].startTime + segmentsRef.current[i].duration) {
                startIndex = i;
                break;
            }
        }

        if (startIndex >= segmentsRef.current.length) return;

        // Check if this is sequential playback or a seek
        const diff = startIndex - lastStartIndexRef.current;
        const isSequential = diff >= 0 && diff < 3;

        if (isSequential && abortControllerRef.current) {
            return; // Continue current download
        }

        console.log(`[Preloader] Seek detected. Current Time: ${currentTime.toFixed(2)}s. Starting from segment ${startIndex}.`);
        lastStartIndexRef.current = startIndex;

        // Abort previous queue and start new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        downloadSegmentQueue({
            segments: segmentsRef.current,
            startIndex,
            signal: abortControllerRef.current.signal
        });
    }, [isManifestLoaded, currentTime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);
}
