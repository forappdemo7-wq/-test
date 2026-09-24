import React, { useState } from 'react';
import { X, Send, MessageCircle, ExternalLink } from 'lucide-react';
import { DirectMessage, User } from '../../types';

interface InAppMessageToastProps {
  sender: User;
  message: DirectMessage;
  threadId: string;
  onOpenChat: (threadId: string) => void;
  onQuickReply: (threadId: string, text: string) => void;
  onDismiss: () => void;
}

export const InAppMessageToast: React.FC<InAppMessageToastProps> = ({
  sender,
  message,
  threadId,
  onOpenChat,
  onQuickReply,
  onDismiss,
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onQuickReply(threadId, replyText.trim());
    setReplyText('');
    onDismiss();
  };

  const getPreviewText = () => {
    if (message.text) return message.text;
    if (message.videoUrl) return '🎥 Sent a video';
    if (message.isAudio) return '🎙️ Sent a voice note';
    if (message.isGif) return '✨ Sent a GIF';
    if (message.mediaUrl) return '📷 Sent a photo';
    if (message.isSticker) return '🎨 Sent a sticker';
    return 'Sent a new message';
  };

  return (
    <div
      id="in-app-message-toast"
      className="fixed top-4 right-4 sm:right-6 z-50 w-full max-w-sm bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-soft-2xl p-3.5 animate-in slide-in-from-top-4 duration-200 transition-all select-none"
    >
      <div className="flex items-start gap-3">
        {/* Sender Avatar with Online Dot */}
        <div
          onClick={() => onOpenChat(threadId)}
          className="relative cursor-pointer shrink-0"
        >
          <img
            src={sender.avatar}
            alt={sender.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/20"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
        </div>

        {/* Message Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              onClick={() => onOpenChat(threadId)}
              className="text-xs font-bold text-neutral-900 dark:text-white truncate cursor-pointer hover:underline"
            >
              {sender.name}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-400">Just now</span>
              <button
                onClick={onDismiss}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <p
            onClick={() => onOpenChat(threadId)}
            className="text-xs text-neutral-600 dark:text-neutral-300 truncate mt-0.5 cursor-pointer font-normal"
          >
            {getPreviewText()}
          </p>

          {/* Actions */}
          {!showReplyInput ? (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setShowReplyInput(true)}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                Reply
              </button>
              <button
                onClick={() => onOpenChat(threadId)}
                className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
              >
                Open chat <ExternalLink size={10} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-1.5 mt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply..."
                autoFocus
                className="flex-1 px-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-xl outline-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-1 text-blue-500 hover:text-blue-600 disabled:opacity-40 cursor-pointer active:scale-95"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
