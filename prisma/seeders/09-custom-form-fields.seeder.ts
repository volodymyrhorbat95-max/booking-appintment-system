// ============================================
// CUSTOM FORM FIELDS SEEDERS
// Creates custom form fields for booking forms
// ============================================

import { FieldType } from '@prisma/client';
import prisma from '../../src/config/database';

export const seedCustomFormFields = async (professionals: any[]) => {
  console.log('🌱 Seeding custom form fields...');

  const createdFields: any[] = [];

  // Dr. Garcia - Medical specialization, needs additional fields
  const garciaFields = [
    {
      fieldName: 'Motivo de consulta',
      fieldType: FieldType.TEXT,
      isRequired: true,
      displayOrder: 1,
      options: []
    },
    {
      fieldName: 'Primera vez?',
      fieldType: FieldType.DROPDOWN,
      isRequired: true,
      displayOrder: 2,
      options: ['Sí', 'No']
    },
    {
      fieldName: 'Obra social',
      fieldType: FieldType.TEXT,
      isRequired: false,
      displayOrder: 3,
      options: []
    }
  ];

  for (const field of garciaFields) {
    const customField = await prisma.customFormField.create({
      data: {
        professionalId: professionals[0].id,
        ...field,
        isActive: true
      }
    });
    createdFields.push(customField);
  }
  console.log(`  ✓ Created custom fields for Dr. Garcia`);

  // Lic. Rodriguez - Psychology, needs therapy type
  const rodriguezFields = [
    {
      fieldName: 'Tipo de terapia',
      fieldType: FieldType.DROPDOWN,
      isRequired: true,
      displayOrder: 1,
      options: ['Individual', 'Pareja', 'Familiar', 'Grupal']
    },
    {
      fieldName: 'Cómo nos conociste?',
      fieldType: FieldType.DROPDOWN,
      isRequired: false,
      displayOrder: 2,
      options: ['Recomendación', 'Google', 'Redes sociales', 'Otro']
    }
  ];

  for (const field of rodriguezFields) {
    const customField = await prisma.customFormField.create({
      data: {
        professionalId: professionals[2].id,
        ...field,
        isActive: true
      }
    });
    createdFields.push(customField);
  }
  console.log(`  ✓ Created custom fields for Lic. Rodriguez`);

  // Dr. Lopez - No custom fields (simple booking)
  console.log(`  ○ No custom fields for Dr. Lopez (simple booking)`);

  console.log(`✅ Custom form fields seeded: ${createdFields.length} fields\n`);

  return createdFields;
};
