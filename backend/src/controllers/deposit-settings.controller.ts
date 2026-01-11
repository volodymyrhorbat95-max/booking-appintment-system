import type { Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import type { AuthRequest } from '../middlewares/auth.middleware';

// ============================================
// DEPOSIT SETTINGS MANAGEMENT
// Optional feature - professional chooses to enable or not
// If enabled, patients must pay deposit to confirm booking
// ============================================

// Get deposit settings for the logged-in professional
export const getDepositSettings = async (req: AuthRequest, res: Response) => {
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
      where: { userId },
      select: {
        id: true,
        depositEnabled: true,
        depositAmount: true
      }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    return res.json({
      success: true,
      data: {
        depositEnabled: professional.depositEnabled,
        depositAmount: professional.depositAmount ? Number(professional.depositAmount) : null
      }
    });
  } catch (error) {
    logger.error('Error getting deposit settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener configuración de depósito'
    });
  }
};

// Update deposit settings
export const updateDepositSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { depositEnabled, depositAmount } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Validate input
    if (typeof depositEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'El campo depositEnabled debe ser verdadero o falso'
      });
    }

    // If deposit is enabled, amount is required
    if (depositEnabled) {
      if (depositAmount === undefined || depositAmount === null) {
        return res.status(400).json({
          success: false,
          error: 'El monto del depósito es requerido cuando está habilitado'
        });
      }

      const amount = Number(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El monto del depósito debe ser mayor a 0'
        });
      }

      // Max deposit amount (reasonable limit)
      if (amount > 1000000) {
        return res.status(400).json({
          success: false,
          error: 'El monto del depósito excede el límite permitido'
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

    // Update deposit settings
    const updatedProfessional = await prisma.professional.update({
      where: { id: professional.id },
      data: {
        depositEnabled,
        depositAmount: depositEnabled ? Number(depositAmount) : null
      },
      select: {
        depositEnabled: true,
        depositAmount: true
      }
    });

    return res.json({
      success: true,
      message: depositEnabled
        ? 'Depósito habilitado correctamente'
        : 'Depósito deshabilitado correctamente',
      data: {
        depositEnabled: updatedProfessional.depositEnabled,
        depositAmount: updatedProfessional.depositAmount
          ? Number(updatedProfessional.depositAmount)
          : null
      }
    });
  } catch (error) {
    logger.error('Error updating deposit settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración de depósito'
    });
  }
};
