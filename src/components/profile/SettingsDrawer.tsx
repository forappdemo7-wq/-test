import React, { useState } from 'react';
import {
  X,
  Search,
  ChevronRight,
  Bookmark,
  Clock,
  Bell,
  Lock,
  Star,
  Ban,
  MessageCircle,
  Tag,
  Share2,
  Moon,
  Sun,
  Globe,
  HardDrive,
  HelpCircle,
  Shield,
  Info,
  UserPlus,
  ArrowLeftRight,
  LogOut,
  LogIn,
  User,
  Check,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Sub-views
import { SettingsSavedView } from './settings/SettingsSavedView';
import { SettingsActivityView } from './settings/SettingsActivityView';
import { SettingsNotificationsView } from './settings/SettingsNotificationsView';
import { SettingsPrivacyView } from './settings/SettingsPrivacyView';
import { SettingsInteractionsView } from './settings/SettingsInteractionsView';
import { SettingsHelpView } from './settings/SettingsHelpView';
import { SettingsLanguageView } from './settings/SettingsLanguageView';
import { SettingsMediaView } from './settings/SettingsMediaView';
import { SettingsSecurityView } from './settings/SettingsSecurityView';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    savedAccounts,
    removeSavedAccount,
    availableProfiles,
    switchProfile,
    isDark,
    toggleDarkMode,
    setIsEditProfileOpen,
    openAuthModal,
    logout,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubView, setActiveSubView] = useState<string | null>(null);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  const handleEditProfileClick = () => {
    onClose();
    setIsEditProfileOpen(true);
  };

  const handleSwitchAccount = () => {
    setActiveSubView('Switch accounts');
  };

  const handleAddAccount = () => {
    onClose();
    openAuthModal('signup');
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[28px] sm:rounded-3xl border-t sm:border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 duration-200">
        {/* Top Handle on Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/80">
          {activeSubView ? (
            <button
              onClick={() => setActiveSubView(null)}
              className="p-1 -ml-1 text-neutral-800 dark:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <h2 className="text-base font-bold text-neutral-950 dark:text-white tracking-tight">
            {activeSubView ? activeSubView : 'Settings and activity'}
          </h2>

          <button
            onClick={onClose}
            className="p-1 -mr-1 text-neutral-500 hover:text-neutral-950 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Render Specific Subviews */}
        {activeSubView === 'Saved' && <SettingsSavedView onBack={() => setActiveSubView(null)} />}
        {activeSubView === 'Your activity' && <SettingsActivityView />}
        {activeSubView === 'Notifications' && <SettingsNotificationsView />}
        {activeSubView === 'Account privacy' && <SettingsPrivacyView />}
        {(activeSubView === 'Password and security' || activeSubView === 'Security & Sessions') && <SettingsSecurityView />}
        {activeSubView === 'Close Friends' && <SettingsPrivacyView />}
        {activeSubView === 'Blocked accounts' && <SettingsPrivacyView />}
        {activeSubView === 'Messages and replies' && <SettingsInteractionsView />}
        {activeSubView === 'Tags and mentions' && <SettingsInteractionsView />}
        {activeSubView === 'Comments and sharing' && <SettingsInteractionsView />}
        {activeSubView === 'Help & Support' && <SettingsHelpView />}
        {activeSubView === 'Language' && <SettingsLanguageView />}
        {activeSubView === 'Media quality' && <SettingsMediaView />}

        {/* Switch accounts subview */}
        {activeSubView === 'Switch accounts' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm text-neutral-800 dark:text-neutral-200">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Logged in accounts</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Tap an account to switch instantly without losing your session.</p>
            </div>

            <div className="space-y-1.5">
              {(savedAccounts.length > 0 ? savedAccounts : availableProfiles.filter((u) => u.id !== 'guest_user')).map((user) => {
                const isCurrent = currentUser ? currentUser.id === user.id : false;
                return (
                  <div
                    key={user.id}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
                        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        switchProfile(user);
                        onClose();
                      }}
                      className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                          @{user.username}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">{user.name}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-1 rounded-full">
                          <Check size={14} className="stroke-[3]" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            switchProfile(user);
                            onClose();
                          }}
                          className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal('signin');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 text-neutral-900 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogIn size={16} />
                <span>Log into an existing account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal('signup');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <UserPlus size={16} />
                <span>Create new account</span>
              </button>
            </div>
          </div>
        )}

        {/* Dark Mode subview */}
        {activeSubView === 'Dark mode' && (
          <div className="p-5 space-y-3 overflow-y-auto flex-1 text-sm text-neutral-800 dark:text-neutral-200">
            <p className="text-xs text-neutral-500 pb-1">Choose your display appearance</p>
            <button
              onClick={() => {
                if (!isDark) toggleDarkMode();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Moon size={18} />
                <span className="font-semibold text-neutral-900 dark:text-white">Dark mode (On)</span>
              </div>
              {isDark && <Check size={18} className="text-blue-500" />}
            </button>
            <button
              onClick={() => {
                if (isDark) toggleDarkMode();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sun size={18} />
                <span className="font-semibold text-neutral-900 dark:text-white">Light mode (Off)</span>
              </div>
              {!isDark && <Check size={18} className="text-blue-500" />}
            </button>
          </div>
        )}

        {/* Main Settings Menu */}
        {!activeSubView && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
            {/* Search Bar */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs sm:text-sm text-neutral-950 dark:text-white placeholder-neutral-400 outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all"
              />
            </div>

            {/* Accounts Center Card (Official Meta Style) */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                  ∞
                </div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Meta Accounts Center
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Manage your connected experiences and account settings across InstaVibe, Facebook, and Meta.
              </p>
              <button
                onClick={() => setActiveSubView('Password and security')}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Password, security, 2FA, devices</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Section 1: How you use InstaVibe */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">
                How you use InstaVibe
              </h3>

              <button
                onClick={() => setActiveSubView('Saved')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Bookmark size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Saved</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Your activity')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Clock size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Your activity</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Notifications')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Bell size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Notifications</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Section 2: Who can see your content */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">
                Who can see your content
              </h3>

              <button
                onClick={() => setActiveSubView('Password and security')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Shield size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Security, 2FA & Sessions</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Account privacy')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Lock size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Account privacy</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Close Friends')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Star size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Close Friends</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Blocked accounts')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Ban size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Blocked accounts</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Section 3: How others can interact with you */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">
                How others can interact with you
              </h3>

              <button
                onClick={() => setActiveSubView('Messages and replies')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <MessageCircle size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Messages and story replies</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Tags and mentions')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Tag size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Tags and mentions</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Comments and sharing')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Share2 size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Comments and sharing</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Section 4: Your app and media */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">
                Your app and media
              </h3>

              <button
                onClick={() => setActiveSubView('Dark mode')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  {isDark ? <Moon size={20} className="text-neutral-700 dark:text-neutral-300" /> : <Sun size={20} className="text-neutral-700 dark:text-neutral-300" />}
                  <span className="text-sm font-medium">Dark mode / Appearance</span>
                </div>
                <span className="text-xs text-neutral-400 capitalize">{isDark ? 'On' : 'Off'}</span>
              </button>

              <button
                onClick={() => setActiveSubView('Media quality')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <HardDrive size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Media quality</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSubView('Language')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <Globe size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Language</span>
                </div>
                <span className="text-xs text-neutral-400">English (US)</span>
              </button>
            </div>

            {/* Section 5: More info and support */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">
                More info and support
              </h3>

              <button
                onClick={() => setActiveSubView('Help & Support')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-neutral-800 dark:text-neutral-200">
                  <HelpCircle size={20} className="text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Help & Support</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Section 6: Login & Accounts (Instagram Official Style) */}
            <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">
                Login
              </h3>

              <button
                onClick={handleAddAccount}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left text-blue-600 dark:text-blue-400 font-semibold text-sm cursor-pointer"
              >
                <UserPlus size={20} />
                <span>Add account</span>
              </button>

              <button
                onClick={handleSwitchAccount}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-left text-neutral-800 dark:text-neutral-200 font-semibold text-sm cursor-pointer"
              >
                <ArrowLeftRight size={20} />
                <span>Switch accounts</span>
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left text-red-600 dark:text-red-400 font-semibold text-sm cursor-pointer"
              >
                <LogOut size={20} />
                <span>Log out {currentUser ? `@${currentUser.username}` : ''}</span>
              </button>
            </div>
          </div>
        )}

        {/* Log Out Confirmation Dialog Modal */}
        {showLogoutConfirm && (
          <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-base text-neutral-950 dark:text-white">
                  Log out of {currentUser ? `@${currentUser.username}` : 'account'}?
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  You will need to log back in to access your profile, saved posts, and direct messages.
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Log Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
