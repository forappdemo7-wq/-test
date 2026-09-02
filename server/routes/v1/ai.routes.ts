import { Router } from 'express';
import { aiController } from '../../controllers/ai.controller';
import { rateLimiter } from '../../middleware/rate-limiter.middleware';

const router = Router();

router.post('/generate-caption', rateLimiter({ max: 40 }), aiController.generateCaption.bind(aiController));
router.post('/suggest-comments', rateLimiter({ max: 40 }), aiController.suggestComments.bind(aiController));
router.post('/chat-reply', rateLimiter({ max: 40 }), aiController.chatReply.bind(aiController));
router.post('/explore-recommendations', rateLimiter({ max: 40 }), aiController.exploreRecommendations.bind(aiController));
router.post('/smart-search', rateLimiter({ max: 60 }), aiController.smartSearch.bind(aiController));

export const aiRoutes = router;
