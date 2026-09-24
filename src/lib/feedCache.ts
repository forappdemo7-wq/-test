import { Post } from '../types';
import { STORAGE_KEYS, safeGetJSON, safeSetJSON } from '../constants/storage';

const FEED_CACHE_KEY = STORAGE_KEYS.FEED_CACHE;
const FEED_CACHE_TIME_KEY = STORAGE_KEYS.FEED_CACHE_TIME;
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

export interface CachedFeedData {
  posts: Post[];
  timestamp: number;
}

export const getCachedFeed = (): Post[] | null => {
  const parsed = safeGetJSON<Post[] | null>(FEED_CACHE_KEY, null);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed;
  }
  return null;
};

export const setCachedFeed = (posts: Post[]): void => {
  if (!posts || posts.length === 0) return;
  // Cache up to top 50 posts for instant startup
  const toCache = posts.slice(0, 50);
  safeSetJSON(FEED_CACHE_KEY, toCache);
  try {
    localStorage.setItem(FEED_CACHE_TIME_KEY, Date.now().toString());
  } catch {
    // Ignore quota errors
  }
};

export const isFeedCacheStale = (): boolean => {
  try {
    const timeStr = localStorage.getItem(FEED_CACHE_TIME_KEY);
    if (!timeStr) return true;
    const time = parseInt(timeStr, 10);
    return Date.now() - time > CACHE_TTL_MS;
  } catch {
    return true;
  }
};

// Media preloader to ensure zero flicker when scrolling
const preloadedUrls = new Set<string>();

export const preloadMediaUrls = (urls: string[]): void => {
  if (typeof window === 'undefined') return;
  urls.forEach((url) => {
    if (!url || preloadedUrls.has(url)) return;
    preloadedUrls.add(url);
    if (url.endsWith('.mp4') || url.includes('/video/')) {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
    } else {
      const img = new Image();
      img.src = url;
      img.decoding = 'async';
    }
  });
};
