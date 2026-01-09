// ============================================
// PATIENTS SEEDERS
// Creates test patients for each professional
// ============================================

import prisma from '../../src/config/database';

// Argentine first names and last names for realistic data
const firstNames = [
  'Carlos', 'Laura', 'Roberto', 'María', 'Juan', 'Ana', 'Pedro', 'Sofía',
  'Miguel', 'Lucía', 'Jorge', 'Valentina', 'Diego', 'Camila', 'Fernando',
  'Martina', 'Pablo', 'Isabella', 'Andrés', 'Florencia', 'Nicolás', 'Paula',
  'Sebastián', 'Agustina', 'Matías', 'Carla', 'Lucas', 'Daniela', 'Tomás', 'Victoria'
];

const lastNames = [
  'Fernández', 'Martínez', 'Gómez', 'Silva', 'Pérez', 'González', 'Ramírez', 'Torres',
  'López', 'García', 'Rodríguez', 'Sánchez', 'Díaz', 'Álvarez', 'Romero',
  'Moreno', 'Suárez', 'Vargas', 'Castro', 'Mendoza', 'Herrera', 'Ortiz',
  'Ruiz', 'Jiménez', 'Molina', 'Ríos', 'Navarro', 'Medina', 'Acosta', 'Vega'
];

// Generate unique phone numbers
const generatePhoneNumber = (index: number): string => {
  const base = 5491100000000 + index * 11111;
  return base.toString();
};

export const seedPatients = async (professionals: any[]) => {
  console.log('🌱 Seeding patients...');

  const createdPatients: any[] = [];
  let phoneIndex = 0;

  // Create 10 patients for each professional
  for (let profIndex = 0; profIndex < professionals.length; profIndex++) {
    const professional = professionals[profIndex];
    const patientsForProf: any[] = [];

    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[(profIndex * 10 + i) % firstNames.length];
      const lastName = lastNames[(profIndex * 10 + i + 5) % lastNames.length];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${profIndex}${i}@example.com`;
      const whatsappNumber = generatePhoneNumber(phoneIndex++);

      const patient = await prisma.patient.upsert({
        where: {
          professionalId_whatsappNumber: {
            professionalId: professional.id,
            whatsappNumber
          }
        },
        update: {},
        create: {
          professionalId: professional.id,
          firstName,
          lastName,
          email,
          whatsappNumber,
          countryCode: '+54'
        }
      });
      patientsForProf.push(patient);
      createdPatients.push(patient);
    }

    console.log(`  ✓ Created ${patientsForProf.length} patients for ${professional.firstName} ${professional.lastName}`);
  }

  console.log(`✅ Patients seeded: ${createdPatients.length} patients\n`);

  return createdPatients;
};
