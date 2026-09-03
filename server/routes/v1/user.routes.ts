import { Router } from 'express';
import { userController } from '../../controllers/user.controller';
import { highlightController } from '../../controllers/highlight.controller';
import { validate } from '../../middleware/validate.middleware';
import { IdParamSchema, SearchQuerySchema } from '../../validation/common.schema';
import { UpdateProfileSchema, FollowToggleSchema } from '../../validation/auth.schema';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, userController.getAllUsers.bind(userController));
router.get('/search', validate({ query: SearchQuerySchema }), userController.search.bind(userController));
router.get('/requests/pending', optionalAuth, userController.getPendingRequests.bind(userController));
router.post('/requests/:requesterId/accept', optionalAuth, userController.acceptRequest.bind(userController));
router.post('/requests/:requesterId/decline', optionalAuth, userController.declineRequest.bind(userController));

router.get(
  '/:id',
  optionalAuth,
  validate({ params: IdParamSchema }),
  userController.getProfile.bind(userController)
);

router.get('/:id/followers', optionalAuth, userController.getFollowers.bind(userController));
router.get('/:id/following', optionalAuth, userController.getFollowing.bind(userController));
router.get('/:id/highlights', highlightController.getUserHighlights.bind(highlightController));

router.post('/:id/block', optionalAuth, userController.blockUser.bind(userController));
router.post('/:id/unblock', optionalAuth, userController.unblockUser.bind(userController));

router.put(
  '/:id',
  validate({ params: IdParamSchema, body: UpdateProfileSchema }),
  userController.updateProfile.bind(userController)
);

router.post(
  '/:id/follow',
  validate({ params: IdParamSchema, body: FollowToggleSchema }),
  userController.toggleFollow.bind(userController)
);

export const userRoutes = router;

