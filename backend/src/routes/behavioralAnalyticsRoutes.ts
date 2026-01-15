import { Router } from 'express';
import { BehavioralAnalyticsController } from '../controllers/behavioralAnalyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const behavioralAnalyticsController = new BehavioralAnalyticsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Batch track behavioral events
router.post('/', behavioralAnalyticsController.trackEvents);

// Track single behavioral event
router.post('/event', behavioralAnalyticsController.trackEvent);

// Get behavioral analytics data
router.get('/', behavioralAnalyticsController.getAnalytics);

// Get personalization insights
router.get('/personalization-insights', behavioralAnalyticsController.getPersonalizationInsights);

// Update behavioral patterns
router.put('/behavioral-patterns', behavioralAnalyticsController.updateBehavioralPatterns);

// Get interaction patterns analysis
router.get('/interaction-patterns', behavioralAnalyticsController.getInteractionPatterns);

// Get temporal productivity patterns
router.get('/temporal-patterns', behavioralAnalyticsController.getTemporalPatterns);

export default router;