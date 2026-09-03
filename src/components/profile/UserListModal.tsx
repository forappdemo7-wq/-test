import React, { useState } from 'react';
import { X, Search, UserMinus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export const UserListModal: React.FC = () => {
  const {
    userListModal,
    setUserListModal,
    toggleFollowUser,
    removeFollower,
    currentUser,
    selectedUserProfile,
    setSelectedUserProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  if (!userListModal) return null;

  const isOwnFollowersList =
    userListModal.title.toLowerCase().includes('follower') &&
    (!selectedUserProfile || selectedUserProfile.id === currentUser?.id);

  const filteredUsers = userListModal.users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (u: User) => {
    setUserListModal(null);
    setSelectedUserProfile(u);
  };

  const handleConfirmRemoveFollower = async () => {
    if (!userToRemove) return;
    setIsRemoving(true);
    try {
      await removeFollower(userToRemove.id);
      setUserToRemove(null);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="absolute inset-0" onClick={() => setUserListModal(null)} />

        <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
            <div className="w-5" />
            <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              {userListModal.title}
            </h3>
            <button
              onClick={() => setUserListModal(null)}
              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar */}
          {userListModal.users.length > 5 && (
            <div className="px-4 pt-3 pb-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-neutral-800/80 text-xs text-slate-900 dark:text-white pl-8 pr-3 py-2 rounded-xl border border-transparent focus:border-slate-300 dark:focus:border-neutral-700 outline-none"
                />
              </div>
            </div>
          )}

          {/* Users list */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {searchQuery ? 'No users matching your search' : 'No users to display'}
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  <div
                    onClick={() => handleSelectUser(u)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {u.username}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{u.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    {isOwnFollowersList && currentUser && u.id !== currentUser.id && (
                      <button
                        onClick={() => setUserToRemove(u)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove follower"
                      >
                        Remove
                      </button>
                    )}

                    {currentUser && u.id !== currentUser.id && !isOwnFollowersList && (
                      <button
                        onClick={() => toggleFollowUser(u.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          u.isFollowing
                            ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                            : u.hasRequestedFollow
                            ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700'
                            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-xs'
                        }`}
                      >
                        {u.isFollowing ? 'Following' : u.hasRequestedFollow ? 'Requested' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Remove Follower Confirmation Modal */}
      {userToRemove && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-3.5 relative">
              <img
                src={userToRemove.avatar}
                alt={userToRemove.username}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow-sm">
                <UserMinus size={13} />
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Remove follower?
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-5 leading-relaxed">
              InstaVibe won't tell <span className="font-semibold text-slate-800 dark:text-slate-200">@{userToRemove.username}</span> they were removed from your followers.
            </p>

            <div className="space-y-2">
              <button
                disabled={isRemoving}
                onClick={handleConfirmRemoveFollower}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </button>
              <button
                disabled={isRemoving}
                onClick={() => setUserToRemove(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
