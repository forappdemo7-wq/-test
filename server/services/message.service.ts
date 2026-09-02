import { messageRepository } from '../repositories/message.repository';
import { uploadToCloudinary } from '../utils/cloudinary';
import { BadRequestError } from '../core/errors/app-error';

export class MessageService {
  async getMessagesGroupedByChat(currentUserId: string = 'user_current') {
    const rawMessages = await messageRepository.getUserMessages(currentUserId);
    const threadsMap: Record<string, any> = {};

    for (const m of rawMessages) {
      const otherUserId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
      const sortedIds = [m.sender_id, m.receiver_id].sort();
      const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;

      if (!threadsMap[chatId]) {
        const isSenderMe = m.sender_id === currentUserId;
        threadsMap[chatId] = {
          id: chatId,
          participant: {
            id: otherUserId,
            username: isSenderMe ? m.receiver_username : m.sender_username,
            name: isSenderMe ? m.receiver_username : m.sender_username,
            avatar: isSenderMe ? m.receiver_avatar : m.sender_avatar,
            bio: '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
          },
          lastMessage: m.text,
          lastMessageTime: m.created_at,
          unreadCount: 0,
          messages: [],
        };
      }

      threadsMap[chatId].lastMessage = m.text;
      threadsMap[chatId].lastMessageTime = m.created_at;
      if (!m.is_seen && m.receiver_id === currentUserId) {
        threadsMap[chatId].unreadCount += 1;
      }

      threadsMap[chatId].messages.push({
        id: m.id,
        senderId: m.sender_id,
        text: m.text,
        mediaUrl: m.media_url,
        timestamp: m.created_at,
        isSeen: m.is_seen,
        reaction: m.reaction,
        isAudio: m.is_audio,
      });
    }

    return Object.values(threadsMap);
  }

  async sendMessage(data: {
    senderId: string;
    receiverId: string;
    text: string;
    mediaUrl?: string | null;
  }) {
    if (!data.receiverId || !data.text) {
      throw new BadRequestError('Receiver ID and message text are required');
    }

    let finalMedia = data.mediaUrl;
    if (data.mediaUrl && data.mediaUrl.startsWith('data:image')) {
      const uploadRes = await uploadToCloudinary(data.mediaUrl, 'instavibe_messages');
      finalMedia = uploadRes.url;
    }

    const msgId = `msg_${Date.now()}`;
    await messageRepository.createMessage({
      id: msgId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      text: data.text,
      mediaUrl: finalMedia,
    });

    return {
      id: msgId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      text: data.text,
      mediaUrl: finalMedia,
      timestamp: 'Just now',
      isSeen: false,
    };
  }

  async markChatAsSeen(chatId: string, currentUserId: string = 'user_current') {
    await messageRepository.markChatSeen(chatId, currentUserId);
  }
}

export const messageService = new MessageService();
