import { Router } from 'express';
import { RoutineController } from '../controllers/routineController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const routineController = new RoutineController();

// All routes require authentication
router.use(authenticateToken);

// Generate or get daily routine
router.post('/generate', routineController.generateDailyRoutine);

// Get today's routine (convenience endpoint)
router.get('/today', routineController.getTodayRoutine);

// Get routine by specific date
router.get('/date/:date', routineController.getRoutineByDate);

// Update routine segment (mark completed, add notes, etc.)
router.patch('/:routineId/segments', routineController.updateRoutineSegment);

// Get routine history
router.get('/history', routineController.getRoutineHistory);

// Get personalized recommendations
router.get('/recommendations', routineController.getPersonalizedRecommendations);

// Track routine performance for adaptive learning
router.post('/:routineId/performance', routineController.trackPerformance);

// ============ V3 New Endpoints ============
// Note: V3 endpoints temporarily disabled due to TypeScript compilation issues
// The methods exist in the controller but TypeScript can't resolve them
// TODO: Debug TypeScript module resolution issue

// // Generate routine from natural language request
// router.post('/natural-language', routineController.generateFromNaturalLanguage);

// // Adapt routine mid-day (regenerate remaining time)
// router.post('/:routineId/adapt', routineController.adaptRoutineMidDay);

// // Compare routine variations
// router.post('/compare', routineController.compareRoutineVariations);

export default router;