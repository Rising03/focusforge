import { Router } from 'express';
import { ActivityController } from '../controllers/activityController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const activityController = new ActivityController();

// All routes require authentication
router.use(authenticateToken);

// Activity session management
router.post('/start', activityController.startActivity);
router.patch('/:sessionId/stop', activityController.stopActivity);
router.post('/log', activityController.logActivity);

// Get current active session
router.get('/active', activityController.getActiveSession);

// Time utilization and stats
router.get('/utilization/today', activityController.getTodayUtilization);
router.get('/utilization/:date', activityController.getTimeUtilization);
router.get('/stats/:date', activityController.getDailyStats);

// Activity history with filtering and pagination
router.get('/history', activityController.getActivityHistory);

export default router;