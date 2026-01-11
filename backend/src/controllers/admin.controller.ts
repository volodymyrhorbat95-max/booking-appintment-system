import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import type { Prisma } from '@prisma/client';

// ============================================
// DASHBOARD STATS
// ============================================

// GET /api/admin/dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get counts in parallel
    const [
      totalProfessionals,
      activeProfessionals,
      totalAppointments,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      newProfessionalsThisMonth,
      activeSubscriptions
    ] = await Promise.all([
      prisma.professional.count(),
      prisma.professional.count({ where: { isActive: true, isSuspended: false } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { date: { gte: startOfToday } } }),
      prisma.appointment.count({ where: { date: { gte: startOfWeek } } }),
      prisma.appointment.count({ where: { date: { gte: startOfMonth } } }),
      prisma.professional.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } })
    ]);

    return res.json({
      success: true,
      data: {
        professionals: {
          total: totalProfessionals,
          active: activeProfessionals,
          newThisMonth: newProfessionalsThisMonth
        },
        appointments: {
          total: totalAppointments,
          today: appointmentsToday,
          thisWeek: appointmentsThisWeek,
          thisMonth: appointmentsThisMonth
        },
        subscriptions: {
          active: activeSubscriptions
        }
      }
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
};

// ============================================
// PROFESSIONALS MANAGEMENT
// ============================================

// GET /api/admin/professionals
export const getProfessionals = async (req: Request, res: Response) => {
  try {
    const { search, status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Validate pagination parameters (prevent DOS attacks)
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de página inválido (debe ser >= 1)'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de límite inválido (debe estar entre 1 y 100)'
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.ProfessionalWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    if (status === 'active') {
      where.isActive = true;
      where.isSuspended = false;
    } else if (status === 'suspended') {
      where.isSuspended = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get professionals and count in parallel
    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        include: {
          user: { select: { email: true } },
          subscription: {
            include: { plan: { select: { name: true } } }
          },
          _count: { select: { appointments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.professional.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        professionals: professionals.map(p => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          fullName: `${p.firstName} ${p.lastName}`,
          email: p.user.email,
          slug: p.slug,
          isActive: p.isActive,
          isSuspended: p.isSuspended,
          appointmentsCount: p._count.appointments,
          subscription: p.subscription ? {
            planName: p.subscription.plan.name,
            status: p.subscription.status,
            billingPeriod: p.subscription.billingPeriod
          } : null,
          createdAt: p.createdAt.toISOString()
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting professionals:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener profesionales' });
  }
};

// GET /api/admin/professionals/:id
export const getProfessionalDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, createdAt: true } },
        subscription: {
          include: { plan: true }
        },
        _count: {
          select: {
            appointments: true,
            patients: true
          }
        }
      }
    });

    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    // Get appointment stats
    const appointmentStats = await prisma.appointment.groupBy({
      by: ['status'],
      where: { professionalId: id },
      _count: { id: true }
    });

    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0
    };

    for (const stat of appointmentStats) {
      stats.total += stat._count.id;
      if (['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT'].includes(stat.status)) {
        stats.pending += stat._count.id;
      } else if (stat.status === 'CONFIRMED') {
        stats.confirmed += stat._count.id;
      } else if (stat.status === 'COMPLETED') {
        stats.completed += stat._count.id;
      } else if (stat.status === 'CANCELLED') {
        stats.cancelled += stat._count.id;
      } else if (stat.status === 'NO_SHOW') {
        stats.noShow += stat._count.id;
      }
    }

    return res.json({
      success: true,
      data: {
        id: professional.id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        fullName: `${professional.firstName} ${professional.lastName}`,
        email: professional.user.email,
        slug: professional.slug,
        phone: professional.phone,
        timezone: professional.timezone,
        isActive: professional.isActive,
        isSuspended: professional.isSuspended,
        googleCalendarConnected: professional.googleCalendarConnected,
        depositEnabled: professional.depositEnabled,
        depositAmount: professional.depositAmount ? Number(professional.depositAmount) : null,
        subscription: professional.subscription ? {
          id: professional.subscription.id,
          planName: professional.subscription.plan.name,
          status: professional.subscription.status,
          billingPeriod: professional.subscription.billingPeriod,
          startDate: professional.subscription.startDate.toISOString(),
          nextBillingDate: professional.subscription.nextBillingDate?.toISOString() || null
        } : null,
        counts: {
          appointments: professional._count.appointments,
          patients: professional._count.patients
        },
        appointmentStats: stats,
        createdAt: professional.createdAt.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting professional detail:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener detalles del profesional' });
  }
};

// PUT /api/admin/professionals/:id/suspend
export const suspendProfessional = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const professional = await prisma.professional.findUnique({ where: { id } });
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    await prisma.professional.update({
      where: { id },
      data: { isSuspended: true }
    });

    return res.json({
      success: true,
      message: 'Profesional suspendido correctamente'
    });
  } catch (error) {
    logger.error('Error suspending professional:', error);
    return res.status(500).json({ success: false, error: 'Error al suspender profesional' });
  }
};

// PUT /api/admin/professionals/:id/activate
export const activateProfessional = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const professional = await prisma.professional.findUnique({ where: { id } });
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    await prisma.professional.update({
      where: { id },
      data: { isSuspended: false, isActive: true }
    });

    return res.json({
      success: true,
      message: 'Profesional activado correctamente'
    });
  } catch (error) {
    logger.error('Error activating professional:', error);
    return res.status(500).json({ success: false, error: 'Error al activar profesional' });
  }
};

