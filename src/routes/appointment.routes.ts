import { Router } from 'express';
import {
  createAppointment,
  getAppointmentByReference,
  cancelAppointment,
  createDepositPayment
} from '../controllers/appointment.controller';
import { validateBody, validateParams, slugParamSchema, referenceParamSchema } from '../middleware/validation.middleware';
import { createBookingSchema, cancelBookingSchema } from '../validators/booking.validator';

const router = Router();

// ============================================
// PUBLIC APPOINTMENT ROUTES
// No authentication required - public endpoints
// With input validation (Section 13.2 - Data Protection)
// ============================================

// POST /api/appointments/:slug - Create new appointment (public)
router.post('/:slug', validateParams(slugParamSchema), validateBody(createBookingSchema), createAppointment);

// GET /api/appointments/reference/:reference - Get appointment by booking reference
router.get('/reference/:reference', validateParams(referenceParamSchema), getAppointmentByReference);

// POST /api/appointments/cancel/:reference - Cancel appointment by patient
router.post('/cancel/:reference', validateParams(referenceParamSchema), validateBody(cancelBookingSchema), cancelAppointment);

// POST /api/appointments/deposit/:reference - Create deposit payment preference
router.post('/deposit/:reference', validateParams(referenceParamSchema), createDepositPayment);

export default router;
