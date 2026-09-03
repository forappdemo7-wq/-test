import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Lock,
  Star,
  Ban,
  Check,
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  X,
  Clock,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SettingsPrivacyView: React.FC = () => {
  const {
    availableProfiles,
    currentUser,
    updateProfile,
    blockedUserIds,
    blockUser,
    unblockUser,
    closeFriendIds,
    toggleCloseFriend,
    restrictedUserIds,
    restrictUser,
    unrestrictUser,
    pendingFollowRequests,
    acceptFollowRequest,
    declineFollowRequest,
  } = useApp();

  const [subSection, setSubSection] = useState<'main' | 'close_friends' | 'blocked' | 'restricted' | 'requests'>('main');
  const [isPrivate, setIsPrivate] = useState<boolean>(Boolean(currentUser?.isPrivate));
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);
  const [showPublicConfirm, setShowPublicConfirm] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsPrivate(Boolean(currentUser.isPrivate));
    }
  }, [currentUser?.isPrivate]);

  // Search queries
  const [friendSearch, setFriendSearch] = useState('');
  const [restrictedSearch, setRestrictedSearch] = useState('');

  const otherUsers = availableProfiles.filter((u) => u.id !== currentUser?.id);

  const filteredFriends = otherUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(friendSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const filteredUsersForRestrict = otherUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(restrictedSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(restrictedSearch.toLowerCase())
  );

  const handleToggleBlock = async (userId: string) => {
    if (blockedUserIds.includes(userId)) {
      await unblockUser(userId);
      toast.success('User unblocked');
    } else {
      await blockUser(userId);
      toast.success('User blocked');
    }
  };

  const handleToggleRestrict = async (userId: string, username: string) => {
    if (restrictedUserIds.includes(userId)) {
      await unrestrictUser(userId);
      toast.success(`Unrestricted @${username}`);
    } else {
      await restrictUser(userId);
      toast.success(`Restricted @${username}`);
    }
  };

  const handleConfirmSwitchToPrivate = async () => {
    setIsUpdatingPrivacy(true);
    try {
      await updateProfile({ isPrivate: true });
      setIsPrivate(true);
      setShowPrivateConfirm(false);
      toast.success('Account switched to Private');
    } catch {
      toast.error('Failed to update account privacy');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleConfirmSwitchToPublic = async () => {
    setIsUpdatingPrivacy(true);
    try {
      await updateProfile({ isPrivate: false });
      setIsPrivate(false);
      setShowPublicConfirm(false);
      toast.success('Account switched to Public');
    } catch {
      toast.error('Failed to update account privacy');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  if (subSection === 'requests') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-blue-500" />
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              Follow Requests ({pendingFollowRequests.length})
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            People who want to follow you. When you approve, they can see your posts and stories.
          </p>
        </div>

        {pendingFollowRequests.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 space-y-2">
            <Clock size={36} className="mx-auto text-neutral-400" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No pending requests
            </p>
            <p className="text-xs text-neutral-500">When people request to follow you, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingFollowRequests.map((req) => (
              <div
                key={req.id || req.user_id}
                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                    alt={req.name || req.username}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-neutral-950 dark:text-white">
                      {req.username}
                    </p>
                    <p className="text-[11px] text-neutral-500">{req.name || req.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptFollowRequest(req.id || req.user_id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => declineFollowRequest(req.id || req.user_id)}
                    className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
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

  if (subSection === 'restricted') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-500" />
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              Restricted Accounts ({restrictedUserIds.length})
            </h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Protect yourself from unwanted interactions without having to block or unfollow someone.
          </p>
          <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 list-disc list-inside space-y-1 pt-1">
            <li>Their comments on your posts will only be visible to them unless you approve them.</li>
            <li>They won&apos;t see when you&apos;re online or if you&apos;ve read their messages.</li>
            <li>Their direct messages will automatically go to your Message Requests.</li>
          </ul>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search accounts to restrict..."
            value={restrictedSearch}
            onChange={(e) => setRestrictedSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* User list */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto no-scrollbar">
          {restrictedUserIds.length > 0 && !restrictedSearch && (
            <div className="space-y-1.5 pb-2">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                Restricted ({restrictedUserIds.length})
              </p>
              {otherUsers
                .filter((u) => restrictedUserIds.includes(u.id))
                .map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60"
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
                      onClick={() => handleToggleRestrict(u.id, u.username)}
                      className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-900 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Unrestrict
                    </button>
                  </div>
                ))}
            </div>
          )}

          {restrictedSearch && (
            <div className="space-y-1.5">
              {filteredUsersForRestrict.map((u) => {
                const isUserRestricted = restrictedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
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

                    <button
                      onClick={() => handleToggleRestrict(u.id, u.username)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isUserRestricted
                          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      {isUserRestricted ? 'Unrestrict' : 'Restrict'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {restrictedUserIds.length === 0 && !restrictedSearch && (
            <div className="py-10 text-center text-neutral-400 space-y-2">
              <ShieldCheck size={36} className="mx-auto text-amber-500" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No restricted accounts
              </p>
              <p className="text-xs text-neutral-500">Search above to restrict an account.</p>
            </div>
          )}
        </div>

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
            <Lock size={20} className={isPrivate ? "text-blue-500" : "text-neutral-700 dark:text-neutral-300"} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                  Private Account
                </p>
                {isPrivate && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    Private
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                {isPrivate ? 'Only approved followers can see your photos, reels, and stories' : 'Anyone on or off InstaVibe can see your posts and stories'}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isPrivate}
            disabled={isUpdatingPrivacy}
            onChange={(e) => {
              if (e.target.checked) {
                setShowPrivateConfirm(true);
                setShowPublicConfirm(false);
              } else {
                setShowPublicConfirm(true);
                setShowPrivateConfirm(false);
              }
            }}
            className="w-5 h-5 accent-blue-500 cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Confirmation Modal to Switch to Private */}
        {showPrivateConfirm && (
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
              <Lock size={15} />
              <span>Switch to private account?</span>
            </div>
            <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
              Only people you approve will be able to see your photos, reels, and stories. Existing followers won&apos;t be affected.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmSwitchToPrivate}
                disabled={isUpdatingPrivacy}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isUpdatingPrivacy ? 'Updating...' : 'Switch to Private'}
              </button>
              <button
                onClick={() => setShowPrivateConfirm(false)}
                disabled={isUpdatingPrivacy}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal to Switch to Public */}
        {showPublicConfirm && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
              <AlertCircle size={15} />
              <span>Switch to public account?</span>
            </div>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
              Anyone on or off InstaVibe will be able to see your photos, reels, and stories. Any pending follow requests will be automatically accepted.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmSwitchToPublic}
                disabled={isUpdatingPrivacy}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isUpdatingPrivacy ? 'Updating...' : 'Switch to Public'}
              </button>
              <button
                onClick={() => setShowPublicConfirm(false)}
                disabled={isUpdatingPrivacy}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Follow Requests Shortcut (if private or has pending requests) */}
      {(isPrivate || pendingFollowRequests.length > 0) && (
        <button
          onClick={() => setSubSection('requests')}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserPlus size={20} className="text-blue-500" />
              {pendingFollowRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                Follow Requests
              </p>
              <p className="text-xs text-neutral-500">
                {pendingFollowRequests.length === 0
                  ? 'No pending requests'
                  : `${pendingFollowRequests.length} pending request${pendingFollowRequests.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          {pendingFollowRequests.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">
              {pendingFollowRequests.length}
            </span>
          ) : (
            <span className="text-xs font-bold text-neutral-400">View</span>
          )}
        </button>
      )}

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

      {/* 3. Restricted Accounts button */}
      <button
        onClick={() => setSubSection('restricted')}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-neutral-950 dark:text-white">
              Restricted Accounts
            </p>
            <p className="text-xs text-neutral-500">{restrictedUserIds.length} accounts</p>
          </div>
        </div>
        <span className="text-xs font-bold text-neutral-400">View</span>
      </button>

      {/* 4. Blocked Accounts button */}
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

