// ============================================
// SANITIZE UTILITY TESTS
// CRITICAL: Prevents leaking sensitive data (tokens, passwords) to clients
// ============================================

import {
  sanitizeProfessional,
  sanitizeUser,
  sanitizeResponse,
  professionalSelectSafe,
  userSelectSafe
} from '../../utils/sanitize';

describe('Sanitize Utilities', () => {
  describe('sanitizeProfessional', () => {
    it('should remove googleRefreshToken from professional', () => {
      const professional = {
        id: 'prof_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        googleRefreshToken: 'secret_refresh_token'
      };

      const sanitized = sanitizeProfessional(professional);

      expect(sanitized).toBeDefined();
      expect(sanitized).not.toHaveProperty('googleRefreshToken');
      // Note: We only store googleRefreshToken (not access tokens) as per OAuth2 best practices
      expect(sanitized?.firstName).toBe('John');
      expect(sanitized?.email).toBe('john@example.com');
    });

    it('should keep all non-sensitive fields', () => {
      const professional = {
        id: 'prof_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        slug: 'dr-john-doe',
        phone: '1234567890',
        isActive: true,
        googleRefreshToken: 'secret_token'
      };

      const sanitized = sanitizeProfessional(professional);

      expect(sanitized?.id).toBe('prof_123');
      expect(sanitized?.firstName).toBe('John');
      expect(sanitized?.lastName).toBe('Doe');
      expect(sanitized?.email).toBe('john@example.com');
      expect(sanitized?.slug).toBe('dr-john-doe');
      expect(sanitized?.phone).toBe('1234567890');
      expect(sanitized?.isActive).toBe(true);
    });

    it('should return null for null input', () => {
      const sanitized = sanitizeProfessional(null);

      expect(sanitized).toBeNull();
    });

    it('should return null for undefined input', () => {
      const sanitized = sanitizeProfessional(undefined);

      expect(sanitized).toBeNull();
    });

    it('should handle professional without sensitive fields', () => {
      const professional = {
        id: 'prof_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const sanitized = sanitizeProfessional(professional);

      expect(sanitized).toEqual(professional);
    });

    it('should not mutate original object', () => {
      const professional = {
        id: 'prof_123',
        firstName: 'John',
        googleRefreshToken: 'secret_token'
      };

      const originalToken = professional.googleRefreshToken;
      sanitizeProfessional(professional);

      // Original should still have the token
      expect(professional.googleRefreshToken).toBe(originalToken);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password from user', () => {
      const user = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'John Doe',
        password: 'hashed_password_should_never_be_exposed'
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized).toBeDefined();
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized?.email).toBe('user@example.com');
      expect(sanitized?.name).toBe('John Doe');
    });

    it('should keep all non-sensitive fields', () => {
      const user = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'ADMIN',
        createdAt: new Date('2026-01-01'),
        password: 'hashed_password'
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized?.id).toBe('user_123');
      expect(sanitized?.email).toBe('user@example.com');
      expect(sanitized?.name).toBe('John Doe');
      expect(sanitized?.role).toBe('ADMIN');
      expect(sanitized?.createdAt).toEqual(new Date('2026-01-01'));
    });

    it('should return null for null input', () => {
      const sanitized = sanitizeUser(null);

      expect(sanitized).toBeNull();
    });

    it('should return null for undefined input', () => {
      const sanitized = sanitizeUser(undefined);

      expect(sanitized).toBeNull();
    });

    it('should handle user without password field', () => {
      const user = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'John Doe'
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized).toEqual(user);
    });

    it('should not mutate original object', () => {
      const user = {
        id: 'user_123',
        email: 'user@example.com',
        password: 'hashed_password'
      };

      const originalPassword = user.password;
      sanitizeUser(user);

      // Original should still have the password
      expect(user.password).toBe(originalPassword);
    });
  });

  describe('sanitizeResponse', () => {
    it('should remove sensitive fields from nested objects', () => {
      const response = {
        success: true,
        data: {
          professional: {
            id: 'prof_123',
            firstName: 'John',
            googleRefreshToken: 'secret_token'
          }
        }
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.data.professional).not.toHaveProperty('googleRefreshToken');
      expect(sanitized?.data.professional.firstName).toBe('John');
    });

    it('should remove password from nested user objects', () => {
      const response = {
        user: {
          id: 'user_123',
          email: 'user@example.com',
          password: 'hashed_password'
        },
        token: 'jwt_token'
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.user).not.toHaveProperty('password');
      expect(sanitized?.user.email).toBe('user@example.com');
      expect(sanitized?.token).toBe('jwt_token');
    });

    it('should sanitize arrays of objects', () => {
      const response = {
        professionals: [
          {
            id: 'prof_1',
            name: 'John',
            googleRefreshToken: 'token_1'
          },
          {
            id: 'prof_2',
            name: 'Jane',
            googleRefreshToken: 'token_2'
          }
        ]
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.professionals[0]).not.toHaveProperty('googleRefreshToken');
      expect(sanitized?.professionals[1]).not.toHaveProperty('googleRefreshToken');
      expect(sanitized?.professionals[0].name).toBe('John');
      expect(sanitized?.professionals[1].name).toBe('Jane');
    });

    it('should handle deeply nested objects', () => {
      const response = {
        level1: {
          level2: {
            level3: {
              professional: {
                id: 'prof_123',
                googleRefreshToken: 'deep_secret'
              }
            }
          }
        }
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.level1.level2.level3.professional).not.toHaveProperty('googleRefreshToken');
      expect(sanitized?.level1.level2.level3.professional.id).toBe('prof_123');
    });

    it('should handle mixed nested structures (objects and arrays)', () => {
      const response = {
        users: [
          {
            id: 'user_1',
            password: 'hash_1',
            professionals: [
              {
                id: 'prof_1',
                googleRefreshToken: 'token_1'
              }
            ]
          }
        ]
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.users[0]).not.toHaveProperty('password');
      expect(sanitized?.users[0].professionals[0]).not.toHaveProperty('googleRefreshToken');
      expect(sanitized?.users[0].id).toBe('user_1');
    });

    it('should return null for null input', () => {
      const sanitized = sanitizeResponse(null);

      expect(sanitized).toBeNull();
    });

    it('should return null for undefined input', () => {
      const sanitized = sanitizeResponse(undefined);

      expect(sanitized).toBeNull();
    });

    it('should handle empty objects', () => {
      const response = {};

      const sanitized = sanitizeResponse(response);

      expect(sanitized).toEqual({});
    });

    it('should handle primitives in arrays', () => {
      const response = {
        numbers: [1, 2, 3],
        strings: ['a', 'b', 'c']
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.numbers).toEqual([1, 2, 3]);
      expect(sanitized?.strings).toEqual(['a', 'b', 'c']);
    });

    it('should not mutate original object', () => {
      const response = {
        professional: {
          id: 'prof_123',
          googleRefreshToken: 'secret_token'
        }
      };

      const originalToken = response.professional.googleRefreshToken;
      sanitizeResponse(response);

      // Original should still have the token
      expect(response.professional.googleRefreshToken).toBe(originalToken);
    });
  });

  describe('Security: Sensitive Data Leakage Prevention', () => {
    it('should prevent OAuth token leakage in API responses', () => {
      const apiResponse = {
        success: true,
        data: {
          professional: {
            id: 'prof_123',
            firstName: 'John',
            lastName: 'Doe',
            googleRefreshToken: '1//secret_refresh_token_very_long'
          }
        }
      };

      const sanitized = sanitizeResponse(apiResponse);

      // OAuth refresh tokens could allow attackers to access Google Calendar
      // Note: We only store googleRefreshToken (not access tokens) as per OAuth2 best practices
      expect(sanitized?.data.professional).not.toHaveProperty('googleRefreshToken');
    });

    it('should prevent password hash leakage in login response', () => {
      const loginResponse = {
        success: true,
        user: {
          id: 'user_123',
          email: 'user@example.com',
          password: '$2a$12$hashed_password_bcrypt',
          role: 'ADMIN'
        },
        token: 'jwt_token_here'
      };

      const sanitized = sanitizeResponse(loginResponse);

      // Password hash could be used for offline cracking
      expect(sanitized?.user).not.toHaveProperty('password');
      expect(sanitized?.user.email).toBe('user@example.com');
      expect(sanitized?.token).toBe('jwt_token_here');
    });

    it('should prevent sensitive data in error responses', () => {
      const errorResponse = {
        success: false,
        error: 'Authentication failed',
        debug: {
          user: {
            id: 'user_123',
            email: 'user@example.com',
            password: 'should_not_be_here'
          }
        }
      };

      const sanitized = sanitizeResponse(errorResponse);

      expect(sanitized?.debug.user).not.toHaveProperty('password');
    });

    it('should prevent token leakage in list responses', () => {
      const listResponse = {
        professionals: [
          {
            id: 'prof_1',
            name: 'John',
            googleRefreshToken: 'token_1'
          },
          {
            id: 'prof_2',
            name: 'Jane',
            googleRefreshToken: 'token_2'
          }
        ],
        total: 2
      };

      const sanitized = sanitizeResponse(listResponse);

      expect(sanitized?.professionals[0]).not.toHaveProperty('googleRefreshToken');
      expect(sanitized?.professionals[1]).not.toHaveProperty('googleRefreshToken');
    });
  });

  describe('Prisma Select Objects', () => {
    it('professionalSelectSafe should not include sensitive fields', () => {
      expect(professionalSelectSafe).toHaveProperty('id', true);
      expect(professionalSelectSafe).toHaveProperty('firstName', true);
      // Verify sensitive fields are not included
      expect(professionalSelectSafe).not.toHaveProperty('googleRefreshToken');
      // Note: We only store googleRefreshToken (not access tokens) as per OAuth2 best practices
    });

    it('userSelectSafe should not include password', () => {
      expect(userSelectSafe).toHaveProperty('id', true);
      expect(userSelectSafe).toHaveProperty('email', true);
      expect(userSelectSafe).toHaveProperty('role', true);
      expect(userSelectSafe).not.toHaveProperty('password');
    });

    it('professionalSelectSafe should include necessary public fields', () => {
      expect(professionalSelectSafe).toHaveProperty('id', true);
      expect(professionalSelectSafe).toHaveProperty('firstName', true);
      expect(professionalSelectSafe).toHaveProperty('lastName', true);
      expect(professionalSelectSafe).toHaveProperty('slug', true);
      expect(professionalSelectSafe).toHaveProperty('isActive', true);
    });

    it('userSelectSafe should include necessary user fields', () => {
      expect(userSelectSafe).toHaveProperty('id', true);
      expect(userSelectSafe).toHaveProperty('email', true);
      expect(userSelectSafe).toHaveProperty('name', true);
      expect(userSelectSafe).toHaveProperty('role', true);
      expect(userSelectSafe).toHaveProperty('createdAt', true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle object with null values', () => {
      const response = {
        professional: {
          id: 'prof_123',
          firstName: null,
          googleRefreshToken: 'token'
        }
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.professional.firstName).toBeNull();
      expect(sanitized?.professional).not.toHaveProperty('googleRefreshToken');
    });

    it('should handle empty arrays', () => {
      const response = {
        professionals: []
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.professionals).toEqual([]);
    });

    it('should handle circular-reference-like structures', () => {
      const response = {
        user: {
          id: 'user_123',
          password: 'hash',
          professional: {
            id: 'prof_123',
            googleRefreshToken: 'token',
            userId: 'user_123'
          }
        }
      };

      const sanitized = sanitizeResponse(response);

      expect(sanitized?.user).not.toHaveProperty('password');
      expect(sanitized?.user.professional).not.toHaveProperty('googleRefreshToken');
      expect(sanitized?.user.professional.userId).toBe('user_123');
    });
  });
});
