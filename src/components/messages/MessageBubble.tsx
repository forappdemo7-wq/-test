import React, { useState, useRef } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  Heart,
  Reply,
  Copy,
  Trash2,
  MoreVertical,
  Smile,
  ShieldAlert,
  Ghost,
  Sparkles,
  Play,
  Volume2,
} from 'lucide-react';
import { DirectMessage, User, ChatTheme } from '../../types';
import { AudioMessageBubble } from './AudioMessageBubble';
import { VideoMessageBubble } from './VideoMessageBubble';

interface MessageBubbleProps {
  message: DirectMessage;
  isSender: boolean;
  currentUser: User;
  participant: User;
  theme?: ChatTheme;
  onReply: (message: DirectMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onDeleteForMe: (messageId: string) => void;
  onOpenMediaLightbox: (mediaUrl: string, mediaType: 'image' | 'video' | 'gif') => void;
  onScrollToMessage?: (messageId: string) => void;
}

const QUICK_REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSender,
  currentUser,
  participant,
  theme,
  onReply,
  onReact,
  onDeleteForEveryone,
  onDeleteForMe,
  onOpenMediaLightbox,
  onScrollToMessage,
}) => {
  const [showReactionToolbar, setShowReactionToolbar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const longPressTimerRef = useRef<any>(null);

  // Check if message was deleted
  if (message.isDeleted) {
    return (
      <div
        id={`msg-${message.id}`}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} my-1.5`}
      >
        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-xs italic border border-neutral-200/50 dark:border-neutral-700/50">
          <Trash2 size={13} className="text-neutral-400" />
          <span>This message was deleted</span>
        </div>
      </div>
    );
  }

  const handleCopyText = () => {
    if (message.text) {
      navigator.clipboard?.writeText(message.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
      setShowContextMenu(false);
    }
  };

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowContextMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  // Reactions calculations
  const reactionsMap: Record<string, string[]> =
    message.reactions ||
    (message.reaction ? { [message.reaction]: [message.senderId] } : {});
  const activeReactions: [string, string[]][] = Object.entries(reactionsMap).filter(
    ([_, users]) => Array.isArray(users) && users.length > 0
  );

  // Status icon
  const renderStatusIcon = () => {
    if (!isSender) return null;
    const status = message.status || (message.isSeen ? 'read' : 'delivered');

    if (status === 'sending') {
      return <Clock size={12} className="text-neutral-400 animate-spin" />;
    }
    if (status === 'sent') {
      return <Check size={13} className="text-neutral-400" />;
    }
    if (status === 'delivered') {
      return <CheckCheck size={14} className="text-neutral-400" />;
    }
    if (status === 'read') {
      return <CheckCheck size={14} className="text-blue-500 font-bold" />;
    }
    return null;
  };

  // Custom theme styles
  const bubbleBg = isSender
    ? theme?.bubbleGradient
      ? theme.bubbleGradient
      : theme?.bubbleColor || 'bg-blue-600 text-white'
    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100';

  const isCustomGradient = isSender && !!theme?.bubbleGradient;

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex flex-col ${isSender ? 'items-end' : 'items-start'} my-1.5 transition-all`}
      onMouseEnter={() => setShowReactionToolbar(true)}
      onMouseLeave={() => {
        setShowReactionToolbar(false);
        setShowContextMenu(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Quick Reaction Toolbar (on hover / tap) */}
      {showReactionToolbar && (
        <div
          className={`absolute -top-9 ${
            isSender ? 'right-0' : 'left-0'
          } z-30 flex items-center gap-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft-lg px-2 py-1 rounded-full animate-in fade-in zoom-in-90 duration-150`}
        >
          {QUICK_REACTION_EMOJIS.map((emoji) => {
            const hasUserReacted = currentUser?.id ? reactionsMap[emoji]?.includes(currentUser.id) : false;
            return (
              <button
                key={emoji}
                onClick={() => {
                  onReact(message.id, emoji);
                  setShowReactionToolbar(false);
                }}
                className={`w-7 h-7 flex items-center justify-center text-sm rounded-full transition-transform hover:scale-130 active:scale-95 cursor-pointer ${
                  hasUserReacted ? 'bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-500' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {emoji}
              </button>
            );
          })}

          <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          {/* Action triggers */}
          <button
            onClick={() => {
              onReply(message);
              setShowReactionToolbar(false);
            }}
            className="p-1 text-neutral-500 hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full cursor-pointer"
            title="Reply"
          >
            <Reply size={14} />
          </button>

          <button
            onClick={() => setShowContextMenu(!showContextMenu)}
            className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full cursor-pointer"
            title="More options"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}

      {/* Context Menu Dropdown */}
      {showContextMenu && (
        <div
          className={`absolute top-0 ${
            isSender ? 'right-full mr-2' : 'left-full ml-2'
          } z-40 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft-xl rounded-2xl py-1.5 animate-in fade-in duration-150`}
        >
          <button
            onClick={() => {
              onReply(message);
              setShowContextMenu(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <Reply size={14} className="text-blue-500" />
            <span>Reply</span>
          </button>

          {message.text && (
            <button
              onClick={handleCopyText}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <Copy size={14} className="text-emerald-500" />
              <span>{isCopied ? 'Copied!' : 'Copy text'}</span>
            </button>
          )}

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

          {isSender && (
            <button
              onClick={() => {
                onDeleteForEveryone(message.id);
                setShowContextMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete for everyone</span>
            </button>
          )}

          <button
            onClick={() => {
              onDeleteForMe(message.id);
              setShowContextMenu(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete for me</span>
          </button>
        </div>
      )}

      {/* Replying quote preview (if this message is a reply) */}
      {message.replyTo && (
        <div
          onClick={() => message.replyTo?.id && onScrollToMessage?.(message.replyTo.id)}
          className={`flex items-center gap-2 px-3 py-1.5 mb-1 rounded-xl text-xs cursor-pointer border-l-2 ${
            isSender
              ? 'bg-neutral-200/70 dark:bg-neutral-800/80 border-blue-500 text-neutral-600 dark:text-neutral-300'
              : 'bg-neutral-200/70 dark:bg-neutral-800/80 border-purple-500 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          <Reply size={12} className="rotate-180 text-neutral-400" />
          <div className="flex-1 truncate max-w-[200px]">
            <span className="font-semibold">{message.replyTo.senderUsername}: </span>
            <span className="text-neutral-500 dark:text-neutral-400">{message.replyTo.text || 'Media'}</span>
          </div>
          {message.replyTo.mediaUrl && (
            <img
              src={message.replyTo.mediaUrl}
              alt="Reply media"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-md object-cover"
            />
          )}
        </div>
      )}

      {/* Main Message Bubble Content */}
      <div
        style={isCustomGradient ? { background: theme?.bubbleGradient } : undefined}
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-3xl overflow-hidden select-text transition-all ${
          !isCustomGradient ? bubbleBg : 'text-white'
        } ${
          message.isVanish
            ? 'border-2 border-dashed border-purple-400/80 shadow-soft-sm'
            : ''
        }`}
      >
        {/* Vanish mode icon badge */}
        {message.isVanish && (
          <div className="px-3 pt-2 flex items-center gap-1 text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
            <Ghost size={11} />
            <span>Vanish Message</span>
          </div>
        )}

        {/* 1. Photo Image Message */}
        {message.mediaUrl && !message.videoUrl && !message.isGif && (
          <div
            onClick={() => onOpenMediaLightbox(message.mediaUrl!, 'image')}
            className="cursor-pointer overflow-hidden rounded-2xl group/media"
          >
            <img
              src={message.mediaUrl}
              alt="Message attachment"
              referrerPolicy="no-referrer"
              className="w-full max-h-80 object-cover group-hover/media:scale-102 transition-transform duration-200"
            />
          </div>
        )}

        {/* 2. Video Message */}
        {message.videoUrl && (
          <VideoMessageBubble
            videoUrl={message.videoUrl}
            posterUrl={message.videoThumbnail}
            duration={message.videoDuration}
            isSender={isSender}
            onOpenFullscreen={() => onOpenMediaLightbox(message.videoUrl!, 'video')}
          />
        )}

        {/* 3. GIF Message */}
        {message.isGif && message.gifUrl && (
          <div
            onClick={() => onOpenMediaLightbox(message.gifUrl!, 'gif')}
            className="cursor-pointer overflow-hidden rounded-2xl"
          >
            <img
              src={message.gifUrl}
              alt="GIF"
              referrerPolicy="no-referrer"
              className="w-full max-h-72 object-contain"
            />
          </div>
        )}

        {/* 4. Voice Note Audio Message */}
        {message.isAudio && message.audioUrl && (
          <div className="p-2">
            <AudioMessageBubble
              audioUrl={message.audioUrl}
              duration={message.audioDuration || 5}
              isMe={isSender}
              timestamp={message.timestamp}
            />
          </div>
        )}

        {/* 5. Sticker Message */}
        {message.isSticker && message.stickerUrl && (
          <div className="p-2">
            <img
              src={message.stickerUrl}
              alt="Sticker"
              referrerPolicy="no-referrer"
              className="w-32 h-32 object-contain animate-in zoom-in-90"
            />
          </div>
        )}

        {/* 6. Text Message */}
        {message.text && (
          <div
            className={`px-4 py-2.5 text-sm sm:text-[15px] leading-relaxed break-words ${
              message.mediaUrl || message.videoUrl ? 'pt-1.5' : ''
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Timestamp & Status Footer */}
        <div
          className={`flex items-center justify-end gap-1 px-3 pb-1.5 text-[10px] select-none ${
            isSender
              ? isCustomGradient
                ? 'text-white/80'
                : 'text-blue-100'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <span>{message.timestamp || 'Just now'}</span>
          {renderStatusIcon()}
        </div>
      </div>

      {/* Reaction Badges Pill (grouped by emoji with count) */}
      {activeReactions.length > 0 && (
        <div
          className={`flex items-center gap-1 mt-0.5 -translate-y-1.5 z-10 px-2 py-0.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-soft-xs text-xs font-semibold cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
            isSender ? 'mr-2' : 'ml-2'
          }`}
          onClick={() => {
            // Quick toggle primary reaction
            const primaryEmoji = activeReactions[0][0];
            onReact(message.id, primaryEmoji);
          }}
        >
          {activeReactions.map(([emoji, users]) => (
            <span key={emoji} className="flex items-center gap-0.5">
              <span>{emoji}</span>
              {users.length > 1 && (
                <span className="text-[10px] text-neutral-600 dark:text-neutral-300">
                  {users.length}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
