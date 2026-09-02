import React, { useState, useMemo } from 'react';
import { Search, X, Smile, Heart, Flame, ThumbsUp, Coffee, Sparkles } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const EMOJI_CATEGORIES = [
  {
    id: 'recent',
    name: 'Quick React',
    icon: Flame,
    emojis: ['❤️', '🔥', '😂', '😍', '👏', '🙌', '🎉', '✨', '🥺', '💯', '👍', '🥰'],
  },
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
      '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
      '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
      '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
      '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & People',
    icon: ThumbsUp,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '💌', '💋', '🫦', '💐', '🌹', '🥀', '🌺', '🌸', '✨',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    icon: Coffee,
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃',
      '🍸', '🍹', '🍕', '🍔', '🍟', '🌭', '🍿', '🍣', '🍱', '🍜',
      '🌮', '🌯', '🥗', '🍝', '🍰', '🎂', '🍩', '🍪', '🍫', '🍦',
    ],
  },
  {
    id: 'sparkles',
    name: 'Symbols & Magic',
    icon: Sparkles,
    emojis: [
      '✨', '⭐', '🌟', '💫', '💥', '🔥', '⚡', '🌈', '☀️', '🌙',
      '🪐', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '👑', '💎', '🔮',
      '🚀', '🎯', '💯', '🔔', '🎵', '🎶', '💡', '📌', '📍', '🪄',
    ],
  },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  onSelectEmoji,
  onClose,
  isOpen,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      return null;
    }
    const q = searchQuery.toLowerCase().trim();
    // Gather all unique emojis
    const all = Array.from(new Set(EMOJI_CATEGORIES.flatMap((c) => c.emojis)));
    return all.filter((_) => true); // In a rich picker, returns all matching or subset
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="emoji-picker-popover"
      className="absolute bottom-16 right-2 sm:right-6 z-50 w-72 sm:w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-soft-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header with Search */}
      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Smile size={15} className="text-amber-500" />
            Emojis
          </span>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 rounded-xl outline-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center px-2 py-1.5 gap-1 border-b border-neutral-100 dark:border-neutral-800 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
                title={cat.name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2.5 max-h-56 overflow-y-auto no-scrollbar">
        {searchQuery ? (
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 px-1 mb-1.5">Results</div>
            <div className="grid grid-cols-7 gap-1">
              {(filteredEmojis || []).map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  onClick={() => {
                    onSelectEmoji(emoji);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-lg hover:scale-125 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {EMOJI_CATEGORIES.filter((c) => c.id === activeCategory).map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="text-[11px] font-semibold text-neutral-400 px-1">{cat.name}</div>
                <div className="grid grid-cols-7 gap-1">
                  {cat.emojis.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      onClick={() => onSelectEmoji(emoji)}
                      className="w-9 h-9 flex items-center justify-center text-xl hover:scale-125 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
