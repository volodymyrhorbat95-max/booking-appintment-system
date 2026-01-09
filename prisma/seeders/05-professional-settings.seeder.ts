// ============================================
// PROFESSIONAL SETTINGS SEEDERS
// Creates appointment duration settings
// ============================================

import prisma from '../../src/config/database';

export const seedProfessionalSettings = async (professionals: any[]) => {
  console.log('🌱 Seeding professional settings...');

  const createdSettings: any[] = [];

  for (const professional of professionals) {
    const settings = await prisma.professionalSettings.upsert({
      where: { professionalId: professional.id },
      update: {},
      create: {
        professionalId: professional.id,
        appointmentDuration: 30 // 30 minutes default
      }
    });
    createdSettings.push(settings);
    console.log(`  ✓ Created settings for ${professional.firstName}`);
  }

  console.log(`✅ Professional settings seeded: ${createdSettings.length} settings\n`);

  return createdSettings;
};
