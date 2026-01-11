import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import compression from 'compression';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Validate environment variables before starting (CRITICAL - prevents silent failures)
import { validateEnvironmentOrExit } from './utils/env-validator';
validateEnvironmentOrExit();

// Initialize structured logging
import { logger } from './utils/logger';
logger.info('Application starting...', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT
});

// Initialize Sentry error tracking (MUST be before other imports)
import { initializeSentry, setupExpressErrorHandler, setupExpressErrorCatcher, closeSentry } from './config/sentry.config';
initializeSentry();

// Import routes configuration
import { configureRoutes } from './routes';

// Import middleware
import { rateLimiter } from './middleware/rate-limiter.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';

// Import reminder scheduler
import { startReminderScheduler, shutdownWorker } from './services/reminder-worker.service';

// Import WebSocket configuration
import { initializeWebSocket } from './config/socket.config';

const app: Application = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];

// ============================================
// SENTRY REQUEST HANDLER (Must be first middleware)
// ============================================
setupExpressErrorHandler(app);

// ============================================
// REQUEST LOGGING (After Sentry, before other middleware)
// ============================================
app.use(requestLoggerMiddleware);

// ============================================
// SECURITY MIDDLEWARE (Section 13 - Security Requirements)
// ============================================

// Helmet sets various HTTP headers to protect against common vulnerabilities
// - X-Content-Type-Options: nosniff (prevents MIME sniffing)
// - X-Frame-Options: DENY (prevents clickjacking)
// - X-XSS-Protection: 0 (disabled as modern browsers handle this)
// - Strict-Transport-Security: enforces HTTPS (in production)
// - Content-Security-Policy: restricts resource loading
app.use(helmet({
  // Configure CSP for API (more permissive since this is an API server)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  // Enable HSTS in production (forces HTTPS)
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Prevent MIME sniffing
  noSniff: true,
  // Disable referrer
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// ============================================
// PERFORMANCE MIDDLEWARE (Section 12.1 - Speed)
// ============================================

// Gzip compression for all responses (reduces payload size by ~70%)
app.use(compression({
  // Compress all responses larger than 1KB
  threshold: 1024,
  // Don't compress responses with no-transform cache directive
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting (Section 12.2 - Concurrent Users protection)
// Apply general rate limiter to all routes
app.use(rateLimiter);

// Standard middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Use allowed origins from environment variable
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware (Section 12.1 - Speed)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000, () => {
    res.status(408).json({ success: false, error: 'Request timeout' });
  });
  next();
});

// Health check route (no rate limiting, no caching)
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// ============================================
// API ROUTES WITH SPECIFIC MIDDLEWARE
// Section 12.1 & 12.2: Speed + Concurrent Users
// ============================================
configureRoutes(app);

// ============================================
// SENTRY ERROR HANDLER (Must be after all routes, before other error handlers)
// ============================================
setupExpressErrorCatcher(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
initializeWebSocket(httpServer);

// Start server
const server = httpServer.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: FRONTEND_URL
  });
  logger.info('WebSocket server ready', {
    wsUrl: `ws://localhost:${PORT}`
  });

  // Start reminder scheduler
  startReminderScheduler();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received - initiating graceful shutdown');
  await shutdownWorker();
  await closeSentry();
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received - initiating graceful shutdown');
  await shutdownWorker();
  await closeSentry();
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
});

export default app;
