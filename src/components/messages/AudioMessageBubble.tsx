import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, FastForward } from 'lucide-react';

interface AudioMessageBubbleProps {
  audioUrl?: string;
  duration?: number;
  isMe: boolean;
  timestamp: string;
}

export const AudioMessageBubble: React.FC<AudioMessageBubbleProps> = ({
  audioUrl,
  duration = 5,
  isMe,
  timestamp,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number>(duration);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Generate a pseudo-random yet deterministic waveform for the bubble
  const waveformHeights = useRef<number[]>(
    Array.from({ length: 24 }, (_, i) => {
      const v = Math.sin(i * 0.8) * 0.4 + Math.cos(i * 1.5) * 0.3 + 0.5;
      return Math.max(0.2, Math.min(1, v));
    })
  ).current;

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioUrl]);

  // Sync current time while playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const updateProgress = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          animFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };
      animFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) {
      // Fallback synthetic playback for demo if no real mediaUrl
      if (!isPlaying) {
        setIsPlaying(true);
        const start = Date.now();
        const dur = (audioDuration || 5) * 1000;
        const interval = setInterval(() => {
          const elapsed = (Date.now() - start) / 1000;
          if (elapsed >= audioDuration) {
            setIsPlaying(false);
            setCurrentTime(0);
            clearInterval(interval);
          } else {
            setCurrentTime(elapsed);
          }
        }, 100);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().catch((err) => {
        console.warn('Audio playback error:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (index: number) => {
    const targetTime = (index / waveformHeights.length) * (audioDuration || 1);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = audioDuration > 0 ? currentTime / audioDuration : 0;

  return (
    <div className="flex flex-col gap-1 select-none min-w-[200px] sm:min-w-[240px]">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all transform active:scale-90 cursor-pointer shadow-xs flex-shrink-0 ${
            isMe
              ? 'bg-white text-blue-600 hover:bg-blue-50'
              : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700'
          }`}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
        </button>

        {/* Waveform Visualization */}
        <div className="flex-1 flex items-center gap-[2.5px] h-8 cursor-pointer py-1" title="Click to seek">
          {waveformHeights.map((h, i) => {
            const barRatio = i / waveformHeights.length;
            const isPlayed = barRatio <= progressRatio;
            const barHeight = Math.max(6, Math.round(h * 26));

            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                className="flex-1 flex items-center justify-center h-full group/bar"
              >
                <div
                  style={{ height: `${barHeight}px` }}
                  className={`w-full rounded-full transition-all ${
                    isPlayed
                      ? isMe
                        ? 'bg-white shadow-xs'
                        : 'bg-blue-600 dark:bg-blue-400'
                      : isMe
                      ? 'bg-white/40 group-hover/bar:bg-white/70'
                      : 'bg-slate-300 dark:bg-neutral-600 group-hover/bar:bg-slate-400'
                  } ${isPlaying && isPlayed ? 'opacity-100' : ''}`}
                />
              </div>
            );
          })}
        </div>

        {/* Playback Speed Pill */}
        <button
          type="button"
          onClick={toggleSpeed}
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
            isMe
              ? 'bg-blue-700/60 text-white hover:bg-blue-700'
              : 'bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-300'
          }`}
          title="Change playback speed"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Footer Info: Duration & Timestamp */}
      <div className="flex items-center justify-between text-[10px] px-1 opacity-80">
        <span className={isMe ? 'text-blue-100' : 'text-slate-500 dark:text-neutral-400'}>
          {isPlaying ? formatTime(currentTime) : formatTime(audioDuration || 0)}
        </span>
        <div className="flex items-center gap-1.5">
          <Volume2 size={11} className={isMe ? 'text-blue-200' : 'text-slate-400'} />
          <span className={isMe ? 'text-blue-100' : 'text-slate-400'}>{timestamp}</span>
        </div>
      </div>
    </div>
  );
};
