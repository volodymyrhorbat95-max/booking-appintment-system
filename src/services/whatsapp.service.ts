import twilio from 'twilio';
import prisma from '../config/database';

type MessageTemplateType = 'BOOKING_CONFIRMATION' | 'REMINDER' | 'CANCELLATION';

// Twilio client - initialized lazily to handle missing credentials gracefully
let twilioClient: twilio.Twilio | null = null;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '';

// Check if Twilio is properly configured
const isTwilioConfigured = (): boolean => {
  return TWILIO_ACCOUNT_SID.startsWith('AC') && TWILIO_AUTH_TOKEN.length > 0;
};

// Get or create Twilio client
const getTwilioClient = (): twilio.Twilio | null => {
  if (!isTwilioConfigured()) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

// ============================================
// MESSAGE TEMPLATES
// ============================================

// Default templates (used when professional hasn't customized)
// Include clear CONFIRM/CANCEL instructions for interactive responses
const DEFAULT_TEMPLATES = {
  BOOKING_CONFIRMATION: `Hola {patient_name}! Tu cita ha sido reservada exitosamente.

*Detalles de tu cita:*
Fecha: {date}
Hora: {time}
Profesional: {professional_name}
Referencia: {booking_reference}

Recibirás un recordatorio antes de tu cita.`,

  REMINDER: `Hola {patient_name}! Te recordamos tu cita:

*Detalles:*
Fecha: {date}
Hora: {time}
Profesional: {professional_name}

*Para confirmar tu asistencia responde:* SI o CONFIRMO
*Para cancelar tu cita responde:* NO o CANCELAR

Tu respuesta nos ayuda a gestionar mejor los turnos.`,

  CANCELLATION: `Hola {patient_name}, tu cita ha sido cancelada.

*Detalles de la cita cancelada:*
Fecha: {date}
Hora: {time}
Profesional: {professional_name}
Referencia: {booking_reference}

Si deseas reprogramar, puedes hacerlo en línea en cualquier momento.`
};

// ============================================
// HELPER FUNCTIONS
// ============================================

interface MessageVariables {
  patient_name: string;
  professional_name: string;
  date: string;
  time: string;
  booking_reference: string;
}

function replaceVariables(template: string, variables: MessageVariables): string {
  let message = template;
  message = message.replace(/{patient_name}/g, variables.patient_name);
  message = message.replace(/{professional_name}/g, variables.professional_name);
  message = message.replace(/{date}/g, variables.date);
  message = message.replace(/{time}/g, variables.time);
  message = message.replace(/{booking_reference}/g, variables.booking_reference);
  return message;
}

function formatDateForMessage(date: Date | string, timezone: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone
  });
}

function formatTimeForMessage(time: Date | string, timezone: string): string {
  const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time;
  return timeObj.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  });
}

// Format WhatsApp number to E.164 format
function formatWhatsAppNumber(number: string): string {
  // Remove all non-digit characters except +
  let cleaned = number.replace(/[^\d+]/g, '');

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return `whatsapp:${cleaned}`;
}

// ============================================
// SEND WHATSAPP MESSAGE
// ============================================

interface SendMessageParams {
  to: string;
  message: string;
}

