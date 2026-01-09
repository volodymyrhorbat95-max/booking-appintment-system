// ============================================
// USER SEEDERS
// Creates admin and professional users
// ============================================

import { UserRole } from '@prisma/client';
import { hashPassword } from '../../src/utils/password';
import prisma from '../../src/config/database';

export const seedUsers = async () => {
  console.log('🌱 Seeding users...');

  // Create admin user
  const adminPassword = await hashPassword('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@appointmentplatform.com' },
    update: {},
    create: {
      email: 'admin@appointmentplatform.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      name: 'Platform Admin'
    }
  });
  console.log('  ✓ Created admin user:', admin.email);

  // Create professional users (Google OAuth - no password)
  const professionals = [
    {
      email: 'dr.garcia@example.com',
      name: 'Dr. María García',
      firstName: 'María',
      lastName: 'García',
      slug: 'dr-garcia',
      phone: '1112345678',
      countryCode: '+54'
    },
    {
      email: 'dr.lopez@example.com',
      name: 'Dr. Juan López',
      firstName: 'Juan',
      lastName: 'López',
      slug: 'dr-lopez',
      phone: '1123456789',
      countryCode: '+54'
    },
    {
      email: 'lic.rodriguez@example.com',
      name: 'Lic. Ana Rodríguez',
      firstName: 'Ana',
      lastName: 'Rodríguez',
      slug: 'lic-rodriguez',
      phone: '1134567890',
      countryCode: '+54'
    }
  ];

  const createdProfessionals: any[] = [];

  for (const prof of professionals) {
    const user = await prisma.user.upsert({
      where: { email: prof.email },
      update: {},
      create: {
        email: prof.email,
        password: null, // Google OAuth users don't have password
        role: UserRole.PROFESSIONAL,
        name: prof.name
      }
    });

    createdProfessionals.push({ user, professionalData: prof });
    console.log('  ✓ Created professional user:', user.email);
  }

  console.log(`✅ Users seeded: 1 admin + ${createdProfessionals.length} professionals\n`);

  return {
    admin,
    professionals: createdProfessionals
  };
};
