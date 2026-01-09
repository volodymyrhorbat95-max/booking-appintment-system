import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '../types';

// Extended Request with user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// Verify JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required'
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
    return;
  }

  req.userId = payload.userId;
  req.userEmail = payload.email;
  req.userRole = payload.role;
  req.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role
  };

  next();
};

// Require admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.userRole !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  next();
};

// Require professional role
export const requireProfessional = (req: Request, res: Response, next: NextFunction): void => {
  if (req.userRole !== UserRole.PROFESSIONAL) {
    res.status(403).json({
      success: false,
      error: 'Professional access required'
    });
    return;
  }

  next();
};

// Allow admin or professional
export const requireAdminOrProfessional = (req: Request, res: Response, next: NextFunction): void => {
  if (req.userRole !== UserRole.ADMIN && req.userRole !== UserRole.PROFESSIONAL) {
    res.status(403).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  next();
};

// Require specific roles (flexible version)
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    next();
  };
};
