import React, { useState } from 'react';
import {
  X,
  Palette,
  Image as ImageIcon,
  Check,
  Upload,
  Sparkles,
  Sliders,
  RotateCcw,
  Link,
  Eye,
} from 'lucide-react';
import { ChatTheme } from '../../types';

interface ChatThemeModalProps {
  currentTheme?: ChatTheme;
  onSave: (theme: ChatTheme) => Promise<void>;
  onClose: () => void;
  participantName: string;
}

export const THEME_COLOR_PRESETS = [
  {
    id: 'instagram-classic',
    name: 'Instagram Sunset',
    gradient: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    accent: '#fd1d1d',
    textColor: '#ffffff',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    accent: '#06b6d4',
    textColor: '#ffffff',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    accent: '#ec4899',
    textColor: '#ffffff',
  },
  {
    id: 'emerald-zen',
    name: 'Emerald Zen',
    gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    accent: '#10b981',
    textColor: '#ffffff',
  },
  {
    id: 'midnight-velvet',
    name: 'Midnight Velvet',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    accent: '#a855f7',
    textColor: '#ffffff',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    accent: '#f43f5e',
    textColor: '#ffffff',
  },
  {
    id: 'golden-solar',
    name: 'Golden Solar',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    accent: '#f59e0b',
    textColor: '#ffffff',
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    accent: '#2563eb',
    textColor: '#ffffff',
  },
  {
    id: 'dark-obsidian',
    name: 'Dark Obsidian',
    gradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
    accent: '#64748b',
    textColor: '#ffffff',
  },
];

export const WALLPAPER_PRESETS = [
  {
    id: 'wp-none',
    name: 'None (Default)',
    url: '',
    thumbnail: '',
  },
  {
    id: 'wp-tokyo',
    name: 'Tokyo Neon City',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'wp-galaxy',
    name: 'Cosmic Aurora',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'wp-sunset-beach',
    name: 'Sunset Beach',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'wp-rain',
    name: 'Rainy Glass',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'wp-pastel',
    name: 'Pastel Aesthetic',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'wp-cyber',
    name: 'Cyber Wave',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'wp-forest',
    name: 'Misty Pines',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'wp-alley',
    name: 'Kyoto Lanterns',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&auto=format&fit=crop&q=60',
  },
];

