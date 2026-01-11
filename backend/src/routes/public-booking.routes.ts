import { Router } from 'express';
import {
  getBookingPageData,
  getAvailableSlots,
  holdSlot,
  releaseHold,
  cleanupHolds
} from '../controllers/public-booking.controller';
import { validateParams, validateQuery, validateBody, slugParamSchema } from '../middleware/validation.middleware';
import { getAvailableSlotsSchema, holdSlotSchema } from '../validators/booking.validator';

const router = Router();

// ============================================
// PUBLIC BOOKING ROUTES
// No authentication required - public endpoints
// WITH INPUT VALIDATION (Section 13.2 - Data Protection)
// ============================================

// GET /api/booking/:slug - Get booking page data by professional slug
router.get('/:slug',
  validateParams(slugParamSchema),
  getBookingPageData
);

// GET /api/booking/:slug/slots - Get available time slots for a specific date
// Query params: date (required), sessionId (optional - for hold awareness)
router.get('/:slug/slots',
  validateParams(slugParamSchema),
  validateQuery(getAvailableSlotsSchema),
  getAvailableSlots
);

// ============================================
// SLOT HOLD ROUTES (Requirement 10.1)
// Temporarily hold a slot while user fills booking form
// WITH INPUT VALIDATION (Section 13.2 - Data Protection)
// ============================================

// POST /api/booking/:slug/hold - Create temporary hold on a time slot
router.post('/:slug/hold',
  validateParams(slugParamSchema),
  validateBody(holdSlotSchema),
  holdSlot
);

// POST /api/booking/:slug/release - Release a slot hold
router.post('/:slug/release',
  validateParams(slugParamSchema),
  validateBody(holdSlotSchema),
  releaseHold
);

// POST /api/booking/cleanup-holds - Cleanup expired holds (for cron job)
// Note: Should be secured with API key or internal-only access in production
router.post('/cleanup-holds', cleanupHolds);

export default router;
