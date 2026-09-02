import React, { useState } from 'react';
import { X, Search, Check, MessageCircle, Sparkles, User as UserIcon } from 'lucide-react';
import { User } from '../../types';
import { useApp } from '../../context/AppContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const { availableProfiles, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!isOpen) return null;

  const selectableUsers = availableProfiles.filter((u) => u.id !== currentUser.id);

  const filteredUsers = selectableUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartChat = () => {
    if (selectedUser) {
      onSelectUser(selectedUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <h3 className="font-bold text-base text-slate-900 dark:text-white">New message</h3>

          <button
            onClick={handleStartChat}
            disabled={!selectedUser}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-2 py-1"
          >
            Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">To:</span>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              autoFocus
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-neutral-800/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Selected Chips */}
        {selectedUser && (
          <div className="px-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 flex items-center gap-2 border-b border-blue-100/50 dark:border-blue-900/30">
            <div className="flex items-center gap-1.5 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              <span>@{selectedUser.username}</span>
              <button
                onClick={() => setSelectedUser(null)}
                className="hover:bg-blue-600 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50 dark:divide-neutral-800/50 no-scrollbar">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Suggested
          </p>

          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <UserIcon size={32} className="mx-auto text-slate-300 dark:text-neutral-600" />
              <p className="text-xs font-semibold">No users found</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(isSelected ? null : u)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {u.username}
                        {u.isVerified && (
                          <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px]">
                            ✓
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">{u.name}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-slate-300 dark:border-neutral-600'
                    }`}
                  >
                    {isSelected && <Check size={12} className="stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
