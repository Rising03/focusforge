import { Router } from 'express';
import { DataExportController } from '../controllers/dataExportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const dataExportController = new DataExportController();

// All data export routes require authentication
router.use(authenticateToken);

// Get export information and size estimates
router.get('/info', dataExportController.getExportInfo);

// Export user data
// Query parameters:
// - format: 'json' | 'csv' (default: 'json')
// - includePersonalData: 'true' | 'false' (default: 'true')
// - startDate: YYYY-MM-DD (optional)
// - endDate: YYYY-MM-DD (optional)
router.get('/export', dataExportController.exportUserData);

// GDPR compliance - request data deletion
router.post('/delete-request', dataExportController.requestDataDeletion);

export default router;