import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export interface PostEntity {
  id: string;
  user_id: string;
  caption?: string;
  location?: string;
  media?: any;
  tags?: any;
  music_track?: any;
  likes_count?: number;
  comments_count?: number;
  created_at?: string;
  updated_at?: string;
}

export class PostRepository extends BaseRepository<PostEntity> {
  protected tableName = 'posts';

  async getFeedPosts(currentUserId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const res = await query(
      `SELECT 
        p.*,
        u.username as author_username,
        u.name as author_name,
        u.avatar as author_avatar,
        u.bio as author_bio,
        u.is_verified as author_is_verified,
        COALESCE(u.is_private, false) as author_is_private,
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as author_posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as author_followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as author_following_count,
        (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as "isLiked",
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as "isSaved",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = p.user_id) as "author_is_following",
        EXISTS(SELECT 1 FROM follow_requests WHERE requester_id = $1 AND target_id = p.user_id) as "author_has_requested_follow"
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE (
        COALESCE(u.is_private, false) = false
        OR p.user_id = $1
        OR EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = p.user_id)
      )
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [currentUserId || 'none', limit, offset]
    );
    return res.rows;
  }

  async getCommentsByPostIds(postIds: string[], currentUserId: string): Promise<any[]> {
    if (postIds.length === 0) return [];
    const res = await query(
      `SELECT 
        c.*,
        u.username,
        u.avatar as user_avatar,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $1) as "isLiked"
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ANY($2::varchar[])
      ORDER BY c.created_at ASC`,
      [currentUserId || 'none', postIds]
    );
    return res.rows;
  }

  async createPost(post: {
    id: string;
    userId: string;
    caption: string;
    location: string;
    tags: string[];
    musicTrack: any;
    media: any[];
  }): Promise<void> {
    await query(
      `INSERT INTO posts (id, user_id, caption, location, tags, music_track, media)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        post.id,
        post.userId,
        post.caption,
        post.location,
        JSON.stringify(post.tags || []),
        post.musicTrack ? JSON.stringify(post.musicTrack) : null,
        JSON.stringify(post.media || []),
      ]
    );

    if (post.media && post.media.length > 0) {
      for (let i = 0; i < post.media.length; i++) {
        const m = post.media[i];
        await query(
          `INSERT INTO post_media (id, post_id, url, media_type, aspect_ratio, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [`pm_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`, post.id, m.url, m.type || 'image', m.aspectRatio || 'square', i]
        );
      }
    }
  }

  async isLiked(postId: string, userId: string): Promise<boolean> {
    const res = await query('SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    return res.rows.length > 0;
  }

  async addLike(postId: string, userId: string): Promise<void> {
    await query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, userId]);
    await query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
  }

  async removeLike(postId: string, userId: string): Promise<void> {
    await query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    await query('UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [postId]);
  }

  async isSaved(postId: string, userId: string): Promise<boolean> {
    const res = await query('SELECT 1 FROM saved_posts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    return res.rows.length > 0;
  }

  async addSave(postId: string, userId: string): Promise<void> {
    await query('INSERT INTO saved_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, userId]);
  }

  async removeSave(postId: string, userId: string): Promise<void> {
    await query('DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  }

  async addComment(commentId: string, postId: string, userId: string, text: string): Promise<any> {
    await query(
      `INSERT INTO comments (id, post_id, user_id, text, likes_count) VALUES ($1, $2, $3, $4, 0)`,
      [commentId, postId, userId, text]
    );
    await query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [postId]);
  }
}

export const postRepository = new PostRepository();
