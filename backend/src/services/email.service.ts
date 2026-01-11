import { Resend } from 'resend';
import prisma from '../config/database';
import { logger, ServiceLogger } from '../utils/logger';
import { decrypt } from '../utils/encryption';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';

// ============================================
// EMAIL TEMPLATES
// ============================================

interface EmailVariables {
  patient_name: string;
  professional_name: string;
  date: string;
  time: string;
  booking_reference: string;
  cancel_url?: string;
}

function getBookingConfirmationHTML(variables: EmailVariables): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmacion de Cita</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Cita Confirmada</h1>

    <p>Hola <strong>${variables.patient_name}</strong>,</p>

    <p>Tu cita ha sido reservada exitosamente.</p>

    <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${variables.date}</p>
      <p style="margin: 5px 0;"><strong>Hora:</strong> ${variables.time}</p>
      <p style="margin: 5px 0;"><strong>Profesional:</strong> ${variables.professional_name}</p>
      <p style="margin: 5px 0;"><strong>Referencia:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${variables.booking_reference}</code></p>
    </div>

    <p style="color: #666; font-size: 14px;">
      Guarda tu codigo de referencia. Lo necesitaras si deseas modificar o cancelar tu cita.
    </p>

    ${variables.cancel_url ? `
    <p style="margin-top: 20px;">
      <a href="${variables.cancel_url}" style="color: #dc2626; text-decoration: underline;">Cancelar esta cita</a>
    </p>
    ` : ''}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

    <p style="color: #999; font-size: 12px; margin: 0;">
      Este es un mensaje automatico. Por favor no respondas a este email.
    </p>
  </div>
</body>
</html>
`;
}

function getReminderHTML(variables: EmailVariables): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Cita</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef3c7; padding: 30px; border-radius: 10px;">
    <h1 style="color: #d97706; margin-bottom: 20px;">Recordatorio de Cita</h1>

    <p>Hola <strong>${variables.patient_name}</strong>,</p>

    <p>Te recordamos que tienes una cita proxima:</p>

    <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${variables.date}</p>
      <p style="margin: 5px 0;"><strong>Hora:</strong> ${variables.time}</p>
      <p style="margin: 5px 0;"><strong>Profesional:</strong> ${variables.professional_name}</p>
      <p style="margin: 5px 0;"><strong>Referencia:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${variables.booking_reference}</code></p>
    </div>

    <p style="color: #666; font-size: 14px;">
      Por favor confirma tu asistencia o cancela si no podras asistir.
    </p>

    ${variables.cancel_url ? `
    <p style="margin-top: 20px;">
      <a href="${variables.cancel_url}" style="color: #dc2626; text-decoration: underline;">Cancelar esta cita</a>
    </p>
    ` : ''}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

    <p style="color: #999; font-size: 12px; margin: 0;">
      Este es un mensaje automatico. Por favor no respondas a este email.
    </p>
  </div>
</body>
</html>
`;
}

function getCancellationHTML(variables: EmailVariables): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Cancelada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; padding: 30px; border-radius: 10px;">
    <h1 style="color: #dc2626; margin-bottom: 20px;">Cita Cancelada</h1>

    <p>Hola <strong>${variables.patient_name}</strong>,</p>

    <p>Tu cita ha sido cancelada.</p>

    <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${variables.date}</p>
      <p style="margin: 5px 0;"><strong>Hora:</strong> ${variables.time}</p>
      <p style="margin: 5px 0;"><strong>Profesional:</strong> ${variables.professional_name}</p>
      <p style="margin: 5px 0;"><strong>Referencia:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${variables.booking_reference}</code></p>
    </div>

    <p style="color: #666; font-size: 14px;">
      Si deseas reprogramar tu cita, puedes hacerlo en linea en cualquier momento.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

    <p style="color: #999; font-size: 12px; margin: 0;">
      Este es un mensaje automatico. Por favor no respondas a este email.
    </p>
  </div>
