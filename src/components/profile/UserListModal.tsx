import React from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export const UserListModal: React.FC = () => {
  const { userListModal, setUserListModal, toggleFollowUser, currentUser, setSelectedUserProfile } = useApp();

  if (!userListModal) return null;

  const handleSelectUser = (u: User) => {
    setUserListModal(null);
    setSelectedUserProfile(u);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="absolute inset-0"
        onClick={() => setUserListModal(null)}
      />

      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
          <div className="w-5" />
          <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            {userListModal.title}
          </h3>
          <button
            onClick={() => setUserListModal(null)}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Users list */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {userListModal.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800/60">
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

              {currentUser && u.id !== currentUser.id && (
                <button
                  onClick={() => toggleFollowUser(u.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    u.isFollowing
                      ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-xs'
                  }`}
                >
                  {u.isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
