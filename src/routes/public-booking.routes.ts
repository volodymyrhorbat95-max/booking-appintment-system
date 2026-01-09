import { Router } from 'express';
import {
  getBookingPageData,
  getAvailableSlots,
  holdSlot,
  releaseHold,
  cleanupHolds
} from '../controllers/public-booking.controller';

const router = Router();

// ============================================
// PUBLIC BOOKING ROUTES
// No authentication required - public endpoints
// ============================================

// GET /api/booking/:slug - Get booking page data by professional slug
router.get('/:slug', getBookingPageData);

// GET /api/booking/:slug/slots - Get available time slots for a specific date
// Query params: date (required), sessionId (optional - for hold awareness)
router.get('/:slug/slots', getAvailableSlots);

// ============================================
// SLOT HOLD ROUTES (Requirement 10.1)
// Temporarily hold a slot while user fills booking form
// ============================================

// POST /api/booking/:slug/hold - Create temporary hold on a time slot
router.post('/:slug/hold', holdSlot);

// POST /api/booking/:slug/release - Release a slot hold
router.post('/:slug/release', releaseHold);

// POST /api/booking/cleanup-holds - Cleanup expired holds (for cron job)
router.post('/cleanup-holds', cleanupHolds);

export default router;
