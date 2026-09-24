import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageOff } from 'lucide-react';
import {
  getOptimizedImageUrl,
  generateSrcSet,
  getBlurPlaceholderUrl,
  RESPONSIVE_IMAGE_SIZES,
} from '../../lib/imageOptimization';

export interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  filter?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'reel' | 'auto';
  priority?: boolean;
  sizes?: string;
  onClick?: () => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = memo(({
  src,
  alt = 'Post media',
  className = '',
  imgClassName = '',
  filter,
  aspectRatio = 'square',
  priority = false,
  sizes,
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const blurPlaceholder = getBlurPlaceholderUrl(src);
  const optimizedSrc = getOptimizedImageUrl(src, {
    width: priority ? 960 : 720,
    quality: 80,
  });
  const srcSet = generateSrcSet(src, [360, 640, 960, 1200]);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    if (!src) {
      setHasError(true);
      return;
    }

    // Pre-decode high-priority images for instant paint
    if (priority && typeof window !== 'undefined') {
      const img = new Image();
      img.src = optimizedSrc;
      img.decoding = 'async';
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [src, priority, optimizedSrc]);

  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : aspectRatio === 'landscape'
      ? 'aspect-[1.91/1]'
      : aspectRatio === 'reel'
      ? 'aspect-[9/16]'
      : aspectRatio === 'auto'
      ? 'aspect-auto'
      : 'aspect-square';

  const computedSizes =
    sizes ||
    (aspectRatio === 'reel'
      ? RESPONSIVE_IMAGE_SIZES.reelCover
      : RESPONSIVE_IMAGE_SIZES.feedPost);

  return (
    <div
      onClick={onClick}
      className={`relative w-full ${aspectClass} bg-neutral-100 dark:bg-neutral-950 overflow-hidden select-none ${className}`}
    >
      {/* Blurred Low-Res Background Placeholder */}
      {blurPlaceholder && !isLoaded && !hasError && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 opacity-70 transform-gpu pointer-events-none"
        />
      )}

      {/* Shimmer skeleton background while loading */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-neutral-200/60 dark:bg-neutral-800/60 overflow-hidden z-0 pointer-events-none"
          >
            <div className="absolute inset-0 animate-shimmer" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback error view */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 bg-neutral-100 dark:bg-neutral-900 p-4">
          <ImageOff size={28} className="mb-2 opacity-50" />
          <span className="text-xs font-medium">Unable to load media</span>
        </div>
      ) : (
        /* High-res responsive image */
        <img
          src={optimizedSrc}
          srcSet={srcSet || undefined}
          sizes={computedSizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-all duration-300 transform-gpu ${
            filter ? `filter-${filter}` : ''
          } ${
            isLoaded
              ? 'opacity-100 scale-100 filter blur-0'
              : 'opacity-0 scale-102 filter blur-sm'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';
