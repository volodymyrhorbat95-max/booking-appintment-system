// ============================================
// PROFESSIONAL PROFILES SEEDERS
// Creates professional profiles linked to users
// ============================================

import prisma from '../../src/config/database';

export const seedProfessionals = async (professionalUsers: any[]) => {
  console.log('🌱 Seeding professional profiles...');

  const createdProfessionals: any[] = [];

  for (const { user, professionalData } of professionalUsers) {
    const professional = await prisma.professional.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        firstName: professionalData.firstName,
        lastName: professionalData.lastName,
        slug: professionalData.slug,
        phone: professionalData.phone,
        timezone: 'America/Argentina/Buenos_Aires',
        googleCalendarConnected: false,
        depositEnabled: professionalData.slug === 'dr-garcia', // Dr. Garcia uses deposits
        depositAmount: professionalData.slug === 'dr-garcia' ? 2000 : null,
        isActive: true,
        isSuspended: false
      }
    });

    createdProfessionals.push(professional);
    console.log(`  ✓ Created professional: ${professional.firstName} ${professional.lastName}`);
  }

  console.log(`✅ Professional profiles seeded: ${createdProfessionals.length} professionals\n`);

  return createdProfessionals;
};
