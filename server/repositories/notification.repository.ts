import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export class NotificationRepository extends BaseRepository<any> {
  protected tableName = 'notifications';

  async getNotifications(recipientId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const res = await query(
      `SELECT 
        n.*,
        u.username,
        u.name,
        u.avatar,
        u.is_verified,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.following_id = u.id) as is_following
      FROM notifications n
      JOIN users u ON n.sender_id = u.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3`,
      [recipientId, limit, offset]
    );
    return res.rows;
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await query('UPDATE notifications SET is_read = true WHERE recipient_id = $1', [recipientId]);
  }

  async markAsRead(id: string, isRead: boolean = true): Promise<void> {
    await query('UPDATE notifications SET is_read = $1 WHERE id = $2', [isRead, id]);
  }

  async createNotification(notif: {
    id: string;
    recipientId: string;
    senderId: string;
    type: string;
    targetMediaUrl?: string | null;
    postId?: string | null;
    text: string;
  }): Promise<void> {
    await query(
      `INSERT INTO notifications (id, recipient_id, sender_id, type, post_id, target_media_url, text, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())`,
      [notif.id, notif.recipientId, notif.senderId, notif.type, notif.postId || null, notif.targetMediaUrl || null, notif.text]
    );
  }
}

export const notificationRepository = new NotificationRepository();
