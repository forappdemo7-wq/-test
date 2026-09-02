import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Hash,
  Users,
  MapPin,
  Heart,
  MessageCircle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Clapperboard,
} from 'lucide-react';
import { Post, Reel, User } from '../../types';
import { useApp } from '../../context/AppContext';

interface TrendingHubProps {
  trendingPosts: (Post | Reel)[];
  trendingHashtags: { tag: string; count: number; growth: string; rank: number }[];
  trendingUsers: User[];
  trendingLocations: { location: string; count: number; rank: number }[];
  onSelectHashtag: (tag: string) => void;
  onSelectLocation: (location: string) => void;
  onOpenPost: (item: Post | Reel) => void;
  onSelectUser: (user: User) => void;
}

export const TrendingHub: React.FC<TrendingHubProps> = ({
  trendingPosts,
  trendingHashtags,
  trendingUsers,
  trendingLocations,
  onSelectHashtag,
  onSelectLocation,
  onOpenPost,
  onSelectUser,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'hashtags' | 'creators' | 'locations'>('all');
  const { toggleFollowUser, currentUser } = useApp();

  return (
    <div className="space-y-4">
      {/* Section Header & Sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-500 flex items-center justify-center">
            <Flame size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              Trending on InstaVibe
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                LIVE
              </span>
            </h2>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Surging content, creator spotlights, and viral topics
            </p>
          </div>
        </div>

        {/* Tab pills */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl">
          {[
            { id: 'all', label: 'All' },
            { id: 'posts', label: 'Posts' },
            { id: 'hashtags', label: 'Hashtags' },
            { id: 'creators', label: 'Creators' },
            { id: 'locations', label: 'Places' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === id
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-soft-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP TRENDING POSTS ROW (Podium Style) */}
      {(activeTab === 'all' || activeTab === 'posts') && trendingPosts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-pink-500" />
              Viral Highlights
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {trendingPosts.slice(0, 3).map((item, idx) => {
              const isReel = 'videoUrl' in item;
              const postUrl = isReel
                ? (item as Reel).posterUrl || (item as Reel).videoUrl
                : (item as Post).media[0]?.url;

              const rankBadges = [
                { bg: 'bg-amber-500 text-white', text: '🔥 #1 Trending' },
                { bg: 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900', text: '⚡ #2 Surging' },
                { bg: 'bg-pink-500 text-white', text: '✨ #3 Viral' },
              ];

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => onOpenPost(item)}
                  className="relative group aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 cursor-pointer shadow-soft-xs"
                >
                  <img
                    src={postUrl}
                    alt={item.caption || 'Trending'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Rank Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft-xs ${rankBadges[idx]?.bg || 'bg-black/60 text-white'}`}>
                      {rankBadges[idx]?.text || `#${idx + 1}`}
                    </span>
                  </div>

                  {isReel && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/40 text-white backdrop-blur-md">
                      <Clapperboard size={12} />
                    </div>
                  )}

                  {/* Bottom Stats & Author */}
                  <div className="absolute bottom-2 left-2 right-2 space-y-1 text-white">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={item.author.avatar}
                        alt={item.author.username}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="text-[11px] font-semibold truncate">
                        @{item.author.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-medium text-white/90">
                      <span className="flex items-center gap-1">
                        <Heart size={11} className="fill-white" />
                        {item.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={11} className="fill-white" />
                        {item.commentsCount}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRENDING HASHTAGS & LOCATIONS 2-COLUMN GRID */}
      {(activeTab === 'all' || activeTab === 'hashtags' || activeTab === 'locations') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Trending Hashtags */}
          {(activeTab === 'all' || activeTab === 'hashtags') && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <Hash size={13} className="text-blue-500" />
                  Trending Hashtags
                </span>
              </div>

              <div className="space-y-2">
                {trendingHashtags.slice(0, 5).map((tagItem) => (
                  <div
                    key={tagItem.tag}
                    onClick={() => onSelectHashtag(tagItem.tag)}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        #{tagItem.rank}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                          {tagItem.tag}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {tagItem.count} {tagItem.count === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        {tagItem.growth}
                      </span>
                      <ChevronRight size={14} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Locations */}
          {(activeTab === 'all' || activeTab === 'locations') && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <MapPin size={13} className="text-red-500" />
                  Popular Places
                </span>
              </div>

              <div className="space-y-2">
                {trendingLocations.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    No geotags indexed yet
                  </div>
                ) : (
                  trendingLocations.slice(0, 5).map((locItem) => (
                    <div
                      key={locItem.location}
                      onClick={() => onSelectLocation(locItem.location)}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <MapPin size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-red-500 transition-colors">
                            {locItem.location}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {locItem.count} captures tagged
                          </p>
                        </div>
                      </div>

                      <ChevronRight size={14} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRENDING CREATORS SPOTLIGHT */}
      {(activeTab === 'all' || activeTab === 'creators') && trendingUsers.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 border border-neutral-200/90 dark:border-neutral-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <Users size={13} className="text-purple-500" />
              Creators to Follow
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {trendingUsers.slice(0, 6).map((creator) => (
              <div
                key={creator.id}
                onClick={() => onSelectUser(creator)}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={creator.avatar}
                    alt={creator.username}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {creator.username}
                      </span>
                      {creator.isVerified && (
                        <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {creator.followersCount > 1000
                        ? `${(creator.followersCount / 1000).toFixed(1)}k followers`
                        : `${creator.followersCount} followers`}
                    </p>
                  </div>
                </div>

                {currentUser && creator.id !== currentUser.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowUser(creator.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex-shrink-0 ${
                      creator.isFollowing
                        ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-soft-xs hover:opacity-90'
                    }`}
                  >
                    {creator.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
