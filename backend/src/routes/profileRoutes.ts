import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { BehavioralAnalyticsController } from '../controllers/behavioralAnalyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const profileController = new ProfileController();
const behavioralAnalyticsController = new BehavioralAnalyticsController();

// All profile routes require authentication
router.use(authenticateToken);

// Profile CRUD operations
router.post('/', profileController.createProfile.bind(profileController));
router.get('/', profileController.getProfile.bind(profileController));
router.put('/', profileController.updateProfile.bind(profileController));
router.delete('/', profileController.deleteProfile.bind(profileController));

// Detailed profile management
router.put('/detailed', profileController.updateDetailedProfile.bind(profileController));

// Behavioral analytics
router.post('/analytics/track', profileController.trackBehavioralEvent.bind(profileController));
router.get('/analytics', profileController.getBehavioralAnalytics.bind(profileController));

// Personalization insights
router.get('/personalization-insights', behavioralAnalyticsController.getPersonalizationInsights);

// Behavioral patterns
router.put('/behavioral-patterns', behavioralAnalyticsController.updateBehavioralPatterns);

export default router;