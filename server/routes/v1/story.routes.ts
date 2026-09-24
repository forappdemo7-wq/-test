import { Router } from 'express';
import { storyController } from '../../controllers/story.controller';
import { validate } from '../../middleware/validate.middleware';
import { IdParamSchema } from '../../validation/common.schema';
import { CreateStorySchema, VotePollSchema, SubmitQuestionSchema } from '../../validation/story.schema';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, storyController.getStories.bind(storyController));
router.post('/', validate({ body: CreateStorySchema }), storyController.createStory.bind(storyController));
router.post('/:id/view', validate({ params: IdParamSchema }), storyController.recordView.bind(storyController));
router.post('/:id/like', validate({ params: IdParamSchema }), storyController.toggleLike.bind(storyController));
router.post('/:id/poll-vote', validate({ params: IdParamSchema, body: VotePollSchema }), storyController.votePoll.bind(storyController));
router.post('/:id/question-response', validate({ params: IdParamSchema, body: SubmitQuestionSchema }), storyController.submitQuestionResponse.bind(storyController));
router.get('/:id/viewers', validate({ params: IdParamSchema }), storyController.getViewers.bind(storyController));
router.delete('/:id', validate({ params: IdParamSchema }), storyController.deleteStory.bind(storyController));

export const storyRoutes = router;
