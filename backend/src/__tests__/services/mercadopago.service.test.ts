/**
 * Unit Tests for Mercado Pago Webhook Handler
 * Tests the critical payment webhook processing logic
 */

// Mock Mercado Pago SDK FIRST (before any imports)
const mockPaymentGet = jest.fn();
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({})),
  Payment: jest.fn().mockImplementation(() => ({
    get: mockPaymentGet,
  })),
}));

// Mock Prisma client SECOND
const mockPrisma: any = {
  webhookEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  subscriptionPlan: {
    findUnique: jest.fn(),
  },
  subscription: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    create: jest.fn(),
  },
  appointment: {
    update: jest.fn(),
  },
  professional: {
    update: jest.fn(),
  },
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true,
}));

// NOW import the service (after mocks are defined)
import { handleWebhook } from '../../services/mercadopago.service';

describe('MercadoPago Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Non-payment webhooks', () => {
    it('should ignore non-payment webhook types', async () => {
      const webhookData = {
        type: 'subscription',
        action: 'created',
        data: { id: 'sub_123' },
      };

      const result = await handleWebhook(webhookData, {});

      expect(result).toEqual({
        success: true,
        message: 'Ignored non-payment webhook',
      });
    });
  });

  describe('Missing required identifiers', () => {
    it('should fail when paymentId is missing', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.created',
        data: { id: '' },
      };

      const result = await handleWebhook(webhookData, {
        'x-request-id': 'req_123',
      });

      expect(result).toEqual({
        success: false,
        error: 'Missing required identifiers',
      });
    });

    it('should fail when requestId is missing', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.created',
        data: { id: 'payment_123' },
      };

      const result = await handleWebhook(webhookData, {});

      expect(result).toEqual({
        success: false,
        error: 'Missing required identifiers',
      });
    });
  });

  describe('Idempotency protection', () => {
    it('should return cached response for duplicate webhooks', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.created',
        data: { id: 'payment_123' },
      };

      const headers = {
        'x-request-id': 'req_123',
        'x-signature': 'sig_123',
      };

      // Mock existing webhook event (already processed)
      const existingEvent = {
        id: 'event_123',
        paymentId: 'payment_123',
        requestId: 'req_123',
        eventType: 'payment',
        status: 'processed',
        processedAt: new Date('2026-01-10T10:00:00Z'),
        requestBody: JSON.stringify(webhookData),
        requestHeaders: JSON.stringify(headers),
        responseBody: JSON.stringify({ success: true }),
        errorMessage: null,
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue(existingEvent);

      const result = await handleWebhook(webhookData, headers);

      expect(result).toEqual({
        success: true,
        message: 'Webhook already processed (idempotent)',
        processedAt: existingEvent.processedAt,
      });

      // Should NOT fetch payment from Mercado Pago API
      expect(mockPaymentGet).not.toHaveBeenCalled();

      // Should check for existing webhook event
      expect(mockPrisma.webhookEvent.findUnique).toHaveBeenCalledWith({
        where: {
          paymentId_requestId: {
            paymentId: 'payment_123',
            requestId: 'req_123',
          },
        },
      });
    });
  });

  describe('Payment not found', () => {
    it('should fail and record error when payment not found in Mercado Pago', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.created',
        data: { id: 'payment_123' },
      };

      const headers = {
        'x-request-id': 'req_123',
      };

      // No existing webhook event
      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);

      // Payment not found in Mercado Pago
      mockPaymentGet.mockResolvedValue(null);

      // Mock webhook event creation
      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: 'event_123',
        paymentId: 'payment_123',
        requestId: 'req_123',
        eventType: 'payment',
        status: 'failed',
        requestBody: JSON.stringify(webhookData),
        requestHeaders: JSON.stringify(headers),
        responseBody: null,
        errorMessage: 'Payment not found in Mercado Pago',
        processedAt: new Date(),
      });

      const result = await handleWebhook(webhookData, headers);

      expect(result).toEqual({
        success: false,
        error: 'Payment not found in Mercado Pago',
      });

      // Should have tried to fetch payment
      expect(mockPaymentGet).toHaveBeenCalledWith({ id: 'payment_123' });

      // Should have recorded the error
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentId: 'payment_123',
          requestId: 'req_123',
          status: 'failed',
          errorMessage: 'Payment not found in Mercado Pago',
        }),
      });
    });
  });

  describe('Missing external_reference', () => {
    it('should fail when payment has no external_reference', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.created',
        data: { id: 'payment_123' },
      };

      const headers = {
        'x-request-id': 'req_123',
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);

      // Payment exists but has no external_reference
      mockPaymentGet.mockResolvedValue({
        id: 'payment_123',
        status: 'approved',
        external_reference: null,
      });

      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: 'event_123',
        paymentId: 'payment_123',
        requestId: 'req_123',
        eventType: 'payment',
        status: 'failed',
        requestBody: JSON.stringify(webhookData),
        requestHeaders: JSON.stringify(headers),
        responseBody: null,
        errorMessage: 'Payment has no external_reference',
        processedAt: new Date(),
      });

      const result = await handleWebhook(webhookData, headers);

      expect(result).toEqual({
        success: false,
        error: 'Payment has no external_reference',
      });
    });
  });

  describe('Safe JSON parsing', () => {
    it('should handle malformed JSON in external_reference gracefully', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.created',
        data: { id: 'payment_123' },
      };

      const headers = {
        'x-request-id': 'req_123',
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);

      // Payment with malformed external_reference
      mockPaymentGet.mockResolvedValue({
        id: 'payment_123',
        status: 'approved',
        external_reference: 'INVALID_JSON{{{',
      });

      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: 'event_123',
        paymentId: 'payment_123',
        requestId: 'req_123',
        eventType: 'payment',
        status: 'failed',
        requestBody: JSON.stringify(webhookData),
        requestHeaders: JSON.stringify(headers),
        responseBody: null,
        errorMessage: expect.stringContaining('Invalid JSON in external_reference'),
        processedAt: new Date(),
      });

      const result = await handleWebhook(webhookData, headers);

      expect(result).toEqual({
        success: false,
        error: 'Invalid external reference format',
      });

      // Should have recorded the error
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'failed',
          errorMessage: expect.stringContaining('Invalid JSON in external_reference'),
        }),
      });
    });
  });

  describe('Unknown payment type', () => {
    it('should handle unknown payment types', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.created',
        data: { id: 'payment_123' },
      };

      const headers = {
        'x-request-id': 'req_123',
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);

      // Payment with unknown type
      mockPaymentGet.mockResolvedValue({
        id: 'payment_123',
        status: 'approved',
        external_reference: JSON.stringify({
          type: 'unknown_type',
          data: 'something',
        }),
      });

      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: 'event_123',
        paymentId: 'payment_123',
        requestId: 'req_123',
        eventType: 'payment',
        status: 'failed',
        requestBody: JSON.stringify(webhookData),
        requestHeaders: JSON.stringify(headers),
        responseBody: JSON.stringify({ success: false, error: 'Unknown payment type' }),
        errorMessage: 'Unknown payment type',
        processedAt: new Date(),
      });

      const result = await handleWebhook(webhookData, headers);

      expect(result).toEqual({
        success: false,
        error: 'Unknown payment type',
      });
    });
  });

  describe('Subscription payment - approved status', () => {
    it('should activate subscription when payment is approved', async () => {
      const webhookData = {
        type: 'payment',
        action: 'payment.updated',
        data: { id: 'payment_123' },
      };

      const headers = {
        'x-request-id': 'req_123',
      };

      const plan = {
        id: 'plan_123',
        name: 'Plan Profesional',
        monthlyPrice: 5000,
        annualPrice: 50000,
      };

      const subscription = {
        id: 'sub_123',
        professionalId: 'prof_123',
        planId: 'plan_123',
        status: 'ACTIVE',
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);

      mockPaymentGet.mockResolvedValue({
        id: 'payment_123',
        status: 'approved',
        transaction_amount: 5000,
        external_reference: JSON.stringify({
          type: 'subscription',
          professionalId: 'prof_123',
          planId: 'plan_123',
          billingPeriod: 'MONTHLY',
        }),
      });

      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(plan);
      mockPrisma.subscription.findUnique.mockResolvedValue(null); // No existing subscription
      mockPrisma.subscription.create.mockResolvedValue(subscription);
      mockPrisma.professional.update.mockResolvedValue({ id: 'prof_123' });
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment_record_123',
        amount: 5000,
        status: 'COMPLETED',
      });
      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: 'event_123',
        paymentId: 'payment_123',
        requestId: 'req_123',
        eventType: 'payment',
        status: 'processed',
        requestBody: JSON.stringify(webhookData),
        requestHeaders: JSON.stringify(headers),
        responseBody: JSON.stringify({ success: true, message: 'Subscription activated' }),
        errorMessage: null,
        processedAt: new Date(),
      });

      const result = await handleWebhook(webhookData, headers);

      expect(result).toEqual({
        success: true,
        message: 'Subscription activated',
      });

      // Should have created subscription
      expect(mockPrisma.subscription.create).toHaveBeenCalled();

      // Should have recorded payment
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: 'sub_123',
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          amount: 5000,
        }),
      });

      // Should have recorded webhook event as processed
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'processed',
          errorMessage: undefined,
        }),
      });
    });
  });
});
