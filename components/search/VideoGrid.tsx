'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation';

interface Video {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  vod_year?: string;
  type_name?: string;
  source: string;
  sourceName?: string;
  isNew?: boolean;
}

interface VideoGridProps {
  videos: Video[];
  className?: string;
}

export function VideoGrid({ videos, className = '' }: VideoGridProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  
  // Calculate columns for grid navigation
  const getColumns = () => {
    if (typeof window === 'undefined') return 6;
    const width = window.innerWidth;
    if (width >= 1536) return 6; // 2xl
    if (width >= 1280) return 6; // xl
    if (width >= 1024) return 5; // lg
    if (width >= 768) return 4; // md
    if (width >= 640) return 3; // sm
    return 2; // default
  };

  // Keyboard navigation
  useKeyboardNavigation({
    enabled: true,
    containerRef: gridRef,
    currentIndex: focusedIndex,
    itemCount: videos.length,
    orientation: 'grid',
    columns: getColumns(),
    onNavigate: useCallback((index: number) => {
      setFocusedIndex(index);
      videoRefs.current[index]?.focus();
    }, []),
    onSelect: useCallback((index: number) => {
      videoRefs.current[index]?.click();
    }, []),
  });
  
  if (videos.length === 0) {
    return null;
  }

  const handleCardClick = (e: React.MouseEvent, videoId: string, videoUrl: string) => {
    // Check if it's a mobile device
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    
    if (isMobile) {
      // On mobile, first click shows details, second click navigates
      if (activeCardId === videoId) {
        // Already active, allow navigation
        window.location.href = videoUrl;
      } else {
        // First click, show details
        e.preventDefault();
        setActiveCardId(videoId);
      }
    }
    // On desktop, let the Link work normally
  };

  return (
    <div 
      ref={gridRef}
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6 max-w-[1920px] mx-auto ${className}`}
      role="list"
      aria-label="视频搜索结果"
    >
      {videos.map((video, index) => {
        const videoUrl = `/player?${new URLSearchParams({
          id: video.vod_id,
          source: video.source,
          title: video.vod_name,
        }).toString()}`;
        
        const cardId = `${video.vod_id}-${index}`;
        const isActive = activeCardId === cardId;
        const isFocused = focusedIndex === index;
        
        return (
          <Link 
            key={cardId}
            href={videoUrl}
            ref={(el) => { videoRefs.current[index] = el; }}
            onClick={(e) => handleCardClick(e, cardId, videoUrl)}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(e as any, cardId, videoUrl);
              }
            }}
            role="listitem"
            tabIndex={0}
            aria-label={`${video.vod_name}${video.vod_remarks ? ` - ${video.vod_remarks}` : ''}`}
          >
            <Card
              className={`p-0 overflow-hidden group cursor-pointer flex flex-col h-full ${video.isNew ? 'animate-scale-in' : ''} ${
                isFocused ? 'ring-2 ring-[var(--accent-color)] ring-offset-2' : ''
              }`}
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] bg-[color-mix(in_srgb,var(--glass-bg)_50%,transparent)] overflow-hidden" style={{ borderRadius: 'var(--radius-2xl)' }}>
                {video.vod_pic ? (
                  <img
                    src={video.vod_pic}
                    alt={video.vod_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 will-change-transform"
                    style={{ borderRadius: 'var(--radius-2xl)' }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-poster.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icons.Film size={64} className="text-[var(--text-color-secondary)]" />
                  </div>
                )}
                
                {/* Source Badge - Top Left */}
                {video.sourceName && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="primary" className="text-xs backdrop-blur-md bg-[var(--accent-color)]/90">
                      {video.sourceName}
                    </Badge>
                  </div>
                )}
                
                {/* Overlay - Show on hover (desktop) or when active (mobile) */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                }`}>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {/* Mobile indicator when active */}
                    {isActive && (
                      <div className="lg:hidden text-white/90 text-xs mb-2 font-medium">
                        再次点击播放 →
                      </div>
                    )}
                    {video.type_name && (
                      <Badge variant="secondary" className="text-xs mb-2">
                        {video.type_name}
                      </Badge>
                    )}
                    {video.vod_year && (
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <Icons.Calendar size={12} />
                        <span>{video.vod_year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info - Fixed height section */}
              <div className="p-3 flex-1 flex flex-col">
                <h4 className="font-semibold text-sm text-[var(--text-color)] line-clamp-2 min-h-[2.5rem] group-hover:text-[var(--accent-color)] transition-colors">
                  {video.vod_name}
                </h4>
                {video.vod_remarks && (
                  <p className="text-xs text-[var(--text-color-secondary)] mt-1 line-clamp-1">
                    {video.vod_remarks}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
