import type { Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import type { Prisma } from '@prisma/client';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { emitToProfessional, WebSocketEvent } from '../config/socket.config';

// ============================================
// AVAILABILITY MANAGEMENT
// Supports multiple time slots per day
// Default timezone: Argentina (UTC-3)
// ============================================

// Get availability settings for the logged-in professional
export const getAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Get all availability slots
    const availabilities = await prisma.availability.findMany({
      where: {
        professionalId: professional.id,
        isActive: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { slotNumber: 'asc' }
      ]
    });

    // Get professional settings (appointment duration)
    let settings = await prisma.professionalSettings.findUnique({
      where: { professionalId: professional.id }
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.professionalSettings.create({
        data: {
          professionalId: professional.id,
          appointmentDuration: 30 // Default 30 minutes
        }
      });
    }

    return res.json({
      success: true,
      data: {
        availabilities,
        appointmentDuration: settings.appointmentDuration
      }
    });
  } catch (error) {
    logger.error('Error getting availability:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener disponibilidad'
    });
  }
};

// Save availability settings for the logged-in professional
export const saveAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { availabilities, appointmentDuration } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Validate input
    if (!Array.isArray(availabilities)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de disponibilidad inválido'
      });
    }

    // Validate appointment duration: 5-180 minutes in 5-minute increments
    if (appointmentDuration) {
      const isValidDuration =
        appointmentDuration >= 5 &&
        appointmentDuration <= 180 &&
        appointmentDuration % 5 === 0;

      if (!isValidDuration) {
        return res.status(400).json({
          success: false,
          error: 'Duración de cita inválida. Debe ser entre 5 y 180 minutos, en incrementos de 5 minutos'
        });
      }
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Validate each availability slot
    for (const slot of availabilities) {
      if (
        typeof slot.dayOfWeek !== 'number' ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6
      ) {
        return res.status(400).json({
          success: false,
          error: 'Día de la semana inválido (debe ser 0-6)'
        });
      }

      if (
        typeof slot.slotNumber !== 'number' ||
        slot.slotNumber < 1 ||
        slot.slotNumber > 5
      ) {
        return res.status(400).json({
          success: false,
          error: 'Número de slot inválido (debe ser 1-5)'
        });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de hora inválido (debe ser HH:MM)'
        });
      }

      // Validate end time is after start time
      if (slot.startTime >= slot.endTime) {
        return res.status(400).json({
          success: false,
          error: 'La hora de fin debe ser posterior a la hora de inicio'
        });
      }
    }

    // Use transaction to update everything atomically
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deactivate all existing availability slots
      await tx.availability.updateMany({
        where: { professionalId: professional.id },
        data: { isActive: false }
      });

      // Create or update each availability slot
      for (const slot of availabilities) {
        await tx.availability.upsert({
          where: {
            professionalId_dayOfWeek_slotNumber: {
              professionalId: professional.id,
              dayOfWeek: slot.dayOfWeek,
              slotNumber: slot.slotNumber
            }
          },
          create: {
            professionalId: professional.id,
            dayOfWeek: slot.dayOfWeek,
            slotNumber: slot.slotNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: true
          },
          update: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: true
          }
        });
      }

      // Update appointment duration if provided
      if (appointmentDuration) {
        await tx.professionalSettings.upsert({
          where: { professionalId: professional.id },
          create: {
            professionalId: professional.id,
            appointmentDuration
          },
          update: {
            appointmentDuration
          }
        });
      }
    });

    // Get updated availability
    const updatedAvailabilities = await prisma.availability.findMany({
      where: {
        professionalId: professional.id,
        isActive: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { slotNumber: 'asc' }
      ]
    });

    const settings = await prisma.professionalSettings.findUnique({
      where: { professionalId: professional.id }
    });

    // Emit real-time update to professional's dashboard
    emitToProfessional(professional.id, WebSocketEvent.AVAILABILITY_UPDATED, {
      professionalId: professional.id,
      availabilities: updatedAvailabilities,
      appointmentDuration: settings?.appointmentDuration || 30
    });

    return res.json({
      success: true,
      message: 'Disponibilidad guardada correctamente',
      data: {
        availabilities: updatedAvailabilities,
        appointmentDuration: settings?.appointmentDuration || 30
      }
    });
  } catch (error) {
    logger.error('Error saving availability:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al guardar disponibilidad'
    });
  }
};

// Delete a specific availability slot
export const deleteAvailabilitySlot = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { dayOfWeek, slotNumber } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Deactivate the slot instead of deleting
    await prisma.availability.updateMany({
      where: {
        professionalId: professional.id,
        dayOfWeek: parseInt(dayOfWeek),
        slotNumber: parseInt(slotNumber)
      },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Slot de disponibilidad eliminado'
    });
  } catch (error) {
    logger.error('Error deleting availability slot:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar slot de disponibilidad'
    });
  }
};
