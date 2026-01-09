// ============================================
// REMINDER SETTINGS SEEDERS
// Creates WhatsApp reminder configurations
// ============================================

import prisma from '../../src/config/database';

export const seedReminderSettings = async (professionals: any[]) => {
  console.log('🌱 Seeding reminder settings...');

  const createdSettings: any[] = [];

  // Each professional gets default reminder settings
  for (const professional of professionals) {
    // Reminder 1: 24 hours before
    const reminder1 = await prisma.reminderSetting.upsert({
      where: {
        professionalId_reminderNumber: {
          professionalId: professional.id,
          reminderNumber: 1
        }
      },
      update: {},
      create: {
        professionalId: professional.id,
        reminderNumber: 1,
        hoursBefore: 24,
        enableNightBefore: false,
        isActive: true
      }
    });
    createdSettings.push(reminder1);

    console.log(`  ✓ Created reminder settings for ${professional.firstName}`);
  }

  // Dr. Garcia gets an additional reminder (2 hours before)
  const garciaReminder2 = await prisma.reminderSetting.upsert({
    where: {
      professionalId_reminderNumber: {
        professionalId: professionals[0].id,
        reminderNumber: 2
      }
    },
    update: {},
    create: {
      professionalId: professionals[0].id,
      reminderNumber: 2,
      hoursBefore: 2,
      enableNightBefore: false,
      isActive: true
    }
  });
  createdSettings.push(garciaReminder2);
  console.log(`  ✓ Added extra reminder for Dr. Garcia`);

  console.log(`✅ Reminder settings seeded: ${createdSettings.length} reminders\n`);

  return createdSettings;
};
