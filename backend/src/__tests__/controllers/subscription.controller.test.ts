import type { Request, Response } from 'express';
import {
  getPlans,
  getMySubscription,
  createSubscriptionPayment,
  cancelMySubscription,
  changePlan
} from '../../controllers/subscription.controller';
import prisma from '../../config/database';
import * as mercadopagoService from '../../services/mercadopago.service';

// Mock dependencies BEFORE importing the controller
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    professional: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('../../services/mercadopago.service');

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Subscription Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      body: {},
      user: undefined
    };
    responseData = null;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      })
    };
  });

  describe('getPlans', () => {
    it('should return available subscription plans', async () => {
      const mockPlans = [
        {
          id: 'plan_basic',
          name: 'Plan Básico',
          price: 15000,
          billingPeriod: 'MONTHLY',
          features: ['Feature 1', 'Feature 2']
        },
        {
          id: 'plan_pro',
          name: 'Plan Profesional',
          price: 25000,
          billingPeriod: 'MONTHLY',
          features: ['Feature 1', 'Feature 2', 'Feature 3']
        }
      ];

      (mercadopagoService.getAvailablePlans as jest.Mock).mockResolvedValue(mockPlans);

      await getPlans(mockRequest as Request, mockResponse as Response);

      expect(mercadopagoService.getAvailablePlans).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        plans: mockPlans
      });
    });

    it('should handle errors when fetching plans fails', async () => {
      (mercadopagoService.getAvailablePlans as jest.Mock).mockRejectedValue(
        new Error('MercadoPago API error')
      );

      await getPlans(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Error al obtener planes'
      });
    });
  });

  describe('getMySubscription', () => {
    it('should return current subscription status for authenticated professional', async () => {
      const mockSubscription = {
        id: 'sub_123',
        professionalId: 'prof_123',
        planId: 'plan_basic',
        status: 'ACTIVE',
        billingPeriod: 'MONTHLY',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        plan: {
          id: 'plan_basic',
          name: 'Plan Básico',
          price: 15000
        }
      };

      mockRequest.user = { id: 'prof_123' } as any;

      (mercadopagoService.getSubscriptionStatus as jest.Mock).mockResolvedValue(mockSubscription);

      await getMySubscription(mockRequest as Request, mockResponse as Response);

      expect(mercadopagoService.getSubscriptionStatus).toHaveBeenCalledWith('prof_123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        subscription: mockSubscription
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await getMySubscription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'No autorizado'
      });

      expect(mercadopagoService.getSubscriptionStatus).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching subscription fails', async () => {
      mockRequest.user = { id: 'prof_123' } as any;

      (mercadopagoService.getSubscriptionStatus as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await getMySubscription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Error al obtener suscripción'
      });
    });
  });

  describe('createSubscriptionPayment', () => {
    it('should create MercadoPago payment preference for subscription', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'Dr. Maria',
        lastName: 'Garcia',
        user: {
          email: 'dr.maria@example.com'
        }
      };

      const mockPreference = {
        id: 'pref_123456',
        init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref_123456',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref_123456'
      };

      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_basic',
        billingPeriod: 'MONTHLY'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (mercadopagoService.createSubscriptionPreference as jest.Mock).mockResolvedValue(mockPreference);

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(prisma.professional.findUnique).toHaveBeenCalledWith({
        where: { id: 'prof_123' },
        select: { firstName: true, lastName: true, user: { select: { email: true } } }
      });

      expect(mercadopagoService.createSubscriptionPreference).toHaveBeenCalledWith({
        professionalId: 'prof_123',
        planId: 'plan_basic',
        billingPeriod: 'MONTHLY',
        email: 'dr.maria@example.com',
        name: 'Dr. Maria Garcia'
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        preference: mockPreference
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { planId: 'plan_basic', billingPeriod: 'MONTHLY' };

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'No autorizado'
      });

      expect(prisma.professional.findUnique).not.toHaveBeenCalled();
      expect(mercadopagoService.createSubscriptionPreference).not.toHaveBeenCalled();
    });

    it('should return 400 if planId is missing', async () => {
      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = { billingPeriod: 'MONTHLY' }; // Missing planId

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Plan y período de facturación son requeridos'
      });
    });

    it('should return 400 if billingPeriod is missing', async () => {
      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = { planId: 'plan_basic' }; // Missing billingPeriod

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Plan y período de facturación son requeridos'
      });
    });

    it('should return 400 if billingPeriod is invalid', async () => {
      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_basic',
        billingPeriod: 'WEEKLY' // Invalid period
      };

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Período de facturación inválido'
      });
    });

    it('should accept MONTHLY billing period', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'John',
        lastName: 'Doe',
        user: { email: 'john@example.com' }
      };

      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_basic',
        billingPeriod: 'MONTHLY'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (mercadopagoService.createSubscriptionPreference as jest.Mock).mockResolvedValue({
        id: 'pref_123',
        init_point: 'https://mercadopago.com'
      });

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(responseData.success).toBe(true);
    });

    it('should accept ANNUAL billing period', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'John',
        lastName: 'Doe',
        user: { email: 'john@example.com' }
      };

      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_pro',
        billingPeriod: 'ANNUAL'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (mercadopagoService.createSubscriptionPreference as jest.Mock).mockResolvedValue({
        id: 'pref_456',
        init_point: 'https://mercadopago.com'
      });

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(responseData.success).toBe(true);
    });

    it('should return 404 if professional not found', async () => {
      mockRequest.user = { id: 'nonexistent_prof' } as any;
      mockRequest.body = {
        planId: 'plan_basic',
        billingPeriod: 'MONTHLY'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(null);

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Profesional no encontrado'
      });

      expect(mercadopagoService.createSubscriptionPreference).not.toHaveBeenCalled();
    });

    it('should handle MercadoPago service errors', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'Test',
        lastName: 'User',
        user: { email: 'test@example.com' }
      };

      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_basic',
        billingPeriod: 'MONTHLY'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (mercadopagoService.createSubscriptionPreference as jest.Mock).mockRejectedValue(
        new Error('MercadoPago API error')
      );

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'MercadoPago API error'
      });
    });

    it('should handle database errors', async () => {
      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_basic',
        billingPeriod: 'MONTHLY'
      };

      (prisma.professional.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await createSubscriptionPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData.success).toBe(false);
    });
  });

  describe('cancelMySubscription', () => {
    it('should cancel active subscription', async () => {
      const mockCancelResult = {
        success: true,
        message: 'Suscripción cancelada exitosamente',
        subscription: {
          id: 'sub_123',
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      };

      mockRequest.user = { id: 'prof_123' } as any;

      (mercadopagoService.cancelSubscription as jest.Mock).mockResolvedValue(mockCancelResult);

      await cancelMySubscription(mockRequest as Request, mockResponse as Response);

      expect(mercadopagoService.cancelSubscription).toHaveBeenCalledWith('prof_123');
      expect(mockResponse.json).toHaveBeenCalledWith(mockCancelResult);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await cancelMySubscription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'No autorizado'
      });

      expect(mercadopagoService.cancelSubscription).not.toHaveBeenCalled();
    });

    it('should handle cancellation errors', async () => {
      mockRequest.user = { id: 'prof_123' } as any;

      (mercadopagoService.cancelSubscription as jest.Mock).mockRejectedValue(
        new Error('No active subscription found')
      );

      await cancelMySubscription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'No active subscription found'
      });
    });

    it('should handle generic errors gracefully', async () => {
      mockRequest.user = { id: 'prof_123' } as any;

      (mercadopagoService.cancelSubscription as jest.Mock).mockRejectedValue(
        new Error()
      );

      await cancelMySubscription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Error al cancelar suscripción'
      });
    });
  });

  describe('changePlan', () => {
    it('should create payment preference for plan change', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'Dr. John',
        lastName: 'Smith',
        user: {
          email: 'dr.smith@example.com'
        }
      };

      const mockPreference = {
        id: 'pref_upgrade_123',
        init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref_upgrade_123'
      };

      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_pro',
        billingPeriod: 'ANNUAL'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (mercadopagoService.createSubscriptionPreference as jest.Mock).mockResolvedValue(mockPreference);

      await changePlan(mockRequest as Request, mockResponse as Response);

      expect(prisma.professional.findUnique).toHaveBeenCalledWith({
        where: { id: 'prof_123' },
        select: { firstName: true, lastName: true, user: { select: { email: true } } }
      });

      expect(mercadopagoService.createSubscriptionPreference).toHaveBeenCalledWith({
        professionalId: 'prof_123',
        planId: 'plan_pro',
        billingPeriod: 'ANNUAL',
        email: 'dr.smith@example.com',
        name: 'Dr. John Smith'
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        preference: mockPreference
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { planId: 'plan_pro', billingPeriod: 'MONTHLY' };

      await changePlan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseData).toMatchObject({
        success: false,
        error: 'No autorizado'
      });
    });

    it('should return 400 if planId is missing', async () => {
      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = { billingPeriod: 'MONTHLY' };

      await changePlan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Plan y período de facturación son requeridos'
      });
    });

    it('should return 400 if billingPeriod is missing', async () => {
      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = { planId: 'plan_pro' };

      await changePlan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Plan y período de facturación son requeridos'
      });
    });

    it('should return 404 if professional not found', async () => {
      mockRequest.user = { id: 'nonexistent_prof' } as any;
      mockRequest.body = {
        planId: 'plan_pro',
        billingPeriod: 'MONTHLY'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(null);

      await changePlan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Profesional no encontrado'
      });
    });

    it('should handle MercadoPago service errors', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'Test',
        lastName: 'User',
        user: { email: 'test@example.com' }
      };

      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_pro',
        billingPeriod: 'ANNUAL'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (mercadopagoService.createSubscriptionPreference as jest.Mock).mockRejectedValue(
        new Error('Payment gateway error')
      );

      await changePlan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Payment gateway error'
      });
    });

    it('should handle generic errors with default message', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'Test',
        lastName: 'User',
        user: { email: 'test@example.com' }
      };

      mockRequest.user = { id: 'prof_123' } as any;
      mockRequest.body = {
        planId: 'plan_pro',
        billingPeriod: 'MONTHLY'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (mercadopagoService.createSubscriptionPreference as jest.Mock).mockRejectedValue(
        new Error()
      );

      await changePlan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Error al cambiar plan'
      });
    });
  });
});
