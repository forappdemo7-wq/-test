import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Sparkles,
  CheckCheck,
  Bell,
  AtSign,
  Trash2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Compass,
  Film,
  Users,
  Search,
  SlidersHorizontal,
  Settings,
  Flame,
  Tag,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationFilter, User } from '../../types';
import { NotificationItem } from './NotificationItem';
import { NotificationGroupCard } from './NotificationGroupCard';
import { NotificationSettingsModal } from './NotificationSettingsModal';

interface FollowRequestItem {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  mutualCount: number;
  timeAgo: string;
}

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsRead,
    deleteNotification,
    toggleFollowUser,
    setSelectedUserProfile,
    openPostDetail,
    setActiveTab,
    availableProfiles,
    currentUser,
    celebrateAction,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

  // Pagination / Infinite Scrolling state
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [paginatedLimit, setPaginatedLimit] = useState(12);

  // Collapsed state for time sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Simulated Pending Follow Requests for Instagram parity
  const [followRequests, setFollowRequests] = useState<FollowRequestItem[]>([
    {
      id: 'req_1',
      user: {
        id: 'user_alex_creator',
        username: 'alex_creator',
        name: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        isVerified: true,
      },
      mutualCount: 14,
      timeAgo: '1d',
    },
    {
      id: 'req_2',
      user: {
        id: 'user_maya_travels',
        username: 'maya.travels',
        name: 'Maya Lin',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        isVerified: false,
      },
      mutualCount: 6,
      timeAgo: '3d',
    },
  ]);

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleConfirmRequest = (reqId: string, user: User) => {
    setFollowRequests((prev) => prev.filter((r) => r.id !== reqId));
    toggleFollowUser(user.id);
    celebrateAction();
  };

  const handleDeleteRequest = (reqId: string) => {
    setFollowRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  // Sync isFollowing state from availableProfiles for the latest accurate status
  const syncedNotifications = useMemo(() => {
    return notifications.map((notif) => {
      const profile = availableProfiles.find((p) => p.id === notif.user?.id);
      const isFollowing = profile?.isFollowing ?? notif.user?.isFollowing ?? false;
      return {
        ...notif,
        user: {
          ...notif.user,
          isFollowing,
        },
      };
    });
  }, [notifications, availableProfiles]);

  // Aggregate multiple likes/interactions on the same target media for grouped notifications
  const aggregatedNotifications = useMemo(() => {
    const postActionMap = new Map<string, AppNotification>();
    const standalone: AppNotification[] = [];

    syncedNotifications.forEach((n) => {
      // Group likes or story likes on the same post
      if (n.targetPostId && (n.type === 'like' || n.type === 'story_like')) {
        const key = `${n.type}_${n.targetPostId}`;
        if (!postActionMap.has(key)) {
          postActionMap.set(key, {
            ...n,
            actors: [n.user],
            totalActorsCount: 1,
            isGrouped: false,
          });
        } else {
          const existing = postActionMap.get(key)!;
          const currentActors = existing.actors || [existing.user];
          if (!currentActors.some((a) => a.id === n.user.id)) {
            currentActors.push(n.user);
          }
          postActionMap.set(key, {
            ...existing,
            actors: currentActors,
            totalActorsCount: currentActors.length,
            isGrouped: currentActors.length > 1,
            text: currentActors.length > 1 ? `and ${currentActors.length - 1} other${currentActors.length > 2 ? 's' : ''} liked your photo.` : existing.text,
            isRead: existing.isRead && n.isRead,
          });
        }
      } else {
        standalone.push(n);
      }
    });

    const combined = [...Array.from(postActionMap.values()), ...standalone];
    return combined.sort((a, b) => {
      // Unread first, then by timestamp
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return 0;
    });
  }, [syncedNotifications]);

  // Filter notifications based on active pill and search query
  const filteredNotifications = useMemo(() => {
    return aggregatedNotifications.filter((n) => {
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const usernameMatch = n.user?.username?.toLowerCase().includes(q);
        const nameMatch = n.user?.name?.toLowerCase().includes(q);
        const textMatch = n.text?.toLowerCase().includes(q);
        const commentMatch = n.commentText?.toLowerCase().includes(q);
        if (!usernameMatch && !nameMatch && !textMatch && !commentMatch) {
          return false;
        }
      }

      // Filter tabs check
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !n.isRead;
      if (activeFilter === 'follows') return n.type === 'follow' || n.type === 'follow_request';
      if (activeFilter === 'likes') return n.type === 'like' || n.type === 'story_like';
      if (activeFilter === 'comments') return n.type === 'comment';
      if (activeFilter === 'mentions') return n.type === 'mention';
      if (activeFilter === 'tags') return n.type === 'tag';
      return true;
    });
  }, [aggregatedNotifications, activeFilter, searchQuery]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: aggregatedNotifications.length,
      unread: aggregatedNotifications.filter((n) => !n.isRead).length,
      follows: aggregatedNotifications.filter((n) => n.type === 'follow' || n.type === 'follow_request').length,
      likes: aggregatedNotifications.filter((n) => n.type === 'like' || n.type === 'story_like').length,
      comments: aggregatedNotifications.filter((n) => n.type === 'comment').length,
      mentions: aggregatedNotifications.filter((n) => n.type === 'mention').length,
      tags: aggregatedNotifications.filter((n) => n.type === 'tag').length,
    };
  }, [aggregatedNotifications]);

  // Slice displayed notifications based on infinite scroll limit
  const displayedNotifications = useMemo(() => {
    return filteredNotifications.slice(0, paginatedLimit);
  }, [filteredNotifications, paginatedLimit]);

  // Group displayed notifications by relative time categories
  const groupedNotifications = useMemo(() => {
    const unread: AppNotification[] = [];
    const today: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    displayedNotifications.forEach((notif) => {
      if (!notif.isRead) {
        unread.push(notif);
        return;
      }

      const ts = notif.timestamp || '';
      if (ts.includes('m') || ts.includes('h') || ts.toLowerCase().includes('just now') || ts.includes('1d')) {
        today.push(notif);
      } else if (ts.includes('2d') || ts.includes('3d') || ts.includes('4d') || ts.includes('5d') || ts.includes('6d') || ts.includes('1w')) {
        thisWeek.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { unread, today, thisWeek, earlier };
  }, [displayedNotifications]);

  // Infinite Scroll Trigger using IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(() => {
    if (isLoadingMore || displayedNotifications.length >= filteredNotifications.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setPaginatedLimit((prev) => prev + 10);
      setIsLoadingMore(false);
    }, 600);
  }, [isLoadingMore, displayedNotifications.length, filteredNotifications.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedNotifications.length < filteredNotifications.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, displayedNotifications.length, filteredNotifications.length]);

  // Auto-mark notifications as read when the user views the Notifications screen
  useEffect(() => {
    const unreadExists = notifications.some((n) => !n.isRead);
    if (unreadExists) {
      const timer = setTimeout(() => {
        markAllNotificationsRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenUser = (user: User) => {
    const fullProfile = availableProfiles.find((p) => p.id === user.id) || user;
    setSelectedUserProfile(fullProfile);
  };

  const handleToggleRead = async (id: string, isRead: boolean) => {
    markNotificationAsRead(id);
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      });
    } catch {}
  };

  const handleReplyComment = async (notifId: string, postId: string, text: string) => {
    if (!currentUser?.id) return;
    try {
      await fetch(`/api/notifications/${notifId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          postId,
          text,
        }),
      });
      markNotificationAsRead(notifId);
      celebrateAction();
    } catch (err) {
      console.error('Error replying to comment notification:', err);
    }
  };

  const handleSimulateLiveNotification = async (type: 'like' | 'comment' | 'follow' | 'story_like' | 'mention' = 'like') => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/notifications/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          type,
        }),
      });
      if (res.ok) {
        celebrateAction();
        // Native notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`New ${type} notification on InstaVibe!`, {
              body: 'Someone interacted with your profile.',
              icon: '/favicon.ico',
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error simulating notification:', err);
    }
  };

  const renderSectionHeader = (title: string, count: number, sectionKey: string, isNew = false) => {
    const isCollapsed = !!collapsedSections[sectionKey];

    return (
      <div
        onClick={() => toggleSectionCollapse(sectionKey)}
        className="px-3 py-2 flex items-center justify-between cursor-pointer group select-none"
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isNew
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {title}
          </span>
          <span className="text-[11px] font-medium text-neutral-400">
            ({count})
          </span>
        </div>

        <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isCollapsed ? 'Show' : 'Hide'}
          </span>
          {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </div>
      </div>
    );
  };

  const renderNotificationList = (items: AppNotification[]) => {
    return (
      <div className="space-y-1.5">
        {items.map((notif) => {
          if (notif.isGrouped && (notif.actors?.length || 0) > 1) {
            return (
              <NotificationGroupCard
                key={notif.id}
                notification={notif}
                onSelectUser={handleOpenUser}
                onOpenPost={openPostDetail}
                onToggleRead={handleToggleRead}
                onDelete={deleteNotification}
              />
            );
          }

          return (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onSelectUser={handleOpenUser}
              onOpenPost={openPostDetail}
              onToggleRead={handleToggleRead}
              onDelete={deleteNotification}
              onConfirmRequest={handleConfirmRequest}
              onDeleteRequest={handleDeleteRequest}
              onReplyComment={handleReplyComment}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 pb-24 sm:pb-12 pt-2 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Notifications
          </h2>
          {counts.unread > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-soft-xs flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {counts.unread} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            title="Search notifications"
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isSearchOpen
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Search size={16} />
          </button>

          {/* Notification Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Notification settings"
            className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Settings size={16} />
          </button>

          {/* Mark All As Read */}
          {counts.unread > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                markAllNotificationsRead();
                celebrateAction();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1.5 rounded-full transition-colors shadow-soft-xs"
            >
              <CheckCheck size={14} /> Mark all read
            </motion.button>
          )}
        </div>
      </div>

      {/* Expandable Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="relative flex items-center">
              <Search
                size={16}
                className="absolute left-3.5 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or notification text..."
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 rounded-2xl border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {/* All */}
        <button
          onClick={() => setActiveFilter('all')}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeFilter === 'all'
              ? 'text-white dark:text-neutral-900 font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {activeFilter === 'all' && (
            <motion.div
              layoutId="activeNotifFilterPill"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-full -z-10 shadow-soft-xs"
            />
          )}
          All
          {counts.all > 0 && (
            <span className="opacity-75 text-[11px]">({counts.all})</span>
          )}
        </button>

        {/* Unread */}
        <button
          onClick={() => setActiveFilter('unread')}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeFilter === 'unread'
              ? 'text-white font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {activeFilter === 'unread' && (
            <motion.div
              layoutId="activeNotifFilterPill"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute inset-0 bg-blue-600 rounded-full -z-10 shadow-soft-xs"
            />
          )}
          <Radio size={13} className={activeFilter === 'unread' ? 'text-white animate-pulse' : 'text-blue-500'} />
          Unread
          {counts.unread > 0 && (
            <span className="opacity-90 text-[11px] font-bold">({counts.unread})</span>
          )}
        </button>

        {/* Follows */}
        <button
          onClick={() => setActiveFilter('follows')}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeFilter === 'follows'
              ? 'text-white font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {activeFilter === 'follows' && (
            <motion.div
              layoutId="activeNotifFilterPill"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute inset-0 bg-blue-600 rounded-full -z-10 shadow-soft-xs"
            />
          )}
          <UserPlus size={13} />
          Follows
          {counts.follows > 0 && (
            <span className="opacity-75 text-[11px]">({counts.follows})</span>
          )}
        </button>

        {/* Likes */}
        <button
          onClick={() => setActiveFilter('likes')}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeFilter === 'likes'
              ? 'text-white font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {activeFilter === 'likes' && (
            <motion.div
              layoutId="activeNotifFilterPill"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute inset-0 bg-rose-500 rounded-full -z-10 shadow-soft-xs"
            />
          )}
          <Heart size={13} className={activeFilter === 'likes' ? 'fill-white' : ''} />
          Likes
          {counts.likes > 0 && (
            <span className="opacity-75 text-[11px]">({counts.likes})</span>
          )}
        </button>

        {/* Comments */}
        <button
          onClick={() => setActiveFilter('comments')}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeFilter === 'comments'
              ? 'text-white font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {activeFilter === 'comments' && (
            <motion.div
              layoutId="activeNotifFilterPill"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute inset-0 bg-emerald-600 rounded-full -z-10 shadow-soft-xs"
            />
          )}
          <MessageCircle size={13} />
          Comments
          {counts.comments > 0 && (
            <span className="opacity-75 text-[11px]">({counts.comments})</span>
          )}
        </button>

        {/* Mentions */}
        <button
          onClick={() => setActiveFilter('mentions')}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeFilter === 'mentions'
              ? 'text-white font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {activeFilter === 'mentions' && (
            <motion.div
              layoutId="activeNotifFilterPill"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute inset-0 bg-purple-600 rounded-full -z-10 shadow-soft-xs"
            />
          )}
          <AtSign size={13} />
          Mentions
          {counts.mentions > 0 && (
            <span className="opacity-75 text-[11px]">({counts.mentions})</span>
          )}
        </button>

        {/* Tags */}
        <button
          onClick={() => setActiveFilter('tags')}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeFilter === 'tags'
              ? 'text-white font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {activeFilter === 'tags' && (
            <motion.div
              layoutId="activeNotifFilterPill"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute inset-0 bg-amber-600 rounded-full -z-10 shadow-soft-xs"
            />
          )}
          <Tag size={13} />
          Tags
          {counts.tags > 0 && (
            <span className="opacity-75 text-[11px]">({counts.tags})</span>
          )}
        </button>
      </div>

      {/* Follow Requests Card */}
      {followRequests.length > 0 && (activeFilter === 'all' || activeFilter === 'follows') && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft-sm overflow-hidden transition-all">
          <div
            onClick={() => setIsRequestsOpen((prev) => !prev)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex -space-x-3 items-center">
                {followRequests.slice(0, 2).map((req, i) => (
                  <img
                    key={req.id}
                    src={req.user.avatar}
                    alt={req.user.username}
                    referrerPolicy="no-referrer"
                    className={`w-9 h-9 rounded-full object-cover border-2 border-white dark:border-neutral-900 ${
                      i === 1 ? 'relative z-10' : 'relative z-0'
                    }`}
                  />
                ))}
              </div>

              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Follow requests
                </h3>
                <p className="text-xs text-neutral-500">
                  {followRequests.length} pending request{followRequests.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              {isRequestsOpen ? (
                <ChevronDown size={18} className="text-neutral-400" />
              ) : (
                <ChevronRight size={18} className="text-neutral-400" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {isRequestsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-neutral-100 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/70 overflow-hidden"
              >
                {followRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3.5 px-4 bg-neutral-50/50 dark:bg-neutral-900/30"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                      onClick={() => handleOpenUser(req.user as User)}
                    >
                      <img
                        src={req.user.avatar}
                        alt={req.user.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {req.user.username}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {req.user.name} · {req.mutualCount} mutual followers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleConfirmRequest(req.id, req.user as User)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-soft-xs cursor-pointer transition-all"
                      >
                        Confirm
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleDeleteRequest(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer transition-all"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Main Notifications Feed */}
      {filteredNotifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-10 text-center space-y-4 shadow-soft-sm"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
            {activeFilter === 'follows' ? (
              <UserPlus size={28} />
            ) : activeFilter === 'likes' ? (
              <Heart size={28} />
            ) : activeFilter === 'comments' ? (
              <MessageCircle size={28} />
            ) : activeFilter === 'mentions' ? (
              <AtSign size={28} />
            ) : activeFilter === 'unread' ? (
              <CheckCheck size={28} className="text-emerald-500" />
            ) : (
              <Bell size={28} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              {searchQuery
                ? 'No matching notifications found'
                : activeFilter === 'unread'
                ? "You're all caught up!"
                : activeFilter === 'follows'
                ? 'No follow notifications'
                : activeFilter === 'likes'
                ? 'No likes yet'
                : activeFilter === 'comments'
                ? 'No comments yet'
                : 'No notifications yet'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
              {searchQuery
                ? `No notifications matching "${searchQuery}". Try another keyword.`
                : activeFilter === 'unread'
                ? 'Great job! You have viewed all your latest notifications.'
                : 'When people interact with your profile, posts, and reels, they will appear here.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('feed')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-soft-xs cursor-pointer active:scale-95"
            >
              <Compass size={15} /> Explore Feed
            </button>
            <button
              onClick={() => handleSimulateLiveNotification('like')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles size={14} className="text-blue-500" /> Test Notification
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft-sm p-2.5 sm:p-3.5 space-y-4">
          {/* 1. New (Unread) Section */}
          {groupedNotifications.unread.length > 0 && (
            <div className="space-y-1">
              {renderSectionHeader('New for you', groupedNotifications.unread.length, 'unread', true)}
              <AnimatePresence>
                {!collapsedSections['unread'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {renderNotificationList(groupedNotifications.unread)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 2. Today Section */}
          {groupedNotifications.today.length > 0 && (
            <div className="space-y-1">
              {renderSectionHeader('Today', groupedNotifications.today.length, 'today')}
              <AnimatePresence>
                {!collapsedSections['today'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {renderNotificationList(groupedNotifications.today)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 3. This Week Section */}
          {groupedNotifications.thisWeek.length > 0 && (
            <div className="space-y-1">
              {renderSectionHeader('This Week', groupedNotifications.thisWeek.length, 'thisWeek')}
              <AnimatePresence>
                {!collapsedSections['thisWeek'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {renderNotificationList(groupedNotifications.thisWeek)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 4. Earlier Section */}
          {groupedNotifications.earlier.length > 0 && (
            <div className="space-y-1">
              {renderSectionHeader('Earlier', groupedNotifications.earlier.length, 'earlier')}
              <AnimatePresence>
                {!collapsedSections['earlier'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {renderNotificationList(groupedNotifications.earlier)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Infinite Scrolling Sentinel & Loading Skeleton */}
          <div ref={sentinelRef} className="py-2">
            {isLoadingMore && (
              <div className="space-y-3 p-2">
                {[1, 2].map((sk) => (
                  <div
                    key={sk}
                    className="animate-pulse flex items-center justify-between p-3.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                      <div className="space-y-2">
                        <div className="w-36 h-3.5 rounded bg-neutral-200 dark:bg-neutral-700" />
                        <div className="w-20 h-2.5 rounded bg-neutral-200 dark:bg-neutral-700" />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                ))}
              </div>
            )}

            {/* End of notifications indicator */}
            {!isLoadingMore && displayedNotifications.length >= filteredNotifications.length && filteredNotifications.length > 5 && (
              <div className="py-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[11px] font-semibold">
                  <Check size={13} className="text-emerald-500" />
                  You've viewed all notifications
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSendTestNotification={() => handleSimulateLiveNotification('like')}
      />
    </div>
  );
};
