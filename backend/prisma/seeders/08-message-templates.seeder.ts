// ============================================
// MESSAGE TEMPLATES SEEDERS
// Creates WhatsApp message templates
// ============================================

import { MessageTemplateType } from '@prisma/client';
import prisma from '../../src/config/database';

export const seedMessageTemplates = async (professionals: any[]) => {
  console.log('🌱 Seeding message templates...');

  const createdTemplates: any[] = [];

  const templates = [
    {
      type: MessageTemplateType.BOOKING_CONFIRMATION,
      messageText: 'Hola {patient_name}, tu turno con {professional_name} ha sido confirmado para el {appointment_date} a las {appointment_time}. Referencia: {booking_reference}'
    },
    {
      type: MessageTemplateType.REMINDER,
      messageText: 'Hola {patient_name}, te recordamos tu turno con {professional_name} mañana {appointment_date} a las {appointment_time}. ¿Confirmas tu asistencia?'
    },
    {
      type: MessageTemplateType.CANCELLATION,
      messageText: 'Hola {patient_name}, tu turno con {professional_name} del {appointment_date} a las {appointment_time} ha sido cancelado. Referencia: {booking_reference}'
    }
  ];

  for (const professional of professionals) {
    for (const template of templates) {
      const messageTemplate = await prisma.messageTemplate.upsert({
        where: {
          professionalId_type: {
            professionalId: professional.id,
            type: template.type
          }
        },
        update: {},
        create: {
          professionalId: professional.id,
          type: template.type,
          messageText: template.messageText,
          isActive: true
        }
      });
      createdTemplates.push(messageTemplate);
    }
    console.log(`  ✓ Created message templates for ${professional.firstName}`);
  }

  console.log(`✅ Message templates seeded: ${createdTemplates.length} templates\n`);

  return createdTemplates;
};
