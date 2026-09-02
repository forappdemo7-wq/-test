import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';

export class MessageController {
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || 'user_current';
      const messages = await messageService.getMessagesGroupedByChat(currentUserId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const senderId = req.body.senderId || req.user?.id || 'user_current';
      const message = await messageService.sendMessage({
        ...req.body,
        senderId,
      });
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async markChatSeen(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.body.currentUserId || (req.query.currentUserId as string) || req.user?.id || 'user_current';
      const chatId = req.params.chatId || req.body.chatId;
      await messageService.markChatAsSeen(chatId, currentUserId);
      res.json({ success: true, chatId });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
