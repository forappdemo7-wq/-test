import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Play, Eye, Heart } from 'lucide-react';
import { Reel } from '../../types';
import { useApp } from '../../context/AppContext';

interface ReelsSuggestedTrayProps {
  isOpen: boolean;
  onClose: () => void;
  currentReelId: string;
  onSelectReel: (reel: Reel) => void;
}

export const ReelsSuggestedTray: React.FC<ReelsSuggestedTrayProps> = ({
  isOpen,
  onClose,
  currentReelId,
  onSelectReel,
}) => {
  const { currentUser } = useApp();
  const [suggested, setSuggested] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch(`/api/reels/suggested?reelId=${currentReelId}&currentUserId=${currentUser?.id || 'none'}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSuggested(data);
      })
      .catch((err) => console.error('Failed to load suggested reels:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, currentReelId, currentUser?.id]);

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
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-neutral-200/80 dark:border-neutral-800 z-10"
        >
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Suggested Reels For You
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Grid of Suggested Reels */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-[9/16] bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : suggested.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                No extra suggestions found right now.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {suggested.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectReel(item);
                      onClose();
                    }}
                    className="group relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer shadow-soft-xs border border-neutral-200/50 dark:border-neutral-800"
                  >
                    <img
                      src={item.posterUrl || item.videoUrl}
                      alt={item.caption || 'Suggested reel'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3 text-white">
                      <div className="self-end p-1.5 rounded-full bg-black/40 backdrop-blur-md">
                        <Play size={12} className="fill-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={item.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                            alt={item.author?.username}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover border border-white/60"
                          />
                          <span className="text-[11px] font-bold truncate">@{item.author?.username}</span>
                        </div>
                        <p className="text-[10px] text-white/90 line-clamp-1 leading-tight">
                          {item.caption}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-white/80">
                          <span className="flex items-center gap-0.5">
                            <Heart size={10} className="fill-rose-500 text-rose-500" /> {item.likesCount}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye size={10} /> {item.viewsCount || '1.2k'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
