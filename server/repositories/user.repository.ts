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
  is_private?: boolean;
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
        u.is_private as "isPrivate",
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = $2) as "isFollowedBy",
        EXISTS(SELECT 1 FROM follow_requests WHERE requester_id = $2 AND target_id = u.id) as "hasRequestedFollow",
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $2 AND blocked_id = u.id) as "isBlocked",
        EXISTS(SELECT 1 FROM close_friends WHERE user_id = $2 AND friend_id = u.id) as "isCloseFriend",
        EXISTS(SELECT 1 FROM restricted_users WHERE user_id = $2 AND restricted_id = u.id) as "isRestricted"
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

  async isFollowRequested(requesterId: string, targetId: string): Promise<boolean> {
    const res = await query('SELECT 1 FROM follow_requests WHERE requester_id = $1 AND target_id = $2', [
      requesterId,
      targetId,
    ]);
    return res.rows.length > 0;
  }

  async createFollowRequest(requesterId: string, targetId: string): Promise<void> {
    await query('INSERT INTO follow_requests (requester_id, target_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      requesterId,
      targetId,
    ]);
  }

  async deleteFollowRequest(requesterId: string, targetId: string): Promise<void> {
    await query('DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2', [
      requesterId,
      targetId,
    ]);
  }

  async getPendingFollowRequests(targetUserId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        fr.requester_id as id,
        fr.created_at,
        u.username, u.name, u.avatar, u.bio, u.is_verified as "isVerified",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = $1) as "isFollowedBy"
      FROM follow_requests fr
      JOIN users u ON u.id = fr.requester_id
      WHERE fr.target_id = $1
      ORDER BY fr.created_at DESC`,
      [targetUserId]
    );
    return res.rows;
  }

  async acceptFollowRequest(requesterId: string, targetUserId: string): Promise<void> {
    await query('DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2', [
      requesterId,
      targetUserId,
    ]);
    await query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      requesterId,
      targetUserId,
    ]);
  }

  async acceptAllFollowRequests(targetUserId: string): Promise<void> {
    await query(
      `INSERT INTO follows (follower_id, following_id)
       SELECT requester_id, target_id FROM follow_requests WHERE target_id = $1
       ON CONFLICT DO NOTHING`,
      [targetUserId]
    );
    await query('DELETE FROM follow_requests WHERE target_id = $1', [targetUserId]);
  }

  async getAllUsers(currentUserId?: string, limit: number = 50): Promise<any[]> {
    const res = await query(
      `SELECT 
        u.id, u.username, u.name,
        CASE WHEN u.id = $1 THEN u.email ELSE NULL END as email,
        u.avatar, u.bio, u.website, u.category,
        u.is_verified as "isVerified",
        u.is_private as "isPrivate",
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) as "postsCount",
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) as "followersCount",
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) as "followingCount",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = $1) as "isFollowedBy",
        EXISTS(SELECT 1 FROM follow_requests WHERE requester_id = $1 AND target_id = u.id) as "hasRequestedFollow",
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $1 AND blocked_id = u.id) as "isBlocked",
        EXISTS(SELECT 1 FROM close_friends WHERE user_id = $1 AND friend_id = u.id) as "isCloseFriend",
        EXISTS(SELECT 1 FROM restricted_users WHERE user_id = $1 AND restricted_id = u.id) as "isRestricted"
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
        u.is_private as "isPrivate",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = $2) as "isFollowedBy",
        EXISTS(SELECT 1 FROM close_friends WHERE user_id = $2 AND friend_id = u.id) as "isCloseFriend",
        EXISTS(SELECT 1 FROM restricted_users WHERE user_id = $2 AND restricted_id = u.id) as "isRestricted"
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
        u.is_private as "isPrivate",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as "isFollowing",
        EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = $2) as "isFollowedBy",
        EXISTS(SELECT 1 FROM close_friends WHERE user_id = $2 AND friend_id = u.id) as "isCloseFriend",
        EXISTS(SELECT 1 FROM restricted_users WHERE user_id = $2 AND restricted_id = u.id) as "isRestricted"
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

  async removeFollower(followingId: string, followerId: string): Promise<void> {
    await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [
      followerId,
      followingId,
    ]);
  }

  async getCloseFriends(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT u.id, u.username, u.name, u.avatar, u.bio, u.is_verified as "isVerified"
       FROM close_friends cf
       JOIN users u ON u.id = cf.friend_id
       WHERE cf.user_id = $1
       ORDER BY cf.created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async isCloseFriend(userId: string, friendId: string): Promise<boolean> {
    const res = await query(
      'SELECT 1 FROM close_friends WHERE user_id = $1 AND friend_id = $2',
      [userId, friendId]
    );
    return res.rows.length > 0;
  }

  async addCloseFriend(userId: string, friendId: string): Promise<void> {
    await query(
      'INSERT INTO close_friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, friendId]
    );
  }

  async removeCloseFriend(userId: string, friendId: string): Promise<void> {
    await query(
      'DELETE FROM close_friends WHERE user_id = $1 AND friend_id = $2',
      [userId, friendId]
    );
  }

  async setCloseFriends(userId: string, friendIds: string[]): Promise<void> {
    await query('DELETE FROM close_friends WHERE user_id = $1', [userId]);
    for (const fid of friendIds) {
      if (fid && fid !== userId) {
        await query(
          'INSERT INTO close_friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, fid]
        );
      }
    }
  }

  async getRestrictedUsers(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT u.id, u.username, u.name, u.avatar, u.bio, u.is_verified as "isVerified"
       FROM restricted_users ru
       JOIN users u ON u.id = ru.restricted_id
       WHERE ru.user_id = $1
       ORDER BY ru.created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async isRestricted(userId: string, targetId: string): Promise<boolean> {
    const res = await query(
      'SELECT 1 FROM restricted_users WHERE user_id = $1 AND restricted_id = $2',
      [userId, targetId]
    );
    return res.rows.length > 0;
  }

  async restrictUser(userId: string, targetId: string): Promise<void> {
    await query(
      'INSERT INTO restricted_users (user_id, restricted_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, targetId]
    );
  }

  async unrestrictUser(userId: string, targetId: string): Promise<void> {
    await query(
      'DELETE FROM restricted_users WHERE user_id = $1 AND restricted_id = $2',
      [userId, targetId]
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
