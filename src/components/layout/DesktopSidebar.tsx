import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Search,
  Compass,
  PlusSquare,
  Clapperboard,
  Heart,
  Send,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';
import { SettingsDrawer } from '../profile/SettingsDrawer';
import { prefetchRoute } from '../../lib/prefetch';
import { InstagramCameraIcon, InstagramWordmark } from '../common/InstagramIcons';

const routeLoaders: Record<string, () => Promise<any>> = {
  feed: () => import('../feed/FeedList'),
  explore: () => import('../explore/ExploreGrid'),
  reels: () => import('../reels/ReelsViewer'),
  messages: () => import('../messages/DirectMessagesView'),
  notifications: () => import('../notifications/NotificationsView'),
  profile: () => import('../profile/ProfileView'),
  create: () => import('../create/CreateModal'),
};

export const DesktopSidebar: React.FC = memo(() => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    unreadNotificationsCount,
    unreadMessagesCount,
    setIsCreateOpen,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handlePrefetch = (tabId: string) => {
    if (routeLoaders[tabId]) {
      prefetchRoute(tabId, routeLoaders[tabId]);
    }
  };

  const links: {
    id: TabType | 'search';
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
    action?: () => void;
  }[] = [
    { id: 'feed', label: 'Home', icon: Home },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      action: () => {
        setActiveTab('explore');
      },
    },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'reels', label: 'Reels', icon: Clapperboard },
    {
      id: 'messages',
      label: 'Messages',
      icon: Send,
      badge: unreadMessagesCount,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Heart,
      badge: unreadNotificationsCount,
    },
    {
      id: 'create',
      label: 'Create',
      icon: PlusSquare,
      action: () => setIsCreateOpen(true),
    },
  ];

  return (
    <>
      <aside
        aria-label="Main Navigation Sidebar"
        className="hidden sm:flex flex-col justify-between w-20 xl:w-64 h-screen sticky top-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-3 xl:p-4 transition-colors z-20 select-none"
      >
        <div>
          {/* Logo */}
          <div className="pt-5 pb-8 px-2">
            <button
              onClick={() => setActiveTab('feed')}
              onMouseEnter={() => handlePrefetch('feed')}
              aria-label="100gram Home"
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="xl:hidden flex items-center justify-center p-1">
                <InstagramCameraIcon size={28} variant="gradient" className="group-hover:scale-105 transition-transform" />
              </div>
              <div className="hidden xl:block">
                <InstagramWordmark text="100gram" size="lg" className="text-neutral-950 dark:text-white group-hover:opacity-85 transition-opacity" />
              </div>
            </button>
          </div>

          {/* Navigation items */}
          <nav className="space-y-1 relative" aria-label="Desktop primary links">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.action) {
                      link.action();
                    } else if (link.id !== 'search') {
                      setActiveTab(link.id as TabType);
                    }
                  }}
                  onMouseEnter={() => link.id !== 'search' && handlePrefetch(link.id as string)}
                  onTouchStart={() => link.id !== 'search' && handlePrefetch(link.id as string)}
                  aria-label={link.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative w-full flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-98 ${
                    isActive
                      ? 'font-bold text-neutral-950 dark:text-white'
                      : 'font-normal text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      size={24}
                      className={`transition-transform duration-150 group-hover:scale-105 ${
                        isActive && (link.id === 'feed' || link.id === 'reels')
                          ? 'fill-current stroke-none'
                          : isActive
                          ? 'stroke-[2.75px]'
                          : 'stroke-[1.85px]'
                      }`}
                    />
                    {link.badge !== undefined && link.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-black"
                      >
                        {link.badge}
                      </motion.span>
                    )}
                  </div>
                  <span className="hidden xl:inline-block text-[15px] tracking-tight">{link.label}</span>
                </button>
              );
            })}

            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              onMouseEnter={() => handlePrefetch('profile')}
              onTouchStart={() => handlePrefetch('profile')}
              aria-label="My Profile"
              aria-current={activeTab === 'profile' ? 'page' : undefined}
              className={`relative w-full flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-98 ${
                activeTab === 'profile'
                  ? 'font-bold text-neutral-950 dark:text-white'
                  : 'font-normal text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <div
                className={`p-[1px] rounded-full transition-all duration-150 ${
                  activeTab === 'profile'
                    ? 'ring-2 ring-neutral-950 dark:ring-white scale-105'
                    : 'ring-1 ring-neutral-300 dark:ring-neutral-700 group-hover:ring-neutral-400'
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
              <span className="hidden xl:inline-block text-[15px] tracking-tight">Profile</span>
            </button>
          </nav>
        </div>

        {/* Bottom "More" / Settings Action */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setIsSettingsOpen(true)}
            aria-label="More options & settings"
            className="w-full flex items-center gap-4 px-3.5 py-3 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white transition-all duration-150 cursor-pointer group active:scale-98"
          >
            <Menu size={24} className="group-hover:scale-105 transition-transform stroke-[1.85px]" />
            <span className="hidden xl:inline-block text-[15px] font-normal tracking-tight">More</span>
          </button>
        </div>
      </aside>

      {/* Settings & Activity Sheet */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';