// ============================================
// SUBSCRIPTION PLANS MANAGEMENT
// ============================================

// GET /api/admin/plans
export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });

    return res.json({
      success: true,
      data: plans.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        monthlyPrice: Number(p.monthlyPrice),
        annualPrice: Number(p.annualPrice),
        features: p.features,
        isActive: p.isActive,
        displayOrder: p.displayOrder,
        subscribersCount: p._count.subscriptions,
        createdAt: p.createdAt.toISOString()
      }))
    });
  } catch (error) {
    logger.error('Error getting plans:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener planes' });
  }
};

// POST /api/admin/plans
export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, description, monthlyPrice, annualPrice, features, isActive = true } = req.body;

    if (!name || monthlyPrice === undefined || annualPrice === undefined) {
      return res.status(400).json({ success: false, error: 'Nombre y precios son requeridos' });
    }

    // Get max display order
    const maxOrder = await prisma.subscriptionPlan.aggregate({
      _max: { displayOrder: true }
    });
    const displayOrder = (maxOrder._max.displayOrder || 0) + 1;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        monthlyPrice,
        annualPrice,
        features: features || [],
        isActive,
        displayOrder
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        monthlyPrice: Number(plan.monthlyPrice),
        annualPrice: Number(plan.annualPrice),
        features: plan.features,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
        subscribersCount: 0,  // New plans have zero subscribers
        createdAt: plan.createdAt.toISOString()
      },
      message: 'Plan creado correctamente'
    });
  } catch (error) {
    logger.error('Error creating plan:', error);
    return res.status(500).json({ success: false, error: 'Error al crear plan' });
  }
};

// PUT /api/admin/plans/:id
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, monthlyPrice, annualPrice, features, isActive, displayOrder } = req.body;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan no encontrado' });
    }

    const updateData: Prisma.SubscriptionPlanUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (monthlyPrice !== undefined) updateData.monthlyPrice = monthlyPrice;
    if (annualPrice !== undefined) updateData.annualPrice = annualPrice;
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData
    });

    return res.json({
      success: true,
      data: {
        id: updatedPlan.id,
        name: updatedPlan.name,
        description: updatedPlan.description,
        monthlyPrice: Number(updatedPlan.monthlyPrice),
        annualPrice: Number(updatedPlan.annualPrice),
        features: updatedPlan.features,
        isActive: updatedPlan.isActive,
        displayOrder: updatedPlan.displayOrder
      },
      message: 'Plan actualizado correctamente'
    });
  } catch (error) {
    logger.error('Error updating plan:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar plan' });
  }
};

// DELETE /api/admin/plans/:id
export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } }
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan no encontrado' });
    }

    if (plan._count.subscriptions > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un plan con suscripciones activas. Desactívalo en su lugar.'
      });
    }

    await prisma.subscriptionPlan.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Plan eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error deleting plan:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar plan' });
  }
};

// PUT /api/admin/plans/reorder
export const reorderPlans = async (req: Request, res: Response) => {
  try {
    const { planIds } = req.body;

    if (!Array.isArray(planIds)) {
      return res.status(400).json({ success: false, error: 'planIds debe ser un array' });
    }

    // Update display order for each plan
    await prisma.$transaction(
      planIds.map((id, index) =>
        prisma.subscriptionPlan.update({
          where: { id },
          data: { displayOrder: index + 1 }
        })
      )
    );

    return res.json({
      success: true,
      message: 'Orden de planes actualizado'
    });
  } catch (error) {
    logger.error('Error reordering plans:', error);
    return res.status(500).json({ success: false, error: 'Error al reordenar planes' });
  }
};

// ============================================
// PLATFORM STATISTICS
// ============================================

// GET /api/admin/statistics
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: start, lte: end }
      },
      _count: { id: true }
    });

    // Get new professionals by date
    const newProfessionalsByDate = await prisma.professional.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: start, lte: end }
      },
      _count: { id: true }
    });

    // Get subscription revenue from ACTUAL PAYMENTS (not plan prices)
    const completedPayments = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        type: 'SUBSCRIPTION',
        paidAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Calculate total revenue from completed payments in the period
    const totalRevenue = Number(completedPayments._sum.amount || 0);

    // Calculate estimated monthly revenue based on actual completed payments
    const monthsDiff = Math.max(1, (end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
    const estimatedMonthlyRevenue = totalRevenue / monthsDiff;

    return res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        appointments: {
          byStatus: appointmentsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          }, {} as Record<string, number>)
        },
        professionals: {
          newInPeriod: newProfessionalsByDate.length
        },
        revenue: {
          totalInPeriod: totalRevenue,
          estimatedMonthly: estimatedMonthlyRevenue,
          paymentCount: completedPayments._count.id
        }
      }
    });
  } catch (error) {
    logger.error('Error getting statistics:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
};

// ============================================
// PLATFORM SETTINGS
// ============================================

// GET /api/admin/settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.platformSetting.findMany();

    const settingsObj = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    return res.json({
      success: true,
      data: {
        defaultTimezone: settingsObj.defaultTimezone || 'America/Argentina/Buenos_Aires',
        defaultCountryCode: settingsObj.defaultCountryCode || '+54',
        platformName: settingsObj.platformName || 'Appointment Platform',
        supportEmail: settingsObj.supportEmail || ''
      }
    });
  } catch (error) {
    logger.error('Error getting settings:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener configuración' });
  }
};

// PUT /api/admin/settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = req.body;

    if (typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Formato inválido' });
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }

    return res.json({
      success: true,
      message: 'Configuración actualizada correctamente'
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar configuración' });
  }
};
