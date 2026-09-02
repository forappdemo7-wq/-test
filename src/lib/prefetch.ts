/**
 * Prefetching utilities for route chunks, API data, and media assets.
 */

// Cache of already prefetched route loaders
const prefetchedRoutes = new Set<string>();

/**
 * Prefetches a dynamic import module on user intent (e.g. mouse hover or touchstart).
 */
export function prefetchRoute(routeName: string, importFn: () => Promise<any>): void {
  if (prefetchedRoutes.has(routeName)) return;
  prefetchedRoutes.add(routeName);

  try {
    // Execute dynamic import in background idle time
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        importFn().catch(() => {});
      });
    } else {
      setTimeout(() => {
        importFn().catch(() => {});
      }, 100);
    }
  } catch {
    // Ignore prefetch failures
  }
}

/**
 * Prefetches next post images or media assets ahead of scrolling.
 */
const prefetchedMedia = new Set<string>();

export function prefetchImage(src: string): void {
  if (!src || prefetchedMedia.has(src)) return;
  prefetchedMedia.add(src);

  const img = new Image();
  img.src = src;
  img.decoding = 'async';
}

export function prefetchImages(srcs: string[]): void {
  srcs.forEach((src) => prefetchImage(src));
}
