import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.user?.id;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const users = await userService.getAllUsers(currentUserId, limit);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = (req.query.currentUserId as string) || req.user?.id;
      const followers = await userService.getFollowers(id, currentUserId);
      res.json(followers);
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = (req.query.currentUserId as string) || req.user?.id;
      const following = await userService.getFollowing(id, currentUserId);
      res.json(following);
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.body.currentUserId || req.user?.id || (req.query.currentUserId as string);
      const result = await userService.blockUser(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.body.currentUserId || req.user?.id || (req.query.currentUserId as string);
      const result = await userService.unblockUser(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = (req.query.currentUserId as string) || req.user?.id;
      const profile = await userService.getProfile(id, currentUserId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await userService.updateProfile(id, req.body);
      res.json({ success: true, user: updated });
    } catch (error) {
      next(error);
    }
  }

  async toggleFollow(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.body.currentUserId || req.user?.id;
      const result = await userService.toggleFollow(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPendingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.user?.id;
      const requests = await userService.getPendingRequests(currentUserId);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  }

  async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.params.requesterId;
      const currentUserId = req.body.currentUserId || req.user?.id;
      const result = await userService.acceptFollowRequest(currentUserId, requesterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async declineRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.params.requesterId;
      const currentUserId = req.body.currentUserId || req.user?.id;
      const result = await userService.declineFollowRequest(currentUserId, requesterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const term = (req.query.q as string) || (req.query.query as string) || '';
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const users = await userService.search(term, limit);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async removeFollower(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.body.currentUserId || req.user?.id || req.params.id;
      const followerId = req.params.followerId || req.body.followerId;
      const result = await userService.removeFollower(currentUserId, followerId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCloseFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || req.params.id;
      const friends = await userService.getCloseFriends(currentUserId);
      res.json(friends);
    } catch (error) {
      next(error);
    }
  }

  async toggleCloseFriend(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id || req.params.id;
      const friendId = req.params.friendId || req.body.friendId;
      const result = await userService.toggleCloseFriend(currentUserId, friendId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async setCloseFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id || req.params.id;
      const friendIds = req.body.friendIds || [];
      const result = await userService.setCloseFriends(currentUserId, friendIds);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRestrictedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || req.params.id;
      const users = await userService.getRestrictedUsers(currentUserId);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async restrictUser(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id;
      const targetUserId = req.params.id || req.body.targetUserId;
      const result = await userService.restrictUser(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async unrestrictUser(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id;
      const targetUserId = req.params.id || req.body.targetUserId;
      const result = await userService.unrestrictUser(currentUserId, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
