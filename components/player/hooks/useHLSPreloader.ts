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
    const isInitializedRef = useRef(false);
    const downloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch and parse manifest when src changes
    useEffect(() => {
        if (!src || !src.endsWith('.m3u8')) return;

        // Reset initialization flag when src changes
        isInitializedRef.current = false;
        lastStartIndexRef.current = -1;

        const fetchManifest = async () => {
            try {
                console.log('[Preloader] Fetching manifest:', src);

                // Parse manifest but keep existing cache (for faster playback on revisit)
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

    // Manage downloads based on currentTime with debounce
    useEffect(() => {
        if (!isManifestLoaded || segmentsRef.current.length === 0) return;

        // Clear any pending download timeout
        if (downloadTimeoutRef.current) {
            clearTimeout(downloadTimeoutRef.current);
        }

        // Debounce to avoid rapid restarts during initialization
        downloadTimeoutRef.current = setTimeout(() => {
            // Find segment index for currentTime
            let startIndex = 0;
            for (let i = 0; i < segmentsRef.current.length; i++) {
                if (currentTime < segmentsRef.current[i].startTime + segmentsRef.current[i].duration) {
                    startIndex = i;
                    break;
                }
            }

            // Offset start index by 3 segments to avoid competing with browser playback
            // The browser needs the immediate segments NOW; we preload the future.
            startIndex = Math.min(startIndex + 3, segmentsRef.current.length - 1);

            if (startIndex >= segmentsRef.current.length) return;

            // Check if this is sequential playback or a seek
            const diff = startIndex - lastStartIndexRef.current;
            const isSequential = diff >= 0 && diff < 3;

            // Skip if already downloading sequentially
            if (isSequential && isInitializedRef.current && abortControllerRef.current) {
                return; // Continue current download
            }

            // Only log on significant seeks or initial start
            if (!isInitializedRef.current) {
                console.log(`[Preloader] Initial start at segment ${startIndex} (${currentTime.toFixed(2)}s)`);
                isInitializedRef.current = true;
            } else if (!isSequential) {
                console.log(`[Preloader] Seek detected. Current Time: ${currentTime.toFixed(2)}s. Starting from segment ${startIndex}.`);
            }

            lastStartIndexRef.current = startIndex;

            // Abort previous queue and start new one
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            downloadSegmentQueue({
                segments: segmentsRef.current,
                startIndex,
                signal: abortControllerRef.current.signal,
                videoUrl: src // Pass the m3u8 URL for metadata tracking
            });
        }, isInitializedRef.current ? 0 : 100); // 100ms debounce on initial load only

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
