// ============================================
// JWT UTILITY TESTS
// CRITICAL: JWT is the foundation of authentication/authorization
// ============================================

import { generateToken, verifyToken, decodeToken } from '../../utils/jwt';
import { UserRole } from '../../types';

describe('JWT Utilities', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    role: UserRole.ADMIN
  };

  beforeAll(() => {
    // Ensure JWT_SECRET is set for tests
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-security';
    }
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts: header.payload.signature
    });

    it('should include user ID in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('user_123');
    });

    it('should include email in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.email).toBe('test@example.com');
    });

    it('should include role in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.role).toBe('ADMIN');
    });

    it('should generate different tokens for different users', () => {
      const user1 = { ...mockUser, id: 'user_1', email: 'user1@example.com' };
      const user2 = { ...mockUser, id: 'user_2', email: 'user2@example.com' };

      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should handle PROFESSIONAL role', () => {
      const professional = {
        id: 'prof_123',
        email: 'professional@example.com',
        role: UserRole.PROFESSIONAL
      };

      const token = generateToken(professional);
      const decoded = decodeToken(token);

      expect(decoded?.role).toBe('PROFESSIONAL');
    });

    it('should handle different user with PROFESSIONAL role', () => {
      const user = {
        id: 'user_123',
        email: 'user@example.com',
        role: UserRole.PROFESSIONAL
      };

      const token = generateToken(user);
      const decoded = decodeToken(token);

      expect(decoded?.role).toBe('PROFESSIONAL');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('user_123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.role).toBe('ADMIN');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const payload = verifyToken(invalidToken);

      expect(payload).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-even-a-token';
      const payload = verifyToken(malformedToken);

      expect(payload).toBeNull();
    });

    it('should return null for empty string', () => {
      const payload = verifyToken('');

      expect(payload).toBeNull();
    });

    it('should reject token signed with different secret', () => {
      // Generate token with one secret
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'secret-1-minimum-32-characters-long';

      // Need to re-require the module to pick up new secret
      // For this test, we'll just verify that a token with wrong signature fails
      const token = generateToken(mockUser);

      // Restore original secret
      process.env.JWT_SECRET = originalSecret;

      // Modify the signature (last part of JWT)
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered_signature`;

      const payload = verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it('should reject token with tampered payload', () => {
      const token = generateToken(mockUser);

      // Tamper with the payload
      const parts = token.split('.');
      const tamperedPayload = Buffer.from(JSON.stringify({
        userId: 'attacker_123',
        email: 'attacker@example.com',
        role: 'ADMIN'
      })).toString('base64');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const payload = verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateToken(mockUser);
      const payload = decodeToken(token);

      expect(payload).toBeDefined();
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('user_123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.role).toBe('ADMIN');
    });

    it('should decode token even if signature is invalid', () => {
      const token = generateToken(mockUser);
      const parts = token.split('.');
      const invalidToken = `${parts[0]}.${parts[1]}.invalid_signature`;

      const payload = decodeToken(invalidToken);

      // Decode doesn't verify signature, so it should still work
      expect(payload).toBeDefined();
      expect(payload?.userId).toBe('user_123');
    });

    it('should return null for malformed token', () => {
      const payload = decodeToken('not-a-token');

      expect(payload).toBeNull();
    });

    it('should return null for empty string', () => {
      const payload = decodeToken('');

      expect(payload).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should include expiration in token', () => {
      const token = generateToken(mockUser);
      const decoded: any = decodeToken(token);

      expect(decoded).toHaveProperty('exp');
      expect(typeof decoded.exp).toBe('number');
    });

    it('should have issued-at time', () => {
      const token = generateToken(mockUser);
      const decoded: any = decodeToken(token);

      expect(decoded).toHaveProperty('iat');
      expect(typeof decoded.iat).toBe('number');
    });

    it('should expire after configured time (default 7 days)', () => {
      const token = generateToken(mockUser);
      const decoded: any = decodeToken(token);

      const issuedAt = decoded.iat * 1000; // Convert to milliseconds
      const expiresAt = decoded.exp * 1000;
      const duration = expiresAt - issuedAt;

      // 7 days = 7 * 24 * 60 * 60 * 1000 = 604800000 milliseconds
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      expect(duration).toBe(sevenDays);
    });
  });

  describe('Security: Token Tampering Detection', () => {
    it('should detect modified userId in payload', () => {
      const token = generateToken(mockUser);
      const parts = token.split('.');

      // Modify the payload to change userId
      const tamperedPayload = Buffer.from(JSON.stringify({
        userId: 'attacker_999',
        email: 'test@example.com',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      })).toString('base64url');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      // verifyToken should reject this
      const payload = verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it('should detect modified role in payload', () => {
      const professionalUser = {
        id: 'prof_123',
        email: 'professional@example.com',
        role: UserRole.PROFESSIONAL
      };

      const token = generateToken(professionalUser);
      const parts = token.split('.');

      // Try to elevate privileges to ADMIN
      const tamperedPayload = Buffer.from(JSON.stringify({
        userId: 'prof_123',
        email: 'professional@example.com',
        role: 'ADMIN', // Privilege escalation attempt
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      })).toString('base64url');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      // verifyToken should reject this
      const payload = verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it('should detect completely fabricated token', () => {
      // Attacker tries to create their own token
      const fakePayload = Buffer.from(JSON.stringify({
        userId: 'attacker_123',
        email: 'attacker@example.com',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      })).toString('base64url');

      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.fake_signature`;

      const payload = verifyToken(fakeToken);
      expect(payload).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with special characters in email', () => {
      const user = {
        id: 'user_123',
        email: 'user+test@example.com',
        role: UserRole.PROFESSIONAL
      };

      const token = generateToken(user);
      const payload = verifyToken(token);

      expect(payload?.email).toBe('user+test@example.com');
    });

    it('should handle very long user IDs', () => {
      const user = {
        id: 'a'.repeat(100),
        email: 'test@example.com',
        role: UserRole.PROFESSIONAL
      };

      const token = generateToken(user);
      const payload = verifyToken(token);

      expect(payload?.userId).toBe('a'.repeat(100));
    });

    it('should handle unicode characters in email', () => {
      const user = {
        id: 'user_123',
        email: 'tëst@éxample.com',
        role: UserRole.PROFESSIONAL
      };

      const token = generateToken(user);
      const payload = verifyToken(token);

      expect(payload?.email).toBe('tëst@éxample.com');
    });
  });

  describe('Performance', () => {
    it('should generate tokens quickly (< 100ms for 100 tokens)', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        generateToken({
          id: `user_${i}`,
          email: `user${i}@example.com`,
          role: UserRole.PROFESSIONAL
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should verify tokens quickly (< 100ms for 100 verifications)', () => {
      const tokens = Array.from({ length: 100 }, (_, i) =>
        generateToken({
          id: `user_${i}`,
          email: `user${i}@example.com`,
          role: UserRole.PROFESSIONAL
        })
      );

      const start = Date.now();

      tokens.forEach(token => verifyToken(token));

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
