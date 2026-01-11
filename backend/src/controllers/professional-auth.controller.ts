import type { Request, Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import type { Prisma } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { verifyGoogleToken, generateSlug, makeSlugUnique } from '../utils/google';
// Sanitization: sensitive fields are removed inline below (googleRefreshToken, password)
import { UserRole } from '../types';
import type { ApiResponse, GoogleAuthResponse } from '../types';

// Professional login/register with Google
// Section 13.1: Authentication - Google OAuth for professionals
// Input validation handled by Zod middleware (professional-auth.routes.ts - googleAuthSchema)
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Data is already validated by validateBody(googleAuthSchema) middleware
    const { idToken } = req.body;

    // Verify Google token and get user info
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      res.status(401).json({
        success: false,
        error: 'Invalid Google token'
      } as ApiResponse<null>);
      return;
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { professional: true }
    });

    let professional;
    let isNewUser = false;

    if (user) {
      // Existing user - check if professional
      if (user.role !== UserRole.PROFESSIONAL) {
        res.status(403).json({
          success: false,
          error: 'This email is registered as admin. Please use admin login.'
        } as ApiResponse<null>);
        return;
      }

      // Check if suspended
      if (user.professional?.isSuspended) {
        res.status(403).json({
          success: false,
          error: 'Your account has been suspended. Please contact support.'
        } as ApiResponse<null>);
        return;
      }

      professional = user.professional;
    } else {
      // New user - create account
      isNewUser = true;

      // Generate unique slug from name
      const baseSlug = generateSlug(googleUser.givenName, googleUser.familyName);
      const uniqueSlug = await makeSlugUnique(baseSlug, async (slug) => {
        const existing = await prisma.professional.findUnique({ where: { slug } });
        return !!existing;
      });

      // Create user and professional in transaction
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newUser = await tx.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            role: UserRole.PROFESSIONAL,
            password: null // Google OAuth users don't have password
          }
        });

        const newProfessional = await tx.professional.create({
          data: {
            userId: newUser.id,
            firstName: googleUser.givenName,
            lastName: googleUser.familyName,
            slug: uniqueSlug,
            timezone: process.env.DEFAULT_TIMEZONE || 'America/Argentina/Buenos_Aires'
          }
        });

        // Create default reminder settings
        await tx.reminderSetting.create({
          data: {
            professionalId: newProfessional.id,
            reminderNumber: 1,
            hoursBefore: 24,
            enableNightBefore: false,
            isActive: true
          }
        });

        // Create default message templates
        await tx.messageTemplate.createMany({
          data: [
            {
              professionalId: newProfessional.id,
              type: 'BOOKING_CONFIRMATION',
              messageText: 'Hola {patient_name}, tu turno con {professional_name} ha sido confirmado para el {appointment_date} a las {appointment_time}. Referencia: {booking_reference}',
              isActive: true
            },
            {
              professionalId: newProfessional.id,
              type: 'REMINDER',
              messageText: 'Hola {patient_name}, te recordamos tu turno con {professional_name} mañana {appointment_date} a las {appointment_time}. ¿Confirmas tu asistencia?',
              isActive: true
            },
            {
              professionalId: newProfessional.id,
              type: 'CANCELLATION',
              messageText: 'Hola {patient_name}, tu turno con {professional_name} del {appointment_date} a las {appointment_time} ha sido cancelado. Referencia: {booking_reference}',
              isActive: true
            }
          ]
        });

        return { user: newUser, professional: newProfessional };
      });

      user = result.user as any;
      professional = result.professional;
    }

    // Generate JWT token
    const token = generateToken({
      id: user!.id,
      email: user!.email,
      role: user!.role as UserRole
    });

    // Return response with sanitized data (remove sensitive fields like password, googleRefreshToken)
    const { password: _, ...userWithoutPassword } = user!;

    // Remove googleRefreshToken from professional data before sending to client
    // Section 13.2: Data Protection - OAuth refresh tokens must NEVER be exposed in API responses
    // Note: We only store googleRefreshToken (not access tokens) as per OAuth2 best practices
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { googleRefreshToken: __, ...professionalWithoutToken } = professional || {} as Record<string, unknown>;

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          role: userWithoutPassword.role as UserRole
        },
        professional: professional ? professionalWithoutToken : null,
        token
      },
      message: isNewUser ? 'Account created successfully' : 'Login successful'
    } as ApiResponse<GoogleAuthResponse>);
  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};

// Get professional profile
export const getProfessionalProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
      return;
    }

    const professional = await prisma.professional.findFirst({
      where: { userId },
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

    if (!professional) {
      res.status(404).json({
        success: false,
        error: 'Professional profile not found'
      } as ApiResponse<null>);
      return;
    }

    // Remove sensitive googleRefreshToken from response (Section 13.2 - Data Protection)
    // OAuth refresh tokens must NEVER be exposed in API responses
    // Note: We only store googleRefreshToken (not access tokens) as per OAuth2 best practices
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { googleRefreshToken: _, ...professionalWithoutToken } = professional;

    res.status(200).json({
      success: true,
      data: professionalWithoutToken
    });
  } catch (error) {
    logger.error('Get professional profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};
