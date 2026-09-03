import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Search,
  Play,
  Pause,
  Volume2,
  TrendingUp,
  Bookmark,
  Check,
  X,
  Sparkles,
  Flame,
  Radio,
} from 'lucide-react';
import { AudioTrack } from '../../types';
import { POPULAR_SOUNDTRACKS, AUDIO_CATEGORIES } from '../../data/trendingAudio';

interface AudioTrackSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: AudioTrack | null;
  onSelectTrack: (track: AudioTrack | null) => void;
}

export const AudioTrackSelectorModal: React.FC<AudioTrackSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedTrack,
  onSelectTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('instavibe_saved_sounds');
      return saved ? JSON.parse(saved) : ['track_1', 'track_4'];
    } catch {
      return ['track_1', 'track_4'];
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio on close or unmount
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlayTrack = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (track.audioUrl) {
      const audio = new Audio(track.audioUrl);
      audio.volume = 0.7;
      audio.play().catch((err) => console.warn('Audio preview play error:', err));
      audio.onended = () => setPlayingTrackId(null);
      audioRef.current = audio;
      setPlayingTrackId(track.id);
    }
  };

  const toggleSaveSound = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTrackIds((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];
      try {
        localStorage.setItem('instavibe_saved_sounds', JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save sound state:', err);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  // Filter tracks
  const filteredTracks = POPULAR_SOUNDTRACKS.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.category && track.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (searchQuery.trim()) return true;

    if (selectedCategory === 'For You') return true;
    if (selectedCategory === 'Trending') return track.isTrending;
    if (selectedCategory === 'Saved Sounds') return savedTrackIds.includes(track.id);

    return track.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl text-white flex flex-col max-h-[85vh] overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Music size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>Audio Track & Sounds</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1">
                  <Flame size={10} /> Real Music
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">Search and attach trending songs</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 pb-2">
          <div className="relative flex items-center bg-neutral-800/90 rounded-2xl px-3.5 py-2 border border-neutral-700/60 focus-within:border-pink-500 transition-colors">
            <Search size={16} className="text-neutral-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, or genres..."
              className="w-full bg-transparent text-sm text-white placeholder-neutral-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar">
            {AUDIO_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-rose-500/20 ring-1 ring-white/20'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700/80'
                }`}
              >
                {cat === 'Trending' && <TrendingUp size={12} />}
                {cat === 'Saved Sounds' && <Bookmark size={12} />}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Track Banner (If active) */}
        {selectedTrack && (
          <div className="mx-4 mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-pink-500/40 flex-shrink-0 relative">
                <img
                  src={selectedTrack.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80'}
                  alt={selectedTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-pink-400">
                  <Check size={14} />
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-pink-300 block truncate">
                  Currently Attached
                </span>
                <span className="text-xs font-semibold text-white block truncate">
                  {selectedTrack.title} • {selectedTrack.artist}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTrack(null)}
              className="text-xs font-bold text-neutral-400 hover:text-rose-400 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* Track List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <Music size={32} className="mx-auto text-neutral-600" />
              <p className="text-xs font-semibold">No audio tracks found</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Trending');
                }}
                className="text-xs text-pink-400 font-bold hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isSelected = selectedTrack?.id === track.id;
              const isPlaying = playingTrackId === track.id;
              const isSaved = savedTrackIds.includes(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    onSelectTrack(track);
                    onClose();
                  }}
                  className={`group p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/10 ring-1 ring-pink-500/30'
                      : 'border-neutral-800/80 bg-neutral-800/40 hover:bg-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  {/* Left: Thumbnail & Play button overlay */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={(e) => togglePlayTrack(track, e)}
                      className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 group/cover cursor-pointer shadow-md"
                    >
                      <img
                        src={
                          track.coverUrl ||
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover/cover:bg-black/60 flex items-center justify-center transition-colors">
                        {isPlaying ? (
                          <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                            <Pause size={12} className="fill-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/90 group-hover/cover:bg-white text-neutral-900 flex items-center justify-center shadow">
                            <Play size={11} className="fill-neutral-900 ml-0.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-pink-300 transition-colors">
                          {track.title}
                        </span>
                        {track.isTrending && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[9px] font-extrabold tracking-wide uppercase flex items-center gap-0.5">
                            <Flame size={9} /> Trending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="truncate">{track.artist}</span>
                        <span>•</span>
                        <span className="flex-shrink-0">{track.useCount || '1.2M'} reels</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Audio Wave / Save / Select buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Animated soundwave when playing */}
                    {isPlaying && (
                      <div className="flex items-center gap-0.5 h-4 px-2">
                        <span className="w-0.5 h-3 bg-pink-400 rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-pink-500 rounded-full animate-bounce" />
                        <span className="w-0.5 h-2 bg-pink-400 rounded-full animate-pulse" />
                      </div>
                    )}

                    {/* Bookmark sound */}
                    <button
                      type="button"
                      onClick={(e) => toggleSaveSound(track.id, e)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isSaved
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-700/60'
                      }`}
                      title={isSaved ? 'Sound saved' : 'Save sound'}
                    >
                      <Bookmark size={15} className={isSaved ? 'fill-amber-400' : ''} />
                    </button>

                    {/* Select button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(track);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-pink-500 text-white shadow-md'
                          : 'bg-neutral-800 group-hover:bg-pink-600 text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Use Audio'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Radio size={14} className="text-pink-400" />
            <span>Royalty-free Instagram licensed library</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-white hover:text-neutral-300 cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
