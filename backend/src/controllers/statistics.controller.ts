import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';

// ============================================
// PROFESSIONAL STATISTICS CONTROLLER
// Optional feature - professionals view their activity stats
// ============================================

export async function getMyStatistics(req: Request, res: Response) {
  try {
    // SECURITY FIX: req.user?.id is userId, not professionalId
    // We must lookup the Professional record by userId first
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    // Get professional record from userId
    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const professionalId = professional.id;

    // Default to last 12 months if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getFullYear(), end.getMonth() - 11, 1);

    // Get all appointments in period
    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        date: {
          gte: start,
          lte: end
        }
      },
      select: {
        id: true,
        date: true,
        status: true
      }
    });

    // Calculate counts by status
    const statusCounts = {
      total: appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0
    };

    appointments.forEach((apt) => {
      switch (apt.status) {
        case 'PENDING':
        case 'PENDING_PAYMENT':
        case 'REMINDER_SENT':
          statusCounts.pending++;
          break;
        case 'CONFIRMED':
          statusCounts.confirmed++;
          break;
        case 'COMPLETED':
          statusCounts.completed++;
          break;
        case 'CANCELLED':
          statusCounts.cancelled++;
          break;
        case 'NO_SHOW':
          statusCounts.noShow++;
          break;
      }
    });

    // Calculate rates (avoid division by zero)
    const total = statusCounts.total || 1;
    const rates = {
      confirmationRate: Math.round(((statusCounts.confirmed + statusCounts.completed) / total) * 100),
      cancellationRate: Math.round((statusCounts.cancelled / total) * 100),
      noShowRate: Math.round((statusCounts.noShow / total) * 100),
      completionRate: Math.round((statusCounts.completed / total) * 100)
    };

    // Group by month for chart
    const byMonth: Record<string, { total: number; completed: number; cancelled: number }> = {};

    // Initialize all months in range
    const current = new Date(start);
    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = { total: 0, completed: 0, cancelled: 0 };
      current.setMonth(current.getMonth() + 1);
    }

    // Fill in data
    appointments.forEach((apt) => {
      const aptDate = new Date(apt.date);
      const monthKey = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}`;
      if (byMonth[monthKey]) {
        byMonth[monthKey].total++;
        if (apt.status === 'COMPLETED') {
          byMonth[monthKey].completed++;
        } else if (apt.status === 'CANCELLED') {
          byMonth[monthKey].cancelled++;
        }
      }
    });

    // Convert to array sorted by month
    const byMonthArray = Object.entries(byMonth)
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      statistics: {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        appointments: statusCounts,
        rates,
        byMonth: byMonthArray
      }
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
}
