import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  AtSign,
  Trash2,
  Check,
  Send,
  CornerDownRight,
  Eye,
  EyeOff,
  MoreHorizontal,
  Sparkles,
  Tag,
  Film,
  Smile,
  Volume2,
} from 'lucide-react';
import { AppNotification, User } from '../../types';
import { useApp } from '../../context/AppContext';

interface NotificationItemProps {
  notification: AppNotification;
  onSelectUser: (user: User) => void;
  onOpenPost: (postId: string) => void;
  onToggleRead: (id: string, isRead: boolean) => void;
  onDelete: (id: string) => void;
  onConfirmRequest?: (reqId: string, user: User) => void;
  onDeleteRequest?: (reqId: string) => void;
  onReplyComment?: (notifId: string, postId: string, text: string) => Promise<void>;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onSelectUser,
  onOpenPost,
  onToggleRead,
  onDelete,
  onConfirmRequest,
  onDeleteRequest,
  onReplyComment,
}) => {
  const { toggleFollowUser, availableProfiles, currentUser } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [hasLikedBack, setHasLikedBack] = useState(notification.isLikedBack || false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Sync isFollowing from profile state
  const targetUser = notification.user;
  const profile = availableProfiles.find((p) => p.id === targetUser?.id);
  const isFollowing = profile?.isFollowing ?? targetUser?.isFollowing ?? false;

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onToggleRead(notification.id, true);
    }
    if (targetUser) {
      const fullProfile = availableProfiles.find((p) => p.id === targetUser.id) || targetUser;
      onSelectUser(fullProfile);
    }
  };

  const handleRowClick = () => {
    if (!notification.isRead) {
      onToggleRead(notification.id, true);
    }
    if (notification.targetPostId) {
      onOpenPost(notification.targetPostId);
    } else if (notification.type === 'follow' || notification.type === 'follow_request') {
      if (targetUser) {
        const fullProfile = availableProfiles.find((p) => p.id === targetUser.id) || targetUser;
        onSelectUser(fullProfile);
      }
    }
  };

  const handleLikeBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasLikedBack((prev) => !prev);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    if (!notification.isRead) {
      onToggleRead(notification.id, true);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replyText.trim() || !onReplyComment) return;

    setIsSendingReply(true);
    try {
      await onReplyComment(notification.id, notification.targetPostId || 'post_default', replyText.trim());
      setReplyText('');
      setIsReplying(false);
    } catch (err) {
      console.error('Error replying to comment notification:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const getBadgeIcon = () => {
    switch (notification.type) {
      case 'follow':
        return {
          icon: <UserPlus size={11} strokeWidth={2.5} />,
          bg: 'bg-blue-500 text-white',
        };
      case 'follow_request':
        return {
          icon: <UserCheck size={11} strokeWidth={2.5} />,
          bg: 'bg-indigo-500 text-white',
        };
      case 'like':
        return {
          icon: <Heart size={11} className="fill-white" />,
          bg: 'bg-rose-500 text-white',
        };
      case 'story_like':
        return {
          icon: <Heart size={11} className="fill-white" />,
          bg: 'bg-gradient-to-tr from-orange-500 via-rose-500 to-purple-600 text-white',
        };
      case 'comment':
        return {
          icon: <MessageCircle size={11} strokeWidth={2.5} />,
          bg: 'bg-emerald-500 text-white',
        };
      case 'mention':
        return {
          icon: <AtSign size={11} strokeWidth={2.5} />,
          bg: 'bg-purple-500 text-white',
        };
      case 'tag':
        return {
          icon: <Tag size={11} strokeWidth={2.5} />,
          bg: 'bg-amber-500 text-white',
        };
      default:
        return {
          icon: <Sparkles size={11} strokeWidth={2.5} />,
          bg: 'bg-blue-500 text-white',
        };
    }
  };

  const badge = getBadgeIcon();

  // Overlapping avatar group check
  const actors = notification.actors && notification.actors.length > 0 ? notification.actors : [targetUser];
  const hasMultipleActors = actors.length > 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      onClick={handleRowClick}
      className={`group relative flex flex-col p-3 sm:p-3.5 transition-all duration-200 cursor-pointer rounded-2xl border ${
        !notification.isRead
          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/80 dark:border-blue-900/40 shadow-soft-xs'
          : 'bg-white dark:bg-neutral-900/80 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-neutral-200/60 dark:hover:border-neutral-800'
      }`}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Left Side: Avatar Stack + Content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar Area */}
          <div
            className="relative flex-shrink-0"
            onMouseEnter={() => setShowAvatarPreview(true)}
            onMouseLeave={() => setShowAvatarPreview(false)}
          >
            {hasMultipleActors ? (
              <div className="relative w-12 h-12 flex items-center justify-center">
                {actors.slice(0, 2).map((actor, idx) => (
                  <img
                    key={actor?.id || idx}
                    src={actor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                    alt={actor?.username || 'user'}
                    referrerPolicy="no-referrer"
                    onClick={handleAvatarClick}
                    className={`w-8 h-8 rounded-full object-cover border-2 border-white dark:border-neutral-900 shadow-sm absolute ${
                      idx === 0 ? '-top-0.5 -left-0.5 z-10' : '-bottom-0.5 -right-0.5 z-0'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="relative" onClick={handleAvatarClick}>
                <img
                  src={targetUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={targetUser?.username || 'user'}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700/80 group-hover:scale-105 transition-transform"
                />
                {/* Type Badge */}
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-neutral-900 ${badge.bg}`}
                >
                  {badge.icon}
                </div>
              </div>
            )}

            {/* Quick Avatar Hover Profile Preview Card */}
            <AnimatePresence>
              {showAvatarPreview && targetUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 6 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-14 z-50 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/90 dark:border-neutral-800 p-3.5 space-y-2.5 pointer-events-auto"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {targetUser.username}
                        </span>
                        {targetUser.isVerified && (
                          <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate">{targetUser.name}</p>
                    </div>
                  </div>

                  {targetUser.bio && (
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                      {targetUser.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAvatarPreview(false);
                        const fullProfile = availableProfiles.find((p) => p.id === targetUser.id) || targetUser;
                        onSelectUser(fullProfile);
                      }}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      View Profile
                    </button>
                    {currentUser && targetUser.id !== currentUser.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollowUser(targetUser.id);
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          isFollowing
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Information */}
          <div className="min-w-0 flex-1 text-xs sm:text-sm">
            <p className="text-neutral-800 dark:text-neutral-200 leading-snug">
              {hasMultipleActors ? (
                <>
                  <span
                    onClick={handleAvatarClick}
                    className="font-bold text-neutral-900 dark:text-white mr-1 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    {actors[0]?.username}
                  </span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    and {actors.length - 1} other{actors.length > 2 ? 's' : ''}{' '}
                  </span>
                </>
              ) : (
                <span
                  onClick={handleAvatarClick}
                  className="font-bold text-neutral-900 dark:text-white mr-1 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {targetUser?.username}
                  {targetUser?.isVerified && (
                    <span className="w-3.5 h-3.5 bg-blue-500 rounded-full inline-flex items-center justify-center text-[8px] text-white">
                      ✓
                    </span>
                  )}
                </span>
              )}
              <span className="text-neutral-600 dark:text-neutral-300 font-normal">
                {notification.text}
              </span>
            </p>

            {/* Comment snippet if present */}
            {notification.commentText && (
              <div className="mt-1 p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 border-l-2 border-emerald-500">
                "{notification.commentText}"
              </div>
            )}

            {/* Replied text badge */}
            {notification.repliedText && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                <CornerDownRight size={12} />
                <span>You replied: "{notification.repliedText}"</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-neutral-400">
                {notification.timestamp}
              </span>
              {!notification.isRead && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/60 px-1.5 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Buttons & Target Thumbnails */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* 1. Follow / Follow Back Button */}
          {notification.type === 'follow' ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                if (targetUser?.id) {
                  toggleFollowUser(targetUser.id);
                  if (!notification.isRead) onToggleRead(notification.id, true);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-soft-xs ${
                isFollowing
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow Back'}
            </motion.button>
          ) : notification.type === 'follow_request' ? (
            /* 2. Follow Request Actions */
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (!notification.isRead) onToggleRead(notification.id, true);
                  if (onConfirmRequest && targetUser) {
                    onConfirmRequest(notification.id, targetUser);
                  }
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-soft-xs cursor-pointer"
              >
                Confirm
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (!notification.isRead) onToggleRead(notification.id, true);
                  if (onDeleteRequest) onDeleteRequest(notification.id);
                }}
                className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Delete
              </motion.button>
            </div>
          ) : notification.type === 'comment' ? (
            /* 3. Comment Quick Reply & Thumbnail */
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (!notification.isRead) onToggleRead(notification.id, true);
                  setIsReplying((prev) => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isReplying
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <CornerDownRight size={12} />
                Reply
              </motion.button>
              {notification.targetMediaUrl && (
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  className="relative group/thumb cursor-pointer overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-soft-xs"
                  onClick={() => {
                    if (!notification.isRead) onToggleRead(notification.id, true);
                    if (notification.targetPostId) onOpenPost(notification.targetPostId);
                  }}
                >
                  <img
                    src={notification.targetMediaUrl}
                    alt="Post thumbnail"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover"
                  />
                </motion.div>
              )}
            </div>
          ) : (notification.type === 'like' || notification.type === 'story_like') ? (
            /* 4. Like / Story Like Action Button & Thumbnail */
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleLikeBack}
                title={hasLikedBack ? 'Liked' : 'Like back'}
                className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                  hasLikedBack
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-rose-500'
                }`}
              >
                <Heart
                  size={15}
                  className={`transition-all ${hasLikedBack ? 'fill-rose-500 scale-110' : ''}`}
                />
                <AnimatePresence>
                  {showHeartBurst && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none text-rose-500"
                    >
                      <Heart size={20} className="fill-rose-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {notification.targetMediaUrl && (
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  className="relative group/thumb cursor-pointer overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-soft-xs"
                  onClick={() => {
                    if (notification.targetPostId) onOpenPost(notification.targetPostId);
                  }}
                >
                  <img
                    src={notification.targetMediaUrl}
                    alt="Post thumbnail"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover"
                  />
                  {notification.type === 'story_like' && (
                    <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-pink-500 ring-1 ring-white" />
                  )}
                </motion.div>
              )}
            </div>
          ) : notification.targetMediaUrl ? (
            /* 5. Generic Target Thumbnail (Mentions, Tags, etc) */
            <motion.div
              whileHover={{ scale: 1.06 }}
              className="relative group/thumb cursor-pointer overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-soft-xs"
              onClick={() => {
                if (notification.targetPostId) onOpenPost(notification.targetPostId);
              }}
            >
              <img
                src={notification.targetMediaUrl}
                alt="Post thumbnail"
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-cover"
              />
            </motion.div>
          ) : null}

          {/* Quick Context Menu Options */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              title="More options"
              className={`p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer ${
                isHovered || showMenu ? 'opacity-100' : 'opacity-0 sm:opacity-0'
              }`}
            >
              <MoreHorizontal size={15} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 4 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 z-40 w-44 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 divide-y divide-neutral-100 dark:divide-neutral-800 text-xs"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onToggleRead(notification.id, !notification.isRead);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                    >
                      {notification.isRead ? (
                        <>
                          <EyeOff size={13} className="text-blue-500" /> Mark as unread
                        </>
                      ) : (
                        <>
                          <Eye size={13} className="text-blue-500" /> Mark as read
                        </>
                      )}
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onDelete(notification.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-medium cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete notification
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Inline Quick Reply Drawer for Comment Notifications */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="overflow-hidden pt-1"
          >
            <form
              onSubmit={handleSendReply}
              className="flex items-center gap-2 bg-neutral-100/90 dark:bg-neutral-800/90 p-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${targetUser?.username || 'user'}...`}
                autoFocus
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="submit"
                disabled={!replyText.trim() || isSendingReply}
                className={`p-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  replyText.trim() && !isSendingReply
                    ? 'bg-blue-600 text-white shadow-soft-xs hover:bg-blue-700'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isSendingReply ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <Send size={13} />
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="text-[11px] font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-1"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
