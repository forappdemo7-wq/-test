import { Router } from 'express';
import { highlightController } from '../../controllers/highlight.controller';

const router = Router();

router.post('/', highlightController.createHighlight.bind(highlightController));
router.post('/:id/add', highlightController.addItemToHighlight.bind(highlightController));

export const highlightRoutes = router;
