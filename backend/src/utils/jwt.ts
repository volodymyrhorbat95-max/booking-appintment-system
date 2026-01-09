import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { User, UserRole } from '../types';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// ============================================
// JWT SECURITY CONFIGURATION
// Section 13.1: Authentication - Secure token handling
// ============================================

// CRITICAL: JWT_SECRET must be set in environment variables
// Never use a default value in production - this would be a security vulnerability
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. ' +
    'Set a strong, unique secret in your .env file (minimum 32 characters recommended).'
  );
}

// Token expiration (default 7 days)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (user: Pick<User, 'id' | 'email' | 'role'>): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn']
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};
