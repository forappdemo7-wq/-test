import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { parsePaginationParams } from '../core/pagination/pagination';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, offset } = parsePaginationParams(req.query);
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || 'user_current';
      const notifications = await notificationService.getNotifications(currentUserId, limit, offset);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.body.currentUserId || req.user?.id || 'user_current';
      const result = await notificationService.markAllAsRead(currentUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isRead = true } = req.body;
      const result = await notificationService.markAsRead(id, isRead);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await notificationService.deleteNotification(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async reply(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { currentUserId = req.user?.id || 'user_current', text, postId } = req.body;
      const result = await notificationService.replyToNotification(id, currentUserId, text, postId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async simulate(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentUserId = req.user?.id || 'user_current', type = 'like' } = req.body;
      const notif = await notificationService.simulateNotification(currentUserId, type);
      res.status(201).json(notif);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
