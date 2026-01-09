import { Router } from 'express';
import {
  getDepositSettings,
  updateDepositSettings
} from '../controllers/deposit-settings.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication and professional role
router.use(authenticateToken);
router.use(requireRole(['PROFESSIONAL']));

// GET /api/professional/deposit-settings - Get deposit settings
router.get('/', getDepositSettings);

// PUT /api/professional/deposit-settings - Update deposit settings
router.put('/', updateDepositSettings);

export default router;
