import crypto from 'crypto';
import { logger } from './logger';

/**
 * ENCRYPTION UTILITY - AES-256-GCM
 *
 * Purpose: Encrypt sensitive data before storing in database
 * - Google OAuth refresh tokens
 * - Patient email addresses
 * - Patient WhatsApp phone numbers
 *
 * Security Requirements (Section 13.2):
 * - "Sensitive data must be encrypted"
 * - "No passwords or credentials stored in visible code"
 *
 * Algorithm: AES-256-GCM (Galois/Counter Mode)
 * - Provides both encryption and authentication
 * - Detects tampering attempts
 * - Industry standard for sensitive data encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for AES
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM auth tag
const KEY_LENGTH = 32; // 256 bits for AES-256

/**
 * Get encryption key from environment variable
 * Must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is not set. ' +
      'This is required to encrypt sensitive data (Google tokens, patient PII). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Validate key format
  if (!/^[a-f0-9]{64}$/i.test(keyHex)) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes). ' +
      `Current length: ${keyHex.length} characters. ` +
      'Generate a valid key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  const key = Buffer.from(keyHex, 'hex');

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes. ` +
      `Current: ${key.length} bytes.`
    );
  }

  return key;
}

// Validate key on module load
const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt a string value using AES-256-GCM
 *
 * @param plaintext - The sensitive data to encrypt
 * @returns Encrypted string in format: "iv:authTag:ciphertext" (all hex-encoded)
 *
 * @example
 * const encrypted = encrypt("user@example.com");
 * // Returns: "a3f8e2b1c9d4f5e6a7b8c9d0e1f2a3b4:1234567890abcdef1234567890abcdef:9f8e7d6c5b4a3..."
 */
export function encrypt(plaintext: string): string {
  try {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty or null value');
    }

    // Generate random IV (Initialization Vector) for each encryption
    // This ensures the same plaintext encrypts to different ciphertext each time
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (for GCM mode)
    // This allows detection of tampering
    const authTag = cipher.getAuthTag();

    // Return format: "iv:authTag:ciphertext" (all hex-encoded)
    // This format allows us to store everything in a single database field
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error: any) {
    logger.error('[Encryption] Error encrypting data:', error.message);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt a string value that was encrypted with encrypt()
 *
 * @param encryptedData - Encrypted string in format "iv:authTag:ciphertext"
 * @returns Original plaintext string
 *
 * @throws Error if decryption fails (wrong key, tampered data, invalid format)
 *
 * @example
 * const decrypted = decrypt("a3f8e2b1c9d4f5e6a7b8c9d0e1f2a3b4:1234567890abcdef:9f8e7d6c5b4a3...");
 * // Returns: "user@example.com"
 */
export function decrypt(encryptedData: string): string {
  try {
    if (!encryptedData) {
      throw new Error('Cannot decrypt empty or null value');
    }

    // Parse the encrypted data format: "iv:authTag:ciphertext"
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error(
        `Invalid encrypted data format. Expected "iv:authTag:ciphertext", got ${parts.length} parts`
      );
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Validate component lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: ${iv.length} bytes, expected ${IV_LENGTH}`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: ${authTag.length} bytes, expected ${AUTH_TAG_LENGTH}`);
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    // Set authentication tag
    // This will cause decryption to fail if data has been tampered with
    decipher.setAuthTag(authTag);

    // Decrypt the ciphertext
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    // Log error but don't expose encryption key or sensitive details
    logger.error('[Encryption] Error decrypting data:', {
      error: error.message,
      // Don't log the actual encrypted data as it might be sensitive
    });

    // Throw a generic error to prevent information leakage
    throw new Error('Decryption failed: data may be corrupted or tampered with');
  }
}

/**
 * Check if a string appears to be encrypted data
 * Useful for migration scenarios where some data might already be encrypted
 *
 * @param value - String to check
 * @returns true if value matches encrypted data format
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Check format: "hexstring:hexstring:hexstring"
  const parts = value.split(':');
  if (parts.length !== 3) {
    return false;
  }

  // Verify all parts are valid hex strings
  const hexRegex = /^[a-f0-9]+$/i;
  return parts.every(part => hexRegex.test(part));
}

/**
 * Safely encrypt data for database storage
 * If data is already encrypted, returns it unchanged
 * Useful during migration period
 *
 * @param value - Data to encrypt
 * @returns Encrypted data
 */
export function safeEncrypt(value: string): string {
  if (!value) {
    return value;
  }

  // If already encrypted, don't double-encrypt
  if (isEncrypted(value)) {
    logger.warn('[Encryption] Attempted to encrypt already-encrypted data');
    return value;
  }

  return encrypt(value);
}

/**
 * Safely decrypt data from database
 * If data is not encrypted (plaintext), returns it unchanged
 * Useful during migration period
 *
 * @param value - Data to decrypt
 * @returns Decrypted data or original plaintext
 */
export function safeDecrypt(value: string): string {
  if (!value) {
    return value;
  }

  // If not encrypted (plaintext), return as-is
  if (!isEncrypted(value)) {
    logger.warn('[Encryption] Attempted to decrypt plaintext data - may indicate incomplete migration');
    return value;
  }

  return decrypt(value);
}

/**
 * Generate a new encryption key
 * This is a utility function for key generation
 * Should NOT be used in production code - keys must come from environment
 *
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Create a SHA-256 hash of a value for indexing/lookup
 * Used for searching encrypted data (e.g., WhatsApp numbers)
 *
 * @param value - The value to hash
 * @returns SHA-256 hash as hex string
 *
 * @example
 * const hash = hashForLookup("+541112345678");
 * // Returns: "a3f8e2b1c9d4f5e6a7b8c9d0e1f2a3b4..."
 */
export function hashForLookup(value: string): string {
  if (!value) {
    throw new Error('Cannot hash empty or null value');
  }

  // Normalize the value (trim, lowercase)
  const normalized = value.trim().toLowerCase();

  // Create SHA-256 hash
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Test the encryption/decryption cycle
 * Useful for startup validation
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-encryption-' + Date.now();
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    if (decrypted !== testData) {
      throw new Error('Encryption/decryption cycle failed');
    }

    return true;
  } catch (error: any) {
    logger.error('[Encryption] Self-test failed:', error.message);
    return false;
  }
}

// Run self-test on module load to catch configuration issues early
if (process.env.NODE_ENV !== 'test') {
  const testResult = testEncryption();
  if (!testResult) {
    throw new Error(
      'CRITICAL: Encryption self-test failed. Check ENCRYPTION_KEY configuration.'
    );
  }
  logger.info('[Encryption] Encryption utility initialized successfully');
}
