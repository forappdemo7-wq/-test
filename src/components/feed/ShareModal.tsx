import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check, Send, Link, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Post } from '../../types';
import { getDeterministicChatId } from '../../lib/firestoreChat';

export const ShareModal: React.FC = () => {
  const { activeSharePost, setActiveSharePost, threads, availableProfiles, currentUser, sendMessage, celebrateAction } = useApp();
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!activeSharePost) return null;

  const contacts = availableProfiles.filter((p) => p.id !== currentUser?.id);

  const filteredContacts = contacts.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSend = () => {
    if (selectedUserIds.length === 0) return;

    selectedUserIds.forEach((userId) => {
      const thread = threads.find((t) => t.participant.id === userId);
      const threadId = thread ? thread.id : getDeterministicChatId(currentUser?.id || 'guest', userId);

      sendMessage(
        threadId,
        customMessage.trim(),
        undefined,
        false,
        undefined,
        undefined,
        {
          sharedPost: {
            id: activeSharePost.id,
            authorUsername: activeSharePost.author.username,
            authorAvatar: activeSharePost.author.avatar,
            mediaUrl: activeSharePost.media[0]?.url || '',
            caption: activeSharePost.caption || '',
            type: 'post',
          },
        }
      );
    });

    setSendSuccess(true);
    celebrateAction();
    setTimeout(() => {
      setActiveSharePost(null);
    }, 700);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        onClick={() => setActiveSharePost(null)}
      />

      {/* Spring Modal / Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0.95 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) {
            setActiveSharePost(null);
          }
        }}
        className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-[36px] sm:rounded-[32px] shadow-soft-xl border border-neutral-200/80 dark:border-neutral-800 h-[80vh] sm:h-[620px] flex flex-col z-10 overflow-hidden"
      >
        {/* Mobile handle */}
        <div className="w-12 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 sm:hidden cursor-grab active:cursor-grabbing" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-6" />
          <h3 className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">
            Share post
          </h3>
          <button
            onClick={() => setActiveSharePost(null)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Post Preview Miniature */}
        <div className="p-3 mx-4 mt-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl flex items-center gap-3 border border-neutral-100 dark:border-neutral-800">
          <img
            src={activeSharePost.media[0]?.url}
            alt="Preview"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover"
          />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1">
              <span>@{activeSharePost.author.username}</span>
              {activeSharePost.author.isVerified && (
                <span className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px]">✓</span>
              )}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              {activeSharePost.caption || 'Shared photo'}
            </p>
          </div>
        </div>

        {/* Search Contact */}
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700">
            <Search size={16} className="text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends & contacts..."
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
            />
          </div>
        </div>

        {/* Horizontal Recents */}
        <div className="px-4 pb-2 overflow-x-auto no-scrollbar flex items-center gap-3">
          {contacts.slice(0, 6).map((contact) => {
            const isSelected = selectedUserIds.includes(contact.id);
            return (
              <motion.div
                key={contact.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleSelect(contact.id)}
                className="flex flex-col items-center gap-1 min-w-[56px] cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    referrerPolicy="no-referrer"
                    className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                      isSelected ? 'border-blue-500 scale-105' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-white dark:border-neutral-900 text-[10px]">
                      ✓
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[56px] text-center">
                  {contact.username}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar border-t border-neutral-100 dark:border-neutral-800/80 pt-2">
          {filteredContacts.map((contact) => {
            const isSelected = selectedUserIds.includes(contact.id);
            return (
              <motion.div
                key={contact.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleSelect(contact.id)}
                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                      {contact.username}
                    </p>
                    <p className="text-xs text-neutral-400">{contact.name}</p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                >
                  {isSelected && <Check size={14} className="stroke-[3]" />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Message Input & Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-900">
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Write a message..."
            className="w-full text-xs sm:text-sm py-2.5 px-4 bg-neutral-100 dark:bg-neutral-800 rounded-full outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
          />

          <div className="flex items-center gap-2.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Link size={15} />
              <span>{isCopied ? 'Copied!' : 'Copy link'}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={selectedUserIds.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs disabled:opacity-40 transition-colors cursor-pointer shadow-soft-xs"
            >
              {sendSuccess ? (
                <>
                  <Check size={16} />
                  <span>Sent!</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>
                    {selectedUserIds.length > 1
                      ? `Send separately (${selectedUserIds.length})`
                      : 'Send'}
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
