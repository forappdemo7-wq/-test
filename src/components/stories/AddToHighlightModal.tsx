import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Check, Bookmark, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HighlightItem, StoryItem } from '../../types';

interface AddToHighlightModalProps {
  story: StoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (highlightTitle: string) => void;
}

export const AddToHighlightModal: React.FC<AddToHighlightModalProps> = ({
  story,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useApp();
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;

    const fetchHighlights = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${currentUser.id}/highlights`);
        if (res.ok) {
          const data = await res.json();
          setHighlights(data);
        }
      } catch (err) {
        console.error('Failed to fetch user highlights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, [isOpen, currentUser?.id]);

  const handleCreateNewHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || submitting || !currentUser?.id) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newTitle.trim(),
          coverUrl: story.mediaUrl,
          items: [
            {
              storyId: story.id,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType,
              caption: story.caption,
              filter: story.filter,
            },
          ],
        }),
      });

      if (res.ok) {
        const newHl = await res.json();
        setHighlights((prev) => [newHl, ...prev]);
        if (onSuccess) onSuccess(newHl.title);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create highlight:', err);
    } finally {
      setSubmitting(false);
      setIsCreatingNew(false);
      setNewTitle('');
    }
  };

  const handleAddToExisting = async (highlight: HighlightItem) => {
    setSubmitting(true);
    setSelectedHighlightId(highlight.id);

    try {
      const res = await fetch(`/api/highlights/${highlight.id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          mediaUrl: story.mediaUrl,
          mediaType: story.mediaType,
          caption: story.caption,
          filter: story.filter,
        }),
      });

      if (res.ok) {
        if (onSuccess) onSuccess(highlight.title);
        setTimeout(() => {
          onClose();
        }, 400);
      }
    } catch (err) {
      console.error('Failed to add story to highlight:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-neutral-900 border border-white/15 rounded-3xl p-5 text-white shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm tracking-tight">Add to Story Highlights</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thumbnail Preview */}
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-2.5 mb-4 border border-white/5">
          <img
            src={story.mediaUrl}
            alt="Story thumbnail"
            referrerPolicy="no-referrer"
            className="w-12 h-14 object-cover rounded-xl border border-white/10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {story.caption || 'Active Story'}
            </p>
            <p className="text-[11px] text-white/60">{story.timestamp || 'Just now'}</p>
          </div>
        </div>

        {/* Highlights List or Create Form */}
        <AnimatePresence mode="wait">
          {isCreatingNew ? (
            <motion.form
              key="create-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCreateNewHighlight}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Highlight Title
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Travel, Vibes, Memories"
                  maxLength={30}
                  className="w-full bg-neutral-800 border border-white/20 focus:border-white/80 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || submitting}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{submitting ? 'Creating...' : 'Create & Add'}</span>
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                {/* New Highlight Button */}
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/25 transition-all text-center group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Plus size={20} className="text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-white/90 truncate w-full">New</span>
                </button>

                {/* Existing Highlights */}
                {highlights.map((hl) => (
                  <button
                    key={hl.id}
                    type="button"
                    onClick={() => handleAddToExisting(hl)}
                    disabled={submitting}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center group cursor-pointer relative"
                  >
                    <div className="relative w-13 h-13 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-amber-400 transition-colors">
                      <img
                        src={hl.coverUrl}
                        alt={hl.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {selectedHighlightId === hl.id && (
                        <div className="absolute inset-0 bg-emerald-600/80 flex items-center justify-center animate-fade-in">
                          <Check size={18} className="text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-white/90 truncate w-full">
                      {hl.title}
                    </span>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="py-4 text-center text-xs text-white/50">Loading highlights...</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
