import { Request, Response, NextFunction } from 'express';

// ============================================
// CACHE CONTROL MIDDLEWARE
// Section 12.1: Speed - Enable browser caching
// ============================================

/**
 * Creates a cache control middleware
 * @param maxAge - Max age in seconds for caching
 * @param isPrivate - Whether the cache should be private (user-specific data)
 */
const createCacheControl = (maxAge: number, isPrivate: boolean = true) => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (isPrivate) {
      // Private cache (for authenticated user data)
      res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
    } else {
      // Public cache (for public data like booking page info)
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    }

    // Add ETag support for conditional requests
    res.setHeader('Vary', 'Accept-Encoding');

    next();
  };
};

// ============================================
// CACHE CONTROL PRESETS
// ============================================

// No cache (for real-time data like availability, appointments)
export const noCacheControl = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

// Short cache (1 minute) - for data that changes frequently but not in real-time
export const shortCache = createCacheControl(60, true);

// Medium cache (5 minutes) - for data that changes occasionally
export const mediumCache = createCacheControl(300, true);

// Long cache (1 hour) - for semi-static data like professional profiles
export const longCache = createCacheControl(3600, true);

// Public short cache (1 minute) - for public booking page data
export const publicShortCache = createCacheControl(60, false);

// Public medium cache (5 minutes) - for professional public info
export const publicMediumCache = createCacheControl(300, false);

// Static cache (1 day) - for truly static content
export const staticCache = createCacheControl(86400, false);

// Cache control for specific routes
export const cacheControl = {
  // Real-time data - no caching
  noCache: noCacheControl,

  // Availability data - short cache
  availability: shortCache,

  // Professional profile - medium cache
  profile: mediumCache,

  // Subscription plans - long cache (admin rarely changes them)
  plans: longCache,

  // Public booking page - public short cache
  booking: publicShortCache,

  // Static content - static cache
  static: staticCache
};
