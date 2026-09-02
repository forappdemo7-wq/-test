import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  BellRing,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { NotificationPreferences } from '../../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTestNotification: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onSendTestNotification,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('instavibe_notif_prefs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      directMessages: true,
      storyLikes: true,
      soundEnabled: true,
      pushEnabled: true,
    };
  });

  const [permissionState, setPermissionState] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [testSent, setTestSent] = useState(false);

  const updatePref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      localStorage.setItem('instavibe_notif_prefs', JSON.stringify(updated));
    } catch {}
  };

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          updatePref('pushEnabled', true);
          try {
            new Notification('✨ Push Notifications Active', {
              body: 'You will receive real-time notifications for likes, comments, and messages.',
              icon: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            });
          } catch {}
        }
      } catch (err) {
        console.warn('Could not request notification permission:', err);
      }
    }
  };

  const handleTestAlert = () => {
    setTestSent(true);
    onSendTestNotification();
    setTimeout(() => setTestSent(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 px-5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bell size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  Notification Settings
                </h3>
                <p className="text-[11px] text-neutral-500">Configure push and in-app alerts</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 px-5 space-y-4 overflow-y-auto flex-1 divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {/* 1. Browser Push Permission Banner */}
            <div className="pb-3">
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <BellRing size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                      Browser Push Alerts
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {permissionState === 'granted'
                        ? 'Notifications permitted'
                        : permissionState === 'denied'
                        ? 'Blocked in browser settings'
                        : 'Allow notifications in this browser'}
                    </p>
                  </div>
                </div>

                {permissionState !== 'granted' ? (
                  <button
                    onClick={handleRequestPushPermission}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-soft-xs cursor-pointer flex-shrink-0"
                  >
                    Enable
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full flex-shrink-0">
                    <Check size={12} strokeWidth={3} /> Active
                  </span>
                )}
              </div>
            </div>

            {/* 2. Granular Notification Toggles */}
            <div className="py-3 space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Push Alert Preferences
              </h4>

              {/* Likes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                    <Heart size={14} className="fill-rose-500" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Likes on posts & reels
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.likes}
                  onChange={(e) => updatePref('likes', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Comments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                    <MessageCircle size={14} />
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Comments & replies
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.comments}
                  onChange={(e) => updatePref('comments', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Follows */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                    <UserPlus size={14} />
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    New followers & requests
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.follows}
                  onChange={(e) => updatePref('follows', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Mentions & Tags */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                    <AtSign size={14} />
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Mentions & tags
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.mentions}
                  onChange={(e) => updatePref('mentions', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Direct Messages */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                    <Send size={14} />
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Direct messages
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.directMessages}
                  onChange={(e) => updatePref('directMessages', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Sound Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    {prefs.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Audio alerts & chimes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.soundEnabled}
                  onChange={(e) => updatePref('soundEnabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Send Test Push Alert */}
            <div className="pt-3">
              <button
                onClick={handleTestAlert}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer shadow-soft-xs"
              >
                <Sparkles size={14} className="text-blue-500" />
                {testSent ? 'Notification Triggered! ✨' : 'Send Test Notification Alert'}
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 px-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-soft-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
