import { Application } from 'express';

// Import middleware
import { rateLimiter, authRateLimiter, bookingRateLimiter, webhookRateLimiter } from '../middleware/rate-limiter.middleware';
import { noCacheControl, publicShortCache, longCache } from '../middleware/cache-control.middleware';

// Import routes
import authRoutes from './auth.routes';
import professionalAuthRoutes from './professional-auth.routes';
import availabilityRoutes from './availability.routes';
import blockedDatesRoutes from './blocked-dates.routes';
import customFormFieldsRoutes from './custom-form-fields.routes';
import depositSettingsRoutes from './deposit-settings.routes';
import publicBookingRoutes from './public-booking.routes';
import appointmentRoutes from './appointment.routes';
import professionalAppointmentsRoutes from './professional-appointments.routes';
import googleCalendarRoutes from './google-calendar.routes';
import whatsappRoutes from './whatsapp.routes';
import webhooksRoutes from './webhooks.routes';
import adminRoutes from './admin.routes';
import subscriptionRoutes from './subscription.routes';
import statisticsRoutes from './statistics.routes';

/**
 * Configure all application routes
 * Section 12.1 & 12.2: Speed + Concurrent Users
 */
export function configureRoutes(app: Application): void {
  // ============================================
  // API ROUTES WITH SPECIFIC MIDDLEWARE
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
}
