/**
 * Structured Logging with Winston
 *
 * This replaces console.log/error throughout the application with structured,
 * searchable, JSON-formatted logs that include:
 * - Log levels (debug, info, warn, error)
 * - Timestamps
 * - Request IDs for tracing
 * - Structured context data
 * - Stack traces for errors
 */

import winston from 'winston';
import path from 'path';

// Determine log level from environment (default: info)
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for console output (colorized and readable in development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

// JSON format for production (parseable by log aggregation tools)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [
  // Console output (always enabled)
  new winston.transports.Console({
    format: isProduction ? jsonFormat : consoleFormat
  })
];

// In production, also write to files
if (isProduction) {
  // Error logs (error level only)
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: jsonFormat
    })
  );

  // Combined logs (all levels)
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: jsonFormat
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  transports,
  // Don't exit on uncaught exceptions (let process handle it)
  exitOnError: false
});

/**
 * Helper to create a child logger with default context
 * Useful for adding request IDs or service names to all logs
 *
 * Example:
 *   const reqLogger = logger.child({ requestId: req.id, userId: req.user.id });
 *   reqLogger.info('User action', { action: 'login' });
 */
export function createLogger(defaultMeta: Record<string, any>) {
  return logger.child(defaultMeta);
}

/**
 * Log a request (for HTTP request logging)
 */
export function logRequest(req: any, res: any, responseTime: number) {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
}

/**
 * Log an error with full context
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error('Error occurred', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    ...context
  });
}

/**
 * Log a critical error that requires immediate attention
 */
export function logCritical(message: string, context?: Record<string, any>) {
  logger.error('CRITICAL ERROR', {
    message,
    ...context,
    severity: 'critical'
  });
}

/**
 * Log service-specific events with structured data
 */
export const ServiceLogger = {
  mercadopago: (action: string, data?: Record<string, any>) => {
    logger.info('[MercadoPago]', { service: 'mercadopago', action, ...data });
  },

  whatsapp: (action: string, data?: Record<string, any>) => {
    logger.info('[WhatsApp]', { service: 'whatsapp', action, ...data });
  },

  email: (action: string, data?: Record<string, any>) => {
    logger.info('[Email]', { service: 'email', action, ...data });
  },

  googleCalendar: (action: string, data?: Record<string, any>) => {
    logger.info('[Google Calendar]', { service: 'google-calendar', action, ...data });
  },

  reminder: (action: string, data?: Record<string, any>) => {
    logger.info('[Reminder]', { service: 'reminder', action, ...data });
  },

  payment: (action: string, data?: Record<string, any>) => {
    logger.info('[Payment]', { service: 'payment', action, ...data });
  }
};

// Create logs directory if it doesn't exist (only in production)
if (isProduction) {
  const fs = require('fs');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Log startup message
logger.info('Logger initialized', {
  level: LOG_LEVEL,
  environment: process.env.NODE_ENV || 'development',
  logToFiles: isProduction
});
