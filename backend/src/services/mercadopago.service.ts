import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import prisma from '../config/database';

type BillingPeriod = 'MONTHLY' | 'ANNUAL';

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

// URLs for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// ============================================
// SUBSCRIPTION PAYMENT
// ============================================

interface CreateSubscriptionPaymentParams {
  professionalId: string;
  planId: string;
  billingPeriod: BillingPeriod;
  email: string;
  name: string;
}

export async function createSubscriptionPreference({
  professionalId,
  planId,
  billingPeriod,
  email,
  name
}: CreateSubscriptionPaymentParams) {
  // Get plan details
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });

  if (!plan || !plan.isActive) {
    throw new Error('Plan no encontrado o no activo');
  }

  const amount = billingPeriod === 'MONTHLY'
    ? Number(plan.monthlyPrice)
    : Number(plan.annualPrice);

  const periodLabel = billingPeriod === 'MONTHLY' ? 'Mensual' : 'Anual';

  // Create preference
  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: planId,
          title: `Suscripción ${plan.name} - ${periodLabel}`,
          description: plan.description || `Plan ${plan.name}`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email,
        name
      },
      back_urls: {
        success: `${FRONTEND_URL}/professional/subscription?status=success`,
        failure: `${FRONTEND_URL}/professional/subscription?status=failure`,
        pending: `${FRONTEND_URL}/professional/subscription?status=pending`
      },
      auto_return: 'approved',
      external_reference: JSON.stringify({
        type: 'subscription',
        professionalId,
        planId,
        billingPeriod
      }),
      notification_url: `${BACKEND_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'Plataforma Citas'
    }
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point
  };
}

// ============================================
// DEPOSIT PAYMENT
// ============================================

interface CreateDepositPaymentParams {
  appointmentId: string;
  professionalId: string;
  patientEmail: string;
  patientName: string;
  amount: number;
  bookingReference: string;
}

export async function createDepositPreference({
  appointmentId,
  professionalId,
  patientEmail,
  patientName,
  amount,
  bookingReference
}: CreateDepositPaymentParams) {
  // Get professional details for payment description
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { firstName: true, lastName: true }
  });

  if (!professional) {
    throw new Error('Profesional no encontrado');
  }

  // Create preference
  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: appointmentId,
          title: `Seña para cita - ${professional.firstName} ${professional.lastName}`,
          description: `Reserva ${bookingReference}`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: patientEmail,
        name: patientName
      },
      back_urls: {
        success: `${FRONTEND_URL}/booking/confirmation?ref=${bookingReference}&payment=success`,
        failure: `${FRONTEND_URL}/booking/confirmation?ref=${bookingReference}&payment=failure`,
        pending: `${FRONTEND_URL}/booking/confirmation?ref=${bookingReference}&payment=pending`
      },
      auto_return: 'approved',
      external_reference: JSON.stringify({
        type: 'deposit',
        appointmentId,
        professionalId,
        bookingReference
      }),
      notification_url: `${BACKEND_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'Seña Cita'
    }
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point
  };
}

// ============================================
// WEBHOOK HANDLER
// ============================================

interface WebhookData {
  action: string;
  data: {
    id: string;
  };
  type: string;
}

export async function handleWebhook(data: WebhookData) {
  if (data.type !== 'payment') {
    console.log('Ignoring non-payment webhook:', data.type);
    return { success: true, message: 'Ignored' };
  }

  try {
    // Get payment details from Mercado Pago
    const payment = await paymentClient.get({ id: data.data.id });

    if (!payment || !payment.external_reference) {
      console.error('Payment not found or no external reference');
      return { success: false, error: 'Payment not found' };
    }

    const externalRef = JSON.parse(payment.external_reference);

    if (externalRef.type === 'subscription') {
      return await handleSubscriptionPayment(payment, externalRef);
    } else if (externalRef.type === 'deposit') {
      return await handleDepositPayment(payment, externalRef);
    }

    return { success: true, message: 'Unknown payment type' };
  } catch (error) {
    console.error('Error handling webhook:', error);
    return { success: false, error: 'Webhook processing error' };
  }
}

async function handleSubscriptionPayment(payment: any, externalRef: any) {
  const { professionalId, planId, billingPeriod } = externalRef;

  if (payment.status === 'approved') {
    // Get plan for calculating dates
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    const now = new Date();
    const endDate = new Date(now);
    if (billingPeriod === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create or update subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { professionalId }
    });

    let subscription;
    if (existingSubscription) {
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId,
          billingPeriod: billingPeriod as BillingPeriod,
          status: 'ACTIVE',
          startDate: now,
          nextBillingDate: endDate,
          mercadoPagoSubscriptionId: payment.id?.toString()
        }
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          professionalId,
          planId,
          billingPeriod: billingPeriod as BillingPeriod,
          status: 'ACTIVE',
          startDate: now,
          nextBillingDate: endDate,
          mercadoPagoSubscriptionId: payment.id?.toString()
        }
      });

      // Update professional with subscription
      await prisma.professional.update({
        where: { id: professionalId },
        data: { subscriptionId: subscription.id }
      });
    }

    // Record payment
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        type: 'SUBSCRIPTION',
        status: 'COMPLETED',
        amount: payment.transaction_amount,
        currency: payment.currency_id || 'ARS',
        mercadoPagoPaymentId: payment.id?.toString(),
        paidAt: new Date()
      }
    });

    console.log('Subscription payment processed:', payment.id);
    return { success: true, message: 'Subscription activated' };
  }

  return { success: true, message: `Payment status: ${payment.status}` };
}

async function handleDepositPayment(payment: any, externalRef: any) {
  const { appointmentId } = externalRef;

  if (payment.status === 'approved') {
    // Update appointment deposit status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        depositPaid: true,
        depositPaidAt: new Date(),
        status: 'PENDING' // Move from PENDING_PAYMENT to PENDING
      }
    });

    console.log('Deposit payment processed for appointment:', appointmentId);
    return { success: true, message: 'Deposit paid' };
  }

  return { success: true, message: `Payment status: ${payment.status}` };
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

export async function getSubscriptionStatus(professionalId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { professionalId },
    include: {
      plan: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      description: subscription.plan.description,
      monthlyPrice: Number(subscription.plan.monthlyPrice),
      annualPrice: Number(subscription.plan.annualPrice),
      features: subscription.plan.features
    },
    billingPeriod: subscription.billingPeriod,
    status: subscription.status,
    startDate: subscription.startDate.toISOString(),
    nextBillingDate: subscription.nextBillingDate?.toISOString() || null,
    recentPayments: subscription.payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString()
    }))
  };
}

export async function cancelSubscription(professionalId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { professionalId }
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  // Cancel the subscription (will remain active until end of current period)
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
      endDate: subscription.nextBillingDate // Active until end of paid period
    }
  });

  return { success: true, message: 'Subscription cancelled' };
}

// ============================================
// GET AVAILABLE PLANS
// ============================================

export async function getAvailablePlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  });

  return plans.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    monthlyPrice: Number(p.monthlyPrice),
    annualPrice: Number(p.annualPrice),
    features: p.features,
    displayOrder: p.displayOrder
  }));
}
