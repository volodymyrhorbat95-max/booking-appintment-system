// ============================================
// DATA SANITIZATION UTILITIES
// Section 13.2: Data Protection - Remove sensitive fields from responses
// ============================================

/**
 * List of sensitive fields that should NEVER be sent to clients
 * These fields are internal to the system or contain secrets
 *
 * Note: We only store googleRefreshToken (not access tokens) as per OAuth2 best practices.
 * Access tokens are short-lived and obtained on-demand from the refresh token.
 */
const SENSITIVE_PROFESSIONAL_FIELDS = [
  'googleRefreshToken', // OAuth refresh tokens are secrets - used to obtain access tokens
] as const;

const SENSITIVE_USER_FIELDS = [
  'password', // Password hash should never be exposed
] as const;

/**
 * Sanitize a Professional object by removing sensitive fields
 * Use this before sending professional data in API responses
 * Works with Prisma models directly (type-agnostic)
 */
export const sanitizeProfessional = <T extends Record<string, unknown>>(
  professional: T | null | undefined
): T | null => {
  if (!professional) return null;

  const sanitized = { ...professional };

  for (const field of SENSITIVE_PROFESSIONAL_FIELDS) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
};

/**
 * Sanitize a User object by removing sensitive fields
 * Use this before sending user data in API responses
 * Works with Prisma models directly (type-agnostic)
 */
export const sanitizeUser = <T extends Record<string, unknown>>(
  user: T | null | undefined
): T | null => {
  if (!user) return null;

  const sanitized = { ...user };

  for (const field of SENSITIVE_USER_FIELDS) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
};

/**
 * Sanitize an object that contains both user and professional data
 * Recursively sanitizes nested objects
 */
export const sanitizeResponse = <T extends Record<string, unknown>>(
  data: T | null | undefined
): T | null => {
  if (!data) return null;

  const sanitized = { ...data };

  // Remove sensitive professional fields
  for (const field of SENSITIVE_PROFESSIONAL_FIELDS) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  // Remove sensitive user fields
  for (const field of SENSITIVE_USER_FIELDS) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  // Recursively sanitize nested objects
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeResponse(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map(item =>
        item && typeof item === 'object' ? sanitizeResponse(item as Record<string, unknown>) : item
      );
    }
  }

  return sanitized;
};

/**
 * Create a Prisma select object that excludes sensitive fields
 * Use this in Prisma queries to avoid fetching sensitive data at all
 */
export const professionalSelectSafe = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  slug: true,
  phone: true,
  countryCode: true,
  timezone: true,
  googleCalendarConnected: true,
  googleCalendarId: true,
  isActive: true,
  isSuspended: true,
  createdAt: true,
  updatedAt: true,
  // Explicitly exclude sensitive fields:
  // googleRefreshToken: false - not needed, just don't include
} as const;

export const userSelectSafe = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  // Explicitly exclude: password
} as const;
