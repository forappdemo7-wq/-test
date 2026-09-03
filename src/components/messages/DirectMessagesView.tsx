import React, { useState } from 'react';
import {
  Search,
  Edit,
  Sparkles,
  Smile,
  Plus,
  MessageSquarePlus,
  UserCheck,
  ChevronDown,
  ArrowLeft,
  X,
  Camera,
  Check,
  CheckCheck,
  Music,
  Send,
  MessageCircle,
  Pin,
  PinOff,
  Bell,
  BellRing,
  MoreVertical,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatConversation } from './ChatConversation';
import { NewChatModal } from './NewChatModal';
import { User, ChatThread } from '../../types';
import { getDeterministicChatId } from '../../lib/firestoreChat';

export const DirectMessagesView: React.FC = () => {
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    activeChatUser,
    setActiveChatUser,
    openChatWithUser,
    markThreadAsSeen,
    currentUser,
    updateUserNote,
    availableProfiles,
    savedAccounts,
    switchProfile,
    openAuthModal,
    setActiveTab,
    togglePinThread,
    pinnedThreadIds,
    isUserOnline,
    notificationPermission,
    requestNotificationPermission,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'primary' | 'general' | 'requests'>('primary');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(currentUser?.note?.text || '');
  const [noteEmoji, setNoteEmoji] = useState(currentUser?.note?.emoji || '✨');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [selectedNoteUser, setSelectedNoteUser] = useState<User | null>(null);
  const [noteReplyText, setNoteReplyText] = useState('');

  let activeThread = threads.find(
    (t) => t.id === activeThreadId || (activeChatUser && t.participant.id === activeChatUser.id)
  );

  // Fallback: If activeThreadId or activeChatUser is set but not yet stored in threads list
  if (!activeThread && (activeThreadId || activeChatUser)) {
    const otherUser =
      activeChatUser ||
      availableProfiles.find((u) => {
        if (!activeThreadId) return false;
        const targetChatId = getDeterministicChatId(currentUser?.id || 'guest', u.id);
        return targetChatId === activeThreadId || activeThreadId.includes(u.id);
      });

    if (otherUser) {
      activeThread = {
        id: activeThreadId || getDeterministicChatId(currentUser?.id || 'guest', otherUser.id),
        participant: otherUser,
        lastMessage: '',
        lastMessageTime: 'Just now',
        unreadCount: 0,
        messages: [],
      };
    }
  }

  // Filter threads based on search query & category
  const filteredThreads = threads
    .filter((t) => {
      const matchSearch =
        t.participant.username.toLowerCase().includes(search.toLowerCase()) ||
        t.participant.name.toLowerCase().includes(search.toLowerCase()) ||
        t.lastMessage?.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedTab === 'primary'
          ? !t.category || t.category === 'primary'
          : t.category === selectedTab;

      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      // Sort pinned threads first
      const aPinned = pinnedThreadIds.includes(a.id) || !!a.isPinned;
      const bPinned = pinnedThreadIds.includes(b.id) || !!b.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteInput.trim()) {
      updateUserNote(noteInput.trim(), noteEmoji);
      setIsEditingNote(false);
    }
  };

  const handleStartChatWithUser = (user: User) => {
    openChatWithUser(user);
  };

  const handleSendNoteReply = async (user: User) => {
    if (!noteReplyText.trim()) return;
    openChatWithUser(user);
    setSelectedNoteUser(null);
    setNoteReplyText('');
  };

  // If viewing an active conversation:
  if (activeThread) {
    return (
      <div className="fixed inset-0 sm:static sm:h-[88vh] sm:max-h-[840px] sm:max-w-4xl sm:mx-auto sm:my-3 z-40 sm:z-auto bg-white dark:bg-neutral-950 sm:rounded-3xl sm:border sm:border-neutral-200 dark:sm:border-neutral-800 sm:shadow-soft-xl overflow-hidden flex flex-col">
        <ChatConversation
          thread={activeThread}
          onBack={() => {
            setActiveThreadId(null);
            setActiveChatUser(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-24 sm:pb-10 pt-2 space-y-4">
      {/* Instagram Direct Top Navigation Bar */}
      <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-900">
        {/* Left: Back Arrow to Feed & Username with Account Switcher */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className="p-1 text-neutral-800 dark:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            title="Back to Feed"
          >
            <ArrowLeft size={22} className="stroke-[2.2px]" />
          </button>

          <button
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-left focus:outline-none cursor-pointer py-1"
          >
            <span className="text-lg font-bold text-neutral-950 dark:text-white tracking-tight">
              {currentUser?.username || 'Messages'}
            </span>
            <ChevronDown
              size={16}
              className={`text-neutral-600 dark:text-neutral-400 transition-transform ${
                isAccountMenuOpen ? 'rotate-180' : ''
              }`}
            />
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5"
              title="Live Real-time Sync"
            />
          </button>

          {/* Account Switcher Dropdown */}
          {isAccountMenuOpen && (
            <div className="absolute top-10 left-0 z-50 w-64 bg-white dark:bg-neutral-900 rounded-3xl shadow-soft-2xl border border-neutral-200/80 dark:border-neutral-800 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Switch Profile
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                {savedAccounts
                  .filter((p) => p && p.id && p.id !== 'guest_user')
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (currentUser?.id !== p.id) {
                          switchProfile(p);
                        }
                        setIsAccountMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-2xl transition-colors cursor-pointer ${
                        currentUser?.id === p.id
                          ? 'bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-950 dark:text-white'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                        />
                        <div className="text-left truncate">
                          <p className="text-xs font-semibold leading-tight truncate">@{p.username}</p>
                          <p className="text-[10px] text-neutral-400 leading-tight truncate">{p.name}</p>
                        </div>
                      </div>
                      {currentUser?.id === p.id && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                      )}
                    </button>
                  ))}

                {savedAccounts.filter((p) => p && p.id && p.id !== 'guest_user').length <= 1 && (
                  <div className="px-3 py-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                    No other accounts saved on this device.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    openAuthModal('signin');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors cursor-pointer"
                >
                  + Log into another account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: New Message & Direct Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer shadow-soft-xs"
            title="New Chat"
          >
            <Edit size={20} />
          </button>
        </div>
      </div>

      {/* Push Notifications Enable Banner */}
      {notificationPermission !== 'granted' && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-neutral-900 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl flex items-center justify-between gap-3 shadow-soft-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-500 text-white rounded-xl shadow-soft-xs">
              <BellRing size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                Turn on message notifications
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                Get real-time alerts for incoming direct messages
              </p>
            </div>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-soft-xs cursor-pointer shrink-0 active:scale-95"
          >
            Enable
          </button>
        </div>
      )}

      {/* Instagram Notes Tray (Top Horizontal Scroll) */}
      <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-2 px-1">
        {/* Current User Note / Add Note */}
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
          <div
            onClick={() => {
              setNoteInput(currentUser?.note?.text || '');
              setNoteEmoji(currentUser?.note?.emoji || '✨');
              setIsEditingNote(true);
            }}
            className="relative"
          >
            {/* Note Bubble Tag */}
            {currentUser?.note?.text ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-700 shadow-soft-sm px-2.5 py-1 rounded-2xl text-[10px] font-semibold flex items-center gap-1 max-w-[90px] truncate animate-in zoom-in-90">
                <span>{currentUser.note.emoji || '💭'}</span>
                <span className="truncate">{currentUser.note.text}</span>
              </div>
            ) : (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft-xs flex items-center gap-0.5">
                <Plus size={10} /> Note
              </div>
            )}

            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || currentUser?.username || 'User'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-800 group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[70px]">
            Your note
          </span>
        </div>

        {/* Friend Notes List */}
        {availableProfiles
          .filter((p) => p.id !== currentUser?.id && p.note?.text)
          .map((friend) => (
            <div
              key={friend.id}
              onClick={() => setSelectedNoteUser(friend)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div className="relative">
                {/* Note speech bubble */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-700 shadow-soft-sm px-2.5 py-1 rounded-2xl text-[10px] font-semibold flex items-center gap-1 max-w-[90px] truncate group-hover:scale-105 transition-transform">
                  <span>{friend.note?.emoji || '💭'}</span>
                  <span className="truncate">{friend.note?.text}</span>
                </div>

                <img
                  src={friend.avatar}
                  alt={friend.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-800 group-hover:scale-105 transition-transform"
                />
                {isUserOnline(friend.id) && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-neutral-950" />
                )}
              </div>
              <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mt-1 truncate max-w-[70px]">
                {friend.username}
              </span>
            </div>
          ))}
      </div>

      {/* Note Reply Modal */}
      {selectedNoteUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 w-full max-w-sm border border-neutral-200/80 dark:border-neutral-800 shadow-soft-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedNoteUser.avatar}
                  alt={selectedNoteUser.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {selectedNoteUser.username}&apos;s note
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    {selectedNoteUser.note?.emoji || '✨'} {selectedNoteUser.note?.text || 'Listening to music 🎧'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoteUser(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3.5 py-2.5 rounded-2xl">
              <input
                type="text"
                value={noteReplyText}
                onChange={(e) => setNoteReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendNoteReply(selectedNoteUser);
                }}
                placeholder={`Reply to ${selectedNoteUser.username}...`}
                className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                autoFocus
              />
              <button
                onClick={() => handleSendNoteReply(selectedNoteUser)}
                disabled={!noteReplyText.trim()}
                className="p-1 text-blue-500 hover:text-blue-600 disabled:opacity-40 cursor-pointer active:scale-90"
              >
                <Send size={16} />
              </button>
            </div>

            <div className="flex justify-between items-center pt-1">
              <button
                onClick={() => {
                  handleStartChatWithUser(selectedNoteUser);
                  setSelectedNoteUser(null);
                }}
                className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
              >
                Open full conversation
              </button>
              <button
                onClick={() => setSelectedNoteUser(null)}
                className="text-xs text-neutral-500 hover:text-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {isEditingNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-sm border border-neutral-200/80 dark:border-neutral-800 shadow-soft-lg space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Share a thought note
              </h3>
              <button
                onClick={() => setIsEditingNote(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Share what is on your mind. Friends will see your note at the top of their inbox for 24 hours.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={noteEmoji}
                onChange={(e) => setNoteEmoji(e.target.value)}
                title="Pick an emoji"
                className="w-12 text-center text-lg p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none"
              />
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Share a thought... (60 char max)"
                maxLength={60}
                className="flex-1 text-xs sm:text-sm p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white cursor-pointer transition-all shadow-soft-xs active:scale-95"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 focus-within:border-neutral-900 dark:focus-within:border-neutral-400 transition-colors shadow-soft-xs">
        <Search size={16} className="text-neutral-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search direct messages..."
          className="w-full text-xs sm:text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="p-0.5 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 text-xs font-semibold">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSelectedTab('primary')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              selectedTab === 'primary'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
          >
            <span>Primary</span>
            {selectedTab === 'primary' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full" />
            )}
          </button>

          <button
            onClick={() => setSelectedTab('general')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              selectedTab === 'general'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
          >
            <span>General</span>
            {selectedTab === 'general' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full" />
            )}
          </button>
        </div>

        <button
          onClick={() => setSelectedTab('requests')}
          className={`pb-2.5 transition-colors relative cursor-pointer ${
            selectedTab === 'requests'
              ? 'text-blue-500 font-bold'
              : 'text-blue-500/80 hover:text-blue-500'
          }`}
        >
          <span>Requests (0)</span>
          {selectedTab === 'requests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Messages Header Section */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white tracking-tight">
          {selectedTab === 'primary' ? 'Primary' : selectedTab === 'general' ? 'General' : 'Message Requests'}
        </h3>
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {selectedTab === 'requests' ? '0 requests' : `${filteredThreads.length} conversation${filteredThreads.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Threads List */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
        {filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => {
            const isPinned = pinnedThreadIds.includes(thread.id) || !!thread.isPinned;
            const isOnline = isUserOnline(thread.participant.id);

            return (
              <div
                key={thread.id}
                onClick={() => {
                  setActiveChatUser(thread.participant);
                  setActiveThreadId(thread.id);
                  markThreadAsSeen(thread.id);
                }}
                className={`flex items-center justify-between py-3 px-2 rounded-2xl cursor-pointer transition-colors group active:scale-99 ${
                  isPinned
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <img
                      src={thread.participant.avatar}
                      alt={thread.participant.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
                    />
                    {/* Live Online status badge */}
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-neutral-950 ${
                        isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate flex items-center gap-1">
                        {thread.participant.username}
                        {thread.participant.isVerified && (
                          <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-soft-xs">
                            ✓
                          </span>
                        )}
                      </p>
                      {isPinned && (
                        <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-0.5 bg-blue-100/70 dark:bg-blue-900/50 px-1.5 py-0.2 rounded-full">
                          <Pin size={9} className="rotate-45 fill-blue-500" /> Pinned
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs truncate mt-1 flex items-center gap-1 ${
                        thread.unreadCount > 0
                          ? 'font-bold text-neutral-950 dark:text-white'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {thread.lastMessageStatus === 'read' && (
                        <CheckCheck size={13} className="text-blue-500 shrink-0" />
                      )}
                      {thread.lastMessageStatus === 'delivered' && (
                        <CheckCheck size={13} className="text-neutral-400 shrink-0" />
                      )}
                      {thread.lastMessageStatus === 'sent' && (
                        <Check size={13} className="text-neutral-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {thread.lastMessage || 'Tap to chat'} · {thread.lastMessageTime}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right controls: unread badge & pin button */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {thread.unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[11px] font-bold rounded-full shadow-soft-xs">
                      {thread.unreadCount}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinThread(thread.id);
                    }}
                    className="p-2 text-neutral-400 hover:text-blue-500 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden sm:block"
                    title={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                  >
                    {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty / Suggested Contacts */
          <div className="py-6 space-y-5">
            <div className="text-center space-y-2 py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 shadow-soft-xs">
                <MessageCircle size={26} className="stroke-[2px]" />
              </div>
              <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                Send a message to get started
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                Connect with creators and friends in private direct chats.
              </p>
            </div>

            {/* Suggested People to Message */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Suggested for you
                </h4>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
                >
                  Search all
                </button>
              </div>

              <div className="space-y-2">
                {availableProfiles
                  .filter((p) => p.id !== currentUser?.id)
                  .slice(0, 5)
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <div
                        onClick={() => handleStartChatWithUser(user)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {user.username}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {user.name} · {user.followersCount} followers
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartChatWithUser(user)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-2xl transition-all shadow-soft-xs cursor-pointer shrink-0 ml-2 active:scale-95"
                      >
                        Message
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onSelectUser={handleStartChatWithUser}
      />
    </div>
  );
};
