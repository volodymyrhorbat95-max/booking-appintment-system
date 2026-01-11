import type { Request, Response } from 'express';
import {
  adminLogin,
  logout,
  getCurrentUser,
  createAdminUser
} from '../../controllers/auth.controller';
import prisma from '../../config/database';
import * as passwordUtils from '../../utils/password';
import * as jwtUtils from '../../utils/jwt';
import { UserRole } from '../../types';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}));

jest.mock('../../utils/password');
jest.mock('../../utils/jwt');
jest.mock('../../utils/logger');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      userId: undefined
    };

    responseData = null;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      })
    };
  });

  describe('adminLogin', () => {
    it('should login admin user with valid credentials', async () => {
      const mockAdmin = {
        id: 'admin_123',
        email: 'admin@agendux.com',
        password: '$2b$12$hashedpassword',
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'SecurePassword123'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');

      await adminLogin(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@agendux.com' }
      });
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        'SecurePassword123',
        '$2b$12$hashedpassword'
      );
      expect(jwtUtils.generateToken).toHaveBeenCalledWith({
        id: 'admin_123',
        email: 'admin@agendux.com',
        role: UserRole.ADMIN
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData).toMatchObject({
        success: true,
        data: {
          user: {
            id: 'admin_123',
            email: 'admin@agendux.com',
            name: 'Admin User',
            role: UserRole.ADMIN
          },
          token: 'mock_jwt_token'
        }
      });
      // Verify password is not in response
      expect(responseData.data.user.password).toBeUndefined();
    });

    it('should return 401 if user does not exist', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await adminLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should return 401 if user is not admin', async () => {
      const mockProfessional = {
        id: 'prof_123',
        email: 'professional@example.com',
        password: '$2b$12$hashedpassword',
        role: UserRole.PROFESSIONAL
      };

      mockRequest.body = {
        email: 'professional@example.com',
        password: 'password123'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProfessional);

      await adminLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData.error).toBe('Invalid credentials');
    });

    it('should return 401 if user has no password', async () => {
      const mockUserWithoutPassword = {
        id: 'user_123',
        email: 'admin@agendux.com',
        password: null,
        role: UserRole.ADMIN
      };

      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'password123'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithoutPassword);

      await adminLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData.error).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      const mockAdmin = {
        id: 'admin_123',
        email: 'admin@agendux.com',
        password: '$2b$12$hashedpassword',
        role: UserRole.ADMIN
      };

      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'wrongpassword'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await adminLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'password123'
      };

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should not reveal whether user exists (timing attack prevention)', async () => {
      // Test 1: User doesn't exist
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await adminLogin(mockRequest as Request, mockResponse as Response);

      const response1 = responseData;

      // Reset
      jest.clearAllMocks();
      responseData = null;

      // Test 2: User exists but wrong password
      const mockAdmin = {
        id: 'admin_123',
        email: 'admin@agendux.com',
        password: '$2b$12$hashedpassword',
        role: UserRole.ADMIN
      };

      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'wrongpassword'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await adminLogin(mockRequest as Request, mockResponse as Response);

      const response2 = responseData;

      // Both should return the same error message
      expect(response1.error).toBe(response2.error);
      expect(response1.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      await logout(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData).toMatchObject({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should always return success (stateless JWT)', async () => {
      // Logout is stateless in JWT systems - always succeeds
      // Even if there's an issue, it returns success because
      // the client will delete the token regardless
      await logout(mockRequest as Request, mockResponse as Response);

      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Logged out successfully');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data without sensitive fields', async () => {
      const mockUser = {
        id: 'admin_123',
        email: 'admin@agendux.com',
        password: '$2b$12$hashedpassword',
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        professional: null
      };

      mockRequest.userId = 'admin_123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin_123' },
        include: { professional: true }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData).toMatchObject({
        success: true,
        data: {
          id: 'admin_123',
          email: 'admin@agendux.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        }
      });
      // Password should be excluded
      expect(responseData.data.password).toBeUndefined();
    });

    it('should exclude googleRefreshToken from professional data', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'prof@example.com',
        password: null,
        name: 'Professional User',
        role: UserRole.PROFESSIONAL,
        createdAt: new Date(),
        updatedAt: new Date(),
        professional: {
          id: 'prof_123',
          firstName: 'Dr. John',
          lastName: 'Doe',
          googleRefreshToken: 'super_secret_token',
          googleAccessToken: 'access_token'
        }
      };

      mockRequest.userId = 'user_123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(responseData).toMatchObject({
        success: true,
        data: {
          id: 'user_123',
          professional: {
            id: 'prof_123',
            firstName: 'Dr. John',
            lastName: 'Doe'
          }
        }
      });
      // Sensitive fields should be excluded
      expect(responseData.data.password).toBeUndefined();
      expect(responseData.data.professional.googleRefreshToken).toBeUndefined();
    });

    it('should return 401 if userId is not set', async () => {
      mockRequest.userId = undefined;

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Not authenticated'
      });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.userId = 'nonexistent_123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toMatchObject({
        success: false,
        error: 'User not found'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.userId = 'admin_123';

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('createAdminUser', () => {
    it('should create admin user successfully', async () => {
      const mockCreatedAdmin = {
        id: 'admin_123',
        email: 'admin@agendux.com',
        password: '$2b$12$hashedpassword',
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'SecurePassword123',
        name: 'Admin User'
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null); // No existing admin
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedAdmin);

      await createAdminUser(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN }
      });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('SecurePassword123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'admin@agendux.com',
          password: '$2b$12$hashedpassword',
          name: 'Admin User',
          role: UserRole.ADMIN
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseData).toMatchObject({
        success: true,
        data: {
          id: 'admin_123',
          email: 'admin@agendux.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        },
        message: 'Admin user created successfully'
      });
      // Password should not be in response
      expect(responseData.data.password).toBeUndefined();
    });

    it('should return 400 if admin already exists', async () => {
      const existingAdmin = {
        id: 'admin_existing',
        email: 'existing@agendux.com',
        role: UserRole.ADMIN
      };

      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'SecurePassword123',
        name: 'Admin User'
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(existingAdmin);

      await createAdminUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Admin user already exists'
      });
      // Should not attempt to create
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'SecurePassword123',
        name: 'Admin User'
      };

      (prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createAdminUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('Security: Data Protection', () => {
    it('should never expose password in any response', async () => {
      const mockAdmin = {
        id: 'admin_123',
        email: 'admin@agendux.com',
        password: '$2b$12$hashedpassword',
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test adminLogin
      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'SecurePassword123'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('token');

      await adminLogin(mockRequest as Request, mockResponse as Response);

      expect(responseData.data.user.password).toBeUndefined();

      // Reset
      jest.clearAllMocks();
      responseData = null;

      // Test getCurrentUser
      mockRequest.userId = 'admin_123';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockAdmin, professional: null });

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(responseData.data.password).toBeUndefined();

      // Reset
      jest.clearAllMocks();
      responseData = null;

      // Test createAdminUser
      mockRequest.body = {
        email: 'admin@agendux.com',
        password: 'SecurePassword123',
        name: 'Admin User'
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockAdmin);

      await createAdminUser(mockRequest as Request, mockResponse as Response);

      expect(responseData.data.password).toBeUndefined();
    });

    it('should never expose googleRefreshToken in professional data', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'prof@example.com',
        password: null,
        name: 'Professional',
        role: UserRole.PROFESSIONAL,
        professional: {
          id: 'prof_123',
          googleRefreshToken: 'super_secret_refresh_token',
          googleAccessToken: 'access_token'
        }
      };

      mockRequest.userId = 'user_123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(responseData.data.professional.googleRefreshToken).toBeUndefined();
    });
  });
});