</body>
</html>
`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDateForEmail(date: Date | string, timezone: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone
  });
}

function formatTimeForEmail(time: Date | string, timezone: string): string {
  const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time;
  return timeObj.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  });
}

// ============================================
// SEND EMAIL FUNCTION
// ============================================

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  try {
    if (!resend) {
      logger.info('Email service not configured (RESEND_API_KEY missing). Skipping email.');
      return true; // Return true to not block the flow
    }

    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html
    });

    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error('Error sending email', { error });
    return false;
  }
}

// ============================================
// SEND BOOKING CONFIRMATION EMAIL
// ============================================

interface BookingConfirmationParams {
  appointmentId: string;
}

export async function sendBookingConfirmationEmail({ appointmentId }: BookingConfirmationParams): Promise<boolean> {
  try {
    // Get appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: true
      }
    });

    if (!appointment) {
      logger.error('Appointment not found', { appointmentId });
      return false;
    }

    // SECURITY FIX: Decrypt patient email before sending
    const decryptedEmail = decrypt(appointment.patient.email);

    // Prepare variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const variables: EmailVariables = {
      patient_name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      professional_name: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
      date: formatDateForEmail(appointment.date, appointment.professional.timezone),
      time: formatTimeForEmail(appointment.startTime, appointment.professional.timezone),
      booking_reference: appointment.bookingReference,
      cancel_url: `${frontendUrl}/cancel?ref=${appointment.bookingReference}`
    };

    // Send email
    return await sendEmail({
      to: decryptedEmail,
      subject: `Confirmacion de cita - ${variables.date}`,
      html: getBookingConfirmationHTML(variables)
    });
  } catch (error) {
    logger.error('Error sending booking confirmation email', { error, appointmentId });
    return false;
  }
}

// ============================================
// SEND REMINDER EMAIL
// ============================================

interface SendReminderEmailParams {
  appointmentId: string;
}

export async function sendReminderEmail({ appointmentId }: SendReminderEmailParams): Promise<boolean> {
  try {
    // Get appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: true
      }
    });

    if (!appointment) {
      logger.error('Appointment not found', { appointmentId });
      return false;
    }

    // Don't send reminders for cancelled/completed appointments
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || appointment.status === 'NO_SHOW') {
      logger.info('Skipping reminder email for non-active appointment:', appointmentId);
      return true;
    }

    // SECURITY FIX: Decrypt patient email before sending
    const decryptedEmail = decrypt(appointment.patient.email);

    // Prepare variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const variables: EmailVariables = {
      patient_name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      professional_name: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
      date: formatDateForEmail(appointment.date, appointment.professional.timezone),
      time: formatTimeForEmail(appointment.startTime, appointment.professional.timezone),
      booking_reference: appointment.bookingReference,
      cancel_url: `${frontendUrl}/cancel?ref=${appointment.bookingReference}`
    };

    // Send email
    return await sendEmail({
      to: decryptedEmail,
      subject: `Recordatorio de cita - ${variables.date}`,
      html: getReminderHTML(variables)
    });
  } catch (error) {
    logger.error('Error sending reminder email', { error, appointmentId });
    return false;
  }
}

// ============================================
// SEND CANCELLATION EMAIL
// ============================================

interface SendCancellationEmailParams {
  appointmentId: string;
}

export async function sendCancellationEmail({ appointmentId }: SendCancellationEmailParams): Promise<boolean> {
  try {
    // Get appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: true
      }
    });

    if (!appointment) {
      logger.error('Appointment not found', { appointmentId });
      return false;
    }

    // SECURITY FIX: Decrypt patient email before sending
    const decryptedEmail = decrypt(appointment.patient.email);

    // Prepare variables
    const variables: EmailVariables = {
      patient_name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      professional_name: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
      date: formatDateForEmail(appointment.date, appointment.professional.timezone),
      time: formatTimeForEmail(appointment.startTime, appointment.professional.timezone),
      booking_reference: appointment.bookingReference
    };

    // Send email
    return await sendEmail({
      to: decryptedEmail,
      subject: `Cita cancelada - ${variables.booking_reference}`,
      html: getCancellationHTML(variables)
    });
  } catch (error) {
    logger.error('Error sending cancellation email', { error, appointmentId });
    return false;
  }
}