export async function sendWhatsAppMessage({ to, message }: SendMessageParams): Promise<boolean> {
  try {
    const client = getTwilioClient();
    if (!client) {
      console.warn('Twilio not configured - skipping WhatsApp message');
      return false;
    }

    if (!TWILIO_WHATSAPP_NUMBER) {
      console.error('TWILIO_WHATSAPP_NUMBER not configured');
      return false;
    }

    const formattedTo = formatWhatsAppNumber(to);

    await client.messages.create({
      body: message,
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: formattedTo
    });

    console.log(`WhatsApp message sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// ============================================
// SEND WHATSAPP MESSAGE WITH INTERACTIVE BUTTONS
// Uses Twilio Content API for interactive templates
// ============================================

interface SendInteractiveMessageParams {
  to: string;
  message: string;
  buttons: { id: string; title: string }[];
}

export async function sendWhatsAppInteractiveMessage({
  to,
  message,
  buttons
}: SendInteractiveMessageParams): Promise<boolean> {
  try {
    const client = getTwilioClient();
    if (!client) {
      console.warn('Twilio not configured - skipping WhatsApp interactive message');
      return false;
    }

    if (!TWILIO_WHATSAPP_NUMBER) {
      console.error('TWILIO_WHATSAPP_NUMBER not configured');
      return false;
    }

    const formattedTo = formatWhatsAppNumber(to);

    // Create message with quick reply buttons using Twilio's persistent menu
    // Note: For full interactive buttons, you need Twilio Content API templates
    // This uses the simplified approach with action text
    const buttonText = buttons.map(b => `- Responde "${b.title}" para ${b.id === 'confirm' ? 'CONFIRMAR' : 'CANCELAR'}`).join('\n');
    const fullMessage = `${message}\n\n${buttonText}`;

    await client.messages.create({
      body: fullMessage,
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: formattedTo
    });

    console.log(`WhatsApp interactive message sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp interactive message:', error);
    return false;
  }
}

// ============================================
// SEND BOOKING CONFIRMATION
// ============================================

interface BookingConfirmationParams {
  appointmentId: string;
}

export async function sendBookingConfirmation({ appointmentId }: BookingConfirmationParams): Promise<boolean> {
  try {
    // Get appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: {
          include: {
            user: true,
            messageTemplates: {
              where: { type: 'BOOKING_CONFIRMATION', isActive: true }
            }
          }
        }
      }
    });

    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return false;
    }

    // Get template (custom or default)
    const customTemplate = appointment.professional.messageTemplates[0];
    const template = customTemplate?.messageText || DEFAULT_TEMPLATES.BOOKING_CONFIRMATION;

    // Prepare variables
    const variables: MessageVariables = {
      patient_name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      professional_name: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
      date: formatDateForMessage(appointment.date, appointment.professional.timezone),
      time: formatTimeForMessage(appointment.startTime, appointment.professional.timezone),
      booking_reference: appointment.bookingReference
    };

    // Replace variables in template
    const message = replaceVariables(template, variables);

    // Send message
    return await sendWhatsAppMessage({
      to: appointment.patient.whatsappNumber,
      message
    });
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return false;
  }
}

// ============================================
// SEND REMINDER
// ============================================

interface SendReminderParams {
  appointmentId: string;
}

export async function sendReminder({ appointmentId }: SendReminderParams): Promise<boolean> {
  try {
    // Get appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: {
          include: {
            user: true,
            messageTemplates: {
              where: { type: 'REMINDER', isActive: true }
            }
          }
        }
      }
    });

    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return false;
    }

    // Don't send reminders for cancelled/completed appointments
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || appointment.status === 'NO_SHOW') {
      console.log('Skipping reminder for non-active appointment:', appointmentId);
      return true;
    }

    // Get template (custom or default)
    const customTemplate = appointment.professional.messageTemplates[0];
    const template = customTemplate?.messageText || DEFAULT_TEMPLATES.REMINDER;

    // Prepare variables
    const variables: MessageVariables = {
      patient_name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      professional_name: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
      date: formatDateForMessage(appointment.date, appointment.professional.timezone),
      time: formatTimeForMessage(appointment.startTime, appointment.professional.timezone),
      booking_reference: appointment.bookingReference
    };

    // Replace variables in template
    const message = replaceVariables(template, variables);

    // Send message
    const sent = await sendWhatsAppMessage({
      to: appointment.patient.whatsappNumber,
      message
    });

    // Update appointment status to REMINDER_SENT if still pending
    if (sent && (appointment.status === 'PENDING' || appointment.status === 'PENDING_PAYMENT')) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'REMINDER_SENT' }
      });
    }

    return sent;
  } catch (error) {
    console.error('Error sending reminder:', error);
    return false;
  }
}

// ============================================
// SEND CANCELLATION NOTIFICATION
// ============================================

interface SendCancellationParams {
  appointmentId: string;
}

export async function sendCancellationNotification({ appointmentId }: SendCancellationParams): Promise<boolean> {
  try {
    // Get appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: {
          include: {
            user: true,
            messageTemplates: {
              where: { type: 'CANCELLATION', isActive: true }
            }
          }
        }
      }
    });

    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return false;
    }

    // Get template (custom or default)
    const customTemplate = appointment.professional.messageTemplates[0];
    const template = customTemplate?.messageText || DEFAULT_TEMPLATES.CANCELLATION;

    // Prepare variables
    const variables: MessageVariables = {
      patient_name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      professional_name: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
      date: formatDateForMessage(appointment.date, appointment.professional.timezone),
      time: formatTimeForMessage(appointment.startTime, appointment.professional.timezone),
      booking_reference: appointment.bookingReference
    };

    // Replace variables in template
    const message = replaceVariables(template, variables);

    // Send message
    return await sendWhatsAppMessage({
      to: appointment.patient.whatsappNumber,
      message
    });
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    return false;
  }
}

