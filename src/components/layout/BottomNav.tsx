import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Home, Compass, Plus, Clapperboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';
import { prefetchRoute } from '../../lib/prefetch';

const routeLoaders: Record<string, () => Promise<any>> = {
  feed: () => import('../feed/FeedList'),
  explore: () => import('../explore/ExploreGrid'),
  reels: () => import('../reels/ReelsViewer'),
  profile: () => import('../profile/ProfileView'),
  create: () => import('../create/CreateModal'),
};

export const BottomNav: React.FC = memo(() => {
  const { activeTab, setActiveTab, currentUser, setIsCreateOpen, activeThreadId } = useApp();

  // Hide bottom nav when actively chatting in direct messages on mobile
  if (activeTab === 'messages' && activeThreadId) {
    return null;
  }

  const handlePrefetch = (tabId: string) => {
    if (routeLoaders[tabId]) {
      prefetchRoute(tabId, routeLoaders[tabId]);
    }
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode; isCustomAction?: boolean }[] = [
    {
      id: 'feed',
      label: 'Home',
      icon: <Home size={24} className={activeTab === 'feed' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />,
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: <Compass size={24} className={activeTab === 'explore' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />,
    },
    {
      id: 'create',
      label: 'Create',
      isCustomAction: true,
      icon: (
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-xl border-2 border-slate-900 dark:border-white flex items-center justify-center bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white shadow-soft-xs"
        >
          <Plus size={20} className="stroke-[2.5px]" />
        </motion.div>
      ),
    },
    {
      id: 'reels',
      label: 'Reels',
      icon: <Clapperboard size={24} className={activeTab === 'reels' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className={`p-[1.5px] rounded-full transition-all ${
            activeTab === 'profile'
              ? 'ring-2 ring-neutral-900 dark:ring-white scale-105'
              : 'ring-1 ring-neutral-300 dark:ring-neutral-700'
          }`}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className="w-6 h-6 rounded-full object-cover"
          />
        </motion.div>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 glass-header border-t border-neutral-200/80 dark:border-neutral-800/80 px-4 py-2 sm:hidden transition-colors select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isCustomAction) {
                  setIsCreateOpen(true);
                } else {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onTouchStart={() => handlePrefetch(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-colors duration-150 cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {isActive && !item.isCustomAction && (
                <motion.div
                  layoutId="mobileActiveTabIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="absolute inset-0 bg-neutral-100/90 dark:bg-neutral-800/90 rounded-2xl -z-10"
                />
              )}
              {item.icon}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
