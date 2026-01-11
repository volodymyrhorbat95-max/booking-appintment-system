/**
 * Sentry Error Tracking Configuration
 *
 * Sentry provides:
 * - Centralized error tracking
 * - Performance monitoring (APM)
 * - Real-time alerts for production issues
 * - Stack traces and context for debugging
 * - Release tracking
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry error tracking
 * Call this ONCE at application startup, before any other code
 */
export function initializeSentry() {
  // Only initialize in production or if explicitly enabled
  const SENTRY_DSN = process.env.SENTRY_DSN;
  const NODE_ENV = process.env.NODE_ENV;

  if (!SENTRY_DSN) {
    console.log('[Sentry] Not initialized - SENTRY_DSN not configured');
    console.log('[Sentry] Add SENTRY_DSN to .env to enable error tracking in production');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment (production, staging, development)
    environment: NODE_ENV || 'development',

    // Release version (for tracking which version has errors)
    // You can set this from package.json or git commit
    release: process.env.npm_package_version || '1.0.0',

    // Sample rate for performance monitoring (0.0 to 1.0)
    // 1.0 = capture 100% of transactions
    // 0.1 = capture 10% of transactions (recommended for high-traffic apps)
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,

    // Sample rate for profiling (0.0 to 1.0)
    profilesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,

    // Integrations
    integrations: [
      // Performance profiling
      nodeProfilingIntegration()
    ],

    // Before sending an event, you can modify or drop it
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }

      // Don't send errors in development (unless explicitly enabled)
      if (NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_IN_DEV) {
        console.error('[Sentry] Error would be sent in production:', hint.originalException);
        return null; // Drop the event
      }

      return event;
    },

    // Ignore certain errors (reduce noise)
    ignoreErrors: [
      // Browser/network errors that we can't control
      'Network request failed',
      'NetworkError',

      // Non-actionable errors
      'Non-Error promise rejection captured'
    ]
  });

  console.log('[Sentry] Initialized successfully', {
    environment: NODE_ENV,
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0
  });
}

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context
    }
  });
}

/**
 * Capture a message (not an error, but noteworthy)
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context
    }
  });
}

/**
 * Set user context (for tracking which user encountered errors)
 */
export function setUserContext(userId: string, email?: string, role?: string) {
  Sentry.setUser({
    id: userId,
    email,
    role
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb (for debugging context)
 * Breadcrumbs show what the user was doing before an error occurred
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info'
  });
}

/**
 * Start a span for performance monitoring
 */
export function startSpan(name: string, op: string, callback: () => Promise<any>) {
  return Sentry.startSpan({
    name,
    op
  }, callback);
}

/**
 * Express request handler middleware
 * MUST be added before all routes
 */
export function setupExpressErrorHandler(app: any) {
  // Use Sentry's Express integration
  Sentry.setupExpressErrorHandler(app);
}

/**
 * Express error catcher middleware
 * MUST be added AFTER all routes
 */
export function setupExpressErrorCatcher(app: any) {
  // Sentry error handler is already set up via setupExpressErrorHandler
  // This function is kept for backwards compatibility but does nothing
}

/**
 * Flush Sentry events before shutdown
 * Important for graceful shutdown to ensure all events are sent
 */
export async function closeSentry() {
  await Sentry.close(2000); // Wait up to 2 seconds for events to send
  console.log('[Sentry] Closed gracefully');
}
