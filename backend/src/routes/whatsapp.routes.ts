import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import {
  getReminders,
  updateReminders,
  getTemplates,
  updateTemplate,
  resetTemplate,
  sendTestMessage
} from '../controllers/whatsapp.controller';

const router = Router();

// All routes require professional authentication
router.use(authenticateToken);
router.use(requireRole(['PROFESSIONAL']));

// Reminder settings
router.get('/reminders', getReminders);
router.put('/reminders', updateReminders);

// Message templates
router.get('/templates', getTemplates);
router.put('/templates/:type', updateTemplate);
router.delete('/templates/:type', resetTemplate);

// Test endpoint (development only)
router.post('/test', sendTestMessage);

export default router;
