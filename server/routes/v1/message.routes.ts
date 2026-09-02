import { Router } from 'express';
import { messageController } from '../../controllers/message.controller';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, messageController.getMessages.bind(messageController));
router.post('/', messageController.sendMessage.bind(messageController));
router.post('/seen', messageController.markChatSeen.bind(messageController));
router.patch('/:chatId/seen', messageController.markChatSeen.bind(messageController));

export const messageRoutes = router;
