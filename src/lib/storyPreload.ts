import { StoryGroup, StoryItem } from '../types';

const preloadedUrls = new Set<string>();

/**
 * Preloads an image in the background so it is instantly rendered without layout pop or white flash
 */
export function preloadImage(url: string): Promise<void> {
  if (!url || preloadedUrls.has(url)) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      preloadedUrls.add(url);
      resolve();
    };
    img.onerror = () => {
      resolve(); // Do not block if network error
    };
  });
}

/**
 * Preloads a video by fetching the first chunk/metadata with preload="auto"
 */
export function preloadVideo(url: string): void {
  if (!url || preloadedUrls.has(url)) return;

  try {
    const video = document.createElement('video');
    video.src = url;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.load();
    preloadedUrls.add(url);
  } catch {
    // Ignore video preload errors
  }
}

/**
 * Preload media (image or video)
 */
export function preloadMedia(item: StoryItem): void {
  if (!item?.mediaUrl) return;

  const isVideo =
    item.mediaType === 'video' ||
    item.mediaUrl.endsWith('.mp4') ||
    item.mediaUrl.endsWith('.webm') ||
    item.mediaUrl.includes('video');

  if (isVideo) {
    preloadVideo(item.mediaUrl);
  } else {
    preloadImage(item.mediaUrl);
  }
}

/**
 * Smart Preloading for Stories:
 * - Preloads remaining slides in current user's story
 * - Preloads the first slide of the previous and next users' stories
 */
export function preloadAdjacentStories(
  stories: StoryGroup[],
  activeGroupIndex: number | null,
  currentSlideIndex: number
): void {
  if (activeGroupIndex === null || !stories[activeGroupIndex]) return;

  const currentGroup = stories[activeGroupIndex];

  // 1. Preload next 2 slides in current group
  for (let i = currentSlideIndex + 1; i <= currentSlideIndex + 2 && i < currentGroup.items.length; i++) {
    preloadMedia(currentGroup.items[i]);
  }

  // 2. Preload next group's first 2 slides
  if (activeGroupIndex + 1 < stories.length) {
    const nextGroup = stories[activeGroupIndex + 1];
    if (nextGroup.items[0]) preloadMedia(nextGroup.items[0]);
    if (nextGroup.items[1]) preloadMedia(nextGroup.items[1]);
  }

  // 3. Preload previous group's last slide
  if (activeGroupIndex - 1 >= 0) {
    const prevGroup = stories[activeGroupIndex - 1];
    const lastIdx = prevGroup.items.length - 1;
    if (prevGroup.items[lastIdx]) preloadMedia(prevGroup.items[lastIdx]);
  }
}
