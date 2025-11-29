import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { getProxyUrl } from '../utils/urlUtils';

interface UseHlsPlayerProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    src: string;
    autoPlay?: boolean;
    onAutoPlayPrevented?: (error: Error) => void;
}

export function useHlsPlayer({
    videoRef,
    src,
    autoPlay = false,
    onAutoPlayPrevented
}: UseHlsPlayerProps) {
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Cleanup previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        let hls: Hls | null = null;
        const proxiedSrc = getProxyUrl(src);

        // Check if HLS is supported natively (Safari, Mobile Chrome)
        // We prefer native playback if available as it's usually more battery efficient
        const isNativeHlsSupported = video.canPlayType('application/vnd.apple.mpegurl');

        if (Hls.isSupported()) {
            // Use hls.js for browsers without native support (Desktop Chrome, Firefox, Edge)
            // OR if we want to force hls.js for better control (optional, but sticking to native first is safer)

            // Note: Some desktop browsers (like Safari) support native HLS.
            // We usually prefer native, BUT sometimes native implementation is buggy or lacks features.
            // For now, we follow the standard pattern: Native first, then HLS.js.
            // EXCEPT for Chrome on Desktop which reports canPlayType as '' (false).

            if (!isNativeHlsSupported) {
                console.log('[HLS] Initializing hls.js');
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hlsRef.current = hls;

                hls.loadSource(proxiedSrc);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('[HLS] Manifest parsed');

                    // Check for HEVC/H.265 codec (limited browser support)
                    if (hls) {
                        const levels = hls.levels;
                        if (levels && levels.length > 0) {
                            const hasHEVC = levels.some(level =>
                                level.videoCodec?.toLowerCase().includes('hev') ||
                                level.videoCodec?.toLowerCase().includes('h265')
                            );
                            if (hasHEVC) {
                                console.warn('[HLS] ⚠️ HEVC/H.265 codec detected - may not play in all browsers');
                                console.warn('[HLS] Supported: Safari with hardware acceleration, some Edge versions');
                                console.warn('[HLS] Not supported: Most Chrome/Firefox versions');
                            }
                        }
                    }

                    if (autoPlay) {
                        video.play().catch((err) => {
                            console.warn('[HLS] Autoplay prevented:', err);
                            onAutoPlayPrevented?.(err);
                        });
                    }
                });

                let networkErrorRetries = 0;
                let mediaErrorRetries = 0;
                const MAX_RETRIES = 3;

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                networkErrorRetries++;
                                console.error(`[HLS] Network error (${networkErrorRetries}/${MAX_RETRIES}), trying to recover...`, data);
                                if (networkErrorRetries <= MAX_RETRIES) {
                                    hls?.startLoad();
                                } else {
                                    console.error('[HLS] Too many network errors, giving up');
                                }
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                mediaErrorRetries++;
                                console.error(`[HLS] Media error (${mediaErrorRetries}/${MAX_RETRIES}), trying to recover...`, data);
                                if (mediaErrorRetries <= MAX_RETRIES) {
                                    hls?.recoverMediaError();
                                } else {
                                    console.error('[HLS] Too many media errors, giving up');
                                }
                                break;
                            default:
                                console.error('[HLS] Fatal error, cannot recover:', data);
                                hls?.destroy();
                                break;
                        }
                    } else {
                        // Non-fatal errors
                        console.warn('[HLS] Non-fatal error:', data.type, data.details);
                    }
                });
            } else {
                console.log('[HLS] Using native HLS support');
                // Native HLS support
                video.src = proxiedSrc;
            }
        } else if (isNativeHlsSupported) {
            // Fallback for environments where Hls.js is not supported but native is (e.g. iOS without MSE?)
            console.log('[HLS] Using native HLS support (Hls.js not supported)');
            video.src = proxiedSrc;
        } else {
            console.error('[HLS] HLS not supported in this browser');
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src, videoRef, autoPlay, onAutoPlayPrevented]);
}
