import { Request, Response, NextFunction } from 'express';

// ============================================
// RATE LIMITING MIDDLEWARE
// Section 12.2: Concurrent Users - Protect against abuse
// ============================================

// In-memory store for rate limiting
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000);

/**
 * Creates a rate limiter middleware
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed in the time window
 * @param message - Error message when rate limit is exceeded
 */
const createRateLimiter = (windowMs: number, maxRequests: number, message: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Get client identifier (IP address or forwarded IP)
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      store[key].count++;
    }

    // Check if rate limit exceeded
    if (store[key].count > maxRequests) {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000).toString());
      res.setHeader('Retry-After', Math.ceil((store[key].resetTime - now) / 1000).toString());

      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
      return;
    }

    // Set rate limit headers for successful requests
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000).toString());

    next();
  };
};

// ============================================
// RATE LIMITERS FOR DIFFERENT ENDPOINTS
// ============================================

// General API rate limiter: 100 requests per minute per IP
export const rateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100, // 100 requests
  'Too many requests, please try again later'
);

// Auth rate limiter: 10 login attempts per minute (prevent brute force)
export const authRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 attempts
  'Too many login attempts, please try again in a minute'
);

// Booking rate limiter: 20 booking attempts per minute per IP
export const bookingRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20, // 20 requests
  'Too many booking attempts, please try again later'
);

// Public page rate limiter: 200 requests per minute (more lenient for public pages)
export const publicRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  200, // 200 requests
  'Too many requests, please try again later'
);

// Webhook rate limiter: 500 requests per minute (high limit for external services)
export const webhookRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  500, // 500 requests
  'Too many webhook requests'
);
