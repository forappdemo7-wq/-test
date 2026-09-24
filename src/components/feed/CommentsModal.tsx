import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Send, Sparkles, CornerDownRight, Search, ArrowUpDown, Trash2, Check, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Comment } from '../../types';

export const CommentsModal: React.FC = () => {
  const {
    activeCommentsPost,
    setActiveCommentsPost,
    addComment,
    toggleLikeComment,
    approveComment,
    deleteComment,
    currentUser,
  } = useApp();

  const [commentText, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('newest');

  const [suggestedList] = useState<string[]>([
    'Obsessed with this! 🔥',
    'Immaculate aesthetic ✨🤍',
    'Where was this taken? 📍',
    'Frame worthy shot! 📸',
  ]);

  const quickEmojis = ['❤️', '🔥', '👏', '😍', '✨', '🙌', '💯', '🥂'];

  const isPostAuthor = currentUser?.id === activeCommentsPost?.author.id;

  const filteredComments = useMemo(() => {
    if (!activeCommentsPost) return [];
    let list = [...(activeCommentsPost.comments || [])];

    // Filter out unapproved comments for non-authors
    list = list.filter((c) => {
      if (c.isApproved === false || c.isRestricted) {
        // Only visible to the post author or the comment author
        return isPostAuthor || (currentUser && c.userId === currentUser.id);
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'top') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      // Newest first
      list.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      });
    }

    return list;
  }, [activeCommentsPost, searchQuery, sortBy, isPostAuthor, currentUser]);

  if (!activeCommentsPost) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const fullText = replyingTo && !commentText.startsWith(`@${replyingTo}`)
      ? `@${replyingTo} ${commentText.trim()}`
      : commentText.trim();

    addComment(activeCommentsPost.id, fullText);
    setCommentInput('');
    setReplyingTo(null);
  };

  const handleReplyClick = (username: string) => {
    setReplyingTo(username);
    setCommentInput(`@${username} `);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      {/* Backdrop Fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={() => setActiveCommentsPost(null)}
      />

      {/* Spring Bottom Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0.95 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) {
            setActiveCommentsPost(null);
          }
        }}
        className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 rounded-t-[36px] sm:rounded-[32px] shadow-soft-xl border border-neutral-200/80 dark:border-neutral-800 h-[85vh] sm:h-[660px] flex flex-col z-10 overflow-hidden"
      >
        {/* Sleek handle bar on mobile */}
        <div className="w-12 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 sm:hidden cursor-grab active:cursor-grabbing" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-6" />
          <h3 className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">
            Comments ({activeCommentsPost.commentsCount || activeCommentsPost.comments.length})
          </h3>
          <button
            onClick={() => setActiveCommentsPost(null)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter & Search Toolbar (if > 3 comments) */}
        {activeCommentsPost.comments.length > 3 && (
          <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2 bg-neutral-50/70 dark:bg-neutral-950/40">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search comments..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 rounded-full text-xs text-neutral-900 dark:text-neutral-100 outline-none"
              />
            </div>
            <button
              onClick={() => setSortBy((prev) => (prev === 'top' ? 'newest' : 'top'))}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
            >
              <ArrowUpDown size={12} />
              {sortBy === 'top' ? 'Top' : 'Newest'}
            </button>
          </div>
        )}

        {/* Post Caption Header */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/60 flex items-start gap-3 bg-neutral-50/60 dark:bg-neutral-900/60">
          <img
            src={activeCommentsPost.author.avatar}
            alt={activeCommentsPost.author.username}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
          />
          <div className="flex-1 min-w-0 text-xs sm:text-sm">
            <p className="text-neutral-800 dark:text-neutral-200">
              <span className="font-bold text-neutral-950 dark:text-white mr-1.5">
                {activeCommentsPost.author.username}
              </span>
              {activeCommentsPost.caption}
            </p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-400 mt-1 uppercase tracking-wider">
              {activeCommentsPost.timestamp}
            </p>
          </div>
        </div>

        {/* Comments Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 dark:text-neutral-500 py-12">
              <p className="font-semibold text-base text-neutral-700 dark:text-neutral-300">
                {searchQuery ? 'No matching comments found.' : 'No comments yet.'}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Start the conversation with an engaging note!
              </p>
            </div>
          ) : (
            filteredComments.map((comment: Comment) => {
              const isCommentAuthor = currentUser?.id === comment.userId;
              const isRestrictedUnapproved = comment.isApproved === false || comment.isRestricted;

              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`flex items-start justify-between gap-3 group p-2 rounded-2xl transition-colors ${
                    isRestrictedUnapproved
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <img
                      src={comment.userAvatar}
                      alt={comment.username}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-neutral-100 dark:border-neutral-700 flex-shrink-0"
                    />
                    <div className="text-xs sm:text-sm leading-relaxed flex-1 min-w-0">
                      <p className="text-neutral-800 dark:text-neutral-200">
                        <span className="font-bold text-neutral-950 dark:text-white mr-1.5">
                          {comment.username}
                        </span>
                        {comment.text}
                      </p>

                      {/* Restricted Comment Moderation Tag */}
                      {isRestrictedUnapproved && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                            <ShieldAlert size={11} />
                            {isPostAuthor
                              ? 'Restricted account comment (Pending approval)'
                              : 'Only visible to you and the post author'}
                          </span>

                          {isPostAuthor && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => approveComment(activeCommentsPost.id, comment.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Check size={11} /> Approve
                              </button>
                              <button
                                onClick={() => deleteComment(activeCommentsPost.id, comment.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-400 mt-1 font-medium">
                        <span>{comment.timestamp}</span>
                        {comment.likesCount > 0 && (
                          <span>
                            {comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}
                          </span>
                        )}
                        <button
                          onClick={() => handleReplyClick(comment.username)}
                          className="hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer font-semibold"
                        >
                          Reply
                        </button>

                        {(isPostAuthor || isCommentAuthor) && !isRestrictedUnapproved && (
                          <button
                            onClick={() => deleteComment(activeCommentsPost.id, comment.id)}
                            className="text-neutral-400 hover:text-rose-500 cursor-pointer font-semibold"
                            title="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.75 }}
                    onClick={() => toggleLikeComment(activeCommentsPost.id, comment.id)}
                    className="p-1 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Heart
                      size={15}
                      className={comment.isLiked ? 'text-rose-500 fill-rose-500' : ''}
                    />
                  </motion.button>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Replying Banner */}
        {replyingTo && (
          <div className="px-4 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
            <span className="flex items-center gap-1.5">
              <CornerDownRight size={13} /> Replying to @{replyingTo}
            </span>
            <button
              onClick={() => {
                setReplyingTo(null);
                setCommentInput('');
              }}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* AI Quick Ideas Bar */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mr-1">
            <Sparkles size={13} />
            Ideas:
          </div>
          {suggestedList.map((sug, i) => (
            <button
              key={i}
              onClick={() => {
                addComment(activeCommentsPost.id, sug);
              }}
              className="text-xs px-3 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-purple-400 hover:text-purple-600 flex-shrink-0 transition-colors shadow-soft-xs font-medium cursor-pointer active:scale-95"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Quick Emoji Bar */}
        <div className="px-4 py-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 text-lg bg-white dark:bg-neutral-900">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setCommentInput((prev) => prev + emoji)}
              className="hover:scale-125 transition-transform cursor-pointer active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3 bg-white dark:bg-neutral-900"
        >
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser?.name || currentUser?.username || 'User'}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder={currentUser ? `Comment as ${currentUser.username}...` : 'Write a comment...'}
            className="flex-1 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 rounded-full px-4 py-2.5 outline-none focus:border-neutral-800 dark:focus:border-neutral-400 text-neutral-900 dark:text-white transition-all"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-30 rounded-full hover:opacity-90 transition-all active:scale-95 shadow-soft-xs cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
