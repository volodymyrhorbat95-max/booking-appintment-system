import type { Request, Response } from 'express';
import prisma from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { createCalendarEvent, updateCalendarEvent } from '../services/google-calendar.service';
import {
  sendBookingConfirmation,
  sendCancellationNotification,
  scheduleRemindersForAppointment,
  cancelScheduledReminders
} from '../services/whatsapp.service';
import {
  sendBookingConfirmationEmail,
  sendCancellationEmail
} from '../services/email.service';
import { createDepositPreference } from '../services/mercadopago.service';
import { consumeSlotHold, validateHoldForBooking } from '../services/slot-hold.service';

// ============================================
// APPOINTMENT CONTROLLER
// Public endpoint for creating appointments
// CRITICAL: Transaction-based booking to prevent double bookings
// ============================================

// Generate unique booking reference (6 alphanumeric characters)
const generateBookingReference = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Request body interface
interface CreateAppointmentRequest {
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  countryCode: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  sessionId?: string; // For slot hold validation (Requirement 10.1)
  customFieldValues?: Record<string, string>;
}

// Create new appointment (public endpoint)
// Section 13.2: Data Protection - Input validation via Zod middleware (appointment.routes.ts)
// Section 13.3: Access Control - Public endpoint (no auth required for patients)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    // Params validated by validateParams(slugParamSchema)
    const { slug } = req.params;

    // Body validated by validateBody(createBookingSchema) - all fields sanitized and validated
    const {
      firstName,
      lastName,
      email,
      whatsappNumber,
      countryCode,
      date,
      time,
      sessionId,
      customFieldValues
    } = req.body as CreateAppointmentRequest;

    // Input is already validated by Zod middleware:
    // - firstName/lastName: trimmed, 1-100 chars
    // - email: valid format, lowercase, trimmed
    // - whatsappNumber: digits only, 6-15 chars
    // - countryCode: valid format (+XX)
    // - date: YYYY-MM-DD format, today or future
    // - time: HH:MM format

    const appointmentDate = new Date(date);

    // Get professional by slug
    const professional = await prisma.professional.findUnique({
      where: { slug },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isSuspended: true,
        depositEnabled: true,
        depositAmount: true,
        timezone: true
      }
    });

    if (!professional || !professional.isActive || professional.isSuspended) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Get appointment duration
    const settings = await prisma.professionalSettings.findUnique({
      where: { professionalId: professional.id }
    });
    const appointmentDuration = settings?.appointmentDuration || 30;

    // Calculate start and end times
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(1970, 0, 1, hours, minutes, 0, 0);

    let endMinutes = minutes + appointmentDuration;
    let endHours = hours;
    while (endMinutes >= 60) {
      endMinutes -= 60;
      endHours += 1;
    }
    const endTime = new Date(1970, 0, 1, endHours, endMinutes, 0, 0);

    // Format WhatsApp number with country code
    const fullWhatsappNumber = `${countryCode}${whatsappNumber.replace(/\D/g, '')}`;

    // ============================================
    // SLOT HOLD VALIDATION (Requirement 10.1)
    // If sessionId is provided, validate the hold before proceeding
    // ============================================
    if (sessionId) {
      const holdValid = await validateHoldForBooking({
        professionalId: professional.id,
        date: appointmentDate,
        startTime,
        sessionId
      });

      if (!holdValid) {
        return res.status(409).json({
          success: false,
          error: 'Este horario está siendo reservado por otra persona. Por favor selecciona otro.'
        });
      }
    }

    // ============================================
    // TRANSACTION-BASED BOOKING (CRITICAL)
    // This prevents double bookings by checking and creating in a single transaction
    // ============================================
    const result = await prisma.$transaction(async (tx) => {
      // Check if slot is still available (within transaction)
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          professionalId: professional.id,
          date: appointmentDate,
          startTime: startTime,
          status: {
            notIn: ['CANCELLED']
          }
        }
      });

      if (existingAppointment) {
        throw new Error('SLOT_NOT_AVAILABLE');
      }

      // Check if date is blocked
      const blockedDate = await tx.blockedDate.findFirst({
        where: {
          professionalId: professional.id,
          date: appointmentDate
        }
      });

      if (blockedDate) {
        throw new Error('DATE_BLOCKED');
      }

      // Check if day of week has availability
      const dayOfWeek = appointmentDate.getDay();
      const availability = await tx.availability.findFirst({
        where: {
          professionalId: professional.id,
          dayOfWeek,
          isActive: true
        }
      });

      if (!availability) {
        throw new Error('NO_AVAILABILITY');
      }

      // Find or create patient
      let patient = await tx.patient.findFirst({
        where: {
          professionalId: professional.id,
          whatsappNumber: fullWhatsappNumber
        }
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            professionalId: professional.id,
            firstName,
            lastName,
            email,
            whatsappNumber: fullWhatsappNumber,
            countryCode
          }
        });
      } else {
        // Update patient info if changed
        patient = await tx.patient.update({
          where: { id: patient.id },
          data: {
            firstName,
            lastName,
            email
          }
        });
      }

      // Generate unique booking reference
      let bookingReference: string;
      let isUnique = false;
      let attempts = 0;

      do {
        bookingReference = generateBookingReference();
        const existing = await tx.appointment.findUnique({
          where: { bookingReference }
        });
        isUnique = !existing;
        attempts++;
      } while (!isUnique && attempts < 10);

      if (!isUnique) {
        throw new Error('BOOKING_REF_GENERATION_FAILED');
      }

      // Determine initial status and deposit requirement
      const depositRequired = professional.depositEnabled && professional.depositAmount;
      const initialStatus = depositRequired ? 'PENDING_PAYMENT' : 'PENDING';

      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: appointmentDate,
          startTime,
          endTime,
          status: initialStatus,
          bookingReference: bookingReference!,
          depositRequired: depositRequired ? true : false,
          depositAmount: depositRequired ? professional.depositAmount : null
        }
      });

      // Save custom field values if any
      if (customFieldValues && Object.keys(customFieldValues).length > 0) {
        const customFieldEntries = Object.entries(customFieldValues).filter(
          ([key]) => !key.startsWith('fixed-') && key !== 'countryCode'
        );

        if (customFieldEntries.length > 0) {
          await tx.appointmentCustomFieldValue.createMany({
            data: customFieldEntries.map(([customFieldId, value]) => ({
              appointmentId: appointment.id,
              customFieldId,
              value: String(value)
            }))
          });
        }
      }

      return {
        appointment,
        patient
      };
    });

    // ============================================
    // CONSUME SLOT HOLD (Requirement 10.1)
    // Release the hold after successful booking (non-blocking)
    // ============================================
    if (sessionId) {
      consumeSlotHold({
        professionalId: professional.id,
        date: appointmentDate,
        startTime,
        sessionId
      }).catch(err => {
        console.error('Slot hold consumption error (non-blocking):', err);
      });
    }

    // Sync to Google Calendar (non-blocking)
    createCalendarEvent({
      professionalId: professional.id,
      appointmentId: result.appointment.id,
      date: appointmentDate,
      startTime,
      endTime,
      patientName: `${result.patient.firstName} ${result.patient.lastName}`,
      patientEmail: result.patient.email,
      status: result.appointment.status,
      bookingReference: result.appointment.bookingReference
    }).catch(err => {
      console.error('Google Calendar sync error (non-blocking):', err);
    });

    // Send WhatsApp booking confirmation (non-blocking)
    sendBookingConfirmation({
      appointmentId: result.appointment.id
    }).catch(err => {
      console.error('WhatsApp confirmation error (non-blocking):', err);
    });

    // Send email booking confirmation (non-blocking)
    sendBookingConfirmationEmail({
      appointmentId: result.appointment.id
    }).catch(err => {
      console.error('Email confirmation error (non-blocking):', err);
    });

    // Schedule reminders (non-blocking)
    scheduleRemindersForAppointment({
      appointmentId: result.appointment.id,
      professionalId: professional.id,
      appointmentDate,
      appointmentTime: startTime
    }).catch(err => {
      console.error('Reminder scheduling error (non-blocking):', err);
    });

    // Format response
    const appointmentDate2 = new Date(date);
    const formattedDate = appointmentDate2.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return res.status(201).json({
      success: true,
      data: {
        bookingReference: result.appointment.bookingReference,
        professional: {
          fullName: `${professional.firstName} ${professional.lastName}`
        },
        appointment: {
          date: formattedDate,
          time: time,
          status: result.appointment.status
        },
        patient: {
          firstName: result.patient.firstName,
          lastName: result.patient.lastName,
          email: result.patient.email
        },
        deposit: professional.depositEnabled
          ? {
              required: true,
              amount: Number(professional.depositAmount),
              paymentUrl: null // Will be set when Mercado Pago is integrated
            }
          : {
              required: false
            }
      }
    });
  } catch (error: unknown) {
    console.error('Error creating appointment:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'SLOT_NOT_AVAILABLE') {
        return res.status(409).json({
          success: false,
          error: 'Este horario ya no está disponible. Por favor selecciona otro.'
        });
      }
      if (error.message === 'DATE_BLOCKED') {
        return res.status(409).json({
          success: false,
          error: 'Esta fecha no está disponible para reservas.'
        });
      }
      if (error.message === 'NO_AVAILABILITY') {
        return res.status(409).json({
          success: false,
          error: 'No hay disponibilidad para este día.'
        });
      }
      if (error.message === 'BOOKING_REF_GENERATION_FAILED') {
        return res.status(500).json({
          success: false,
          error: 'Error al generar la referencia de reserva. Intenta nuevamente.'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Error al crear la reserva. Por favor intenta nuevamente.'
    });
  }
};

