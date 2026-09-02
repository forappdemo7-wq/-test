import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Trash2, Play, Eye, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Reel } from '../../types';

interface ReelsWatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReel: (reel: Reel) => void;
}

export const ReelsWatchHistoryModal: React.FC<ReelsWatchHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectReel,
}) => {
  const {
    watchHistory,
    fetchWatchHistory,
    clearWatchHistory,
    currentUser,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchWatchHistory().finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col max-h-[85vh] h-[80vh] overflow-hidden border border-neutral-200/80 dark:border-neutral-800 z-10"
        >
          {/* Grab Bar */}
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-rose-500" /> Watch History
            </h3>
            <div className="flex items-center gap-2">
              {watchHistory.length > 0 && (
                <button
                  onClick={clearWatchHistory}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-20 h-28 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                    <div className="flex-1 space-y-2 py-2">
                      <div className="w-32 h-4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      <div className="w-48 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : watchHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 text-neutral-400 dark:text-neutral-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Clock size={22} className="text-neutral-400" />
                </div>
                <p className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
                  No watch history yet
                </p>
                <p className="text-xs text-neutral-500 max-w-xs">
                  Reels you watch will automatically be saved here so you can revisit them anytime.
                </p>
              </div>
            ) : (
              watchHistory.map((item) => {
                const reel = item.reel;
                if (!reel) return null;
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      onSelectReel(reel);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer border border-neutral-100 dark:border-neutral-800/80 group"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-22 rounded-xl overflow-hidden shrink-0 bg-neutral-900">
                      <img
                        src={reel.posterUrl || reel.videoUrl}
                        alt={reel.caption || 'Reel'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={16} className="fill-white text-white" />
                      </div>
                      {/* Progress Bar overlay */}
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(10, item.progressPercent))}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={
                            reel.author?.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                          }
                          alt={reel.author?.username}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          @{reel.author?.username}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                        {reel.caption || 'No caption'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>Watched {item.watchDurationSecs || 0}s</span>
                        <span>•</span>
                        <span>{item.progressPercent}% completed</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
