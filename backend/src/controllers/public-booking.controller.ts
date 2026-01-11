import type { Request, Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import {
  createSlotHold,
  releaseSlotHold,
  getHeldSlotsForDate,
  cleanupExpiredHolds
} from '../services/slot-hold.service';

// ============================================
// PUBLIC BOOKING PAGE DATA
// No authentication required - public endpoint
// Returns all data needed for booking page by professional slug
// ============================================

// Fixed fields that are always present in booking form
const FIXED_FIELDS = [
  {
    id: 'fixed-firstName',
    fieldName: 'Nombre',
    fieldType: 'TEXT',
    isRequired: true,
    displayOrder: 1,
    options: [],
    isFixed: true
  },
  {
    id: 'fixed-lastName',
    fieldName: 'Apellido',
    fieldType: 'TEXT',
    isRequired: true,
    displayOrder: 2,
    options: [],
    isFixed: true
  },
  {
    id: 'fixed-whatsappNumber',
    fieldName: 'WhatsApp',
    fieldType: 'TEXT',
    isRequired: true,
    displayOrder: 3,
    options: [],
    isFixed: true
  },
  {
    id: 'fixed-email',
    fieldName: 'Email',
    fieldType: 'TEXT',
    isRequired: true,
    displayOrder: 4,
    options: [],
    isFixed: true
  }
];

// Get booking page data by professional slug
export const getBookingPageData = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug del profesional requerido'
      });
    }

    // Get professional by slug with all related data
    const professional = await prisma.professional.findUnique({
      where: { slug },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        slug: true,
        timezone: true,
        depositEnabled: true,
        depositAmount: true,
        isActive: true,
        isSuspended: true
      }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Check if professional is active
    if (!professional.isActive || professional.isSuspended) {
      return res.status(404).json({
        success: false,
        error: 'Esta página de reservas no está disponible'
      });
    }

    // Get professional settings (appointment duration)
    const settings = await prisma.professionalSettings.findUnique({
      where: { professionalId: professional.id }
    });

    // Get availability (active slots only)
    const availabilities = await prisma.availability.findMany({
      where: {
        professionalId: professional.id,
        isActive: true
      },
      select: {
        dayOfWeek: true,
        slotNumber: true,
        startTime: true,
        endTime: true
      },
      orderBy: [{ dayOfWeek: 'asc' }, { slotNumber: 'asc' }]
    });

    // Get blocked dates (from today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        professionalId: professional.id,
        date: { gte: today }
      },
      select: {
        date: true
      },
      orderBy: { date: 'asc' }
    });

    // Get custom form fields
    const customFields = await prisma.customFormField.findMany({
      where: {
        professionalId: professional.id,
        isActive: true
      },
      select: {
        id: true,
        fieldName: true,
        fieldType: true,
        isRequired: true,
        displayOrder: true,
        options: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    // Combine fixed and custom fields
    const formFields = [
      ...FIXED_FIELDS,
      ...customFields.map((field) => ({
        ...field,
        isFixed: false
      }))
    ];

    // Build response
    const response = {
      professional: {
        firstName: professional.firstName,
        lastName: professional.lastName,
        fullName: `${professional.firstName} ${professional.lastName}`,
        slug: professional.slug,
        timezone: professional.timezone
      },
      availability: {
        appointmentDuration: settings?.appointmentDuration || 30,
        slots: availabilities
      },
      blockedDates: blockedDates.map((bd) => bd.date.toISOString().split('T')[0]),
      deposit: {
        enabled: professional.depositEnabled,
        amount: professional.depositAmount ? Number(professional.depositAmount) : null
      },
      formFields
    };

    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error getting booking page data:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener datos de la página de reservas'
    });
  }
};

