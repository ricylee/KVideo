/**
 * Video Source Configuration and Management
 * Handles third-party video API sources with validation and health checks
 */

import type { VideoSource, CustomSourceConfig } from '@/lib/types';

const STORAGE_KEY = 'kvideo_custom_sources';
const HEALTH_CHECK_TIMEOUT = 5000;

// Default predefined video sources - Real Chinese video APIs
const DEFAULT_SOURCES: VideoSource[] = [
  {
    id: 'dytt',
    name: '电影天堂',
    baseUrl: 'http://caiji.dyttzyapi.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 1,
  },
  {
    id: 'ruyi',
    name: '如意',
    baseUrl: 'https://cj.rycjapi.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 2,
  },
  {
    id: 'baofeng',
    name: '暴风',
    baseUrl: 'https://bfzyapi.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 3,
  },
  {
    id: 'tianya',
    name: '天涯',
    baseUrl: 'https://tyyszy.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 4,
  },
  {
    id: 'feifan',
    name: '非凡影视',
    baseUrl: 'http://ffzy5.tv/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 5,
  },
  {
    id: 'sanliuling',
    name: '360',
    baseUrl: 'https://360zy.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 6,
  },
  {
    id: 'wolong',
    name: '卧龙',
    baseUrl: 'https://wolongzyw.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 7,
  },
  {
    id: 'jisu',
    name: '极速',
    baseUrl: 'https://jszyapi.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 8,
  },
  {
    id: 'mozhua',
    name: '魔爪',
    baseUrl: 'https://mozhuazy.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 9,
  },
  {
    id: 'modu',
    name: '魔都',
    baseUrl: 'https://www.mdzyapi.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 10,
  },
  {
    id: 'zuida',
    name: '最大',
    baseUrl: 'https://api.zuidapi.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 11,
  },
  {
    id: 'yinghua',
    name: '樱花',
    baseUrl: 'https://m3u8.apiyhzy.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 12,
  },
  {
    id: 'baiduyun',
    name: '百度云',
    baseUrl: 'https://api.apibdzy.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 13,
  },
  {
    id: 'wujin',
    name: '无尽',
    baseUrl: 'https://api.wujinapi.me/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 14,
  },
  {
    id: 'wangwang',
    name: '旺旺',
    baseUrl: 'https://wwzy.tv/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 15,
  },
  {
    id: 'ikun',
    name: 'iKun',
    baseUrl: 'https://ikunzyapi.com/api.php/provide/vod',
    searchPath: '',
    detailPath: '',
    enabled: true,
    priority: 16,
  },
];

/**
 * Get all video sources (default + custom)
 */
export function getAllSources(): VideoSource[] {
  const customSources = getCustomSources();
  return [...DEFAULT_SOURCES, ...customSources].filter(s => s.enabled);
}

/**
 * Get enabled sources sorted by priority
 */
export function getEnabledSources(): VideoSource[] {
  return getAllSources()
    .filter(source => source.enabled !== false)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Get source by ID
 */
export function getSourceById(id: string): VideoSource | undefined {
  return getAllSources().find(source => source.id === id);
}

/**
 * Get custom sources from localStorage
 */
export function getCustomSources(): VideoSource[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const config: CustomSourceConfig = JSON.parse(stored);
    return config.sources || [];
  } catch (error) {
    console.error('Failed to load custom sources:', error);
    return [];
  }
}

/**
 * Save custom sources to localStorage
 */
export function saveCustomSources(sources: VideoSource[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const config: CustomSourceConfig = {
      sources,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save custom sources:', error);
  }
}

/**
 * Add a new custom source
 */
export function addCustomSource(source: VideoSource): boolean {
  try {
    validateSource(source);
    const customSources = getCustomSources();
    
    // Check for duplicate ID
    if (customSources.some(s => s.id === source.id)) {
      throw new Error('Source with this ID already exists');
    }
    
    customSources.push(source);
    saveCustomSources(customSources);
    return true;
  } catch (error) {
    console.error('Failed to add custom source:', error);
    return false;
  }
}

/**
 * Update an existing custom source
 */
export function updateCustomSource(id: string, updates: Partial<VideoSource>): boolean {
  try {
    const customSources = getCustomSources();
    const index = customSources.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error('Source not found');
    }
    
    customSources[index] = { ...customSources[index], ...updates };
    validateSource(customSources[index]);
    saveCustomSources(customSources);
    return true;
  } catch (error) {
    console.error('Failed to update custom source:', error);
    return false;
  }
}

/**
 * Remove a custom source
 */
export function removeCustomSource(id: string): boolean {
  try {
    const customSources = getCustomSources();
    const filtered = customSources.filter(s => s.id !== id);
    saveCustomSources(filtered);
    return true;
  } catch (error) {
    console.error('Failed to remove custom source:', error);
    return false;
  }
}

/**
 * Validate source configuration
 */
export function validateSource(source: VideoSource): void {
  if (!source.id || !source.name) {
    throw new Error('Source must have id and name');
  }
  
  if (!source.baseUrl) {
    throw new Error('Source must have baseUrl');
  }
  
  try {
    new URL(source.baseUrl);
  } catch {
    throw new Error('Invalid baseUrl format');
  }
  
  if (!source.searchPath || !source.detailPath) {
    throw new Error('Source must have searchPath and detailPath');
  }
}

/**
 * Perform health check on a source
 */
export async function healthCheckSource(source: VideoSource): Promise<{
  healthy: boolean;
  responseTime?: number;
  error?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
  
  try {
    const startTime = Date.now();
    const url = `${source.baseUrl}${source.searchPath}?ac=list&pg=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: source.headers || {},
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        healthy: false,
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
    
    const data = await response.json();
    
    if (data.code !== 1 && data.code !== 0) {
      return {
        healthy: false,
        responseTime,
        error: 'Invalid API response format',
      };
    }
    
    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Health check multiple sources in parallel
 */
export async function healthCheckSources(sources: VideoSource[]): Promise<
  Map<string, { healthy: boolean; responseTime?: number; error?: string }>
> {
  const results = await Promise.all(
    sources.map(async source => {
      const result = await healthCheckSource(source);
      return { sourceId: source.id, result };
    })
  );
  
  return new Map(results.map(({ sourceId, result }) => [sourceId, result]));
}
