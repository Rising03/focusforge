import { Router } from 'express';
import { 
  analyzeEnergyPatterns,
  scheduleDeepWork,
  startDeepWorkSession,
  completeDeepWorkSession,
  getOptimalTimeSlots,
  recordWorkQualityAssessment,
  createAttentionTrainingSession,
  getAttentionMetrics,
  getDeepWorkAnalytics,
  getUserDeepWorkSessions
} from '../controllers/deepWorkController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Energy pattern analysis
router.get('/energy-patterns', analyzeEnergyPatterns);
router.get('/optimal-slots', getOptimalTimeSlots);

// Deep work session management
router.post('/schedule', scheduleDeepWork);
router.post('/:sessionId/start', startDeepWorkSession);
router.patch('/start', startDeepWorkSession);
router.patch('/complete', completeDeepWorkSession);
router.get('/sessions', getUserDeepWorkSessions);

// Work quality assessment
router.post('/quality-assessment', recordWorkQualityAssessment);

// Attention training
router.post('/attention-training', createAttentionTrainingSession);
router.get('/attention-metrics', getAttentionMetrics);

// Analytics and insights
router.get('/analytics', getDeepWorkAnalytics);

export default router;