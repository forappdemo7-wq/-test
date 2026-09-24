import { highlightRepository } from '../repositories/highlight.repository';
import { BadRequestError, NotFoundError } from '../core/errors/app-error';

export class HighlightService {
  async getUserHighlights(userId: string) {
    if (!userId) throw new BadRequestError('User ID is required');
    return highlightRepository.getUserHighlights(userId);
  }

  async createHighlight(data: { userId: string; title: string; coverUrl: string; items?: any[] }) {
    if (!data.userId || !data.title || !data.coverUrl) {
      throw new BadRequestError('User ID, title, and cover URL are required');
    }
    return highlightRepository.createHighlight(data.userId, data.title, data.coverUrl, data.items || []);
  }

  async addItemToHighlight(highlightId: string, item: any) {
    if (!highlightId || !item || !item.mediaUrl) {
      throw new BadRequestError('Highlight ID and item media URL are required');
    }
    return highlightRepository.addItemToHighlight(highlightId, item);
  }
}

export const highlightService = new HighlightService();
