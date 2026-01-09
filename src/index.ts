import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import compression from 'compression';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import professionalAuthRoutes from './routes/professional-auth.routes';
import availabilityRoutes from './routes/availability.routes';
import blockedDatesRoutes from './routes/blocked-dates.routes';
import customFormFieldsRoutes from './routes/custom-form-fields.routes';
import depositSettingsRoutes from './routes/deposit-settings.routes';
import publicBookingRoutes from './routes/public-booking.routes';
import appointmentRoutes from './routes/appointment.routes';
import professionalAppointmentsRoutes from './routes/professional-appointments.routes';
import googleCalendarRoutes from './routes/google-calendar.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import webhooksRoutes from './routes/webhooks.routes';
import adminRoutes from './routes/admin.routes';
import subscriptionRoutes from './routes/subscription.routes';
import statisticsRoutes from './routes/statistics.routes';

// Import middleware
import { rateLimiter, authRateLimiter, bookingRateLimiter, webhookRateLimiter } from './middleware/rate-limiter.middleware';
import { noCacheControl, publicShortCache, longCache } from './middleware/cache-control.middleware';

// Import reminder scheduler
import { startReminderScheduler, shutdownWorker } from './services/reminder-worker.service';

const app: Application = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
  origin: FRONTEND_URL,
  credentials: true
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

// Auth routes - stricter rate limiting to prevent brute force
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/professional/auth', authRateLimiter, professionalAuthRoutes);

// Professional routes - real-time data, no caching
app.use('/api/professional/availability', noCacheControl, availabilityRoutes);
app.use('/api/professional/blocked-dates', noCacheControl, blockedDatesRoutes);
app.use('/api/professional/form-fields', noCacheControl, customFormFieldsRoutes);
app.use('/api/professional/deposit-settings', noCacheControl, depositSettingsRoutes);
app.use('/api/professional/appointments', noCacheControl, professionalAppointmentsRoutes);
app.use('/api/professional/google-calendar', noCacheControl, googleCalendarRoutes);
app.use('/api/professional/whatsapp', noCacheControl, whatsappRoutes);
app.use('/api/professional/statistics', noCacheControl, statisticsRoutes);

// Public booking routes - rate limited for bookings, short cache for page data
app.use('/api/booking', bookingRateLimiter, publicShortCache, publicBookingRoutes);
app.use('/api/appointments', bookingRateLimiter, noCacheControl, appointmentRoutes);

// Webhooks (external services like Twilio) - higher rate limit
app.use('/api/webhooks', webhookRateLimiter, webhooksRoutes);

// Admin routes - no caching for admin data
app.use('/api/admin', noCacheControl, adminRoutes);

// Subscription routes - plans can be cached longer
app.use('/api/subscription', longCache, subscriptionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start reminder scheduler
  startReminderScheduler();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await shutdownWorker();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await shutdownWorker();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
