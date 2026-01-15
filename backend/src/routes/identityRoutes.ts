import { Router } from 'express';
import { IdentityController } from '../controllers/identityController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const identityController = new IdentityController();

// All identity routes require authentication
router.use(authenticateToken);

// Identity alignment tracking
router.get('/alignment', identityController.calculateIdentityAlignment.bind(identityController));

// Task acknowledgment
router.post('/acknowledge-task', identityController.acknowledgeTask.bind(identityController));

// Activity suggestions
router.get('/suggest-activities', identityController.suggestActivities.bind(identityController));
router.get('/activity-suggestions', identityController.suggestActivities.bind(identityController));

// Environment assessment and management
router.post('/assess-environment', identityController.assessEnvironment.bind(identityController));
router.post('/report-distraction', identityController.reportDistraction.bind(identityController));

// Environment productivity correlations
router.get('/environment-correlations', identityController.getEnvironmentCorrelations.bind(identityController));
router.post('/track-environment-correlation', identityController.trackEnvironmentCorrelation.bind(identityController));

export default router;