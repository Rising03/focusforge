import { Router } from 'express';
import { EveningReviewController } from '../controllers/eveningReviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const eveningReviewController = new EveningReviewController();

// All routes require authentication
router.use(authenticateToken);

// Create a new evening review
router.post('/', eveningReviewController.createEveningReview);

// Get today's evening review (convenience endpoint)
router.get('/today', eveningReviewController.getTodayReview);

// Get evening review by specific date
router.get('/date/:date', eveningReviewController.getReviewByDate);

// Update an existing evening review
router.patch('/:reviewId', eveningReviewController.updateEveningReview);

// Delete an evening review
router.delete('/:reviewId', eveningReviewController.deleteEveningReview);

// Get evening review history with analytics
router.get('/history', eveningReviewController.getReviewHistory);

// Get review analytics only
router.get('/analytics', eveningReviewController.getReviewAnalytics);

// Get review prompts and suggestions
router.get('/prompts', eveningReviewController.getReviewPrompts);

export default router;