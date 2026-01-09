// ============================================
// BLOCKED DATES SEEDERS
// Creates blocked dates (vacations, holidays, etc.)
// ============================================

import prisma from '../../src/config/database';

export const seedBlockedDates = async (professionals: any[]) => {
  console.log('🌱 Seeding blocked dates...');

  const createdBlockedDates: any[] = [];

  // Get dates for next month
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Dr. Garcia - Vacation days
  const garciaVacationStart = new Date(nextMonth);
  garciaVacationStart.setDate(15);
  garciaVacationStart.setHours(0, 0, 0, 0);

  for (let i = 0; i < 5; i++) {
    const vacationDate = new Date(garciaVacationStart);
    vacationDate.setDate(garciaVacationStart.getDate() + i);

    const blockedDate = await prisma.blockedDate.upsert({
      where: {
        professionalId_date: {
          professionalId: professionals[0].id,
          date: vacationDate
        }
      },
      update: {},
      create: {
        professionalId: professionals[0].id,
        date: vacationDate,
        reason: 'Vacaciones'
      }
    });
    createdBlockedDates.push(blockedDate);
  }
  console.log(`  ✓ Created vacation dates for Dr. Garcia: 5 days`);

  // Lic. Rodriguez - Personal day
  const rodriguezPersonalDay = new Date(nextMonth);
  rodriguezPersonalDay.setDate(20);
  rodriguezPersonalDay.setHours(0, 0, 0, 0);

  const blockedDate = await prisma.blockedDate.upsert({
    where: {
      professionalId_date: {
        professionalId: professionals[2].id,
        date: rodriguezPersonalDay
      }
    },
    update: {},
    create: {
      professionalId: professionals[2].id,
      date: rodriguezPersonalDay,
      reason: 'Día personal'
    }
  });
  createdBlockedDates.push(blockedDate);
  console.log(`  ✓ Created blocked date for Lic. Rodriguez: 1 day`);

  console.log(`✅ Blocked dates seeded: ${createdBlockedDates.length} dates\n`);

  return createdBlockedDates;
};
