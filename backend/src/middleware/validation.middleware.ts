// ============================================
// INPUT VALIDATION MIDDLEWARE
// Section 13.2: Data Protection - Request validation
// ============================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Creates a validation middleware for request body
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse and validate the request body
      const validated = await schema.parseAsync(req.body);

      // Replace body with validated (and transformed) data
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      // Unexpected error
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Creates a validation middleware for query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: errors
        });
        return;
      }

      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Creates a validation middleware for route parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          success: false,
          error: 'Invalid route parameters',
          details: errors
        });
        return;
      }

      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

// Common parameter schemas
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
});

export const referenceParamSchema = z.object({
  reference: z
    .string()
    .min(1, 'Reference is required')
    .max(50, 'Reference too long')
});
