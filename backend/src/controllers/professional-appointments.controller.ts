import type { Response } from 'express';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/database';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { updateCalendarEvent } from '../services/google-calendar.service';
import { emitToProfessional, emitToAdmins, WebSocketEvent } from '../config/socket.config';
import { sendCancellationNotification } from '../services/whatsapp.service';
import { sendCancellationEmail } from '../services/email.service';
import { decrypt } from '../utils/encryption';

// ============================================
// PROFESSIONAL APPOINTMENTS CONTROLLER
// Authenticated endpoints for professionals to manage their appointments
// ============================================

// Helper to get professional from user ID
const getProfessionalByUserId = async (userId: string) => {
  return prisma.professional.findUnique({
    where: { userId }
  });
};

// Get appointments for professional (with filters)
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    const professionalId = professional.id;

    // Parse query parameters
    const {
      status,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    // Build where clause
    const where: Prisma.AppointmentWhereInput = {
      professionalId
    };

    // Filter by status
    if (status && typeof status === 'string') {
      if (status === 'active') {
        // Active = not cancelled, not completed, not no-show
        where.status = {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.PENDING_PAYMENT,
            AppointmentStatus.REMINDER_SENT,
            AppointmentStatus.CONFIRMED
          ]
        };
      } else {
        where.status = status.toUpperCase() as AppointmentStatus;
      }
    }

    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      where.date = { ...(where.date as object), gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === 'string') {
      where.date = { ...(where.date as object), lte: new Date(endDate) };
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await prisma.appointment.count({ where });

    // Get appointments with patient data
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            whatsappNumber: true,
            countryCode: true
          }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      skip,
      take: limitNum
    });

    // Format appointments for response
    const formattedAppointments = appointments.map((apt) => {
      // SECURITY FIX: Decrypt patient PII before returning to professional
      const decryptedEmail = decrypt(apt.patient.email);
      const decryptedWhatsappNumber = decrypt(apt.patient.whatsappNumber);

      return {
        id: apt.id,
        bookingReference: apt.bookingReference,
        date: apt.date.toISOString().split('T')[0],
        startTime:
          apt.startTime instanceof Date
            ? `${apt.startTime.getHours().toString().padStart(2, '0')}:${apt.startTime.getMinutes().toString().padStart(2, '0')}`
            : String(apt.startTime).substring(0, 5),
        endTime:
          apt.endTime instanceof Date
            ? `${apt.endTime.getHours().toString().padStart(2, '0')}:${apt.endTime.getMinutes().toString().padStart(2, '0')}`
            : String(apt.endTime).substring(0, 5),
        status: apt.status,
        patient: {
          id: apt.patient.id,
          firstName: apt.patient.firstName,
          lastName: apt.patient.lastName,
          fullName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          email: decryptedEmail,
          whatsappNumber: decryptedWhatsappNumber,
          countryCode: apt.patient.countryCode
        },
        deposit: {
          required: apt.depositRequired,
          amount: apt.depositAmount ? Number(apt.depositAmount) : null,
          paid: apt.depositPaid,
          paidAt: apt.depositPaidAt
        },
        cancellation: apt.cancelledAt
          ? {
              cancelledAt: apt.cancelledAt,
              reason: apt.cancellationReason,
              cancelledBy: apt.cancelledBy
            }
          : null,
        createdAt: apt.createdAt
      };
    });

    return res.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting appointments:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las citas'
    });
  }
};

