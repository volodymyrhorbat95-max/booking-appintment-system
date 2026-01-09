import { Request, Response } from 'express';
import prisma from '../config/database';
import {
  createSubscriptionPreference,
  getSubscriptionStatus,
  cancelSubscription,
  getAvailablePlans
} from '../services/mercadopago.service';

// ============================================
// GET AVAILABLE PLANS
// ============================================

export async function getPlans(req: Request, res: Response) {
  try {
    const plans = await getAvailablePlans();
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Error al obtener planes' });
  }
}

// ============================================
// GET CURRENT SUBSCRIPTION STATUS
// ============================================

export async function getMySubscription(req: Request, res: Response) {
  try {
    const professionalId = req.user?.id;

    if (!professionalId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const subscription = await getSubscriptionStatus(professionalId);
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, error: 'Error al obtener suscripción' });
  }
}

// ============================================
// CREATE SUBSCRIPTION PAYMENT
// ============================================

export async function createSubscriptionPayment(req: Request, res: Response) {
  try {
    const professionalId = req.user?.id;
    const { planId, billingPeriod } = req.body;

    if (!professionalId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    if (!planId || !billingPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Plan y período de facturación son requeridos'
      });
    }

    if (!['MONTHLY', 'ANNUAL'].includes(billingPeriod)) {
      return res.status(400).json({
        success: false,
        error: 'Período de facturación inválido'
      });
    }

    // Get professional info for payment
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { firstName: true, lastName: true, user: { select: { email: true } } }
    });

    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const preference = await createSubscriptionPreference({
      professionalId,
      planId,
      billingPeriod,
      email: professional.user.email,
      name: `${professional.firstName} ${professional.lastName}`
    });

    res.json({ success: true, preference });
  } catch (error: any) {
    console.error('Error creating subscription payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear pago de suscripción'
    });
  }
}

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

export async function cancelMySubscription(req: Request, res: Response) {
  try {
    const professionalId = req.user?.id;

    if (!professionalId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const result = await cancelSubscription(professionalId);
    res.json(result);
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al cancelar suscripción'
    });
  }
}

// ============================================
// UPGRADE/CHANGE SUBSCRIPTION PLAN
// ============================================

export async function changePlan(req: Request, res: Response) {
  try {
    const professionalId = req.user?.id;
    const { planId, billingPeriod } = req.body;

    if (!professionalId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    if (!planId || !billingPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Plan y período de facturación son requeridos'
      });
    }

    // For now, changing plan means creating a new payment preference
    // The subscription will be updated when payment is confirmed via webhook
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { firstName: true, lastName: true, user: { select: { email: true } } }
    });

    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const preference = await createSubscriptionPreference({
      professionalId,
      planId,
      billingPeriod,
      email: professional.user.email,
      name: `${professional.firstName} ${professional.lastName}`
    });

    res.json({ success: true, preference });
  } catch (error: any) {
    console.error('Error changing plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al cambiar plan'
    });
  }
}
