import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const analyticsController = new AnalyticsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Dashboard analytics routes
router.get('/dashboard', analyticsController.getDashboardAnalytics);
router.get('/dashboard/summary', analyticsController.getDashboardSummary);

// Missing routes from integration tests
router.get('/patterns', analyticsController.getProductivityPatterns);
router.get('/current-state', analyticsController.getDashboardSummary);

// Core metrics routes
router.get('/consistency', analyticsController.getConsistencyScore);
router.get('/identity-alignment', analyticsController.getIdentityAlignment);
router.get('/productivity-patterns', analyticsController.getProductivityPatterns);
router.get('/deep-work-trend', analyticsController.getDeepWorkTrend);

// Insights and analysis routes
router.get('/behavioral-insights', analyticsController.getBehavioralInsights);
router.get('/personalization-metrics', analyticsController.getPersonalizationMetrics);
router.get('/performance-analysis', analyticsController.getPerformanceAnalysis);

// Habit analytics routes
router.get('/habit-streaks', analyticsController.getHabitStreaksAnalytics);

export default router;