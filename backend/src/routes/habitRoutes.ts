import { Router } from 'express';
import { HabitController } from '../controllers/habitController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const habitController = new HabitController();

// All routes require authentication
router.use(authenticateToken);

// Habit CRUD operations
router.post('/', habitController.createHabit);
router.get('/', habitController.getUserHabits);
router.patch('/:habitId', habitController.updateHabit);
router.delete('/:habitId', habitController.deleteHabit);

// Habit completion logging
router.post('/completions', habitController.logHabitCompletion);
router.post('/:habitId/complete', habitController.logHabitCompletion);

// Today's habits (convenience endpoint)
router.get('/today', habitController.getTodayHabits);

// Habit analytics and insights
router.get('/streaks', habitController.getHabitStreaks);
router.get('/consistency', habitController.getConsistencyScore);
router.get('/analytics', habitController.getHabitAnalytics);

// Habit stacking suggestions
router.get('/stack-suggestions', habitController.getHabitStackSuggestions);

export default router;