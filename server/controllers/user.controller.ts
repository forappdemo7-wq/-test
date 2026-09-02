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
}

export const userController = new UserController();
