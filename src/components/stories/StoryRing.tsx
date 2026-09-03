import React, { memo } from 'react';
import { motion } from 'motion/react';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

interface StoryRingProps {
  avatar: string;
  username: string;
  hasUnseen?: boolean;
  isSelf?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  segmentsCount?: number;
  isCloseFriend?: boolean;
  isLive?: boolean;
  onClick?: () => void;
  className?: string;
}

const StoryRingComponent: React.FC<StoryRingProps> = ({
  avatar,
  username,
  hasUnseen = true,
  isSelf = false,
  size = 'md',
  segmentsCount = 1,
  isCloseFriend = false,
  isLive = false,
  onClick,
  className = '',
}) => {
  const sizeConfig = {
    xs: { outer: 'w-8 h-8', avatarPx: 32 },
    sm: { outer: 'w-11 h-11', avatarPx: 44 },
    md: { outer: 'w-16 h-16 sm:w-18 sm:h-18', avatarPx: 72 },
    lg: { outer: 'w-20 h-20 sm:w-24 sm:h-24', avatarPx: 96 },
    xl: { outer: 'w-24 h-24 sm:w-28 sm:h-28', avatarPx: 112 },
  };

  const config = sizeConfig[size];
  const optimizedAvatar = getOptimizedImageUrl(avatar, {
    width: config.avatarPx * 2,
    quality: 80,
  });

  const getGradientClasses = () => {
    if (isLive) {
      return 'from-rose-500 via-red-600 to-pink-600 animate-pulse';
    }
    if (isCloseFriend) {
      if (hasUnseen) {
        return 'from-emerald-400 via-green-500 to-emerald-500 shadow-sm';
      }
      return 'from-emerald-500/40 to-green-500/40 dark:from-emerald-700/40 dark:to-green-800/40';
    }
    if (hasUnseen) {
      return 'from-amber-400 via-rose-500 to-fuchsia-600';
    }
    return 'from-neutral-300 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      onClick={onClick}
      role="button"
      aria-label={`${username ? `${username}'s` : 'User'} story ring${hasUnseen ? ' (unseen)' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative rounded-full cursor-pointer select-none flex-shrink-0 flex items-center justify-center p-[2.5px] bg-gradient-to-tr ${getGradientClasses()} ${config.outer} ${className}`}
    >
      {/* White/Dark background gap ring between gradient and avatar */}
      <div className="w-full h-full bg-white dark:bg-neutral-950 rounded-full p-[2px] flex items-center justify-center overflow-hidden transition-colors">
        <img
          src={optimizedAvatar}
          alt={username || 'User story avatar'}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="w-full h-full rounded-full object-cover select-none transform transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Live Badge if broadcaster */}
      {isLive && (
        <span className="absolute -bottom-1 px-1.5 py-0.5 bg-gradient-to-r from-rose-600 to-red-600 text-[9px] font-extrabold uppercase tracking-wider text-white rounded-md ring-2 ring-white dark:ring-neutral-950 shadow-md">
          LIVE
        </span>
      )}
    </motion.div>
  );
};

export const StoryRing = memo(StoryRingComponent);
