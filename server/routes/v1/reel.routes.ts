import { Router } from 'express';
import { reelController } from '../../controllers/reel.controller';
import { validate } from '../../middleware/validate.middleware';
import { IdParamSchema, PaginationQuerySchema } from '../../validation/common.schema';
import { CreateReelSchema, CreateReelCommentSchema, RecordWatchHistorySchema } from '../../validation/reel.schema';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, validate({ query: PaginationQuerySchema }), reelController.getReels.bind(reelController));
router.get('/suggested', optionalAuth, reelController.getSuggested.bind(reelController));
router.post('/', validate({ body: CreateReelSchema }), reelController.createReel.bind(reelController));
router.get('/history', optionalAuth, reelController.getHistory.bind(reelController));
router.post('/history', optionalAuth, reelController.clearHistory.bind(reelController));
router.delete('/history', optionalAuth, reelController.clearHistory.bind(reelController));
router.post('/comments/:commentId/like', optionalAuth, reelController.toggleCommentLike.bind(reelController));
router.post('/:id/like', validate({ params: IdParamSchema }), reelController.toggleLike.bind(reelController));
router.post('/:id/save', validate({ params: IdParamSchema }), reelController.toggleSave.bind(reelController));
router.get('/:id/comments', validate({ params: IdParamSchema }), reelController.getComments.bind(reelController));
router.post(
  '/:id/comments',
  validate({ params: IdParamSchema, body: CreateReelCommentSchema }),
  reelController.addComment.bind(reelController)
);
router.post(
  '/:id/watch',
  validate({ params: IdParamSchema, body: RecordWatchHistorySchema }),
  reelController.recordWatch.bind(reelController)
);

export const reelRoutes = router;
