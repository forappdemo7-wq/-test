import React, { useState } from 'react';
import { Lock, Star, Ban, Check, UserPlus, Search, ShieldCheck } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SettingsPrivacyView: React.FC = () => {
  const { availableProfiles, currentUser, blockedUserIds, blockUser, unblockUser } = useApp();
  const [subSection, setSubSection] = useState<'main' | 'close_friends' | 'blocked'>('main');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);

  // Close friends list
  const [closeFriendIds, setCloseFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');

  const otherUsers = availableProfiles.filter((u) => u.id !== currentUser.id);

  const filteredFriends = otherUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(friendSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const toggleCloseFriend = (userId: string) => {
    setCloseFriendIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleBlock = async (userId: string) => {
    if (blockedUserIds.includes(userId)) {
      await unblockUser(userId);
    } else {
      await blockUser(userId);
    }
  };

  if (subSection === 'close_friends') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Star size={20} className="text-emerald-500 fill-emerald-500" />
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              Close Friends ({closeFriendIds.length})
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            We don&apos;t send notifications when you edit your Close Friends list.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={friendSearch}
            onChange={(e) => setFriendSearch(e.target.value)}
            placeholder="Search followers..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
          />
        </div>

        {/* User list */}
        <div className="space-y-1">
          {filteredFriends.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-6">No users found</p>
          ) : (
            filteredFriends.map((u) => {
              const isSelected = closeFriendIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleCloseFriend(u.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-neutral-950 dark:text-white">
                        {u.username}
                      </p>
                      <p className="text-[11px] text-neutral-500">{u.name}</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={() => setSubSection('main')}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
        >
          Done ({closeFriendIds.length} selected)
        </button>
      </div>
    );
  }

  if (subSection === 'blocked') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ban size={20} className="text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              Blocked Accounts ({blockedUserIds.length})
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            Blocked accounts cannot find your profile, posts, reels, or stories on InstaVibe.
          </p>
        </div>

        {blockedUserIds.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 space-y-2">
            <ShieldCheck size={36} className="mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No blocked accounts
            </p>
            <p className="text-xs text-neutral-500">You haven&apos;t blocked anyone yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {otherUsers
              .filter((u) => blockedUserIds.includes(u.id))
              .map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-neutral-950 dark:text-white">
                        {u.username}
                      </p>
                      <p className="text-[11px] text-neutral-500">{u.name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleBlock(u.id)}
                    className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-900 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
          </div>
        )}

        <button
          onClick={() => setSubSection('main')}
          className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
      {/* 1. Account Privacy Card */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-neutral-700 dark:text-neutral-300" />
            <div>
              <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                Private Account
              </p>
              <p className="text-xs text-neutral-500">
                {isPrivate ? 'Only approved followers can see your content' : 'Anyone on or off InstaVibe can see your posts'}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => {
              if (e.target.checked) {
                setShowPrivateConfirm(true);
              } else {
                setIsPrivate(false);
              }
            }}
            className="w-5 h-5 accent-blue-500 cursor-pointer"
          />
        </div>

        {showPrivateConfirm && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 space-y-2 text-xs">
            <p className="font-bold text-blue-900 dark:text-blue-200">Switch to private account?</p>
            <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
              Only people you approve will be able to see your photos and videos. Existing followers won&apos;t be affected.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setIsPrivate(true);
                  setShowPrivateConfirm(false);
                }}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold cursor-pointer"
              >
                Switch to Private
              </button>
              <button
                onClick={() => setShowPrivateConfirm(false)}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Close Friends button */}
      <button
        onClick={() => setSubSection('close_friends')}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Star size={20} className="text-emerald-500 fill-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-neutral-950 dark:text-white">Close Friends</p>
            <p className="text-xs text-neutral-500">{closeFriendIds.length} accounts</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-500">Edit</span>
      </button>

      {/* 3. Blocked Accounts button */}
      <button
        onClick={() => setSubSection('blocked')}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Ban size={20} className="text-neutral-700 dark:text-neutral-300" />
          <div>
            <p className="text-sm font-semibold text-neutral-950 dark:text-white">
              Blocked Accounts
            </p>
            <p className="text-xs text-neutral-500">{blockedUserIds.length} accounts</p>
          </div>
        </div>
        <span className="text-xs font-bold text-neutral-400">View</span>
      </button>
    </div>
  );
};
