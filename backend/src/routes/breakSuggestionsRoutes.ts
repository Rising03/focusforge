import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { suggestBreakActivities } from '../controllers/breakSuggestionsController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Break suggestion routes
router.post('/suggest', suggestBreakActivities);

export default router;