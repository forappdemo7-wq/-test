import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export class StoryRepository extends BaseRepository<any> {
  protected tableName = 'stories';

  async getAllStoriesWithUsers(currentUserId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        s.*,
        u.username,
        u.name,
        u.avatar,
        u.is_verified,
        EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND user_id = $1) as "isSeen",
        EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = $1) as "isLiked",
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id)::int as "viewsCount",
        (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id)::int as "likesCount"
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (
        COALESCE(u.is_private, false) = false
        OR s.user_id = $1
        OR EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = s.user_id)
      )
      ORDER BY s.created_at DESC`,
      [currentUserId || 'none']
    );
    return res.rows;
  }

  async createStory(story: {
    id: string;
    userId: string;
    mediaUrl: string;
    mediaType: string;
    caption: string;
    filter: string;
    link: string;
  }): Promise<void> {
    await query(
      `INSERT INTO stories (id, user_id, media_url, media_type, caption, filter, link)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [story.id, story.userId, story.mediaUrl, story.mediaType, story.caption, story.filter, story.link]
    );
  }

  async recordView(storyId: string, userId: string): Promise<void> {
    await query(
      `INSERT INTO story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [storyId, userId]
    );
  }

  async toggleLike(storyId: string, userId: string): Promise<boolean> {
    const existing = await query(
      `SELECT 1 FROM story_likes WHERE story_id = $1 AND user_id = $2`,
      [storyId, userId]
    );
    if (existing.rows.length > 0) {
      await query(`DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2`, [storyId, userId]);
      return false;
    } else {
      await query(`INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2)`, [storyId, userId]);
      return true;
    }
  }

  async getViewers(storyId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.avatar, u.is_verified, sv.created_at as viewed_at,
        EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = $1 AND sl.user_id = u.id) as has_liked
      FROM story_views sv
      JOIN users u ON sv.user_id = u.id
      WHERE sv.story_id = $1
      ORDER BY sv.created_at DESC`,
      [storyId]
    );
    return res.rows;
  }

  async getUserArchive(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT * FROM stories WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async getUserHighlights(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT * FROM highlights WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const highlights = [];
    for (const h of res.rows) {
      const items = await query(
        `SELECT * FROM highlight_items WHERE highlight_id = $1 ORDER BY order_index ASC, created_at ASC`,
        [h.id]
      );
      highlights.push({
        id: h.id,
        userId: h.user_id,
        title: h.title,
        coverUrl: h.cover_url,
        items: items.rows,
        storiesCount: items.rows.length,
      });
    }
    return highlights;
  }
}

export const storyRepository = new StoryRepository();
