import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { StoriesBar } from '../stories/StoriesBar';
import { PostCard } from './PostCard';
import { PullToRefresh } from '../common/PullToRefresh';
import { PostCardSkeleton } from '../common/Skeletons';
import {
  Camera,
  Compass,
  Sparkles,
  Flame,
  Users,
  CheckCircle2,
  ArrowUp,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { Post } from '../../types';
import { preloadMediaUrls, getCachedFeed, setCachedFeed } from '../../lib/feedCache';
import { useNetworkStatus } from '../../lib/offlineSync';

type FeedMode = 'for_you' | 'following' | 'trending';

export const FeedList: React.FC = () => {
  const {
    posts: initialPosts,
    currentUser,
    availableProfiles,
    toggleFollowUser,
    setActiveTab,
    setIsEditProfileOpen,
    setIsCreateOpen,
    setSelectedUserProfile,
    refreshData,
  } = useApp();

  const { isOnline } = useNetworkStatus();
  const [feedMode, setFeedMode] = useState<FeedMode>('for_you');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageLimit, setPageLimit] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNewPostsBanner, setHasNewPostsBanner] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Initialize cached posts if available
  useEffect(() => {
    if (initialPosts.length > 0) {
      setCachedFeed(initialPosts);
    }
  }, [initialPosts]);

  // Preload upcoming media ahead of viewport scroll
  useEffect(() => {
    if (initialPosts.length > 0) {
      const urlsToPreload = initialPosts
        .slice(0, 8)
        .flatMap((p) => p.media.map((m) => m.url))
        .filter(Boolean);
      preloadMediaUrls(urlsToPreload);
    }
  }, [initialPosts]);

  // Smart Feed Algorithm
  const sortedPosts = useMemo(() => {
    if (!initialPosts || initialPosts.length === 0) return [];

    if (feedMode === 'following') {
      // Show posts from creators currentUser follows or currentUser's own posts
      const followed = initialPosts.filter(
        (p) => p.author.isFollowing || (currentUser?.id && p.userId === currentUser.id)
      );
      return followed;
    }

    if (feedMode === 'trending') {
      // Sort by highest likes + comments engagement velocity
      return [...initialPosts].sort((a, b) => {
        const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 2.5;
        const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 2.5;
        return scoreB - scoreA;
      });
    }

    // Default 'for_you': Smart ranking algorithm combining affinity, media richness, and engagement
    return [...initialPosts].sort((a, b) => {
      const affinityA = a.author.isFollowing ? 50 : 0;
      const affinityB = b.author.isFollowing ? 50 : 0;
      const mediaRichnessA = (a.media?.length || 1) > 1 ? 15 : 0;
      const mediaRichnessB = (b.media?.length || 1) > 1 ? 15 : 0;
      const engagementA = (a.likesCount || 0) + (a.commentsCount || 0) * 2;
      const engagementB = (b.likesCount || 0) + (b.commentsCount || 0) * 2;

      const totalA = affinityA + mediaRichnessA + engagementA;
      const totalB = affinityB + mediaRichnessB + engagementB;

      return totalB - totalA;
    });
  }, [initialPosts, feedMode, currentUser?.id]);

  // Virtualized infinite stream window
  const visiblePosts = useMemo(() => {
    return sortedPosts.slice(0, pageLimit);
  }, [sortedPosts, pageLimit]);

  const hasMore = visiblePosts.length < sortedPosts.length;

  // Infinite scroll trigger via IntersectionObserver
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      setPageLimit((prev) => {
        const next = prev + 5;
        // Preload next upcoming media items
        const upcomingUrls = sortedPosts
          .slice(prev, next + 4)
          .flatMap((p) => p.media.map((m) => m.url))
          .filter(Boolean);
        preloadMediaUrls(upcomingUrls);
        return next;
      });
      setIsLoadingMore(false);
    }, 450);
  }, [isLoadingMore, hasMore, sortedPosts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsRefreshing(false);
    setPageLimit(6);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setHasNewPostsBanner(false);
  };

  const suggestedUsers = availableProfiles
    .filter((u) => u.id !== currentUser?.id && !u.isFollowing)
    .slice(0, 5);

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div ref={topRef} className="w-full max-w-5xl mx-auto flex gap-8 justify-center pb-24 sm:pb-12 pt-0 sm:pt-4 px-0 sm:px-4">
        {/* Center Feed Column */}
        <div className="w-full max-w-[470px]">
          {/* Stories Bar */}
          <StoriesBar />

          {/* Offline Notice Banner */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-3 sm:mx-0 mb-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-sm"
            >
              <WifiOff size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
              <span>Offline Mode • Your likes and comments will automatically sync when connection returns</span>
            </motion.div>
          )}

          {/* Smart Feed Switcher Tabs */}
          <div className="px-3 sm:px-0 mb-3.5">
            <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/90 p-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-soft-xs">
              <button
                onClick={() => {
                  setFeedMode('for_you');
                  setPageLimit(6);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  feedMode === 'for_you'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-soft-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Sparkles size={13} className={feedMode === 'for_you' ? 'text-pink-500' : ''} />
                For You
              </button>

              <button
                onClick={() => {
                  setFeedMode('following');
                  setPageLimit(6);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  feedMode === 'following'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-soft-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Users size={13} className={feedMode === 'following' ? 'text-blue-500' : ''} />
                Following
              </button>

              <button
                onClick={() => {
                  setFeedMode('trending');
                  setPageLimit(6);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  feedMode === 'trending'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-soft-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Flame size={13} className={feedMode === 'trending' ? 'text-orange-500' : ''} />
                Trending
              </button>
            </div>
          </div>

          {/* Floating "New Posts" Pill */}
          <AnimatePresence>
            {hasNewPostsBanner && (
              <motion.button
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={scrollToTop}
                className="fixed top-18 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-soft-lg flex items-center gap-2 cursor-pointer hover:opacity-95 active:scale-95 backdrop-blur-md"
              >
                <ArrowUp size={14} /> New posts available • Tap to view
              </motion.button>
            )}
          </AnimatePresence>

          {/* Posts Feed */}
          {isRefreshing ? (
            <div className="space-y-4">
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : visiblePosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 p-8 text-center space-y-4 shadow-soft mx-3 sm:mx-0"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                {feedMode === 'following' ? <Users size={28} /> : <Camera size={28} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {feedMode === 'following' ? 'No Posts from Followed Accounts' : 'No Posts in Feed Yet'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  {feedMode === 'following'
                    ? 'Follow more creators in the Explore tab or switch to "For You" to discover trending community posts!'
                    : 'Be the first to share a moment, photo, or story with the community!'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-xs font-bold hover:opacity-90 transition-opacity shadow-soft flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera size={14} /> Create Post
                </button>
                <button
                  onClick={() => {
                    setFeedMode('for_you');
                    setActiveTab('explore');
                  }}
                  className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-2xl text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Compass size={14} /> Explore
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {visiblePosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28, delay: idx < 2 ? idx * 0.06 : 0 }}
                >
                  <PostCard post={post} priority={idx < 2} />
                </motion.div>
              ))}

              {/* End of Followed Feed "All Caught Up" Card */}
              {feedMode === 'following' && !hasMore && visiblePosts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 text-center space-y-3 shadow-soft mx-3 sm:mx-0 my-4"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    You're All Caught Up ✨
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    You've seen all new posts from accounts you follow from the past 3 days.
                  </p>
                  <button
                    onClick={() => setFeedMode('for_you')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-soft cursor-pointer hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={13} /> Discover More in "For You"
                  </button>
                </motion.div>
              )}

              {/* Infinite scroll trigger sentinel */}
              {hasMore && (
                <div ref={sentinelRef} className="py-4">
                  {isLoadingMore && <PostCardSkeleton />}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Desktop Sidebar: User info & Suggested Profiles */}
        <div className="hidden lg:block w-80 space-y-5 pt-1">
          {/* Current User Card */}
          {currentUser && (
            <div className="flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-soft">
              <div
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-3 cursor-pointer group min-w-0"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt={currentUser.name || currentUser.username}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:underline">
                    {currentUser.username}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{currentUser.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer flex-shrink-0"
              >
                Switch
              </button>
            </div>
          )}

          {/* Suggested For You */}
          {suggestedUsers.length > 0 && (
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Suggested for you
                </span>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="text-xs font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                >
                  See All
                </button>
              </div>

              <div className="space-y-3">
                {suggestedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3">
                    <div
                      onClick={() => setSelectedUserProfile(user)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                    >
                      <img
                        src={user.avatar}
                        alt={user.username}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 group-hover:opacity-90 transition-opacity flex-shrink-0"
                      />
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-neutral-900 dark:text-white truncate group-hover:underline">
                          {user.username}
                        </p>
                        <p className="text-neutral-400 truncate text-[11px]">
                          {user.followersCount.toLocaleString()} followers
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollowUser(user.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex-shrink-0 ${
                        user.isFollowing
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          : 'text-blue-500 hover:text-blue-600 dark:text-blue-400 font-bold'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Refresh Data Pill */}
          <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-soft flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Smart Cache Active</span>
            <button
              onClick={handleRefresh}
              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} /> Sync
            </button>
          </div>

          {/* Footer Meta */}
          <div className="px-3 text-[11px] text-neutral-400 dark:text-neutral-500 space-y-2">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span>About</span> • <span>Help</span> • <span>Press</span> • <span>API</span> • <span>Jobs</span> • <span>Privacy</span> • <span>Terms</span>
            </div>
            <p className="uppercase font-semibold tracking-wider text-[10px] text-neutral-400 dark:text-neutral-600">
              © 2026 INSTAVIBE
            </p>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
};
