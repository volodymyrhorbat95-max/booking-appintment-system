// ============================================
// SUBSCRIPTIONS SEEDERS
// Creates subscriptions for professionals
// ============================================

import { BillingPeriod, SubscriptionStatus } from '@prisma/client';
import prisma from '../../src/config/database';

export const seedSubscriptions = async (professionals: any[], plans: any[]) => {
  console.log('🌱 Seeding subscriptions...');

  const createdSubscriptions: any[] = [];

  // Helper to calculate next billing date
  const getNextMonthlyBilling = (): Date => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  };

  const getNextAnnualBilling = (): Date => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  };

  // Dr. Garcia - Professional plan (monthly)
  const garciaSubscription = await prisma.subscription.upsert({
    where: { professionalId: professionals[0].id },
    update: {},
    create: {
      professionalId: professionals[0].id,
      planId: plans[1].id, // Professional plan
      billingPeriod: BillingPeriod.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
      nextBillingDate: getNextMonthlyBilling(),
      mercadoPagoSubscriptionId: 'mp_sub_001'
    }
  });
  createdSubscriptions.push(garciaSubscription);
  console.log(`  ✓ Created subscription for professional ${professionals[0].firstName}`);

  // Dr. Lopez - Basic plan (annual)
  const lopezSubscription = await prisma.subscription.upsert({
    where: { professionalId: professionals[1].id },
    update: {},
    create: {
      professionalId: professionals[1].id,
      planId: plans[0].id, // Basic plan
      billingPeriod: BillingPeriod.ANNUAL,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2024-02-01'),
      nextBillingDate: getNextAnnualBilling(),
      mercadoPagoSubscriptionId: 'mp_sub_002'
    }
  });
  createdSubscriptions.push(lopezSubscription);
  console.log(`  ✓ Created subscription for professional ${professionals[1].firstName}`);

  // Lic. Rodriguez - Premium plan (monthly)
  const rodriguezSubscription = await prisma.subscription.upsert({
    where: { professionalId: professionals[2].id },
    update: {},
    create: {
      professionalId: professionals[2].id,
      planId: plans[2].id, // Premium plan
      billingPeriod: BillingPeriod.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2024-03-01'),
      nextBillingDate: getNextMonthlyBilling(),
      mercadoPagoSubscriptionId: 'mp_sub_003'
    }
  });
  createdSubscriptions.push(rodriguezSubscription);
  console.log(`  ✓ Created subscription for professional ${professionals[2].firstName}`);

  console.log(`✅ Subscriptions seeded: ${createdSubscriptions.length} subscriptions\n`);

  return createdSubscriptions;
};
