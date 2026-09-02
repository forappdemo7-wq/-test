import React, { useState } from 'react';
import { X, Search, Sparkles, Flame, Heart, Smile, Zap } from 'lucide-react';

interface StickerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (stickerUrl: string, name?: string) => void;
}

interface StickerItem {
  id: string;
  name: string;
  category: string;
  url: string;
}

const POPULAR_STICKERS: StickerItem[] = [
  // Reactions
  {
    id: 'st_heart',
    name: 'Love Heart',
    category: 'Love',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_fire',
    name: 'Lit Fire',
    category: 'Trending',
    url: 'https://images.unsplash.com/photo-1520690214108-217e744f8885?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_party',
    name: 'Party Vibes',
    category: 'Celebration',
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_sunset',
    name: 'Golden Hour',
    category: 'Aesthetic',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_cute_cat',
    name: 'Cute Mood',
    category: 'Cute',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_coffee',
    name: 'Coffee Time',
    category: 'Lifestyle',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_sparkles',
    name: 'Magic Sparkles',
    category: 'Trending',
    url: 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_neon',
    name: 'Neon Glow',
    category: 'Aesthetic',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_peace',
    name: 'Chill Peace',
    category: 'Trending',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_celebrate',
    name: 'Cheers',
    category: 'Celebration',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_music',
    name: 'Music Vibes',
    category: 'Lifestyle',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'st_art',
    name: 'Pop Art',
    category: 'Aesthetic',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80',
  },
];

const CATEGORIES = ['All', 'Trending', 'Love', 'Celebration', 'Cute', 'Aesthetic', 'Lifestyle'];

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  if (!isOpen) return null;

  const filteredStickers = POPULAR_STICKERS.filter((s) => {
    const matchesCat = activeCategory === 'All' || s.category === activeCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 h-[65vh] sm:h-[480px] flex flex-col z-10 overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Drag handle on mobile */}
        <div className="w-12 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-pink-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Stickers & Reactions
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
            <Search size={15} className="text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stickers & GIFs..."
              className="w-full text-xs bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
              autoFocus
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stickers Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-3 gap-3 no-scrollbar">
          {filteredStickers.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => {
                onSelectSticker(sticker.url, sticker.name);
                onClose();
              }}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 hover:scale-105 transition-transform cursor-pointer border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs"
            >
              <img
                src={sticker.url}
                alt={sticker.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:opacity-95"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-left">
                <span className="text-[10px] font-bold text-white block truncate">
                  {sticker.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
