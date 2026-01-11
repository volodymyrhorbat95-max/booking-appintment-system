/**
 * Request Logger Middleware
 *
 * Automatically logs all HTTP requests with:
 * - Request method, URL, headers
 * - Response status code
 * - Response time
 * - Request ID for tracing
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Extend Express Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Middleware to log all HTTP requests
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate unique request ID
  req.requestId = uuidv4();

  // Record start time
  req.startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Capture response finish event
  const originalSend = res.send;
  res.send = function (data: any) {
    // Calculate response time
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;

    // Log response
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}
