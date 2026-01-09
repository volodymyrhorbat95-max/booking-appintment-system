import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import {
  getPlans,
  getMySubscription,
  createSubscriptionPayment,
  cancelMySubscription,
  changePlan
} from '../controllers/subscription.controller';

const router = Router();

// ============================================
// PUBLIC ROUTES (for viewing plans)
// ============================================

// Get all available subscription plans
router.get('/plans', getPlans);

// ============================================
// PROFESSIONAL ROUTES
// ============================================

// Get my current subscription
router.get(
  '/my-subscription',
  authenticateToken,
  requireRole(['PROFESSIONAL']),
  getMySubscription
);

// Create subscription payment (subscribe to a plan)
router.post(
  '/subscribe',
  authenticateToken,
  requireRole(['PROFESSIONAL']),
  createSubscriptionPayment
);

// Cancel my subscription
router.post(
  '/cancel',
  authenticateToken,
  requireRole(['PROFESSIONAL']),
  cancelMySubscription
);

// Change/upgrade plan
router.post(
  '/change-plan',
  authenticateToken,
  requireRole(['PROFESSIONAL']),
  changePlan
);

export default router;
