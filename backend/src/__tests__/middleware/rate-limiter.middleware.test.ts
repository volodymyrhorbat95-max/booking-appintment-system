// ============================================
// RATE LIMITER MIDDLEWARE TESTS
// CRITICAL: Protects against brute force and DoS attacks
// ============================================

import { Request, Response, NextFunction } from 'express';
import {
  rateLimiter,
  authRateLimiter,
  bookingRateLimiter,
  publicRateLimiter,
  webhookRateLimiter
} from '../../middleware/rate-limiter.middleware';

describe('Rate Limiter Middleware', () => {
  let mockRequest: any; // Use any to allow mutation of readonly properties in tests
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseData: any;

  beforeEach(() => {
    mockRequest = {
      ip: '192.168.1.100',
      path: '/api/test',
      socket: {
        remoteAddress: '192.168.1.100'
      }
    };

    responseData = {};

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      }),
      setHeader: jest.fn()
    };

    mockNext = jest.fn();

    // Clear the rate limiter store before each test
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('General Rate Limiter (100 req/min)', () => {
    it('should allow requests within rate limit', () => {
      // Make 50 requests (within 100 req/min limit)
      for (let i = 0; i < 50; i++) {
        jest.clearAllMocks();
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding rate limit', () => {
      // Make 101 requests (exceeds 100 req/min limit)
      for (let i = 0; i < 100; i++) {
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      jest.clearAllMocks();

      // 101st request should be blocked
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter: expect.any(Number)
      });
    });

    it('should set rate limit headers on successful requests', () => {
      // Use unique IP and path to avoid interference from other tests
      mockRequest.ip = '10.0.0.1';
      mockRequest.path = '/api/unique-path-1';

      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should set rate limit headers when limit exceeded', () => {
      // Make 101 requests
      for (let i = 0; i < 101; i++) {
        jest.clearAllMocks();
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });

    it('should reset counter after time window', () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      jest.clearAllMocks();

      // 101st request should be blocked
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);

      jest.clearAllMocks();

      // Advance time by 60 seconds (1 minute window)
      jest.advanceTimersByTime(60 * 1000);

      // Next request should be allowed (counter reset)
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should track requests per IP address', () => {
      // Make 50 requests from IP 1
      mockRequest.ip = '192.168.1.100';
      for (let i = 0; i < 50; i++) {
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      jest.clearAllMocks();

      // Make 50 requests from IP 2 (different IP should have separate counter)
      mockRequest.ip = '192.168.1.200';
      for (let i = 0; i < 50; i++) {
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(50);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should track requests per path', () => {
      // Make 50 requests to /api/test
      mockRequest.path = '/api/test';
      for (let i = 0; i < 50; i++) {
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      jest.clearAllMocks();

      // Make 50 requests to /api/other (different path should have separate counter)
      mockRequest.path = '/api/other';
      for (let i = 0; i < 50; i++) {
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(50);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should use remoteAddress if IP is not available', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '192.168.1.150' } as any;

      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle unknown IP address', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: undefined } as any;

      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Auth Rate Limiter (10 req/min)', () => {
    it('should allow 10 login attempts per minute', () => {
      mockRequest.path = '/api/auth/login';

      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block 11th login attempt (brute force protection)', () => {
      mockRequest.path = '/api/auth/login';

      for (let i = 0; i < 11; i++) {
        jest.clearAllMocks();
        authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(responseData.error).toBe('Too many login attempts, please try again in a minute');
    });

    it('should reset after 1 minute to allow new login attempts', () => {
      mockRequest.path = '/api/auth/login';

      // Make 10 login attempts (maximum allowed)
      for (let i = 0; i < 10; i++) {
        authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      jest.clearAllMocks();

      // 11th attempt should be blocked
      authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(429);

      // Advance time by 60 seconds
      jest.advanceTimersByTime(60 * 1000);
      jest.clearAllMocks();

      // Next attempt should be allowed
      authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Booking Rate Limiter (20 req/min)', () => {
    it('should allow 20 booking attempts per minute', () => {
      mockRequest.path = '/api/public/booking';

      for (let i = 0; i < 20; i++) {
        jest.clearAllMocks();
        bookingRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block 21st booking attempt (prevent booking spam)', () => {
      mockRequest.path = '/api/public/booking';

      for (let i = 0; i < 21; i++) {
        jest.clearAllMocks();
        bookingRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(responseData.error).toBe('Too many booking attempts, please try again later');
    });
  });

  describe('Public Rate Limiter (200 req/min)', () => {
    it('should allow 200 requests per minute for public pages', () => {
      mockRequest.path = '/api/public/professionals';

      for (let i = 0; i < 200; i++) {
        jest.clearAllMocks();
        publicRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block 201st request', () => {
      mockRequest.path = '/api/public/professionals';

      for (let i = 0; i < 201; i++) {
        jest.clearAllMocks();
        publicRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Webhook Rate Limiter (500 req/min)', () => {
    it('should allow 500 requests per minute for webhooks', () => {
      mockRequest.path = '/api/webhooks/mercadopago';

      for (let i = 0; i < 500; i++) {
        jest.clearAllMocks();
        webhookRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block 501st webhook request', () => {
      mockRequest.path = '/api/webhooks/mercadopago';

      for (let i = 0; i < 501; i++) {
        jest.clearAllMocks();
        webhookRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(responseData.error).toBe('Too many webhook requests');
    });
  });

  describe('Security: Attack Prevention', () => {
    it('should prevent distributed brute force attacks from same IP', () => {
      mockRequest.ip = '192.168.1.100';
      mockRequest.path = '/api/auth/login';

      // Attacker makes 11 login attempts from same IP
      for (let i = 0; i < 11; i++) {
        jest.clearAllMocks();
        authRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });

    it('should prevent slot booking spam attacks', () => {
      mockRequest.ip = '192.168.1.100';
      mockRequest.path = '/api/public/booking';

      // Attacker tries to book multiple slots rapidly
      for (let i = 0; i < 21; i++) {
        jest.clearAllMocks();
        bookingRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });

    it('should prevent API scraping attacks', () => {
      mockRequest.ip = '192.168.1.100';
      mockRequest.path = '/api/public/professionals';

      // Scraper makes excessive requests
      for (let i = 0; i < 201; i++) {
        jest.clearAllMocks();
        publicRateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Rate Limit Response Format', () => {
    it('should include retry-after time in response', () => {
      mockRequest.path = '/api/test';

      // Exceed rate limit
      for (let i = 0; i < 101; i++) {
        jest.clearAllMocks();
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(responseData).toHaveProperty('retryAfter');
      expect(typeof responseData.retryAfter).toBe('number');
      expect(responseData.retryAfter).toBeGreaterThan(0);
    });

    it('should provide remaining request count in headers', () => {
      // Use unique IP and path to avoid interference from other tests
      mockRequest.ip = '10.0.0.2';
      mockRequest.path = '/api/unique-path-2';

      // Make 1 request
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');

      jest.clearAllMocks();

      // Make another request
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '98');
    });
  });
});
