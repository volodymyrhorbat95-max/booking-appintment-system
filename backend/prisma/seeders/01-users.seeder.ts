// ============================================
// USER SEEDERS
// Creates admin and professional users
// ============================================

import { UserRole } from '@prisma/client';
import { hashPassword } from '../../src/utils/password';
import prisma from '../../src/config/database';

export const seedUsers = async () => {
  console.log('🌱 Seeding users...');

  // Get admin credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@appointmentplatform.com';
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || 'Admin123!';

  // Create admin user
  const adminPassword = await hashPassword(adminPasswordPlain);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN,
      name: 'Platform Admin'
    }
  });
  console.log('  ✓ Created admin user:', admin.email);

  // Create professional users (Google OAuth - no password)
  // Comprehensive list covering various specialties and professions
  const professionals = [
    // Medical Professionals
    {
      email: 'dr.garcia@example.com',
      name: 'Dr. María García',
      firstName: 'María',
      lastName: 'García',
      slug: 'dr-garcia',
      phone: '1112345678',
      countryCode: '+54',
      specialty: 'Odontología'
    },
    {
      email: 'dr.lopez@example.com',
      name: 'Dr. Juan López',
      firstName: 'Juan',
      lastName: 'López',
      slug: 'dr-lopez',
      phone: '1123456789',
      countryCode: '+54',
      specialty: 'Medicina General'
    },
    {
      email: 'dr.martinez@example.com',
      name: 'Dr. Carlos Martínez',
      firstName: 'Carlos',
      lastName: 'Martínez',
      slug: 'dr-martinez',
      phone: '1145678901',
      countryCode: '+54',
      specialty: 'Cardiología'
    },
    {
      email: 'dra.fernandez@example.com',
      name: 'Dra. Laura Fernández',
      firstName: 'Laura',
      lastName: 'Fernández',
      slug: 'dra-fernandez',
      phone: '1156789012',
      countryCode: '+54',
      specialty: 'Pediatría'
    },
    {
      email: 'dr.silva@example.com',
      name: 'Dr. Roberto Silva',
      firstName: 'Roberto',
      lastName: 'Silva',
      slug: 'dr-silva',
      phone: '1167890123',
      countryCode: '+54',
      specialty: 'Dermatología'
    },

    // Therapists and Psychologists
    {
      email: 'lic.rodriguez@example.com',
      name: 'Lic. Ana Rodríguez',
      firstName: 'Ana',
      lastName: 'Rodríguez',
      slug: 'lic-rodriguez',
      phone: '1134567890',
      countryCode: '+54',
      specialty: 'Psicología'
    },
    {
      email: 'lic.gomez@example.com',
      name: 'Lic. Pablo Gómez',
      firstName: 'Pablo',
      lastName: 'Gómez',
      slug: 'lic-gomez',
      phone: '1178901234',
      countryCode: '+54',
      specialty: 'Psicoterapia'
    },
    {
      email: 'lic.torres@example.com',
      name: 'Lic. Sofía Torres',
      firstName: 'Sofía',
      lastName: 'Torres',
      slug: 'lic-torres',
      phone: '1189012345',
      countryCode: '+54',
      specialty: 'Terapia Familiar'
    },

    // Beauty and Wellness
    {
      email: 'esteticista.romero@example.com',
      name: 'Valentina Romero',
      firstName: 'Valentina',
      lastName: 'Romero',
      slug: 'valentina-romero',
      phone: '1190123456',
      countryCode: '+54',
      specialty: 'Estética'
    },
    {
      email: 'peluquera.moreno@example.com',
      name: 'Camila Moreno',
      firstName: 'Camila',
      lastName: 'Moreno',
      slug: 'camila-moreno',
      phone: '1101234567',
      countryCode: '+54',
      specialty: 'Peluquería'
    },
    {
      email: 'masajista.sanchez@example.com',
      name: 'Diego Sánchez',
      firstName: 'Diego',
      lastName: 'Sánchez',
      slug: 'diego-sanchez',
      phone: '1112345679',
      countryCode: '+54',
      specialty: 'Masajes Terapéuticos'
    },

    // Fitness and Sports
    {
      email: 'entrenador.diaz@example.com',
      name: 'Matías Díaz',
      firstName: 'Matías',
      lastName: 'Díaz',
      slug: 'matias-diaz',
      phone: '1123456780',
      countryCode: '+54',
      specialty: 'Entrenamiento Personal'
    },
    {
      email: 'nutricionista.alvarez@example.com',
      name: 'Lic. Lucía Álvarez',
      firstName: 'Lucía',
      lastName: 'Álvarez',
      slug: 'lucia-alvarez',
      phone: '1134567891',
      countryCode: '+54',
      specialty: 'Nutrición'
    },

    // Alternative Medicine
    {
      email: 'kinesiologia.ruiz@example.com',
      name: 'Lic. Fernando Ruiz',
      firstName: 'Fernando',
      lastName: 'Ruiz',
      slug: 'fernando-ruiz',
      phone: '1145678902',
      countryCode: '+54',
      specialty: 'Kinesiología'
    },
    {
      email: 'osteopata.vargas@example.com',
      name: 'Dra. Martina Vargas',
      firstName: 'Martina',
      lastName: 'Vargas',
      slug: 'martina-vargas',
      phone: '1156789013',
      countryCode: '+54',
      specialty: 'Osteopatía'
    },

    // Legal and Consulting
    {
      email: 'abogado.castro@example.com',
      name: 'Dr. Andrés Castro',
      firstName: 'Andrés',
      lastName: 'Castro',
      slug: 'andres-castro',
      phone: '1167890124',
      countryCode: '+54',
      specialty: 'Asesoría Legal'
    },
    {
      email: 'contador.mendoza@example.com',
      name: 'Cont. Florencia Mendoza',
      firstName: 'Florencia',
      lastName: 'Mendoza',
      slug: 'florencia-mendoza',
      phone: '1178901235',
      countryCode: '+54',
      specialty: 'Contabilidad'
    },

    // Education and Tutoring
    {
      email: 'tutor.herrera@example.com',
      name: 'Prof. Nicolás Herrera',
      firstName: 'Nicolás',
      lastName: 'Herrera',
      slug: 'nicolas-herrera',
      phone: '1189012346',
      countryCode: '+54',
      specialty: 'Clases Particulares'
    },
    {
      email: 'coach.ortiz@example.com',
      name: 'Paula Ortiz',
      firstName: 'Paula',
      lastName: 'Ortiz',
      slug: 'paula-ortiz',
      phone: '1190123457',
      countryCode: '+54',
      specialty: 'Life Coaching'
    },

    // Veterinary
    {
      email: 'veterinario.jimenez@example.com',
      name: 'Dr. Sebastián Jiménez',
      firstName: 'Sebastián',
      lastName: 'Jiménez',
      slug: 'sebastian-jimenez',
      phone: '1101234568',
      countryCode: '+54',
      specialty: 'Veterinaria'
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
