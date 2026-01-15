import express from 'express';
import { ReviewCycleController } from '../controllers/reviewCycleController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const reviewCycleController = new ReviewCycleController();

// Weekly Review Routes
router.post('/weekly', authenticateToken, (req, res) => 
  reviewCycleController.createWeeklyReview(req, res)
);

router.get('/weekly/history', authenticateToken, (req, res) => 
  reviewCycleController.getWeeklyReviewHistory(req, res)
);

// Monthly Review Routes
router.post('/monthly', authenticateToken, (req, res) => 
  reviewCycleController.createMonthlyReview(req, res)
);

router.get('/monthly/history', authenticateToken, (req, res) => 
  reviewCycleController.getMonthlyReviewHistory(req, res)
);

// Long-term Analysis Routes
router.get('/patterns', authenticateToken, (req, res) => 
  reviewCycleController.identifyLongTermPatterns(req, res)
);

router.get('/adjustments', authenticateToken, (req, res) => 
  reviewCycleController.generateSystematicAdjustmentSuggestions(req, res)
);

router.post('/systematic-adjustments', authenticateToken, (req, res) => 
  reviewCycleController.generateSystematicAdjustmentSuggestions(req, res)
);

router.get('/habit-evolution', authenticateToken, (req, res) => 
  reviewCycleController.trackHabitEvolution(req, res)
);

export default router;