import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Archive,
  Calendar,
  Sparkles,
  Share2,
  Plus,
  Play,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArchivedStoryItem } from '../../types';
import { AddToHighlightModal } from './AddToHighlightModal';

interface StoryArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoryArchiveModal: React.FC<StoryArchiveModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, addNewStory } = useApp();
  const [archive, setArchive] = useState<ArchivedStoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<ArchivedStoryItem | null>(null);
  const [highlightStory, setHighlightStory] = useState<ArchivedStoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;

    const fetchArchive = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${currentUser.id}/stories/archive`);
        if (res.ok) {
          const data = await res.json();
          setArchive(data);
        }
      } catch (err) {
        console.error('Failed to fetch story archive:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchive();
  }, [isOpen, currentUser?.id]);

  const handleReshareToStory = async (item: ArchivedStoryItem) => {
    await addNewStory({
      mediaUrl: item.mediaUrl,
      caption: item.caption,
      filter: item.filter,
    });
    setToastMessage('Re-shared to your story!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-neutral-900 border border-white/15 rounded-3xl p-5 sm:p-6 text-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Archive size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Stories Archive</h2>
              <p className="text-xs text-white/60">Only you can see your archived stories</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-emerald-400 animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Content Body: Grid of Archived Stories */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-white/50 text-xs">Loading stories archive...</div>
          ) : archive.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 text-white/60">
              <Clock size={40} className="text-white/30 stroke-[1.5]" />
              <p className="text-sm font-semibold text-white">No archived stories yet</p>
              <p className="text-xs max-w-xs">
                When you share stories, they will automatically be preserved in your private archive.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {archive.map((story) => {
                const dateStr = story.rawTimestamp
                  ? new Date(story.rawTimestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Past';

                return (
                  <motion.div
                    key={story.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStory(story)}
                    className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-800 border border-white/10 cursor-pointer shadow-sm"
                  >
                    {story.mediaType === 'video' || story.mediaUrl.endsWith('.mp4') ? (
                      <div className="w-full h-full relative">
                        <video
                          src={story.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 backdrop-blur-md text-white">
                          <Play size={12} className="fill-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={story.mediaUrl}
                        alt="Archived story"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Date Badge Overlay */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white/90">
                      {dateStr}
                    </div>

                    {/* Hover actions overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHighlightStory(story);
                        }}
                        className="w-full py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-[11px] font-semibold text-white flex items-center justify-center gap-1 transition-colors"
                      >
                        <Sparkles size={12} />
                        <span>Highlight</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReshareToStory(story);
                        }}
                        className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-colors"
                      >
                        <Share2 size={12} />
                        <span>Share</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Story Preview Modal */}
        <AnimatePresence>
          {selectedStory && (
            <div
              onClick={() => setSelectedStory(null)}
              className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl flex flex-col justify-between"
              >
                {/* Media */}
                {selectedStory.mediaType === 'video' || selectedStory.mediaUrl.endsWith('.mp4') ? (
                  <video
                    src={selectedStory.mediaUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={selectedStory.mediaUrl}
                    alt="Archived story"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Top bar */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-semibold text-white">
                    {selectedStory.rawTimestamp
                      ? new Date(selectedStory.rawTimestamp).toLocaleDateString()
                      : 'Archived Story'}
                  </div>
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Bottom Action bar */}
                <div className="absolute bottom-4 inset-x-4 z-20 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setHighlightStory(selectedStory);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-95"
                  >
                    <Sparkles size={15} />
                    <span>Highlight</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReshareToStory(selectedStory);
                      setSelectedStory(null);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                  >
                    <Share2 size={15} />
                    <span>Share to Story</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Add To Highlight Sub-Modal */}
        {highlightStory && (
          <AddToHighlightModal
            story={{
              id: highlightStory.id,
              mediaUrl: highlightStory.mediaUrl,
              mediaType: highlightStory.mediaType,
              caption: highlightStory.caption,
              filter: highlightStory.filter,
              timestamp: highlightStory.timestamp,
            }}
            isOpen={Boolean(highlightStory)}
            onClose={() => setHighlightStory(null)}
            onSuccess={(title) => {
              setToastMessage(`Added to "${title}"!`);
              setTimeout(() => setToastMessage(null), 2500);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
