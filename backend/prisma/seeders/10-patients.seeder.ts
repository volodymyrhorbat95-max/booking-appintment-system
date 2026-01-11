// ============================================
// PATIENTS SEEDERS
// Creates test patients for each professional
// Comprehensive Argentine names and realistic data
// ============================================

import prisma from '../../src/config/database';
import { encrypt, hashForLookup } from '../../src/utils/encryption';

// Comprehensive Argentine first names for realistic data
const maleFirstNames = [
  'Carlos', 'Roberto', 'Juan', 'Pedro', 'Miguel', 'Jorge', 'Diego', 'Fernando',
  'Pablo', 'Andrés', 'Nicolás', 'Sebastián', 'Matías', 'Lucas', 'Tomás',
  'Alejandro', 'Martín', 'Javier', 'Facundo', 'Ezequiel', 'Maximiliano', 'Ignacio',
  'Gonzalo', 'Gabriel', 'Franco', 'Rodrigo', 'Santiago', 'Emiliano', 'Joaquín', 'Manuel',
  'Federico', 'Leandro', 'Cristian', 'Mariano', 'Damián', 'Gustavo', 'Leonardo', 'Marcelo',
  'Raúl', 'Alberto', 'Héctor', 'Daniel', 'Sergio', 'Julio', 'Ricardo', 'Mario',
  'Eduardo', 'Luis', 'Esteban', 'Iván', 'Adrián', 'Claudio', 'Ramiro', 'Bruno'
];

const femaleFirstNames = [
  'Laura', 'María', 'Ana', 'Sofía', 'Lucía', 'Valentina', 'Camila', 'Martina',
  'Isabella', 'Florencia', 'Paula', 'Agustina', 'Carla', 'Daniela', 'Victoria',
  'Carolina', 'Natalia', 'Antonella', 'Belén', 'Micaela', 'Romina', 'Vanessa',
  'Gabriela', 'Andrea', 'Silvana', 'Claudia', 'Paola', 'Marina', 'Verónica', 'Mónica',
  'Liliana', 'Adriana', 'Mercedes', 'Beatriz', 'Cecilia', 'Elena', 'Graciela', 'Sandra',
  'Marta', 'Rosa', 'Patricia', 'Silvia', 'Alejandra', 'Valeria', 'Yamila',
  'Soledad', 'Viviana', 'Miriam', 'Rocío', 'Julieta', 'Candela', 'Pilar', 'Amparo'
];

const lastNames = [
  'Fernández', 'Martínez', 'Gómez', 'Silva', 'Pérez', 'González', 'Ramírez', 'Torres',
  'López', 'García', 'Rodríguez', 'Sánchez', 'Díaz', 'Álvarez', 'Romero', 'Moreno',
  'Suárez', 'Vargas', 'Castro', 'Mendoza', 'Herrera', 'Ortiz', 'Ruiz', 'Jiménez',
  'Molina', 'Ríos', 'Navarro', 'Medina', 'Acosta', 'Vega', 'Rojas', 'Guerrero',
  'Blanco', 'Giménez', 'Benítez', 'Cabrera', 'Flores', 'Ramos', 'Domínguez', 'Vázquez',
  'Iglesias', 'Pereyra', 'Sosa', 'Quiroga', 'Luna', 'Paz', 'Aguilar', 'Ledesma',
  'Rivero', 'Figueroa', 'Ponce', 'Arias', 'Vera', 'Miranda', 'Carrizo', 'Maldonado',
  'Peralta', 'Franco', 'Guzmán', 'Correa', 'Villalba', 'Bravo', 'Campos',
  'Moyano', 'Coronel', 'Ibáñez', 'Bustos', 'Cardoso', 'Godoy', 'Escobar', 'Núñez'
];

// Generate realistic unique phone numbers following Argentine format
const generatePhoneNumber = (index: number): string => {
  // Argentine mobile numbers: +54 9 11 XXXX-XXXX (Buenos Aires)
  // Or +54 9 [area code] [local number]
  const areaCodes = ['11', '351', '341', '261', '221', '223', '381', '343', '370', '362'];
  const areaCode = areaCodes[index % areaCodes.length];

  // Generate 8-digit local number
  const baseNumber = 10000000 + (index * 13579) % 90000000;
  const localNumber = baseNumber.toString().padStart(8, '0');

  return `549${areaCode}${localNumber}`;
};

// Get random name with gender variation
const getRandomName = (index: number, professionalIndex: number): { firstName: string; isMale: boolean } => {
  const seed = (index + professionalIndex * 100) % 100;
  const isMale = seed % 2 === 0;

  if (isMale) {
    const firstName = maleFirstNames[(seed + index) % maleFirstNames.length];
    return { firstName, isMale };
  } else {
    const firstName = femaleFirstNames[(seed + index) % femaleFirstNames.length];
    return { firstName, isMale };
  }
};

export const seedPatients = async (professionals: any[]) => {
  console.log('🌱 Seeding patients...');

  const createdPatients: any[] = [];
  let phoneIndex = 0;

  // Create 25 patients for each professional (for comprehensive testing)
  const patientsPerProfessional = 25;

  for (let profIndex = 0; profIndex < professionals.length; profIndex++) {
    const professional = professionals[profIndex];
    const patientsForProf: any[] = [];

    for (let i = 0; i < patientsPerProfessional; i++) {
      // Get random name with gender
      const { firstName, isMale } = getRandomName(i, profIndex);
      const lastName = lastNames[(profIndex * patientsPerProfessional + i + 7) % lastNames.length];

      // Generate email - normalize special characters
      const normalizedFirstName = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const normalizedLastName = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const email = `${normalizedFirstName}.${normalizedLastName}.${profIndex}.${i}@example.com`;

      // Generate unique phone number
      const whatsappNumber = generatePhoneNumber(phoneIndex++);

      try {
        // Encrypt sensitive patient data (as per security requirements)
        const encryptedEmail = encrypt(email);
        const encryptedWhatsappNumber = encrypt(whatsappNumber);
        const whatsappNumberHash = hashForLookup(whatsappNumber);

        // Check if patient exists by hash (faster lookup with index)
        const existingPatient = await prisma.patient.findFirst({
          where: {
            professionalId: professional.id,
            whatsappNumberHash
          }
        });

        let patient;
        if (existingPatient) {
          // Update existing patient
          patient = await prisma.patient.update({
            where: { id: existingPatient.id },
            data: {
              firstName,
              lastName,
              email: encryptedEmail
            }
          });
        } else {
          // Create new patient
          patient = await prisma.patient.create({
            data: {
              professionalId: professional.id,
              firstName,
              lastName,
              email: encryptedEmail,
              whatsappNumber: encryptedWhatsappNumber,
              whatsappNumberHash,
              countryCode: '+54'
            }
          });
        }

        patientsForProf.push(patient);
        createdPatients.push(patient);
      } catch (error) {
        console.log(`  ⚠ Failed to create patient ${firstName} ${lastName}: ${(error as Error).message}`);
      }
    }

    console.log(`  ✓ Created ${patientsForProf.length} patients for ${professional.firstName} ${professional.lastName}`);
  }

  console.log(`✅ Patients seeded: ${createdPatients.length} patients total\n`);

  return createdPatients;
};
