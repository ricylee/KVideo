'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SearchForm } from '@/components/search/SearchForm';
import { VideoGrid } from '@/components/search/VideoGrid';
import { EmptyState } from '@/components/search/EmptyState';
import { NoResults } from '@/components/search/NoResults';
import { ResultsHeader } from '@/components/search/ResultsHeader';
import { TypeBadges } from '@/components/search/TypeBadges';
import { useSearchCache } from '@/lib/hooks/useSearchCache';
import { useParallelSearch } from '@/lib/hooks/useParallelSearch';
import { useTypeBadges } from '@/lib/hooks/useTypeBadges';

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadFromCache, saveToCache } = useSearchCache();
  const hasLoadedCache = useRef(false);
  
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Search stream hook
  const {
    loading,
    results,
    availableSources,
    completedSources,
    totalSources,
    totalVideosFound,
    performSearch,
    resetSearch,
    loadCachedResults,
  } = useParallelSearch(
    saveToCache,
    (q: string) => router.replace(`/?q=${encodeURIComponent(q)}`, { scroll: false })
  );

  // Type badges hook - auto-collects and filters by type_name
  const {
    typeBadges,
    selectedTypes,
    filteredVideos,
    toggleType,
  } = useTypeBadges(results);

  // Load cached results on mount
  useEffect(() => {
    if (hasLoadedCache.current) return;
    hasLoadedCache.current = true;

    const urlQuery = searchParams.get('q');
    const cached = loadFromCache();
    
    if (urlQuery) {
      setQuery(urlQuery);
      if (cached && cached.query === urlQuery && cached.results.length > 0) {
        console.log('📦 Loading cached results for:', urlQuery, cached.results.length, 'videos');
        setHasSearched(true);
        loadCachedResults(cached.results, cached.availableSources);
      } else {
        console.log('🔍 Auto-searching for URL query:', urlQuery);
        setTimeout(() => handleSearch(urlQuery), 100);
      }
    }
  }, [searchParams, loadFromCache, loadCachedResults]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setHasSearched(true);
    performSearch(searchQuery);
  };

  const handleReset = () => {
    setHasSearched(false);
    setQuery('');
    resetSearch();
    router.replace('/', { scroll: false });
  };

  return (
    <div className="min-h-screen">
      {/* Glass Navbar */}
      <nav className="sticky top-4 z-50 mx-4 mt-4 mb-8">
        <div className="max-w-7xl mx-auto bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] [-webkit-backdrop-filter:blur(25px)_saturate(180%)] border border-[var(--glass-border)] shadow-[var(--shadow-md)] px-6 py-4 transition-all duration-[var(--transition-fluid)]" style={{ borderRadius: 'var(--radius-2xl)' }}>
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              onClick={handleReset}
            >
              <div className="w-10 h-10 relative flex items-center justify-center">
                <Image 
                  src="/icon.png" 
                  alt="KVideo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-color)]">KVideo</h1>
                <p className="text-xs text-[var(--text-color-secondary)]">视频聚合平台</p>
              </div>
            </Link>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Hero Section with Search */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-5xl md:text-6xl font-bold text-[var(--text-color)] mb-4">
            发现精彩视频
          </h2>
          <p className="text-xl text-[var(--text-color-secondary)] mb-8">
            多源聚合 · 智能搜索 · 极致体验
          </p>

          <SearchForm
            onSearch={handleSearch}
            isLoading={loading}
            initialQuery={query}
            currentSource=""
            checkedSources={completedSources}
            totalSources={totalSources}
            checkedVideos={0}
            totalVideos={totalVideosFound}
            searchStage="searching"
          />
        </div>

        {/* Results Section */}
        {(results.length >= 1 || (!loading && results.length > 0)) && (
          <div className="animate-fade-in">
            <ResultsHeader
              loading={loading}
              resultsCount={results.length}
              checkedVideos={0}
              totalVideos={totalVideosFound}
              availableSources={availableSources}
            />
            
            {/* Type Badges - Auto-collected from search results */}
            {typeBadges.length > 0 && (
              <TypeBadges
                badges={typeBadges}
                selectedTypes={selectedTypes}
                onToggleType={toggleType}
                className="mb-6"
              />
            )}
            
            {/* Display filtered or all videos */}
            <VideoGrid videos={filteredVideos} />
          </div>
        )}

        {/* Empty State - Initial Homepage */}
        {!loading && !hasSearched && <EmptyState />}

        {/* No Results */}
        {!loading && hasSearched && results.length === 0 && (
          <NoResults onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent-color)] border-t-transparent"></div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}
