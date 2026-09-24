import React, { useState } from 'react';
import {
  X,
  Palette,
  ShieldAlert,
  UserX,
  UserCheck,
  BellOff,
  Bell,
  Image as ImageIcon,
  Mic,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ChatThread, DirectMessage } from '../../types';
import { useApp } from '../../context/AppContext';

interface ChatDetailsModalProps {
  thread: ChatThread;
  messages: DirectMessage[];
  onClose: () => void;
  onOpenThemeModal: () => void;
}

export const ChatDetailsModal: React.FC<ChatDetailsModalProps> = ({
  thread,
  messages,
  onClose,
  onOpenThemeModal,
}) => {
  const {
    currentUser,
    blockedUserIds,
    blockUser,
    unblockUser,
    setSelectedUserProfile,
    setActiveTab,
  } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isProcessingBlock, setIsProcessingBlock] = useState(false);

  const participant = thread.participant;
  const isBlocked = blockedUserIds.includes(participant.id);

  // Extract shared media and audio notes
  const sharedMedia = messages.filter((m) => m.mediaUrl && !m.isAudio && !m.audioUrl);
  const sharedAudio = messages.filter((m) => m.isAudio || !!m.audioUrl);

  const handleConfirmBlock = async () => {
    setIsProcessingBlock(true);
    try {
      await blockUser(participant.id);
      setShowBlockConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error blocking user:', err);
    } finally {
      setIsProcessingBlock(false);
    }
  };

  const handleUnblock = async () => {
    setIsProcessingBlock(true);
    try {
      await unblockUser(participant.id);
    } catch (err) {
      console.error('Error unblocking user:', err);
    } finally {
      setIsProcessingBlock(false);
    }
  };

  const handleViewFullProfile = () => {
    setSelectedUserProfile(participant);
    setActiveTab('profile');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-neutral-800 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Details & Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 overflow-y-auto space-y-6 no-scrollbar">
            {/* Participant Profile Card */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800">
              <img
                src={participant.avatar}
                alt={participant.name}
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-full object-cover border-2 border-slate-200 dark:border-neutral-700 mb-2.5 shadow-sm"
              />
              <div className="flex items-center gap-1.5 justify-center">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {participant.name}
                </h4>
                {participant.isVerified && (
                  <span className="text-blue-500 text-xs">✓</span>
                )}
              </div>
              <p className="text-xs text-slate-400">@{participant.username}</p>
              {participant.bio && (
                <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 max-w-xs leading-relaxed">
                  {participant.bio}
                </p>
              )}

              {isBlocked && (
                <span className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-semibold">
                  <UserX size={12} /> Blocked User
                </span>
              )}

              <button
                type="button"
                onClick={handleViewFullProfile}
                className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Full Profile <ExternalLink size={12} />
              </button>
            </div>

            {/* Chat Theme Customization Option */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Chat Appearance
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenThemeModal();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-800/60 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      background:
                        thread.theme?.bubbleGradient ||
                        'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
                    }}
                    className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center text-white"
                  >
                    <Palette size={15} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Chat Theme & Wallpaper
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {thread.theme?.name || 'Default Instagram Sunset'}
                      {thread.theme?.backgroundUrl ? ' • Custom Wallpaper' : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Shared Media Gallery if any */}
            {sharedMedia.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500 flex items-center gap-1">
                  <ImageIcon size={12} /> Shared Photos ({sharedMedia.length})
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.slice(0, 6).map((m) => (
                    <img
                      key={m.id}
                      src={m.mediaUrl}
                      alt="Shared"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square rounded-lg object-cover border border-slate-200 dark:border-neutral-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Privacy, Safety & User Blocking */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Privacy & Safety
              </span>

              {/* Mute toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/60">
                <div className="flex items-center gap-2.5">
                  {isMuted ? <BellOff size={16} className="text-slate-400" /> : <Bell size={16} className="text-slate-600 dark:text-neutral-300" />}
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Mute Notifications
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Silence message alerts from this chat
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isMuted}
                  onChange={(e) => setIsMuted(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-blue-600 cursor-pointer"
                />
              </div>

              {/* BLOCK / UNBLOCK USER BUTTON */}
              {!isBlocked ? (
                <button
                  type="button"
                  onClick={() => setShowBlockConfirm(true)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer text-red-600 dark:text-red-400"
                >
                  <div className="flex items-center gap-2.5">
                    <UserX size={16} />
                    <div className="text-left">
                      <p className="text-xs font-bold">
                        Block @{participant.username}
                      </p>
                      <p className="text-[11px] text-red-500/80 dark:text-red-400/80">
                        Hide their messages, posts, stories, and reels globally
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnblock}
                  disabled={isProcessingBlock}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isProcessingBlock ? (
                    <>
                      <span className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                      Unblocking...
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} className="text-emerald-500" />
                      Unblock @{participant.username}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Block Confirmation Dialog */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-200 dark:border-red-900/40 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={24} />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">
              Block @{participant.username}?
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed mb-5">
              They won't be able to message you, find your profile, or view your posts and stories. Their messages and posts will also be filtered out globally from your feed and inbox.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={isProcessingBlock}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessingBlock ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Blocking...
                  </>
                ) : (
                  'Block User'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowBlockConfirm(false)}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
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
