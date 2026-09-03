import React, { useState } from 'react';
import {
  Heart,
  Send,
  PlusSquare,
  ChevronDown,
  Check,
  Menu,
  Lock,
  ArrowLeft,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SettingsDrawer } from '../profile/SettingsDrawer';

export const MobileHeader: React.FC = () => {
  const {
    currentUser,
    savedAccounts,
    switchProfile,
    activeTab,
    setActiveTab,
    unreadNotificationsCount,
    unreadMessagesCount,
    setIsCreateOpen,
    openAuthModal,
    activeThreadId,
  } = useApp();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  // In Direct Messages tab, DirectMessagesView manages the authentic Instagram top bar
  if (activeTab === 'messages') {
    return null;
  }

  // If on Profile Tab:
  // [ 🔒 username ⌄ ] ................ [ + ] [ ☰ ]
  if (activeTab === 'profile') {
    return (
      <>
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 glass-header transition-colors select-none">
          {/* Username with Account Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-left group focus:outline-none cursor-pointer py-0.5 active:scale-98 transition-transform"
            >
              {currentUser?.isPrivate && (
                <Lock size={14} className="text-neutral-700 dark:text-neutral-300 stroke-[2.5]" />
              )}
              <span className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                {currentUser?.username || 'Profile'}
              </span>
              <ChevronDown
                size={16}
                className={`text-neutral-500 transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Account switcher popup */}
            {isProfileDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 p-2.5 bg-white dark:bg-neutral-900 rounded-3xl shadow-soft-lg border border-neutral-200/80 dark:border-neutral-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Active Account
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {savedAccounts
                    .filter((p) => p && p.id && p.id !== 'guest_user' && (!currentUser || p.id === currentUser.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl text-left bg-neutral-100 dark:bg-neutral-800/80 font-bold text-neutral-950 dark:text-white shadow-soft-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight truncate">@{p.username}</p>
                            <p className="text-xs text-neutral-500 truncate">{p.name}</p>
                          </div>
                        </div>
                        <Check size={16} className="text-blue-500 stroke-[2.5]" />
                      </div>
                    ))}
                </div>

                <div className="pt-2 mt-1.5 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1">
                  <p className="px-3 py-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Only your authenticated profile data is accessible. Other accounts are filtered out.
                  </p>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      openAuthModal('signin');
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <LogIn size={15} className="text-blue-500" />
                    <span>Log into another account</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons for Profile: Create [+] and Settings [☰] */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCreateOpen(true)}
              title="Create Post, Reel, or Story"
              className="p-2 text-neutral-900 dark:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all duration-150 cursor-pointer active:scale-90"
            >
              <PlusSquare size={24} className="stroke-[1.85px]" />
            </button>

            <button
              onClick={() => setIsSettingsDrawerOpen(true)}
              title="Settings and activity"
              className="p-2 text-neutral-900 dark:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all duration-150 cursor-pointer active:scale-90"
            >
              <Menu size={24} className="stroke-[1.85px]" />
            </button>
          </div>
        </header>

        {/* Instagram Settings and Activity Drawer */}
        <SettingsDrawer
          isOpen={isSettingsDrawerOpen}
          onClose={() => setIsSettingsDrawerOpen(false)}
        />
      </>
    );
  }

  // Home Feed or other tabs
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 glass-header transition-colors select-none">
      {/* Brand / Logo or Account Switcher */}
      <div className="relative flex items-center">
        <button
          onClick={() => setActiveTab('feed')}
          className="flex items-center gap-1 text-left focus:outline-none cursor-pointer group"
        >
          <span className="font-insta-logo text-3xl leading-none text-neutral-950 dark:text-white tracking-tight pt-1 group-hover:opacity-85 transition-opacity">
            InstaVibe
          </span>
        </button>
      </div>

      {/* Right Icons for Home: Heart (Notifications) & Direct Messages */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('notifications')}
          title="Notifications"
          className="relative p-2 text-neutral-900 dark:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 rounded-full transition-all duration-150 cursor-pointer active:scale-90"
        >
          <Heart size={24} className="stroke-[1.85px]" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute 1.5 top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-neutral-950 shadow-soft-xs" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          title="Direct Messages"
          className="relative p-2 text-neutral-900 dark:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 rounded-full transition-all duration-150 cursor-pointer active:scale-90"
        >
          <Send size={24} className="stroke-[1.85px] rotate-[10deg]" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-950 shadow-soft-xs">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
