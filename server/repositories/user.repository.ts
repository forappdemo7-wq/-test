import { BaseRepository } from './base.repository';
import { query } from '../core/database/pool';

export interface UserEntity {
  id: string;
  username: string;
  name: string;
  email?: string;
  password_hash?: string;
  avatar?: string;
  bio?: string;
  is_verified?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  website?: string;
  category?: string;
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  passkey_credential_id?: string;
  passkey_public_key?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserRepository extends BaseRepository<UserEntity> {
  protected tableName = 'users';

  async findByUsername(username: string): Promise<UserEntity | null> {
    const res = await query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return res.rows[0] || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  }

  async findByLogin(login: string): Promise<UserEntity | null> {
    const res = await query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [login]
    );
    return res.rows[0] || null;
  }

  async createUser(user: Partial<UserEntity>): Promise<UserEntity> {
    const res = await query(
      `INSERT INTO users (
        id, username, name, email, password_hash, avatar, bio, is_verified,
        followers_count, following_count, posts_count, website, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        user.id,
        user.username,
        user.name,
        user.email || null,
        user.password_hash || null,
        user.avatar || '',
        user.bio || '',
        user.is_verified || false,
        user.followers_count || 0,
        user.following_count || 0,
        user.posts_count || 0,
        user.website || null,
        user.category || null,
      ]
    );
    return res.rows[0];
  }

  async updateProfile(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const keys = Object.keys(updates).filter((k) => updates[k as keyof UserEntity] !== undefined);
    if (keys.length === 0) return this.findById(id);

    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = keys.map((k) => updates[k as keyof UserEntity]);

    const res = await query(
      `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return res.rows[0] || null;
  }

  async getUserProfileWithStats(targetUserId: string, currentUserId?: string): Promise<any | null> {
    const res = await query(
      `SELECT 
        u.*,
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $2 AND blocked_id = u.id) as "isBlocked"
      FROM users u
      WHERE u.id = $1`,
      [targetUserId, currentUserId || 'none']
    );
    return res.rows[0] || null;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const res = await query('SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2', [
      followerId,
      followingId,
    ]);
    return res.rows.length > 0;
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    await query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      followerId,
      followingId,
    ]);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [
      followerId,
      followingId,
    ]);
  }

  async getAllUsers(currentUserId?: string, limit: number = 50): Promise<any[]> {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.email, u.avatar, u.bio, u.website, u.category,
        u.is_verified as "isVerified",
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as "postsCount",
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as "followersCount",
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as "followingCount",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $1 AND blocked_id = u.id) as "isBlocked"
      FROM users u
      ORDER BY u.created_at ASC
      LIMIT $2`,
      [currentUserId || 'none', limit]
    );
    return res.rows;
  }

  async getFollowers(targetUserId: string, currentUserId?: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.avatar, u.bio, u.is_verified as "isVerified",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing"
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = $1`,
      [targetUserId, currentUserId || 'none']
    );
    return res.rows;
  }

  async getFollowing(targetUserId: string, currentUserId?: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name, u.avatar, u.bio, u.is_verified as "isVerified",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing"
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = $1`,
      [targetUserId, currentUserId || 'none']
    );
    return res.rows;
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    await query(
      `INSERT INTO blocked_users (blocker_id, blocked_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, blockedUserId]
    );
    // Automatically unfollow both directions
    await this.unfollow(userId, blockedUserId);
    await this.unfollow(blockedUserId, userId);
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    await query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
      [userId, blockedUserId]
    );
  }

  async searchUsers(term: string, limit: number = 20): Promise<UserEntity[]> {
    const res = await query(
      `SELECT id, username, name, avatar, bio, is_verified, followers_count
       FROM users
       WHERE username ILIKE $1 OR name ILIKE $1
       LIMIT $2`,
      [`%${term}%`, limit]
    );
    return res.rows;
  }
}

export const userRepository = new UserRepository();
