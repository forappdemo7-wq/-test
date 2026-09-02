import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export class MessageRepository extends BaseRepository<any> {
  protected tableName = 'messages';

  async getUserMessages(currentUserId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        m.*,
        su.username as sender_username, su.avatar as sender_avatar,
        ru.username as receiver_username, ru.avatar as receiver_avatar
      FROM messages m
      JOIN users su ON m.sender_id = su.id
      JOIN users ru ON m.receiver_id = ru.id
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY m.created_at ASC`,
      [currentUserId]
    );
    return res.rows;
  }

  async createMessage(message: {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    mediaUrl?: string | null;
  }): Promise<void> {
    await query(
      `INSERT INTO messages (id, sender_id, receiver_id, text, media_url, is_seen)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [message.id, message.senderId, message.receiverId, message.text, message.mediaUrl || null]
    );
  }

  async markChatSeen(chatId: string, currentUserId: string): Promise<void> {
    if (chatId && chatId.startsWith('chat_')) {
      const parts = chatId.replace('chat_', '').split('_');
      if (parts.length >= 2) {
        const otherUserId = parts[0] === currentUserId ? parts[1] : parts[0];
        await query(
          `UPDATE messages SET is_seen = true WHERE receiver_id = $1 AND sender_id = $2`,
          [currentUserId, otherUserId]
        );
        return;
      }
    }
    await query(
      `UPDATE messages SET is_seen = true WHERE receiver_id = $1`,
      [currentUserId]
    );
  }
}

export const messageRepository = new MessageRepository();
