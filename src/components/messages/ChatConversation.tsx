import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Image as ImageIcon,
  Heart,
  Send,
  Sparkles,
  Smile,
  Check,
  CheckCheck,
  Mic,
  X,
  PhoneOff,
  Trash2,
  Copy,
  AlertCircle,
  Palette,
  Reply,
  Sticker,
  Camera,
  Ghost,
  Film,
  Search,
  Pin,
  PinOff,
} from 'lucide-react';
import {
  ChatThread,
  DirectMessage,
  ChatTheme,
  DirectMessageReply,
  DirectMessageSharedPost,
} from '../../types';
import { useApp } from '../../context/AppContext';
import {
  listenToChatMessages,
  markChatAsSeenInFirestore,
  setTypingStatusInFirestore,
  listenToChatTyping,
  listenToChatDetails,
} from '../../lib/firestoreChat';
import { MessageBubble } from './MessageBubble';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { GifPickerDrawer } from './GifPickerDrawer';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { MediaLightboxModal } from './MediaLightboxModal';
import { ChatThemeModal } from './ChatThemeModal';
import { ChatDetailsModal } from './ChatDetailsModal';
import { StickerPickerModal } from './StickerPickerModal';

interface ChatConversationProps {
  thread: ChatThread;
  onBack: () => void;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({ thread, onBack }) => {
  const {
    currentUser,
    sendMessage,
    deleteMessage,
    reactToMessage,
    deleteMessageForEveryone,
    updateChatTheme,
    togglePinThread,
    pinnedThreadIds,
    isUserOnline,
    blockedUserIds,
    unblockUser,
    markThreadAsSeen,
    setSelectedUserProfile,
    setSelectedPostForDetail,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>(thread.messages || []);
  const [activeCallModal, setActiveCallModal] = useState<'audio' | 'video' | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Search inside conversation
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Replying state
  const [replyingTo, setReplyingTo] = useState<DirectMessageReply | null>(null);

  // Pickers & Drawers
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGifDrawerOpen, setIsGifDrawerOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isVoiceRecordingOpen, setIsVoiceRecordingOpen] = useState(false);

  // Fullscreen Media Lightbox
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type: 'image' | 'video' | 'gif';
  } | null>(null);

  // Vanish Mode state
  const [isVanishMode, setIsVanishMode] = useState(false);