// Get single appointment details
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    const professionalId = professional.id;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        professionalId
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            whatsappNumber: true,
            countryCode: true
          }
        },
        customFieldValues: {
          include: {
            customField: {
              select: {
                id: true,
                fieldName: true,
                fieldType: true
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    // SECURITY FIX: Decrypt patient PII before returning to professional
    const decryptedEmail = decrypt(appointment.patient.email);
    const decryptedWhatsappNumber = decrypt(appointment.patient.whatsappNumber);

    // Format response
    const formattedAppointment = {
      id: appointment.id,
      bookingReference: appointment.bookingReference,
      date: appointment.date.toISOString().split('T')[0],
      startTime:
        appointment.startTime instanceof Date
          ? `${appointment.startTime.getHours().toString().padStart(2, '0')}:${appointment.startTime.getMinutes().toString().padStart(2, '0')}`
          : String(appointment.startTime).substring(0, 5),
      endTime:
        appointment.endTime instanceof Date
          ? `${appointment.endTime.getHours().toString().padStart(2, '0')}:${appointment.endTime.getMinutes().toString().padStart(2, '0')}`
          : String(appointment.endTime).substring(0, 5),
      status: appointment.status,
      patient: {
        id: appointment.patient.id,
        firstName: appointment.patient.firstName,
        lastName: appointment.patient.lastName,
        fullName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        email: decryptedEmail,
        whatsappNumber: decryptedWhatsappNumber,
        countryCode: appointment.patient.countryCode
      },
      deposit: {
        required: appointment.depositRequired,
        amount: appointment.depositAmount ? Number(appointment.depositAmount) : null,
        paid: appointment.depositPaid,
        paidAt: appointment.depositPaidAt
      },
      customFields: appointment.customFieldValues.map((cfv) => ({
        fieldId: cfv.customField.id,
        fieldName: cfv.customField.fieldName,
        fieldType: cfv.customField.fieldType,
        value: cfv.value
      })),
      cancellation: appointment.cancelledAt
        ? {
            cancelledAt: appointment.cancelledAt,
            reason: appointment.cancellationReason,
            cancelledBy: appointment.cancelledBy
          }
        : null,
      googleEventId: appointment.googleEventId,
      createdAt: appointment.createdAt
    };

    return res.json({
      success: true,
      data: formattedAppointment
    });
  } catch (error) {
    logger.error('Error getting appointment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la cita'
    });
  }
};

// Cancel appointment by professional
export const cancelAppointmentByProfessional = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    const professionalId = professional.id;

    // Find appointment (include googleEventId for calendar sync)
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        professionalId
      },
      select: {
        id: true,
        status: true,
        googleEventId: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    // Check if can be cancelled
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: 'Esta cita no puede ser cancelada'
      });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelado por el profesional',
        cancelledBy: 'professional'
      }
    });

    // Cancel scheduled reminders
    await prisma.scheduledReminder.updateMany({
      where: {
        appointmentId: id,
        status: 'pending'
      },
      data: {
        status: 'cancelled'
      }
    });

    // Update Google Calendar event (non-blocking)
    if (appointment.googleEventId) {
      updateCalendarEvent({
        professionalId,
        googleEventId: appointment.googleEventId,
        status: 'CANCELLED'
      }).catch(err => {
        logger.error('Google Calendar update error (non-blocking):', err);
      });
    }

    // Emit real-time update to professional's dashboard
    emitToProfessional(professionalId, WebSocketEvent.APPOINTMENT_CANCELLED, {
      appointmentId: updatedAppointment.id,
      bookingReference: updatedAppointment.bookingReference,
      status: updatedAppointment.status,
      cancelledAt: updatedAppointment.cancelledAt,
      cancellationReason: updatedAppointment.cancellationReason
    });

    // Emit to admin dashboard for platform statistics
    emitToAdmins(WebSocketEvent.APPOINTMENT_CANCELLED, {
      professionalId,
      appointmentId: updatedAppointment.id
    });

    // Send cancellation notification to patient via WhatsApp and Email
    // These services fetch the appointment data internally, so we only pass the appointmentId
    try {
      await Promise.all([
        sendCancellationNotification({ appointmentId: updatedAppointment.id }),
        sendCancellationEmail({ appointmentId: updatedAppointment.id })
      ]);
    } catch (notificationError) {
      // Log notification errors but don't block the response
      // The appointment is already cancelled in the database
      logger.error('Error sending cancellation notifications (non-blocking):', notificationError);
    }

    return res.json({
      success: true,
      data: {
        id: updatedAppointment.id,
        bookingReference: updatedAppointment.bookingReference,
        status: updatedAppointment.status,
        message: 'Cita cancelada exitosamente'
      }
    });
  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al cancelar la cita'
    });
  }
};

// Update appointment status (confirm, mark as completed, no-show)
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    const professionalId = professional.id;

    // Validate status
    const validStatuses = ['CONFIRMED', 'COMPLETED', 'NO_SHOW'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    // Find appointment (include googleEventId for calendar sync)
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        professionalId
      },
      select: {
        id: true,
        status: true,
        googleEventId: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    // Check if status transition is valid
    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'No se puede cambiar el estado de una cita cancelada'
      });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    // Update Google Calendar event color (non-blocking)
    if (appointment.googleEventId) {
      updateCalendarEvent({
        professionalId,
        googleEventId: appointment.googleEventId,
        status
      }).catch(err => {
        logger.error('Google Calendar update error (non-blocking):', err);
      });
    }

    // Emit real-time update to professional's dashboard
    emitToProfessional(professionalId, WebSocketEvent.APPOINTMENT_STATUS_CHANGED, {
      appointmentId: updatedAppointment.id,
      bookingReference: updatedAppointment.bookingReference,
      status: updatedAppointment.status,
      previousStatus: appointment.status
    });

    // Emit to admin dashboard for platform statistics
    emitToAdmins(WebSocketEvent.APPOINTMENT_STATUS_CHANGED, {
      professionalId,
      appointmentId: updatedAppointment.id,
      newStatus: updatedAppointment.status
    });

    return res.json({
      success: true,
      data: {
        id: updatedAppointment.id,
        bookingReference: updatedAppointment.bookingReference,
        status: updatedAppointment.status
      }
    });
  } catch (error) {
    logger.error('Error updating appointment status:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado de la cita'
    });
  }
};

// Get appointments summary (for dashboard)
export const getAppointmentsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    const professionalId = professional.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get counts
    const [todayCount, weekCount, pendingCount, confirmedCount] = await Promise.all([
      // Today's appointments
      prisma.appointment.count({
        where: {
          professionalId,
          date: today,
          status: { notIn: ['CANCELLED'] }
        }
      }),
      // This week's appointments
      prisma.appointment.count({
        where: {
          professionalId,
          date: { gte: today, lt: weekEnd },
          status: { notIn: ['CANCELLED'] }
        }
      }),
      // Pending appointments
      prisma.appointment.count({
        where: {
          professionalId,
          status: { in: ['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT'] },
          date: { gte: today }
        }
      }),
      // Confirmed appointments
      prisma.appointment.count({
        where: {
          professionalId,
          status: 'CONFIRMED',
          date: { gte: today }
        }
      })
    ]);

    // Get today's appointments for display
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        date: today,
        status: { notIn: ['CANCELLED'] }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    const formattedTodayAppointments = todayAppointments.map((apt) => ({
      id: apt.id,
      bookingReference: apt.bookingReference,
      time:
        apt.startTime instanceof Date
          ? `${apt.startTime.getHours().toString().padStart(2, '0')}:${apt.startTime.getMinutes().toString().padStart(2, '0')}`
          : String(apt.startTime).substring(0, 5),
      patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      status: apt.status
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          today: todayCount,
          thisWeek: weekCount,
          pending: pendingCount,
          confirmed: confirmedCount
        },
        todayAppointments: formattedTodayAppointments
      }
    });
  } catch (error) {
    logger.error('Error getting appointments summary:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener el resumen de citas'
    });
  }
};
