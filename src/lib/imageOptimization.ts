/**
 * Image Optimization & CDN Helper
 * Transforms URLs for Unsplash, Cloudinary, and generic CDNs to deliver
 * optimal WebP/AVIF formats, responsive width srcSets, and low-res placeholders.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  fit?: 'crop' | 'cover' | 'contain' | 'inside';
  blur?: number;
}

/**
 * Optimizes an image URL for CDN delivery with custom dimensions, format, and quality.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'crop',
    blur,
  } = options;

  // Unsplash Image CDN Optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('auto', 'format,compress');
      urlObj.searchParams.set('q', quality.toString());
      if (width) urlObj.searchParams.set('w', width.toString());
      if (height) urlObj.searchParams.set('h', height.toString());
      if (fit) urlObj.searchParams.set('fit', fit);
      if (blur) urlObj.searchParams.set('blur', blur.toString());
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Cloudinary CDN Optimization
  if (url.includes('res.cloudinary.com')) {
    try {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        const transformations: string[] = ['f_auto', `q_${quality}`];
        if (width) transformations.push(`w_${width}`);
        if (height) transformations.push(`h_${height}`);
        if (fit) transformations.push(`c_${fit}`);
        if (blur) transformations.push(`e_blur:${blur * 100}`);

        return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
      }
    } catch {
      return url;
    }
  }

  // Data URLs or local images
  return url;
}

/**
 * Generates a responsive srcset string for high-DPI displays and multiple viewport widths.
 */
export function generateSrcSet(
  url: string | undefined | null,
  widths: number[] = [320, 640, 960, 1280],
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string {
  if (!url || !url.startsWith('http')) return '';

  return widths
    .map((w) => {
      const optimizedUrl = getOptimizedImageUrl(url, { ...options, width: w });
      return `${optimizedUrl} ${w}w`;
    })
    .join(', ');
}

/**
 * Generates an ultra-lightweight blur-up placeholder URL (20px wide, heavy blur).
 */
export function getBlurPlaceholderUrl(url: string | undefined | null): string {
  if (!url) return '';
  return getOptimizedImageUrl(url, {
    width: 32,
    quality: 20,
    blur: 15,
  });
}

/**
 * Common responsive sizes attributes for standard UI layouts.
 */
export const RESPONSIVE_IMAGE_SIZES = {
  feedPost: '(max-width: 640px) 100vw, (max-width: 1024px) 470px, 470px',
  exploreGrid: '(max-width: 640px) 33vw, (max-width: 1024px) 300px, 320px',
  avatarSmall: '32px',
  avatarMedium: '48px',
  avatarLarge: '96px',
  storyThumbnail: '66px',
  reelCover: '(max-width: 640px) 100vw, 420px',
};
