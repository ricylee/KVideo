'use client';

import { useEffect } from 'react';
import { useScreenOrientation } from '@/lib/hooks/useMobilePlayer';
import { useMobilePlayerState } from './hooks/useMobilePlayerState';
import { useMobilePlayerLogic } from './hooks/useMobilePlayerLogic';
import { useHLSPreloader } from './hooks/useHLSPreloader';
import { useMobileGestures } from './hooks/useMobileGestures';
import { MobileControlsWrapper } from './mobile/MobileControlsWrapper';
import { MobileOverlay } from './mobile/MobileOverlay';
import { MobileSkipIndicator } from './mobile/MobileSkipIndicator';
import { getProxyUrl } from './utils/urlUtils';

interface MobileVideoPlayerProps {
  src: string;
  poster?: string;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  initialTime?: number;
  shouldAutoPlay?: boolean;
}

export function MobileVideoPlayer({
  src,
  poster,
  onError,
  onTimeUpdate,
  initialTime = 0,
  shouldAutoPlay = false
}: MobileVideoPlayerProps) {
  const { refs, state } = useMobilePlayerState();
  const { currentTime } = state;

  // Preload HLS segments
  useHLSPreloader({ src, currentTime, videoRef: refs.videoRef, isLoading: state.isLoading });

  const {
    videoRef,
    containerRef,
    controlsTimeoutRef
  } = refs;

  const {
    isPlaying,
    isFullscreen,
    showControls,
    isLoading,
    showSkipIndicator,
    skipAmount,
    skipSide,
    toastMessage,
    showToast,
    setShowControls,
    setIsLoading
  } = state;

  const logic = useMobilePlayerLogic({
    src,
    initialTime,
    shouldAutoPlay,
    onError,
    onTimeUpdate,
    refs,
    state
  });

  const {
    skipVideo,
    togglePlay,
    handlePlay,
    handlePause,
    handleTimeUpdateEvent,
    handleLoadedMetadata,
    handleVideoError,
  } = logic;

  // Screen orientation management
  useScreenOrientation(isFullscreen);

  // Double tap handler
  const { handleTap } = useMobileGestures({
    skipVideo,
    showSkipIndicator,
    showControls,
    setShowControls,
    controlsTimeoutRef,
    isPlaying,
    togglePlay,
  });

  const proxiedSrc = getProxyUrl(src);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-[var(--radius-2xl)] overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain touch-none"
        src={proxiedSrc}
        poster={poster}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdateEvent}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onTouchEnd={handleTap}
        onClick={(e) => e.preventDefault()}
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
      />

      <MobileOverlay
        isLoading={isLoading}
        showToast={showToast}
        toastMessage={toastMessage}
      />

      <MobileSkipIndicator
        showSkipIndicator={showSkipIndicator}
        skipSide={skipSide}
        skipAmount={skipAmount}
      />

      <MobileControlsWrapper
        src={src}
        state={state}
        logic={logic}
        refs={refs}
      />
    </div>
  );
}
