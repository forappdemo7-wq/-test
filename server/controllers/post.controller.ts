import { Request, Response, NextFunction } from 'express';
import { postService } from '../services/post.service';
import { parsePaginationParams } from '../core/pagination/pagination';

export class PostController {
  async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, offset } = parsePaginationParams(req.query);
      const currentUserId = (req.query.currentUserId as string) || req.user?.id || '';
      const posts = await postService.getPosts(currentUserId, limit, offset);
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await postService.deletePost(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = req.params.id;
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await postService.toggleLike(postId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleSave(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = req.params.id;
      const userId = req.body.userId || req.user?.id || 'user_current';
      const result = await postService.toggleSave(postId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = req.params.id;
      const { userId = req.user?.id || 'user_current', text } = req.body;
      const comment = await postService.addComment(postId, userId, text);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async approveComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const result = await postService.approveComment(commentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: postId, commentId } = req.params;
      const result = await postService.deleteComment(commentId, postId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const postController = new PostController();
