import { Router } from 'express';
import {
  getFormFields,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
  getPublicFormFields
} from '../controllers/custom-form-fields.controller';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public route - get form fields for booking page (by slug)
router.get('/public/:slug', getPublicFormFields);

// Protected routes - require authentication and professional role
router.use(authenticateToken);
router.use(requireRole(['PROFESSIONAL']));

// GET /api/professional/form-fields - Get all form fields (fixed + custom)
router.get('/', getFormFields);

// POST /api/professional/form-fields - Add a custom field
router.post('/', addCustomField);

// PUT /api/professional/form-fields/:id - Update a custom field
router.put('/:id', updateCustomField);

// DELETE /api/professional/form-fields/:id - Delete a custom field
router.delete('/:id', deleteCustomField);

// PUT /api/professional/form-fields/reorder - Reorder custom fields
router.put('/reorder/batch', reorderCustomFields);

export default router;
