import React, { useState, useMemo } from 'react';
import { Search, X, Sparkles, TrendingUp, Flame } from 'lucide-react';

interface GifPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
}

interface GifItem {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
}

const CURATED_GIFS: GifItem[] = [
  // Trending / Reactions
  {
    id: 'gif_party_cat',
    title: 'Party Cat Dancing',
    category: 'trending',
    url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  },
  {
    id: 'gif_cheers_dicaprio',
    title: 'Leonardo DiCaprio Cheers',
    category: 'reactions',
    url: 'https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif',
  },
  {
    id: 'gif_mind_blown',
    title: 'Mind Blown Galaxy',
    category: 'reactions',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  },
  {
    id: 'gif_laughing_hard',
    title: 'Minion Laughing',
    category: 'memes',
    url: 'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
  },
  {
    id: 'gif_heart_eyes',
    title: 'Heart Eyes Love',
    category: 'love',
    url: 'https://media.giphy.com/media/l4pTdcifPZLpDjL1e/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/l4pTdcifPZLpDjL1e/giphy.gif',
  },
  {
    id: 'gif_thumbs_up',
    title: 'Thumbs Up Approval',
    category: 'reactions',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
  },
  {
    id: 'gif_clapping',
    title: 'Applaud Clapping Bravo',
    category: 'trending',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  },
  {
    id: 'gif_dance_vibe',
    title: 'Retro Dancing Vibe',
    category: 'dance',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
  },
  {
    id: 'gif_happy_dance',
    title: 'Happy Dance Dog',
    category: 'animals',
    url: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif',
  },
  {
    id: 'gif_surprised_cat',
    title: 'Surprised Cat Eyes',
    category: 'animals',
    url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif',
  },
  {
    id: 'gif_confused_travolta',
    title: 'Confused John Travolta',
    category: 'memes',
    url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
  },
  {
    id: 'gif_yay_celebrate',
    title: 'Kermit Yay Flail',
    category: 'celebrate',
    url: 'https://media.giphy.com/media/dpqQNluWFaSpq/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/dpqQNluWFaSpq/giphy.gif',
  },
];

const GIF_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending 🔥' },
  { id: 'reactions', label: 'Reactions 😮' },
  { id: 'love', label: 'Love ❤️' },
  { id: 'memes', label: 'Memes 🤣' },
  { id: 'dance', label: 'Dance 💃' },
  { id: 'animals', label: 'Animals 🐶' },
  { id: 'celebrate', label: 'Celebrate 🎉' },
];

export const GifPickerDrawer: React.FC<GifPickerDrawerProps> = ({
  isOpen,
  onClose,
  onSelectGif,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGifs = useMemo(() => {
    let list = CURATED_GIFS;
    if (selectedCategory !== 'all') {
      list = list.filter((g) => g.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="gif-picker-drawer"
      className="absolute bottom-16 right-2 sm:right-16 z-50 w-80 sm:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-soft-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[420px]"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-white">
            <span className="px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-md text-[10px] uppercase tracking-wider font-extrabold">
              GIF
            </span>
            <span>Search GIPHY</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all GIFs..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 rounded-xl outline-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-1 focus:ring-rose-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {GIF_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* GIFs Grid */}
      <div className="p-3 overflow-y-auto max-h-[300px] grid grid-cols-2 gap-2">
        {filteredGifs.length > 0 ? (
          filteredGifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => onSelectGif(gif.url)}
              className="relative group rounded-xl overflow-hidden aspect-video bg-neutral-100 dark:bg-neutral-800 focus:outline-hidden hover:ring-2 hover:ring-rose-500 transition-all cursor-pointer"
            >
              <img
                src={gif.previewUrl}
                alt={gif.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-[10px] text-white font-medium truncate">{gif.title}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-2 py-10 text-center text-xs text-neutral-400">
            No GIFs found for &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};
