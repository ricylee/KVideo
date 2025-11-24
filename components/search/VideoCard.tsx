'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import { LatencyBadge } from '@/components/ui/LatencyBadge';
import { getOptimizedImageUrl } from '@/lib/utils/image-utils';

import { Video } from '@/lib/types';

interface VideoCardProps {
    video: Video;
    videoUrl: string;
    cardId: string;
    isActive: boolean;
    onCardClick: (e: React.MouseEvent, cardId: string, videoUrl: string) => void;
    priority?: boolean;
}

export const VideoCard = memo<VideoCardProps>(({
    video,
    videoUrl,
    cardId,
    isActive,
    onCardClick,
    priority = false
}) => {
    return (
        <div
            style={{
                contain: 'layout style paint',
                contentVisibility: 'auto',
            }}
        >
            <Link
                key={cardId}
                href={videoUrl}
                onClick={(e) => onCardClick(e, cardId, videoUrl)}
                role="listitem"
                aria-label={`${video.vod_name}${video.vod_remarks ? ` - ${video.vod_remarks}` : ''}`}
                prefetch={false}
            >
                <Card
                    className="p-0 overflow-hidden group cursor-pointer flex flex-col h-full bg-[var(--bg-color)]/50 backdrop-blur-none saturate-100 shadow-sm border-[var(--glass-border)] hover:shadow-lg transition-shadow"
                    hover={false}
                    blur={false}
                    style={{
                        willChange: 'transform',
                        transform: 'translate3d(0,0,0)',
                        backfaceVisibility: 'hidden',
                    }}
                >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] bg-[color-mix(in_srgb,var(--glass-bg)_50%,transparent)] overflow-hidden rounded-[var(--radius-2xl)]">
                        {video.vod_pic ? (
                            <Image
                                src={getOptimizedImageUrl(video.vod_pic, 400)}
                                alt={video.vod_name}
                                fill
                                className="object-cover rounded-[var(--radius-2xl)]"
                                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                                loading={priority ? "eager" : "lazy"}
                                priority={priority}
                                unoptimized
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.opacity = '0';
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Icons.Film size={64} className="text-[var(--text-color-secondary)]" />
                            </div>
                        )}

                        {/* Fallback Icon */}
                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                            <Icons.Film size={64} className="text-[var(--text-color-secondary)] opacity-20" />
                        </div>

                        {/* Badge Container */}
                        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between gap-1">
                            {video.sourceName && (
                                <Badge variant="primary" className="bg-[var(--accent-color)] flex-shrink-0 max-w-[50%] truncate">
                                    {video.sourceName}
                                </Badge>
                            )}

                            {video.latency !== undefined && (
                                <LatencyBadge latency={video.latency} className="flex-shrink-0" />
                            )}
                        </div>

                        {/* Overlay */}
                        <div
                            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isActive ? 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                                }`}
                            style={{
                                willChange: 'opacity',
                            }}
                        >
                            <div className="absolute bottom-0 left-0 right-0 p-3">
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

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col">
                        <h4 className="font-semibold text-sm text-[var(--text-color)] line-clamp-2 min-h-[2.5rem]">
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
        </div>
    );
});

VideoCard.displayName = 'VideoCard';
