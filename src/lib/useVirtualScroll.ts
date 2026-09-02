import { useState, useEffect, useRef, useMemo, useCallback, type RefObject } from 'react';

export interface VirtualItem<T> {
  item: T;
  index: number;
  offsetTop: number;
}

export interface UseVirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  containerRef?: RefObject<HTMLElement | null>;
  useWindowScroll?: boolean;
}

/**
 * High-performance virtual windowing hook for large feeds and lists.
 * Only renders DOM nodes visible in current viewport plus a configurable overscan buffer.
 */
export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
) {
  const {
    itemHeight,
    overscan = 3,
    containerRef,
    useWindowScroll = true,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  const rafId = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      if (useWindowScroll) {
        setScrollTop(window.scrollY || document.documentElement.scrollTop || 0);
      } else if (containerRef?.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
      rafId.current = null;
    });
  }, [useWindowScroll, containerRef]);

  const handleResize = useCallback(() => {
    if (useWindowScroll) {
      setViewportHeight(window.innerHeight);
    } else if (containerRef?.current) {
      setViewportHeight(containerRef.current.clientHeight);
    }
  }, [useWindowScroll, containerRef]);

  useEffect(() => {
    if (useWindowScroll) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
      handleScroll();
      handleResize();
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        if (rafId.current) cancelAnimationFrame(rafId.current);
      };
    } else if (containerRef?.current) {
      const container = containerRef.current;
      container.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
      handleScroll();
      handleResize();
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        if (rafId.current) cancelAnimationFrame(rafId.current);
      };
    }
  }, [useWindowScroll, containerRef, handleScroll, handleResize]);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex, virtualItems } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, virtualItems: [] };
    }

    const calculatedStart = Math.floor(scrollTop / itemHeight);
    const start = Math.max(0, calculatedStart - overscan);

    const calculatedEnd = Math.ceil((scrollTop + viewportHeight) / itemHeight);
    const end = Math.min(items.length, calculatedEnd + overscan);

    const visible: VirtualItem<T>[] = [];
    for (let i = start; i < end; i++) {
      visible.push({
        item: items[i],
        index: i,
        offsetTop: i * itemHeight,
      });
    }

    return {
      startIndex: start,
      endIndex: end,
      virtualItems: visible,
    };
  }, [items, scrollTop, viewportHeight, itemHeight, overscan]);

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollTop,
    viewportHeight,
  };
}
