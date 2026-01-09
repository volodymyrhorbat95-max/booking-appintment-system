import { Router } from 'express';
import {
  googleAuth,
  getProfessionalProfile
} from '../controllers/professional-auth.controller';
import { authenticateToken, requireProfessional } from '../middlewares/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { googleAuthSchema } from '../validators/auth.validator';

const router = Router();

// Public routes with input validation (Section 13.2 - Data Protection)
router.post('/google', validateBody(googleAuthSchema), googleAuth);

// Protected routes (requires professional role)
router.get('/profile', authenticateToken, requireProfessional, getProfessionalProfile);

export default router;
