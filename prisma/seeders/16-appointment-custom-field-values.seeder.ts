// ============================================
// APPOINTMENT CUSTOM FIELD VALUES SEEDERS
// Creates custom field values for appointments
// ============================================

import prisma from '../../src/config/database';

// Sample values for different field types
const sampleTextValues = [
  'Consulta de seguimiento',
  'Primera visita',
  'Urgencia',
  'Control mensual',
  'Evaluación inicial'
];

const sampleNumberValues = ['25', '30', '35', '40', '45', '50', '55', '60'];

const sampleDateValues = [
  '1990-05-15',
  '1985-08-22',
  '1978-12-01',
  '1995-03-10',
  '2000-07-25'
];

export const seedAppointmentCustomFieldValues = async () => {
  console.log('🌱 Seeding appointment custom field values...');

  const createdValues: any[] = [];

  // Get all custom form fields
  const customFields = await prisma.customFormField.findMany({
    where: { isActive: true }
  });

  if (customFields.length === 0) {
    console.log('  ⚠ No custom form fields found, skipping');
    return createdValues;
  }

  // Get recent appointments (to add custom field values)
  const appointments = await prisma.appointment.findMany({
    where: {
      status: {
        notIn: ['CANCELLED']
      }
    },
    take: 30,
    orderBy: { createdAt: 'desc' }
  });

  for (const appointment of appointments) {
    // Get custom fields for this professional
    const profCustomFields = customFields.filter(
      f => f.professionalId === appointment.professionalId
    );

    for (const field of profCustomFields) {
      // Skip some fields randomly to simulate optional fields
      if (!field.isRequired && Math.random() > 0.7) continue;

      let value: string;

      switch (field.fieldType) {
        case 'TEXT':
          value = sampleTextValues[Math.floor(Math.random() * sampleTextValues.length)];
          break;
        case 'NUMBER':
          value = sampleNumberValues[Math.floor(Math.random() * sampleNumberValues.length)];
          break;
        case 'DATE':
          value = sampleDateValues[Math.floor(Math.random() * sampleDateValues.length)];
          break;
        case 'DROPDOWN':
          // Use one of the field's options
          if (field.options && field.options.length > 0) {
            value = field.options[Math.floor(Math.random() * field.options.length)];
          } else {
            value = 'Opción 1';
          }
          break;
        default:
          value = 'Valor de prueba';
      }

      try {
        const fieldValue = await prisma.appointmentCustomFieldValue.upsert({
          where: {
            appointmentId_customFieldId: {
              appointmentId: appointment.id,
              customFieldId: field.id
            }
          },
          update: { value },
          create: {
            appointmentId: appointment.id,
            customFieldId: field.id,
            value
          }
        });
        createdValues.push(fieldValue);
      } catch {
        // Ignore duplicate errors
      }
    }
  }

  console.log(`✅ Appointment custom field values seeded: ${createdValues.length} values\n`);

  return createdValues;
};
