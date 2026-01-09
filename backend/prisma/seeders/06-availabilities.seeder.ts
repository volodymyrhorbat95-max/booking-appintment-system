// ============================================
// AVAILABILITY SEEDERS
// Creates weekly availability schedules
// ============================================

import prisma from '../../src/config/database';

export const seedAvailabilities = async (professionals: any[]) => {
  console.log('🌱 Seeding availabilities...');

  const createdAvailabilities: any[] = [];

  // Dr. Garcia - Monday to Friday, 9:00-13:00 and 15:00-19:00
  const garciaSchedule = [
    { dayOfWeek: 1, slotNumber: 1, startTime: '09:00', endTime: '13:00' }, // Monday morning
    { dayOfWeek: 1, slotNumber: 2, startTime: '15:00', endTime: '19:00' }, // Monday afternoon
    { dayOfWeek: 2, slotNumber: 1, startTime: '09:00', endTime: '13:00' }, // Tuesday morning
    { dayOfWeek: 2, slotNumber: 2, startTime: '15:00', endTime: '19:00' }, // Tuesday afternoon
    { dayOfWeek: 3, slotNumber: 1, startTime: '09:00', endTime: '13:00' }, // Wednesday morning
    { dayOfWeek: 3, slotNumber: 2, startTime: '15:00', endTime: '19:00' }, // Wednesday afternoon
    { dayOfWeek: 4, slotNumber: 1, startTime: '09:00', endTime: '13:00' }, // Thursday morning
    { dayOfWeek: 4, slotNumber: 2, startTime: '15:00', endTime: '19:00' }, // Thursday afternoon
    { dayOfWeek: 5, slotNumber: 1, startTime: '09:00', endTime: '13:00' }, // Friday morning
    { dayOfWeek: 5, slotNumber: 2, startTime: '15:00', endTime: '19:00' }  // Friday afternoon
  ];

  for (const slot of garciaSchedule) {
    const availability = await prisma.availability.upsert({
      where: {
        professionalId_dayOfWeek_slotNumber: {
          professionalId: professionals[0].id,
          dayOfWeek: slot.dayOfWeek,
          slotNumber: slot.slotNumber
        }
      },
      update: {},
      create: {
        professionalId: professionals[0].id,
        ...slot,
        isActive: true
      }
    });
    createdAvailabilities.push(availability);
  }
  console.log(`  ✓ Created availability for Dr. Garcia`);

  // Dr. Lopez - Monday to Friday, 10:00-18:00 (continuous)
  const lopezSchedule = [
    { dayOfWeek: 1, slotNumber: 1, startTime: '10:00', endTime: '18:00' },
    { dayOfWeek: 2, slotNumber: 1, startTime: '10:00', endTime: '18:00' },
    { dayOfWeek: 3, slotNumber: 1, startTime: '10:00', endTime: '18:00' },
    { dayOfWeek: 4, slotNumber: 1, startTime: '10:00', endTime: '18:00' },
    { dayOfWeek: 5, slotNumber: 1, startTime: '10:00', endTime: '18:00' }
  ];

  for (const slot of lopezSchedule) {
    const availability = await prisma.availability.upsert({
      where: {
        professionalId_dayOfWeek_slotNumber: {
          professionalId: professionals[1].id,
          dayOfWeek: slot.dayOfWeek,
          slotNumber: slot.slotNumber
        }
      },
      update: {},
      create: {
        professionalId: professionals[1].id,
        ...slot,
        isActive: true
      }
    });
    createdAvailabilities.push(availability);
  }
  console.log(`  ✓ Created availability for Dr. Lopez`);

  // Lic. Rodriguez - Monday to Saturday, morning only
  const rodriguezSchedule = [
    { dayOfWeek: 1, slotNumber: 1, startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 2, slotNumber: 1, startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 3, slotNumber: 1, startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 4, slotNumber: 1, startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 5, slotNumber: 1, startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 6, slotNumber: 1, startTime: '09:00', endTime: '13:00' } // Saturday
  ];

  for (const slot of rodriguezSchedule) {
    const availability = await prisma.availability.upsert({
      where: {
        professionalId_dayOfWeek_slotNumber: {
          professionalId: professionals[2].id,
          dayOfWeek: slot.dayOfWeek,
          slotNumber: slot.slotNumber
        }
      },
      update: {},
      create: {
        professionalId: professionals[2].id,
        ...slot,
        isActive: true
      }
    });
    createdAvailabilities.push(availability);
  }
  console.log(`  ✓ Created availability for Lic. Rodriguez`);

  console.log(`✅ Availabilities seeded: ${createdAvailabilities.length} slots\n`);

  return createdAvailabilities;
};
