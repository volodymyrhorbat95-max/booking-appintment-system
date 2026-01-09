// ============================================
// SUBSCRIPTION PLANS SEEDERS
// Creates initial subscription plans
// ============================================

import prisma from '../../src/config/database';

export const seedSubscriptionPlans = async () => {
  console.log('🌱 Seeding subscription plans...');

  const plans = [
    {
      name: 'Plan Básico',
      description: 'Perfecto para empezar',
      monthlyPrice: 5000,
      annualPrice: 50000,
      features: [
        'Hasta 50 turnos por mes',
        'Calendario personalizado',
        'Recordatorios por WhatsApp',
        'Formulario de reserva básico',
        'Soporte por email'
      ],
      displayOrder: 1,
      isActive: true
    },
    {
      name: 'Plan Profesional',
      description: 'Para profesionales en crecimiento',
      monthlyPrice: 10000,
      annualPrice: 100000,
      features: [
        'Turnos ilimitados',
        'Sincronización con Google Calendar',
        'Recordatorios personalizables',
        'Campos personalizados en formulario',
        'Depósitos/señas por Mercado Pago',
        'Múltiples franjas horarias',
        'Estadísticas avanzadas',
        'Soporte prioritario'
      ],
      displayOrder: 2,
      isActive: true
    },
    {
      name: 'Plan Premium',
      description: 'Solución completa para equipos',
      monthlyPrice: 20000,
      annualPrice: 200000,
      features: [
        'Todo lo del Plan Profesional',
        'Múltiples profesionales (hasta 5)',
        'API de integración',
        'Branding personalizado',
        'Reportes personalizados',
        'Gestor de cuenta dedicado',
        'Soporte 24/7',
        'Capacitación incluida'
      ],
      displayOrder: 3,
      isActive: true
    }
  ];

  const createdPlans: any[] = [];

  for (const planData of plans) {
    // Find existing plan by name
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: planData.name }
    });

    const plan = existingPlan
      ? await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: planData
        })
      : await prisma.subscriptionPlan.create({
          data: planData
        });

    createdPlans.push(plan);
    console.log(`  ✓ Created plan: ${plan.name}`);
  }

  console.log(`✅ Subscription plans seeded: ${createdPlans.length} plans\n`);

  return createdPlans;
};
