'use client';

import { useRef, useState, useEffect } from 'react';
import { Icons } from '@/components/ui/Icon';
import { useDoubleTap, useScreenOrientation } from '@/lib/hooks/useMobilePlayer';

interface MobileVideoPlayerProps {
  src: string;
  poster?: string;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  initialTime?: number;
}

export function MobileVideoPlayer({
  src,
  poster,
  onError,
  onTimeUpdate,
  initialTime = 0
}: MobileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [skipAmount, setSkipAmount] = useState(0);
  const [skipSide, setSkipSide] = useState<'left' | 'right' | null>(null);
  const [showSkipIndicator, setShowSkipIndicator] = useState(false);
  const [wasPlayingBeforeMenu, setWasPlayingBeforeMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingProgressRef = useRef(false);
  const menuIdleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submenuIdleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTogglingRef = useRef(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Screen orientation management
  useScreenOrientation(isFullscreen);

  // Check for PiP support
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsPiPSupported('pictureInPictureEnabled' in document);
    }
  }, []);

  // Track viewport width for responsive toolbar
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    // Set initial width
    updateViewportWidth();

    // Update on resize
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  // Skip forward/backward with indicator
  const skipVideo = (seconds: number, side: 'left' | 'right') => {
    if (!videoRef.current) return;

    // Clear existing timeout
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
    }

    // If same side, accumulate
    const newSkipAmount = skipSide === side ? skipAmount + Math.abs(seconds) : Math.abs(seconds);
    setSkipAmount(newSkipAmount);
    setSkipSide(side);
    setShowSkipIndicator(true);

    // Apply skip
    const targetTime = side === 'left'
      ? Math.max(videoRef.current.currentTime - Math.abs(seconds), 0)
      : Math.min(videoRef.current.currentTime + Math.abs(seconds), duration);

    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);

    // Hide indicator after 1500ms of inactivity
    skipTimeoutRef.current = setTimeout(() => {
      setShowSkipIndicator(false);
      setSkipAmount(0);
      setSkipSide(null);
    }, 1500);
  };

  // Double tap handler
  const { handleTap } = useDoubleTap({
    onDoubleTapLeft: () => skipVideo(10, 'left'),
    onDoubleTapRight: () => skipVideo(10, 'right'),
    onSkipContinueLeft: () => skipVideo(10, 'left'),
    onSkipContinueRight: () => skipVideo(10, 'right'),
    isSkipModeActive: showSkipIndicator,
    onSingleTap: () => {
      // Single tap behavior:
      // - If controls are hidden, show them (don't toggle play/pause)
      // - If controls are visible, toggle play/pause
      if (!showControls) {
        // Just show controls, don't toggle play state
        setShowControls(true);
        // Set timeout to hide controls if playing
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      } else {
        // Controls are visible, now toggle play/pause
        togglePlay();
        // Reset hide timer
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }
    },
  });

  // Auto-hide controls only when playing
  useEffect(() => {
    // If paused, always show controls
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      return;
    }

    // If playing, auto-hide after 3 seconds
    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
          setShowVolumeMenu(false);
          setShowMoreMenu(false);
        }
      }, 3000);
    };

    hideControls();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Auto-close more menu after 2 seconds
  useEffect(() => {
    if (showMoreMenu) {
      // Pause video when menu opens
      if (videoRef.current && isPlaying) {
        setWasPlayingBeforeMenu(true);
        videoRef.current.pause();
      }

      // Clear existing timeout
      if (menuIdleTimeoutRef.current) {
        clearTimeout(menuIdleTimeoutRef.current);
      }

      // Set timeout to auto-close after 2 seconds
      menuIdleTimeoutRef.current = setTimeout(() => {
        setShowMoreMenu(false);

        // Resume video if it was playing
        if (wasPlayingBeforeMenu && videoRef.current) {
          videoRef.current.play().catch(err => console.warn('Resume play error:', err));
          setWasPlayingBeforeMenu(false);
        }
      }, 2000);
    }

    return () => {
      if (menuIdleTimeoutRef.current) {
        clearTimeout(menuIdleTimeoutRef.current);
      }
    };
  }, [showMoreMenu, isPlaying, wasPlayingBeforeMenu]);

  // Pause video when submenus open (no auto-close)
  useEffect(() => {
    if (showVolumeMenu || showSpeedMenu) {
      // Pause video when submenu opens
      if (videoRef.current && isPlaying) {
        setWasPlayingBeforeMenu(true);
        videoRef.current.pause();
      }
    }
  }, [showVolumeMenu, showSpeedMenu, isPlaying]);

  // Close all menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;

      // Check if click is outside menu areas
      const isMenuClick = target.closest('.menu-container') ||
        target.closest('[aria-label="更多"]');

      if (!isMenuClick && (showMoreMenu || showVolumeMenu || showSpeedMenu)) {
        setShowMoreMenu(false);
        setShowVolumeMenu(false);
        setShowSpeedMenu(false);

        // Resume video if it was playing
        if (wasPlayingBeforeMenu && videoRef.current) {
          videoRef.current.play().catch(err => console.warn('Resume play error:', err));
          setWasPlayingBeforeMenu(false);
        }
      }
    };

    if (showMoreMenu || showVolumeMenu || showSpeedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMoreMenu, showVolumeMenu, showSpeedMenu, wasPlayingBeforeMenu]);

  const togglePlay = async () => {
    if (!videoRef.current || isTogglingRef.current) return;

    isTogglingRef.current = true;

    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Close all menus when resuming playback
        setShowMoreMenu(false);
        setShowVolumeMenu(false);
        setShowSpeedMenu(false);

        await videoRef.current.play();
      }
    } catch (error) {
      console.warn('Play/pause error:', error);
    } finally {
      // Immediately release the toggle lock
      isTogglingRef.current = false;
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleTimeUpdateEvent = () => {
    if (!videoRef.current || isDraggingProgressRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setCurrentTime(current);
    setDuration(total);
    if (onTimeUpdate) {
      onTimeUpdate(current, total);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
    if (initialTime > 0) {
      videoRef.current.currentTime = initialTime;
    }

    // Auto-play the video when loaded
    videoRef.current.play().catch(err => {
      console.warn('Autoplay was prevented:', err);
      // Show a toast or indication that user needs to tap to play
    });
  };

  const handleVideoError = () => {
    setIsLoading(false);
    if (onError) {
      onError('Video failed to load');
    }
  };

  // Progress bar seeking with real-time drag
  const updateProgressFromEvent = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | TouchEvent | MouseEvent) => {
    if (!videoRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    let clientX: number;

    // Handle both mouse and touch events
    if ('touches' in e) {
      const touch = e.touches[0] || (e as React.TouchEvent<HTMLDivElement>).changedTouches?.[0];
      if (!touch) return;
      clientX = touch.clientX;
    } else {
      clientX = (e as MouseEvent | React.MouseEvent<HTMLDivElement>).clientX;
    }

    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pos * duration;

    return newTime;
  };

  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDraggingProgressRef.current = true;
    const newTime = updateProgressFromEvent(e);
    if (newTime !== undefined) {
      setCurrentTime(newTime);
    }
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingProgressRef.current) return;
    e.preventDefault(); // Prevent scrolling while dragging
    const newTime = updateProgressFromEvent(e);
    if (newTime !== undefined) {
      setCurrentTime(newTime);
      // Update video in real-time
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    }
  };

  const handleProgressTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingProgressRef.current) return;
    isDraggingProgressRef.current = false;
    const newTime = updateProgressFromEvent(e);
    if (newTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const newTime = updateProgressFromEvent(e);
    if (newTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      // Use container fullscreen to maintain custom controls
      // Try standard fullscreen API first
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
      }
      // Fallback to webkit prefixed version for older iOS
      else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
      // Fallback to webkit prefixed version with different capitalization
      else if ((containerRef.current as any).webkitRequestFullScreen) {
        (containerRef.current as any).webkitRequestFullScreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
      // Fallback to webkit prefixed version
      else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      // Fallback to webkit prefixed version with different capitalization
      else if ((document as any).webkitCancelFullScreen) {
        (document as any).webkitCancelFullScreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check for standard fullscreen element or webkit variants
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).webkitCurrentFullScreenElement
      );
      setIsFullscreen(isInFullscreen);
    };

    // Listen for all fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const togglePictureInPicture = async () => {
    if (!videoRef.current || !isPiPSupported) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to toggle Picture-in-Picture:', error);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      setTimeout(() => setToastMessage(null), 300);
    }, 3000);
  };

  // Copy video link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(src);
      showToastNotification('链接已复制到剪贴板');
    } catch (error) {
      console.error('Copy failed:', error);
      showToastNotification('复制失败，请重试');
    }
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Responsive sizing based on viewport width
  // Use single breakpoint: < 640px = compact layout, >= 640px = full layout
  const isCompactLayout = viewportWidth < 640;

  // Dynamic sizing
  const iconSize = isCompactLayout ? 20 : 22;
  const buttonPadding = isCompactLayout ? 'p-2' : 'p-2.5';
  const controlsGap = isCompactLayout ? 'gap-2' : 'gap-3';
  const textSize = isCompactLayout ? 'text-xs' : 'text-sm';
  const controlsPadding = isCompactLayout ? 'px-3 pb-3' : 'px-4 pb-4';

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-[var(--radius-2xl)] overflow-hidden"
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
        onTouchEnd={handleTap}
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="spinner"></div>
        </div>
      )}

      {/* Skip Indicators */}
      {showSkipIndicator && skipSide && (
        <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${skipSide === 'left' ? 'left-8' : 'right-8'
          }`}>
          <div className="text-white text-3xl font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-scale-in">
            {skipSide === 'left' ? '-' : '+'}{skipAmount}
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div
            ref={progressBarRef}
            className="h-1 bg-white/30 rounded-full cursor-pointer"
            onClick={handleProgressClick}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
          >
            <div
              className="h-full bg-[var(--accent-color)] rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
            </div>
          </div>
        </div>


        {/* Controls Bar */}
        <div className={`bg-gradient-to-t from-black/90 via-black/70 to-transparent ${controlsPadding} pt-2`}>
          {isCompactLayout ? (
            // Compact Layout for narrow screens (< 640px)
            <div className={`flex items-center justify-between ${controlsGap}`}>
              {/* Left: Play + Time */}
              <div className={`flex items-center ${controlsGap} min-w-0`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                  }}
                  className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation relative z-[60]`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isPlaying ? <Icons.Pause size={iconSize} /> : <Icons.Play size={iconSize} />}
                </button>

                {/* Time Display */}
                <span className={`text-white ${textSize} font-medium tabular-nums whitespace-nowrap`}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right: More + Fullscreen */}
              <div className={`flex items-center ${controlsGap} flex-shrink-0`}>
                {/* More Menu Button */}
                <div className="relative z-[60]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(!showMoreMenu);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowMoreMenu(!showMoreMenu);
                    }}
                    className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation`}
                    aria-label="更多"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>

                  {/* More Menu Dropdown */}
                  {showMoreMenu && (
                    <div className="absolute bottom-full right-0 mb-2 min-w-[160px] z-[100] menu-container">
                      <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[25px] rounded-[var(--radius-2xl)] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                        {/* Copy Link Option */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMoreMenu(false);
                            handleCopyLink();
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowMoreMenu(false);
                            handleCopyLink();
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/20 flex items-center gap-3 transition-all touch-manipulation"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <Icons.Link size={18} />
                          <span>复制链接</span>
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        {/* Volume Option */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMoreMenu(false);
                            setShowVolumeMenu(true);
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowMoreMenu(false);
                            setShowVolumeMenu(true);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/20 flex items-center gap-3 transition-all touch-manipulation"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          {isMuted || volume === 0 ? <Icons.VolumeX size={18} /> : <Icons.Volume2 size={18} />}
                          <span>音量</span>
                        </button>

                        {/* Speed Option */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMoreMenu(false);
                            setShowSpeedMenu(true);
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowMoreMenu(false);
                            setShowSpeedMenu(true);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/20 flex items-center gap-3 transition-all touch-manipulation"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>速度 {playbackRate}x</span>
                        </button>

                        {/* PiP Option */}
                        {isPiPSupported && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMoreMenu(false);
                              togglePictureInPicture();
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setShowMoreMenu(false);
                              togglePictureInPicture();
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/20 flex items-center gap-3 transition-all touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            <Icons.PictureInPicture size={18} />
                            <span>画中画</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleFullscreen();
                  }}
                  className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation relative z-[60]`}
                  aria-label={isFullscreen ? '退出全屏' : '全屏'}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isFullscreen ? <Icons.Minimize size={iconSize} /> : <Icons.Maximize size={iconSize} />}
                </button>
              </div>
            </div>
          ) : (
            // Full Layout for wide screens (>= 640px)
            <div className={`flex items-center ${controlsGap}`}>
              {/* Left Controls */}
              <div className={`flex items-center ${controlsGap}`}>
                {/* Play/Pause Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation relative z-[60]`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isPlaying ? <Icons.Pause size={iconSize} /> : <Icons.Play size={iconSize} />}
                </button>

                {/* Skip Backward Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    skipVideo(10, 'left');
                  }}
                  className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation`}
                  aria-label="后退 10 秒"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icons.SkipBack size={iconSize} />
                </button>

                {/* Skip Forward Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    skipVideo(10, 'right');
                  }}
                  className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation`}
                  aria-label="前进 10 秒"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icons.SkipForward size={iconSize} />
                </button>

                {/* Volume Button with Slider */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVolumeMenu(!showVolumeMenu);
                    }}
                    className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation`}
                    aria-label="音量"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {isMuted || volume === 0 ? <Icons.VolumeX size={iconSize} /> : <Icons.Volume2 size={iconSize} />}
                  </button>

                  {/* Volume Slider Dropdown */}
                  {showVolumeMenu && (
                    <div className="absolute bottom-full left-0 mb-2 z-[100] menu-container">
                      <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[25px] rounded-[var(--radius-2xl)] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-3 flex flex-col items-center gap-2 min-w-[48px]">
                        {/* Mute Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                          className="btn-icon p-1.5"
                        >
                          {isMuted || volume === 0 ? <Icons.VolumeX size={18} /> : <Icons.Volume2 size={18} />}
                        </button>

                        {/* Vertical Volume Slider */}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newVolume = parseFloat(e.target.value);
                            setVolume(newVolume);
                            if (videoRef.current) {
                              videoRef.current.volume = newVolume;
                            }
                            setIsMuted(newVolume === 0);
                          }}
                          className="h-24 w-1 bg-white/30 rounded-full appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                          style={{ WebkitAppearance: 'slider-vertical' }}
                        />

                        {/* Volume Percentage */}
                        <span className="text-white text-xs font-medium tabular-nums">
                          {Math.round((isMuted ? 0 : volume) * 100)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Display */}
                <span className={`text-white ${textSize} font-medium tabular-nums whitespace-nowrap`}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Flexible Space */}
              <div className="flex-1" />

              {/* Right Controls */}
              <div className={`flex items-center ${controlsGap} flex-shrink-0`}>
                {/* Speed Button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeedMenu(!showSpeedMenu);
                    }}
                    className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation`}
                    aria-label="播放速度"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className={`text-white ${textSize} font-medium`}>{playbackRate}x</span>
                  </button>

                  {/* Speed Menu Dropdown */}
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 z-[100] menu-container">
                      <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[25px] rounded-[var(--radius-2xl)] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-2 flex gap-2">
                        {speeds.map((speed) => (
                          <button
                            key={speed}
                            onClick={(e) => {
                              e.stopPropagation();
                              changePlaybackSpeed(speed);
                            }}
                            className={`px-3 py-1.5 rounded-[var(--radius-full)] text-xs font-medium transition-colors whitespace-nowrap ${playbackRate === speed
                              ? 'bg-[var(--accent-color)] text-white'
                              : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Picture-in-Picture Button */}
                {isPiPSupported && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePictureInPicture();
                    }}
                    className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation`}
                    aria-label="画中画"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Icons.PictureInPicture size={iconSize} />
                  </button>
                )}

                {/* More Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(!showMoreMenu);
                  }}
                  className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation`}
                  aria-label="更多"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className={`btn-icon ${buttonPadding} flex-shrink-0 touch-manipulation relative z-[60]`}
                  aria-label={isFullscreen ? '退出全屏' : '全屏'}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isFullscreen ? <Icons.Minimize size={iconSize} /> : <Icons.Maximize size={iconSize} />}
                </button>
              </div>
            </div>
          )}


          {/* Volume Menu (shown after clicking from More menu in compact layout) */}
          {showVolumeMenu && isCompactLayout && (
            <div className="mt-3 pt-3 border-t border-white/20 menu-container">
              <div className="flex items-center gap-3">
                <button onClick={toggleMute} className="btn-icon p-2">
                  {isMuted || volume === 0 ? <Icons.VolumeX size={18} /> : <Icons.Volume2 size={18} />}
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume * 100}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value) / 100;
                      setVolume(newVolume);
                      if (videoRef.current) {
                        videoRef.current.volume = newVolume;
                      }
                      setIsMuted(newVolume === 0);
                    }}
                    className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
                <span className="text-white text-xs font-medium tabular-nums min-w-[2rem]">
                  {Math.round((isMuted ? 0 : volume) * 100)}
                </span>
                <button
                  onClick={() => {
                    setShowVolumeMenu(false);
                    if (wasPlayingBeforeMenu && videoRef.current) {
                      videoRef.current.play().catch(err => console.warn('Resume play error:', err));
                      setWasPlayingBeforeMenu(false);
                    }
                  }}
                  className="text-white/60 hover:text-white text-xs"
                >
                  关闭
                </button>
              </div>
            </div>
          )}

          {/* Speed Menu (shown after clicking from More menu in compact layout) */}
          {showSpeedMenu && isCompactLayout && (
            <div className="mt-3 pt-3 border-t border-white/20 menu-container">
              <div className="flex gap-2 flex-wrap">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={(e) => {
                      e.stopPropagation();
                      changePlaybackSpeed(speed);
                    }}
                    className={`px-3 py-1.5 rounded-[var(--radius-full)] text-xs font-medium transition-colors ${playbackRate === speed
                      ? 'bg-[var(--accent-color)] text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowSpeedMenu(false);
                  if (wasPlayingBeforeMenu && videoRef.current) {
                    videoRef.current.play().catch(err => console.warn('Resume play error:', err));
                    setWasPlayingBeforeMenu(false);
                  }
                }}
                className="text-white/60 hover:text-white text-xs mt-2"
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </div >

      {/* Toast Notification */}
      {
        showToast && toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] animate-slide-up" style={{ transform: 'translate(-50%, 0) translateZ(0)' }}>
            <div className="bg-[rgba(28,28,30,0.95)] backdrop-blur-[25px] rounded-[var(--radius-2xl)] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-6 py-3 flex items-center gap-3 min-w-[200px] max-w-[90vw]">
              <Icons.Check size={18} className="text-[#34c759] flex-shrink-0" />
              <span className="text-white text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        )
      }
    </div >
  );
}
