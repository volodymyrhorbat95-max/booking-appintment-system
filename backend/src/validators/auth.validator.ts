// ============================================
// AUTHENTICATION INPUT VALIDATION
// Section 13.2: Data Protection - Input validation and sanitization
// ============================================

import { z } from 'zod';

/**
 * Admin login validation schema
 * Validates email format and password presence
 */
export const adminLoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long')
});

/**
 * Admin setup validation schema
 * Used only for initial admin account creation
 */
export const adminSetupSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(val => val.trim())
});

/**
 * Google OAuth token validation
 */
export const googleAuthSchema = z.object({
  idToken: z
    .string()
    .min(1, 'Google ID token is required')
    .max(5000, 'Token too long')
});

// Export types for use in controllers
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminSetupInput = z.infer<typeof adminSetupSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
