import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Heart,
  Send,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Trash2,
  Share2,
  Smile,
  Eye,
  CheckCircle2,
  Bookmark,
  Music,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDeterministicChatId } from '../../lib/firestoreChat';
import { preloadAdjacentStories } from '../../lib/storyPreload';
import { AddToHighlightModal } from './AddToHighlightModal';

// Format timestamp to Instagram-style relative time
export const formatStoryTime = (timestamp?: string | number | Date): string => {
  if (!timestamp) return 'Just now';
  const str = String(timestamp).trim();
  if (/^(\d+[smhdwy]|just now)$/i.test(str)) return str;

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return 'Just now';

  const diffSec = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
  return `${Math.floor(diffSec / 604800)}w`;
};

const QUICK_REACTIONS = ['🔥', '😂', '😍', '😮', '😢', '👏', '💯', '🎉'];

interface FloatingParticle {
  id: number;
  emoji: string;
  left: number;
  scale: number;
  duration: number;
}

interface StoryViewerUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  is_verified?: boolean;
  viewed_at?: string;
  has_liked?: boolean;
}

export const StoryViewer: React.FC = () => {
  const {
    currentUser,
    stories,
    activeStoryGroupIndex,
    closeStoryViewer,
    nextStoryGroup,
    prevStoryGroup,
    markStorySeen,
    sendMessage,
    toggleLikeStory,
    deleteStory,
    setSelectedUserProfile,
    setActiveSharePost,
  } = useApp();

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [replyText, setReplyText] = useState('');
  const [showReactionsTray, setShowReactionsTray] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);

  const [viewersList, setViewersList] = useState<StoryViewerUser[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [reactionToast, setReactionToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const holdTimeoutRef = useRef<any>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const DEFAULT_IMAGE_DURATION = 5000; // 5 seconds per image slide

  const currentGroup = activeStoryGroupIndex !== null ? stories[activeStoryGroupIndex] : null;
  const currentSlide = currentGroup?.items[currentSlideIndex];
  const isOwnStory = currentGroup?.userId === currentUser.id;
  const isLiked = currentSlide?.isLiked || false;

  const isVideoStory = Boolean(
    currentSlide &&
      (currentSlide.mediaType === 'video' ||
        currentSlide.mediaUrl.endsWith('.mp4') ||
        currentSlide.mediaUrl.endsWith('.webm') ||
        currentSlide.mediaUrl.includes('video'))
  );

  // Background Preloading of adjacent stories
  useEffect(() => {
    if (activeStoryGroupIndex !== null) {
      preloadAdjacentStories(stories, activeStoryGroupIndex, currentSlideIndex);
    }
  }, [activeStoryGroupIndex, currentSlideIndex, stories]);

  // Reset slide index, progress, and modals when story group changes
  useEffect(() => {
    setCurrentSlideIndex(0);
    setProgress(0);
    setVideoDuration(null);
    setShowReactionsTray(false);
    setShowMoreMenu(false);
    setShowViewersDrawer(false);
    setShowHighlightModal(false);
  }, [activeStoryGroupIndex]);

  // Mark story as seen
  const currentGroupId = currentGroup?.userId;
  const currentSlideId = currentSlide?.id;
  const isCurrentSlideSeen = currentSlide?.seen;

  useEffect(() => {
    if (currentGroupId && currentSlideId && !isCurrentSlideSeen) {
      markStorySeen(currentGroupId, currentSlideId);
    }
  }, [currentGroupId, currentSlideId, isCurrentSlideSeen]);

  // Navigation handlers
  const handleNextSlide = useCallback(() => {
    if (!currentGroup) return;
    if (currentSlideIndex < currentGroup.items.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
      setVideoDuration(null);
      setShowReactionsTray(false);
    } else {
      nextStoryGroup();
    }
  }, [currentGroup, currentSlideIndex, nextStoryGroup]);

  const handlePrevSlide = useCallback(() => {
    if (!currentGroup) return;
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
      setVideoDuration(null);
      setShowReactionsTray(false);
    } else {
      prevStoryGroup();
    }
  }, [currentGroup, currentSlideIndex, prevStoryGroup]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeStoryViewer();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSlide, handlePrevSlide, closeStoryViewer]);

  // Timer loop for progress bar
  const shouldPauseTimer =
    isPaused ||
    isHolding ||
    isVideoBuffering ||
    showViewersDrawer ||
    showMoreMenu ||
    showHighlightModal;

  // Video Play / Pause control on hold
  useEffect(() => {
    if (!videoRef.current || !isVideoStory) return;
    if (shouldPauseTimer) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [shouldPauseTimer, isVideoStory]);

  // Image & Video Progress Bar Engine
  useEffect(() => {
    if (!currentGroup || shouldPauseTimer) return;

    if (isVideoStory) {
      // For video, progress is driven by video timeupdate callback
      return;
    }

    const intervalTime = 40;
    const duration = DEFAULT_IMAGE_DURATION;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        return next >= 100 ? 100 : next;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [
    activeStoryGroupIndex,
    currentSlideIndex,
    shouldPauseTimer,
    isVideoStory,
    Boolean(currentGroup),
  ]);

  // Advance slide when progress completes for images
  useEffect(() => {
    if (!isVideoStory && progress >= 100 && !shouldPauseTimer) {
      handleNextSlide();
    }
  }, [progress, shouldPauseTimer, isVideoStory, handleNextSlide]);

  // Video Time Update Callback
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || videoDuration || 5;
    if (total > 0) {
      const calculated = (current / total) * 100;
      setProgress(calculated);
    }
  };

  // Video Loaded Metadata Callback
  const handleVideoLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur)) {
      setVideoDuration(dur);
    }
    setIsVideoBuffering(false);
  };

  // Spawn flying floating particles (hearts or emojis)
  const spawnFloatingParticles = (emoji: string, count = 14) => {
    const newParticles: FloatingParticle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i + Math.random(),
        emoji,
        left: 15 + Math.random() * 70, // 15% - 85% horizontal spread
        scale: 0.85 + Math.random() * 0.75,
        duration: 1.4 + Math.random() * 0.8,
      });
    }
    setFloatingParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setFloatingParticles((prev) =>
        prev.filter((p) => !newParticles.some((np) => np.id === p.id))
      );
    }, 2400);
  };

  // Like / Unlike Story
  const handleToggleLike = async () => {
    if (!currentSlide) return;
    const nextState = !isLiked;
    if (nextState) {
      spawnFloatingParticles('❤️', 16);
    }
    await toggleLikeStory(currentSlide.id);
  };

  // Send Quick Emoji Reaction in DM
  const handleSendEmojiReaction = (emoji: string) => {
    if (!currentGroup || !currentSlide) return;

    spawnFloatingParticles(emoji, 18);

    const threadId = getDeterministicChatId(currentUser.id, currentGroup.userId);
    sendMessage(
      threadId,
      emoji,
      undefined,
      false,
      undefined,
      undefined,
      {
        sharedPost: {
          id: currentSlide.id,
          authorUsername: currentGroup.username,
          authorAvatar: currentGroup.avatar,
          mediaUrl: currentSlide.mediaUrl,
          caption: currentSlide.caption || 'Story',
          type: 'story',
        },
      }
    );

    setReactionToast(`Reacted with ${emoji}`);
    setTimeout(() => setReactionToast(null), 2000);
    setShowReactionsTray(false);
  };

  // Send Text Reply in DM
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentGroup || !currentSlide) return;

    const threadId = getDeterministicChatId(currentUser.id, currentGroup.userId);
    sendMessage(
      threadId,
      replyText.trim(),
      undefined,
      false,
      undefined,
      undefined,
      {
        sharedPost: {
          id: currentSlide.id,
          authorUsername: currentGroup.username,
          authorAvatar: currentGroup.avatar,
          mediaUrl: currentSlide.mediaUrl,
          caption: currentSlide.caption || 'Story',
          type: 'story',
        },
      }
    );

    spawnFloatingParticles('✨', 10);
    setReactionToast('Reply sent');
    setTimeout(() => setReactionToast(null), 2000);
    setReplyText('');
    setShowReactionsTray(false);
  };

  // Fetch story viewers for own story
  const handleOpenViewersDrawer = async () => {
    if (!currentSlide) return;
    setShowViewersDrawer(true);
    setLoadingViewers(true);

    try {
      const res = await fetch(`/api/stories/${currentSlide.id}/viewers`);
      if (res.ok) {
        const data = await res.json();
        setViewersList(data);
      }
    } catch {
      setViewersList([]);
    } finally {
      setLoadingViewers(false);
    }
  };

  // Delete own story
  const handleDeleteStory = async () => {
    if (!currentSlide) return;
    if (confirm('Delete this story?')) {
      await deleteStory(currentSlide.id);
      setShowMoreMenu(false);
      setShowViewersDrawer(false);
      if (currentGroup?.items.length === 1) {
        closeStoryViewer();
      } else {
        handleNextSlide();
      }
    }
  };

  // Pointer Down (Handle hold-to-pause & long-press)
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, form, a, [data-interactive="true"]')) {
      return;
    }

    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

    holdTimeoutRef.current = setTimeout(() => {
      setIsHolding(true);
    }, 160);
  };

  // Pointer Up (Handle tap navigation or release hold)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (isHolding) {
      setIsHolding(false);
      pointerDownPosRef.current = null;
      return;
    }

    if (!pointerDownPosRef.current) return;

    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    pointerDownPosRef.current = null;

    if (dx < 12 && dy < 12) {
      if ((e.target as HTMLElement).closest('button, input, form, a, [data-interactive="true"]')) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;

      if (clickX < width * 0.35) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    }
  };

  if (!currentGroup || !currentSlide) return null;

  // Previous and next groups for desktop carousel preview
  const prevGroup =
    activeStoryGroupIndex !== null && activeStoryGroupIndex > 0
      ? stories[activeStoryGroupIndex - 1]
      : null;
  const nextGroup =
    activeStoryGroupIndex !== null && activeStoryGroupIndex < stories.length - 1
      ? stories[activeStoryGroupIndex + 1]
      : null;

  return (
    <motion.div
      id="story-viewer-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#0c0c0e]/98 backdrop-blur-2xl flex items-center justify-center select-none overflow-hidden"
    >
      {/* Top Header bar with Logo and Global Close */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-40 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white font-serif italic drop-shadow-md">
            InstaVibe
          </span>
        </div>

        <button
          id="btn-close-story-viewer"
          onClick={closeStoryViewer}
          className="pointer-events-auto p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all backdrop-blur-md cursor-pointer active:scale-95 shadow-md"
          title="Close (Esc)"
        >
          <X size={22} />
        </button>
      </div>

      {/* Desktop Left Navigation Arrow */}
      {activeStoryGroupIndex !== null && activeStoryGroupIndex > 0 && (
        <button
          id="btn-prev-story-group"
          onClick={prevStoryGroup}
          className="hidden md:flex absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/15 hover:bg-white/30 text-white rounded-full items-center justify-center backdrop-blur-md transition-all active:scale-90 z-40 shadow-lg cursor-pointer border border-white/10"
          title="Previous story (Left Arrow)"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Desktop Right Navigation Arrow */}
      {activeStoryGroupIndex !== null && activeStoryGroupIndex < stories.length - 1 && (
        <button
          id="btn-next-story-group"
          onClick={nextStoryGroup}
          className="hidden md:flex absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/15 hover:bg-white/30 text-white rounded-full items-center justify-center backdrop-blur-md transition-all active:scale-90 z-40 shadow-lg cursor-pointer border border-white/10"
          title="Next story (Right Arrow)"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Desktop Previous Story Preview Card (Instagram Carousel style) */}
      {prevGroup && (
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 0.45, x: 0 }}
          whileHover={{ opacity: 0.85, scale: 0.94 }}
          onClick={prevStoryGroup}
          className="hidden lg:flex flex-col items-center justify-center absolute left-[6%] 2xl:left-[12%] top-1/2 -translate-y-1/2 w-48 h-[580px] rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl scale-90 cursor-pointer z-20 border border-white/10"
        >
          <img
            src={prevGroup.items[0]?.mediaUrl}
            alt={prevGroup.username}
            className="w-full h-full object-cover filter brightness-70"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-2 text-white p-3 text-center">
            <img
              src={prevGroup.avatar}
              alt={prevGroup.username}
              className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-bold truncate max-w-[120px]">{prevGroup.username}</span>
            <span className="text-[10px] text-white/70">
              {prevGroup.items[0]?.timestamp || 'Earlier'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Desktop Next Story Preview Card (Instagram Carousel style) */}
      {nextGroup && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 0.45, x: 0 }}
          whileHover={{ opacity: 0.85, scale: 0.94 }}
          onClick={nextStoryGroup}
          className="hidden lg:flex flex-col items-center justify-center absolute right-[6%] 2xl:right-[12%] top-1/2 -translate-y-1/2 w-48 h-[580px] rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl scale-90 cursor-pointer z-20 border border-white/10"
        >
          <img
            src={nextGroup.items[0]?.mediaUrl}
            alt={nextGroup.username}
            className="w-full h-full object-cover filter brightness-70"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-2 text-white p-3 text-center">
            <img
              src={nextGroup.avatar}
              alt={nextGroup.username}
              className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-bold truncate max-w-[120px]">{nextGroup.username}</span>
            <span className="text-[10px] text-white/70">
              {nextGroup.items[0]?.timestamp || 'Earlier'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Main Active Story Container */}
      <motion.div
        id="story-card-frame"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        animate={{ scale: isHolding ? 0.965 : 1 }}
        transition={{ type: 'spring', stiffness: 450, damping: 26 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.45}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 450) {
            closeStoryViewer();
          }
        }}
        className="relative w-full h-full sm:w-[410px] sm:h-[88vh] sm:max-h-[780px] sm:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between z-30 touch-none border border-white/10"
      >
        {/* Story Media (Video or Image) */}
        <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center">
          {isVideoStory ? (
            <video
              ref={videoRef}
              src={currentSlide.mediaUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onWaiting={() => setIsVideoBuffering(true)}
              onPlaying={() => setIsVideoBuffering(false)}
              onEnded={handleNextSlide}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentSlide.mediaUrl}
              alt={currentGroup.username}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all ${
                currentSlide.filter ? `filter-${currentSlide.filter}` : ''
              }`}
            />
          )}

          {/* Vignette Gradients for Text Contrast */}
          <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none z-10" />
        </div>

        {/* Floating Animated Emojis / Hearts Shower */}
        <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden">
          {floatingParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute text-3xl animate-float-up opacity-90 drop-shadow-lg"
              style={{
                left: `${particle.left}%`,
                bottom: '10%',
                transform: `scale(${particle.scale})`,
                animationDuration: `${particle.duration}s`,
              }}
            >
              {particle.emoji}
            </div>
          ))}
        </div>

        {/* Reaction Toast */}
        {reactionToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-35 bg-black/80 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/15 animate-fade-in flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>{reactionToast}</span>
          </div>
        )}

        {/* TOP OVERLAY: Progress Bars & Header (Seamlessly fades out when holding) */}
        <div
          className={`relative z-30 pt-3.5 pb-2 px-3 sm:px-4 space-y-2.5 transition-opacity duration-200 ${
            isHolding ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Segmented Progress Bars (Instagram 2.5px precision) */}
          <div className="flex items-center gap-1 w-full">
            {currentGroup.items.map((item, idx) => {
              let width = '0%';
              if (idx < currentSlideIndex) width = '100%';
              else if (idx === currentSlideIndex) width = `${progress}%`;

              return (
                <div
                  key={item.id}
                  className="flex-1 h-[2.5px] bg-white/35 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75"
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>

          {/* Clean Instagram Header Row */}
          <div className="flex items-center justify-between">
            {/* User Details */}
            <div
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUserProfile({
                  id: currentGroup.userId,
                  username: currentGroup.username,
                  name: currentGroup.name,
                  avatar: currentGroup.avatar,
                  bio: '',
                  followersCount: 0,
                  followingCount: 0,
                  postsCount: 0,
                  isVerified: currentGroup.isVerified,
                });
                closeStoryViewer();
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <img
                src={currentGroup.avatar}
                alt={currentGroup.username}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/30 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-white text-xs sm:text-sm font-semibold tracking-tight group-hover:underline">
                    {currentGroup.username}
                  </span>
                  {currentGroup.isVerified && (
                    <span className="text-sky-400 text-xs">●</span>
                  )}
                  <span className="text-white/60 text-xs font-bold">•</span>
                  <span className="text-white/75 text-xs font-normal">
                    {formatStoryTime(currentSlide.timestamp || currentSlide.rawTimestamp)}
                  </span>
                </div>
                {/* Audio track info if video or track present */}
                <div className="flex items-center gap-1 text-[10px] text-white/80 mt-0.5">
                  <Music size={10} className="text-white/70" />
                  <span>{isVideoStory ? 'Video audio' : 'Original audio'}</span>
                </div>
              </div>
            </div>

            {/* Top Right Controls (Play/Pause, Sound, More Options, Close) */}
            <div data-interactive="true" className="flex items-center gap-0.5 sm:gap-1 text-white">
              {/* Play / Pause Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => !prev);
                }}
                className="p-1.5 rounded-full hover:bg-black/30 text-white/90 hover:text-white transition-colors cursor-pointer"
                title={isPaused ? 'Play' : 'Pause'}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>

              {/* Mute / Unmute Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((prev) => !prev);
                }}
                className="p-1.5 rounded-full hover:bg-black/30 text-white/90 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* More Options (...) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu((prev) => !prev);
                  }}
                  className="p-1.5 rounded-full hover:bg-black/30 text-white/90 hover:text-white transition-colors cursor-pointer"
                  title="More"
                >
                  <MoreHorizontal size={18} />
                </button>

                {/* More Options Dropdown */}
                {showMoreMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 text-white text-xs"
                  >
                    {isOwnStory ? (
                      <>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowHighlightModal(true);
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-white hover:bg-white/10 text-left transition-colors cursor-pointer font-medium"
                        >
                          <Bookmark size={15} className="text-amber-400" />
                          <span>Add to highlights</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            handleOpenViewersDrawer();
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-white hover:bg-white/10 text-left transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                          <span>Story insights</span>
                        </button>
                        <button
                          onClick={handleDeleteStory}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-400 hover:bg-white/10 text-left transition-colors cursor-pointer font-medium"
                        >
                          <Trash2 size={15} />
                          <span>Delete story</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            navigator.clipboard?.writeText(window.location.href);
                            setReactionToast('Link copied');
                            setTimeout(() => setReactionToast(null), 2000);
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-white hover:bg-white/10 text-left transition-colors cursor-pointer"
                        >
                          <Bookmark size={15} />
                          <span>Copy link</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setReactionToast('Report submitted');
                            setTimeout(() => setReactionToast(null), 2000);
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-400 hover:bg-white/10 text-left transition-colors cursor-pointer"
                        >
                          <span>Report inappropriate</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button for mobile */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeStoryViewer();
                }}
                className="p-1.5 rounded-full hover:bg-black/30 text-white/90 hover:text-white transition-colors cursor-pointer sm:hidden"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Story Caption (if any) */}
        {currentSlide.caption && (
          <div
            className={`relative z-20 px-4 py-2 my-auto transition-opacity duration-200 ${
              isHolding ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="bg-black/45 backdrop-blur-md rounded-2xl px-4 py-2.5 inline-block text-white text-xs sm:text-sm font-medium shadow-lg border border-white/15 max-w-full">
              {currentSlide.caption}
            </div>
          </div>
        )}

        {/* BOTTOM OVERLAY: Interactive Reply / Own Story Controls */}
        <div
          data-interactive="true"
          className={`relative z-30 p-3 sm:p-4 space-y-2 transition-opacity duration-200 ${
            isHolding ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Quick Emoji Reactions Tray */}
          {showReactionsTray && !isOwnStory && (
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/95 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl animate-slide-up">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendEmojiReaction(emoji)}
                  className="text-2xl hover:scale-135 active:scale-95 transition-transform cursor-pointer p-1"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {isOwnStory ? (
            /* Controls for OWN Story (Activity, Highlights, Share, Delete) */
            <div className="flex items-center justify-between pt-1">
              {/* Activity / Viewers button */}
              <button
                type="button"
                onClick={handleOpenViewersDrawer}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-2 rounded-full text-white text-xs font-semibold transition-all active:scale-95 border border-white/20 cursor-pointer shadow-lg"
              >
                <Eye size={15} />
                <span>{currentSlide.viewsCount || 0} views</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHighlightModal(true)}
                  className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-transform active:scale-95 cursor-pointer"
                  title="Add to Highlights"
                >
                  <Bookmark size={18} className="text-amber-300" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSharePost({
                      id: currentSlide.id,
                      userId: currentUser.id,
                      author: currentUser,
                      media: [{ url: currentSlide.mediaUrl, aspectRatio: 'portrait' }],
                      caption: currentSlide.caption || '',
                      timestamp: 'Just now',
                      likesCount: currentSlide.likesCount || 0,
                      commentsCount: 0,
                      isLiked: false,
                      isSaved: false,
                      comments: [],
                    });
                  }}
                  className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-transform active:scale-95 cursor-pointer"
                  title="Share"
                >
                  <Share2 size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleDeleteStory}
                  className="p-2.5 rounded-full bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 backdrop-blur-md border border-rose-400/30 transition-transform active:scale-95 cursor-pointer"
                  title="Delete Story"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* Reply Bar for OTHER users' stories */
            <form onSubmit={handleSendReply} className="flex items-center gap-2 sm:gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => {
                    setIsPaused(true);
                    setShowReactionsTray(true);
                  }}
                  onBlur={() => {
                    if (!replyText.trim()) {
                      setIsPaused(false);
                    }
                  }}
                  placeholder={`Reply to ${currentGroup.username}...`}
                  className="w-full bg-transparent hover:bg-white/10 focus:bg-white/15 border border-white/40 focus:border-white/90 text-white placeholder-white/70 text-xs sm:text-sm rounded-full py-2.5 pl-4 pr-16 outline-none backdrop-blur-md transition-all shadow-inner"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowReactionsTray((prev) => !prev)}
                    className={`p-1.5 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer ${
                      showReactionsTray ? 'text-amber-400' : ''
                    }`}
                    title="Quick Reactions"
                  >
                    <Smile size={17} />
                  </button>

                  {replyText.trim() && (
                    <button
                      type="submit"
                      className="p-1.5 text-pink-400 hover:text-pink-300 transition-colors cursor-pointer active:scale-90"
                      title="Send Reply"
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Heart (Like) Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`p-2.5 rounded-full backdrop-blur-md border transition-transform active:scale-125 cursor-pointer ${
                  isLiked
                    ? 'bg-rose-600/90 border-rose-500 text-white shadow-lg shadow-rose-600/40'
                    : 'bg-transparent border-white/40 text-white hover:bg-white/15'
                }`}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart size={20} className={isLiked ? 'fill-white text-white' : 'text-white'} />
              </button>

              {/* Share / Direct Message paper plane */}
              <button
                type="button"
                onClick={() => {
                  setActiveSharePost({
                    id: currentSlide.id,
                    userId: currentGroup.userId,
                    author: {
                      id: currentGroup.userId,
                      username: currentGroup.username,
                      name: currentGroup.name,
                      avatar: currentGroup.avatar,
                      bio: '',
                      followersCount: 0,
                      followingCount: 0,
                      postsCount: 0,
                    },
                    media: [{ url: currentSlide.mediaUrl, aspectRatio: 'portrait' }],
                    caption: currentSlide.caption || 'Story',
                    timestamp: 'Just now',
                    likesCount: currentSlide.likesCount || 0,
                    commentsCount: 0,
                    isLiked: false,
                    isSaved: false,
                    comments: [],
                  });
                }}
                className="p-2.5 rounded-full bg-transparent border border-white/40 text-white hover:bg-white/15 backdrop-blur-md transition-transform active:scale-110 cursor-pointer"
                title="Share Story"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>

        {/* Viewers & Insights Slide-Up Drawer (for own story) */}
        {showViewersDrawer && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 top-1/4 bg-neutral-900/98 backdrop-blur-2xl rounded-t-3xl z-40 border-t border-white/15 p-4 flex flex-col justify-between animate-slide-up shadow-2xl"
          >
            <div>
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
                    <Eye size={16} className="text-white/70" />
                    <span>{viewersList.length || currentSlide.viewsCount || 0} Views</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-sm">
                    <Heart size={15} className="fill-rose-400" />
                    <span>{currentSlide.likesCount || 0} Likes</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowViewersDrawer(false)}
                  className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[340px] space-y-3 pr-1">
                {loadingViewers ? (
                  <div className="py-8 text-center text-white/50 text-xs">Loading viewers...</div>
                ) : viewersList.length === 0 ? (
                  <div className="py-8 text-center text-white/50 text-xs">
                    No views yet. When people view your story, they'll appear here.
                  </div>
                ) : (
                  viewersList.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex items-center justify-between py-1 text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={viewer.avatar}
                          alt={viewer.username}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <p className="text-xs font-semibold leading-tight">{viewer.username}</p>
                          <p className="text-[11px] text-white/60">{viewer.name}</p>
                        </div>
                      </div>

                      {viewer.has_liked && (
                        <div className="p-1.5 text-rose-500">
                          <Heart size={16} className="fill-rose-500" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-3">
              <button
                onClick={handleDeleteStory}
                className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-500/30 cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Delete this story</span>
              </button>
            </div>
          </div>
        )}

        {/* Add To Highlights Modal */}
        {showHighlightModal && currentSlide && (
          <AddToHighlightModal
            story={currentSlide}
            isOpen={showHighlightModal}
            onClose={() => setShowHighlightModal(false)}
            onSuccess={(title) => {
              setReactionToast(`Added to "${title}"!`);
              setTimeout(() => setReactionToast(null), 2000);
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
