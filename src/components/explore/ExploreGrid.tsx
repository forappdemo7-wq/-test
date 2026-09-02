import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Mic,
  History,
  SlidersHorizontal,
  Sparkles,
  Flame,
  Hash,
  MapPin,
  X,
  Camera,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { EXPLORE_CATEGORIES } from '../../data/filters';
import { useApp } from '../../context/AppContext';
import { Post, Reel, User } from '../../types';
import { PullToRefresh } from '../common/PullToRefresh';
import { ExploreSkeleton } from '../common/Skeletons';
import {
  searchEngine,
  RecentSearchItem,
  SearchSuggestionItem,
  AdvancedFilterOptions,
  DEFAULT_FILTERS,
} from '../../lib/searchIndex';
import { VoiceSearchModal } from './VoiceSearchModal';
import { ExploreFilters } from './ExploreFilters';
import { TrendingHub } from './TrendingHub';
import { AiRecommendations } from './AiRecommendations';
import { SearchHistoryModal } from './SearchHistoryModal';
import { MasonryGrid } from './MasonryGrid';

const RECENT_SEARCHES_KEY = 'instavibe_recent_searches_v2';

export const ExploreGrid: React.FC = () => {
  const {
    posts,
    reels,
    openExplorePost,
    setIsCreateOpen,
    setActiveTab,
    setActiveReelIndex,
    availableProfiles,
    setSelectedUserProfile,
    toggleFollowUser,
    currentUser,
  } = useApp();

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('For You');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'ai' | 'trending'>('all');

  // Modals & Drawers
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [aiSearchInsight, setAiSearchInsight] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<AdvancedFilterOptions>(DEFAULT_FILTERS);

  // Recent Searches State
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Re-build Fast Inverted Search Index whenever posts, reels, or users change
  useEffect(() => {
    searchEngine.buildIndex(posts, reels, availableProfiles);
  }, [posts, reels, availableProfiles]);

  // Persist Recent Searches
  const saveRecentSearches = (items: RecentSearchItem[]) => {
    setRecentSearches(items);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const addRecentSearch = (item: Omit<RecentSearchItem, 'id' | 'timestamp'>) => {
    const newItem: RecentSearchItem = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now(),
      ...item,
    };

    const updated = [
      newItem,
      ...recentSearches.filter((s) => {
        if (item.type === 'user' && s.user && item.user) {
          return s.user.id !== item.user.id;
        }
        return s.query.toLowerCase() !== item.query.toLowerCase();
      }),
    ].slice(0, 20);

    saveRecentSearches(updated);
  };

  const removeRecentSearch = (id: string) => {
    const updated = recentSearches.filter((s) => s.id !== id);
    saveRecentSearches(updated);
  };

  const clearAllRecent = () => {
    saveRecentSearches([]);
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsRefreshing(false);
  };

  // Live Typeahead Suggestions from Search Engine
  const liveSuggestions: SearchSuggestionItem[] = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchEngine.getSuggestions(searchQuery, 8);
  }, [searchQuery]);

  // Trending Aggregates
  const trendingHashtags = useMemo(() => searchEngine.getTrendingHashtags(8), [posts, reels]);
  const trendingLocations = useMemo(() => searchEngine.getTrendingLocations(6), [posts]);
  const trendingUsers = useMemo(() => searchEngine.getTrendingUsers(6), [availableProfiles]);

  // Filtered & Ranked Explore Items
  const filteredExploreItems = useMemo(() => {
    let categoryFilteredPosts = posts;
    let categoryFilteredReels = reels;

    // Apply category filter if not "For You"
    if (selectedCategory !== 'For You') {
      const catKeywords = selectedCategory.toLowerCase().split(/[&\s]+/);
      categoryFilteredPosts = posts.filter((p) => {
        const text = `${p.caption} ${(p.tags || []).join(' ')} ${p.location || ''}`.toLowerCase();
        return catKeywords.some((kw) => text.includes(kw));
      });
      categoryFilteredReels = reels.filter((r) => {
        const text = `${r.caption} ${(r.tags || []).join(' ')}`.toLowerCase();
        return catKeywords.some((kw) => text.includes(kw));
      });
    }

    return searchEngine.search(searchQuery, filters, categoryFilteredPosts, categoryFilteredReels);
  }, [posts, reels, searchQuery, selectedCategory, filters]);

  // Trending Highlight Posts (Top 3 by score)
  const trendingHighlightPosts = useMemo(() => {
    const all = [...posts, ...reels];
    return all
      .sort((a, b) => (b.likesCount * 1.5 + b.commentsCount * 3) - (a.likesCount * 1.5 + a.commentsCount * 3))
      .slice(0, 3);
  }, [posts, reels]);

  // Actions
  const handleSelectUser = (user: User) => {
    addRecentSearch({
      type: 'user',
      query: `@${user.username}`,
      subtitle: user.name,
      user,
    });
    setIsSearchFocused(false);
    setSelectedUserProfile(user);
  };

  const handleSelectHashtag = (tag: string) => {
    setSearchQuery(tag);
    addRecentSearch({
      type: 'hashtag',
      query: tag,
      subtitle: 'Hashtag',
    });
    setIsSearchFocused(false);
  };

  const handleSelectLocation = (location: string) => {
    setSearchQuery(location);
    addRecentSearch({
      type: 'location',
      query: location,
      subtitle: 'Geotag',
    });
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch({
        type: 'query',
        query: searchQuery.trim(),
      });
      setIsSearchFocused(false);
    }
  };

  const handleOpenItem = (item: Post | Reel) => {
    if ('videoUrl' in item) {
      const rIdx = reels.findIndex((r) => r.id === item.id);
      if (rIdx >= 0) {
        setActiveReelIndex(rIdx);
      }
      setActiveTab('reels');
    } else {
      openExplorePost(item as Post);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-6 pb-24 sm:pb-12 pt-2 sm:pt-6 space-y-4">
        {/* TOP SEARCH BAR & CONTROLS */}
        <div className="relative z-30" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200/90 dark:border-neutral-800 transition-all focus-within:border-neutral-900 dark:focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-900/5 dark:focus-within:ring-white/5 shadow-soft-xs">
              <Search size={18} className="text-neutral-400 flex-shrink-0" />
              
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                  if (aiSearchInsight) setAiSearchInsight(null);
                }}
                placeholder="Search accounts, #hashtags, places, or keywords..."
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
              />

              {/* Clear button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setAiSearchInsight(null);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer rounded-full"
                >
                  <X size={15} />
                </button>
              )}

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={() => setIsVoiceSearchOpen(true)}
                className="p-1.5 text-neutral-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-xl transition-colors cursor-pointer"
                title="Search with Voice"
              >
                <Mic size={16} />
              </button>

              {/* Search History Button */}
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                title="Search History"
              >
                <History size={16} />
              </button>
            </div>
          </form>

          {/* AUTOCOMPLETE / RECENT SEARCHES DROPDOWN */}
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-soft-xl overflow-hidden z-40 max-h-[70vh] flex flex-col"
              >
                {/* 1. Live Typeahead Matching Suggestions */}
                {searchQuery.trim().length > 0 && liveSuggestions.length > 0 && (
                  <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 overflow-y-auto no-scrollbar">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
                      <span>Quick Suggestions</span>
                      <span className="text-[10px] font-normal lowercase text-neutral-400">fast indexing</span>
                    </div>

                    <div className="space-y-1 mt-1">
                      {liveSuggestions.map((sugg) => (
                        <div
                          key={sugg.id}
                          onClick={() => {
                            if (sugg.type === 'user' && sugg.data?.user) {
                              handleSelectUser(sugg.data.user);
                            } else if (sugg.type === 'hashtag') {
                              handleSelectHashtag(sugg.title);
                            } else if (sugg.type === 'location') {
                              handleSelectLocation(sugg.title);
                            } else {
                              setSearchQuery(sugg.title);
                              setIsSearchFocused(false);
                            }
                          }}
                          className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {sugg.type === 'user' && sugg.avatar ? (
                              <img
                                src={sugg.avatar}
                                alt={sugg.title}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
                                {sugg.type === 'hashtag' ? <Hash size={15} /> : <MapPin size={15} />}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                  {sugg.title}
                                </span>
                                {sugg.isVerified && (
                                  <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                    ✓
                                  </span>
                                )}
                                {sugg.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                    {sugg.badge}
                                  </span>
                                )}
                              </div>
                              {sugg.subtitle && (
                                <p className="text-[11px] text-neutral-400 truncate">
                                  {sugg.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <ArrowRight size={14} className="text-neutral-400 mr-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Recent Searches Header & Items */}
                <div className="p-3 flex-1 overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Recent Searches
                    </span>
                    {recentSearches.length > 0 && (
                      <button
                        onClick={clearAllRecent}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {recentSearches.length === 0 ? (
                    <div className="py-6 text-center space-y-1">
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        No recent searches
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Try searching for trending creators, places, or hashtags
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1">
                      {recentSearches.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.type === 'user' && item.user) {
                              handleSelectUser(item.user);
                            } else if (item.type === 'hashtag') {
                              handleSelectHashtag(item.query);
                            } else if (item.type === 'location') {
                              handleSelectLocation(item.query);
                            } else {
                              setSearchQuery(item.query);
                              setIsSearchFocused(false);
                            }
                          }}
                          className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.type === 'user' && item.user ? (
                              <img
                                src={item.user.avatar}
                                alt={item.user.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                                {item.type === 'hashtag' ? (
                                  <Hash size={14} />
                                ) : item.type === 'location' ? (
                                  <MapPin size={14} />
                                ) : (
                                  <History size={14} />
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                {item.query}
                              </p>
                              {item.subtitle && (
                                <p className="text-[10px] text-neutral-400 truncate">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(item.id);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                            title="Remove from recent"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI SEARCH INSIGHT BANNER (If semantic AI query triggered) */}
        {aiSearchInsight && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-200 dark:border-purple-900/50 rounded-2xl text-xs font-medium text-purple-700 dark:text-purple-300 shadow-soft-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-purple-500 flex-shrink-0" />
              <span>{aiSearchInsight}</span>
            </div>
            <button
              onClick={() => setAiSearchInsight(null)}
              className="text-purple-400 hover:text-purple-700 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* EXPLORE NAVIGATION MODES (Trending, AI For You, All) */}
        <div className="flex items-center justify-between gap-2">
          {/* Main Views */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-soft-xs">
            {[
              { id: 'all', label: 'Discovery Feed', icon: Sparkles },
              { id: 'trending', label: 'Trending Hub', icon: Flame },
              { id: 'ai', label: 'AI Curated', icon: Zap },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = viewMode === id;
              return (
                <button
                  key={id}
                  onClick={() => setViewMode(id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-soft-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={13} className={isActive ? (id === 'trending' ? 'text-amber-400' : id === 'ai' ? 'text-purple-400' : 'text-pink-400') : ''} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Create CTA */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-amber-500 text-white rounded-2xl text-xs font-bold shadow-soft hover:opacity-95 transition-opacity cursor-pointer active:scale-95"
          >
            <Camera size={13} />
            <span>Create</span>
          </button>
        </div>

        {/* CATEGORY HORIZONTAL PILL STRIP */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {EXPLORE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-colors flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeExploreCategory"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-2xl -z-10 shadow-soft-xs"
                  />
                )}
                {cat}
              </button>
            );
          })}
        </div>

        {/* ADVANCED FILTERS BAR */}
        <ExploreFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          totalResultsCount={filteredExploreItems.length}
        />

        {/* VIEW MODE 1: TRENDING HUB */}
        {viewMode === 'trending' && (
          <TrendingHub
            trendingPosts={trendingHighlightPosts}
            trendingHashtags={trendingHashtags}
            trendingUsers={trendingUsers}
            trendingLocations={trendingLocations}
            onSelectHashtag={handleSelectHashtag}
            onSelectLocation={handleSelectLocation}
            onOpenPost={handleOpenItem}
            onSelectUser={handleSelectUser}
          />
        )}

        {/* VIEW MODE 2: AI RECOMMENDATIONS ENGINE */}
        {viewMode === 'ai' && (
          <AiRecommendations
            activeCategory={selectedCategory}
            onSelectTag={handleSelectHashtag}
            onApplyAiQuery={(query, insight) => {
              setSearchQuery(query);
              if (insight) setAiSearchInsight(insight);
            }}
          />
        )}

        {/* VIEW MODE 3: ALL / DISCOVERY (Includes AI Highlights + Trending Snippets + Masonry Grid) */}
        {viewMode === 'all' && !searchQuery && (
          <>
            {/* AI Recommendation Snippet Banner */}
            <AiRecommendations
              activeCategory={selectedCategory}
              onSelectTag={handleSelectHashtag}
              onApplyAiQuery={(query, insight) => {
                setSearchQuery(query);
                if (insight) setAiSearchInsight(insight);
              }}
            />

            {/* Trending highlights summary */}
            <TrendingHub
              trendingPosts={trendingHighlightPosts}
              trendingHashtags={trendingHashtags}
              trendingUsers={trendingUsers}
              trendingLocations={trendingLocations}
              onSelectHashtag={handleSelectHashtag}
              onSelectLocation={handleSelectLocation}
              onOpenPost={handleOpenItem}
              onSelectUser={handleSelectUser}
            />
          </>
        )}

        {/* MAIN INFINITE MASONRY GRID OR EMPTY RESULTS */}
        {isRefreshing ? (
          <ExploreSkeleton />
        ) : filteredExploreItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 text-center space-y-3 shadow-soft"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              <Camera size={24} />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              {searchQuery ? `No results for "${searchQuery}"` : 'No media found in this filter'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              {searchQuery
                ? 'Try searching for another creator, place, or hashtag'
                : 'Adjust your filters or be the first to create new content!'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Clear search
                </button>
              )}
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-xs font-bold shadow-soft cursor-pointer active:scale-95 transition-transform"
              >
                Create Post
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {searchQuery ? `Search Results for "${searchQuery}"` : `${selectedCategory} Discovery`}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {filteredExploreItems.length} items
              </span>
            </div>

            {/* True Infinite Masonry Grid */}
            <MasonryGrid
              items={filteredExploreItems}
              onOpenPost={handleOpenItem}
            />
          </div>
        )}

        {/* VOICE SEARCH MODAL */}
        <VoiceSearchModal
          isOpen={isVoiceSearchOpen}
          onClose={() => setIsVoiceSearchOpen(false)}
          onTranscript={(text) => {
            setSearchQuery(text);
            addRecentSearch({
              type: 'query',
              query: text,
              subtitle: 'Voice search',
            });
          }}
        />

        {/* SEARCH HISTORY MODAL */}
        <SearchHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          historyItems={recentSearches}
          onSelectItem={(item) => {
            if (item.type === 'user' && item.user) {
              handleSelectUser(item.user);
            } else if (item.type === 'hashtag') {
              handleSelectHashtag(item.query);
            } else if (item.type === 'location') {
              handleSelectLocation(item.query);
            } else {
              setSearchQuery(item.query);
            }
          }}
          onRemoveItem={removeRecentSearch}
          onClearAll={clearAllRecent}
        />
      </div>
    </PullToRefresh>
  );
};
