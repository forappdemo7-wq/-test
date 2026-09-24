import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, DirectMessage, ChatThread, ChatTheme } from '../types';

/**
 * Deterministic chat ID for 1-on-1 conversations between two users
 */
export function getDeterministicChatId(userIdA: string, userIdB: string): string {
  const sorted = [userIdA, userIdB].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

/**
 * Sync user profile to Firestore so other real users can find and chat with them
 */
export async function syncUserToFirestore(user: User): Promise<void> {
  if (!user || !user.id || user.id === 'guest_user') return;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio || '',
        isVerified: !!user.isVerified,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error syncing user to Firestore:', err);
  }
}

/**
 * Listen to all registered real users from Firestore
 */
export function listenToFirestoreUsers(
  currentUserId: string,
  onUsersUpdate: (users: User[]) => void
): () => void {
  try {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersCol,
      (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.id) {
            users.push({
              id: data.id,
              username: data.username || 'user',
              name: data.name || data.username || 'User',
              avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              bio: data.bio || '',
              followersCount: typeof data.followersCount === 'number' ? data.followersCount : 0,
              followingCount: typeof data.followingCount === 'number' ? data.followingCount : 0,
              postsCount: typeof data.postsCount === 'number' ? data.postsCount : 0,
              isVerified: !!data.isVerified,
            });
          }
        });
        onUsersUpdate(users);
      },
      (error) => {
        console.warn('Firestore listenToUsers error (will use local fallback):', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup users listener:', err);
    return () => {};
  }
}

/**
 * Listen to all chat threads involving the current user in real-time
 */
export function listenToUserChats(
  currentUser: User,
  onThreadsUpdate: (threads: ChatThread[]) => void
): () => void {
  if (!currentUser || !currentUser.id || currentUser.id === 'guest_user') {
    return () => {};
  }

  try {
    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, where('participants', 'array-contains', currentUser.id));

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const threads: (ChatThread & { _sortTime?: number })[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.participants || !Array.isArray(data.participants)) return;

          const otherUserId = data.participants.find((id: string) => id !== currentUser.id) || currentUser.id;
          const otherDetails = data.participantDetails?.[otherUserId] || {
            id: otherUserId,
            username: data.otherUsername || 'user',
            name: data.otherName || 'User',
            avatar: data.otherAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            bio: '',
            followersCount: 100,
            followingCount: 100,
            postsCount: 10,
          };

          // Format last message time nicely
          let timeString = 'Just now';
          let sortTime = 0;
          if (data.updatedAt?.toDate) {
            const date = data.updatedAt.toDate();
            timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            sortTime = date.getTime();
          } else if (data.updatedAt?.toMillis) {
            sortTime = data.updatedAt.toMillis();
          } else if (data.lastMessageTime) {
            timeString = data.lastMessageTime;
            sortTime = Date.now();
          }

          const isSeen = data.lastSeen === true || data.lastSeenBy === currentUser.id || (Array.isArray(data.seenBy) && data.seenBy.includes(currentUser.id));
          const hasUnread = Boolean(data.lastSenderId && data.lastSenderId !== currentUser.id && !isSeen);

          threads.push({
            id: docSnap.id,
            participant: otherDetails,
            lastMessage: data.lastMessage || 'Sent a message',
            lastMessageTime: timeString,
            unreadCount: hasUnread ? 1 : 0,
            messages: [],
            theme: data.theme || undefined,
            note: data.notes?.[otherUserId] || undefined,
            _sortTime: sortTime,
          });
        });

        // Sort by newest updated first
        threads.sort((a, b) => (b._sortTime || 0) - (a._sortTime || 0));
        onThreadsUpdate(threads);
      },
      (error) => {
        console.warn('Firestore listenToUserChats error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup chats listener:', err);
    return () => {};
  }
}

/**
 * Listen to messages inside a specific chat thread in real-time
 */
