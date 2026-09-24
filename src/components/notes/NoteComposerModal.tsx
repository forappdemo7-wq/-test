import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Music,
  Trash2,
  Users,
  Star,
  Play,
  Pause,
  Check,
  Sparkles,
  Volume2,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AudioTrack } from '../../types';
import { POPULAR_SOUNDTRACKS } from '../../data/trendingAudio';
import toast from 'react-hot-toast';

interface NoteComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareNote: (
    text: string,
    emoji: string,
    musicTrack: AudioTrack | null,
    audience: 'followers_you_follow_back' | 'close_friends'
  ) => void;
  onDeleteNote: () => void;
  existingNote?: {
    text: string;
    emoji?: string;
    musicTrack?: any;
    audience?: 'followers_you_follow_back' | 'close_friends';
  } | null;
}

const EMOJI_OPTIONS = ['💭', '🎧', '✨', '🔥', '☕', '😴', '🍕', '🏝️', '🎬', '📚', '⚡', '🌙'];

export const NoteComposerModal: React.FC<NoteComposerModalProps> = ({
  isOpen,
  onClose,
  onShareNote,
  onDeleteNote,
  existingNote,
}) => {
  const { currentUser } = useApp();

  const [text, setText] = useState(existingNote?.text || '');
  const [selectedEmoji, setSelectedEmoji] = useState(existingNote?.emoji || '💭');
  const [audience, setAudience] = useState<'followers_you_follow_back' | 'close_friends'>(
    existingNote?.audience || 'followers_you_follow_back'
  );
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(
    typeof existingNote?.musicTrack === 'object' ? existingNote.musicTrack : null
  );

  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (existingNote) {
      setText(existingNote.text || '');
      setSelectedEmoji(existingNote.emoji || '💭');
      setAudience(existingNote.audience || 'followers_you_follow_back');
      if (existingNote.musicTrack && typeof existingNote.musicTrack === 'object') {
        setSelectedTrack(existingNote.musicTrack);
      }
    }
  }, [existingNote]);

  // Audio preview cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handlePreviewAudio = (e: React.MouseEvent, track: AudioTrack) => {
    e.stopPropagation();
    if (previewTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPreviewTrackId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (track.audioUrl) {
      const audio = new Audio(track.audioUrl);
      audio.volume = 0.7;
      audio.onended = () => setPreviewTrackId(null);
      audio
        .play()
        .then(() => {
          audioRef.current = audio;
          setPreviewTrackId(track.id);
        })
        .catch(() => setPreviewTrackId(null));
    }
  };

  const handleSelectTrack = (track: AudioTrack) => {
    setSelectedTrack(track);
    setIsAudioPickerOpen(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewTrackId(null);
    }
    toast.success(`Attached "${track.title}" to your note`);
  };

  const handleRemoveTrack = () => {
    setSelectedTrack(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewTrackId(null);
    }
  };

  const handleShare = () => {
    if (!text.trim()) {
      toast.error('Please write a thought for your note');
      return;
    }
    onShareNote(text.trim().slice(0, 60), selectedEmoji, selectedTrack, audience);
    onClose();
  };

  const filteredTracks = POPULAR_SOUNDTRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            {existingNote?.text ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={handleShare}
            disabled={!text.trim()}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            Share
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Visual Avatar & Floating Thought Bubble */}
          <div className="flex flex-col items-center pt-2">
            <div className="relative flex flex-col items-center">
              {/* The Floating Thought Bubble */}
              <div className="relative z-10 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl p-3 shadow-soft-md max-w-[280px] w-full text-center">
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <span className="text-lg">{selectedEmoji}</span>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 60))}
                    placeholder="Share a thought..."
                    maxLength={60}
                    autoFocus
                    className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden text-center"
                  />
                </div>

                {/* Music Badge preview inside bubble if attached */}
                {selectedTrack && (
                  <div className="mt-1.5 pt-1.5 border-t border-neutral-200/60 dark:border-neutral-700 flex items-center justify-between gap-1 text-[10px] text-pink-600 dark:text-pink-400 font-bold px-1">
                    <div className="flex items-center gap-1 truncate">
                      <Music size={11} className="animate-pulse shrink-0" />
                      <span className="truncate">
                        {selectedTrack.title} • {selectedTrack.artist}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveTrack}
                      className="p-0.5 text-neutral-400 hover:text-red-500 cursor-pointer"
                      title="Remove music"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Speech bubble tail dots pointing down */}
              <div className="w-3 h-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-full my-0.5 shadow-soft-xs" />
              <div className="w-1.5 h-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-full mb-1" />

              {/* User Avatar */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-soft-md">
                <img
                  src={
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser?.name || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <span className="text-[11px] font-semibold text-neutral-400 mt-2">
              {60 - text.length} characters left
            </span>
          </div>

          {/* Quick Emoji Bar */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 block">
              Choose an emoji
            </label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-transform cursor-pointer shrink-0 ${
                    selectedEmoji === emoji
                      ? 'bg-blue-500/15 ring-2 ring-blue-500 scale-110'
                      : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Attach Music Button / Card */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
              Music
            </label>
            {selectedTrack ? (
              <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-200">
                    <img
                      src={
                        selectedTrack.coverUrl ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={selectedTrack.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {selectedTrack.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate">{selectedTrack.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAudioPickerOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 rounded-lg cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveTrack}
                    className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg cursor-pointer"
                    title="Remove music"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAudioPickerOpen(true)}
                className="w-full p-3 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-pink-500 hover:bg-pink-500/5 transition-colors flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-medium text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Music size={16} />
                  </div>
                  <span>Add a song to your note</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400" />
              </button>
            )}
          </div>

          {/* Share with Audience */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
              Shared with
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAudience('followers_you_follow_back')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  audience === 'followers_you_follow_back'
                    ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Users size={16} />
                  {audience === 'followers_you_follow_back' && <Check size={14} />}
                </div>
                <span className="text-xs font-bold">Followers you follow back</span>
              </button>

              <button
                type="button"
                onClick={() => setAudience('close_friends')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  audience === 'close_friends'
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Star size={16} className="fill-emerald-500 text-emerald-500" />
                  {audience === 'close_friends' && <Check size={14} />}
                </div>
                <span className="text-xs font-bold">Close Friends</span>
              </button>
            </div>
          </div>

          {/* Delete Note Option if note exists */}
          {existingNote?.text && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  onDeleteNote();
                  onClose();
                }}
                className="w-full py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete note</span>
              </button>
            </div>
          )}
        </div>

        {/* Nested Audio Picker Drawer */}
        <AnimatePresence>
          {isAudioPickerOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-white dark:bg-neutral-900 z-30 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => setIsAudioPickerOpen(false)}
                  className="p-1 text-neutral-500 hover:text-neutral-800 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">Choose Music</h3>
                <div className="w-6" />
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    placeholder="Search songs or artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Audio Tracks List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredTracks.map((track) => {
                  const isPreviewing = previewTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                          <img
                            src={
                              track.coverUrl ||
                              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={track.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => handlePreviewAudio(e, track)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                          >
                            {isPreviewing ? (
                              <Pause size={14} className="fill-white" />
                            ) : (
                              <Play size={14} className="fill-white ml-0.5" />
                            )}
                          </button>
                        </div>
                        <div className="truncate">
                          <h5 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {track.title}
                          </h5>
                          <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-pink-500 shrink-0">Select</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
