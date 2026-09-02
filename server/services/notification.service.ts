import { notificationRepository } from '../repositories/notification.repository';
import { query } from '../core/database/pool';
import { BadRequestError } from '../core/errors/app-error';

export class NotificationService {
  async getNotifications(currentUserId: string = 'user_current', limit: number = 20, offset: number = 0) {
    const rawRows = await notificationRepository.getNotifications(currentUserId, limit, offset);

    return rawRows.map((n) => {
      let timeAgo = 'Just now';
      if (n.created_at) {
        const diffSecs = Math.floor((Date.now() - new Date(n.created_at).getTime()) / 1000);
        if (diffSecs < 60) timeAgo = 'Just now';
        else if (diffSecs < 3600) timeAgo = `${Math.floor(diffSecs / 60)}m`;
        else if (diffSecs < 86400) timeAgo = `${Math.floor(diffSecs / 3600)}h`;
        else if (diffSecs < 604800) timeAgo = `${Math.floor(diffSecs / 86400)}d`;
        else timeAgo = `${Math.floor(diffSecs / 604800)}w`;
      }

      return {
        id: n.id,
        type: n.type,
        user: {
          id: n.sender_id,
          username: n.username,
          name: n.name,
          avatar: n.avatar,
          isVerified: n.is_verified,
          isFollowing: Boolean(n.is_following),
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          bio: '',
        },
        actors: [
          {
            id: n.sender_id,
            username: n.username,
            name: n.name,
            avatar: n.avatar,
            isVerified: n.is_verified,
            isFollowing: Boolean(n.is_following),
          },
        ],
        totalActorsCount: 1,
        isGrouped: false,
        targetPostId: n.post_id,
        targetMediaUrl: n.target_media_url,
        text: n.text,
        timestamp: timeAgo,
        rawTimestamp: n.created_at,
        isRead: Boolean(n.is_read),
      };
    });
  }

  async markAllAsRead(currentUserId: string = 'user_current') {
    await notificationRepository.markAllAsRead(currentUserId);
    return { success: true };
  }

  async markAsRead(id: string, isRead: boolean = true) {
    await notificationRepository.markAsRead(id, isRead);
    return { success: true, id, isRead };
  }

  async deleteNotification(id: string) {
    await query('DELETE FROM notifications WHERE id = $1', [id]);
    return { success: true, id };
  }

  async replyToNotification(id: string, currentUserId: string, text: string, postId?: string) {
    if (!text || !currentUserId) {
      throw new BadRequestError('Reply text and currentUserId are required');
    }

    if (postId) {
      const commentId = `comm_${Date.now()}`;
      await query(
        `INSERT INTO comments (id, post_id, user_id, text, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [commentId, postId, currentUserId, text]
      );
    }

    await notificationRepository.markAsRead(id, true);
    return { success: true, repliedText: text };
  }

  async simulateNotification(currentUserId: string = 'user_current', type: string = 'like') {
    const otherUsers = await query('SELECT * FROM users WHERE id != $1 ORDER BY RANDOM() LIMIT 1', [currentUserId]);
    if (otherUsers.rows.length === 0) {
      throw new BadRequestError('No other users found to simulate notification');
    }

    const sender = otherUsers.rows[0];
    const notifId = `notif_sim_${Date.now()}`;
    const sampleTexts: Record<string, string> = {
      like: 'liked your recent photo.',
      comment: 'commented: "Obsessed with these tones! 🌟✨"',
      follow: 'started following you.',
      story_like: 'liked your story.',
      mention: 'mentioned you in a post: "@you check this vibe out!"',
      tag: 'tagged you in a new photo.',
    };

    const text = sampleTexts[type] || 'interacted with your profile.';
    const mediaUrl = type === 'follow' ? null : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';

    await notificationRepository.createNotification({
      id: notifId,
      recipientId: currentUserId,
      senderId: sender.id,
      type,
      targetMediaUrl: mediaUrl,
      text,
    });

    return {
      id: notifId,
      type,
      user: {
        id: sender.id,
        username: sender.username,
        name: sender.name,
        avatar: sender.avatar,
        isVerified: sender.is_verified,
        isFollowing: false,
      },
      text,
      targetMediaUrl: mediaUrl,
      timestamp: 'Just now',
      isRead: false,
    };
  }
}

export const notificationService = new NotificationService();