export function listenToChatMessages(
  chatId: string,
  onMessagesUpdate: (messages: DirectMessage[]) => void
): () => void {
  if (!chatId) return () => {};

  try {
    const messagesCol = collection(db, 'chats', chatId, 'messages');

    const unsubscribe = onSnapshot(
      messagesCol,
      { includeMetadataChanges: true },
      (snapshot) => {
        const msgs: (DirectMessage & { _sortTime?: number })[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let timeStr = 'Just now';
          let sortTime = 0;
          if (data.createdAt?.toDate) {
            const d = data.createdAt.toDate();
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            sortTime = d.getTime();
          } else if (data.createdAt?.toMillis) {
            sortTime = data.createdAt.toMillis();
          } else if (typeof data.createdAt === 'number') {
            sortTime = data.createdAt;
          } else if (data.timestamp) {
            timeStr = data.timestamp;
            sortTime = Date.now();
          } else {
            sortTime = Date.now();
          }

          msgs.push({
            id: docSnap.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text || '',
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType || (data.videoUrl ? 'video' : data.isAudio ? 'audio' : data.mediaUrl ? 'image' : undefined),
            videoUrl: data.videoUrl,
            videoDuration: data.videoDuration,
            videoThumbnail: data.videoThumbnail,
            audioUrl: data.audioUrl,
            audioDuration: data.audioDuration,
            reactions: data.reactions || (data.reaction ? { [data.reaction]: [data.senderId] } : undefined),
            reaction: data.reaction,
            isAudio: !!data.isAudio,
            isSeen: !!data.isSeen,
            status: data.status || (data.isSeen ? 'read' : 'delivered'),
            isSticker: !!data.isSticker,
            stickerUrl: data.stickerUrl,
            isGif: !!data.isGif,
            gifUrl: data.gifUrl,
            replyTo: data.replyTo,
            sharedPost: data.sharedPost,
            isVanish: !!data.isVanish,
            isDeleted: !!data.isDeleted,
            deletedAt: data.deletedAt,
            deliveredAt: data.deliveredAt,
            readAt: data.readAt,
            timestamp: timeStr,
            _sortTime: sortTime,
          });
        });

        // Sort chronologically (oldest to newest)
        msgs.sort((a, b) => (a._sortTime || 0) - (b._sortTime || 0));
        onMessagesUpdate(msgs);
      },
      (error) => {
        console.warn('Firestore listenToChatMessages error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup messages listener:', err);
    return () => {};
  }
}

/**
 * Send a message to Firestore in real-time
 */
export async function sendMessageToFirestore(
  sender: User,
  receiver: User,
  text: string,
  mediaUrl?: string,
  isAudio?: boolean,
  audioUrl?: string,
  audioDuration?: number,
  options?: {
    mediaType?: 'image' | 'video' | 'audio' | 'gif';
    videoUrl?: string;
    videoDuration?: number;
    videoThumbnail?: string;
    isSticker?: boolean;
    stickerUrl?: string;
    isGif?: boolean;
    gifUrl?: string;
    replyTo?: any;
    sharedPost?: any;
    isVanish?: boolean;
  }
): Promise<string> {
  const chatId = getDeterministicChatId(sender.id, receiver.id);
  const chatDocRef = doc(db, 'chats', chatId);

  const cleanText = text.trim();

  let previewText = cleanText;
  if (!previewText) {
    if (options?.sharedPost) previewText = `Shared a ${options.sharedPost.type || 'post'}`;
    else if (options?.isSticker) previewText = 'Sent a sticker';
    else if (options?.isGif) previewText = 'Sent a GIF';
    else if (options?.videoUrl) previewText = '🎥 Video';
    else if (isAudio) previewText = '🎙️ Voice note';
    else if (mediaUrl) previewText = '📷 Photo';
    else previewText = 'Sent a message';
  }

  // 1. Ensure chat conversation parent document is registered/updated
  await setDoc(
    chatDocRef,
    {
      id: chatId,
      participants: [sender.id, receiver.id],
      participantDetails: {
        [sender.id]: {
          id: sender.id,
          username: sender.username,
          name: sender.name,
          avatar: sender.avatar,
          bio: sender.bio || '',
          isVerified: !!sender.isVerified,
          followersCount: sender.followersCount || 0,
          followingCount: sender.followingCount || 0,
          postsCount: sender.postsCount || 0,
        },
        [receiver.id]: {
          id: receiver.id,
          username: receiver.username,
          name: receiver.name,
          avatar: receiver.avatar,
          bio: receiver.bio || '',
          isVerified: !!receiver.isVerified,
          followersCount: receiver.followersCount || 0,
          followingCount: receiver.followingCount || 0,
          postsCount: receiver.postsCount || 0,
        },
      },
      lastMessage: previewText,
      lastMessageTime: 'Just now',
      lastMessageStatus: 'sent',
      lastSenderId: sender.id,
      lastSeen: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 2. Add message to the subcollection
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  const msgDoc = await addDoc(messagesCol, {
    chatId,
    senderId: sender.id,
    senderUsername: sender.username,
    senderAvatar: sender.avatar,
    receiverId: receiver.id,
    text: cleanText,
    mediaUrl: mediaUrl || null,
    mediaType: options?.mediaType || (options?.videoUrl ? 'video' : options?.isGif ? 'gif' : isAudio ? 'audio' : mediaUrl ? 'image' : undefined) || null,
    videoUrl: options?.videoUrl || null,
    videoDuration: options?.videoDuration || null,
    videoThumbnail: options?.videoThumbnail || null,
    audioUrl: audioUrl || null,
    audioDuration: audioDuration || null,
    isAudio: !!isAudio,
    isSticker: !!options?.isSticker,
    stickerUrl: options?.stickerUrl || null,
    isGif: !!options?.isGif,
    gifUrl: options?.gifUrl || null,
    replyTo: options?.replyTo || null,
    sharedPost: options?.sharedPost || null,
    isVanish: !!options?.isVanish,
    isDeleted: false,
    status: 'sent',
    reactions: {},
    reaction: null,
    isSeen: false,
    createdAt: serverTimestamp(),
  });

  return msgDoc.id;
}

/**
 * Mark a message as deleted for everyone in Firestore
 */
export async function deleteMessageForEveryoneInFirestore(
  chatId: string,
  messageId: string
): Promise<void> {
  if (!chatId || !messageId) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(msgRef, {
      isDeleted: true,
      text: 'This message was deleted',
      mediaUrl: null,
      videoUrl: null,
      audioUrl: null,
      stickerUrl: null,
      gifUrl: null,
      reactions: {},
      reaction: null,
      deletedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error deleting message for everyone in Firestore:', err);
    throw err;
  }
}

/**
 * Toggle reaction on a message with multi-emoji support
 */
export async function reactToMessageWithEmojiInFirestore(
  chatId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  if (!chatId || !messageId || !userId || !emoji) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const data = snap.data();
      const reactions: Record<string, string[]> = data.reactions || {};
      const currentUsers = reactions[emoji] || [];

      let updatedReactions = { ...reactions };
      if (currentUsers.includes(userId)) {
        // Remove reaction
        const nextUsers = currentUsers.filter((id) => id !== userId);
        if (nextUsers.length === 0) {
          delete updatedReactions[emoji];
        } else {
          updatedReactions[emoji] = nextUsers;
        }
      } else {
        // Add reaction (and optionally remove from other emojis if single reaction per user)
        Object.keys(updatedReactions).forEach((k) => {
          updatedReactions[k] = updatedReactions[k].filter((id) => id !== userId);
          if (updatedReactions[k].length === 0) delete updatedReactions[k];
        });
        updatedReactions[emoji] = [...(updatedReactions[emoji] || []), userId];
      }

      await updateDoc(msgRef, {
        reactions: updatedReactions,
        reaction: Object.keys(updatedReactions)[0] || null,
      });
    }
  } catch (err) {
    console.error('Error toggling emoji reaction:', err);
  }
}

/**
 * Update user online presence in Firestore
 */
export async function updateUserPresenceInFirestore(
  userId: string,
  isOnline: boolean
): Promise<void> {
  if (!userId || userId === 'guest_user') return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        isOnline,
        lastSeen: new Date().toISOString(),
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error updating presence:', err);
  }
}

/**
 * Delete a message from Firestore subcollection for both users
 */
export async function deleteMessageFromFirestore(
  chatId: string,
  messageId: string
): Promise<void> {
  if (!chatId || !messageId) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(msgRef);
  } catch (err) {
    console.error('Error deleting message from Firestore:', err);
    throw err;
  }
}

