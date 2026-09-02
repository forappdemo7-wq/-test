import { Request, Response, NextFunction } from 'express';
import { storyService } from '../services/story.service';

export class StoryController {
  async getStories(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || 'user_current';
      const stories = await storyService.getStoryGroups(currentUserId);
      res.json(stories);
    } catch (error) {
      next(error);
    }
  }

  async createStory(req: Request, res: Response, next: NextFunction) {
    try {
      const story = await storyService.createStory(req.body);
      res.status(201).json(story);
    } catch (error) {
      next(error);
    }
  }

  async recordView(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || 'user_current' } = req.body;
      const result = await storyService.recordView(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId = req.user?.id || 'user_current' } = req.body;
      const result = await storyService.toggleLike(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getViewers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const viewers = await storyService.getViewers(id);
      res.json(viewers);
    } catch (error) {
      next(error);
    }
  }

  async deleteStory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await storyService.deleteStory(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const archive = await storyService.getArchive(id);
      res.json(archive);
    } catch (error) {
      next(error);
    }
  }

  async getHighlights(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const highlights = await storyService.getHighlights(id);
      res.json(highlights);
    } catch (error) {
      next(error);
    }
  }
}

export const storyController = new StoryController();
