import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Grid,
  Bookmark,
  Clapperboard,
  Link,
  Plus,
  Heart,
  MessageCircle,
  Camera,
  Check,
  Archive,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StoryRing } from '../stories/StoryRing';
import { StoryArchiveModal } from '../stories/StoryArchiveModal';
import { HighlightItem, StoryGroup } from '../../types';
import { getOptimizedImageUrl, generateSrcSet } from '../../lib/imageOptimization';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    posts,
    savedPostIds,
    reels,
    setIsEditProfileOpen,
    setUserListModal,
    setSelectedPostForDetail,
    stories,
    openStoryViewer,
    setIsCreateOpen,
    openFollowersModal,
    openFollowingModal,
    setActiveTab: setGlobalActiveTab,
    setActiveReelIndex,
    setStories,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'grid' | 'reels' | 'saved'>('grid');
  const [copiedLink, setCopiedLink] = useState(false);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const myPosts = posts.filter((p) => currentUser?.id && p.author.id === currentUser.id);
  const mySavedPosts = posts.filter((p) => p.isSaved || (savedPostIds && savedPostIds.includes(p.id)));
  const myReels = reels.filter((r) => currentUser?.id && r.author.id === currentUser.id);

  const myStoryIndex = stories.findIndex((s) => currentUser?.id && s.userId === currentUser.id);

  // Fetch highlights for currentUser
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchHighlights = async () => {
      try {
        const res = await fetch(`/api/users/${currentUser.id}/highlights`);
        if (res.ok) {
          const data = await res.json();
          setHighlights(data);
        }
      } catch (e) {
        console.error('Failed to load profile highlights:', e);
      }
    };
    fetchHighlights();
  }, [currentUser?.id]);

  if (!currentUser) {
    return null;
  }

  const handleOpenHighlight = (hl: HighlightItem) => {
    if (!hl.items || hl.items.length === 0) return;

    // Create a temporary story group for this highlight and view it
    const highlightGroup: StoryGroup = {
      userId: `hl_${hl.id}`,
      username: `${currentUser.username} • ${hl.title}`,
      name: hl.title,
      avatar: hl.coverUrl,
      isVerified: currentUser.isVerified,
      hasUnseen: false,
      items: hl.items.map((item, idx) => ({
        id: item.id || `hl_item_${idx}`,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType || 'image',
        timestamp: 'Highlight',
        caption: item.caption || hl.title,
        filter: item.filter || 'normal',
        seen: true,
        isLiked: false,
      })),
    };

    setStories((prev) => {
      const filtered = prev.filter((g) => g.userId !== highlightGroup.userId);
      return [highlightGroup, ...filtered];
    });

    openStoryViewer(0);
  };

  const handleShareProfile = async () => {
    const profileUrl = window.location.origin + `?user=${currentUser.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentUser.name} (@${currentUser.username}) on InstaVibe`,
          url: profileUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 sm:pb-12 pt-2 sm:pt-6">
      {/* Profile Header Card */}
      <div className="px-4 sm:px-6 space-y-5">
        {/* Row 1: Avatar + 3 Stat Columns */}
        <div className="flex items-center justify-between gap-4 sm:gap-12">
          {/* Avatar with Story Ring */}
          <div className="relative flex-shrink-0 cursor-pointer">
            <StoryRing
              avatar={currentUser.avatar}
              username={currentUser.username}
              hasUnseen={myStoryIndex >= 0 ? stories[myStoryIndex].hasUnseen : false}
              isCloseFriend={
                myStoryIndex >= 0
                  ? Boolean(
                      stories[myStoryIndex].hasCloseFriends ||
                        stories[myStoryIndex].items.some((it) => it.isCloseFriends)
                    )
                  : false
              }
              size="lg"
              onClick={() => {
                if (myStoryIndex >= 0 && stories[myStoryIndex].items.length > 0) {
                  openStoryViewer(myStoryIndex);
                } else {
                  setIsCreateOpen(true);
                }
              }}
            />
            {/* Plus badge on avatar if no story */}
            {myStoryIndex < 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateOpen(true);
                }}
                className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-soft-xs cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                title="Add Story"
              >
                <Plus size={14} className="stroke-[3]" />
              </button>
            )}
          </div>

          {/* 3 Real Stats Columns */}
          <div className="flex-1 flex items-center justify-around text-center">
            <div className="flex flex-col items-center">
              <span className="font-bold text-base sm:text-lg text-neutral-950 dark:text-white leading-tight">
                {currentUser.postsCount !== undefined ? currentUser.postsCount : myPosts.length}
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                posts
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => openFollowersModal(currentUser.id)}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="font-bold text-base sm:text-lg text-neutral-950 dark:text-white leading-tight">
                {currentUser.followersCount >= 10000
                  ? `${(currentUser.followersCount / 1000).toFixed(1)}k`
                  : (currentUser.followersCount || 0).toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                followers
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => openFollowingModal(currentUser.id)}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="font-bold text-base sm:text-lg text-neutral-950 dark:text-white leading-tight">
                {(currentUser.followingCount || 0).toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                following
              </span>
            </motion.button>
          </div>
        </div>

        {/* Row 2: User Name & Bio */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white leading-snug">
              {currentUser.name}
            </h1>
            {currentUser.pronouns && (
              <span className="text-xs text-neutral-400 font-normal">
                {currentUser.pronouns}
              </span>
            )}
            {currentUser.isVerified && (
              <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-soft-xs">
                ✓
              </span>
            )}
          </div>

          {currentUser.bio && (
            <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-line leading-relaxed">
              {currentUser.bio}
            </p>
          )}

          {currentUser.website && (
            <a
              href={currentUser.website.startsWith('http') ? currentUser.website : `https://${currentUser.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
            >
              <Link size={12} className="rotate-45" />
              <span>{currentUser.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>

        {/* Row 3: Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditProfileOpen(true)}
            className="flex-1 py-2 px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-soft-xs"
          >
            Edit profile
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShareProfile}
            className="flex-1 py-2 px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-soft-xs"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <span>Share profile</span>
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsArchiveOpen(true)}
            className="p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-colors cursor-pointer flex-shrink-0 shadow-soft-xs"
            title="Stories Archive"
          >
            <Archive size={18} />
          </motion.button>
        </div>

        {/* Story Highlights Strip */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
          {/* New Highlight Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsArchiveOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center bg-transparent group-hover:border-neutral-400 dark:group-hover:border-neutral-500 transition-colors">
              <Plus size={22} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
              New
            </span>
          </motion.div>

          {/* User's Created Highlights */}
          {highlights.map((hl) => (
            <motion.div
              key={hl.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenHighlight(hl)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full p-[2px] border border-neutral-300 dark:border-neutral-700 group-hover:border-amber-400 dark:group-hover:border-amber-400 transition-colors overflow-hidden flex items-center justify-center">
                <img
                  src={hl.coverUrl}
                  alt={hl.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-[11px] text-neutral-800 dark:text-neutral-200 font-medium max-w-[68px] truncate text-center">
                {hl.title}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Story Archive Modal */}
      {isArchiveOpen && (
        <StoryArchiveModal
          isOpen={isArchiveOpen}
          onClose={() => setIsArchiveOpen(false)}
        />
      )}

      {/* Tabs Navigation (Grid, Reels, Saved) with Smooth Animated Glider */}
      <div className="flex items-center justify-around border-t border-neutral-200/80 dark:border-neutral-800 mt-4 relative">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 relative transition-colors cursor-pointer ${
            activeTab === 'grid'
              ? 'text-neutral-950 dark:text-white'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
          title="Posts"
        >
          {activeTab === 'grid' && (
            <motion.div
              layoutId="activeProfileTabIndicator"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute top-0 inset-x-0 h-0.5 bg-neutral-950 dark:bg-white"
            />
          )}
          <Grid size={22} className={activeTab === 'grid' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 relative transition-colors cursor-pointer ${
            activeTab === 'reels'
              ? 'text-neutral-950 dark:text-white'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
          title="Reels"
        >
          {activeTab === 'reels' && (
            <motion.div
              layoutId="activeProfileTabIndicator"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute top-0 inset-x-0 h-0.5 bg-neutral-950 dark:bg-white"
            />
          )}
          <Clapperboard size={22} className={activeTab === 'reels' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 relative transition-colors cursor-pointer ${
            activeTab === 'saved'
              ? 'text-neutral-950 dark:text-white'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
          title="Saved"
        >
          {activeTab === 'saved' && (
            <motion.div
              layoutId="activeProfileTabIndicator"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute top-0 inset-x-0 h-0.5 bg-neutral-950 dark:bg-white"
            />
          )}
          <Bookmark size={22} className={activeTab === 'saved' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />
        </button>
      </div>

      {/* Grid Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {myPosts.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  <Camera size={28} />
                </div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Share Photos
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  When you share photos, they will appear on your profile.
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline cursor-pointer"
                >
                  Share your first photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-2 px-1 sm:px-0">
                {myPosts.map((post) => {
                  const mediaUrl = post.media[0]?.url;
                  const optUrl = getOptimizedImageUrl(mediaUrl, { width: 400, quality: 80 });
                  const srcSet = generateSrcSet(mediaUrl, [200, 300, 400, 600]);

                  return (
                    <motion.div
                      key={post.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setSelectedPostForDetail(post)}
                      className="relative aspect-square group bg-neutral-100 dark:bg-neutral-800 overflow-hidden rounded-lg sm:rounded-2xl cursor-pointer shadow-soft-xs"
                    >
                      <img
                        src={optUrl}
                        srcSet={srcSet || undefined}
                        sizes="(max-width: 640px) 33vw, 240px"
                        alt={post.caption || 'Post preview'}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          post.media[0]?.filter ? `filter-${post.media[0]?.filter}` : ''
                        }`}
                      />
                      {post.media.length > 1 && (
                        <div className="absolute top-2 right-2 text-white drop-shadow-md">
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5 text-white font-bold text-xs sm:text-sm backdrop-blur-[2px]">
                        <div className="flex items-center gap-1.5">
                          <Heart size={16} className="fill-white" />
                          <span>{post.likesCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={16} className="fill-white" />
                          <span>{post.commentsCount}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Reels Content */}
        {activeTab === 'reels' && (
          <motion.div
            key="reels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {myReels.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  <Clapperboard size={28} />
                </div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  No Reels Yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  When you post video reels, they will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-2 px-1 sm:px-0">
                {myReels.map((reel) => {
                  const reelIndex = reels.findIndex((r) => r.id === reel.id);
                  const rawUrl = reel.posterUrl || reel.videoUrl;
                  const optUrl = getOptimizedImageUrl(rawUrl, { width: 360, quality: 80 });

                  return (
                    <motion.div
                      key={reel.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => {
                        if (reelIndex >= 0) {
                          setActiveReelIndex(reelIndex);
                        }
                        setGlobalActiveTab('reels');
                      }}
                      className="relative aspect-[9/16] group bg-neutral-900 overflow-hidden rounded-lg sm:rounded-2xl cursor-pointer shadow-soft-xs"
                    >
                      <img
                        src={optUrl}
                        alt="Reel preview"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                        <Clapperboard size={13} />
                        <span>{reel.likesCount.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Saved Content */}
        {activeTab === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-3 gap-1 sm:gap-2 px-1 sm:px-0">
              {mySavedPosts.length === 0 ? (
                <div className="col-span-3 py-16 text-center text-neutral-400 px-4 space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 mb-2">
                    <Bookmark size={28} />
                  </div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    Save Photos and Videos
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Save items that you want to see again. Only you can see what you have saved.
                  </p>
                </div>
              ) : (
                mySavedPosts.map((post) => {
                  const mediaUrl = post.media[0]?.url;
                  const optUrl = getOptimizedImageUrl(mediaUrl, { width: 400, quality: 80 });
                  const srcSet = generateSrcSet(mediaUrl, [200, 300, 400, 600]);

                  return (
                    <motion.div
                      key={post.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setSelectedPostForDetail(post)}
                      className="relative aspect-square group bg-neutral-100 dark:bg-neutral-800 overflow-hidden rounded-lg sm:rounded-2xl cursor-pointer shadow-soft-xs"
                    >
                      <img
                        src={optUrl}
                        srcSet={srcSet || undefined}
                        sizes="(max-width: 640px) 33vw, 240px"
                        alt={post.caption || 'Saved preview'}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          post.media[0]?.filter ? `filter-${post.media[0]?.filter}` : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5 text-white font-bold text-xs sm:text-sm backdrop-blur-[2px]">
                        <div className="flex items-center gap-1.5">
                          <Heart size={16} className="fill-white" />
                          <span>{post.likesCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={16} className="fill-white" />
                          <span>{post.commentsCount}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
