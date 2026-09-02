import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Sliders,
  Check,
  Radio,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Reel, ReelQuality } from '../../types';
import { DoubleTapHeart } from '../feed/DoubleTapHeart';
import confetti from 'canvas-confetti';

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenComments: (reel: Reel) => void;
  onOpenShare: (reel: Reel) => void;
  onOpenSuggested: (reel: Reel) => void;
  preloadStrategy: 'auto' | 'metadata' | 'none';
}

export const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onOpenComments,
  onOpenShare,
  onOpenSuggested,
  preloadStrategy,
}) => {
  const {
    toggleLikeReel,
    toggleSaveReel,
    toggleFollowUser,
    currentUser,
    setSelectedUserProfile,
    recordReelWatch,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(reel.duration || 15);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<null | 'play' | 'pause'>(null);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p)');
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const lastTapRef = useRef<number>(0);
  const watchTimeRef = useRef<number>(0);
  const watchIntervalRef = useRef<any>(null);

  // Default streaming qualities fallback
  const streamingQualities: ReelQuality[] = reel.qualities || [
    { label: 'Auto (1080p)', resolution: '1080p', bitrate: '6.2 Mbps', url: reel.videoUrl },
    { label: 'High (720p)', resolution: '720p', bitrate: '3.8 Mbps', url: reel.videoUrl },
    { label: 'Medium (480p)', resolution: '480p', bitrate: '1.9 Mbps', url: reel.videoUrl },
    { label: 'Data Saver (360p)', resolution: '360p', bitrate: '0.8 Mbps', url: reel.videoUrl },
  ];

  // Active / Inactive Video Playback Management
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      setIsBuffering(true);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            // Autoplay with audio was blocked; fallback to muted
            console.log('Autoplay policy caught:', err);
            setIsPlaying(false);
            setIsBuffering(false);
          });
      }

      // Track watch history duration
      watchIntervalRef.current = setInterval(() => {
        watchTimeRef.current += 1;
      }, 1000);
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setIsBuffering(false);

      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }

      // Record watch session if watched > 1s
      if (watchTimeRef.current >= 1 && reel.id) {
        const progressPct = Math.min(100, Math.round((watchTimeRef.current / (duration || 15)) * 100));
        recordReelWatch(reel.id, watchTimeRef.current, progressPct);
        watchTimeRef.current = 0;
      }
    }

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, [isActive, reel.id, duration]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setShowPlayPauseIcon('play');
        setTimeout(() => setShowPlayPauseIcon(null), 600);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setShowPlayPauseIcon('pause');
      setTimeout(() => setShowPlayPauseIcon(null), 600);
    }
  };

  const handleVideoClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double Tap detected -> Trigger like animation
      if (!reel.isLiked) {
        toggleLikeReel(reel.id);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.75 } });
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    } else {
      // Single tap -> Toggle Play / Pause
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 300) {
          togglePlayPause();
        }
      }, 300);
    }
    lastTapRef.current = now;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    videoRef.current.currentTime = newProgress * duration;
    setCurrentTime(videoRef.current.currentTime);
  };

  const currentQualityObj =
    streamingQualities.find((q) => q.label === selectedQuality) ||
    streamingQualities[0];

  const currentVideoSrc = currentQualityObj.url || reel.videoUrl;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="w-full h-full relative bg-black flex items-center justify-center select-none overflow-hidden"
      onClick={handleVideoClick}
    >
      {/* HTML5 Video Player */}
      <video
        ref={videoRef}
        src={currentVideoSrc}
        poster={reel.posterUrl}
        preload={preloadStrategy}
        playsInline
        loop
        muted={isMuted}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-cover"
      />

      {/* Subtle Top & Bottom Gradient Shadows */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

      {/* Double Tap Heart Burst */}
      <DoubleTapHeart show={showHeartAnim} />

      {/* Play/Pause Spring Icon Overlay */}
      <AnimatePresence>
        {showPlayPauseIcon && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="p-4 rounded-full bg-black/60 backdrop-blur-md text-white shadow-2xl">
              {showPlayPauseIcon === 'play' ? <Play size={36} className="fill-white" /> : <Pause size={36} className="fill-white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buffer Spinner Indicator */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 shadow-2xl">
              <div className="w-8 h-8 border-3 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
              <span className="text-[11px] font-medium text-white/90">Loading stream...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality Badge & Mute Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 text-white">
        {/* Quality Selector Pill */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsQualityMenuOpen((prev) => !prev);
            }}
            className="px-2.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-soft-xs"
          >
            <Sliders size={12} />
            <span>{selectedQuality.split(' ')[0]}</span>
          </button>

          {/* Quality Popup Menu */}
          <AnimatePresence>
            {isQualityMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 top-9 w-44 bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-white/10">
                  Streaming Quality
                </div>
                {streamingQualities.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setSelectedQuality(q.label);
                      setIsQualityMenuOpen(false);
                      if (videoRef.current) {
                        const savedTime = videoRef.current.currentTime;
                        videoRef.current.src = q.url;
                        videoRef.current.currentTime = savedTime;
                        videoRef.current.play();
                      }
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      selectedQuality === q.label
                        ? 'bg-rose-500 text-white'
                        : 'text-neutral-200 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{q.label}</div>
                      <div className="text-[10px] opacity-75">{q.bitrate}</div>
                    </div>
                    {selectedQuality === q.label && <Check size={14} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mute Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 transition-colors cursor-pointer shadow-soft-xs"
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </motion.button>
      </div>

      {/* Bottom Information and Right Action Bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-6 flex items-end justify-between gap-3">
        {/* Creator Info, Caption & Music Tag */}
        <div className="flex-1 space-y-2 text-white min-w-0 pr-2">
          {/* Creator Profile Link & Follow Button */}
          <div className="flex items-center gap-2.5">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (reel.author) setSelectedUserProfile(reel.author);
              }}
              className="cursor-pointer flex items-center gap-2 min-w-0 group"
            >
              <img
                src={
                  reel.author?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                }
                alt={reel.author?.username || 'Creator'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-white/70 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs sm:text-sm truncate group-hover:underline flex items-center gap-1">
                  @{reel.author?.username || 'creator'}
                  {reel.author?.isVerified && (
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">
                      ✓
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Follow Toggle Button */}
            {reel.author && reel.author.id !== currentUser.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollowUser(reel.author.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  reel.author.isFollowing
                    ? 'bg-white/20 border border-white/30 text-white hover:bg-white/30'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-soft-xs'
                }`}
              >
                {reel.author.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Caption */}
          <p className="text-xs sm:text-sm text-white/95 line-clamp-2 leading-relaxed font-normal drop-shadow-sm">
            {reel.caption || ''}
          </p>

          {/* Music Track Marquee */}
          <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
            <div className="p-1 rounded-full bg-black/40 backdrop-blur-sm">
              <Music size={12} className={isPlaying ? 'animate-bounce' : ''} />
            </div>
            <span className="truncate max-w-[220px]">
              {reel.musicTrack?.title || 'Original Audio'} • {reel.musicTrack?.artist || reel.author?.username || 'creator'}
            </span>
          </div>
        </div>

        {/* Right Floating Action Bar */}
        <div className="flex flex-col items-center gap-3.5 text-white">
          {/* Like Button */}
          <motion.button
            whileTap={{ scale: 0.75 }}
            animate={reel.isLiked ? { scale: [1, 1.35, 0.95, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeReel(reel.id);
              if (!reel.isLiked) {
                confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
              }
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div
              className={`p-2.5 rounded-full backdrop-blur-md shadow-soft-xs transition-all ${
                reel.isLiked
                  ? 'bg-rose-500 text-white'
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
            >
              <Heart size={22} className={reel.isLiked ? 'fill-white' : ''} />
            </div>
            <span className="text-[11px] font-bold drop-shadow-md">
              {reel.likesCount.toLocaleString()}
            </span>
          </motion.button>

          {/* Comment Drawer Button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(reel);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-soft-xs transition-colors">
              <MessageCircle size={22} />
            </div>
            <span className="text-[11px] font-bold drop-shadow-md">
              {reel.commentsCount}
            </span>
          </motion.button>

          {/* Share Sheet Button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(reel);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-soft-xs transition-colors">
              <Send size={20} />
            </div>
            <span className="text-[11px] font-bold drop-shadow-md">
              {reel.sharesCount || 0}
            </span>
          </motion.button>

          {/* Save / Bookmark Button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            animate={reel.isSaved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveReel(reel.id);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div
              className={`p-2.5 rounded-full backdrop-blur-md shadow-soft-xs transition-colors ${
                reel.isSaved
                  ? 'bg-amber-500 text-white'
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
            >
              <Bookmark size={20} className={reel.isSaved ? 'fill-white' : ''} />
            </div>
          </motion.button>

          {/* Suggested Reels Trigger */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenSuggested(reel);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="Suggested Reels"
          >
            <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-soft-xs text-amber-400">
              <Sparkles size={20} />
            </div>
          </motion.button>

          {/* Spinning Audio Vinyl Disc */}
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-700 border-2 border-white/60 flex items-center justify-center shadow-soft-xs ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '3s' }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
          </div>
        </div>
      </div>

      {/* Smooth Video Scrubbing Progress Bar (Bottom) */}
      <div
        ref={progressBarRef}
        onMouseEnter={() => setIsHoveringProgress(true)}
        onMouseLeave={() => setIsHoveringProgress(false)}
        onClick={handleProgressBarClick}
        className={`absolute bottom-0 inset-x-0 transition-all cursor-pointer z-30 ${
          isHoveringProgress ? 'h-2 bg-white/30' : 'h-1 bg-white/20'
        }`}
      >
        <div
          className="h-full bg-rose-500 relative transition-[width] duration-100 ease-linear rounded-r-full"
          style={{ width: `${progressPercent}%` }}
        >
          {isHoveringProgress && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md -mr-1.5" />
          )}
        </div>
      </div>
    </div>
  );
};
