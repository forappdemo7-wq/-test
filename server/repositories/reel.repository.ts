import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export class ReelRepository extends BaseRepository<any> {
  protected tableName = 'reels';

  async getReels(options: {
    currentUserId?: string;
    category?: string;
    limit: number;
    offset: number;
  }): Promise<any[]> {
    const { currentUserId = 'none', category = 'for_you', limit, offset } = options;
    let filterClause = '';
    const params: any[] = [currentUserId || 'none'];

    if (category === 'following' && currentUserId && currentUserId !== 'none') {
      filterClause = `AND EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.following_id = r.user_id)`;
    } else if (category === 'saved' && currentUserId && currentUserId !== 'none') {
      filterClause = `AND EXISTS(SELECT 1 FROM reel_saved rs WHERE rs.reel_id = r.id AND rs.user_id = $1)`;
    }

    let orderByClause = 'ORDER BY r.created_at DESC';
    if (category === 'trending') {
      orderByClause = 'ORDER BY (COALESCE(r.views_count, 0) + (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) * 10) DESC';
    }

    const res = await query(
      `SELECT 
        r.*,
        u.username,
        u.name,
        u.avatar,
        u.bio,
        u.is_verified,
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as author_posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as author_followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as author_following_count,
        (SELECT COUNT(*)::int FROM reel_likes WHERE reel_id = r.id) as likes_count,
        (SELECT COUNT(*)::int FROM reel_comments WHERE reel_id = r.id) as comments_count,
        (SELECT COUNT(*)::int FROM reel_saved WHERE reel_id = r.id) as shares_count,
        EXISTS(SELECT 1 FROM reel_likes WHERE reel_id = r.id AND user_id = $1) as "isLiked",
        EXISTS(SELECT 1 FROM reel_saved WHERE reel_id = r.id AND user_id = $1) as "isSaved",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = r.user_id) as "author_is_following"
      FROM reels r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 ${filterClause}
      ${orderByClause}
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.rows;
  }

  async createReel(reel: {
    id: string;
    userId: string;
    videoUrl: string;
    posterUrl: string;
    caption: string;
    musicTrack: any;
    tags: string[];
    duration: number;
    qualities: any[];
  }): Promise<void> {
    await query(
      `INSERT INTO reels (id, user_id, video_url, poster_url, caption, music_track, tags, views_count, duration_secs, qualities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9)`,
      [
        reel.id,
        reel.userId,
        reel.videoUrl,
        reel.posterUrl,
        reel.caption,
        reel.musicTrack ? JSON.stringify(reel.musicTrack) : null,
        JSON.stringify(reel.tags),
        reel.duration,
        JSON.stringify(reel.qualities),
      ]
    );
  }

  async toggleLike(reelId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const check = await query('SELECT 1 FROM reel_likes WHERE reel_id = $1 AND user_id = $2', [reelId, userId]);
    let isLiked = false;
    if (check.rows.length > 0) {
      await query('DELETE FROM reel_likes WHERE reel_id = $1 AND user_id = $2', [reelId, userId]);
      isLiked = false;
    } else {
      await query('INSERT INTO reel_likes (reel_id, user_id) VALUES ($1, $2)', [reelId, userId]);
      isLiked = true;
    }

    const countRes = await query('SELECT COUNT(*)::int as count FROM reel_likes WHERE reel_id = $1', [reelId]);
    return { isLiked, likesCount: parseInt(countRes.rows[0].count || '0', 10) };
  }

  async toggleSave(reelId: string, userId: string): Promise<boolean> {
    const check = await query('SELECT 1 FROM reel_saved WHERE reel_id = $1 AND user_id = $2', [reelId, userId]);
    if (check.rows.length > 0) {
      await query('DELETE FROM reel_saved WHERE reel_id = $1 AND user_id = $2', [reelId, userId]);
      return false;
    } else {
      await query('INSERT INTO reel_saved (reel_id, user_id) VALUES ($1, $2)', [reelId, userId]);
      return true;
    }
  }

  async getComments(reelId: string, currentUserId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        rc.id,
        rc.user_id as "userId",
        u.username,
        u.avatar as "userAvatar",
        rc.text,
        rc.created_at,
        rc.likes_count as "likesCount",
        EXISTS(SELECT 1 FROM reel_comment_likes rcl WHERE rcl.comment_id = rc.id AND rcl.user_id = $2) as "isLiked"
      FROM reel_comments rc
      JOIN users u ON rc.user_id = u.id
      WHERE rc.reel_id = $1
      ORDER BY rc.created_at DESC`,
      [reelId, currentUserId || 'none']
    );
    return res.rows;
  }

  async addComment(commentId: string, reelId: string, userId: string, text: string): Promise<void> {
    await query(
      `INSERT INTO reel_comments (id, reel_id, user_id, text, likes_count) VALUES ($1, $2, $3, $4, 0)`,
      [commentId, reelId, userId, text]
    );
  }

  async recordWatch(reelId: string, userId: string, watchDurationSecs: number, progressPercent: number): Promise<void> {
    await query('UPDATE reels SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1', [reelId]);
    if (userId && userId !== 'none' && userId !== 'guest_user') {
      const historyId = `rwh_${userId}_${reelId}`;
      await query(
        `INSERT INTO reel_watch_history (id, reel_id, user_id, watch_duration_secs, progress_percent, watched_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET 
           watch_duration_secs = EXCLUDED.watch_duration_secs,
           progress_percent = EXCLUDED.progress_percent,
           watched_at = NOW()`,
        [historyId, reelId, userId, watchDurationSecs, progressPercent]
      );
    }
  }

  async getWatchHistory(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        rwh.id as history_id,
        rwh.watched_at,
        rwh.watch_duration_secs,
        rwh.progress_percent,
        r.*,
        u.username,
        u.name,
        u.avatar,
        u.is_verified,
        (SELECT COUNT(*)::int FROM reel_likes WHERE reel_id = r.id) as likes_count,
        (SELECT COUNT(*)::int FROM reel_comments WHERE reel_id = r.id) as comments_count,
        EXISTS(SELECT 1 FROM reel_likes WHERE reel_id = r.id AND user_id = $1) as "isLiked",
        EXISTS(SELECT 1 FROM reel_saved WHERE reel_id = r.id AND user_id = $1) as "isSaved"
      FROM reel_watch_history rwh
      JOIN reels r ON rwh.reel_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE rwh.user_id = $1
      ORDER BY rwh.watched_at DESC
      LIMIT 50`,
      [userId]
    );
    return res.rows;
  }
}

export const reelRepository = new ReelRepository();
