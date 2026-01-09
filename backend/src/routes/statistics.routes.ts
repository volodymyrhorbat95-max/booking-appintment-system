import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { getMyStatistics } from '../controllers/statistics.controller';

const router = Router();

// Get my statistics (professional only)
router.get(
  '/',
  authenticateToken,
  requireRole(['PROFESSIONAL']),
  getMyStatistics
);

export default router;
