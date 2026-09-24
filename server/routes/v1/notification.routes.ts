import { Router } from 'express';
import { notificationController } from '../../controllers/notification.controller';
import { validate } from '../../middleware/validate.middleware';
import { IdParamSchema, PaginationQuerySchema } from '../../validation/common.schema';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, validate({ query: PaginationQuerySchema }), notificationController.getNotifications.bind(notificationController));
router.post('/read', notificationController.markAllAsRead.bind(notificationController));
router.delete('/:id', validate({ params: IdParamSchema }), notificationController.deleteNotification.bind(notificationController));
router.patch('/:id/read', validate({ params: IdParamSchema }), notificationController.markAsRead.bind(notificationController));
router.post('/:id/reply', validate({ params: IdParamSchema }), notificationController.reply.bind(notificationController));
router.post('/simulate', notificationController.simulate.bind(notificationController));

export const notificationRoutes = router;
