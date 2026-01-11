/**
 * Environment Configuration Validation
 *
 * CRITICAL RULE: All configuration must come from .env files
 * NO hardcoded fallback values allowed
 *
 * This file validates and exports all environment variables used by the frontend.
 * If a required variable is missing, the application will fail immediately with
 * a clear error message instead of silently using incorrect values.
 */

interface EnvironmentConfig {
  apiUrl: string;
  googleClientId: string;
  defaultCountryCode: string;
  defaultTimezone: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Validate that a required environment variable is set
 */
function getRequiredEnvVar(key: string, envValue: string | undefined): string {
  if (!envValue || envValue.trim() === '') {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Required environment variable '${key}' is not set.\n\n` +
      `Please check your .env file and ensure ${key} is properly configured.\n` +
      `See frontend/.env.example for reference.\n\n` +
      `Current environment: ${import.meta.env.MODE}`
    );
  }
  return envValue.trim();
}

/**
 * Get optional environment variable with a safe default
 */
function getOptionalEnvVar(key: string, envValue: string | undefined, defaultValue: string): string {
  if (!envValue || envValue.trim() === '') {
    console.warn(`[Config] Optional environment variable '${key}' not set, using default: ${defaultValue}`);
    return defaultValue;
  }
  return envValue.trim();
}

/**
 * Validate and export all environment variables
 *
 * This runs once when the application starts.
 * If validation fails, the app will not start.
 */
function validateAndLoadEnvironment(): EnvironmentConfig {
  // CRITICAL: API URL must be set - no fallback allowed
  const apiUrl = getRequiredEnvVar('VITE_API_URL', import.meta.env.VITE_API_URL);

  // Validate API URL format
  try {
    new URL(apiUrl);
  } catch {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: VITE_API_URL is not a valid URL.\n\n` +
      `Got: "${apiUrl}"\n` +
      `Expected format: http://localhost:5000/api or https://yourdomain.com/api\n\n` +
      `Please fix your .env file.`
    );
  }

  // Google Client ID - required for professional login, but allow empty in development
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  if (import.meta.env.PROD && !googleClientId) {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: VITE_GOOGLE_CLIENT_ID is required in production.\n\n` +
      `Professional login will not work without Google OAuth configured.\n` +
      `Please add VITE_GOOGLE_CLIENT_ID to your .env file.`
    );
  }

  // Optional settings with safe defaults
  const defaultCountryCode = getOptionalEnvVar(
    'VITE_DEFAULT_COUNTRY_CODE',
    import.meta.env.VITE_DEFAULT_COUNTRY_CODE,
    '+54'
  );

  const defaultTimezone = getOptionalEnvVar(
    'VITE_DEFAULT_TIMEZONE',
    import.meta.env.VITE_DEFAULT_TIMEZONE,
    'America/Argentina/Buenos_Aires'
  );

  return {
    apiUrl,
    googleClientId,
    defaultCountryCode,
    defaultTimezone,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD
  };
}

// Run validation and export config
// This will throw an error and prevent app startup if validation fails
export const ENV = validateAndLoadEnvironment();

// Log configuration on startup (only in development)
if (ENV.isDevelopment) {
  console.log('[Config] Environment configuration loaded:', {
    apiUrl: ENV.apiUrl,
    googleClientId: ENV.googleClientId ? '***configured***' : 'NOT SET',
    defaultCountryCode: ENV.defaultCountryCode,
    defaultTimezone: ENV.defaultTimezone,
    mode: import.meta.env.MODE
  });
}
