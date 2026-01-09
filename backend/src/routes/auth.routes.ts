import { Router } from 'express';
import {
  adminLogin,
  logout,
  getCurrentUser,
  createAdminUser
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { adminLoginSchema, adminSetupSchema } from '../validators/auth.validator';

const router = Router();

// Public routes with input validation (Section 13.2 - Data Protection)
router.post('/admin/login', validateBody(adminLoginSchema), adminLogin);
router.post('/admin/setup', validateBody(adminSetupSchema), createAdminUser); // One-time setup

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
