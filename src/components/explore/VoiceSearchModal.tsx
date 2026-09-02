import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Sparkles, Volume2, AlertCircle } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onTranscript,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number[]>([40, 65, 30, 85, 55, 95, 45, 70, 35]);
  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check Web Speech API support
  const isSpeechSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');

    if (!isSpeechSupported) {
      setErrorMessage('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please try speaking again.');
        } else {
          setErrorMessage(`Recognition issue (${event.error}). Please try again.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setErrorMessage('Could not initialize microphone: ' + err.message);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Animate sound waves when listening
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setAudioLevel([
          Math.floor(20 + Math.random() * 80),
          Math.floor(30 + Math.random() * 70),
          Math.floor(40 + Math.random() * 60),
          Math.floor(60 + Math.random() * 40),
          Math.floor(80 + Math.random() * 20),
          Math.floor(50 + Math.random() * 50),
          Math.floor(30 + Math.random() * 70),
          Math.floor(40 + Math.random() * 60),
          Math.floor(25 + Math.random() * 65),
        ]);
      }, 120);
      return () => clearInterval(interval);
    }
  }, [isListening]);

  // Start listening automatically on open
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
      setTranscript('');
      setErrorMessage(null);
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  const handleApply = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-2 text-neutral-900 dark:text-white">
          <Sparkles size={18} className="text-pink-500" />
          <h3 className="font-bold text-lg">Voice Search</h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {isListening ? 'Listening... Speak a creator name, topic, or #hashtag' : 'Tap the microphone to speak'}
        </p>

        {/* Dynamic Waveform Visualizer */}
        <div className="h-24 flex items-center justify-center gap-1.5 my-4">
          {audioLevel.map((height, idx) => (
            <motion.div
              key={idx}
              animate={{
                height: isListening ? `${height}%` : '8px',
                opacity: isListening ? 1 : 0.3,
              }}
              transition={{ duration: 0.15 }}
              className={`w-2 rounded-full ${
                isListening
                  ? 'bg-gradient-to-t from-pink-500 to-amber-400'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {/* Transcript Box */}
        <div className="min-h-16 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-6">
          {transcript ? (
            <p className="text-sm font-semibold text-neutral-900 dark:text-white break-words">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs text-neutral-400 italic">
              {isListening ? 'Say something like "Tokyo streetwear photography"...' : 'Waiting for voice input...'}
            </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 text-left">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-lg cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:scale-105'
            }`}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {transcript && (
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-amber-500 text-white font-bold text-xs rounded-2xl shadow-soft hover:opacity-95 transition-opacity cursor-pointer active:scale-95"
            >
              Search "{transcript.slice(0, 15)}..."
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
