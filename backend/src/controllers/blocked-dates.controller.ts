import type { Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { emitToProfessional, WebSocketEvent } from '../config/socket.config';

// ============================================
// BLOCKED DATES MANAGEMENT
// Block dates for vacations, holidays, etc.
// ============================================

// Get all blocked dates for the logged-in professional
export const getBlockedDates = async (req: AuthRequest, res: Response) => {
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

    // Get all blocked dates (future dates only)
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        professionalId: professional.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // From today onwards
        }
      },
      orderBy: { date: 'asc' }
    });

    return res.json({
      success: true,
      data: blockedDates
    });
  } catch (error) {
    logger.error('Error getting blocked dates:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener fechas bloqueadas'
    });
  }
};

// Add a blocked date
export const addBlockedDate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date, reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Validate input
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'La fecha es requerida'
      });
    }

    // Parse and validate date
    const blockedDate = new Date(date);
    if (isNaN(blockedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido'
      });
    }

    // Set to midnight to avoid timezone issues
    blockedDate.setHours(0, 0, 0, 0);

    // Don't allow blocking past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (blockedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'No se pueden bloquear fechas pasadas'
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

    // Check if date is already blocked
    const existing = await prisma.blockedDate.findFirst({
      where: {
        professionalId: professional.id,
        date: blockedDate
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Esta fecha ya está bloqueada'
      });
    }

    // Create blocked date
    const newBlockedDate = await prisma.blockedDate.create({
      data: {
        professionalId: professional.id,
        date: blockedDate,
        reason: reason || null
      }
    });

    // Emit real-time update to professional's dashboard
    emitToProfessional(professional.id, WebSocketEvent.BLOCKED_DATE_ADDED, {
      professionalId: professional.id,
      blockedDate: newBlockedDate
    });

    return res.status(201).json({
      success: true,
      message: 'Fecha bloqueada correctamente',
      data: newBlockedDate
    });
  } catch (error) {
    logger.error('Error adding blocked date:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al bloquear fecha'
    });
  }
};

// Remove a blocked date
export const removeBlockedDate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de fecha bloqueada requerido'
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

    // Find the blocked date
    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id }
    });

    if (!blockedDate) {
      return res.status(404).json({
        success: false,
        error: 'Fecha bloqueada no encontrada'
      });
    }

    // Verify ownership
    if (blockedDate.professionalId !== professional.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar esta fecha'
      });
    }

    // Delete the blocked date
    await prisma.blockedDate.delete({
      where: { id }
    });

    // Emit real-time update to professional's dashboard
    emitToProfessional(professional.id, WebSocketEvent.BLOCKED_DATE_REMOVED, {
      professionalId: professional.id,
      blockedDateId: id,
      date: blockedDate.date
    });

    return res.json({
      success: true,
      message: 'Fecha desbloqueada correctamente'
    });
  } catch (error) {
    logger.error('Error removing blocked date:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al desbloquear fecha'
    });
  }
};

// Block multiple dates at once (for date ranges)
export const addBlockedDateRange = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Fechas de inicio y fin son requeridas'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido'
      });
    }

    // Set to midnight
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }

    // Limit range to 90 days to prevent abuse
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return res.status(400).json({
        success: false,
        error: 'El rango máximo es de 90 días'
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

    // Generate all dates in range
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Get existing blocked dates to avoid duplicates
    const existingDates = await prisma.blockedDate.findMany({
      where: {
        professionalId: professional.id,
        date: { in: dates }
      },
      select: { date: true }
    });

    const existingDateStrings = new Set(
      existingDates.map((d) => d.date.toISOString().split('T')[0])
    );

    // Filter out already blocked dates
    const newDates = dates.filter(
      (d) => !existingDateStrings.has(d.toISOString().split('T')[0])
    );

    // Create new blocked dates
    if (newDates.length > 0) {
      await prisma.blockedDate.createMany({
        data: newDates.map((date) => ({
          professionalId: professional.id,
          date,
          reason: reason || null
        }))
      });
    }

    return res.status(201).json({
      success: true,
      message: `${newDates.length} fecha(s) bloqueada(s) correctamente`,
      data: { blockedCount: newDates.length, skippedCount: dates.length - newDates.length }
    });
  } catch (error) {
    logger.error('Error adding blocked date range:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al bloquear fechas'
    });
  }
};
