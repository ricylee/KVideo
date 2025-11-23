import { useCallback, useEffect } from 'react';
import { formatTime } from '@/lib/utils/format-utils';
import { usePlaybackPolling } from '../usePlaybackPolling';

interface UseMobilePlaybackProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    initialTime: number;
    shouldAutoPlay: boolean;
    setDuration: (duration: number) => void;
    setCurrentTime: (time: number) => void;
    setPlaybackRate: (rate: number) => void;
    setShowMoreMenu: (show: boolean) => void;
    setShowVolumeMenu: (show: boolean) => void;
    setShowSpeedMenu: (show: boolean) => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onError?: (error: string) => void;
    isDraggingProgressRef: React.MutableRefObject<boolean>;
    isTogglingRef: React.MutableRefObject<boolean>;
}

export function useMobilePlaybackControls({
    videoRef,
    isPlaying,
    setIsPlaying,
    setIsLoading,
    initialTime,
    shouldAutoPlay,
    setDuration,
    setCurrentTime,
    setPlaybackRate,
    setShowMoreMenu,
    setShowVolumeMenu,
    setShowSpeedMenu,
    onTimeUpdate,
    onError,
    isDraggingProgressRef,
    isTogglingRef
}: UseMobilePlaybackProps) {
    const togglePlay = useCallback(async () => {
        if (!videoRef.current || isTogglingRef.current) return;
        isTogglingRef.current = true;

        try {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                setShowMoreMenu(false);
                setShowVolumeMenu(false);
                setShowSpeedMenu(false);
                await videoRef.current.play();
            }
        } catch (error) {
            console.warn('Play/pause error:', error);
        } finally {
            isTogglingRef.current = false;
        }
    }, [isPlaying, videoRef, isTogglingRef, setShowMoreMenu, setShowVolumeMenu, setShowSpeedMenu]);

    const handlePlay = useCallback(() => setIsPlaying(true), [setIsPlaying]);
    const handlePause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

    const handleTimeUpdateEvent = useCallback(() => {
        if (!videoRef.current || isDraggingProgressRef.current) return;
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;
        setCurrentTime(current);
        setDuration(total);
        if (onTimeUpdate) {
            onTimeUpdate(current, total);
        }
    }, [videoRef, isDraggingProgressRef, setCurrentTime, setDuration, onTimeUpdate]);

    const handleLoadedMetadata = useCallback(() => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration);
        setIsLoading(false);

        // Fix for stuck at 00:00:00:
        // Only seek if we are at the very start (to avoid overwriting a previous seek)
        if (videoRef.current.currentTime < 0.5) {
            // If initialTime is 0, we seek to a tiny offset to help the browser/HLS buffer start.
            const startPosition = initialTime > 0 ? initialTime : 0.1;
            videoRef.current.currentTime = startPosition;
        }

        videoRef.current.play().catch((err: Error) => {
            console.warn('Autoplay was prevented:', err);
        });
    }, [videoRef, setDuration, setIsLoading, initialTime]);

    // Handle late initialization of initialTime (e.g. from async storage hydration)
    useEffect(() => {
        if (initialTime > 0 && videoRef.current) {
            // Only seek if we haven't progressed far (e.g. still near start)
            // AND if the target time is significantly different from current time (> 0.5s)
            // This prevents jumping if the user has already started watching and initialTime updates
            if (videoRef.current.currentTime < 2 && Math.abs(videoRef.current.currentTime - initialTime) > 0.5) {
                videoRef.current.currentTime = initialTime;
            }
        }
    }, [initialTime, videoRef]);

    // Force autoplay when shouldAutoPlay is true (for proxy retry)
    useEffect(() => {
        if (shouldAutoPlay && videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((err: Error) => {
                    console.warn('Force autoplay was prevented:', err);
                });
            }
        }
    }, [shouldAutoPlay, videoRef]);

    const handleVideoError = useCallback(() => {
        setIsLoading(false);
        if (onError) {
            onError('Video failed to load');
        }
    }, [setIsLoading, onError]);

    const changePlaybackSpeed = useCallback((speed: number) => {
        if (!videoRef.current) return;
        videoRef.current.playbackRate = speed;
        setPlaybackRate(speed);
        setShowSpeedMenu(false);
    }, [videoRef, setPlaybackRate, setShowSpeedMenu]);

    // Polling fallback for AirPlay and throttled events
    usePlaybackPolling({
        isPlaying,
        videoRef,
        isDraggingProgressRef,
        setCurrentTime,
        setDuration
    });

    return {
        togglePlay,
        handlePlay,
        handlePause,
        handleTimeUpdateEvent,
        handleLoadedMetadata,
        handleVideoError,
        changePlaybackSpeed,
        formatTime
    };
}
