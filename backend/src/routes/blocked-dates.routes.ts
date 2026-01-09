import { Router } from 'express';
import {
  getBlockedDates,
  addBlockedDate,
  removeBlockedDate,
  addBlockedDateRange
} from '../controllers/blocked-dates.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication and professional role
router.use(authenticateToken);
router.use(requireRole(['PROFESSIONAL']));

// GET /api/professional/blocked-dates - Get all blocked dates
router.get('/', getBlockedDates);

// POST /api/professional/blocked-dates - Add a single blocked date
router.post('/', addBlockedDate);

// POST /api/professional/blocked-dates/range - Add a range of blocked dates
router.post('/range', addBlockedDateRange);

// DELETE /api/professional/blocked-dates/:id - Remove a blocked date
router.delete('/:id', removeBlockedDate);

export default router;
