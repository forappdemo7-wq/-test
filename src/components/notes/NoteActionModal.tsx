import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Send,
  Music,
  Play,
  Pause,
  ExternalLink,
  Volume2,
  Disc,
} from 'lucide-react';
import { User, AudioTrack } from '../../types';
import toast from 'react-hot-toast';

interface NoteActionModalProps {
  user: User | null;
  onClose: () => void;
  onSendReply: (user: User, replyText: string) => void;
  onOpenAudioHub?: (track: AudioTrack) => void;
}

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '😢'];

export const NoteActionModal: React.FC<NoteActionModalProps> = ({
  user,
  onClose,
  onSendReply,
  onOpenAudioHub,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const note = user?.note;
  const musicTrack =
    typeof note?.musicTrack === 'object' && note.musicTrack !== null
      ? (note.musicTrack as AudioTrack)
      : null;

  // Cleanup audio preview
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!user || !note) return null;

  const togglePlayMusic = () => {
    if (!musicTrack?.audioUrl) return;

    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(musicTrack.audioUrl);
      audio.volume = 0.7;
      audio.onended = () => setIsPlayingAudio(false);
      audio
        .play()
        .then(() => {
          audioRef.current = audio;
          setIsPlayingAudio(true);
        })
        .catch(() => setIsPlayingAudio(false));
    }
  };

  const handleSend = () => {
    if (!replyText.trim()) return;
    onSendReply(user, replyText.trim());
    onClose();
  };

  const handleQuickReaction = (emoji: string) => {
    onSendReply(user, emoji);
    toast.success(`Reacted ${emoji} to @${user.username}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="truncate">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              @{user.username}&apos;s note
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Note Visual Showcase */}
        <div className="p-6 flex flex-col items-center bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-900">
          <div className="relative flex flex-col items-center">
            {/* Thought Bubble */}
            <div className="relative z-10 bg-white dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 rounded-2xl p-4 shadow-soft-lg max-w-[260px] text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{note.emoji || '💭'}</span>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-snug break-words">
                  {note.text}
                </p>
              </div>

              {/* Music Attachment Pill */}
              {musicTrack && (
                <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-700/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={togglePlayMusic}
                      className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-xs cursor-pointer shrink-0"
                    >
                      {isPlayingAudio ? (
                        <Pause size={10} className="fill-white" />
                      ) : (
                        <Play size={10} className="fill-white ml-0.5" />
                      )}
                    </button>
                    <div className="truncate text-left">
                      <p className="text-[10px] font-bold text-pink-600 dark:text-pink-400 truncate">
                        {musicTrack.title}
                      </p>
                      <p className="text-[9px] text-neutral-400 truncate">{musicTrack.artist}</p>
                    </div>
                  </div>

                  {onOpenAudioHub && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAudioHub(musicTrack);
                      }}
                      className="p-1 text-neutral-400 hover:text-pink-500 rounded-md cursor-pointer shrink-0"
                      title="Open Audio Hub"
                    >
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bubble Tail Dots */}
            <div className="w-3 h-3 bg-white dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 rounded-full my-0.5 shadow-soft-xs" />
            <div className="w-1.5 h-1.5 bg-white dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 rounded-full mb-1" />

            {/* User Avatar */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-soft-md">
              <img
                src={user.avatar}
                alt={user.name || user.username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-2.5">
            {user.name || user.username}
          </span>
          <span className="text-[11px] text-neutral-400">Shared for 24 hours</span>
        </div>

        {/* Quick Emoji Reaction Bar */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-around">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform p-1 cursor-pointer active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Reply Input Bar */}
        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Reply to ${user.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden"
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim()}
            className="p-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition-opacity cursor-pointer shadow-soft-xs"
          >
            <Send size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
