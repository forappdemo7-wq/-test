import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Sparkles,
  MapPin,
  Music,
  Check,
  Image as ImageIcon,
  Clapperboard,
  Loader2,
  Crop,
  RotateCcw,
  Star,
  BarChart2,
  HelpCircle,
  Plus,
  Trash2,
  Globe,
  Headphones,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Calendar,
  Save,
  FileText,
  Flame,
  Volume2,
  Disc,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  FilterType,
  StoryPollSticker,
  StoryQuestionSticker,
  StoryMusicSticker,
  PostMedia,
  AudioTrack,
  PostDraft,
} from '../../types';
import { ImageCropper } from './ImageCropper';
import { AudioTrackSelectorModal } from './AudioTrackSelectorModal';
import { POPULAR_SOUNDTRACKS } from '../../data/trendingAudio';
import toast from 'react-hot-toast';

export const CreateModal: React.FC = () => {
  const {
    isCreateOpen,
    setIsCreateOpen,
    createNewPost,
    addNewStory,
    createNewReel,
    currentUser,
    celebrateAction,
    drafts,
    saveDraft,
    deleteDraft,
    schedulePost,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const [createType, setCreateType] = useState<'post' | 'story' | 'reel'>('post');

  // Multi-media Carousel State
  const [selectedMediaList, setSelectedMediaList] = useState<PostMedia[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isCropping, setIsCropping] = useState<boolean>(false);

  // Audio track state
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Metadata form
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Scheduling & Drafts
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);

  // Story specific options
  const [storyAudience, setStoryAudience] = useState<'everyone' | 'close_friends'>('everyone');
  const [pollSticker, setPollSticker] = useState<StoryPollSticker | null>(null);
  const [questionSticker, setQuestionSticker] = useState<StoryQuestionSticker | null>(null);
  const [activeStickerModal, setActiveStickerModal] = useState<'none' | 'poll' | 'question'>('none');

  // Temporary sticker form states
  const [tempPollQuestion, setTempPollQuestion] = useState('Ask a question...');
  const [tempPollOpt1, setTempPollOpt1] = useState('YES');
  const [tempPollOpt2, setTempPollOpt2] = useState('NO');
  const [tempQuestionPrompt, setTempQuestionPrompt] = useState('Ask me anything');

  // AI caption generation state
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'aesthetic' | 'playful' | 'poetic' | 'trendy' | 'minimalist'>('aesthetic');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);

  // Filters list
  const filters: { id: FilterType; label: string }[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'clarendon', label: 'Clarendon' },
    { id: 'juno', label: 'Juno' },
    { id: 'lark', label: 'Lark' },
    { id: 'valencia', label: 'Valencia' },
    { id: 'gingham', label: 'Gingham' },
    { id: 'moon', label: 'Moon' },
    { id: 'slumber', label: 'Slumber' },
  ];

  if (!isCreateOpen) return null;

  const currentMediaItem = selectedMediaList[activeMediaIndex] || selectedMediaList[0];

  const handleAddFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Carousel post limit: 10 items
    const remainingSlots = Math.max(0, 10 - selectedMediaList.length);
    const filesToProcess = fileArray.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      toast.error('Maximum 10 items allowed per post');
      return;
    }

    setIsUploading(true);
    let loadedCount = 0;
    const newItems: PostMedia[] = [];

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newItems.push({
            url: reader.result,
            filter: 'normal',
            aspectRatio: 'square',
          });
        }
        loadedCount++;
        if (loadedCount === filesToProcess.length) {
          setSelectedMediaList((prev) => {
            const nextList = [...prev, ...newItems];
            if (prev.length === 0) setActiveMediaIndex(0);
            return nextList;
          });
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === filesToProcess.length) setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveMedia = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMediaList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (activeMediaIndex >= updated.length) {
        setActiveMediaIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleSetFilterForCurrent = (filterId: FilterType) => {
    setSelectedMediaList((prev) =>
      prev.map((item, idx) => (idx === activeMediaIndex ? { ...item, filter: filterId } : item))
    );
  };

  const handleApplyFilterToAll = (filterId: FilterType) => {
    setSelectedMediaList((prev) => prev.map((item) => ({ ...item, filter: filterId })));
    toast.success(`Applied ${filterId} filter to all media`);
  };

  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const res = await fetch('/api/gemini/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic || caption || 'Aesthetic lifestyle moment',
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (data.caption) {
        setCaption(data.caption);
        setShowAiHelper(false);
      }
    } catch {
      setCaption('Living in the moment ✨ #vibes');
      setShowAiHelper(false);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleSavePoll = () => {
    if (!tempPollQuestion.trim()) return;
    setPollSticker({
      id: 'poll_' + Date.now(),
      question: tempPollQuestion.trim(),
      options: [
        { id: 'opt_1', text: tempPollOpt1.trim() || 'YES', votesCount: 0, voterUserIds: [] },
        { id: 'opt_2', text: tempPollOpt2.trim() || 'NO', votesCount: 0, voterUserIds: [] },
      ],
      totalVotes: 0,
    });
    setActiveStickerModal('none');
  };

  const handleSaveQuestion = () => {
    if (!tempQuestionPrompt.trim()) return;
    setQuestionSticker({
      id: 'q_' + Date.now(),
      prompt: tempQuestionPrompt.trim(),
      responses: [],
    });
    setActiveStickerModal('none');
  };

  const handleSaveAsDraft = async () => {
    if (selectedMediaList.length === 0) return;
    await saveDraft({
      createType,
      media: selectedMediaList,
      caption,
      location,
      audioTrack: selectedAudioTrack || undefined,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleLoadDraftItem = (draft: PostDraft) => {
    setCreateType(draft.createType);
    setSelectedMediaList(draft.media);
    setActiveMediaIndex(0);
    setCaption(draft.caption || '');
    setLocation(draft.location || '');
    setSelectedAudioTrack(draft.audioTrack || null);
    setShowDraftsDrawer(false);
    toast.success('Draft loaded');
  };

  const handlePublish = async (overrideAudience?: 'everyone' | 'close_friends') => {
    if (selectedMediaList.length === 0) return;

    // Check if scheduled
    if (showSchedulePicker && scheduledDateTime) {
      await schedulePost({
        media: selectedMediaList,
        caption,
        location,
        musicTrack: selectedAudioTrack || undefined,
        createType,
        scheduledAt: new Date(scheduledDateTime).toISOString(),
      });
      setIsCreateOpen(false);
      resetForm();
      return;
    }

    const finalAudience = overrideAudience || storyAudience;

    if (createType === 'post') {
      await createNewPost({
        caption: caption || '',
        media: selectedMediaList,
        location: location || undefined,
        musicTrack: selectedAudioTrack
          ? { title: selectedAudioTrack.title, artist: selectedAudioTrack.artist }
          : undefined,
      });
    } else if (createType === 'reel') {
      await createNewReel({
        videoUrl: selectedMediaList[0].url,
        posterUrl: selectedMediaList[0].url,
        caption: caption || undefined,
        musicTrack: selectedAudioTrack
          ? { title: selectedAudioTrack.title, artist: selectedAudioTrack.artist }
          : undefined,
      });
    } else {
      await addNewStory({
        mediaUrl: selectedMediaList[0].url,
        filter: selectedMediaList[0].filter,
        caption: caption || undefined,
        isCloseFriends: finalAudience === 'close_friends',
        poll: pollSticker || undefined,
        question: questionSticker || undefined,
        music: selectedAudioTrack
          ? {
              id: selectedAudioTrack.id,
              title: selectedAudioTrack.title,
              artist: selectedAudioTrack.artist,
              audioUrl: selectedAudioTrack.audioUrl,
              coverUrl: selectedAudioTrack.coverUrl,
            }
          : undefined,
      });
    }

    celebrateAction();
    setIsCreateOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMediaList([]);
    setActiveMediaIndex(0);
    setCaption('');
    setLocation('');
    setSelectedAudioTrack(null);
    setShowSchedulePicker(false);
    setScheduledDateTime('');
    setPollSticker(null);
    setQuestionSticker(null);
    setStoryAudience('everyone');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
        {/* Backdrop Fade */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          onClick={() => {
            setIsCreateOpen(false);
            resetForm();
          }}
        />

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleAddFiles(e.target.files);
          }}
        />
        <input
          type="file"
          ref={multiFileInputRef}
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleAddFiles(e.target.files);
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-soft-xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedMediaList.length > 0) {
                    setSelectedMediaList([]);
                  } else {
                    setIsCreateOpen(false);
                  }
                }}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                {selectedMediaList.length > 0 ? 'Back' : 'Cancel'}
              </button>

              {/* Drafts Manager Pill */}
              {drafts.length > 0 && selectedMediaList.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowDraftsDrawer(true)}
                  className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-bold flex items-center gap-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <FileText size={12} className="text-pink-500" />
                  <span>Drafts ({drafts.length})</span>
                </button>
              )}
            </div>

            <h3 className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white uppercase flex items-center gap-1.5">
              <span>Create new {createType}</span>
              {selectedMediaList.length > 1 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 lowercase">
                  carousel ({selectedMediaList.length}/10)
                </span>
              )}
            </h3>

            <div className="flex items-center gap-2">
              {selectedMediaList.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 px-2.5 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Save draft locally"
                >
                  Save Draft
                </button>
              )}

              <button
                type="button"
                onClick={() => handlePublish()}
                disabled={selectedMediaList.length === 0 || isUploading}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white cursor-pointer disabled:opacity-30 disabled:hover:bg-blue-500 transition-all shadow-sm"
              >
                {showSchedulePicker && scheduledDateTime ? 'Schedule' : 'Share'}
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center justify-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 text-xs font-bold">
            {(['post', 'reel', 'story'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCreateType(type)}
                className={`px-5 py-1.5 rounded-full capitalize transition-all cursor-pointer ${
                  createType === type
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Content Body */}
          {isCropping && currentMediaItem ? (
            /* Dedicated Interactive Image Cropper Workspace */
            <div className="flex-1 flex flex-col min-h-[460px] overflow-hidden">
              <ImageCropper
                imageSrc={currentMediaItem.url}
                initialAspectRatio={createType === 'story' || createType === 'reel' ? '9:16' : '1:1'}
                onCropComplete={(croppedDataUrl) => {
                  setSelectedMediaList((prev) =>
                    prev.map((it, idx) => (idx === activeMediaIndex ? { ...it, url: croppedDataUrl } : it))
                  );
                  setIsCropping(false);
                }}
                onCancel={() => setIsCropping(false)}
              />
            </div>
          ) : selectedMediaList.length === 0 ? (
            /* Empty Initial Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[360px] transition-colors ${
                isDragging ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                {createType === 'reel' ? <Clapperboard size={36} /> : <ImageIcon size={36} />}
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                  Drag photos and videos here
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  {createType === 'post'
                    ? 'Select up to 10 photos or videos to create an Instagram carousel post.'
                    : 'Share high-resolution media directly to your Instagram reels or stories.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Upload size={14} />
                  <span>Select from device</span>
                </button>

                {drafts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDraftsDrawer(true)}
                    className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText size={14} className="text-pink-500" />
                    <span>Load Draft ({drafts.length})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Selected Media Carousel Editor & Options */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 no-scrollbar">
              {/* Left Column: Carousel Canvas Preview & Filters */}
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-inner group"
                >
                  <img
                    src={currentMediaItem.url}
                    alt={`Upload preview ${activeMediaIndex + 1}`}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-all ${
                      currentMediaItem.filter && currentMediaItem.filter !== 'normal'
                        ? `filter-${currentMediaItem.filter}`
                        : ''
                    }`}
                  />

                  {/* Carousel Counter Badge (1/4) */}
                  {selectedMediaList.length > 1 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold backdrop-blur-md shadow-lg z-20 flex items-center gap-1">
                      <Layers size={11} className="text-blue-400" />
                      <span>
                        {activeMediaIndex + 1}/{selectedMediaList.length}
                      </span>
                    </div>
                  )}

                  {/* Attached Real Audio Music Pill overlay */}
                  {selectedAudioTrack && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-white/20 z-20 flex items-center gap-2 max-w-[200px] truncate animate-pulse">
                      <Disc size={13} className="text-pink-400 animate-spin" />
                      <span className="truncate">{selectedAudioTrack.title}</span>
                    </div>
                  )}

                  {/* Story Interactive Stickers Preview Overlays */}
                  {createType === 'story' && (
                    <div className="absolute inset-0 p-3 flex flex-col justify-center items-center pointer-events-none gap-2 z-20">
                      {pollSticker && (
                        <div className="pointer-events-auto w-full max-w-[220px] bg-neutral-900/90 backdrop-blur-md rounded-2xl p-3 text-center border border-white/20 shadow-2xl relative animate-scale-up">
                          <button
                            type="button"
                            onClick={() => setPollSticker(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow hover:bg-rose-600 cursor-pointer"
                            title="Remove Poll"
                          >
                            <X size={13} />
                          </button>
                          <div className="text-xs font-bold text-white mb-2">{pollSticker.question}</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {pollSticker.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="py-1.5 px-2 bg-white/15 rounded-xl text-[11px] font-bold text-white"
                              >
                                {opt.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {questionSticker && (
                        <div className="pointer-events-auto w-full max-w-[220px] bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl p-3 text-center shadow-2xl relative animate-scale-up">
                          <button
                            type="button"
                            onClick={() => setQuestionSticker(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow hover:bg-rose-600 cursor-pointer"
                            title="Remove Question"
                          >
                            <X size={13} />
                          </button>
                          <div className="text-xs font-extrabold mb-1.5">{questionSticker.prompt}</div>
                          <div className="bg-white/20 rounded-xl py-1 text-[10px] text-white/80">
                            Type something...
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Arrows for Carousel */}
                  {selectedMediaList.length > 1 && (
                    <>
                      {activeMediaIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveMediaIndex((prev) => prev - 1)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90 shadow-md cursor-pointer z-20"
                        >
                          <ChevronLeft size={18} />
                        </button>
                      )}
                      {activeMediaIndex < selectedMediaList.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setActiveMediaIndex((prev) => prev + 1)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90 shadow-md cursor-pointer z-20"
                        >
                          <ChevronRight size={18} />
                        </button>
                      )}

                      {/* Pagination Indicator Dots */}
                      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                        {selectedMediaList.map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`h-1.5 rounded-full transition-all ${
                              dotIdx === activeMediaIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white gap-2 z-30">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-xs font-semibold">Adding media...</span>
                    </div>
                  )}

                  {/* Crop Active Slide Button */}
                  {!selectedAudioTrack && (
                    <button
                      type="button"
                      onClick={() => setIsCropping(true)}
                      className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer z-10"
                      title="Format and crop active photo"
                    >
                      <Crop size={14} className="text-blue-400" />
                      <span>Crop</span>
                    </button>
                  )}
                </div>

                {/* Carousel Multi-Media Thumbnail Ribbon */}
                {createType === 'post' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Media in Post ({selectedMediaList.length}/10)
                      </label>
                      <span className="text-[10px] text-neutral-400">Click thumbnail to switch</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {selectedMediaList.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveMediaIndex(idx)}
                          className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border-2 transition-all group/thumb ${
                            idx === activeMediaIndex
                              ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105'
                              : 'border-neutral-200 dark:border-neutral-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={`Thumbnail ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {selectedMediaList.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveMedia(idx, e)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow"
                              title="Remove image"
                            >
                              <X size={10} />
                            </button>
                          )}
                          <div className="absolute bottom-0.5 left-1 text-[9px] font-extrabold text-white drop-shadow">
                            {idx + 1}
                          </div>
                        </div>
                      ))}

                      {/* Add More Media Button (Up to 10) */}
                      {selectedMediaList.length < 10 && (
                        <button
                          type="button"
                          onClick={() => multiFileInputRef.current?.click()}
                          className="w-14 h-14 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-blue-500 flex-shrink-0 transition-colors cursor-pointer"
                          title="Add another photo or video (2 to 10 carousel)"
                        >
                          <Plus size={18} />
                          <span className="text-[9px] font-bold">Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo Filters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Filters ({currentMediaItem.filter || 'normal'})
                    </label>
                    {selectedMediaList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleApplyFilterToAll(currentMediaItem.filter || 'normal')}
                        className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
                      >
                        Apply to all
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                    {filters.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSetFilterForCurrent(f.id)}
                        className={`flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer ${
                          currentMediaItem.filter === f.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                            currentMediaItem.filter === f.id
                              ? 'border-blue-500 ring-2 ring-blue-500/20 scale-105'
                              : 'border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          <img
                            src={currentMediaItem.url}
                            alt={f.label}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover ${f.id !== 'normal' ? `filter-${f.id}` : ''}`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                          {f.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Audio Selector, Caption, Scheduling, Audience */}
              <div className="space-y-4">
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        currentUser?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={currentUser?.name || currentUser?.username || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    <div>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white block">
                        {currentUser?.username || 'You'}
                      </span>
                      {createType === 'story' && (
                        <span className="text-[11px] text-neutral-400">
                          {storyAudience === 'close_friends' ? 'Close Friends ⭐' : 'Public to followers'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Audio Music Track Selector Pill */}
                  <button
                    type="button"
                    onClick={() => setIsAudioModalOpen(true)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedAudioTrack
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Music size={13} className={selectedAudioTrack ? 'animate-bounce' : ''} />
                    <span className="max-w-[120px] truncate">
                      {selectedAudioTrack ? `${selectedAudioTrack.title}` : 'Add Music'}
                    </span>
                    {selectedAudioTrack && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAudioTrack(null);
                        }}
                        className="ml-1 hover:text-rose-200"
                      >
                        <X size={12} />
                      </span>
                    )}
                  </button>
                </div>

                {/* Story Audience Selector */}
                {createType === 'story' && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        Story Audience
                      </span>
                      <span className="text-[10px] text-neutral-400">Choose who can view</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStoryAudience('everyone')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          storyAudience === 'everyone'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe size={15} className="text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">Your Story</span>
                            <span className="text-[10px] text-neutral-400 block truncate">All followers</span>
                          </div>
                        </div>
                        {storyAudience === 'everyone' && (
                          <Check size={14} className="text-blue-500 flex-shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStoryAudience('close_friends')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          storyAudience === 'close_friends'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                            <Star size={11} className="fill-white" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate text-emerald-600 dark:text-emerald-400">
                              Close Friends
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">⭐ Green ring</span>
                          </div>
                        </div>
                        {storyAudience === 'close_friends' && (
                          <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Gemini Caption Assistant */}
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                      <Sparkles size={14} />
                      <span>AI Caption Assistant</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiHelper((prev) => !prev)}
                      className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer"
                    >
                      {showAiHelper ? 'Hide' : 'Customize Tone'}
                    </button>
                  </div>

                  {showAiHelper && (
                    <div className="space-y-2 pt-1 text-xs">
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Topic (e.g. coffee, sunset, weekend trip)..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none text-neutral-900 dark:text-white"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {(['aesthetic', 'playful', 'poetic', 'trendy', 'minimalist'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setAiTone(t)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                              aiTone === t
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateCaption}
                    disabled={isGeneratingCaption}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingCaption ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Crafting Caption...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Caption Textarea */}
                <div className="space-y-1">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={
                      createType === 'story' ? 'Add story text or caption...' : 'Write a caption...'
                    }
                    rows={3}
                    className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-sm outline-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Location Input */}
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 text-xs">
                  <MapPin size={16} className="text-neutral-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location..."
                    className="w-full bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                  />
                </div>

                {/* Post Scheduling Accordion */}
                {createType !== 'story' && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        <Clock size={15} className="text-blue-500" />
                        <span>Schedule Post</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSchedulePicker((prev) => !prev)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          showSchedulePicker
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {showSchedulePicker ? 'Active' : 'Off'}
                      </button>
                    </div>

                    {showSchedulePicker && (
                      <div className="pt-2 space-y-2 text-xs">
                        <label className="text-[11px] text-neutral-400 block">Select Publish Date & Time</label>
                        <input
                          type="datetime-local"
                          value={scheduledDateTime}
                          min={new Date().toISOString().slice(0, 16)}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs outline-none"
                        />
                        <p className="text-[10px] text-neutral-400">
                          Post will automatically publish when the scheduled time arrives.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Audio Track Selector Modal */}
      <AudioTrackSelectorModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        selectedTrack={selectedAudioTrack}
        onSelectTrack={(track) => setSelectedAudioTrack(track)}
      />

      {/* Saved Drafts Drawer / Modal */}
      <AnimatePresence>
        {showDraftsDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDraftsDrawer(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 text-white shadow-2xl space-y-4 max-h-[80vh] flex flex-col z-10"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FileText size={16} className="text-pink-500" />
                  <span>Saved Drafts ({drafts.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDraftsDrawer(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 hover:border-neutral-600 transition-colors flex items-center justify-between"
                  >
                    <div
                      onClick={() => handleLoadDraftItem(draft)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-700 flex-shrink-0">
                        {draft.media[0] && (
                          <img
                            src={draft.media[0].url}
                            alt="Draft preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate capitalize">
                          {draft.createType} {draft.media.length > 1 ? `(${draft.media.length} items)` : ''}
                        </span>
                        <span className="text-[11px] text-neutral-400 block truncate">
                          {draft.caption || 'No caption'}
                        </span>
                        {draft.scheduledAt && (
                          <span className="text-[10px] text-blue-400 font-bold block">
                            ⏰ Scheduled for {new Date(draft.scheduledAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleLoadDraftItem(draft)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDraft(draft.id)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete draft"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
