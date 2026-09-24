import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  X,
  Trash2,
  Clock,
  Search,
  Hash,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { RecentSearchItem } from '../../lib/searchIndex';

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: RecentSearchItem[];
  onSelectItem: (item: RecentSearchItem) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  onClose,
  historyItems,
  onSelectItem,
  onRemoveItem,
  onClearAll,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'query' | 'user' | 'hashtag' | 'location'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredHistory = historyItems.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchTerm) {
      return item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                Search & Discovery History
              </h3>
              <p className="text-[11px] text-neutral-400">
                {historyItems.length} saved searches
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter input & type pills */}
        <div className="py-3 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200/60 dark:border-neutral-700">
            <Search size={14} className="text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter history..."
              className="w-full text-xs bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'query', label: 'Keywords' },
              { id: 'user', label: 'Accounts' },
              { id: 'hashtag', label: 'Tags' },
              { id: 'location', label: 'Places' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilterType(id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 min-h-48 py-1">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Clock size={28} className="mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                No matching search history
              </p>
              <p className="text-[11px] text-neutral-400">
                Recent searches will be saved here automatically
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.type === 'user' && item.user ? (
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                      {item.type === 'hashtag' ? (
                        <Hash size={16} />
                      ) : item.type === 'location' ? (
                        <MapPin size={16} />
                      ) : item.type === 'user' ? (
                        <UserIcon size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {item.query}
                    </p>
                    <p className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                      <span>{formatTimeAgo(item.timestamp)}</span>
                      {item.subtitle && <span>• {item.subtitle}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    title="Remove from history"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ArrowRight size={14} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          {historyItems.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={13} />
              Clear all history
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
