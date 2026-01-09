import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import {
  getAppointments,
  getAppointmentById,
  cancelAppointmentByProfessional,
  updateAppointmentStatus,
  getAppointmentsSummary
} from '../controllers/professional-appointments.controller';

const router = Router();

// ============================================
// PROFESSIONAL APPOINTMENTS ROUTES
// All routes require authentication and professional role
// ============================================

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['PROFESSIONAL']));

// GET /api/professional/appointments/summary - Get appointments summary for dashboard
router.get('/summary', getAppointmentsSummary);

// GET /api/professional/appointments - Get all appointments with filters
router.get('/', getAppointments);

// GET /api/professional/appointments/:id - Get single appointment details
router.get('/:id', getAppointmentById);

// PUT /api/professional/appointments/:id/status - Update appointment status
router.put('/:id/status', updateAppointmentStatus);

// POST /api/professional/appointments/:id/cancel - Cancel appointment
router.post('/:id/cancel', cancelAppointmentByProfessional);

export default router;
