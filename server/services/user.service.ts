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

    const isOwnProfile = Boolean(currentUserId && currentUserId === user.id);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: isOwnProfile ? user.email : undefined,
      avatar: user.avatar,
      bio: user.bio || '',
      website: user.website || '',
      category: user.category || '',
      isVerified: user.is_verified || false,
      isPrivate: Boolean(user.is_private || user.isPrivate),
      accountType: (user.is_private || user.isPrivate) ? 'private' : 'public',
      hasRequestedFollow: Boolean(user.hasRequestedFollow),
      followersCount: parseInt(user.followers_count || '0', 10),
      followingCount: parseInt(user.following_count || '0', 10),
      postsCount: parseInt(user.posts_count || '0', 10),
      isFollowing: Boolean(user.isFollowing),
      isFollowedBy: Boolean(user.isFollowedBy),
      isBlocked: Boolean(user.isBlocked),
    };
  }

  async updateProfile(userId: string, updates: any) {
    const payload = { ...updates };
    if (payload.isPrivate !== undefined) {
      payload.is_private = Boolean(payload.isPrivate);
      delete payload.isPrivate;

      // If switching to public account, auto-accept all pending follow requests
      if (!payload.is_private) {
        await userRepository.acceptAllFollowRequests(userId);
      }
    }

    const updated = await userRepository.updateProfile(userId, payload);
    if (!updated) {
      throw new NotFoundError('User');
    }
    await cacheService.delete(CacheKeys.user(userId));
    return {
      ...updated,
      isPrivate: Boolean(updated.is_private),
      accountType: updated.is_private ? 'private' : 'public',
    };
  }

  async toggleFollow(currentUserId: string, targetUserId: string) {
    if (!currentUserId || currentUserId === targetUserId) {
      throw new BadRequestError('Cannot follow self or invalid user ID');
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('Target user');
    }

    const isFollowing = await userRepository.isFollowing(currentUserId, targetUserId);
    let newIsFollowing = false;
    let newHasRequested = false;

    if (isFollowing) {
      // Unfollow
      await userRepository.unfollow(currentUserId, targetUserId);
      newIsFollowing = false;
      newHasRequested = false;
    } else if (targetUser.is_private) {
      // Target account is private: check if already requested
      const alreadyRequested = await userRepository.isFollowRequested(currentUserId, targetUserId);
      if (alreadyRequested) {
        // Cancel follow request
        await userRepository.deleteFollowRequest(currentUserId, targetUserId);
        newIsFollowing = false;
        newHasRequested = false;
      } else {
        // Send follow request
        await userRepository.createFollowRequest(currentUserId, targetUserId);
        newIsFollowing = false;
        newHasRequested = true;

        // Dispatch background notification
        await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
          recipientId: targetUserId,
          senderId: currentUserId,
          type: 'follow_request',
          text: 'requested to follow you',
        });
      }
    } else {
      // Target account is public: follow immediately
      await userRepository.follow(currentUserId, targetUserId);
      newIsFollowing = true;
      newHasRequested = false;

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
      hasRequestedFollow: newHasRequested,
      targetFollowersCount,
    };
  }

  async getPendingRequests(currentUserId: string) {
    if (!currentUserId) throw new BadRequestError('User ID is required');
    return userRepository.getPendingFollowRequests(currentUserId);
  }

  async acceptFollowRequest(currentUserId: string, requesterId: string) {
    if (!currentUserId || !requesterId) {
      throw new BadRequestError('Current user and requester IDs are required');
    }
    await userRepository.acceptFollowRequest(requesterId, currentUserId);

    // Notify the requester that their request was accepted
    await jobQueue.add(JobType.DISPATCH_NOTIFICATION, {
      recipientId: requesterId,
      senderId: currentUserId,
      type: 'follow',
      text: 'accepted your follow request',
    });

    const countRes = await query('SELECT COUNT(*)::int as count FROM follows WHERE following_id = $1', [
      currentUserId,
    ]);
    return {
      success: true,
      followersCount: parseInt(countRes.rows[0]?.count || '0', 10),
    };
  }

  async declineFollowRequest(currentUserId: string, requesterId: string) {
    if (!currentUserId || !requesterId) {
      throw new BadRequestError('Current user and requester IDs are required');
    }
    await userRepository.deleteFollowRequest(requesterId, currentUserId);
    return { success: true };
  }

  async getAllUsers(currentUserId?: string, limit: number = 50) {
    const users = await userRepository.getAllUsers(currentUserId, limit);
    return users.map((u) => ({
      ...u,
      isPrivate: Boolean(u.isPrivate || u.is_private),
      accountType: (u.isPrivate || u.is_private) ? 'private' : 'public',
      hasRequestedFollow: Boolean(u.hasRequestedFollow),
    }));
  }

  async getFollowers(targetUserId: string, currentUserId?: string) {
    // If target is private and not the current user and current user is not following, restrict visibility
    if (currentUserId && targetUserId !== currentUserId) {
      const targetUser = await userRepository.findById(targetUserId);
      if (targetUser?.is_private) {
        const isFollowing = await userRepository.isFollowing(currentUserId, targetUserId);
        if (!isFollowing) {
          return [];
        }
      }
    }
    return userRepository.getFollowers(targetUserId, currentUserId);
  }

  async getFollowing(targetUserId: string, currentUserId?: string) {
    // If target is private and not the current user and current user is not following, restrict visibility
    if (currentUserId && targetUserId !== currentUserId) {
      const targetUser = await userRepository.findById(targetUserId);
      if (targetUser?.is_private) {
        const isFollowing = await userRepository.isFollowing(currentUserId, targetUserId);
        if (!isFollowing) {
          return [];
        }
      }
    }
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

  async removeFollower(currentUserId: string, followerId: string) {
    if (!currentUserId || !followerId) {
      throw new BadRequestError('User ID and follower ID are required');
    }
    await userRepository.removeFollower(currentUserId, followerId);
    const countRes = await query('SELECT COUNT(*)::int as count FROM follows WHERE following_id = $1', [
      currentUserId,
    ]);
    return {
      success: true,
      followersCount: parseInt(countRes.rows[0]?.count || '0', 10),
    };
  }

  async getCloseFriends(currentUserId: string) {
    if (!currentUserId) throw new BadRequestError('User ID is required');
    return userRepository.getCloseFriends(currentUserId);
  }

  async toggleCloseFriend(currentUserId: string, friendId: string) {
    if (!currentUserId || !friendId) throw new BadRequestError('User IDs required');
    const exists = await userRepository.isCloseFriend(currentUserId, friendId);
    if (exists) {
      await userRepository.removeCloseFriend(currentUserId, friendId);
      return { success: true, isCloseFriend: false };
    } else {
      await userRepository.addCloseFriend(currentUserId, friendId);
      return { success: true, isCloseFriend: true };
    }
  }

  async setCloseFriends(currentUserId: string, friendIds: string[]) {
    if (!currentUserId) throw new BadRequestError('User ID is required');
    await userRepository.setCloseFriends(currentUserId, friendIds || []);
    return { success: true };
  }

  async getRestrictedUsers(currentUserId: string) {
    if (!currentUserId) throw new BadRequestError('User ID is required');
    return userRepository.getRestrictedUsers(currentUserId);
  }

  async restrictUser(currentUserId: string, targetUserId: string) {
    if (!currentUserId || !targetUserId) throw new BadRequestError('User IDs required');
    if (currentUserId === targetUserId) throw new BadRequestError('Cannot restrict yourself');
    await userRepository.restrictUser(currentUserId, targetUserId);
    return { success: true, isRestricted: true };
  }

  async unrestrictUser(currentUserId: string, targetUserId: string) {
    if (!currentUserId || !targetUserId) throw new BadRequestError('User IDs required');
    await userRepository.unrestrictUser(currentUserId, targetUserId);
    return { success: true, isRestricted: false };
  }

  async search(term: string, limit: number = 20) {
    if (!term || !term.trim()) return [];
    return userRepository.searchUsers(term.trim(), limit);
  }
}

export const userService = new UserService();
