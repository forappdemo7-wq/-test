import React, { useState, useRef } from 'react';
import { Plus, Music, Play, Pause, Volume2, Sparkles, Disc } from 'lucide-react';
import { User, AudioTrack } from '../../types';

interface NotesTrayProps {
  currentUser: User | null;
  usersWithNotes: User[];
  isUserOnline: (userId: string) => boolean;
  onOpenComposer: () => void;
  onSelectUserNote: (user: User) => void;
  onOpenAudioHub?: (track: AudioTrack) => void;
}

export const NotesTray: React.FC<NotesTrayProps> = ({
  currentUser,
  usersWithNotes,
  isUserOnline,
  onOpenComposer,
  onSelectUserNote,
  onOpenAudioHub,
}) => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleInlineAudioToggle = (e: React.MouseEvent, track: AudioTrack) => {
    e.stopPropagation();
    if (!track.audioUrl) return;

    if (playingTrackId === track.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(track.audioUrl);
      audio.volume = 0.65;
      audio.onended = () => setPlayingTrackId(null);
      audio
        .play()
        .then(() => {
          audioRef.current = audio;
          setPlayingTrackId(track.id);
        })
        .catch(() => setPlayingTrackId(null));
    }
  };

  const userNote = currentUser?.note;
  const userMusicTrack =
    typeof userNote?.musicTrack === 'object' && userNote.musicTrack !== null
      ? (userNote.musicTrack as AudioTrack)
      : null;

  return (
    <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-3 px-2">
      {/* Current User Note / Add Note */}
      <div
        onClick={onOpenComposer}
        className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none"
      >
        <div className="relative pt-6">
          {/* Note Thought Bubble */}
          {userNote?.text ? (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center group-hover:scale-105 transition-transform">
              <div className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-700 shadow-soft-sm px-2.5 py-1 rounded-2xl text-[10px] font-semibold flex items-center gap-1 max-w-[100px] truncate animate-in zoom-in-90">
                <span>{userNote.emoji || '💭'}</span>
                <span className="truncate">{userNote.text}</span>

                {userMusicTrack && (
                  <button
                    onClick={(e) => handleInlineAudioToggle(e, userMusicTrack)}
                    className="ml-0.5 p-0.5 text-pink-500 hover:text-pink-600 rounded-full cursor-pointer"
                    title={`Play ${userMusicTrack.title}`}
                  >
                    {playingTrackId === userMusicTrack.id ? (
                      <Pause size={10} className="fill-current animate-pulse" />
                    ) : (
                      <Music size={10} />
                    )}
                  </button>
                )}
              </div>

              {/* Bubble Tail Dots */}
              <div className="w-2 h-2 bg-white dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 rounded-full my-0.5" />
              <div className="w-1 h-1 bg-white dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 rounded-full" />
            </div>
          ) : (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft-xs flex items-center gap-0.5 group-hover:scale-105 transition-transform">
              <Plus size={10} /> Note
            </div>
          )}

          {/* User Avatar */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 group-hover:border-neutral-400 dark:group-hover:border-neutral-600 transition-all">
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.name || currentUser?.username || 'User'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[75px]">
          Your note
        </span>
      </div>

      {/* Friends Notes List */}
      {usersWithNotes.map((friend) => {
        const friendNote = friend.note;
        if (!friendNote?.text) return null;

        const friendMusic =
          typeof friendNote.musicTrack === 'object' && friendNote.musicTrack !== null
            ? (friendNote.musicTrack as AudioTrack)
            : null;

        return (
          <div
            key={friend.id}
            onClick={() => onSelectUserNote(friend)}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none"
          >
            <div className="relative pt-6">
              {/* Note Speech Bubble */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center group-hover:scale-105 transition-transform">
                <div className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-700 shadow-soft-sm px-2.5 py-1 rounded-2xl text-[10px] font-semibold flex items-center gap-1 max-w-[100px] truncate">
                  <span>{friendNote.emoji || '💭'}</span>
                  <span className="truncate">{friendNote.text}</span>

                  {friendMusic && (
                    <button
                      onClick={(e) => handleInlineAudioToggle(e, friendMusic)}
                      className="ml-0.5 p-0.5 text-pink-500 hover:text-pink-600 rounded-full cursor-pointer"
                      title={`Play ${friendMusic.title}`}
                    >
                      {playingTrackId === friendMusic.id ? (
                        <Pause size={10} className="fill-current animate-pulse" />
                      ) : (
                        <Music size={10} />
                      )}
                    </button>
                  )}
                </div>

                {/* Bubble Tail Dots */}
                <div className="w-2 h-2 bg-white dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 rounded-full my-0.5" />
                <div className="w-1 h-1 bg-white dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700 rounded-full" />
              </div>

              {/* Avatar */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 group-hover:border-neutral-400 dark:group-hover:border-neutral-600 transition-all">
                <img
                  src={friend.avatar}
                  alt={friend.name || friend.username}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {isUserOnline(friend.id) && (
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-neutral-950" />
                )}
              </div>
            </div>

            <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mt-1 truncate max-w-[75px]">
              {friend.username}
            </span>
          </div>
        );
      })}
    </div>
  );
};
