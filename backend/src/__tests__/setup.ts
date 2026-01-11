/**
 * Jest Test Setup
 * Runs before all tests to configure the test environment
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BACKEND_URL = 'http://localhost:5000';

// Disable logging during tests (uncomment to see logs)
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  ServiceLogger: {
    mercadopago: jest.fn(),
    whatsapp: jest.fn(),
    email: jest.fn(),
    googleCalendar: jest.fn(),
    reminder: jest.fn(),
    payment: jest.fn(),
  },
  logError: jest.fn(),
  logCritical: jest.fn(),
}));

// Disable Sentry in tests
jest.mock('../config/sentry.config', () => ({
  initializeSentry: jest.fn(),
  captureError: jest.fn(),
  captureMessage: jest.fn(),
  setUserContext: jest.fn(),
  clearUserContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  startSpan: jest.fn(),
  setupExpressErrorHandler: jest.fn(),
  setupExpressErrorCatcher: jest.fn(),
  closeSentry: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);
