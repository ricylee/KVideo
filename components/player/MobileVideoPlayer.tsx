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
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingProgressRef = useRef(false);
  const menuIdleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submenuIdleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTogglingRef = useRef(false);

  // Screen orientation management
  useScreenOrientation(isFullscreen);

  // Check for PiP support
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsPiPSupported('pictureInPictureEnabled' in document);
    }
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
      // Single tap toggles play/pause immediately
      togglePlay();
      // Show controls
      setShowControls(true);
      // If playing, set timeout to hide controls
      // If paused, keep controls visible
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
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
      // Small delay to prevent rapid toggling
      setTimeout(() => {
        isTogglingRef.current = false;
      }, 100);
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
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  
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
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="spinner"></div>
        </div>
      )}

      {/* Skip Indicators */}
      {showSkipIndicator && skipSide && (
        <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${
          skipSide === 'left' ? 'left-8' : 'right-8'
        }`}>
          <div className="text-white text-3xl font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-scale-in">
            {skipSide === 'left' ? '-' : '+'}{skipAmount}
          </div>
        </div>
      )}

      {/* Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
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
        <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 sm:px-4 pb-3 sm:pb-4 pt-2">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {/* Left: Play + Time */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <button onClick={togglePlay} className="btn-icon p-2 sm:p-2.5 flex-shrink-0" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Icons.Pause size={20} className="sm:w-[22px] sm:h-[22px]" /> : <Icons.Play size={20} className="sm:w-[22px] sm:h-[22px]" />}
              </button>
              
              {/* Time Display */}
              <span className="text-white text-[10px] sm:text-xs font-medium tabular-nums whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right: More + Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* More Menu Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)} 
                  className="btn-icon p-1.5 sm:p-2 flex-shrink-0" 
                  aria-label="更多"
                >
                  <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>

                {/* More Menu Dropdown */}
                {showMoreMenu && (
                  <div className="absolute bottom-full right-0 mb-2 min-w-[160px] z-[100] menu-container">
                    <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[25px] rounded-[var(--radius-2xl)] border border-[rgba(255,255,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                    {/* Volume Option */}
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowVolumeMenu(true);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/20 flex items-center gap-3 transition-all"
                    >
                      {isMuted || volume === 0 ? <Icons.VolumeX size={18} /> : <Icons.Volume2 size={18} />}
                      <span>音量</span>
                    </button>

                    {/* Speed Option */}
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowSpeedMenu(true);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/20 flex items-center gap-3 transition-all"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>速度 {playbackRate}x</span>
                    </button>

                    {/* PiP Option */}
                    {isPiPSupported && (
                      <button 
                        onClick={() => {
                          setShowMoreMenu(false);
                          togglePictureInPicture();
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/20 flex items-center gap-3 transition-all"
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
              <button onClick={toggleFullscreen} className="btn-icon p-1.5 sm:p-2 flex-shrink-0" aria-label={isFullscreen ? '退出全屏' : '全屏'}>
                {isFullscreen ? <Icons.Minimize size={18} className="sm:w-5 sm:h-5" /> : <Icons.Maximize size={18} className="sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* Volume Menu (shown after clicking from More menu) */}
          {showVolumeMenu && (
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

          {/* Speed Menu (shown after clicking from More menu) */}
          {showSpeedMenu && (
            <div className="mt-3 pt-3 border-t border-white/20 menu-container">
              <div className="flex gap-2 flex-wrap">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      changePlaybackSpeed(speed);
                      setShowSpeedMenu(false);
                      
                      // Resume video after changing speed
                      if (wasPlayingBeforeMenu && videoRef.current) {
                        videoRef.current.play().catch(err => console.warn('Resume play error:', err));
                        setWasPlayingBeforeMenu(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-[var(--radius-full)] text-xs font-medium transition-colors ${
                      playbackRate === speed
                        ? 'bg-[var(--accent-color)] text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
                <button 
                  onClick={() => {
                    setShowSpeedMenu(false);
                    if (wasPlayingBeforeMenu && videoRef.current) {
                      videoRef.current.play().catch(err => console.warn('Resume play error:', err));
                      setWasPlayingBeforeMenu(false);
                    }
                  }} 
                  className="ml-auto text-white/60 hover:text-white text-xs px-2"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