// Get appointment by booking reference (for confirmation/cancellation page)
export const getAppointmentByReference = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const { email } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Referencia de reserva requerida'
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { bookingReference: reference.toUpperCase() },
      include: {
        professional: {
          select: {
            firstName: true,
            lastName: true,
            slug: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            whatsappNumber: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // If email is provided, verify it matches
    if (email && appointment.patient.email.toLowerCase() !== String(email).toLowerCase()) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // Format date for display
    const formattedDate = appointment.date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format time for display
    const startTime = appointment.startTime instanceof Date
      ? `${appointment.startTime.getHours().toString().padStart(2, '0')}:${appointment.startTime.getMinutes().toString().padStart(2, '0')}`
      : String(appointment.startTime).substring(0, 5);

    return res.json({
      success: true,
      data: {
        bookingReference: appointment.bookingReference,
        status: appointment.status,
        date: formattedDate,
        time: startTime,
        professional: {
          fullName: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
          slug: appointment.professional.slug
        },
        patient: {
          firstName: appointment.patient.firstName,
          lastName: appointment.patient.lastName,
          email: appointment.patient.email
        },
        canCancel: ['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT', 'CONFIRMED'].includes(
          appointment.status
        ),
        deposit: {
          required: appointment.depositRequired,
          amount: appointment.depositAmount ? Number(appointment.depositAmount) : null,
          paid: appointment.depositPaid
        }
      }
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la reserva'
    });
  }
};

// Cancel appointment by patient
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const { email, reason } = req.body;

    if (!reference || !email) {
      return res.status(400).json({
        success: false,
        error: 'Referencia y email son requeridos'
      });
    }

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: { bookingReference: reference.toUpperCase() },
      include: {
        patient: {
          select: {
            email: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // Verify email matches
    if (appointment.patient.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // Check if can be cancelled
    if (!['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT', 'CONFIRMED'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: 'Esta reserva no puede ser cancelada'
      });
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelado por el paciente',
        cancelledBy: 'patient'
      }
    });

    // Cancel any scheduled reminders
    await cancelScheduledReminders(appointment.id);

    // Update Google Calendar event (non-blocking)
    if (appointment.googleEventId) {
      updateCalendarEvent({
        professionalId: appointment.professionalId,
        googleEventId: appointment.googleEventId,
        status: 'CANCELLED'
      }).catch(err => {
        console.error('Google Calendar update error (non-blocking):', err);
      });
    }

    // Send cancellation notification via WhatsApp (non-blocking)
    sendCancellationNotification({
      appointmentId: appointment.id
    }).catch(err => {
      console.error('WhatsApp cancellation notification error (non-blocking):', err);
    });

    // Send cancellation notification via email (non-blocking)
    sendCancellationEmail({
      appointmentId: appointment.id
    }).catch(err => {
      console.error('Email cancellation notification error (non-blocking):', err);
    });

    return res.json({
      success: true,
      data: {
        bookingReference: updatedAppointment.bookingReference,
        status: updatedAppointment.status,
        message: 'Tu reserva ha sido cancelada exitosamente'
      }
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al cancelar la reserva'
    });
  }
};

