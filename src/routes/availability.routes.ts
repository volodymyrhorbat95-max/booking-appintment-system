import { Router } from 'express';
import { getAvailability, saveAvailability, deleteAvailabilitySlot } from '../controllers/availability.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication and professional role
router.use(authenticateToken);
router.use(requireRole(['PROFESSIONAL']));

// GET /api/professional/availability - Get availability settings
router.get('/', getAvailability);

// POST /api/professional/availability - Save availability settings
router.post('/', saveAvailability);

// DELETE /api/professional/availability/:dayOfWeek/:slotNumber - Delete specific slot
router.delete('/:dayOfWeek/:slotNumber', deleteAvailabilitySlot);

export default router;
