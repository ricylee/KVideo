/**
 * MovieCard - Individual movie card component
 * Displays movie poster, title, and rating
 */

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icon';
import { getOptimizedImageUrl } from '@/lib/utils/image-utils';

interface DoubanMovie {
  id: string;
  title: string;
  cover: string;
  rate: string;
  url: string;
}

interface MovieCardProps {
  movie: DoubanMovie;
  onMovieClick: (movie: DoubanMovie) => void;
  priority?: boolean;
}

export const MovieCard = memo(function MovieCard({ movie, onMovieClick, priority = false }: MovieCardProps) {
  return (
    <Link
      href={`/?q=${encodeURIComponent(movie.title)}`}
      onClick={(e) => {
        e.preventDefault();
        onMovieClick(movie);
      }}
      className="group cursor-pointer"
      style={{
        contain: 'layout style paint',
        contentVisibility: 'auto'
      }}
    >
      <Card hover className="overflow-hidden p-0 h-full" blur={false}>
        <div className="relative aspect-[2/3] overflow-hidden bg-[var(--glass-bg)] rounded-[var(--radius-2xl)]">
          <Image
            src={getOptimizedImageUrl(movie.cover, 400)}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-[var(--radius-2xl)]"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            unoptimized
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('img');
                fallback.src = '/placeholder-poster.svg';
                fallback.alt = movie.title;
                fallback.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-2xl);';
                parent.appendChild(fallback);
              }
            }}
          />
          {movie.rate && parseFloat(movie.rate) > 0 && (
            <div
              className="absolute top-2 right-2 bg-black/80 px-2.5 py-1.5 flex items-center gap-1.5 rounded-[var(--radius-full)]"
            >
              <Icons.Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-white">
                {movie.rate}
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm text-[var(--text-color)] line-clamp-2 group-hover:text-[var(--accent-color)] transition-colors">
            {movie.title}
          </h3>
        </div>
      </Card>
    </Link>
  );
});
