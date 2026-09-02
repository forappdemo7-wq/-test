import { Router } from 'express';
import { postController } from '../../controllers/post.controller';
import { validate } from '../../middleware/validate.middleware';
import { IdParamSchema, PaginationQuerySchema } from '../../validation/common.schema';
import { CreatePostSchema, CreateCommentSchema } from '../../validation/post.schema';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, validate({ query: PaginationQuerySchema }), postController.getPosts.bind(postController));

router.post('/', validate({ body: CreatePostSchema }), postController.createPost.bind(postController));

router.delete('/:id', validate({ params: IdParamSchema }), postController.deletePost.bind(postController));

router.post('/:id/like', validate({ params: IdParamSchema }), postController.toggleLike.bind(postController));

router.post('/:id/save', validate({ params: IdParamSchema }), postController.toggleSave.bind(postController));

router.post(
  '/:id/comments',
  validate({ params: IdParamSchema, body: CreateCommentSchema }),
  postController.addComment.bind(postController)
);

export const postRoutes = router;