  // Chat Theme & Modals State
  const [activeTheme, setActiveTheme] = useState<ChatTheme | undefined>(thread.theme);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const isBlocked = blockedUserIds.includes(thread.participant.id);
  const isOnline = isUserOnline(thread.participant.id);
  const isPinned = pinnedThreadIds.includes(thread.id) || !!thread.isPinned;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Subscribe to real-time messages and chat details from Firestore
  useEffect(() => {
    const currentUserId = currentUser?.id || 'guest';
    markChatAsSeenInFirestore(thread.id, currentUserId);
    markThreadAsSeen(thread.id);

    const unsubscribeMessages = listenToChatMessages(thread.id, (firestoreMessages) => {
      if (firestoreMessages.length > 0) {
        setMessages(firestoreMessages);
        markChatAsSeenInFirestore(thread.id, currentUserId);
        markThreadAsSeen(thread.id);
      }
    });

    const unsubscribeTyping = listenToChatTyping(thread.id, currentUserId, (typing) => {
      setIsOtherTyping(typing);
    });

    const unsubscribeDetails = listenToChatDetails(thread.id, (chatData) => {
      if (chatData?.theme) {
        setActiveTheme(chatData.theme);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
      unsubscribeDetails();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTypingStatusInFirestore(thread.id, currentUserId, false);
    };
  }, [thread.id, currentUser?.id]);

  // Keep local messages in sync when thread or thread.messages changes
  useEffect(() => {
    if (thread.messages && thread.messages.length > 0) {
      setMessages((prev) => {
        if (prev.length === 0) return thread.messages;
        const map = new Map<string, DirectMessage>();
        prev.forEach((m) => map.set(m.id, m));
        thread.messages.forEach((m) => map.set(m.id, m));
        return Array.from(map.values());
      });
    } else if (messages.length === 0 && thread.messages) {
      setMessages(thread.messages);
    }
  }, [thread.id, thread.messages]);

  // Scroll to bottom smoothly on new message or when other user starts typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Notify other participant of typing status
    if (currentUser?.id) {
      setTypingStatusInFirestore(thread.id, currentUser.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (currentUser?.id) {
        setTypingStatusInFirestore(thread.id, currentUser.id, false);
      }
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isBlocked) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsEmojiPickerOpen(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (currentUser?.id) {
      setTypingStatusInFirestore(thread.id, currentUser.id, false);
    }

    const currentReply = replyingTo;
    setReplyingTo(null);

    await sendMessage(
      thread.id,
      textToSend,
      undefined,
      false,
      undefined,
      undefined,
      {
        replyTo: currentReply || undefined,
        isVanish: isVanishMode,
      }
    );
  };

  const handleSendEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleSendGif = async (gifUrl: string) => {
    if (isBlocked) return;
    setIsGifDrawerOpen(false);

    await sendMessage(
      thread.id,
      'Sent a GIF',
      undefined,
      false,
      undefined,
      undefined,
      {
        isGif: true,
        gifUrl,
        replyTo: replyingTo || undefined,
        isVanish: isVanishMode,
      }
    );
    setReplyingTo(null);
  };

  const handleSendSticker = async (stickerUrl: string) => {
    if (isBlocked) return;
    setIsStickerModalOpen(false);

    await sendMessage(
      thread.id,
      'Sent a sticker',
      undefined,
      false,
      undefined,
      undefined,
      {
        isSticker: true,
        stickerUrl,
        replyTo: replyingTo || undefined,
        isVanish: isVanishMode,
      }
    );
    setReplyingTo(null);
  };

  const handleSendVoiceNote = (audioBlob: Blob, durationSec: number) => {
    if (isBlocked) return;
    setIsVoiceRecordingOpen(false);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const audioDataUrl = reader.result as string;
      await sendMessage(
        thread.id,
        `🎙️ Voice note (${durationSec}s)`,
        undefined,
        true,
        audioDataUrl,
        durationSec,
        {
          replyTo: replyingTo || undefined,
          isVanish: isVanishMode,
        }
      );
    };
    reader.readAsDataURL(audioBlob);
    setReplyingTo(null);
  };

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isBlocked) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;

      if (isVideo) {
        await sendMessage(
          thread.id,
          '🎥 Sent a video',
          undefined,
          false,
          undefined,
          undefined,
          {
            mediaType: 'video',
            videoUrl: dataUrl,
            videoDuration: 12,
            replyTo: replyingTo || undefined,
            isVanish: isVanishMode,
          }
        );
      } else {
        await sendMessage(
          thread.id,
          '📷 Sent a photo',
          dataUrl,
          false,
          undefined,
          undefined,
          {
            mediaType: 'image',
            replyTo: replyingTo || undefined,
            isVanish: isVanishMode,
          }
        );
      }
      setReplyingTo(null);
      setActionToast(isVideo ? 'Video sent' : 'Photo sent');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQuickHeart = async () => {
    if (isBlocked) return;
    await sendMessage(
      thread.id,
      '❤️',
      undefined,
      false,
      undefined,
      undefined,
      {
        replyTo: replyingTo || undefined,
        isVanish: isVanishMode,
      }
    );
    setReplyingTo(null);
  };

  const handleInitiateReply = (msg: DirectMessage) => {
    const isMe = currentUser ? msg.senderId === currentUser.id : false;
    setReplyingTo({
      id: msg.id,
      text:
        msg.text ||
        (msg.videoUrl
          ? 'Video'
          : msg.isGif
          ? 'GIF'
          : msg.isSticker
          ? 'Sticker'
          : msg.mediaUrl
          ? 'Photo'
          : 'Voice note'),
      senderUsername: isMe ? (currentUser?.username || 'You') : thread.participant.username,
      mediaUrl: msg.mediaUrl || msg.videoThumbnail || msg.gifUrl,
    });
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    await reactToMessage(thread.id, messageId, emoji);
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    await deleteMessageForEveryone(thread.id, messageId);
    setActionToast('Message deleted for everyone');
  };

  const handleDeleteForMe = async (messageId: string) => {
    await deleteMessage(thread.id, messageId);
    setActionToast('Message deleted for you');
  };

  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-500', 'rounded-3xl');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-500');
      }, 2000);
    }
  };

  // Filter messages by search if search bar is active
  const filteredMessages = chatSearchQuery.trim()
    ? messages.filter((m) =>
        m.text?.toLowerCase().includes(chatSearchQuery.toLowerCase())
      )
    : messages;

  return (
    <div
      className={`w-full h-full flex flex-col sm:rounded-3xl border sm:border shadow-soft-sm overflow-hidden relative transition-colors duration-300 select-none ${
        isVanishMode
          ? 'bg-neutral-950 text-white border-purple-900/60'
          : 'bg-white dark:bg-neutral-900 border-neutral-200/70 dark:border-neutral-800'
      }`}
    >
      {/* Action Notification Toast */}
      {actionToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-soft-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Vanish Mode Banner */}
      {isVanishMode && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 border-b border-purple-800/40 flex items-center justify-between text-xs text-purple-200 font-medium z-10 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Ghost size={14} className="text-purple-400 animate-pulse" />
            <span>Vanish mode is active • Messages disappear when chat closes</span>
          </div>
          <button
            onClick={() => setIsVanishMode(false)}
            className="text-[11px] font-bold text-purple-300 hover:text-white underline cursor-pointer"
          >
            Turn off
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-md z-10 ${
          isVanishMode
            ? 'bg-neutral-950/90 border-purple-900/40 text-white'
            : 'bg-white/95 dark:bg-neutral-900/95 border-neutral-200/70 dark:border-neutral-800 text-neutral-900 dark:text-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={22} />
          </button>

          <div
            onClick={() => setSelectedUserProfile(thread.participant)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="relative flex-shrink-0">
              <img
                src={thread.participant.avatar}
                alt={thread.participant.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 group-hover:opacity-90"
              />
              {/* Live Online status badge */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-neutral-900 ${
                  isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                }`}
                title={isOnline ? 'Active now' : 'Offline'}
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight flex items-center gap-1 truncate group-hover:underline">
                <span>{thread.participant.username}</span>
                {thread.participant.isVerified && (
                  <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] flex-shrink-0">
                    ✓
                  </span>
                )}
                {isPinned && (
                  <Pin size={11} className="text-blue-500 fill-blue-500 rotate-45 ml-0.5" />
                )}
              </p>
              {isOtherTyping ? (
                <p className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  typing...
                </p>
              ) : isOnline ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active now
                </p>
              ) : (
                <p className="text-[11px] text-neutral-400 font-normal">
                  Offline
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 dark:text-neutral-400">
          <button
            onClick={() => setIsSearchingInChat(!isSearchingInChat)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isSearchingInChat
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Search messages"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => togglePinThread(thread.id)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isPinned
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isPinned ? 'Unpin chat' : 'Pin chat'}
          >
            {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
          </button>
          <button
            onClick={() => setIsVanishMode(!isVanishMode)}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isVanishMode
                ? 'bg-purple-600 text-white shadow-md'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isVanishMode ? 'Turn off Vanish Mode' : 'Turn on Vanish Mode'}
          >
            <Ghost size={18} />
          </button>
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer text-pink-500 hover:scale-105"
            title="Chat Theme & Wallpaper"
          >
            <Palette size={18} />
          </button>
          <button
            onClick={() => setActiveCallModal('audio')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            title="Audio call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => setActiveCallModal('video')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            title="Video call"
          >
            <Video size={18} />
          </button>
          <button
            onClick={() => setIsDetailsModalOpen(true)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            title="Conversation info & Privacy"
          >
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar Drawer */}
      {isSearchingInChat && (
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            placeholder="Search in conversation..."
            autoFocus
            className="flex-1 text-xs bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
          />
          {chatSearchQuery && (
            <button
              onClick={() => setChatSearchQuery('')}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => {
              setIsSearchingInChat(false);
              setChatSearchQuery('');
            }}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages Canvas Stream */}
      <div
        className="flex-1 overflow-y-auto p-4 relative"
        style={{
          backgroundColor: isVanishMode ? '#0a0a0c' : activeTheme?.backgroundColor,
          backgroundImage: isVanishMode
            ? 'radial-gradient(circle at 50% 50%, #201335 0%, #0a0a0c 100%)'
            : activeTheme?.backgroundGradient
            ? activeTheme.backgroundGradient
            : activeTheme?.wallpaperPattern
            ? `url("${activeTheme.wallpaperPattern}")`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="space-y-3 max-w-3xl mx-auto">
          {/* Instagram User Banner Header */}
          <div className="flex flex-col items-center justify-center py-6 text-center border-b border-neutral-200/60 dark:border-neutral-800/60 mb-4">
            <div className="relative mb-3">
              <img
                src={thread.participant.avatar}
                alt={thread.participant.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 shadow-soft-md cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedUserProfile(thread.participant)}
              />
              {thread.participant.isVerified && (
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-neutral-900">
                  ✓
                </span>
              )}
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              {thread.participant.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              @{thread.participant.username} • Instagram
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs line-clamp-2">
              {thread.participant.bio ||
                `${thread.participant.followersCount?.toLocaleString() || 0} followers • ${
                  thread.participant.postsCount || 0
                } posts`}
            </p>
            <button
              onClick={() => setSelectedUserProfile(thread.participant)}
              className="mt-3 px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              View profile
            </button>
          </div>

          {/* Messages list with MessageBubble component */}
          {filteredMessages.map((msg) => {
            const isMe = currentUser ? msg.senderId === currentUser.id : false;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSender={isMe}
                currentUser={currentUser}
                participant={thread.participant}
                theme={activeTheme}
                onReply={handleInitiateReply}
                onReact={handleReactToMessage}
                onDeleteForEveryone={handleDeleteForEveryone}
                onDeleteForMe={handleDeleteForMe}
                onOpenMediaLightbox={(url, type) => setLightboxMedia({ url, type })}
                onScrollToMessage={handleScrollToMessage}
              />
            );
          })}

          {/* Real-time Typing Indicator Bubble */}
          {isOtherTyping && (
            <div className="flex items-end gap-2 justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
              <img
                src={thread.participant.avatar}
                alt={thread.participant.username}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover mb-0.5 border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
              />
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-3xl rounded-bl-sm px-4 py-3 shadow-soft-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Replying quote preview bar docked above composer */}
      {replyingTo && (
        <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1 h-8 bg-blue-500 rounded-full" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                Replying to @{replyingTo.senderUsername}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate max-w-md">
                {replyingTo.text}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-500 dark:text-neutral-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Voice Recorder Bar (replaces composer when recording) */}
      {isVoiceRecordingOpen ? (
        <VoiceRecorderBar
          onSendVoiceNote={handleSendVoiceNote}
          onCancel={() => setIsVoiceRecordingOpen(false)}
        />
      ) : (
        /* Standard Chat Composer Bar */
        <div
          className={`p-3 border-t transition-colors relative ${
            isVanishMode
              ? 'bg-neutral-950 border-purple-900/40'
              : 'bg-white dark:bg-neutral-900 border-neutral-200/70 dark:border-neutral-800'
          }`}
        >
          {/* Emoji Picker Popover */}
          <EmojiPickerPopover
            isOpen={isEmojiPickerOpen}
            onClose={() => setIsEmojiPickerOpen(false)}
            onSelectEmoji={handleSendEmoji}
          />

          {isBlocked ? (
            <div className="flex items-center justify-between py-2 px-4 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl text-xs text-neutral-500 dark:text-neutral-400">
              <span>You have blocked @{thread.participant.username}. Unblock to send messages.</span>
              <button
                type="button"
                onClick={() => unblockUser(thread.participant.id)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-2"
              >
                Unblock
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Media File Inputs */}
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleMediaFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleMediaFileSelect}
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
              />

              {/* Camera Quick Button */}
              <button
                type="button"
                onClick={() => {
                  if (cameraInputRef.current) {
                    cameraInputRef.current.click();
                  } else {
                    mediaInputRef.current?.click();
                  }
                }}
                className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors cursor-pointer flex-shrink-0 shadow-soft-xs active:scale-95"
                title="Camera"
              >
                <Camera size={17} />
              </button>

              {/* Input Pill */}
              <div className="flex-1 flex items-center bg-neutral-100 dark:bg-neutral-800/90 rounded-full px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-blue-500">
                {/* Emoji toggle inside input */}
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                  className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-amber-500 cursor-pointer mr-1"
                  title="Emoji picker"
                >
                  <Smile size={18} />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Message..."
                  className="flex-1 py-1 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none bg-transparent"
                />

                {/* Media shortcuts inside pill */}
                <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                  <button
                    type="button"
                    onClick={() => setIsVoiceRecordingOpen(true)}
                    className="p-1 hover:text-blue-500 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 cursor-pointer"
                    title="Voice note"
                  >
                    <Mic size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    className="p-1 hover:text-blue-500 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 cursor-pointer"
                    title="Send photo or video"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGifDrawerOpen(true)}
                    className="p-1 hover:text-purple-500 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 cursor-pointer font-bold text-[11px]"
                    title="Send GIF"
                  >
                    GIF
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsStickerModalOpen(true)}
                    className="p-1 hover:text-pink-500 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 cursor-pointer"
                    title="Send sticker"
                  >
                    <Sticker size={18} />
                  </button>
                </div>
              </div>

              {/* Send or Quick Heart */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  className="px-3.5 py-2 text-blue-500 hover:text-blue-600 font-bold text-sm cursor-pointer transition-transform active:scale-95 flex-shrink-0"
                >
                  Send
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickHeart}
                  className="p-2 text-rose-500 hover:scale-110 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer flex-shrink-0"
                  title="Send heart"
                >
                  <Heart size={22} className="fill-rose-500" />
                </button>
              )}
            </form>
          )}
        </div>
      )}

      {/* GIF Picker Drawer */}
      <GifPickerDrawer
        isOpen={isGifDrawerOpen}
        onClose={() => setIsGifDrawerOpen(false)}
        onSelectGif={handleSendGif}
      />

      {/* Sticker Picker Modal */}
      <StickerPickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        onSelectSticker={handleSendSticker}
      />

      {/* Theme Customization Modal */}
      {isThemeModalOpen && (
        <ChatThemeModal
          currentTheme={activeTheme}
          participantName={thread.participant.name}
          onClose={() => setIsThemeModalOpen(false)}
          onSave={async (newTheme) => {
            setActiveTheme(newTheme);
            await updateChatTheme(thread.id, newTheme);
            setActionToast(`Chat theme changed to "${newTheme.name}"`);
          }}
        />
      )}

      {/* Conversation Details & Safety Modal */}
      {isDetailsModalOpen && (
        <ChatDetailsModal
          thread={{ ...thread, theme: activeTheme }}
          messages={messages}
          onClose={() => setIsDetailsModalOpen(false)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
        />
      )}

      {/* Fullscreen Media Lightbox Viewer */}
      {lightboxMedia && (
        <MediaLightboxModal
          isOpen={true}
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          onClose={() => setLightboxMedia(null)}
        />
      )}

      {/* Voice / Video Call Modal Simulator */}
      {activeCallModal && (
        <div className="absolute inset-0 z-50 bg-neutral-950 text-white flex flex-col items-center justify-between p-8 animate-in fade-in duration-200">
          <div className="text-center space-y-2 pt-10">
            <img
              src={thread.participant.avatar}
              alt={thread.participant.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover border-4 border-neutral-700 mx-auto shadow-soft-2xl animate-pulse"
            />
            <h3 className="text-xl font-bold">{thread.participant.name}</h3>
            <p className="text-xs text-neutral-400">
              {activeCallModal === 'video'
                ? 'Instagram Video Calling...'
                : 'Instagram Audio Calling...'}
            </p>
          </div>

          <div className="flex items-center gap-6 pb-10">
            <button
              onClick={() => setActiveCallModal(null)}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white shadow-soft-xl cursor-pointer hover:scale-105 transition-transform"
            >
              <PhoneOff size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