// ============================================
// SCHEDULE REMINDERS FOR APPOINTMENT
// ============================================

interface ScheduleRemindersParams {
  appointmentId: string;
  professionalId: string;
  appointmentDate: Date;
  appointmentTime: Date;
}

export async function scheduleRemindersForAppointment({
  appointmentId,
  professionalId,
  appointmentDate,
  appointmentTime
}: ScheduleRemindersParams): Promise<void> {
  try {
    // Get professional's reminder settings
    const reminderSettings = await prisma.reminderSetting.findMany({
      where: { professionalId, isActive: true },
      orderBy: { reminderNumber: 'asc' }
    });

    // If no settings, use default (24 hours before)
    if (reminderSettings.length === 0) {
      const appointmentDateTime = combineDateTime(appointmentDate, appointmentTime);
      const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);

      await prisma.scheduledReminder.create({
        data: {
          appointmentId,
          scheduledFor: reminderTime,
          status: 'pending'
        }
      });
      return;
    }

    // Get professional timezone
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { timezone: true }
    });
    const timezone = professional?.timezone || 'America/Argentina/Buenos_Aires';

    // Create scheduled reminders based on settings
    for (const setting of reminderSettings) {
      const appointmentDateTime = combineDateTime(appointmentDate, appointmentTime);
      let reminderTime = new Date(appointmentDateTime.getTime() - setting.hoursBefore * 60 * 60 * 1000);

      // Handle night-before option for early morning appointments
      if (setting.enableNightBefore) {
        const appointmentHour = appointmentDateTime.getHours();

        // If appointment is before 10 AM and reminder would be very early (before 7 AM)
        if (appointmentHour < 10 && reminderTime.getHours() < 7) {
          // Send reminder the night before at 20:00 (8 PM)
          reminderTime = new Date(appointmentDateTime);
          reminderTime.setDate(reminderTime.getDate() - 1);
          reminderTime.setHours(20, 0, 0, 0);
        }
      }

      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        await prisma.scheduledReminder.create({
          data: {
            appointmentId,
            scheduledFor: reminderTime,
            status: 'pending'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
}

function combineDateTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  const timeDate = new Date(time);
  combined.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
  return combined;
}

// ============================================
// CANCEL SCHEDULED REMINDERS
// ============================================

export async function cancelScheduledReminders(appointmentId: string): Promise<void> {
  try {
    await prisma.scheduledReminder.updateMany({
      where: {
        appointmentId,
        status: 'pending'
      },
      data: {
        status: 'cancelled'
      }
    });
  } catch (error) {
    console.error('Error cancelling scheduled reminders:', error);
  }
}

// ============================================
// PROCESS INCOMING WHATSAPP MESSAGE
// ============================================

interface IncomingMessageParams {
  from: string; // WhatsApp number
  body: string; // Message content
}

interface ProcessMessageResult {
  success: boolean;
  action?: 'CONFIRMED' | 'CANCELLED' | 'UNKNOWN';
  appointmentId?: string;
  message?: string;
}

export async function processIncomingMessage({ from, body }: IncomingMessageParams): Promise<ProcessMessageResult> {
  try {
    // Clean the phone number (remove whatsapp: prefix if present)
    const cleanNumber = from.replace('whatsapp:', '').replace(/[^\d+]/g, '');

    // Find the patient by WhatsApp number
    const patient = await prisma.patient.findFirst({
      where: {
        whatsappNumber: {
          contains: cleanNumber.replace('+', '')
        }
      },
      include: {
        appointments: {
          where: {
            status: {
              in: ['PENDING', 'REMINDER_SENT', 'PENDING_PAYMENT']
            },
            date: {
              gte: new Date()
            }
          },
          orderBy: { date: 'asc' },
          take: 1,
          include: {
            professional: true
          }
        }
      }
    });

    if (!patient || patient.appointments.length === 0) {
      return {
        success: false,
        action: 'UNKNOWN',
        message: 'No se encontró una cita pendiente para este número.'
      };
    }

    const appointment = patient.appointments[0];
    const normalizedBody = body.toLowerCase().trim();

    // Check for confirmation keywords
    const confirmKeywords = ['si', 'sí', 'confirmo', 'confirmar', 'ok', 'yes', 'confirm', '1'];
    const cancelKeywords = ['no', 'cancelo', 'cancelar', 'cancel', '2'];

    if (confirmKeywords.some(keyword => normalizedBody.includes(keyword))) {
      // Confirm the appointment
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CONFIRMED' }
      });

      // Send confirmation response
      await sendWhatsAppMessage({
        to: patient.whatsappNumber,
        message: `¡Perfecto! Tu cita ha sido confirmada para el ${formatDateForMessage(appointment.date, appointment.professional.timezone)} a las ${formatTimeForMessage(appointment.startTime, appointment.professional.timezone)}. ¡Te esperamos!`
      });

      return {
        success: true,
        action: 'CONFIRMED',
        appointmentId: appointment.id
      };
    }

    if (cancelKeywords.some(keyword => normalizedBody.includes(keyword))) {
      // Cancel the appointment
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'patient',
          cancellationReason: 'Cancelado via WhatsApp'
        }
      });

      // Cancel any scheduled reminders
      await cancelScheduledReminders(appointment.id);

      // Send cancellation response
      await sendWhatsAppMessage({
        to: patient.whatsappNumber,
        message: `Tu cita del ${formatDateForMessage(appointment.date, appointment.professional.timezone)} ha sido cancelada. Si deseas reprogramar, puedes hacerlo en línea.`
      });

      return {
        success: true,
        action: 'CANCELLED',
        appointmentId: appointment.id
      };
    }

    // Unknown response
    await sendWhatsAppMessage({
      to: patient.whatsappNumber,
      message: 'No entendí tu respuesta. Por favor responde "SI" para confirmar o "NO" para cancelar tu cita.'
    });

    return {
      success: false,
      action: 'UNKNOWN',
      message: 'Respuesta no reconocida'
    };
  } catch (error) {
    console.error('Error processing incoming message:', error);
    return {
      success: false,
      message: 'Error procesando mensaje'
    };
  }
}

