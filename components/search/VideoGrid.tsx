'use client';

import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { VideoCard } from './VideoCard';

import { Video } from '@/lib/types';

interface VideoGridProps {
  videos: Video[];
  className?: string;
}

export const VideoGrid = memo(function VideoGrid({ videos, className = '' }: VideoGridProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  if (videos.length === 0) {
    return null;
  }

  // Callback ref for the load more trigger to handle dynamic mounting/unmounting
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();

    if (node) {
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 24);
        }
      }, { rootMargin: '400px' });

      observerRef.current.observe(node);
    }
  }, []);

  // Memoize the click handler to prevent re-renders
  const handleCardClick = useCallback((e: React.MouseEvent, videoId: string, videoUrl: string) => {
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
  }, [activeCardId]);

  // Memoize video items to prevent unnecessary re-computations
  const videoItems = useMemo(() => {
    return videos.map((video, index) => {
      const videoUrl = `/player?${new URLSearchParams({
        id: String(video.vod_id),
        source: video.source,
        title: video.vod_name,
      }).toString()}`;

      const cardId = `${video.vod_id}-${index}`;

      return {
        video,
        videoUrl,
        cardId,
      };
    });
  }, [videos]);

  const visibleItems = videoItems.slice(0, visibleCount);

  return (
    <>
      <div
        ref={gridRef}
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6 max-w-[1920px] mx-auto ${className}`}
        role="list"
        aria-label="视频搜索结果"
        style={{
          // Optimize rendering performance
          // willChange: 'auto', // Removed to let browser decide
          contain: 'layout style paint',
          contentVisibility: 'auto',
        }}
      >
        {visibleItems.map(({ video, videoUrl, cardId }, index) => {
          const isActive = activeCardId === cardId;

          return (
            <VideoCard
              key={cardId}
              video={video}
              videoUrl={videoUrl}
              cardId={cardId}
              isActive={isActive}
              onCardClick={handleCardClick}
              priority={index < 10}
            />
          );
        })}
      </div>

      {/* Load more trigger */}
      {visibleCount < videoItems.length && (
        <div
          ref={loadMoreRef}
          className="h-20 w-full flex items-center justify-center opacity-0 pointer-events-none"
          aria-hidden="true"
        />
      )}
    </>
  );
});
