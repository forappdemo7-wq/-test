import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Send, Sparkles, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Reel } from '../../types';

interface CommentItem {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  likesCount: number;
  isLiked: boolean;
}

interface ReelsCommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel;
  onCommentAdded?: () => void;
}

const QUICK_EMOJIS = ['🔥', '❤️', '👏', '😍', '✨', '😂', '💯', '🙌'];

export const ReelsCommentsDrawer: React.FC<ReelsCommentsDrawerProps> = ({
  isOpen,
  onClose,
  reel,
  onCommentAdded,
}) => {
  const { currentUser, setSelectedUserProfile } = useApp();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !reel?.id) return;
    setIsLoading(true);
    fetch(`/api/reels/${reel.id}/comments?currentUserId=${currentUser?.id || 'none'}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setComments(data);
        }
      })
      .catch((err) => console.error('Failed to load reel comments:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, reel?.id, currentUser?.id]);

  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || !reel?.id || !currentUser) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSubmitting(true);

    // Optimistic comment
    const tempId = `temp_${Date.now()}`;
    const optimisticComment: CommentItem = {
      id: tempId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      text: textToSend,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
    };

    setComments((prev) => [optimisticComment, ...prev]);

    try {
      const res = await fetch(`/api/reels/${reel.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          text: textToSend,
        }),
      });

      if (res.ok) {
        const savedComment = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? savedComment : c))
        );
        if (onCommentAdded) onCommentAdded();
      }
    } catch (err) {
      console.error('Failed to post reel comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLikeComment = async (commentId: string) => {
    if (!currentUser) return;
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !c.isLiked;
          return {
            ...c,
            isLiked: nextLiked,
            likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          };
        }
        return c;
      })
    );

    try {
      await fetch(`/api/reels/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to like reel comment:', err);
    }
  };

  const appendEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[640px] h-[75vh] bg-white dark:bg-neutral-900 rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-neutral-200/80 dark:border-neutral-800 z-10"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-rose-500" />
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  Comments <span className="text-neutral-400 font-normal text-xs">({comments.length})</span>
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {isLoading ? (
                <div className="space-y-4 py-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="w-24 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        <div className="w-48 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-neutral-400 dark:text-neutral-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Sparkles size={22} className="text-neutral-400" />
                  </div>
                  <p className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">No comments yet</p>
                  <p className="text-xs text-neutral-500 max-w-xs">Be the first to share your thoughts on this reel!</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isCreator = comment.userId === reel.userId;
                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <img
                          src={comment.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                          alt={comment.username}
                          referrerPolicy="no-referrer"
                          onClick={() => {
                            onClose();
                            setSelectedUserProfile({
                              id: comment.userId,
                              username: comment.username,
                              name: comment.username,
                              avatar: comment.userAvatar,
                              bio: '',
                              postsCount: 0,
                              followersCount: 0,
                              followingCount: 0,
                              isFollowing: false,
                              isVerified: false,
                            });
                          }}
                          className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => {
                                onClose();
                                setSelectedUserProfile({
                                  id: comment.userId,
                                  username: comment.username,
                                  name: comment.username,
                                  avatar: comment.userAvatar,
                                  bio: '',
                                  postsCount: 0,
                                  followersCount: 0,
                                  followingCount: 0,
                                  isFollowing: false,
                                  isVerified: false,
                                });
                              }}
                              className="font-bold text-xs text-neutral-900 dark:text-white cursor-pointer hover:underline"
                            >
                              {comment.username}
                            </span>
                            {isCreator && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                Creator
                              </span>
                            )}
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 break-words mt-0.5 leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      </div>

                      {/* Comment Like Button */}
                      <button
                        onClick={() => handleToggleLikeComment(comment.id)}
                        className="flex flex-col items-center gap-0.5 pt-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer shrink-0"
                      >
                        <Heart
                          size={15}
                          className={comment.isLiked ? 'fill-rose-500 text-rose-500' : ''}
                        />
                        {comment.likesCount > 0 && (
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                            {comment.likesCount}
                          </span>
                        )}
                      </button>
                    </motion.div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Quick Emoji Bar */}
            <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar bg-neutral-50/60 dark:bg-neutral-900/60">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => appendEmoji(emoji)}
                  className="p-1 text-base hover:scale-125 transition-transform active:scale-95 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendComment}
              className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={currentUser?.username || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={currentUser ? `Add a comment for @${reel.author?.username || 'creator'}...` : 'Log in to comment...'}
                disabled={!currentUser}
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-full px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting || !currentUser}
                className="p-2 rounded-full bg-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-600 transition-colors shrink-0 cursor-pointer shadow-soft-xs"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
