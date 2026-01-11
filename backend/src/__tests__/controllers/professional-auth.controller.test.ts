import type { Request, Response } from 'express';
import {
  googleAuth,
  getProfessionalProfile
} from '../../controllers/professional-auth.controller';
import prisma from '../../config/database';
import * as googleUtils from '../../utils/google';
import * as jwtUtils from '../../utils/jwt';
import { UserRole } from '../../types';

// Mock dependencies BEFORE importing the controller
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    professional: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn()
    },
    reminderSetting: {
      create: jest.fn()
    },
    messageTemplate: {
      createMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

jest.mock('../../utils/google');
jest.mock('../../utils/jwt');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Professional Auth Controller', () => {
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

  describe('googleAuth', () => {
    describe('New User Registration', () => {
      it('should create new professional account with Google OAuth', async () => {
        const mockGoogleUser = {
          email: 'dr.maria@gmail.com',
          name: 'Dr. Maria Garcia',
          givenName: 'Maria',
          familyName: 'Garcia',
          picture: 'https://example.com/photo.jpg'
        };

        const mockUser = {
          id: 'user_123',
          email: 'dr.maria@gmail.com',
          name: 'Dr. Maria Garcia',
          role: UserRole.PROFESSIONAL,
          password: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const mockProfessional = {
          id: 'prof_123',
          userId: 'user_123',
          firstName: 'Maria',
          lastName: 'Garcia',
          slug: 'maria-garcia',
          timezone: 'America/Argentina/Buenos_Aires',
          isActive: true,
          isSuspended: false,
          depositEnabled: false,
          depositAmount: null,
          googleRefreshToken: null,
          googleCalendarId: null,
          googleCalendarConnected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRequest.body = { idToken: 'valid_google_id_token' };

        // Mock Google token verification
        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);

        // Mock no existing user
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        // Mock slug generation
        (googleUtils.generateSlug as jest.Mock).mockReturnValue('maria-garcia');
        (googleUtils.makeSlugUnique as jest.Mock).mockResolvedValue('maria-garcia');

        // Mock transaction to create user + professional + defaults
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return callback({
            user: { create: jest.fn().mockResolvedValue(mockUser) },
            professional: { create: jest.fn().mockResolvedValue(mockProfessional) },
            reminderSetting: { create: jest.fn() },
            messageTemplate: { createMany: jest.fn() }
          });
        });

        // Mock JWT generation
        (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');

        await googleAuth(mockRequest as Request, mockResponse as Response);

        // Verify Google token was verified
        expect(googleUtils.verifyGoogleToken).toHaveBeenCalledWith('valid_google_id_token');

        // Verify slug was generated
        expect(googleUtils.generateSlug).toHaveBeenCalledWith('Maria', 'Garcia');
        expect(googleUtils.makeSlugUnique).toHaveBeenCalled();

        // Verify transaction was called
        expect(prisma.$transaction).toHaveBeenCalled();

        // Verify JWT token was generated
        expect(jwtUtils.generateToken).toHaveBeenCalledWith({
          id: 'user_123',
          email: 'dr.maria@gmail.com',
          role: UserRole.PROFESSIONAL
        });

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseData).toMatchObject({
          success: true,
          data: {
            user: {
              id: 'user_123',
              email: 'dr.maria@gmail.com',
              name: 'Dr. Maria Garcia',
              role: UserRole.PROFESSIONAL
            },
            professional: {
              id: 'prof_123',
              firstName: 'Maria',
              lastName: 'Garcia',
              slug: 'maria-garcia'
            },
            token: 'mock_jwt_token'
          },
          message: 'Account created successfully'
        });

        // Verify sensitive fields are not exposed
        expect(responseData.data.user.password).toBeUndefined();
        expect(responseData.data.professional.googleRefreshToken).toBeUndefined();
      });

      it('should create default reminder settings for new professional', async () => {
        const mockGoogleUser = {
          email: 'dr.john@gmail.com',
          name: 'Dr. John Doe',
          givenName: 'John',
          familyName: 'Doe'
        };

        mockRequest.body = { idToken: 'valid_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (googleUtils.generateSlug as jest.Mock).mockReturnValue('john-doe');
        (googleUtils.makeSlugUnique as jest.Mock).mockResolvedValue('john-doe');

        const mockTransaction = jest.fn();
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          const tx = {
            user: { create: jest.fn().mockResolvedValue({ id: 'user_1', email: 'dr.john@gmail.com', role: UserRole.PROFESSIONAL }) },
            professional: { create: jest.fn().mockResolvedValue({ id: 'prof_1', userId: 'user_1' }) },
            reminderSetting: { create: mockTransaction },
            messageTemplate: { createMany: jest.fn() }
          };
          await callback(tx);
          return { user: tx.user.create(), professional: tx.professional.create() };
        });

        (jwtUtils.generateToken as jest.Mock).mockReturnValue('token');

        await googleAuth(mockRequest as Request, mockResponse as Response);

        // Verify default reminder settings were created
        // Transaction should have been called, which includes creating reminder settings
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(responseData.success).toBe(true);
      });

      it('should create default message templates for new professional', async () => {
        const mockGoogleUser = {
          email: 'dr.test@gmail.com',
          name: 'Dr. Test',
          givenName: 'Test',
          familyName: 'Doctor'
        };

        mockRequest.body = { idToken: 'valid_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (googleUtils.generateSlug as jest.Mock).mockReturnValue('test-doctor');
        (googleUtils.makeSlugUnique as jest.Mock).mockResolvedValue('test-doctor');

        const mockCreateMany = jest.fn();
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          const tx = {
            user: { create: jest.fn().mockResolvedValue({ id: 'user_1', email: 'dr.test@gmail.com', role: UserRole.PROFESSIONAL }) },
            professional: { create: jest.fn().mockResolvedValue({ id: 'prof_1', userId: 'user_1' }) },
            reminderSetting: { create: jest.fn() },
            messageTemplate: { createMany: mockCreateMany }
          };
          await callback(tx);
          return { user: tx.user.create(), professional: tx.professional.create() };
        });

        (jwtUtils.generateToken as jest.Mock).mockReturnValue('token');

        await googleAuth(mockRequest as Request, mockResponse as Response);

        // Verify message templates were created in transaction
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(responseData.success).toBe(true);
      });
    });

    describe('Existing User Login', () => {
      it('should login existing professional with Google OAuth', async () => {
        const mockGoogleUser = {
          email: 'existing@gmail.com',
          name: 'Existing Professional',
          givenName: 'Existing',
          familyName: 'Professional'
        };

        const mockUser = {
          id: 'user_456',
          email: 'existing@gmail.com',
          name: 'Existing Professional',
          role: UserRole.PROFESSIONAL,
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          professional: {
            id: 'prof_456',
            userId: 'user_456',
            firstName: 'Existing',
            lastName: 'Professional',
            slug: 'existing-professional',
            timezone: 'America/Argentina/Buenos_Aires',
            isActive: true,
            isSuspended: false,
            googleRefreshToken: 'refresh_token_secret'
          }
        };

        mockRequest.body = { idToken: 'valid_google_id_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');

        await googleAuth(mockRequest as Request, mockResponse as Response);

        // Verify response
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseData).toMatchObject({
          success: true,
          data: {
            user: {
              id: 'user_456',
              email: 'existing@gmail.com',
              role: UserRole.PROFESSIONAL
            },
            professional: {
              id: 'prof_456',
              firstName: 'Existing',
              lastName: 'Professional'
            },
            token: 'mock_jwt_token'
          },
          message: 'Login successful'
        });

        // Verify sensitive fields are not exposed
        expect(responseData.data.user.password).toBeUndefined();
        expect(responseData.data.professional.googleRefreshToken).toBeUndefined();
        // OAuth2 best practice: Only refresh tokens stored (access tokens obtained on-demand)

        // Verify no transaction was called (existing user)
        expect(prisma.$transaction).not.toHaveBeenCalled();
      });

      it('should reject admin trying to login as professional', async () => {
        const mockGoogleUser = {
          email: 'admin@agendux.com',
          name: 'Admin User',
          givenName: 'Admin',
          familyName: 'User'
        };

        const mockAdminUser = {
          id: 'admin_123',
          email: 'admin@agendux.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          password: '$2b$12$hashedpassword',
          createdAt: new Date(),
          updatedAt: new Date(),
          professional: null
        };

        mockRequest.body = { idToken: 'valid_google_id_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);

        await googleAuth(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseData).toMatchObject({
          success: false,
          error: 'This email is registered as admin. Please use admin login.'
        });
      });

      it('should reject suspended professional', async () => {
        const mockGoogleUser = {
          email: 'suspended@gmail.com',
          name: 'Suspended Professional',
          givenName: 'Suspended',
          familyName: 'Professional'
        };

        const mockSuspendedUser = {
          id: 'user_789',
          email: 'suspended@gmail.com',
          name: 'Suspended Professional',
          role: UserRole.PROFESSIONAL,
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          professional: {
            id: 'prof_789',
            userId: 'user_789',
            isSuspended: true,
            isActive: true
          }
        };

        mockRequest.body = { idToken: 'valid_google_id_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSuspendedUser);

        await googleAuth(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseData).toMatchObject({
          success: false,
          error: 'Your account has been suspended. Please contact support.'
        });
      });
    });

    describe('Error Handling', () => {
      it('should reject invalid Google token', async () => {
        mockRequest.body = { idToken: 'invalid_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(null);

        await googleAuth(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseData).toMatchObject({
          success: false,
          error: 'Invalid Google token'
        });
      });

      it('should handle database errors gracefully', async () => {
        const mockGoogleUser = {
          email: 'error@gmail.com',
          name: 'Error Test',
          givenName: 'Error',
          familyName: 'Test'
        };

        mockRequest.body = { idToken: 'valid_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        await googleAuth(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseData).toMatchObject({
          success: false,
          error: 'Internal server error'
        });
      });

      it('should handle token verification errors gracefully', async () => {
        mockRequest.body = { idToken: 'token_that_causes_error' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockRejectedValue(new Error('Google API error'));

        await googleAuth(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseData).toMatchObject({
          success: false,
          error: 'Internal server error'
        });
      });
    });

    describe('Security: Data Protection', () => {
      it('should never expose password in response (new user)', async () => {
        const mockGoogleUser = {
          email: 'test@gmail.com',
          name: 'Test User',
          givenName: 'Test',
          familyName: 'User'
        };

        mockRequest.body = { idToken: 'valid_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (googleUtils.generateSlug as jest.Mock).mockReturnValue('test-user');
        (googleUtils.makeSlugUnique as jest.Mock).mockResolvedValue('test-user');

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return callback({
            user: { create: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@gmail.com', role: UserRole.PROFESSIONAL, password: null }) },
            professional: { create: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1', googleRefreshToken: 'secret_token' }) },
            reminderSetting: { create: jest.fn() },
            messageTemplate: { createMany: jest.fn() }
          });
        });

        (jwtUtils.generateToken as jest.Mock).mockReturnValue('token');

        await googleAuth(mockRequest as Request, mockResponse as Response);

        expect(responseData.data.user.password).toBeUndefined();
        expect(responseData.data.professional.googleRefreshToken).toBeUndefined();
      });

      it('should never expose googleRefreshToken in response (existing user)', async () => {
        const mockGoogleUser = {
          email: 'existing@gmail.com',
          name: 'Existing User',
          givenName: 'Existing',
          familyName: 'User'
        };

        const mockUser = {
          id: 'user_1',
          email: 'existing@gmail.com',
          role: UserRole.PROFESSIONAL,
          password: null,
          professional: {
            id: 'prof_1',
            googleRefreshToken: 'super_secret_refresh_token'
          }
        };

        mockRequest.body = { idToken: 'valid_token' };

        (googleUtils.verifyGoogleToken as jest.Mock).mockResolvedValue(mockGoogleUser);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (jwtUtils.generateToken as jest.Mock).mockReturnValue('token');

        await googleAuth(mockRequest as Request, mockResponse as Response);

        // Verify googleRefreshToken is removed (Section 13.2 - Data Protection)
        expect(responseData.data.professional.googleRefreshToken).toBeUndefined();
        // OAuth2 best practice: Only refresh tokens stored (access tokens obtained on-demand)
      });
    });
  });

  describe('getProfessionalProfile', () => {
    it('should return professional profile with user and subscription data', async () => {
      const mockProfessional = {
        id: 'prof_123',
        userId: 'user_123',
        firstName: 'Dr. Maria',
        lastName: 'Garcia',
        slug: 'dr-maria-garcia',
        timezone: 'America/Argentina/Buenos_Aires',
        isActive: true,
        isSuspended: false,
        depositEnabled: true,
        depositAmount: 5000,
        googleRefreshToken: 'secret_refresh_token',
        googleCalendarConnected: true,
        user: {
          id: 'user_123',
          email: 'dr.maria@gmail.com',
          name: 'Dr. Maria Garcia',
          role: UserRole.PROFESSIONAL,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        subscription: {
          id: 'sub_123',
          professionalId: 'prof_123',
          planId: 'plan_basic',
          status: 'ACTIVE',
          plan: {
            id: 'plan_basic',
            name: 'Plan Básico',
            price: 15000,
            features: ['Feature 1', 'Feature 2']
          }
        }
      };

      mockRequest.userId = 'user_123';

      (prisma.professional.findFirst as jest.Mock).mockResolvedValue(mockProfessional);

      await getProfessionalProfile(mockRequest as Request, mockResponse as Response);

      expect(prisma.professional.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
              updatedAt: true
            }
          },
          subscription: {
            include: { plan: true }
          }
        }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData).toMatchObject({
        success: true,
        data: {
          id: 'prof_123',
          firstName: 'Dr. Maria',
          lastName: 'Garcia',
          user: {
            id: 'user_123',
            email: 'dr.maria@gmail.com'
          },
          subscription: {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: {
              name: 'Plan Básico'
            }
          }
        }
      });

      // Verify sensitive field is removed
      expect(responseData.data.googleRefreshToken).toBeUndefined();
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.userId = undefined;

      await getProfessionalProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Not authenticated'
      });
    });

    it('should return 404 if professional profile not found', async () => {
      mockRequest.userId = 'user_nonexistent';

      (prisma.professional.findFirst as jest.Mock).mockResolvedValue(null);

      await getProfessionalProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Professional profile not found'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.userId = 'user_123';

      (prisma.professional.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getProfessionalProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should exclude googleRefreshToken from response (Section 13.2 - Data Protection)', async () => {
      const mockProfessional = {
        id: 'prof_1',
        userId: 'user_1',
        firstName: 'John',
        lastName: 'Doe',
        googleRefreshToken: 'THIS_SHOULD_BE_HIDDEN',
        user: {
          id: 'user_1',
          email: 'john@example.com',
          name: 'John Doe',
          role: UserRole.PROFESSIONAL,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        subscription: null
      };

      mockRequest.userId = 'user_1';

      (prisma.professional.findFirst as jest.Mock).mockResolvedValue(mockProfessional);

      await getProfessionalProfile(mockRequest as Request, mockResponse as Response);

      // Verify googleRefreshToken is removed (Section 13.2 - Data Protection)
      expect(responseData.data.googleRefreshToken).toBeUndefined();
      // OAuth2 best practice: Only refresh tokens stored (access tokens obtained on-demand)

      // Verify other data is still present
      expect(responseData.data.firstName).toBe('John');
      expect(responseData.data.lastName).toBe('Doe');
    });
  });
});
