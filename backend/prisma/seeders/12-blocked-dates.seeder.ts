// ============================================
// BLOCKED DATES SEEDERS
// Creates realistic blocked dates for ALL professionals
// Includes vacations, holidays, personal days, conferences
// ============================================

import prisma from '../../src/config/database';

// Argentine national holidays 2026
const argentineHolidays2026 = [
  { date: new Date('2026-01-01'), reason: 'Año Nuevo' },
  { date: new Date('2026-02-16'), reason: 'Carnaval' },
  { date: new Date('2026-02-17'), reason: 'Carnaval' },
  { date: new Date('2026-03-24'), reason: 'Día Nacional de la Memoria' },
  { date: new Date('2026-04-02'), reason: 'Día del Veterano' },
  { date: new Date('2026-04-03'), reason: 'Viernes Santo' },
  { date: new Date('2026-05-01'), reason: 'Día del Trabajador' },
  { date: new Date('2026-05-25'), reason: 'Día de la Revolución de Mayo' },
  { date: new Date('2026-06-15'), reason: 'Día de la Bandera' },
  { date: new Date('2026-07-09'), reason: 'Día de la Independencia' },
  { date: new Date('2026-08-17'), reason: 'Paso a la Inmortalidad del Gral. San Martín' },
  { date: new Date('2026-10-12'), reason: 'Día del Respeto a la Diversidad Cultural' },
  { date: new Date('2026-11-23'), reason: 'Día de la Soberanía Nacional' },
  { date: new Date('2026-12-08'), reason: 'Inmaculada Concepción de María' },
  { date: new Date('2026-12-25'), reason: 'Navidad' }
];

// Helper to get date range
const getDateRange = (startDate: Date, days: number): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  return dates;
};

// Helper for date offset
const getDateOffset = (daysOffset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const seedBlockedDates = async (professionals: any[]) => {
  console.log('🌱 Seeding blocked dates...');

  const createdBlockedDates: any[] = [];

  // Vacation configurations for each professional (varied patterns)
  const vacationConfigs = [
    { start: 45, days: 7, reason: 'Vacaciones de verano' },      // Week vacation
    { start: 60, days: 10, reason: 'Vacaciones familiares' },    // 10-day vacation
    { start: 30, days: 5, reason: 'Descanso' },                  // Short break
    { start: 80, days: 14, reason: 'Vacaciones extendidas' },    // Two weeks
    { start: 50, days: 3, reason: 'Fin de semana largo' },       // Long weekend
    { start: 70, days: 7, reason: 'Vacaciones de invierno' },    // Winter vacation
    { start: 40, days: 10, reason: 'Viaje familiar' },           // Family trip
    { start: 55, days: 5, reason: 'Descanso personal' },         // Personal break
    { start: 90, days: 14, reason: 'Vacaciones anuales' },       // Annual vacation
    { start: 35, days: 4, reason: 'Puente' },                    // Bridge holiday
    { start: 65, days: 7, reason: 'Vacaciones programadas' },    // Scheduled vacation
    { start: 75, days: 5, reason: 'Retiro espiritual' },         // Spiritual retreat
    { start: 85, days: 10, reason: 'Vacaciones de primavera' },  // Spring vacation
    { start: 48, days: 3, reason: 'Conferencia médica' },        // Medical conference
    { start: 95, days: 7, reason: 'Capacitación' },              // Training
    { start: 42, days: 5, reason: 'Congreso profesional' },      // Professional congress
    { start: 68, days: 10, reason: 'Viaje internacional' },      // International trip
    { start: 52, days: 7, reason: 'Vacaciones planificadas' },   // Planned vacation
    { start: 78, days: 5, reason: 'Descanso obligatorio' },      // Mandatory rest
    { start: 58, days: 3, reason: 'Trámites personales' }        // Personal errands
  ];

  // Add vacations for each professional
  for (let i = 0; i < professionals.length; i++) {
    const professional = professionals[i];
    const config = vacationConfigs[i % vacationConfigs.length];

    const vacationStart = getDateOffset(config.start);
    const vacationDates = getDateRange(vacationStart, config.days);

    for (const date of vacationDates) {
      try {
        const blockedDate = await prisma.blockedDate.upsert({
          where: {
            professionalId_date: {
              professionalId: professional.id,
              date
            }
          },
          update: { reason: config.reason },
          create: {
            professionalId: professional.id,
            date,
            reason: config.reason
          }
        });
        createdBlockedDates.push(blockedDate);
      } catch (error) {
        // Ignore duplicates
      }
    }

    console.log(`  ✓ ${professional.firstName} ${professional.lastName} - ${config.days} días (${config.reason})`);
  }

  // Add additional random personal days for 50% of professionals
  const personalDayReasons = [
    'Trámite personal',
    'Día de estudio',
    'Capacitación online',
    'Reunión externa',
    'Día de salud',
    'Compromiso familiar',
    'Mudanza',
    'Visita médica personal'
  ];

  for (let i = 0; i < professionals.length; i += 2) {
    const professional = professionals[i];

    // Add 2-3 random personal days
    const numPersonalDays = 2 + Math.floor(Math.random() * 2);

    for (let j = 0; j < numPersonalDays; j++) {
      const dayOffset = 20 + Math.floor(Math.random() * 100); // Random day within next 100 days
      const personalDay = getDateOffset(dayOffset);
      const reason = personalDayReasons[Math.floor(Math.random() * personalDayReasons.length)];

      try {
        const blockedDate = await prisma.blockedDate.upsert({
          where: {
            professionalId_date: {
              professionalId: professional.id,
              date: personalDay
            }
          },
          update: { reason },
          create: {
            professionalId: professional.id,
            date: personalDay,
            reason
          }
        });
        createdBlockedDates.push(blockedDate);
      } catch (error) {
        // Ignore duplicates
      }
    }
  }

  // Add Argentine national holidays for all professionals
  for (const professional of professionals) {
    for (const holiday of argentineHolidays2026) {
      // Only add future holidays
      if (holiday.date > new Date()) {
        try {
          const blockedDate = await prisma.blockedDate.upsert({
            where: {
              professionalId_date: {
                professionalId: professional.id,
                date: holiday.date
              }
            },
            update: { reason: `Feriado: ${holiday.reason}` },
            create: {
              professionalId: professional.id,
              date: holiday.date,
              reason: `Feriado: ${holiday.reason}`
            }
          });
          createdBlockedDates.push(blockedDate);
        } catch (error) {
          // Ignore duplicates
        }
      }
    }
  }

  console.log(`✅ Blocked dates seeded: ${createdBlockedDates.length} blocked dates\n`);

  return createdBlockedDates;
};
