// ============================================
// PAYMENTS SEEDERS
// Creates test payments for subscriptions
// Covers all PaymentType and PaymentStatus values
// ============================================

import { PaymentType, PaymentStatus } from '@prisma/client';
import prisma from '../../src/config/database';

// Helper to get a date offset from today
const getDateOffset = (daysOffset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

export const seedPayments = async (subscriptions: any[]) => {
  console.log('🌱 Seeding payments...');

  const createdPayments: any[] = [];

  for (const subscription of subscriptions) {
    // Get plan price
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId }
    });

    if (!plan) continue;

    const amount = subscription.billingPeriod === 'MONTHLY'
      ? Number(plan.monthlyPrice)
      : Number(plan.annualPrice);

    // Create 3 past COMPLETED subscription payments (simulating payment history)
    for (let i = 0; i < 3; i++) {
      const monthsAgo = (3 - i) * (subscription.billingPeriod === 'MONTHLY' ? 1 : 12);
      const payment = await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          type: PaymentType.SUBSCRIPTION,
          status: PaymentStatus.COMPLETED,
          amount,
          currency: 'ARS',
          mercadoPagoPaymentId: `mp_sub_${subscription.id.substring(0, 8)}_${i}`,
          paidAt: getDateOffset(-monthsAgo * 30)
        }
      });
      createdPayments.push(payment);
    }

    // Create 1 PENDING payment for upcoming billing
    const pendingPayment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        type: PaymentType.SUBSCRIPTION,
        status: PaymentStatus.PENDING,
        amount,
        currency: 'ARS'
      }
    });
    createdPayments.push(pendingPayment);
  }

  // Create some deposit payments (for appointments with deposits)
  const appointmentsWithDeposits = await prisma.appointment.findMany({
    where: {
      depositRequired: true,
      depositPaid: true
    },
    take: 10
  });

  for (const appointment of appointmentsWithDeposits) {
    const payment = await prisma.payment.create({
      data: {
        type: PaymentType.DEPOSIT,
        status: PaymentStatus.COMPLETED,
        amount: Number(appointment.depositAmount) || 2000,
        currency: 'ARS',
        mercadoPagoPaymentId: `mp_dep_${appointment.id.substring(0, 8)}`,
        paidAt: appointment.depositPaidAt || new Date()
      }
    });
    createdPayments.push(payment);
  }

  // Create some FAILED and REFUNDED payments for variety
  if (subscriptions.length > 0) {
    // 1 FAILED payment
    const failedPayment = await prisma.payment.create({
      data: {
        subscriptionId: subscriptions[0].id,
        type: PaymentType.SUBSCRIPTION,
        status: PaymentStatus.FAILED,
        amount: 2999,
        currency: 'ARS',
        mercadoPagoPaymentId: `mp_failed_${Date.now()}`
      }
    });
    createdPayments.push(failedPayment);

    // 1 REFUNDED payment
    const refundedPayment = await prisma.payment.create({
      data: {
        subscriptionId: subscriptions[0].id,
        type: PaymentType.SUBSCRIPTION,
        status: PaymentStatus.REFUNDED,
        amount: 2999,
        currency: 'ARS',
        mercadoPagoPaymentId: `mp_refund_${Date.now()}`,
        paidAt: getDateOffset(-45)
      }
    });
    createdPayments.push(refundedPayment);
  }

  console.log(`✅ Payments seeded: ${createdPayments.length} payments\n`);

  return createdPayments;
};
