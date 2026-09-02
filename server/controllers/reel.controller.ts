import { Request, Response, NextFunction } from 'express';
import { reelService } from '../services/reel.service';
import { parsePaginationParams } from '../core/pagination/pagination';

export class ReelController {
  async getReels(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, offset } = parsePaginationParams(req.query);
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || 'none';
      const category = (req.query.category as string) || 'for_you';

      const reels = await reelService.getReels({
        currentUserId,
        category,
        limit,
        offset,
      });

      res.json(reels);
    } catch (error) {
      next(error);
    }
  }

  async createReel(req: Request, res: Response, next: NextFunction) {
    try {
      const reel = await reelService.createReel(req.body);
      res.status(201).json(reel);
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await reelService.toggleLike(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleSave(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await reelService.toggleSave(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || 'none';
      const comments = await reelService.getComments(id, currentUserId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || 'user_current', text } = req.body;
      const comment = await reelService.addComment(id, userId, text);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async recordWatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || 'user_current', watchDurationSecs = 0, progressPercent = 0 } = req.body;
      const result = await reelService.recordWatch(id, userId, watchDurationSecs, progressPercent);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || '';
      const history = await reelService.getHistory(currentUserId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  async clearHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id || (req.query.currentUserId as string);
      const result = await reelService.clearHistory(currentUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSuggested(req: Request, res: Response, next: NextFunction) {
    try {
      const reelId = req.query.reelId as string;
      const currentUserId = (req.query.currentUserId as string) || req.user?.id;
      const suggested = await reelService.getSuggested(reelId, currentUserId);
      res.json(suggested);
    } catch (error) {
      next(error);
    }
  }

  async toggleCommentLike(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId || req.params.id;
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await reelService.toggleCommentLike(commentId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const reelController = new ReelController();