// ============================================
// CREATE DEPOSIT PAYMENT PREFERENCE
// Public endpoint - patient requests payment link
// ============================================

export const createDepositPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const { email } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Referencia de reserva requerida'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requerido para verificación'
      });
    }

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: { bookingReference: reference.toUpperCase() },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // Verify email matches
    if (appointment.patient.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // Check if deposit is required
    if (!appointment.depositRequired || !appointment.depositAmount) {
      return res.status(400).json({
        success: false,
        error: 'Esta reserva no requiere depósito'
      });
    }

    // Check if already paid
    if (appointment.depositPaid) {
      return res.status(400).json({
        success: false,
        error: 'El depósito ya ha sido pagado'
      });
    }

    // Check if appointment is in valid status for payment
    if (appointment.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({
        success: false,
        error: 'Esta reserva no puede recibir pagos en su estado actual'
      });
    }

    // Create Mercado Pago preference for deposit
    const preference = await createDepositPreference({
      appointmentId: appointment.id,
      professionalId: appointment.professional.id,
      patientEmail: appointment.patient.email,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      amount: Number(appointment.depositAmount),
      bookingReference: appointment.bookingReference
    });

    return res.json({
      success: true,
      data: {
        preferenceId: preference.preferenceId,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
        amount: Number(appointment.depositAmount),
        currency: 'ARS'
      }
    });
  } catch (error) {
    console.error('Error creating deposit payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear el pago de depósito'
    });
  }
};
