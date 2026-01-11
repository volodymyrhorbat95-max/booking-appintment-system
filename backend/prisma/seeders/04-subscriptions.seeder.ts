// ============================================
// SUBSCRIPTIONS SEEDERS
// Creates subscriptions for ALL professionals
// Varied plans, billing periods, and statuses for comprehensive testing
// ============================================

import { BillingPeriod, SubscriptionStatus } from '@prisma/client';
import prisma from '../../src/config/database';

export const seedSubscriptions = async (professionals: any[], plans: any[]) => {
  console.log('🌱 Seeding subscriptions...');

  const createdSubscriptions: any[] = [];

  // Helper to calculate next billing date
  const getNextMonthlyBilling = (monthsAhead: number = 1): Date => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsAhead);
    return date;
  };

  const getNextAnnualBilling = (yearsAhead: number = 1): Date => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + yearsAhead);
    return date;
  };

  const getPastDate = (daysAgo: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  // Get active plans (exclude trial and inactive plans)
  const activePlans = plans.filter((p: any) => p.isActive && p.monthlyPrice > 0);
  const trialPlan = plans.find((p: any) => p.name === 'Plan Prueba');

  // Subscription configurations for each professional
  // Varied to test different scenarios
  const subscriptionConfigs = [
    // Plan Profesional users (most common tier)
    { planIndex: 3, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 90 },
    { planIndex: 3, billing: BillingPeriod.ANNUAL, status: SubscriptionStatus.ACTIVE, startDaysAgo: 180 },
    { planIndex: 3, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 45 },
    { planIndex: 3, billing: BillingPeriod.ANNUAL, status: SubscriptionStatus.ACTIVE, startDaysAgo: 200 },
    { planIndex: 3, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 60 },

    // Plan Básico users
    { planIndex: 2, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 120 },
    { planIndex: 2, billing: BillingPeriod.ANNUAL, status: SubscriptionStatus.ACTIVE, startDaysAgo: 300 },
    { planIndex: 2, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 75 },

    // Plan Premium users (power users)
    { planIndex: 4, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 150 },
    { planIndex: 4, billing: BillingPeriod.ANNUAL, status: SubscriptionStatus.ACTIVE, startDaysAgo: 365 },
    { planIndex: 4, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 100 },

    // Plan Inicial users (new professionals)
    { planIndex: 1, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 15 },
    { planIndex: 1, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 20 },
    { planIndex: 1, billing: BillingPeriod.ANNUAL, status: SubscriptionStatus.ACTIVE, startDaysAgo: 30 },

    // Plan Empresarial users (large clinics)
    { planIndex: 5, billing: BillingPeriod.ANNUAL, status: SubscriptionStatus.ACTIVE, startDaysAgo: 400 },
    { planIndex: 5, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 250 },

    // Edge cases for testing
    { planIndex: 2, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.PAST_DUE, startDaysAgo: 150 }, // Payment failed
    { planIndex: 1, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.CANCELLED, startDaysAgo: 200 }, // Cancelled
    { planIndex: 3, billing: BillingPeriod.ANNUAL, status: SubscriptionStatus.EXPIRED, startDaysAgo: 400 }, // Expired
    { planIndex: 2, billing: BillingPeriod.MONTHLY, status: SubscriptionStatus.ACTIVE, startDaysAgo: 5 } // Very new user
  ];

  for (let i = 0; i < professionals.length && i < subscriptionConfigs.length; i++) {
    const professional = professionals[i];
    const config = subscriptionConfigs[i];

    // Get the plan based on config
    let plan = activePlans[config.planIndex];
    if (!plan) {
      // Fallback to a default plan if index is out of bounds
      plan = activePlans[2]; // Plan Básico
    }

    const startDate = getPastDate(config.startDaysAgo);

    // Calculate next billing date and end date based on status
    let nextBillingDate: Date | null = null;
    let endDate: Date | null = null;

    if (config.status === SubscriptionStatus.ACTIVE) {
      if (config.billing === BillingPeriod.MONTHLY) {
        nextBillingDate = getNextMonthlyBilling();
      } else {
        nextBillingDate = getNextAnnualBilling();
      }
    } else if (config.status === SubscriptionStatus.PAST_DUE) {
      // Past due - billing date was in the past
      nextBillingDate = getPastDate(5);
    } else if (config.status === SubscriptionStatus.CANCELLED) {
      endDate = getPastDate(30);
      nextBillingDate = null;
    } else if (config.status === SubscriptionStatus.EXPIRED) {
      endDate = getPastDate(10);
      nextBillingDate = null;
    }

    try {
      const subscription = await prisma.subscription.upsert({
        where: { professionalId: professional.id },
        update: {},
        create: {
          professionalId: professional.id,
          planId: plan.id,
          billingPeriod: config.billing,
          status: config.status,
          startDate,
          endDate,
          nextBillingDate,
          mercadoPagoSubscriptionId: config.status === SubscriptionStatus.ACTIVE ? `mp_sub_${i + 1}` : null
        }
      });

      createdSubscriptions.push(subscription);

      const billingLabel = config.billing === BillingPeriod.MONTHLY ? 'mensual' : 'anual';
      const statusLabel = config.status === SubscriptionStatus.ACTIVE ? '✅' :
                         config.status === SubscriptionStatus.PAST_DUE ? '⚠️' :
                         config.status === SubscriptionStatus.CANCELLED ? '❌' : '⏸️';

      console.log(`  ${statusLabel} ${professional.firstName} ${professional.lastName} - ${plan.name} (${billingLabel})`);
    } catch (error) {
      console.log(`  ⚠ Failed to create subscription for ${professional.firstName}: ${(error as Error).message}`);
    }
  }

  console.log(`✅ Subscriptions seeded: ${createdSubscriptions.length} subscriptions\n`);

  return createdSubscriptions;
};
