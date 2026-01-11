import type { Response } from 'express';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/database';
import {
  getAuthUrl,
  handleOAuthCallback,
  disconnectCalendar,
  syncFromGoogleCalendar,
  checkConnectionStatus
} from '../services/google-calendar.service';

// ============================================
// GOOGLE CALENDAR CONTROLLER
// Endpoints for managing Google Calendar integration
// ============================================

// Helper to get professional from user ID
const getProfessionalByUserId = async (userId: string) => {
  return prisma.professional.findUnique({
    where: { userId }
  });
};

// ============================================
// GET CONNECTION STATUS
// ============================================

export const getStatus = async (req: AuthRequest, res: Response) => {
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

    const status = await checkConnectionStatus(professional.id);

    return res.json({
      success: true,
      data: {
        connected: status.connected,
        calendarId: status.calendarId,
        error: status.error
      }
    });
  } catch (error) {
    logger.error('Get Google Calendar status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar conexión con Google Calendar'
    });
  }
};

// ============================================
// GET AUTHORIZATION URL
// ============================================

export const getConnectUrl = async (req: AuthRequest, res: Response) => {
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

    const authUrl = getAuthUrl(professional.id);

    return res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    logger.error('Get connect URL error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar URL de autorización'
    });
  }
};

// ============================================
// OAUTH CALLBACK
// ============================================

export const handleCallback = async (req: AuthRequest, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Código de autorización no proporcionado'
      });
    }

    if (!state || typeof state !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Estado de autorización inválido'
      });
    }

    const professionalId = state;
    const success = await handleOAuthCallback(code, professionalId);

    if (!success) {
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/professional/google-calendar?error=connection_failed`);
    }

    // Sync events from Google Calendar
    await syncFromGoogleCalendar(professionalId);

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/professional/google-calendar?success=true`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/professional/google-calendar?error=callback_error`);
  }
};

// ============================================
// DISCONNECT CALENDAR
// ============================================

export const disconnect = async (req: AuthRequest, res: Response) => {
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

    const success = await disconnectCalendar(professional.id);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Error al desconectar Google Calendar'
      });
    }

    return res.json({
      success: true,
      message: 'Google Calendar desconectado correctamente'
    });
  } catch (error) {
    logger.error('Disconnect calendar error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al desconectar Google Calendar'
    });
  }
};

// ============================================
// MANUAL SYNC
// ============================================

export const syncCalendar = async (req: AuthRequest, res: Response) => {
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

    if (!professional.googleCalendarConnected) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar no está conectado'
      });
    }

    const syncedCount = await syncFromGoogleCalendar(professional.id);

    return res.json({
      success: true,
      data: {
        syncedEvents: syncedCount,
        message: `${syncedCount} eventos sincronizados`
      }
    });
  } catch (error) {
    logger.error('Sync calendar error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al sincronizar con Google Calendar'
    });
  }
};

// ============================================
// GET EXTERNAL EVENTS
// ============================================

export const getExternalEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

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

    // Build query
    const where: {
      professionalId: string;
      startTime?: { gte: Date };
      endTime?: { lte: Date };
    } = { professionalId: professional.id };

    if (startDate && typeof startDate === 'string') {
      where.startTime = { gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === 'string') {
      where.endTime = { lte: new Date(endDate) };
    }

    const externalEvents = await prisma.externalCalendarEvent.findMany({
      where,
      orderBy: { startTime: 'asc' }
    });

    return res.json({
      success: true,
      data: externalEvents.map(event => ({
        id: event.id,
        googleEventId: event.googleEventId,
        title: event.title,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString()
      }))
    });
  } catch (error) {
    logger.error('Get external events error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener eventos externos'
    });
  }
};
