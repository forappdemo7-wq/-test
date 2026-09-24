import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal,
  Flame,
  Clock,
  Heart,
  MessageCircle,
  Image,
  Film,
  Layers,
  MapPin,
  CheckCircle,
  RotateCcw,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { AdvancedFilterOptions } from '../../lib/searchIndex';

interface ExploreFiltersProps {
  filters: AdvancedFilterOptions;
  onChange: (filters: AdvancedFilterOptions) => void;
  onReset: () => void;
  totalResultsCount: number;
}

export const ExploreFilters: React.FC<ExploreFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResultsCount,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeFilterCount =
    (filters.mediaType !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'trending' ? 1 : 0) +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.hasLocationOnly ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  const handleUpdate = (partial: Partial<AdvancedFilterOptions>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="w-full space-y-2">
      {/* Quick Filter Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Media Type Chips */}
        <div className="flex items-center gap-1.5 flex-nowrap">
          {[
            { id: 'all', label: 'All Content', icon: null },
            { id: 'photo', label: 'Photos', icon: Image },
            { id: 'reel', label: 'Reels', icon: Film },
            { id: 'carousel', label: 'Carousels', icon: Layers },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = filters.mediaType === id;
            return (
              <button
                key={id}
                onClick={() => handleUpdate({ mediaType: id as any })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-soft-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {Icon && <Icon size={13} />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Drawer Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activeFilterCount > 0 || isDrawerOpen
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isDrawerOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filter Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-soft space-y-4"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Advanced Discover Filters
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {totalResultsCount} matching {totalResultsCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Grid of options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={13} className="text-amber-500" />
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'trending', label: 'Trending', icon: Flame },
                    { id: 'latest', label: 'Latest', icon: Clock },
                    { id: 'likes', label: 'Top Likes', icon: Heart },
                    { id: 'comments', label: 'Discussions', icon: MessageCircle },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => handleUpdate({ sortBy: id as any })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        filters.sortBy === id
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon size={12} />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-500" />
                  Timeframe
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Past 24h' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => handleUpdate({ dateRange: id as any })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                        filters.dateRange === id
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges & Special Toggles */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-500" />
                  Requirements
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleUpdate({ hasLocationOnly: !filters.hasLocationOnly })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      filters.hasLocationOnly
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      Has Geotag
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center text-[9px] ${
                        filters.hasLocationOnly
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {filters.hasLocationOnly && '✓'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleUpdate({ verifiedOnly: !filters.verifiedOnly })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      filters.verifiedOnly
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle size={13} />
                      Verified Creators Only
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center text-[9px] ${
                        filters.verifiedOnly
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {filters.verifiedOnly && '✓'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={onReset}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Reset to default
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