export const ChatThemeModal: React.FC<ChatThemeModalProps> = ({
  currentTheme,
  onSave,
  onClose,
  participantName,
}) => {
  const [selectedGradient, setSelectedGradient] = useState<string>(
    currentTheme?.bubbleGradient || THEME_COLOR_PRESETS[0].gradient
  );
  const [selectedAccent, setSelectedAccent] = useState<string>(
    currentTheme?.accentColor || THEME_COLOR_PRESETS[0].accent
  );
  const [themeName, setThemeName] = useState<string>(
    currentTheme?.name || THEME_COLOR_PRESETS[0].name
  );
  const [backgroundUrl, setBackgroundUrl] = useState<string>(
    currentTheme?.backgroundUrl || ''
  );
  const [backgroundBlur, setBackgroundBlur] = useState<number>(
    currentTheme?.backgroundBlur ?? 0
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(
    currentTheme?.backgroundOpacity ?? 0.85
  );
  const [customImageUrlInput, setCustomImageUrlInput] = useState<string>('');
  const [customHexColor, setCustomHexColor] = useState<string>('#6366f1');
  const [activeTab, setActiveTab] = useState<'colors' | 'wallpapers' | 'custom'>('colors');
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectColorPreset = (preset: typeof THEME_COLOR_PRESETS[0]) => {
    setSelectedGradient(preset.gradient);
    setSelectedAccent(preset.accent);
    setThemeName(preset.name);
  };

  const handleSelectWallpaperPreset = (preset: typeof WALLPAPER_PRESETS[0]) => {
    setBackgroundUrl(preset.url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBackgroundUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomImageUrl = () => {
    if (!customImageUrlInput.trim()) return;
    setBackgroundUrl(customImageUrlInput.trim());
    setCustomImageUrlInput('');
  };

  const handleApplyCustomColor = (hex: string) => {
    setCustomHexColor(hex);
    setSelectedGradient(`linear-gradient(135deg, ${hex} 0%, #1e1b4b 100%)`);
    setSelectedAccent(hex);
    setThemeName('Custom Color');
  };

  const handleResetToDefault = () => {
    setSelectedGradient(THEME_COLOR_PRESETS[0].gradient);
    setSelectedAccent(THEME_COLOR_PRESETS[0].accent);
    setThemeName(THEME_COLOR_PRESETS[0].name);
    setBackgroundUrl('');
    setBackgroundBlur(0);
    setBackgroundOpacity(0.85);
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      await onSave({
        id: `theme_${Date.now()}`,
        name: themeName,
        bubbleGradient: selectedGradient,
        accentColor: selectedAccent,
        textColor: '#ffffff',
        backgroundUrl: backgroundUrl || undefined,
        backgroundBlur,
        backgroundOpacity,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save theme:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Chat Theme & Wallpaper
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Interactive Preview Box */}
        <div className="px-5 pt-4 pb-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye size={12} /> Live Preview
            </span>
            <span className="text-slate-500 dark:text-neutral-400 font-medium">
              {themeName}
            </span>
          </div>

          <div
            className="relative h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 flex flex-col justify-end p-3 bg-slate-100 dark:bg-neutral-950 shadow-inner"
            style={{
              backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Background overlay for contrast */}
            {backgroundUrl && (
              <div
                className="absolute inset-0 bg-slate-950 transition-opacity"
                style={{
                  opacity: 1 - backgroundOpacity,
                  backdropFilter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
                }}
              />
            )}

            {/* Simulated message bubbles */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-end gap-1.5 justify-start max-w-[70%]">
                <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xs text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-2xl rounded-bl-xs shadow-xs border border-white/20">
                  Hey! Loving this chat theme ✨
                </div>
              </div>
              <div className="flex items-end gap-1.5 justify-end">
                <div
                  style={{ background: selectedGradient }}
                  className="text-white text-xs px-3 py-1.5 rounded-2xl rounded-br-xs shadow-sm font-medium"
                >
                  Looks amazing! Saved to Firestore 💬
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-neutral-800 px-5 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('colors')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'colors'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-neutral-400'
            }`}
          >
            <Palette size={14} /> Color Gradients
          </button>
          <button
            onClick={() => setActiveTab('wallpapers')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'wallpapers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-neutral-400'
            }`}
          >
            <ImageIcon size={14} /> Preset Wallpapers
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'custom'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-neutral-400'
            }`}
          >
            <Upload size={14} /> Custom Image & Color
          </button>
        </div>

        {/* Body Content by Tab */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[42vh] no-scrollbar">
          {/* TAB 1: Color Gradients */}
          {activeTab === 'colors' && (
            <div className="grid grid-cols-3 gap-2.5">
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected = selectedGradient === preset.gradient;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectColorPreset(preset)}
                    className={`relative p-3 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all cursor-pointer hover:scale-[1.02] shadow-xs ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300'
                    }`}
                  >
                    <div
                      style={{ background: preset.gradient }}
                      className="w-10 h-10 rounded-full shadow-inner flex items-center justify-center"
                    >
                      {isSelected && <Check size={18} className="text-white drop-shadow-md" />}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 text-center leading-tight">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: Preset Wallpapers */}
          {activeTab === 'wallpapers' && (
            <div className="grid grid-cols-3 gap-2.5">
              {WALLPAPER_PRESETS.map((preset) => {
                const isSelected = backgroundUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectWallpaperPreset(preset)}
                    className={`relative group rounded-xl overflow-hidden border-2 aspect-4/3 transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-neutral-800 hover:border-slate-400'
                    }`}
                  >
                    {preset.thumbnail ? (
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400">
                        <ImageIcon size={22} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white leading-tight">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white p-1 rounded-full shadow-md">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: Custom Image & Custom Color */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* Custom Image Upload */}
              <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/60">
                <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                  <Upload size={14} className="text-blue-500" /> Upload Any Image from Device
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              {/* Paste Image URL */}
              <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/60">
                <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                  <Link size={14} className="text-purple-500" /> Or Paste Any Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/wallpaper.jpg"
                    value={customImageUrlInput}
                    onChange={(e) => setCustomImageUrlInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomImageUrl}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 cursor-pointer transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Custom Bubble Color Picker */}
              <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/60">
                <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                  <Palette size={14} className="text-emerald-500" /> Custom Bubble Color Picker
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customHexColor}
                    onChange={(e) => handleApplyCustomColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-neutral-300">
                    {customHexColor.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Wallpaper Blur & Opacity Controls if wallpaper selected */}
              {backgroundUrl && (
                <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Sliders size={13} /> Wallpaper Contrast & Blur
                    </span>
                    <button
                      type="button"
                      onClick={() => setBackgroundUrl('')}
                      className="text-red-500 hover:text-red-600 text-[11px] font-semibold cursor-pointer"
                    >
                      Remove Wallpaper
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                      <span>Image Visibility</span>
                      <span>{Math.round(backgroundOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={backgroundOpacity}
                      onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                      <span>Background Blur</span>
                      <span>{backgroundBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      step="1"
                      value={backgroundBlur}
                      onChange={(e) => setBackgroundBlur(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer font-medium"
          >
            <RotateCcw size={13} /> Reset Theme
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-200/60 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTheme}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Save Theme
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
