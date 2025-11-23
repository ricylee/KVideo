'use client';

import { useDesktopPlayerState } from './hooks/useDesktopPlayerState';
import { useDesktopPlayerLogic } from './hooks/useDesktopPlayerLogic';
import { useHLSPreloader } from './hooks/useHLSPreloader';
import { DesktopControlsWrapper } from './desktop/DesktopControlsWrapper';
import { DesktopOverlayWrapper } from './desktop/DesktopOverlayWrapper';

interface DesktopVideoPlayerProps {
  src: string;
  poster?: string;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  initialTime?: number;
  shouldAutoPlay?: boolean;
}

export function DesktopVideoPlayer({
  src,
  poster,
  onError,
  onTimeUpdate,
  initialTime = 0,
  shouldAutoPlay = false
}: DesktopVideoPlayerProps) {
  const { refs, state } = useDesktopPlayerState();
  const { currentTime } = state;

  // Preload HLS segments
  useHLSPreloader({ src, currentTime });

  const {
    videoRef,
    containerRef,
  } = refs;

  const {
    isPlaying,
    setShowControls,
    setIsLoading,
  } = state;

  const logic = useDesktopPlayerLogic({
    src,
    initialTime,
    shouldAutoPlay,
    onError,
    onTimeUpdate,
    refs,
    state
  });

  const {
    handleMouseMove,
    togglePlay,
    handlePlay,
    handlePause,
    handleTimeUpdateEvent,
    handleLoadedMetadata,
    handleVideoError,
  } = logic;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-[var(--radius-2xl)] overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        poster={poster}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdateEvent}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onClick={togglePlay}
      />

      <DesktopOverlayWrapper
        state={state}
        onTogglePlay={togglePlay}
      />

      <DesktopControlsWrapper
        state={state}
        logic={logic}
        refs={refs}
      />
    </div>
  );
}
