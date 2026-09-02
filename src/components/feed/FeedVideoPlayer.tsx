import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface FeedVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  filter?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  onDoubleTap?: () => void;
}

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  filter,
  aspectRatio = 'square',
  onDoubleTap,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayStateIndicator, setShowPlayStateIndicator] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);

  const lastTapRef = useRef<number>(0);

  // Viewport-based IntersectionObserver to autoplay when visible, pause when scrolled away
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            // Autoplay muted when in viewport
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                // Autoplay blocked without user interaction
                setIsPlaying(false);
              });
          } else {
            // Scrolled out of viewport -> Pause immediately
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0.2, 0.55, 0.8],
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (video) {
        video.pause();
      }
    };
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleContainerClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered
      if (onDoubleTap) onDoubleTap();
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    // Single tap after delay: Toggle play/pause
    setTimeout(() => {
      if (lastTapRef.current === now) {
        togglePlayPause();
      }
    }, DOUBLE_TAP_DELAY + 20);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setShowPlayStateIndicator(true);
    setTimeout(() => setShowPlayStateIndicator(false), 700);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : aspectRatio === 'landscape'
      ? 'aspect-[1.91/1]'
      : 'aspect-square';

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative w-full ${aspectClass} bg-neutral-950 overflow-hidden cursor-pointer select-none`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        playsInline
        muted={isMuted}
        loop
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        className={`w-full h-full object-cover will-change-transform ${
          filter ? `filter-${filter}` : ''
        }`}
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="w-10 h-10 rounded-full border-3 border-white/40 border-t-white animate-spin" />
        </div>
      )}

      {/* Play / Pause Animated Center Feedback */}
      <AnimatePresence>
        {showPlayStateIndicator && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-soft-lg">
              {isPlaying ? <Play size={28} className="fill-white ml-1" /> : <Pause size={28} className="fill-white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Volume / Sound Pill */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2 rounded-full bg-black/65 backdrop-blur-md text-white border border-white/10 shadow-soft-sm hover:bg-black/80 transition-colors z-10"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-pink-400" />}
      </motion.button>

      {/* Video Playback Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
