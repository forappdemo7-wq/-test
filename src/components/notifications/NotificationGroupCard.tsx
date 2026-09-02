import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { AppNotification, User } from '../../types';
import { useApp } from '../../context/AppContext';

interface NotificationGroupCardProps {
  notification: AppNotification;
  onSelectUser: (user: User) => void;
  onOpenPost: (postId: string) => void;
  onToggleRead: (id: string, isRead: boolean) => void;
  onDelete: (id: string) => void;
}

export const NotificationGroupCard: React.FC<NotificationGroupCardProps> = ({
  notification,
  onSelectUser,
  onOpenPost,
  onToggleRead,
  onDelete,
}) => {
  const { toggleFollowUser, availableProfiles, currentUser } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const actors = notification.actors && notification.actors.length > 0
    ? notification.actors
    : [notification.user];

  const primaryActor = actors[0] || notification.user;
  const remainingCount = Math.max(0, (notification.totalActorsCount || actors.length) - 1);

  const handleCardClick = () => {
    if (!notification.isRead) {
      onToggleRead(notification.id, true);
    }
    if (notification.targetPostId) {
      onOpenPost(notification.targetPostId);
    }
  };

  const getGroupIcon = () => {
    switch (notification.type) {
      case 'like':
      case 'story_like':
        return <Heart size={12} className="fill-white text-white" />;
      case 'comment':
        return <MessageCircle size={12} strokeWidth={2.5} className="text-white" />;
      case 'follow':
        return <UserPlus size={12} strokeWidth={2.5} className="text-white" />;
      default:
        return <Sparkles size={12} className="text-white" />;
    }
  };

  const getGroupColor = () => {
    switch (notification.type) {
      case 'like':
        return 'bg-rose-500';
      case 'story_like':
        return 'bg-gradient-to-tr from-orange-500 to-pink-600';
      case 'comment':
        return 'bg-emerald-500';
      case 'follow':
        return 'bg-blue-600';
      default:
        return 'bg-purple-600';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        !notification.isRead
          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 shadow-soft-xs'
          : 'bg-white dark:bg-neutral-900/80 border-neutral-100 dark:border-neutral-800/80 hover:border-neutral-200 dark:hover:border-neutral-700'
      }`}
    >
      {/* Top Header / Primary Row */}
      <div
        onClick={handleCardClick}
        className="flex items-center justify-between p-3.5 sm:px-4 cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Overlapping Stacked Avatars with Group Badge */}
          <div className="relative flex-shrink-0">
            <div className="flex -space-x-4 items-center">
              {actors.slice(0, 3).map((actor, idx) => (
                <img
                  key={actor?.id || idx}
                  src={actor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={actor?.username || 'actor'}
                  referrerPolicy="no-referrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (actor) onSelectUser(actor);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-neutral-900 shadow-sm transition-transform hover:scale-110 hover:z-20 cursor-pointer ${
                    idx === 0 ? 'z-30' : idx === 1 ? 'z-20' : 'z-10'
                  }`}
                />
              ))}
            </div>

            {/* Floating Action Badge */}
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-900 ${getGroupColor()}`}
            >
              {getGroupIcon()}
            </div>
          </div>

          {/* Group Text Description */}
          <div className="min-w-0 flex-1 text-xs sm:text-sm">
            <p className="text-neutral-800 dark:text-neutral-200 leading-snug">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (primaryActor) onSelectUser(primaryActor);
                }}
                className="font-bold text-neutral-900 dark:text-white mr-1 hover:underline cursor-pointer"
              >
                {primaryActor?.username}
              </span>
              {remainingCount > 0 && (
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  and {remainingCount} other{remainingCount > 1 ? 's' : ''}{' '}
                </span>
              )}
              <span className="text-neutral-600 dark:text-neutral-300 font-normal">
                {notification.text}
              </span>
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-neutral-400">
                {notification.timestamp}
              </span>
              {!notification.isRead && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Thumbnail & Accordion Expand Button */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {notification.targetMediaUrl && (
            <motion.div
              whileHover={{ scale: 1.06 }}
              className="relative cursor-pointer overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-soft-xs"
              onClick={() => {
                if (notification.targetPostId) onOpenPost(notification.targetPostId);
              }}
            >
              <img
                src={notification.targetMediaUrl}
                alt="Target Media"
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-cover"
              />
            </motion.div>
          )}

          {/* Expand / Collapse actors list */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? 'Collapse' : 'View all people'}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Actors Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-hidden"
          >
            <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span>Interactions ({actors.length})</span>
              <button
                onClick={() => onToggleRead(notification.id, !notification.isRead)}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold normal-case"
              >
                {notification.isRead ? <EyeOff size={12} /> : <Eye size={12} />}
                {notification.isRead ? 'Mark unread' : 'Mark read'}
              </button>
            </div>

            {actors.map((actor) => {
              const actorProfile = availableProfiles.find((p) => p.id === actor?.id);
              const isFollowed = actorProfile?.isFollowing ?? actor?.isFollowing ?? false;
              const isMe = currentUser ? actor?.id === currentUser.id : false;

              return (
                <div
                  key={actor?.id || Math.random()}
                  className="flex items-center justify-between p-3 px-4 hover:bg-white/80 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <div
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (actor) {
                        const full = availableProfiles.find((p) => p.id === actor.id) || actor;
                        onSelectUser(full);
                      }
                    }}
                  >
                    <img
                      src={actor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={actor?.username || 'user'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {actor?.username}
                        </span>
                        {actor?.isVerified && (
                          <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate">{actor?.name}</p>
                    </div>
                  </div>

                  {!isMe && actor?.id && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleFollowUser(actor.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isFollowed
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-soft-xs'
                      }`}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </motion.button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
