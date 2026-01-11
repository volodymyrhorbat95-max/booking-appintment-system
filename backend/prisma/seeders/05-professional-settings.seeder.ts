// ============================================
// PROFESSIONAL SETTINGS SEEDERS
// Creates varied appointment duration settings for each professional
// Durations: 5-180 minutes in 5-minute increments
// ============================================

import prisma from '../../src/config/database';

export const seedProfessionalSettings = async (professionals: any[]) => {
  console.log('🌱 Seeding professional settings...');

  const createdSettings: any[] = [];

  // Varied appointment durations based on specialty
  // Medical: 15-60 minutes
  // Therapy: 45-90 minutes
  // Beauty: 30-120 minutes
  // Fitness: 60 minutes
  // Legal/Consulting: 30-60 minutes
  const durationConfigs = [
    30,  // Dentist - 30 min
    20,  // General Medicine - 20 min
    45,  // Cardiologist - 45 min
    30,  // Pediatrician - 30 min
    15,  // Dermatologist - 15 min (quick consultations)
    50,  // Psychologist - 50 min (standard session)
    60,  // Psychotherapist - 60 min
    90,  // Family Therapist - 90 min (family sessions)
    60,  // Aesthetician - 60 min
    45,  // Hairstylist - 45 min
    90,  // Massage Therapist - 90 min
    60,  // Personal Trainer - 60 min
    45,  // Nutritionist - 45 min
    45,  // Kinesiologist - 45 min
    60,  // Osteopath - 60 min
    60,  // Lawyer - 60 min
    45,  // Accountant - 45 min
    60,  // Tutor - 60 min
    90,  // Life Coach - 90 min
    30   // Veterinarian - 30 min
  ];

  for (let i = 0; i < professionals.length; i++) {
    const professional = professionals[i];
    const duration = i < durationConfigs.length ? durationConfigs[i] : 30;

    try {
      const settings = await prisma.professionalSettings.upsert({
        where: { professionalId: professional.id },
        update: { appointmentDuration: duration },
        create: {
          professionalId: professional.id,
          appointmentDuration: duration
        }
      });

      createdSettings.push(settings);
      console.log(`  ✓ ${professional.firstName} ${professional.lastName} - ${duration} min`);
    } catch (error) {
      console.log(`  ⚠ Failed to create settings for ${professional.firstName}: ${(error as Error).message}`);
    }
  }

  console.log(`✅ Professional settings seeded: ${createdSettings.length} settings\n`);

  return createdSettings;
};
