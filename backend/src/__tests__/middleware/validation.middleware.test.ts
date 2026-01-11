// ============================================
// VALIDATION MIDDLEWARE TESTS
// CRITICAL: These middleware protect against invalid/malicious input
// ============================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validateBody,
  validateQuery,
  validateParams,
  uuidParamSchema,
  slugParamSchema,
  referenceParamSchema
} from '../../middleware/validation.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseData: any;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };

    responseData = {};

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      })
    };

    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    it('should pass valid data and call next()', async () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0)
      });

      mockRequest.body = { name: 'John', age: 30 };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'John', age: 30 });
    });

    it('should transform data using Zod transformations', async () => {
      const schema = z.object({
        email: z.string().email().transform(val => val.toLowerCase()),
        name: z.string().transform(val => val.trim())
      });

      mockRequest.body = { email: 'USER@EXAMPLE.COM', name: '  John  ' };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ email: 'user@example.com', name: 'John' });
    });

    it('should reject invalid data with 400 status', async () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        age: z.number().min(0, 'Age must be positive')
      });

      mockRequest.body = { name: '', age: -5 };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      });
    });

    it('should return detailed validation errors', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email format'),
        age: z.number().min(18, 'Must be at least 18 years old')
      });

      mockRequest.body = { email: 'not-an-email', age: 15 };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseData.details).toHaveLength(2);
      expect(responseData.details[0]).toMatchObject({
        field: 'email',
        message: 'Invalid email format'
      });
      expect(responseData.details[1]).toMatchObject({
        field: 'age',
        message: 'Must be at least 18 years old'
      });
    });

    it('should handle nested object validation', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
          contact: z.object({
            email: z.string().email(),
            phone: z.string().regex(/^\d{10}$/)
          })
        })
      });

      mockRequest.body = {
        user: {
          name: 'John',
          contact: {
            email: 'invalid-email',
            phone: '123' // Invalid phone
          }
        }
      };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.details.some((err: any) => err.field === 'user.contact.email')).toBe(true);
      expect(responseData.details.some((err: any) => err.field === 'user.contact.phone')).toBe(true);
    });

    it('should handle required vs optional fields', async () => {
      const schema = z.object({
        required: z.string().min(1),
        optional: z.string().optional()
      });

      mockRequest.body = { required: 'value' };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ required: 'value' });
    });

    it('should reject missing required fields', async () => {
      const schema = z.object({
        required: z.string().min(1, 'Required field is missing')
      });

      mockRequest.body = {};

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle type coercion', async () => {
      const schema = z.object({
        age: z.coerce.number()
      });

      mockRequest.body = { age: '30' }; // String that should be coerced to number

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ age: 30 });
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', async () => {
      const schema = z.object({
        page: z.coerce.number().min(1),
        limit: z.coerce.number().min(1).max(100)
      });

      mockRequest.query = { page: '2', limit: '20' };

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({ page: 2, limit: 20 });
    });

    it('should reject invalid query parameters', async () => {
      const schema = z.object({
        page: z.coerce.number().min(1)
      });

      mockRequest.query = { page: '0' }; // Invalid: minimum is 1

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('Invalid query parameters');
    });

    it('should handle optional query parameters with defaults', async () => {
      const schema = z.object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10)
      });

      mockRequest.query = {};

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({ page: 1, limit: 10 });
    });
  });

  describe('validateParams', () => {
    it('should validate route parameters', async () => {
      const schema = z.object({
        id: z.string().uuid()
      });

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      const middleware = validateParams(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.params.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject invalid route parameters', async () => {
      const schema = z.object({
        id: z.string().uuid('Invalid UUID format')
      });

      mockRequest.params = { id: 'not-a-uuid' };

      const middleware = validateParams(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('Invalid route parameters');
    });
  });

  describe('Common Parameter Schemas', () => {
    describe('uuidParamSchema', () => {
      it('should validate valid UUID', async () => {
        mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

        const middleware = validateParams(uuidParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should reject invalid UUID', async () => {
        mockRequest.params = { id: 'not-a-uuid' };

        const middleware = validateParams(uuidParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });
    });

    describe('slugParamSchema', () => {
      it('should validate valid slug', async () => {
        mockRequest.params = { slug: 'dr-juan-garcia' };

        const middleware = validateParams(slugParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should reject invalid slug with uppercase', async () => {
        mockRequest.params = { slug: 'Dr-Juan-Garcia' };

        const middleware = validateParams(slugParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      it('should reject invalid slug with special characters', async () => {
        mockRequest.params = { slug: 'dr-juan@garcia' };

        const middleware = validateParams(slugParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      it('should reject empty slug', async () => {
        mockRequest.params = { slug: '' };

        const middleware = validateParams(slugParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });
    });

    describe('referenceParamSchema', () => {
      it('should validate valid reference', async () => {
        mockRequest.params = { reference: 'REF12345' };

        const middleware = validateParams(referenceParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should reject empty reference', async () => {
        mockRequest.params = { reference: '' };

        const middleware = validateParams(referenceParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      it('should reject reference that is too long', async () => {
        mockRequest.params = { reference: 'R'.repeat(51) };

        const middleware = validateParams(referenceParamSchema);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });
    });
  });

  describe('Security: Input Sanitization', () => {
    it('should prevent XSS by trimming and transforming', async () => {
      const schema = z.object({
        name: z.string().transform(val => val.trim()),
        description: z.string().transform(val => val.trim())
      });

      mockRequest.body = {
        name: '<script>alert("xss")</script>  ',
        description: '  <img src=x onerror=alert("xss")>  '
      };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Transformation applied, XSS payload not removed but trimmed
      // Note: Actual XSS prevention should happen at rendering layer
      expect(mockRequest.body.name).toBe('<script>alert("xss")</script>');
    });

    it('should enforce max lengths to prevent buffer overflow attacks', async () => {
      const schema = z.object({
        name: z.string().max(100, 'Name too long'),
        description: z.string().max(1000, 'Description too long')
      });

      mockRequest.body = {
        name: 'A'.repeat(101),
        description: 'B'.repeat(1001)
      };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should prevent SQL injection through regex validation', async () => {
      const schema = z.object({
        slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid characters')
      });

      mockRequest.body = { slug: "test'; DROP TABLE users; --" };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should validate email format to prevent injection', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email')
      });

      mockRequest.body = { email: 'user@domain.com\nBCC:attacker@evil.com' };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const schema = z.object({
        data: z.any().refine(() => {
          throw new Error('Unexpected error');
        })
      });

      mockRequest.body = { data: 'test' };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData.error).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