/**
 * Toggle or set a heart reaction on a message in Firestore
 */
export async function reactToMessageInFirestore(
  chatId: string,
  messageId: string,
  reaction: string = '❤️'
): Promise<void> {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const currentReaction = snap.data().reaction;
      await updateDoc(msgRef, {
        reaction: currentReaction === reaction ? null : reaction,
      });
    }
  } catch (err) {
    console.error('Error reacting to message:', err);
  }
}

/**
 * Mark messages in a thread as seen
 */
export async function markChatAsSeenInFirestore(
  chatId: string,
  currentUserId: string
): Promise<void> {
  if (!chatId || !currentUserId || currentUserId === 'guest_user') return;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(
      chatDocRef,
      {
        lastSeen: true,
        lastSeenBy: currentUserId,
        lastSeenAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error marking chat as seen in Firestore:', err);
  }
}

/**
 * Update thought note for user in Firestore
 */
export async function updateUserNoteInFirestore(
  userId: string,
  text: string,
  emoji: string = '✨'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        note: {
          text,
          emoji,
          updatedAt: serverTimestamp(),
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating user note in Firestore:', err);
  }
}

/**
 * Update typing status for a user in a chat thread
 */
export async function setTypingStatusInFirestore(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  if (!chatId || !userId || userId === 'guest_user') return;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(
      chatDocRef,
      {
        typing: {
          [userId]: isTyping,
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error setting typing status:', err);
  }
}

/**
 * Listen to typing status of other participants in a chat thread in real-time
 */
export function listenToChatTyping(
  chatId: string,
  currentUserId: string,
  onTypingUpdate: (isOtherTyping: boolean) => void
): () => void {
  if (!chatId) return () => {};

  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(
      chatDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const typingMap = data.typing || {};
          const otherTyping = Object.entries(typingMap).some(
            ([uid, isTyping]) => uid !== currentUserId && !!isTyping
          );
          onTypingUpdate(otherTyping);
        } else {
          onTypingUpdate(false);
        }
      },
      (err) => {
        console.warn('Error listening to typing status:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup typing listener:', err);
    return () => {};
  }
}

/**
 * Update and persist custom chat theme in Firestore chat document
 */
export async function updateChatThemeInFirestore(
  chatId: string,
  theme: ChatTheme
): Promise<void> {
  if (!chatId) return;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(
      chatDocRef,
      {
        theme: {
          id: theme.id || 'custom',
          name: theme.name || 'Custom Theme',
          bubbleColor: theme.bubbleColor || null,
          bubbleGradient: theme.bubbleGradient || null,
          textColor: theme.textColor || null,
          accentColor: theme.accentColor || null,
          backgroundUrl: theme.backgroundUrl || null,
          backgroundBlur: theme.backgroundBlur ?? 0,
          backgroundOpacity: theme.backgroundOpacity ?? 0.85,
          bubbleStylePreset: theme.bubbleStylePreset || null,
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating chat theme in Firestore:', err);
    throw err;
  }
}

/**
 * Listen to chat document details (including theme, typing, participants) in real-time
 */
export function listenToChatDetails(
  chatId: string,
  onUpdate: (chatData: any) => void
): () => void {
  if (!chatId) return () => {};
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(
      chatDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data());
        }
      },
      (err) => {
        console.warn('Error listening to chat details:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup chat details listener:', err);
    return () => {};
  }
}

/**
 * Block a user in Firestore database
 */
export async function blockUserInFirestore(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  if (!currentUserId || !targetUserId || currentUserId === 'guest_user') return;
  try {
    const userRef = doc(db, 'users', currentUserId);
    await setDoc(
      userRef,
      {
        blockedUsers: arrayUnion(targetUserId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error blocking user in Firestore:', err);
    throw err;
  }
}

/**
 * Unblock a user in Firestore database
 */
export async function unblockUserInFirestore(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  if (!currentUserId || !targetUserId || currentUserId === 'guest_user') return;
  try {
    const userRef = doc(db, 'users', currentUserId);
    await setDoc(
      userRef,
      {
        blockedUsers: arrayRemove(targetUserId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error unblocking user in Firestore:', err);
    throw err;
  }
}

/**
 * Listen to current user's blocked users list from Firestore
 */
export function listenToBlockedUsers(
  currentUserId: string,
  onBlockedUpdate: (blockedUserIds: string[]) => void
): () => void {
  if (!currentUserId || currentUserId === 'guest_user') {
    return () => {};
  }
  try {
    const userRef = doc(db, 'users', currentUserId);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const blocked = Array.isArray(data.blockedUsers) ? data.blockedUsers : [];
          onBlockedUpdate(blocked);
        }
      },
      (err) => {
        console.warn('Error listening to blocked users:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup blocked users listener:', err);
    return () => {};
  }
}

