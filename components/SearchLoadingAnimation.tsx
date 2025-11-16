'use client';

import { useEffect, useState, useRef } from 'react';

interface SearchLoadingAnimationProps {
  currentSource?: string;
  checkedSources?: number;
  totalSources?: number;
  checkedVideos?: number;
  totalVideos?: number;
  validatedVideos?: number;
  totalToValidate?: number;
  stage?: 'searching' | 'checking' | 'validating';
}

export function SearchLoadingAnimation({ 
  currentSource, 
  checkedSources = 0, 
  totalSources = 16,
  checkedVideos = 0,
  totalVideos = 0,
  validatedVideos = 0,
  totalToValidate = 0,
  stage = 'searching'
}: SearchLoadingAnimationProps) {
  const [dots, setDots] = useState('');
  const [displayProgress, setDisplayProgress] = useState(0);
  const maxProgressRef = useRef(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  // Calculate unified progress (0-100%) with accurate percentages
  let progress = 0;
  let statusText = '';
  let stageDescription = '';
  
  if (stage === 'searching') {
    // Stage 1: Search sources (0-33%)
    progress = totalSources > 0 ? (checkedSources / totalSources) * 33 : 0;
    statusText = `已搜索 ${checkedSources}/${totalSources} 个源`;
    stageDescription = '正在多源并行搜索';
  } else if (stage === 'checking') {
    // Stage 2: Check videos (33-66%)
    progress = 33 + (totalVideos > 0 ? (checkedVideos / totalVideos) * 33 : 0);
    statusText = `已检测 ${checkedVideos}/${totalVideos} 个视频`;
    stageDescription = '正在验证视频可用性';
  } else if (stage === 'validating') {
    // Stage 3: Validate in browser (66-100%)
    progress = 66 + (totalToValidate > 0 ? (validatedVideos / totalToValidate) * 34 : 0);
    statusText = `已验证 ${validatedVideos}/${totalToValidate} 个视频`;
    stageDescription = '正在浏览器测试播放';
  }

  // Ensure progress is between 0 and 100
  progress = Math.max(0, Math.min(100, progress));

  // Prevent progress from going backward - always move forward or stay same
  useEffect(() => {
    if (progress >= maxProgressRef.current) {
      maxProgressRef.current = progress;
      setDisplayProgress(progress);
    }
    // If new progress is lower (shouldn't happen but just in case), keep the max
  }, [progress]);

  return (
    <div className="w-full space-y-3 animate-fade-in">
      {/* Loading Message with Icon */}
      <div className="flex items-center justify-center gap-3">
        {/* Spinning Icon */}
        <svg className="w-5 h-5 animate-spin-slow" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth="3"
            strokeDasharray="60 40"
            strokeLinecap="round"
          />
        </svg>
        
        <span className="text-sm font-medium text-[var(--text-color-secondary)]">
          {stageDescription}{dots}
        </span>
      </div>

      {/* Progress Bar - Unified 0-100% */}
      <div className="w-full">
        <div 
          className="h-2 bg-[color-mix(in_srgb,var(--glass-bg)_50%,transparent)] overflow-hidden"
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-color)] to-[color-mix(in_srgb,var(--accent-color)_120%,white)] transition-all duration-300 ease-out relative"
            style={{ 
              width: `${displayProgress}%`,
              borderRadius: 'var(--radius-full)'
            }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
        
        {/* Progress Info - Real-time count */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-[var(--text-color-secondary)]">{statusText}</span>
          <span className="font-semibold text-[var(--accent-color)]">{Math.round(displayProgress)}%</span>
        </div>
      </div>
    </div>
  );
}
