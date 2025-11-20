'use client';

import { useEffect, useRef, useState } from 'react';

interface DoubleTapHandler {
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
  onSingleTap: () => void;
  onSkipContinueLeft: () => void;
  onSkipContinueRight: () => void;
  isSkipModeActive: boolean;
}

/**
 * Hook for handling double-tap gestures on mobile devices
 * Divides the video into left/right zones for skip forward/backward
 */
export function useDoubleTap({
  onDoubleTapLeft,
  onDoubleTapRight,
  onSingleTap,
  onSkipContinueLeft,
  onSkipContinueRight,
  isSkipModeActive,
}: DoubleTapHandler) {
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | null }>({
    time: 0,
    side: null,
  });
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = (e: React.TouchEvent<HTMLVideoElement>) => {
    const currentTime = Date.now();
    const videoElement = e.currentTarget;
    const touch = e.touches[0] || e.changedTouches[0];

    if (!touch || !videoElement) return;

    // Calculate touch position relative to video element
    const rect = videoElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    const side = x < width / 2 ? 'left' : 'right';

    const timeDiff = currentTime - lastTapRef.current.time;
    const sameSide = lastTapRef.current.side === side;

    // Clear any pending single tap
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }

    // If skip mode is active, single tap continues skipping
    if (isSkipModeActive) {
      if (side === 'left') {
        onSkipContinueLeft();
      } else {
        onSkipContinueRight();
      }
      lastTapRef.current = { time: currentTime, side };
      return;
    }

    // Double tap detected (within 300ms on the same side)
    if (timeDiff < 300 && sameSide) {
      e.preventDefault();

      if (side === 'left') {
        onDoubleTapLeft();
      } else {
        onDoubleTapRight();
      }

      // Reset to prevent triple-tap
      lastTapRef.current = { time: 0, side: null };
    } else {
      // Possible single tap - wait to see if there's a double tap
      lastTapRef.current = { time: currentTime, side };

      singleTapTimeoutRef.current = setTimeout(() => {
        // After 300ms, no double tap detected, execute single tap action
        onSingleTap();
        singleTapTimeoutRef.current = null;
      }, 300);
    }
  };

  return { handleTap };
}

/**
 * Hook for managing screen orientation on mobile devices
 * Auto-rotates to landscape on fullscreen, portrait on exit
 */
export function useScreenOrientation(isFullscreen: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('screen' in window)) return;

    const handleOrientation = async () => {
      try {
        const screen = window.screen as any;

        if (isFullscreen) {
          // Fullscreen: Lock to landscape
          if (screen.orientation?.lock) {
            await screen.orientation.lock('landscape').catch((err: any) => {
              console.warn('Could not lock orientation:', err);
            });
          }
        } else {
          // Exit fullscreen: Unlock to allow portrait
          if (screen.orientation?.unlock) {
            screen.orientation.unlock();
          }
        }
      } catch (error) {
        console.warn('Orientation API not supported:', error);
      }
    };

    handleOrientation();

    // Cleanup: Always unlock on unmount
    return () => {
      try {
        const screen = window.screen as any;
        if (screen.orientation?.unlock) {
          screen.orientation.unlock();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [isFullscreen]);
}

/**
 * Hook to detect if the device is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if the device is iOS
 */
export function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkIOS = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(ios);
    };

    checkIOS();
  }, []);

  return isIOS;
}
