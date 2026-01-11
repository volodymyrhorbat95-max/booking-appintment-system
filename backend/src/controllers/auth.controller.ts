import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { UserRole, LoginRequest, ApiResponse, LoginResponse } from '../types';

// Admin login (email + password)
// Section 13.1: Authentication - Admin login with password verification
// Input validation handled by Zod middleware (auth.routes.ts)
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Data is already validated by validateBody(adminLoginSchema) middleware
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Check if user exists and is admin
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse<null>);
      return;
    }

    // Check if user has password (admin must have password)
    if (!user.password) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse<null>);
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse<null>);
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole
    });

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          role: userWithoutPassword.role as UserRole
        },
        token
      }
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};

// Logout (client-side token removal, but we can track it server-side if needed)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we return success for consistency
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse<null>);
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};

// Get current user
// Section 13.2: Data Protection - Exclude sensitive fields from response
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        professional: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
      return;
    }

    // Remove password from user (Section 13.2 - Data Protection)
    const { password: _, ...userWithoutPassword } = user;

    // Remove googleRefreshToken from professional if exists (Section 13.2 - Data Protection)
    if (user.professional) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { googleRefreshToken: __, ...professionalWithoutToken } = user.professional;
      const sanitizedData = {
        ...userWithoutPassword,
        professional: professionalWithoutToken
      };

      res.status(200).json({
        success: true,
        data: sanitizedData
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};

// Create initial admin user (run once during setup)
// Section 13.1: Authentication - Admin setup with strong password
// Input validation handled by Zod middleware (auth.routes.ts - adminSetupSchema)
export const createAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Data is already validated by validateBody(adminSetupSchema) middleware
    // Password strength validation (min 8 chars, uppercase, lowercase, number) is enforced
    const { email, password, name } = req.body;

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        error: 'Admin user already exists'
      } as ApiResponse<null>);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.ADMIN
      }
    });

    const { password: _, ...adminWithoutPassword } = admin;

    res.status(201).json({
      success: true,
      data: adminWithoutPassword,
      message: 'Admin user created successfully'
    });
  } catch (error) {
    logger.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};
