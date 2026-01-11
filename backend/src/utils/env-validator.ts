/**
 * Environment Variable Validation
 *
 * This module validates that all required environment variables are properly configured
 * before the application starts. This prevents silent failures and ensures all critical
 * services are configured correctly.
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvValidationConfig {
  required: string[];
  requiredInProduction: string[];
  optional: string[];
}

const ENV_CONFIG: EnvValidationConfig = {
  // Always required (development and production)
  required: [
    'PORT',
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'FRONTEND_URL',
    'BACKEND_URL'
  ],

  // Required only in production
  requiredInProduction: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALENDAR_REDIRECT_URI',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_WHATSAPP_NUMBER',
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_PUBLIC_KEY',
    'MERCADOPAGO_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM'
  ],

  // Optional (with defaults or graceful degradation)
  optional: [
    'DEFAULT_TIMEZONE',
    'DEFAULT_COUNTRY_CODE',
    'DEPOSIT_TIME_LIMIT_MINUTES'
  ]
};

/**
 * Validate a single environment variable
 */
function validateEnvVar(name: string, value: string | undefined, isRequired: boolean): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  // Check if exists
  if (!value || value.trim() === '') {
    if (isRequired) {
      return {
        isValid: false,
        error: `Missing required environment variable: ${name}`
      };
    } else {
      return {
        isValid: true,
        warning: `Optional environment variable not set: ${name} (using default or graceful degradation)`
      };
    }
  }

  // Specific validations by variable
  switch (name) {
    case 'PORT':
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        return {
          isValid: false,
          error: `Invalid PORT: must be between 1 and 65535 (got: ${value})`
        };
      }
      break;

    case 'NODE_ENV':
      if (!['development', 'production', 'test'].includes(value)) {
        return {
          isValid: false,
          error: `Invalid NODE_ENV: must be 'development', 'production', or 'test' (got: ${value})`
        };
      }
      break;

    case 'DATABASE_URL':
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return {
          isValid: false,
          error: `Invalid DATABASE_URL: must start with 'postgresql://' or 'postgres://'`
        };
      }
      break;

    case 'JWT_SECRET':
      if (value.length < 32) {
        return {
          isValid: false,
          error: `JWT_SECRET is too short: must be at least 32 characters (got: ${value.length})`
        };
      }
      if (process.env.NODE_ENV === 'production' && value.includes('change-in-production')) {
        return {
          isValid: false,
          error: `JWT_SECRET contains default value in production - this is a security risk!`
        };
      }
      break;

    case 'ENCRYPTION_KEY':
      // SECURITY FIX: Validate encryption key format
      // Must be exactly 64 hexadecimal characters (32 bytes for AES-256)
      if (!/^[a-f0-9]{64}$/i.test(value)) {
        return {
          isValid: false,
          error: `ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes). Got: ${value.length} characters. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
        };
      }
      if (process.env.NODE_ENV === 'production' && value.includes('your-64-character')) {
        return {
          isValid: false,
          error: `ENCRYPTION_KEY contains default value in production - this is a CRITICAL security risk!`
        };
      }
      break;

    case 'FRONTEND_URL':
    case 'BACKEND_URL':
    case 'GOOGLE_CALENDAR_REDIRECT_URI':
      try {
        new URL(value);
      } catch {
        return {
          isValid: false,
          error: `Invalid ${name}: must be a valid URL (got: ${value})`
        };
      }
      break;

    case 'TWILIO_ACCOUNT_SID':
      if (!value.startsWith('AC')) {
        return {
          isValid: false,
          error: `Invalid TWILIO_ACCOUNT_SID: must start with 'AC' (got: ${value.substring(0, 10)}...)`
        };
      }
      break;

    case 'TWILIO_WHATSAPP_NUMBER':
      if (!value.startsWith('+')) {
        return {
          isValid: false,
          error: `Invalid TWILIO_WHATSAPP_NUMBER: must start with '+' country code (got: ${value})`
        };
      }
      break;

    case 'EMAIL_FROM':
      if (!value.includes('@')) {
        return {
          isValid: false,
          error: `Invalid EMAIL_FROM: must contain '@' symbol (got: ${value})`
        };
      }
      break;

    case 'DEPOSIT_TIME_LIMIT_MINUTES':
      const minutes = parseInt(value, 10);
      if (isNaN(minutes) || minutes < 5 || minutes > 1440) {
        return {
          isValid: false,
          error: `Invalid DEPOSIT_TIME_LIMIT_MINUTES: must be between 5 and 1440 (got: ${value})`
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Validate always-required variables
  for (const varName of ENV_CONFIG.required) {
    const result = validateEnvVar(varName, process.env[varName], true);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  // Validate production-required variables
  if (isProduction) {
    for (const varName of ENV_CONFIG.requiredInProduction) {
      const result = validateEnvVar(varName, process.env[varName], true);
      if (!result.isValid && result.error) {
        errors.push(result.error);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    }
  } else {
    // In development, warn about missing production variables
    for (const varName of ENV_CONFIG.requiredInProduction) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        warnings.push(`Production variable not set in development: ${varName} (some features may not work)`);
      }
    }
  }

  // Validate optional variables (only if provided)
  for (const varName of ENV_CONFIG.optional) {
    const value = process.env[varName];
    if (value && value.trim() !== '') {
      const result = validateEnvVar(varName, value, false);
      if (!result.isValid && result.error) {
        errors.push(result.error);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ ENVIRONMENT VALIDATION FAILED');
    console.error('='.repeat(80));
    console.error('\nErrors:');
    result.errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
    console.error('\n' + '='.repeat(80));
    console.error('Fix these errors before starting the application!');
    console.error('See backend/.env.example for configuration reference.');
    console.error('='.repeat(80) + '\n');
  }

  if (result.warnings.length > 0) {
    console.warn('\n' + '-'.repeat(80));
    console.warn('⚠️  ENVIRONMENT WARNINGS');
    console.warn('-'.repeat(80));
    result.warnings.forEach((warning, index) => {
      console.warn(`  ${index + 1}. ${warning}`);
    });
    console.warn('-'.repeat(80) + '\n');
  }

  if (result.isValid && result.errors.length === 0) {
    console.log('\n✅ Environment validation passed');
    if (result.warnings.length === 0) {
      console.log('✅ All environment variables configured correctly\n');
    } else {
      console.log('⚠️  Some optional variables are missing (see warnings above)\n');
    }
  }
}

/**
 * Validate environment and exit if invalid (for production safety)
 */
export function validateEnvironmentOrExit(): void {
  const result = validateEnvironment();
  printValidationResults(result);

  if (!result.isValid) {
    console.error('Application startup aborted due to environment validation errors.');
    process.exit(1);
  }
}
