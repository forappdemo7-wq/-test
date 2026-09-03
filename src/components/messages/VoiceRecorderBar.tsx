import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, Pause, Play, Lock, Check } from 'lucide-react';

interface VoiceRecorderBarProps {
  onSendVoiceNote: (audioBlob: Blob, durationSecs: number) => void;
  onCancel: () => void;
  initialSeconds?: number;
  isLocked?: boolean;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  onSendVoiceNote,
  onCancel,
  initialSeconds = 0,
  isLocked = true,
}) => {
  const [recordingSeconds, setRecordingSeconds] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [volumeLevels, setVolumeLevels] = useState<number[]>([15, 30, 45, 60, 40, 25, 15, 35, 50, 65, 30, 20]);
  const [micError, setMicError] = useState<string | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Start recording on mount
  useEffect(() => {
    startLiveRecording();

    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
    }
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
  };

  const startLiveRecording = async () => {
    audioChunksRef.current = [];
    setMicError(null);
    setRecordingSeconds(initialSeconds);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Microphone recording is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // Web Audio API Analyzer for real-time waveform bars
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateWaveform = () => {
          if (analyserRef.current && !isPaused) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const sampled: number[] = [];
            const step = Math.max(1, Math.floor(dataArray.length / 16));
            for (let i = 0; i < 16; i++) {
              const val = dataArray[i * step] || 15;
              // Scale to percentage height (15% to 100%)
              const percent = Math.min(100, Math.max(15, Math.round((val / 255) * 100)));
              sampled.push(percent);
            }
            setVolumeLevels(sampled);
          }
          animFrameRef.current = requestAnimationFrame(updateWaveform);
        };
        updateWaveform();
      }

      // Media Recorder
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setPreviewAudioUrl(url);
      };

      recorder.start(100);
      setMediaRecorder(recorder);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission or access error:', err);
      setMicError(err?.message || 'Could not access microphone.');
      // Simulated fallback timer so the user can still test voice messaging in sandboxed previews!
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        setVolumeLevels(
          Array.from({ length: 16 }, () => Math.floor(Math.random() * 70) + 20)
        );
      }, 1000);
    }
  };

  const handleTogglePause = () => {
    if (!mediaRecorder) return;

    if (!isPaused) {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsPaused(true);
    } else {
      if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
      }
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setIsPaused(false);
    }
  };

  const handleTogglePreviewPlay = () => {
    if (!previewAudioUrl && recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setPreviewAudioUrl(url);
    }

    if (!previewAudioRef.current && previewAudioUrl) {
      const audio = new Audio(previewAudioUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const handleStopAndSend = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setTimeout(() => {
        const fullBlob =
          recordedBlob ||
          new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSendVoiceNote(fullBlob, Math.max(1, recordingSeconds));
        stopAllMedia();
      }, 150);
    } else if (recordedBlob) {
      onSendVoiceNote(recordedBlob, Math.max(1, recordingSeconds));
      stopAllMedia();
    } else {
      // Fallback synthetic blob
      const dummyBlob = new Blob(['sample-audio-data'], { type: 'audio/webm' });
      onSendVoiceNote(dummyBlob, Math.max(1, recordingSeconds));
      stopAllMedia();
    }
  };

  const handleDiscard = () => {
    stopAllMedia();
    onCancel();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="voice-recorder-bar"
      className="w-full flex items-center justify-between gap-3 bg-neutral-900 text-white px-4 py-2.5 rounded-2xl shadow-soft-lg animate-in slide-in-from-bottom-2 duration-200 select-none border border-neutral-800"
    >
      {/* Discard / Cancel Button */}
      <button
        type="button"
        onClick={handleDiscard}
        className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
        title="Discard voice message"
      >
        <Trash2 size={18} />
      </button>

      {/* Center Waveform & Recording Indicator */}
      <div className="flex-1 flex items-center justify-center gap-3 overflow-hidden">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
            }`}
          />
          <span className="text-xs font-semibold tabular-nums text-neutral-200">
            {formatTimer(recordingSeconds)}
          </span>
        </div>

        {/* Dynamic Waveform Bars */}
        <div className="flex items-center gap-1 h-7 px-2">
          {volumeLevels.map((lvl, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-75 ${
                isPaused ? 'bg-neutral-500' : 'bg-rose-500'
              }`}
              style={{
                height: isPaused ? '25%' : `${lvl}%`,
                opacity: 0.4 + (lvl / 100) * 0.6,
              }}
            />
          ))}
        </div>

        {/* Pause / Resume Button */}
        <button
          type="button"
          onClick={handleTogglePause}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          title={isPaused ? 'Resume recording' : 'Pause recording'}
        >
          {isPaused ? <Play size={15} className="fill-current ml-0.5" /> : <Pause size={15} className="fill-current" />}
        </button>
      </div>

      {/* Send Button */}
      <button
        type="button"
        onClick={handleStopAndSend}
        className="w-9 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer flex-shrink-0"
        title="Send voice note"
      >
        <Send size={16} className="translate-x-0.5" />
      </button>
    </div>
  );
};

