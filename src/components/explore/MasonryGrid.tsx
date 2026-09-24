import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Clapperboard,
  Layers,
  Bookmark,
  MapPin,
} from 'lucide-react';
import { Post, Reel } from '../../types';
import { useApp } from '../../context/AppContext';
import { getOptimizedImageUrl, generateSrcSet } from '../../lib/imageOptimization';

interface MasonryGridProps {
  items: (Post | Reel)[];
  onOpenPost: (item: Post | Reel) => void;
  isLoadingMore?: boolean;
}

const ITEMS_PER_PAGE = 12;

interface MasonryCardProps {
  item: Post | Reel;
  itemIdx: number;
  colIdx: number;
  onOpenPost: (item: Post | Reel) => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, item: Post | Reel) => void;
}

const MasonryCard = memo<MasonryCardProps>(({
  item,
  itemIdx,
  colIdx,
  onOpenPost,
  isSaved,
  onToggleSave,
}) => {
  const isReel = 'videoUrl' in item;
  const post = item as Post;
  const reel = item as Reel;

  const rawMediaUrl = isReel
    ? reel.posterUrl || reel.videoUrl
    : post.media[0]?.url;

  const optimizedUrl = getOptimizedImageUrl(rawMediaUrl, {
    width: 480,
    quality: 80,
  });
  const srcSet = generateSrcSet(rawMediaUrl, [240, 360, 480, 720]);

  const isCarousel = !isReel && post.media.length > 1;

  const ratioClass = isReel
    ? 'aspect-[9/16]'
    : (itemIdx + colIdx) % 3 === 0
    ? 'aspect-[4/5]'
    : (itemIdx + colIdx) % 4 === 0
    ? 'aspect-[1/1]'
    : 'aspect-[3/4]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: (itemIdx % 6) * 0.03 }}
      onClick={() => onOpenPost(item)}
      role="button"
      tabIndex={0}
      aria-label={`Explore post by ${item.author.username}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenPost(item);
        }
      }}
      className={`relative group bg-neutral-200 dark:bg-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-soft-xs hover:shadow-soft-md transition-all duration-300 ${ratioClass}`}
    >
      {/* Media Image */}
      <img
        src={optimizedUrl}
        srcSet={srcSet || undefined}
        sizes="(max-width: 640px) 50vw, 33vw"
        alt={item.caption || `Post by ${item.author.username}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient overlay on hover/active */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity duration-200" />

      {/* Top Badges (Reel / Carousel) */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
        {isReel && (
          <span className="p-1.5 rounded-xl bg-black/60 text-white backdrop-blur-md shadow-soft-xs">
            <Clapperboard size={13} />
          </span>
        )}
        {isCarousel && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/60 text-white backdrop-blur-md text-[10px] font-bold shadow-soft-xs">
            <Layers size={12} />
            <span>{post.media.length}</span>
          </span>
        )}
      </div>

      {/* Save Bookmark Icon (Top Left) */}
      <button
        onClick={(e) => onToggleSave(e, item)}
        aria-label={isSaved ? 'Remove from saved' : 'Save to bookmarks'}
        className={`absolute top-2.5 left-2.5 p-1.5 rounded-xl transition-all backdrop-blur-md z-10 cursor-pointer opacity-0 group-hover:opacity-100 ${
          isSaved
            ? 'bg-white text-neutral-900 shadow-soft-xs opacity-100'
            : 'bg-black/50 text-white hover:bg-black/75'
        }`}
      >
        <Bookmark size={13} className={isSaved ? 'fill-current' : ''} />
      </button>

      {/* Bottom Info Overlay on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
        {/* Author Pill */}
        <div className="flex items-center gap-1.5 min-w-0">
          <img
            src={item.author.avatar}
            alt={item.author.username}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover border border-white/40 flex-shrink-0"
          />
          <span className="text-xs font-bold truncate drop-shadow-sm">
            {item.author.username}
          </span>
          {item.author.isVerified && (
            <span className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0">
              ✓
            </span>
          )}
        </div>

        {/* Location or Caption Snippet */}
        {'location' in item && item.location && (
          <p className="text-[10px] text-neutral-200 flex items-center gap-1 truncate">
            <MapPin size={10} className="flex-shrink-0 text-red-400" />
            <span>{item.location}</span>
          </p>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-[11px] font-bold pt-0.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart size={13} className="fill-white" />
              {item.likesCount > 1000
                ? `${(item.likesCount / 1000).toFixed(1)}k`
                : item.likesCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={13} className="fill-white" />
              {item.commentsCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

MasonryCard.displayName = 'MasonryCard';

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  items,
  onOpenPost,
}) => {
  const { toggleSavePost, toggleSaveReel, savedPostIds } = useApp();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [columnCount, setColumnCount] = useState(3);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Responsive column count calculation
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Reset pagination when items filter changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [items.length]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < items.length) {
          setVisibleCount((prev) => Math.min(prev + 8, items.length));
        }
      },
      { rootMargin: '300px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, items.length]);

  const handleToggleSave = (e: React.MouseEvent, item: Post | Reel) => {
    e.stopPropagation();
    if ('videoUrl' in item) {
      toggleSaveReel(item.id);
    } else {
      toggleSavePost(item.id);
    }
  };

  // Distribute visible items into columns for balanced masonry
  const columns = useMemo(() => {
    const cols: (Post | Reel)[][] = Array.from({ length: columnCount }, () => []);
    const displayedItems = items.slice(0, visibleCount);

    displayedItems.forEach((item, index) => {
      cols[index % columnCount].push(item);
    });

    return cols;
  }, [items, visibleCount, columnCount]);

  return (
    <div className="w-full space-y-4">
      {/* Masonry Columns Container */}
      <div className="flex gap-2 sm:gap-3.5 items-start">
        {columns.map((colItems, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col gap-2 sm:gap-3.5 min-w-0">
            {colItems.map((item, itemIdx) => {
              const isReel = 'videoUrl' in item;
              const isSaved = isReel
                ? (item as Reel).isSaved
                : savedPostIds.includes(item.id) || (item as Post).isSaved;

              return (
                <MasonryCard
                  key={item.id}
                  item={item}
                  itemIdx={itemIdx}
                  colIdx={colIdx}
                  onOpenPost={onOpenPost}
                  isSaved={isSaved}
                  onToggleSave={handleToggleSave}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Infinite Scroll Trigger Sentinel */}
      <div ref={sentinelRef} className="w-full py-4 text-center">
        {visibleCount < items.length ? (
          <div className="flex items-center justify-center gap-2 py-4" aria-label="Loading more explore content">
            <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
          </div>
        ) : items.length > 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs font-semibold text-neutral-400">
              ✨ You've discovered everything matching your view
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
