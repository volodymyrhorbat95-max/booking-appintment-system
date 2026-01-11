// ============================================
// SUBSCRIPTION PLANS SEEDERS
// Creates comprehensive subscription plans for the platform
// Admin-editable pricing tiers for Argentine market
// ============================================

import prisma from '../../src/config/database';

export const seedSubscriptionPlans = async () => {
  console.log('🌱 Seeding subscription plans...');

  const plans = [
    {
      name: 'Plan Prueba',
      description: 'Prueba gratuita por 14 días - Sin tarjeta requerida',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Hasta 10 turnos totales',
        'Calendario básico',
        'Recordatorios automáticos por WhatsApp',
        'Página de reservas personalizada',
        'Válido por 14 días',
        'Sin tarjeta de crédito necesaria'
      ],
      displayOrder: 0,
      isActive: true
    },
    {
      name: 'Plan Inicial',
      description: 'Ideal para comenzar tu práctica profesional',
      monthlyPrice: 2999,
      annualPrice: 29990,
      features: [
        'Hasta 30 turnos por mes',
        'Calendario personalizado',
        'Recordatorios automáticos por WhatsApp',
        'Confirmaciones automáticas',
        'Formulario de reserva estándar',
        'Página web personalizada (tupractica.agendux.com)',
        'Estadísticas básicas',
        'Soporte por email (48hs)'
      ],
      displayOrder: 1,
      isActive: true
    },
    {
      name: 'Plan Básico',
      description: 'Perfecto para profesionales independientes',
      monthlyPrice: 5999,
      annualPrice: 59990,
      features: [
        'Hasta 100 turnos por mes',
        'Calendario completo con vista semanal/mensual',
        'Recordatorios ilimitados por WhatsApp',
        'Confirmaciones y cancelaciones automáticas',
        'Formulario de reserva personalizable',
        'Página web con tu marca',
        'Bloqueo de fechas (vacaciones/feriados)',
        'Estadísticas y reportes básicos',
        'Gestión de pacientes recurrentes',
        'Soporte por email (24hs)'
      ],
      displayOrder: 2,
      isActive: true
    },
    {
      name: 'Plan Profesional',
      description: 'Para profesionales en crecimiento con alta demanda',
      monthlyPrice: 9999,
      annualPrice: 99990,
      features: [
        '✨ Turnos ilimitados',
        'Sincronización bidireccional con Google Calendar',
        'Recordatorios múltiples configurables (48hs, 24hs, 3hs)',
        'Plantillas de mensajes personalizables',
        'Campos personalizados en formulario de reserva',
        'Depósitos/señas por Mercado Pago',
        'Múltiples franjas horarias por día',
        'Bloqueo automático de horarios ocupados',
        'Estadísticas avanzadas y gráficos',
        'Exportación de datos a Excel',
        'Historial completo de pacientes',
        'Notificaciones por email + WhatsApp',
        'Soporte prioritario (12hs)',
        'Sin marca de Agendux en tu página'
      ],
      displayOrder: 3,
      isActive: true
    },
    {
      name: 'Plan Premium',
      description: 'Solución completa para alto volumen de pacientes',
      monthlyPrice: 16999,
      annualPrice: 169990,
      features: [
        '✨ Todo lo del Plan Profesional',
        'Recordatorios ilimitados con horarios personalizados',
        'Recordatorios nocturnos para citas matutinas',
        'Cancelación y reagendado por el paciente',
        'Confirmación instantánea al reservar (WhatsApp + Email)',
        'Integración completa con tu sistema actual',
        'API de integración disponible',
        'Subdomain personalizado (tupractica.com)',
        'Reportes detallados por período',
        'Análisis de tasa de ausencias',
        'Segmentación de pacientes',
        'Campañas de recordatorio masivo',
        'Respaldo diario de información',
        'Soporte prioritario (6hs)',
        'Capacitación personalizada incluida'
      ],
      displayOrder: 4,
      isActive: true
    },
    {
      name: 'Plan Empresarial',
      description: 'Para clínicas, centros médicos y equipos grandes',
      monthlyPrice: 29999,
      annualPrice: 299990,
      features: [
        '✨ Todo lo del Plan Premium',
        'Múltiples profesionales (hasta 10)',
        'Gestión centralizada de todos los turnos',
        'Dashboard administrativo completo',
        'Roles y permisos personalizados',
        'Facturación y reportes por profesional',
        'Salas/Consultorios múltiples',
        'Lista de espera automatizada',
        'Recordatorios de seguimiento post-consulta',
        'Integración con software médico',
        'Branding personalizado completo',
        'Analytics avanzados con IA',
        'Gestor de cuenta dedicado',
        'Soporte 24/7 con prioridad máxima',
        'Onboarding y capacitación del equipo completo',
        'Actualizaciones y funcionalidades exclusivas',
        'SLA garantizado 99.9% uptime'
      ],
      displayOrder: 5,
      isActive: true
    },
    {
      name: 'Plan Estudiante',
      description: 'Para estudiantes de últimos años y residentes',
      monthlyPrice: 1999,
      annualPrice: 19990,
      features: [
        'Hasta 50 turnos por mes',
        'Calendario personalizado',
        'Recordatorios automáticos por WhatsApp',
        'Formulario de reserva básico',
        'Página de reservas personalizada',
        'Estadísticas básicas',
        'Soporte por email (72hs)',
        'Requiere verificación de matrícula o documento estudiantil'
      ],
      displayOrder: 6,
      isActive: false // Inactive by default, admin can activate
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
    console.log(`  ✓ Created/Updated plan: ${plan.name} - ARS $${plan.monthlyPrice}/mes`);
  }

  console.log(`✅ Subscription plans seeded: ${createdPlans.length} plans\n`);

  return createdPlans;
};
