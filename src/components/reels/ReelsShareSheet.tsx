import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  Bookmark,
  Send,
  Sparkles,
  Link,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Reel } from '../../types';

interface ReelsShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel;
}

export const ReelsShareSheet: React.FC<ReelsShareSheetProps> = ({
  isOpen,
  onClose,
  reel,
}) => {
  const {
    availableProfiles,
    currentUser,
    sendMessage,
    threads,
    toggleSaveReel,
    addNewStory,
    celebrateAction,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [sentUserIds, setSentUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !reel) return null;

  const reelUrl = `${window.location.origin}/?tab=reels&reelId=${reel.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reel by @${reel.author?.username || 'creator'}`,
          text: reel.caption || 'Check out this reel on InstaVibe!',
          url: reelUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendToUser = async (targetUser: any) => {
    if (sentUserIds.includes(targetUser.id)) return;
    setSentUserIds((prev) => [...prev, targetUser.id]);

    // Find or create thread
    let existingThread = threads.find(
      (t) => t.participant?.id === targetUser.id
    );
    const threadId =
      existingThread?.id ||
      [currentUser.id, targetUser.id].sort().join('_chat_');

    await sendMessage(
      threadId,
      `Check out this reel by @${reel.author?.username}: ${reel.caption || ''}`,
      reel.posterUrl || reel.videoUrl
    );
    celebrateAction();
  };

  const handleAddToStory = () => {
    addNewStory({
      mediaUrl: reel.posterUrl || reel.videoUrl,
      caption: `Reel by @${reel.author?.username}`,
    });
    onClose();
  };

  const filteredUsers = availableProfiles.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

        {/* Sheet Content */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-neutral-200/80 dark:border-neutral-800 z-10"
        >
          {/* Grab Bar */}
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Share2 size={18} className="text-rose-500" /> Share Reel
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Send to Contacts Section */}
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">
              Send in Direct Message
            </p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {filteredUsers.slice(0, 8).map((user) => {
                const isSent = sentUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSendToUser(user)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={
                          user.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                        }
                        alt={user.username}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-800 group-hover:scale-105 transition-transform"
                      />
                      {isSent && (
                        <div className="absolute inset-0 bg-emerald-500/80 rounded-full flex items-center justify-center text-white">
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium max-w-[56px] truncate">
                      {user.username}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isSent
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-500 text-white group-hover:bg-rose-600'
                      }`}
                    >
                      {isSent ? 'Sent' : 'Send'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Grid */}
          <div className="p-4 grid grid-cols-4 gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 transition-colors shadow-soft-xs cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                {copied ? <Check size={20} className="text-emerald-500" /> : <Link size={20} />}
              </div>
              <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </button>

            {/* Native Share */}
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 transition-colors shadow-soft-xs cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Share2 size={20} />
              </div>
              <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                Share via...
              </span>
            </button>

            {/* Add to Story */}
            <button
              onClick={handleAddToStory}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 transition-colors shadow-soft-xs cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Sparkles size={20} />
              </div>
              <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                Add to Story
              </span>
            </button>

            {/* Save Reel */}
            <button
              onClick={() => toggleSaveReel(reel.id)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 transition-colors shadow-soft-xs cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Bookmark
                  size={20}
                  className={reel.isSaved ? 'fill-amber-500 text-amber-500' : ''}
                />
              </div>
              <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                {reel.isSaved ? 'Saved' : 'Save Reel'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
