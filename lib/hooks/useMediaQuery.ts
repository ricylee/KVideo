/**
 * useMediaQuery Hook
 * 媒体查询 Hook - 监听浏览器媒体查询状态变化
 * 
 * 遵循 Liquid Glass 设计系统原则：
 * - 响应式设计优先
 * - 性能优化（使用 matchMedia API）
 * - SSR 兼容
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * 使用媒体查询 Hook
 * @param query - CSS 媒体查询字符串（例如：'(min-width: 768px)'）
 * @returns boolean - 媒体查询是否匹配
 * 
 * @example
 * ```tsx
 * // 检测是否为移动设备
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * 
 * // 检测是否为暗色模式
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 * 
 * // 检测是否为触摸设备
 * const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // 初始状态处理（SSR 兼容）
  const getMatches = (query: string): boolean => {
    // 防止 SSR 错误
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    // 防止 SSR 错误
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // 更新状态的处理函数
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 初始化时检查一次
    setMatches(mediaQuery.matches);

    // 添加监听器（现代浏览器使用 addEventListener）
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器（已废弃的 API）
      // @ts-ignore
      mediaQuery.addListener(handleChange);
    }

    // 清理函数
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * 预定义的断点常量（基于 Tailwind CSS）
 * 与 Liquid Glass 设计系统的响应式规范一致
 */
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  
  // 反向查询（小于某个断点）
  maxSm: '(max-width: 639px)',
  maxMd: '(max-width: 767px)',
  maxLg: '(max-width: 1023px)',
  maxXl: '(max-width: 1279px)',
  max2xl: '(max-width: 1535px)',
  
  // 特殊查询
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 768px) and (max-width: 1024px)',
  desktop: '(min-width: 1024px)',
  touch: '(hover: none) and (pointer: coarse)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;

/**
 * 便捷的断点检测 Hooks
 */
export const useIsMobile = () => useMediaQuery(BREAKPOINTS.mobile);
export const useIsTablet = () => useMediaQuery(BREAKPOINTS.tablet);
export const useIsDesktop = () => useMediaQuery(BREAKPOINTS.desktop);
export const useIsTouchDevice = () => useMediaQuery(BREAKPOINTS.touch);
export const usePrefersDarkMode = () => useMediaQuery(BREAKPOINTS.darkMode);
export const usePrefersReducedMotion = () => useMediaQuery(BREAKPOINTS.reducedMotion);
