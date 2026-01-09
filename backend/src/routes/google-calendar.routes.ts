import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import {
  getStatus,
  getConnectUrl,
  handleCallback,
  disconnect,
  syncCalendar,
  getExternalEvents
} from '../controllers/google-calendar.controller';

const router = Router();

// ============================================
// GOOGLE CALENDAR ROUTES
// All routes require professional authentication (except callback)
// ============================================

// OAuth callback - no auth required (called by Google)
router.get('/callback', handleCallback);

// Protected routes - require authentication
router.use(authenticateToken);
router.use(requireRole(['PROFESSIONAL']));

// GET /api/professional/google-calendar/status - Get connection status
router.get('/status', getStatus);

// GET /api/professional/google-calendar/connect - Get authorization URL
router.get('/connect', getConnectUrl);

// POST /api/professional/google-calendar/disconnect - Disconnect calendar
router.post('/disconnect', disconnect);

// POST /api/professional/google-calendar/sync - Manually trigger sync
router.post('/sync', syncCalendar);

// GET /api/professional/google-calendar/events - Get external events
router.get('/events', getExternalEvents);

export default router;
