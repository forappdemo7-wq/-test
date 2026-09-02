import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';

export class AIController {
  async generateCaption(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic, tone = 'aesthetic', keywords = '', style = 'trendy' } = req.body;
      const result = await aiService.generateCaption(topic, tone, keywords, style);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async suggestComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { postCaption = '', postTopic = '' } = req.body;
      const result = await aiService.suggestComments(postCaption, postTopic);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async chatReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { contactName, contactBio, messageHistory, userMessage } = req.body;
      const result = await aiService.generateChatReply(contactName, contactBio, messageHistory, userMessage);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async exploreRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const { userInterests = [], recentTags = [], activeCategory = 'For You' } = req.body;
      const result = await aiService.generateExploreRecommendations(userInterests, recentTags, activeCategory);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async smartSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { query: searchQuery = '' } = req.body;
      const result = await aiService.smartSearch(searchQuery);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
