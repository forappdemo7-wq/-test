import React, { useState } from 'react';
import { MessageCircle, Tag, Share2, Plus, X, Check } from 'lucide-react';

export const SettingsInteractionsView: React.FC = () => {
  const [tagOption, setTagOption] = useState<'everyone' | 'following' | 'no_one'>('everyone');
  const [mentionOption, setMentionOption] = useState<'everyone' | 'following' | 'no_one'>('everyone');
  const [storyRepliesOption, setStoryRepliesOption] = useState<'everyone' | 'following' | 'off'>('everyone');
  const [allowRemixes, setAllowRemixes] = useState(true);
  const [allowStorySharing, setAllowStorySharing] = useState(true);

  // Custom filter keywords
  const [blockedWords, setBlockedWords] = useState<string[]>(['spam', 'scam', 'crypto_bot']);
  const [newWord, setNewWord] = useState('');

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim() && !blockedWords.includes(newWord.trim())) {
      setBlockedWords((prev) => [...prev, newWord.trim().toLowerCase()]);
      setNewWord('');
    }
  };

  const handleRemoveWord = (word: string) => {
    setBlockedWords((prev) => prev.filter((w) => w !== word));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
      {/* 1. Tags and Mentions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-neutral-700 dark:text-neutral-300" />
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Tags & Mentions
          </h4>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
          <p className="text-xs text-neutral-500">Who can tag you in photos and reels</p>
          {[
            { id: 'everyone', label: 'Allow tags from Everyone' },
            { id: 'following', label: 'Allow tags from People You Follow' },
            { id: 'no_one', label: "Don't allow tags" },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {item.label}
              </span>
              <input
                type="radio"
                name="tags_option"
                checked={tagOption === item.id}
                onChange={() => setTagOption(item.id as any)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 2. Messages and Story Replies */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-neutral-700 dark:text-neutral-300" />
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Story Replies
          </h4>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
          <p className="text-xs text-neutral-500">Who can send replies to your stories</p>
          {[
            { id: 'everyone', label: 'Everyone' },
            { id: 'following', label: 'People You Follow' },
            { id: 'off', label: 'Off' },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {item.label}
              </span>
              <input
                type="radio"
                name="story_replies_option"
                checked={storyRepliesOption === item.id}
                onChange={() => setStoryRepliesOption(item.id as any)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 3. Hidden Words / Comment Filter */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Hidden Words & Keyword Filter
        </h4>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
          <p className="text-xs text-neutral-500">
            Comments containing these custom words will be automatically hidden from your posts.
          </p>

          {/* Add word form */}
          <form onSubmit={handleAddWord} className="flex items-center gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Add word or phrase..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs outline-none text-neutral-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Add
            </button>
          </form>

          {/* Keywords tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {blockedWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-200/80 dark:bg-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 font-medium"
              >
                <span>{word}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWord(word)}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Sharing & Remixes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-neutral-700 dark:text-neutral-300" />
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Sharing & Remixes
          </h4>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                Allow story sharing
              </p>
              <p className="text-[11px] text-neutral-500">People can add your posts to their stories</p>
            </div>
            <input
              type="checkbox"
              checked={allowStorySharing}
              onChange={(e) => setAllowStorySharing(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                Allow reels remixing
              </p>
              <p className="text-[11px] text-neutral-500">Anyone can create remixes of your public reels</p>
            </div>
            <input
              type="checkbox"
              checked={allowRemixes}
              onChange={(e) => setAllowRemixes(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