// ============================================
// GET PROFESSIONAL'S MESSAGE TEMPLATES
// ============================================

export async function getMessageTemplates(professionalId: string) {
  const templates = await prisma.messageTemplate.findMany({
    where: { professionalId },
    orderBy: { type: 'asc' }
  });

  // Return templates with defaults filled in
  const templateTypes: MessageTemplateType[] = ['BOOKING_CONFIRMATION', 'REMINDER', 'CANCELLATION'];

  return templateTypes.map(type => {
    const existing = templates.find(t => t.type === type);
    return {
      type,
      messageText: existing?.messageText || DEFAULT_TEMPLATES[type],
      isCustom: !!existing,
      isActive: existing?.isActive ?? true
    };
  });
}

// ============================================
// UPDATE MESSAGE TEMPLATE
// ============================================

interface UpdateTemplateParams {
  professionalId: string;
  type: MessageTemplateType;
  messageText: string;
}

export async function updateMessageTemplate({ professionalId, type, messageText }: UpdateTemplateParams) {
  return prisma.messageTemplate.upsert({
    where: {
      professionalId_type: { professionalId, type }
    },
    update: {
      messageText,
      isActive: true
    },
    create: {
      professionalId,
      type,
      messageText,
      isActive: true
    }
  });
}

// ============================================
// GET REMINDER SETTINGS
// ============================================

export async function getReminderSettings(professionalId: string) {
  return prisma.reminderSetting.findMany({
    where: { professionalId },
    orderBy: { reminderNumber: 'asc' }
  });
}

// ============================================
// UPDATE REMINDER SETTINGS
// ============================================

interface ReminderSettingInput {
  reminderNumber: number;
  hoursBefore: number;
  enableNightBefore: boolean;
  isActive: boolean;
}

export async function updateReminderSettings(
  professionalId: string,
  settings: ReminderSettingInput[]
) {
  // Delete existing settings
  await prisma.reminderSetting.deleteMany({
    where: { professionalId }
  });

  // Create new settings
  if (settings.length > 0) {
    await prisma.reminderSetting.createMany({
      data: settings.map(s => ({
        professionalId,
        reminderNumber: s.reminderNumber,
        hoursBefore: s.hoursBefore,
        enableNightBefore: s.enableNightBefore,
        isActive: s.isActive
      }))
    });
  }

  return prisma.reminderSetting.findMany({
    where: { professionalId },
    orderBy: { reminderNumber: 'asc' }
  });
}
