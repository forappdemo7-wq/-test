import { Post } from '../types';
<<<<<<< HEAD
import { STORAGE_KEYS, safeGetJSON, safeSetJSON } from '../constants/storage';

const FEED_CACHE_KEY = STORAGE_KEYS.FEED_CACHE;
const FEED_CACHE_TIME_KEY = STORAGE_KEYS.FEED_CACHE_TIME;
=======

const FEED_CACHE_KEY = 'instavibe_feed_cache_v2';
const FEED_CACHE_TIME_KEY = 'instavibe_feed_cache_time';
>>>>>>> 549b875b284a18b3eee88ce6733c5379cb0c7987
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

export interface CachedFeedData {
  posts: Post[];
  timestamp: number;
}

export const getCachedFeed = (): Post[] | null => {
<<<<<<< HEAD
  const parsed = safeGetJSON<Post[] | null>(FEED_CACHE_KEY, null);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed;
=======
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse cached feed:', e);
>>>>>>> 549b875b284a18b3eee88ce6733c5379cb0c7987
  }
  return null;
};

export const setCachedFeed = (posts: Post[]): void => {
<<<<<<< HEAD
  if (!posts || posts.length === 0) return;
  // Cache up to top 50 posts for instant startup
  const toCache = posts.slice(0, 50);
  safeSetJSON(FEED_CACHE_KEY, toCache);
  try {
    localStorage.setItem(FEED_CACHE_TIME_KEY, Date.now().toString());
  } catch {
    // Ignore quota errors
=======
  try {
    if (!posts || posts.length === 0) return;
    // Cache up to top 50 posts for instant startup
    const toCache = posts.slice(0, 50);
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(toCache));
    localStorage.setItem(FEED_CACHE_TIME_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Failed to save cached feed:', e);
>>>>>>> 549b875b284a18b3eee88ce6733c5379cb0c7987
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
