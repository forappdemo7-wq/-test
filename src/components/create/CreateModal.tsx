import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Sparkles,
  MapPin,
  Music,
  Sliders,
  Check,
  Image as ImageIcon,
  Clapperboard,
  Camera,
  Loader2,
  FolderOpen,
  Crop,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FilterType } from '../../types';
import { ImageCropper, CropAspectRatio } from './ImageCropper';

export const CreateModal: React.FC = () => {
  const { isCreateOpen, setIsCreateOpen, createNewPost, addNewStory, createNewReel, currentUser, celebrateAction } =
    useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createType, setCreateType] = useState<'post' | 'story' | 'reel'>('post');
  const [rawOriginalMedia, setRawOriginalMedia] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('normal');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // AI caption generation state
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'aesthetic' | 'playful' | 'poetic' | 'trendy' | 'minimalist' | 'engaging'>('aesthetic');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);

  if (!isCreateOpen) return null;

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

  const handleFileChange = (file: File) => {
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawOriginalMedia(reader.result);
        setSelectedMedia(reader.result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
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

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedia) return;

    if (createType === 'post') {
      await createNewPost({
        caption: caption || '',
        media: [
          {
            url: selectedMedia,
            filter: activeFilter,
            aspectRatio: 'square',
          },
        ],
        location: location || undefined,
        musicTrack: musicTitle ? { title: musicTitle, artist: 'Audio Track' } : undefined,
      });
    } else if (createType === 'reel') {
      await createNewReel({
        videoUrl: selectedMedia,
        posterUrl: selectedMedia,
        caption: caption || undefined,
        musicTrack: musicTitle ? { title: musicTitle, artist: 'Original Audio' } : undefined,
      });
    } else {
      await addNewStory({
        mediaUrl: selectedMedia,
        filter: activeFilter,
        caption: caption || undefined,
      });
    }

    celebrateAction();
    setIsCreateOpen(false);
    setSelectedMedia(null);
    setCaption('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      {/* Backdrop Fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        onClick={() => {
          setIsCreateOpen(false);
          setSelectedMedia(null);
        }}
      />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
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
          <button
            type="button"
            onClick={() => {
              if (selectedMedia) {
                setSelectedMedia(null);
              } else {
                setIsCreateOpen(false);
              }
            }}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            {selectedMedia ? 'Back' : 'Cancel'}
          </button>

          <h3 className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white uppercase">
            Create new {createType}
          </h3>

          <button
            type="button"
            onClick={handlePublish}
            disabled={!selectedMedia || isUploading}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 cursor-pointer disabled:opacity-30 disabled:hover:text-blue-500"
          >
            Share
          </button>
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
        {isCropping && (rawOriginalMedia || selectedMedia) ? (
          /* Dedicated Interactive Image Cropper Workspace */
          <div className="flex-1 flex flex-col min-h-[460px] overflow-hidden">
            <ImageCropper
              imageSrc={rawOriginalMedia || selectedMedia!}
              initialAspectRatio={createType === 'story' || createType === 'reel' ? '9:16' : '1:1'}
              onCropComplete={(croppedDataUrl) => {
                setSelectedMedia(croppedDataUrl);
                setIsCropping(false);
              }}
              onCancel={() => setIsCropping(false)}
            />
          </div>
        ) : !selectedMedia ? (
          /* Empty Initial Dropzone - Instagram Style */
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
                Share high-resolution images or videos directly to your feed, reels, or story.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              Select from device
            </button>
          </div>
        ) : (
          /* Selected Media Editor & Caption Form */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 no-scrollbar">
            {/* Left: Media Canvas Preview & Filters */}
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
                  src={selectedMedia}
                  alt="Upload preview"
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-all ${
                    activeFilter !== 'normal' ? `filter-${activeFilter}` : ''
                  }`}
                />

                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white gap-2">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-xs font-semibold">Uploading...</span>
                  </div>
                )}

                {/* Top Overlay: Crop button */}
                <button
                  type="button"
                  onClick={() => setIsCropping(true)}
                  className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Format and crop photo"
                >
                  <Crop size={14} className="text-blue-400" />
                  <span>Crop</span>
                </button>

                {/* Revert crop if modified */}
                {rawOriginalMedia && rawOriginalMedia !== selectedMedia && (
                  <button
                    type="button"
                    onClick={() => setSelectedMedia(rawOriginalMedia)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/75 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1 shadow-lg transition-transform active:scale-95 cursor-pointer"
                    title="Reset to original uncropped image"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}

                {/* Change photo button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Change</span>
                </button>
              </div>

              {/* Crop & Format Action Banner */}
              <button
                type="button"
                onClick={() => setIsCropping(true)}
                className="w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer border border-neutral-200/80 dark:border-neutral-700/60"
              >
                <div className="flex items-center gap-2">
                  <Crop size={15} className="text-blue-500" />
                  <span>Adjust Crop & Aspect Ratio</span>
                </div>
                <span className="text-[10px] text-neutral-400">1:1 • 4:5 • 16:9 • 9:16</span>
              </button>

              {/* Photo Filters */}
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  Photo Filters
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer ${
                        activeFilter === f.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                          activeFilter === f.id
                            ? 'border-blue-500 ring-2 ring-blue-500/20 scale-105'
                            : 'border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <img
                          src={selectedMedia}
                          alt={f.label}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${
                            f.id !== 'normal' ? `filter-${f.id}` : ''
                          }`}
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

            {/* Right: Caption, Details & Gemini AI Helper */}
            <div className="space-y-4">
              {/* User Header */}
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                />
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                  {currentUser.username}
                </span>
              </div>

              {/* Gemini Caption Assistant */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <Sparkles size={14} />
                    <span>AI Caption Generator</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiHelper((prev) => !prev)}
                    className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer"
                  >
                    {showAiHelper ? 'Hide' : 'Customize'}
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
                  placeholder="Write a caption..."
                  rows={4}
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

              {/* Music / Audio track */}
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 text-xs">
                <Music size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  placeholder="Add audio / music track..."
                  className="w-full bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
