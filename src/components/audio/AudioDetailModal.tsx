import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  Bookmark,
  Share2,
  Music,
  Plus,
  Volume2,
  VolumeX,
  Film,
  Grid as GridIcon,
  Sparkles,
  TrendingUp,
  Check,
  Disc,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AudioTrack, Post, Reel } from '../../types';
import toast from 'react-hot-toast';
import { STORAGE_KEYS, safeGetJSON, safeSetJSON } from '../../constants/storage';

interface AudioDetailModalProps {
  track: AudioTrack | null;
  onClose: () => void;
  onUseSound: (track: AudioTrack) => void;
}

export const AudioDetailModal: React.FC<AudioDetailModalProps> = ({
  track,
  onClose,
  onUseSound,
}) => {
  const { currentUser, posts, reels, setSelectedPostForDetail, setSelectedUserProfile } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'reels' | 'posts'>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isSaved, setIsSaved] = useState(false);
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>(() => {
    return safeGetJSON<string[]>(STORAGE_KEYS.SAVED_SOUNDS, ['track_1', 'track_4']);
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (track) {
      setIsSaved(savedTrackIds.includes(track.id));
    }
  }, [track, savedTrackIds]);

  // Audio setup
  useEffect(() => {
    if (!track?.audioUrl) return;

    const audio = new Audio(track.audioUrl);
    audio.volume = 0.8;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.floor(audio.duration));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
      setIsPlaying(false);
    };
  }, [track]);

  if (!track) return null;

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio play error:', err);
          setIsPlaying(false);
        });
    }
  };

  const toggleSaveSound = () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    const updated = nextSaved
      ? [...savedTrackIds, track.id]
      : savedTrackIds.filter((id) => id !== track.id);

    setSavedTrackIds(updated);
    safeSetJSON(STORAGE_KEYS.SAVED_SOUNDS, updated);

    // Also notify backend if endpoint is available
    if (currentUser?.id) {
      fetch('/api/audio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id, userId: currentUser.id }),
      }).catch(() => {});
    }

    if (nextSaved) {
      toast.success('Audio saved to your collection');
    } else {
      toast('Audio removed from saved', { icon: '🗑️' });
    }
  };

  const handleShareSound = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Audio link copied to clipboard!');
    } else {
      toast.success('Sharing sound...');
    }
  };

  // Find posts and reels matching this track
  const matchingPosts = posts.filter((p) => {
    if (!p.musicTrack) return false;
    const title = typeof p.musicTrack === 'string' ? p.musicTrack : p.musicTrack.title;
    return (
      title.toLowerCase() === track.title.toLowerCase() ||
      title.toLowerCase().includes(track.title.toLowerCase()) ||
      track.title.toLowerCase().includes(title.toLowerCase())
    );
  });

  const matchingReels = reels.filter((r) => {
    if (!r.musicTrack) return false;
    const title = typeof r.musicTrack === 'string' ? r.musicTrack : r.musicTrack.title;
    return (
      title.toLowerCase() === track.title.toLowerCase() ||
      title.toLowerCase().includes(track.title.toLowerCase()) ||
      track.title.toLowerCase().includes(title.toLowerCase())
    );
  });

  const totalContentCount =
    matchingPosts.length + matchingReels.length > 0
      ? matchingPosts.length + matchingReels.length
      : track.useCount || '1.8K';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full h-full sm:h-[90vh] sm:max-h-[820px] sm:max-w-2xl bg-white dark:bg-neutral-950 sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Sticky Navigation Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 -ml-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="truncate">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                  Audio Hub
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                  {track.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleShareSound}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                title="Share Sound"
              >
                <Share2 size={19} />
              </button>
              <button
                onClick={toggleSaveSound}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isSaved
                    ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title={isSaved ? 'Audio Saved' : 'Save Audio'}
              >
                <Bookmark size={19} className={isSaved ? 'fill-yellow-500' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            {/* Audio Hero Section */}
            <div className="p-5 sm:p-6 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-950 border-b border-neutral-100 dark:border-neutral-900">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Vinyl Record + Album Art Visual */}
                <div className="relative group shrink-0">
                  {/* Sliding/Spinning Vinyl behind cover */}
                  <div
                    className={`absolute -right-4 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center shadow-lg transition-transform duration-500 ${
                      isPlaying ? 'rotate-180 translate-x-3' : 'translate-x-0'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-500/80 border border-white/40 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-neutral-900" />
                    </div>
                  </div>

                  {/* Album Cover Art */}
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-soft-xl border border-neutral-200/80 dark:border-neutral-800 z-10 bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={
                        track.coverUrl ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'
                      }
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {/* Play/Pause Overlay Button */}
                    <button
                      onClick={togglePlayAudio}
                      className="absolute inset-0 bg-black/35 hover:bg-black/45 flex items-center justify-center text-white transition-all cursor-pointer group-hover:scale-105"
                      title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 text-neutral-950 flex items-center justify-center shadow-lg backdrop-blur-sm">
                        {isPlaying ? (
                          <Pause size={22} className="fill-neutral-950" />
                        ) : (
                          <Play size={22} className="fill-neutral-950 ml-0.5" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Track Details & Actions */}
                <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                      <TrendingUp size={11} /> Trending Sound
                    </span>
                    {track.category && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {track.category}
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
                    {track.title}
                  </h1>
                  <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                    {track.artist}
                  </p>

                  <p className="text-xs text-neutral-400">
                    {typeof totalContentCount === 'number'
                      ? `${totalContentCount} posts & reels`
                      : `${totalContentCount} reels created with this audio`}
                  </p>

                  {/* Audio Waveform / Scrubber Bar */}
                  <div className="pt-1 flex items-center gap-3 max-w-sm mx-auto sm:mx-0">
                    <button
                      onClick={togglePlayAudio}
                      className="p-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white cursor-pointer hover:scale-105 transition-transform"
                    >
                      {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    <div className="flex-1 flex items-center gap-1 h-6">
                      {[40, 65, 80, 50, 95, 70, 45, 85, 100, 60, 40, 75, 90, 55, 35, 80, 65, 50].map(
                        (h, idx) => {
                          const active = isPlaying && idx < (currentTime / duration) * 18;
                          return (
                            <span
                              key={idx}
                              style={{ height: `${h}%` }}
                              className={`flex-1 rounded-full transition-colors ${
                                active
                                  ? 'bg-pink-500 animate-pulse'
                                  : 'bg-neutral-300 dark:bg-neutral-700'
                              }`}
                            />
                          );
                        }
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Prominent Gradient CTA Button: "Use Sound" */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      onClick={() => {
                        onClose();
                        onUseSound(track);
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-soft-md transition-transform active:scale-95 cursor-pointer"
                    >
                      <Plus size={18} className="stroke-[2.5px]" />
                      <span>Use Sound</span>
                    </button>

                    <button
                      onClick={toggleSaveSound}
                      className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Bookmark size={15} className={isSaved ? 'fill-current' : ''} />
                      <span>{isSaved ? 'Saved Audio' : 'Save Audio'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs for Media Content */}
            <div className="flex items-center justify-around border-b border-neutral-100 dark:border-neutral-900 px-4 mt-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
              >
                <GridIcon size={15} />
                <span>All ({matchingPosts.length + matchingReels.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reels')}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'reels'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
              >
                <Film size={15} />
                <span>Reels ({matchingReels.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('posts')}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'posts'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
              >
                <GridIcon size={15} />
                <span>Posts ({matchingPosts.length})</span>
              </button>
            </div>

            {/* Media Grid Section */}
            <div className="p-3 sm:p-4">
              {/* Reels Grid (Vertical) */}
              {(activeTab === 'all' || activeTab === 'reels') && matchingReels.length > 0 && (
                <div className="mb-6">
                  {activeTab === 'all' && (
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1">
                      <Film size={14} /> Reels using this audio
                    </h4>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {matchingReels.map((reel) => (
                      <div
                        key={reel.id}
                        onClick={() => {
                          onClose();
                          // Navigate to reels tab or view
                          window.location.hash = `#reel-${reel.id}`;
                        }}
                        className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 cursor-pointer shadow-soft-xs"
                      >
                        <img
                          src={reel.posterUrl || reel.videoUrl}
                          alt={reel.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                        <div className="absolute bottom-2 left-2 right-2 text-white">
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <Play size={10} className="fill-white" />
                            <span>{reel.viewsCount?.toLocaleString() || '1.2K'}</span>
                          </div>
                          <p className="text-[10px] text-white/90 truncate mt-0.5">
                            @{reel.author.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Grid (Square) */}
              {(activeTab === 'all' || activeTab === 'posts') && matchingPosts.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1">
                      <GridIcon size={14} /> Feed Posts
                    </h4>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {matchingPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          onClose();
                          setSelectedPostForDetail(post);
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 cursor-pointer shadow-soft-xs"
                      >
                        <img
                          src={post.media[0]?.url}
                          alt={post.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                          <span>❤️ {post.likesCount}</span>
                          <span>💬 {post.commentsCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State if no posts/reels yet */}
              {matchingPosts.length === 0 && matchingReels.length === 0 && (
                <div className="py-12 px-4 text-center space-y-3 max-w-sm mx-auto">
                  <div className="w-14 h-14 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto">
                    <Music size={28} />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                    Be the first to create with this sound!
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    No posts or reels have used &ldquo;{track.title}&rdquo; yet. Create something awesome
                    and start the trend.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onUseSound(track);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-soft-sm"
                  >
                    <Plus size={14} />
                    <span>Create with {track.title}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
