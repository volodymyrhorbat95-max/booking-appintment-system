// ============================================
// AUTH MIDDLEWARE TESTS
// CRITICAL: Authentication and authorization enforcement
// This middleware protects ALL authenticated endpoints
// ============================================

import { Request, Response, NextFunction } from 'express';
import {
  authenticateToken,
  requireAdmin,
  requireProfessional,
  requireAdminOrProfessional,
  requireRole
} from '../../middlewares/auth.middleware';
import { UserRole } from '../../types';
import * as jwtUtils from '../../utils/jwt';

// Mock JWT utilities
jest.mock('../../utils/jwt');
const mockVerifyToken = jwtUtils.verifyToken as jest.MockedFunction<typeof jwtUtils.verifyToken>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseData: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      headers: {},
      userId: undefined,
      userEmail: undefined,
      userRole: undefined,
      user: undefined
    };

    // Setup mock response
    responseData = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      })
    };

    // Setup mock next
    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and populate user data', () => {
      const mockPayload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token_here'
      };

      mockVerifyToken.mockReturnValue(mockPayload);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVerifyToken).toHaveBeenCalledWith('valid_token_here');
      expect(mockRequest.userId).toBe('user_123');
      expect(mockRequest.userEmail).toBe('test@example.com');
      expect(mockRequest.userRole).toBe(UserRole.ADMIN);
      expect(mockRequest.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      mockRequest.headers = {}; // No authorization header

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Access token required'
      });
    });

    it('should reject request with malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token_here'
      };

      mockVerifyToken.mockReturnValue(null); // Invalid token

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData.error).toBe('Invalid or expired token');
    });

    it('should reject request with Bearer but no token', () => {
      mockRequest.headers = {
        authorization: 'Bearer ' // Bearer with trailing space but no token
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should reject invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };

      mockVerifyToken.mockReturnValue(null); // Token verification failed

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVerifyToken).toHaveBeenCalledWith('invalid_token');
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Invalid or expired token'
      });
    });

    it('should reject expired token', () => {
      mockRequest.headers = {
        authorization: 'Bearer expired_token'
      };

      mockVerifyToken.mockReturnValue(null); // Expired token returns null

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData.error).toBe('Invalid or expired token');
    });

    it('should handle professional role correctly', () => {
      const mockPayload = {
        userId: 'prof_456',
        email: 'professional@example.com',
        role: UserRole.PROFESSIONAL
      };

      mockRequest.headers = {
        authorization: 'Bearer prof_token'
      };

      mockVerifyToken.mockReturnValue(mockPayload);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.userRole).toBe(UserRole.PROFESSIONAL);
      expect(mockRequest.user?.role).toBe(UserRole.PROFESSIONAL);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different email formats correctly', () => {
      const mockPayload = {
        userId: 'prof_789',
        email: 'professional+test@example.com',
        role: UserRole.PROFESSIONAL
      };

      mockRequest.headers = {
        authorization: 'Bearer prof_token'
      };

      mockVerifyToken.mockReturnValue(mockPayload);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.userEmail).toBe('professional+test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', () => {
      mockRequest.userRole = UserRole.ADMIN;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject professional user', () => {
      mockRequest.userRole = UserRole.PROFESSIONAL;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Admin access required'
      });
    });

    it('should reject professional user trying to access admin endpoint', () => {
      mockRequest.userRole = UserRole.PROFESSIONAL;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData.error).toBe('Admin access required');
    });

    it('should reject unauthenticated request', () => {
      mockRequest.userRole = undefined;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireProfessional', () => {
    it('should allow professional user', () => {
      mockRequest.userRole = UserRole.PROFESSIONAL;

      requireProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject admin user', () => {
      mockRequest.userRole = UserRole.ADMIN;

      requireProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Professional access required'
      });
    });

    it('should reject admin user trying to access professional-only endpoint', () => {
      mockRequest.userRole = UserRole.ADMIN;

      requireProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should reject unauthenticated request', () => {
      mockRequest.userRole = undefined;

      requireProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireAdminOrProfessional', () => {
    it('should allow admin user', () => {
      mockRequest.userRole = UserRole.ADMIN;

      requireAdminOrProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow professional user', () => {
      mockRequest.userRole = UserRole.PROFESSIONAL;

      requireAdminOrProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid role', () => {
      // Simulate an invalid or corrupted role
      (mockRequest as any).userRole = 'INVALID_ROLE';

      requireAdminOrProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Authentication required'
      });
    });

    it('should reject unauthenticated request', () => {
      mockRequest.userRole = undefined;

      requireAdminOrProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireRole', () => {
    it('should allow user with matching role', () => {
      mockRequest.userRole = UserRole.ADMIN;

      const middleware = requireRole([UserRole.ADMIN, UserRole.PROFESSIONAL]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow user with one of multiple allowed roles', () => {
      mockRequest.userRole = UserRole.PROFESSIONAL;

      const middleware = requireRole([UserRole.ADMIN, UserRole.PROFESSIONAL]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user with non-matching role', () => {
      // Simulate an invalid or different role
      (mockRequest as any).userRole = 'SOME_OTHER_ROLE';

      const middleware = requireRole([UserRole.ADMIN, UserRole.PROFESSIONAL]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Access denied'
      });
    });

    it('should reject unauthenticated request', () => {
      mockRequest.userRole = undefined;

      const middleware = requireRole([UserRole.ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should work with single role', () => {
      mockRequest.userRole = UserRole.ADMIN;

      const middleware = requireRole([UserRole.ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should work with both valid roles', () => {
      mockRequest.userRole = UserRole.PROFESSIONAL;

      const middleware = requireRole([UserRole.ADMIN, UserRole.PROFESSIONAL]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security: Privilege Escalation Prevention', () => {
    it('should prevent professional from accessing admin-only endpoints', () => {
      // Simulate professional with valid token trying to access admin endpoint
      mockRequest.userRole = UserRole.PROFESSIONAL;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData.error).toBe('Admin access required');
    });

    it('should prevent admin from accessing professional-only endpoints', () => {
      mockRequest.userRole = UserRole.ADMIN;

      requireProfessional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should prevent token replay attacks with expired token', () => {
      mockRequest.headers = {
        authorization: 'Bearer old_token_from_yesterday'
      };

      // Expired token returns null from verifyToken
      mockVerifyToken.mockReturnValue(null);

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData.error).toBe('Invalid or expired token');
    });

    it('should prevent unauthenticated access to protected routes', () => {
      // No authorization header
      mockRequest.headers = {};

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Integration: Middleware Chaining', () => {
    it('should work correctly when chained (authenticateToken -> requireAdmin)', () => {
      const mockPayload = {
        userId: 'admin_123',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      };

      mockRequest.headers = {
        authorization: 'Bearer admin_token'
      };

      mockVerifyToken.mockReturnValue(mockPayload);

      // First middleware: authenticateToken
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.userRole).toBe(UserRole.ADMIN);

      // Reset mock for second middleware
      jest.clearAllMocks();

      // Second middleware: requireAdmin
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block chain if authentication fails', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };

      mockVerifyToken.mockReturnValue(null);

      // First middleware: authenticateToken
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);

      // Second middleware should not be reached
      jest.clearAllMocks();

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      // userRole is still undefined from failed auth
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should block chain if authorization fails', () => {
      const mockPayload = {
        userId: 'prof_123',
        email: 'professional@example.com',
        role: UserRole.PROFESSIONAL // Professional user, not admin
      };

      mockRequest.headers = {
        authorization: 'Bearer prof_token'
      };

      mockVerifyToken.mockReturnValue(mockPayload);

      // First middleware: authenticateToken (succeeds)
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.userRole).toBe(UserRole.PROFESSIONAL);

      // Reset mock for second middleware
      jest.clearAllMocks();

      // Second middleware: requireAdmin (fails - professional is not admin)
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData.error).toBe('Admin access required');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'some_token_without_bearer'
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Will fail because split(' ')[1] will be undefined
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle empty authorization header', () => {
      mockRequest.headers = {
        authorization: ''
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle whitespace in authorization header', () => {
      mockRequest.headers = {
        authorization: '   '
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle case-sensitive Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'bearer lowercase_bearer_token' // lowercase 'bearer'
      };

      mockVerifyToken.mockReturnValue(null); // Token will be extracted and fail verification

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Token is extracted (lowercase_bearer_token) but fails verification
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseData.error).toBe('Invalid or expired token');
    });
  });
});
