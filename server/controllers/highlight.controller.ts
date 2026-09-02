import { Request, Response, NextFunction } from 'express';
import { highlightService } from '../services/highlight.service';

export class HighlightController {
  async getUserHighlights(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id || (req.query.userId as string);
      const highlights = await highlightService.getUserHighlights(userId);
      res.json(highlights);
    } catch (error) {
      next(error);
    }
  }

  async createHighlight(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await highlightService.createHighlight(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  async addItemToHighlight(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await highlightService.addItemToHighlight(id, req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
}

export const highlightController = new HighlightController();
