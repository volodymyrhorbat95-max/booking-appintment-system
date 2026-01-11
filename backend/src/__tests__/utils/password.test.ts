// ============================================
// PASSWORD UTILITY TESTS
// CRITICAL: Password hashing/verification is the foundation of authentication
// ============================================

import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  needsRehash,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH
} from '../../utils/password';

describe('Password Utilities', () => {
  describe('validatePasswordStrength', () => {
    it('should accept a strong password', () => {
      const result = validatePasswordStrength('SecurePass123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePasswordStrength('Abc123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password that is too long', () => {
      const longPassword = 'A' + 'a'.repeat(PASSWORD_MAX_LENGTH);
      const result = validatePasswordStrength(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('PasswordOnly');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for very weak password', () => {
      const result = validatePasswordStrength('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should accept password with special characters', () => {
      const result = validatePasswordStrength('SecureP@ss123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept password at minimum length', () => {
      const result = validatePasswordStrength('Secure12');

      expect(result.isValid).toBe(true);
    });

    it('should accept password at maximum length', () => {
      const maxLengthPassword = 'Aa1' + 'b'.repeat(PASSWORD_MAX_LENGTH - 3);
      const result = validatePasswordStrength(maxLengthPassword);

      expect(result.isValid).toBe(true);
    });
  });

  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password); // Hash should be different from plaintext
      expect(hash.length).toBeGreaterThan(20); // bcrypt hashes are typically 60 characters
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'SecurePass123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // bcrypt uses random salt, so same password should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should reject weak password', async () => {
      const weakPassword = 'weak';

      await expect(hashPassword(weakPassword)).rejects.toThrow('Invalid password');
    });

    it('should reject password without uppercase', async () => {
      const password = 'lowercase123';

      await expect(hashPassword(password)).rejects.toThrow('Invalid password');
    });

    it('should reject password without lowercase', async () => {
      const password = 'UPPERCASE123';

      await expect(hashPassword(password)).rejects.toThrow('Invalid password');
    });

    it('should reject password without number', async () => {
      const password = 'PasswordOnly';

      await expect(hashPassword(password)).rejects.toThrow('Invalid password');
    });

    it('should start with bcrypt version identifier', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should include salt rounds in hash', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      // bcrypt hash format: $2a$12$... (12 is the salt rounds)
      expect(hash).toMatch(/^\$2[aby]\$12\$/);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'SecurePass123';
      const wrongPassword = 'WrongPass456';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for slightly modified password', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      // Change one character
      const similarPassword = 'SecurePass124';
      const isMatch = await comparePassword(similarPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword('securepass123', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle whitespace correctly', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      // Extra space should not match
      const isMatch = await comparePassword('SecurePass123 ', hash);

      expect(isMatch).toBe(false);
    });

    it('should work with passwords containing special characters', async () => {
      const password = 'Secure@P@ss#123!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should work with passwords containing unicode', async () => {
      const password = 'Sëcüré123Pàss';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });
  });

  describe('needsRehash', () => {
    it('should return false for recently hashed password', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      const needsUpdate = needsRehash(hash);

      expect(needsUpdate).toBe(false);
    });

    it('should handle invalid hash gracefully', () => {
      const invalidHash = 'not-a-valid-bcrypt-hash';

      const needsUpdate = needsRehash(invalidHash);

      // bcrypt.getRounds returns 0 for invalid hash
      // The function checks if rounds < SALT_ROUNDS, which would be true for 0
      // But bcrypt throws error, caught by try-catch, returns false
      expect(typeof needsUpdate).toBe('boolean');
    });

    it('should return true for hash with lower salt rounds', () => {
      // Mock a hash with 10 rounds (lower than current 12)
      const oldHash = '$2a$10$abcdefghijklmnopqrstuuvwxyz1234567890ABCDEFGHIJK';

      const needsUpdate = needsRehash(oldHash);

      expect(needsUpdate).toBe(true);
    });

    it('should handle empty hash gracefully', () => {
      const needsUpdate = needsRehash('');

      // Empty hash causes bcrypt.getRounds to throw, caught by try-catch
      expect(typeof needsUpdate).toBe('boolean');
    });
  });

  describe('Security: Timing Attack Resistance', () => {
    it('should take similar time for correct vs incorrect password', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);
      const wrongPassword = 'WrongPass456';

      // Time correct password comparison
      const start1 = Date.now();
      await comparePassword(password, hash);
      const duration1 = Date.now() - start1;

      // Time incorrect password comparison
      const start2 = Date.now();
      await comparePassword(wrongPassword, hash);
      const duration2 = Date.now() - start2;

      // Both should take approximately the same time (within 50ms)
      // bcrypt.compare is timing-safe by design, but system load can add variance
      const diff = Math.abs(duration1 - duration2);
      expect(diff).toBeLessThan(50);

      // Both should take reasonable time (bcrypt is intentionally slow)
      expect(duration1).toBeGreaterThan(50);
      expect(duration2).toBeGreaterThan(50);
    });
  });

  describe('Security: Password Attacks', () => {
    it('should prevent rainbow table attacks with salt', async () => {
      const password = 'CommonPassword123';

      // Hash the same password twice
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Different hashes mean different salts = rainbow table resistant
      expect(hash1).not.toBe(hash2);
    });

    it('should resist brute force with computational cost', async () => {
      const password = 'SecurePass123';

      // Measure time to hash (should be slow due to salt rounds)
      const start = Date.now();
      await hashPassword(password);
      const duration = Date.now() - start;

      // Should take at least 50ms (bcrypt with 12 rounds is intentionally slow)
      expect(duration).toBeGreaterThan(50);
    });

    it('should not leak information about password through hash length', async () => {
      const shortPassword = 'Short123';
      const longPassword = 'ThisIsAVeryLongPassword123WithManyCharacters';

      const hash1 = await hashPassword(shortPassword);
      const hash2 = await hashPassword(longPassword);

      // bcrypt hashes should be same length regardless of password length
      expect(hash1.length).toBe(hash2.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle password with only required characters', async () => {
      const password = 'Abcdef12'; // Minimum: 8 chars, uppercase, lowercase, number

      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should handle maximum length password', async () => {
      const password = 'Aa1' + 'b'.repeat(PASSWORD_MAX_LENGTH - 3);

      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should handle password with all special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()';

      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should handle password with spaces', async () => {
      const password = 'My Secure Pass 123';

      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should hash passwords at reasonable speed', async () => {
      const passwords = Array.from({ length: 10 }, (_, i) => `Password${i}123`);

      const start = Date.now();

      for (const password of passwords) {
        await hashPassword(password);
      }

      const duration = Date.now() - start;

      // 10 hashes should take less than 3 seconds (but more than 500ms due to salt rounds)
      expect(duration).toBeGreaterThan(500);
      expect(duration).toBeLessThan(3000);
    });

    it('should compare passwords at reasonable speed', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        await comparePassword(password, hash);
      }

      const duration = Date.now() - start;

      // 10 comparisons should be reasonably fast (< 3 seconds)
      // bcrypt is intentionally slow for security (prevent brute force)
      expect(duration).toBeLessThan(3000);
    });
  });
});
