import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronUp,
  ChevronDown,
  Clapperboard,
  Plus,
  History,
  Flame,
  Users,
  Sparkles,
  Bookmark,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReelItem } from './ReelItem';
import { ReelsCommentsDrawer } from './ReelsCommentsDrawer';
import { ReelsShareSheet } from './ReelsShareSheet';
import { ReelsSuggestedTray } from './ReelsSuggestedTray';
import { ReelsWatchHistoryModal } from './ReelsWatchHistoryModal';
import { Reel } from '../../types';

export const ReelsViewer: React.FC = () => {
  const {
    reels,
    activeReelIndex,
    setActiveReelIndex,
    reelCategory,
    setReelCategory,
    loadMoreReels,
    isLoadingReels,
    setIsCreateOpen,
  } = useApp();

  const [isMuted, setIsMuted] = useState(true);
  const [selectedCommentsReel, setSelectedCommentsReel] = useState<Reel | null>(null);
  const [selectedShareReel, setSelectedShareReel] = useState<Reel | null>(null);
  const [selectedSuggestedReel, setSelectedSuggestedReel] = useState<Reel | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isScrollingRef = useRef(false);

  const currentReel = reels[activeReelIndex] || reels[0];

  const handleNextReel = useCallback(() => {
    if (activeReelIndex < reels.length - 1) {
      setActiveReelIndex(activeReelIndex + 1);
      // If close to end, trigger infinite scroll loader
      if (activeReelIndex >= reels.length - 3) {
        loadMoreReels();
      }
    } else {
      loadMoreReels();
    }
  }, [activeReelIndex, reels.length, setActiveReelIndex, loadMoreReels]);

  const handlePrevReel = useCallback(() => {
    if (activeReelIndex > 0) {
      setActiveReelIndex(activeReelIndex - 1);
    }
  }, [activeReelIndex, setActiveReelIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextReel, handlePrevReel]);

  // Handle wheel scrolling with debouncing
  const handleWheel = (e: React.WheelEvent) => {
    if (isScrollingRef.current) return;
    if (Math.abs(e.deltaY) > 40) {
      isScrollingRef.current = true;
      if (e.deltaY > 0) {
        handleNextReel();
      } else {
        handlePrevReel();
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  };

  const handleSelectSuggestedReel = (reel: Reel) => {
    const index = reels.findIndex((r) => r.id === reel.id);
    if (index !== -1) {
      setActiveReelIndex(index);
    }
  };

  const handleSelectHistoryReel = (reel: Reel) => {
    const index = reels.findIndex((r) => r.id === reel.id);
    if (index !== -1) {
      setActiveReelIndex(index);
    }
  };

  // If no reels in category
  if (!currentReel || reels.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-60px)] sm:h-[88vh] sm:max-h-[820px] max-w-sm sm:max-w-md mx-auto my-0 sm:my-3 relative flex flex-col items-center justify-center select-none pb-16 sm:pb-0 px-4">
        {/* Category switcher pill */}
        <div className="mb-6 flex items-center gap-1.5 p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-soft-xs">
          <button
            onClick={() => setReelCategory('for_you')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              reelCategory === 'for_you'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-soft-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setReelCategory('following')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              reelCategory === 'following'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-soft-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setReelCategory('trending')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              reelCategory === 'trending'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-soft-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Trending
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-4 shadow-soft-xl"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
            <Clapperboard size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {reelCategory === 'saved'
                ? 'No Saved Reels'
                : reelCategory === 'following'
                ? 'No Reels from Accounts You Follow'
                : 'No Reels Available'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
              {reelCategory === 'saved'
                ? 'Save your favorite reels by clicking the bookmark icon on any reel to revisit them here.'
                : 'Create and share engaging vertical videos or clips with your community.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors shadow-soft flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={16} /> Create Reel
            </button>
            {reelCategory !== 'for_you' && (
              <button
                onClick={() => setReelCategory('for_you')}
                className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Explore For You
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      onWheel={handleWheel}
      className="w-full h-[calc(100vh-60px)] sm:h-[88vh] sm:max-h-[820px] max-w-sm sm:max-w-md mx-auto my-0 sm:my-3 relative flex items-center justify-center select-none pb-20 sm:pb-0"
    >
      {/* Category Switcher Floating Pill (Top Floating Bar) */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/15 text-white shadow-soft-xs">
        <button
          onClick={() => setReelCategory('for_you')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            reelCategory === 'for_you'
              ? 'bg-white text-black font-extrabold shadow-soft-xs'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <Sparkles size={12} />
          <span>For You</span>
        </button>
        <button
          onClick={() => setReelCategory('following')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            reelCategory === 'following'
              ? 'bg-white text-black font-extrabold shadow-soft-xs'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <Users size={12} />
          <span>Following</span>
        </button>
        <button
          onClick={() => setReelCategory('trending')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            reelCategory === 'trending'
              ? 'bg-white text-black font-extrabold shadow-soft-xs'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <Flame size={12} className="text-amber-400" />
          <span>Trending</span>
        </button>
      </div>

      {/* Watch History & Create Shortcut Pill (Top Right on desktop) */}
      <div className="hidden sm:flex items-center gap-2 absolute -left-16 top-4 z-30">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsHistoryOpen(true)}
          title="Watch History"
          className="p-2.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white border border-neutral-200/80 dark:border-neutral-700/80 shadow-soft-lg cursor-pointer"
        >
          <History size={18} />
        </motion.button>
      </div>

      {/* Desktop Up/Down Snap Navigation Controls */}
      <div className="hidden md:flex flex-col gap-3 absolute -right-16 top-1/2 -translate-y-1/2 z-30">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrevReel}
          disabled={activeReelIndex === 0}
          title="Previous Reel (Up Arrow)"
          className="p-3 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-full shadow-soft-lg border border-neutral-200/80 dark:border-neutral-700/80 disabled:opacity-30 cursor-pointer"
        >
          <ChevronUp size={22} />
        </motion.button>
        <div className="text-center text-[10px] font-bold text-neutral-400">
          {activeReelIndex + 1}/{reels.length}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNextReel}
          title="Next Reel (Down Arrow)"
          className="p-3 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-full shadow-soft-lg border border-neutral-200/80 dark:border-neutral-700/80 cursor-pointer"
        >
          <ChevronDown size={22} />
        </motion.button>
      </div>

      {/* Main Snap Vertical Container with Gesture Drag */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.y < -50 || info.velocity.y < -300) {
            handleNextReel();
          } else if (info.offset.y > 50 || info.velocity.y > 300) {
            handlePrevReel();
          }
        }}
        className="w-full h-full bg-black sm:rounded-[36px] overflow-hidden relative shadow-soft-xl flex flex-col justify-between touch-none border border-neutral-800/80"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentReel.id}
            initial={{ opacity: 0.6, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.6, y: -40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <ReelItem
              reel={currentReel}
              isActive={true}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted((prev) => !prev)}
              onOpenComments={(r) => setSelectedCommentsReel(r)}
              onOpenShare={(r) => setSelectedShareReel(r)}
              onOpenSuggested={(r) => setSelectedSuggestedReel(r)}
              preloadStrategy="auto"
            />
          </motion.div>
        </AnimatePresence>

        {/* Hidden Preloaders for adjacent videos (Preloading optimization) */}
        <div className="hidden pointer-events-none" aria-hidden="true">
          {reels[activeReelIndex - 1] && (
            <video
              src={reels[activeReelIndex - 1].videoUrl}
              preload="metadata"
              muted
            />
          )}
          {reels[activeReelIndex + 1] && (
            <video
              src={reels[activeReelIndex + 1].videoUrl}
              preload="metadata"
              muted
            />
          )}
        </div>
      </motion.div>

      {/* Comments Drawer */}
      {selectedCommentsReel && (
        <ReelsCommentsDrawer
          isOpen={Boolean(selectedCommentsReel)}
          onClose={() => setSelectedCommentsReel(null)}
          reel={selectedCommentsReel}
        />
      )}

      {/* Share Sheet */}
      {selectedShareReel && (
        <ReelsShareSheet
          isOpen={Boolean(selectedShareReel)}
          onClose={() => setSelectedShareReel(null)}
          reel={selectedShareReel}
        />
      )}

      {/* Suggested Reels Tray */}
      {selectedSuggestedReel && (
        <ReelsSuggestedTray
          isOpen={Boolean(selectedSuggestedReel)}
          onClose={() => setSelectedSuggestedReel(null)}
          currentReelId={selectedSuggestedReel.id}
          onSelectReel={handleSelectSuggestedReel}
        />
      )}

      {/* Watch History Modal */}
      <ReelsWatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectReel={handleSelectHistoryReel}
      />
    </div>
  );
};
