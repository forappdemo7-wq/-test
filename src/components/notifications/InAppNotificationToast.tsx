import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { AppNotification } from '../../types';

interface InAppNotificationToastProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onClick: (notification: AppNotification) => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  notification,
  onDismiss,
  onClick,
}) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'follow':
        return <UserPlus size={14} className="text-blue-500" />;
      case 'like':
      case 'story_like':
        return <Heart size={14} className="fill-rose-500 text-rose-500" />;
      case 'comment':
        return <MessageCircle size={14} className="text-emerald-500" />;
      case 'mention':
        return <AtSign size={14} className="text-purple-500" />;
      default:
        return <Sparkles size={14} className="text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        onClick={() => onClick(notification)}
        className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar + Icon */}
          <div className="relative flex-shrink-0">
            <img
              src={notification.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={notification.user?.username || 'user'}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm">
              {getIcon()}
            </div>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              {notification.user?.username}
            </p>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
              {notification.text}
            </p>
          </div>
        </div>

        {/* Action / Dismiss */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {notification.targetMediaUrl && (
            <img
              src={notification.targetMediaUrl}
              alt="Media"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
            />
          )}

          <button
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
