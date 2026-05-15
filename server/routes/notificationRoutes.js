import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllRead } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markNotificationRead);

export default router;
