import React, { useState } from 'react';
import { Bookmark, Heart, MessageCircle, ArrowLeft, Grid, Image as ImageIcon, Music } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Post } from '../../../types';

interface SettingsSavedViewProps {
  onBack: () => void;
}

export const SettingsSavedView: React.FC<SettingsSavedViewProps> = ({ onBack }) => {
  const { posts, savedPostIds, toggleSavePost, setSelectedPostForDetail } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'photos' | 'audio'>('all');

  const savedPosts = posts.filter(
    (p) => p.isSaved || (savedPostIds && savedPostIds.includes(p.id))
  );

  const filteredPosts = savedPosts.filter((p) => {
    if (filterType === 'photos') return p.media.length > 0;
    if (filterType === 'audio') return !!p.musicTrack;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
      {/* Category Pills */}
      <div className="flex items-center gap-2 pb-1 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          All Posts ({savedPosts.length})
        </button>
        <button
          onClick={() => setFilterType('photos')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterType === 'photos'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          Photos & Videos
        </button>
        <button
          onClick={() => setFilterType('audio')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterType === 'audio'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          Audio
        </button>
      </div>

      {/* Grid or Empty */}
      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center space-y-3 px-4">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400">
            <Bookmark size={28} />
          </div>
          <h3 className="font-bold text-base text-neutral-900 dark:text-white">No Saved Items</h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            When you save photos and videos, they will appear here. Only you can see what you have saved.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPostForDetail(post)}
              className="relative aspect-square group bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer shadow-xs"
            >
              <img
                src={post.media[0]?.url}
                alt="Saved post"
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${
                  post.media[0]?.filter ? `filter-${post.media[0]?.filter}` : ''
                }`}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                <div className="flex items-center gap-1">
                  <Heart size={14} className="fill-white" />
                  <span>{post.likesCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={14} className="fill-white" />
                  <span>{post.commentsCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
