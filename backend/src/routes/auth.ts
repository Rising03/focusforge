import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// Google OAuth routes
router.get('/google', authController.googleAuth.bind(authController));
router.get('/google/callback', authController.googleCallback.bind(authController));
router.post('/google/callback', authController.googleCallback.bind(authController));
router.post('/google/token', authController.googleTokenAuth.bind(authController));

// Protected routes
router.get('/me', authenticateToken, authController.me.bind(authController));

export default router;