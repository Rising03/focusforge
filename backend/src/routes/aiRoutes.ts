import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Parse natural language input
router.post('/parse', aiController.parseInput);

// Generate AI response
router.post('/respond', aiController.generateResponse);

// AI coaching endpoint
router.post('/coach', aiController.generateCoaching);

// Get service status and usage
router.get('/status', aiController.getServiceStatus);

// Get fallback options for manual input
router.post('/fallback', aiController.getFallbackOptions);

export default router;