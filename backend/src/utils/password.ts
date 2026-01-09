import bcrypt from 'bcryptjs';

// ============================================
// PASSWORD SECURITY UTILITIES
// Section 13.1: Authentication - Password encryption
// Section 13.2: Data Protection - Secure credential handling
// ============================================

// Salt rounds for bcrypt (12 is recommended for production)
// Higher values = more secure but slower
const SALT_ROUNDS = 12;

// Password policy constants
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Password validation result
 */
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password against security policy
 * Requirements:
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional but recommended)
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Optional: require special character for stronger passwords
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('Password must contain at least one special character');
  // }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Validate password strength before hashing
  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
  }

  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 * Uses timing-safe comparison to prevent timing attacks
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  // bcrypt.compare is already timing-safe
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Check if a password needs to be rehashed
 * Useful when upgrading salt rounds
 * @param hashedPassword - The hashed password to check
 * @returns True if the password should be rehashed
 */
export const needsRehash = (hashedPassword: string): boolean => {
  try {
    // Extract the salt rounds from the hash
    const rounds = bcrypt.getRounds(hashedPassword);
    return rounds < SALT_ROUNDS;
  } catch {
    // If we can't determine rounds, recommend rehashing
    return true;
  }
};