// Get available time slots for a specific date
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { date } = req.query;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug del profesional requerido'
      });
    }

    if (!date || typeof date !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Fecha requerida'
      });
    }

    // Parse and validate date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido'
      });
    }

    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'No se pueden reservar fechas pasadas'
      });
    }

    // Get professional by slug
    const professional = await prisma.professional.findUnique({
      where: { slug },
      select: {
        id: true,
        isActive: true,
        isSuspended: true
      }
    });

    if (!professional || !professional.isActive || professional.isSuspended) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Check if date is blocked
    const isBlocked = await prisma.blockedDate.findFirst({
      where: {
        professionalId: professional.id,
        date: selectedDate
      }
    });

    if (isBlocked) {
      return res.json({
        success: true,
        data: {
          date: date,
          isBlocked: true,
          slots: []
        }
      });
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = selectedDate.getDay();

    // Get availability for this day
    const availabilities = await prisma.availability.findMany({
      where: {
        professionalId: professional.id,
        dayOfWeek,
        isActive: true
      },
      orderBy: { slotNumber: 'asc' }
    });

    if (availabilities.length === 0) {
      return res.json({
        success: true,
        data: {
          date: date,
          isBlocked: false,
          slots: []
        }
      });
    }

    // Get professional settings for appointment duration
    const settings = await prisma.professionalSettings.findUnique({
      where: { professionalId: professional.id }
    });

    const appointmentDuration = settings?.appointmentDuration || 30;

    // Get existing appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        date: selectedDate,
        status: {
          notIn: ['CANCELLED']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Get external calendar events for this date (Google Calendar sync)
    // These block availability on the platform per requirement 9.2
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const externalEvents = await prisma.externalCalendarEvent.findMany({
      where: {
        professionalId: professional.id,
        startTime: { lte: dayEnd },
        endTime: { gte: dayStart }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Get active slot holds for this date (Requirement 10.1)
    // Session ID from query allows marking which slots are held by current user
    const sessionId = req.query.sessionId as string | undefined;
    const heldSlots = await getHeldSlotsForDate({
      professionalId: professional.id,
      date: selectedDate,
      sessionId
    });

    // Generate available time slots
    const availableSlots: { time: string; available: boolean }[] = [];

    for (const availability of availabilities) {
      // Parse start and end times
      const [startHour, startMin] = availability.startTime.split(':').map(Number);
      const [endHour, endMin] = availability.endTime.split(':').map(Number);

      // Generate slots
      let currentHour = startHour;
      let currentMin = startMin;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin + appointmentDuration <= endMin)
      ) {
        const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

        // Calculate slot end time
        let slotEndMin = currentMin + appointmentDuration;
        let slotEndHour = currentHour;
        while (slotEndMin >= 60) {
          slotEndMin -= 60;
          slotEndHour += 1;
        }

        // Check if slot end time exceeds availability end time
        if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMin > endMin)) {
          break;
        }

        // Check if slot is already booked by an appointment
        const isBookedByAppointment = existingAppointments.some((apt) => {
          const aptStartTime = apt.startTime instanceof Date
            ? `${apt.startTime.getHours().toString().padStart(2, '0')}:${apt.startTime.getMinutes().toString().padStart(2, '0')}`
            : String(apt.startTime).substring(0, 5);
          return aptStartTime === slotStart;
        });

        // Check if slot overlaps with any external calendar event (Google Calendar)
        // This implements requirement 9.2: Google events block platform availability
        const slotStartDateTime = new Date(selectedDate);
        slotStartDateTime.setHours(currentHour, currentMin, 0, 0);
        const slotEndDateTime = new Date(selectedDate);
        slotEndDateTime.setHours(slotEndHour, slotEndMin, 0, 0);

        const isBlockedByExternalEvent = externalEvents.some((event) => {
          // Check for time overlap: slot overlaps if it starts before event ends AND ends after event starts
          return slotStartDateTime < event.endTime && slotEndDateTime > event.startTime;
        });

        // Check if slot is held by another user (Requirement 10.1)
        // Slots held by the current session are still shown as available to them
        const heldSlot = heldSlots.find((h) => h.startTime === slotStart);
        const isHeldByAnother = heldSlot ? !heldSlot.isHeldByCurrentSession : false;

        const isBooked = isBookedByAppointment || isBlockedByExternalEvent || isHeldByAnother;

        // For today, don't show past slots
        let isPast = false;
        if (selectedDate.getTime() === today.getTime()) {
          const now = new Date();
          const slotDateTime = new Date(selectedDate);
          slotDateTime.setHours(currentHour, currentMin, 0, 0);
          isPast = slotDateTime <= now;
        }

        if (!isPast) {
          availableSlots.push({
            time: slotStart,
            available: !isBooked
          });
        }

        // Move to next slot
        currentMin += appointmentDuration;
        while (currentMin >= 60) {
          currentMin -= 60;
          currentHour += 1;
        }
      }
    }

    return res.json({
      success: true,
      data: {
        date: date,
        isBlocked: false,
        appointmentDuration,
        slots: availableSlots
      }
    });
  } catch (error) {
    logger.error('Error getting available slots:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener horarios disponibles'
    });
  }
};

// ============================================
// SLOT HOLD MANAGEMENT (Requirement 10.1)
// "When someone starts booking, that slot should be temporarily held"
// ============================================

// Create a temporary hold on a time slot
export const holdSlot = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { date, time, sessionId } = req.body;

    if (!slug || !date || !time || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos'
      });
    }

    // Get professional by slug
    const professional = await prisma.professional.findUnique({
      where: { slug },
      select: {
        id: true,
        isActive: true,
        isSuspended: true
      }
    });

    if (!professional || !professional.isActive || professional.isSuspended) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Parse date and time
    const holdDate = new Date(date);
    holdDate.setHours(0, 0, 0, 0);

    const [hours, minutes] = time.split(':').map(Number);
    const holdTime = new Date(1970, 0, 1, hours, minutes, 0, 0);

    // Create the hold
    const result = await createSlotHold({
      professionalId: professional.id,
      date: holdDate,
      startTime: holdTime,
      sessionId
    });

    if (!result.success) {
      return res.status(409).json({
        success: false,
        error: result.error || 'No se pudo reservar el horario temporalmente'
      });
    }

    return res.json({
      success: true,
      data: {
        holdId: result.holdId,
        expiresAt: result.expiresAt?.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error holding slot:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al reservar el horario temporalmente'
    });
  }
};

// Release a slot hold (when user navigates away or changes selection)
export const releaseHold = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { date, time, sessionId } = req.body;

    if (!slug || !date || !time || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos'
      });
    }

    // Get professional by slug
    const professional = await prisma.professional.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Parse date and time
    const holdDate = new Date(date);
    holdDate.setHours(0, 0, 0, 0);

    const [hours, minutes] = time.split(':').map(Number);
    const holdTime = new Date(1970, 0, 1, hours, minutes, 0, 0);

    // Release the hold
    const released = await releaseSlotHold({
      professionalId: professional.id,
      date: holdDate,
      startTime: holdTime,
      sessionId
    });

    return res.json({
      success: true,
      data: { released }
    });
  } catch (error) {
    logger.error('Error releasing slot hold:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al liberar el horario'
    });
  }
};

// Cleanup expired holds (can be called periodically)
export const cleanupHolds = async (_req: Request, res: Response) => {
  try {
    const count = await cleanupExpiredHolds();

    return res.json({
      success: true,
      data: { cleanedUp: count }
    });
  } catch (error) {
    logger.error('Error cleaning up holds:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al limpiar reservas expiradas'
    });
  }
};
