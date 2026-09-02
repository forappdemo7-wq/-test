import { userRepository } from '../repositories/user.repository';
import { query } from '../core/database/pool';
import { NotFoundError, BadRequestError } from '../core/errors/app-error';
import { jobQueue } from '../core/queue/queue';
import { JobType } from '../core/queue/job-types';
import { cacheService } from '../core/cache/redis-cache';
import { CacheKeys } from '../core/cache/cache-keys';

export class UserService {
  async getProfile(userId: string, currentUserId?: string) {
    const user = await userRepository.getUserProfileWithStats(userId, currentUserId);
    if (!user) {
      throw new NotFoundError('User profile');
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio || '',
      website: user.website || '',
      category: user.category || '',
      isVerified: user.is_verified || false,
      followersCount: parseInt(user.followers_count || '0', 10),
      followingCount: parseInt(user.following_count || '0', 10),
      postsCount: parseInt(user.posts_count || '0', 10),
      isFollowing: Boolean(user.isFollowing),
      isBlocked: Boolean(user.isBlocked),
    };
  }

  async updateProfile(userId: string, updates: any) {
    const updated = await userRepository.updateProfile(userId, updates);
    if (!updated) {
      throw new NotFoundError('User');
    }
    await cacheService.delete(CacheKeys.user(userId));
    return updated;
  }

  async toggleFollow(currentUserId: string, targetUserId: string) {
    if (!currentUserId || currentUserId === targetUserId) {
      throw new BadRequestError('Cannot follow self or invalid user ID');
    }

    const isFollowing = await userRepository.isFollowing(currentUserId, targetUserId);
    let newIsFollowing = false;

    if (isFollowing) {
      await userRepository.unfollow(currentUserId, targetUserId);
      newIsFollowing = false;
    } else {
      await userRepository.follow(currentUserId, targetUserId);
      newIsFollowing = true;

      // Dispatch background notification
      await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
        recipientId: targetUserId,
        senderId: currentUserId,
        type: 'follow',
        text: 'started following you',
      });
    }

    const countRes = await query('SELECT COUNT(*)::int as count FROM follows WHERE following_id = $1', [
      targetUserId,
    ]);
    const targetFollowersCount = parseInt(countRes.rows[0]?.count || '0', 10);

    return {
      success: true,
      isFollowing: newIsFollowing,
      targetFollowersCount,
    };
  }

  async getAllUsers(currentUserId?: string, limit: number = 50) {
    return userRepository.getAllUsers(currentUserId, limit);
  }

  async getFollowers(targetUserId: string, currentUserId?: string) {
    return userRepository.getFollowers(targetUserId, currentUserId);
  }

  async getFollowing(targetUserId: string, currentUserId?: string) {
    return userRepository.getFollowing(targetUserId, currentUserId);
  }

  async blockUser(currentUserId: string, targetUserId: string) {
    if (!currentUserId || !targetUserId) {
      throw new BadRequestError('User ID and target user ID are required');
    }
    await userRepository.blockUser(currentUserId, targetUserId);
    return { success: true, isBlocked: true };
  }

  async unblockUser(currentUserId: string, targetUserId: string) {
    if (!currentUserId || !targetUserId) {
      throw new BadRequestError('User ID and target user ID are required');
    }
    await userRepository.unblockUser(currentUserId, targetUserId);
    return { success: true, isBlocked: false };
  }

  async search(term: string, limit: number = 20) {
    if (!term || !term.trim()) return [];
    return userRepository.searchUsers(term.trim(), limit);
  }
}

export const userService = new UserService();
