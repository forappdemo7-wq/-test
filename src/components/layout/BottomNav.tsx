import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Home, Search, PlusSquare, Clapperboard } from 'lucide-react';
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
      icon: (
        <Home
          size={24}
          className={activeTab === 'feed' ? 'fill-current stroke-none' : 'stroke-[1.75px]'}
        />
      ),
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: (
        <Search
          size={24}
          className={activeTab === 'explore' ? 'stroke-[2.75px]' : 'stroke-[1.75px]'}
        />
      ),
    },
    {
      id: 'create',
      label: 'Create',
      isCustomAction: true,
      icon: (
        <PlusSquare
          size={24}
          className="stroke-[1.75px] active:scale-95 transition-transform"
        />
      ),
    },
    {
      id: 'reels',
      label: 'Reels',
      icon: (
        <Clapperboard
          size={24}
          className={activeTab === 'reels' ? 'fill-current stroke-none' : 'stroke-[1.75px]'}
        />
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <div
          className={`p-[1px] rounded-full transition-all ${
            activeTab === 'profile'
              ? 'ring-2 ring-black dark:ring-white scale-105'
              : 'ring-1 ring-neutral-300 dark:ring-neutral-700'
          }`}
        >
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser?.name || currentUser?.username || 'Profile'}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className="w-6 h-6 rounded-full object-cover"
          />
        </div>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 px-4 py-2 sm:hidden transition-colors select-none"
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
              className={`relative flex items-center justify-center p-2 transition-transform duration-150 cursor-pointer active:scale-90 ${
                isActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-900 dark:text-neutral-100 hover:opacity-75'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
