import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import {
  getMessageTemplates,
  updateMessageTemplate,
  getReminderSettings,
  updateReminderSettings,
  processIncomingMessage
} from '../services/whatsapp.service';
import twilio from 'twilio';

type MessageTemplateType = 'BOOKING_CONFIRMATION' | 'REMINDER' | 'CANCELLATION';

// ============================================
// HELPER: Get professional by user ID
// ============================================

const getProfessionalByUserId = async (userId: string) => {
  return prisma.professional.findUnique({
    where: { userId }
  });
};

// ============================================
// REMINDER SETTINGS
// ============================================

// GET /api/professional/whatsapp/reminders
export const getReminders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const settings = await getReminderSettings(professional.id);

    // If no settings exist, return defaults
    if (settings.length === 0) {
      return res.json({
        success: true,
        data: {
          reminders: [
            { reminderNumber: 1, hoursBefore: 24, enableNightBefore: false, isActive: true }
          ]
        }
      });
    }

    return res.json({
      success: true,
      data: {
        reminders: settings.map(s => ({
          reminderNumber: s.reminderNumber,
          hoursBefore: s.hoursBefore,
          enableNightBefore: s.enableNightBefore,
          isActive: s.isActive
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting reminder settings:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener configuración de recordatorios' });
  }
};

// PUT /api/professional/whatsapp/reminders
export const updateReminders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const { reminders } = req.body;

    if (!Array.isArray(reminders)) {
      return res.status(400).json({ success: false, error: 'Formato inválido' });
    }

    // Validate reminders
    for (const reminder of reminders) {
      if (!reminder.reminderNumber || !reminder.hoursBefore) {
        return res.status(400).json({ success: false, error: 'Datos de recordatorio incompletos' });
      }
      if (reminder.hoursBefore < 1 || reminder.hoursBefore > 168) { // 1 hour to 1 week
        return res.status(400).json({ success: false, error: 'Las horas deben estar entre 1 y 168' });
      }
    }

    const updatedSettings = await updateReminderSettings(professional.id, reminders);

    return res.json({
      success: true,
      data: {
        reminders: updatedSettings.map(s => ({
          reminderNumber: s.reminderNumber,
          hoursBefore: s.hoursBefore,
          enableNightBefore: s.enableNightBefore,
          isActive: s.isActive
        }))
      },
      message: 'Configuración de recordatorios actualizada'
    });
  } catch (error) {
    logger.error('Error updating reminder settings:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar configuración' });
  }
};

// ============================================
// MESSAGE TEMPLATES
// ============================================

// GET /api/professional/whatsapp/templates
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const templates = await getMessageTemplates(professional.id);

    return res.json({
      success: true,
      data: {
        templates,
        availableVariables: [
          { key: '{patient_name}', description: 'Nombre completo del paciente' },
          { key: '{professional_name}', description: 'Nombre del profesional' },
          { key: '{date}', description: 'Fecha de la cita' },
          { key: '{time}', description: 'Hora de la cita' },
          { key: '{booking_reference}', description: 'Código de referencia de la reserva' }
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting templates:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener plantillas' });
  }
};

// PUT /api/professional/whatsapp/templates/:type
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const { type } = req.params;
    const { messageText } = req.body;

    // Validate type
    const validTypes: MessageTemplateType[] = ['BOOKING_CONFIRMATION', 'REMINDER', 'CANCELLATION'];
    if (!validTypes.includes(type as MessageTemplateType)) {
      return res.status(400).json({ success: false, error: 'Tipo de plantilla inválido' });
    }

    if (!messageText || typeof messageText !== 'string') {
      return res.status(400).json({ success: false, error: 'Texto del mensaje requerido' });
    }

    if (messageText.length > 1024) {
      return res.status(400).json({ success: false, error: 'El mensaje no puede exceder 1024 caracteres' });
    }

    const template = await updateMessageTemplate({
      professionalId: professional.id,
      type: type as MessageTemplateType,
      messageText
    });

    return res.json({
      success: true,
      data: {
        type: template.type,
        messageText: template.messageText,
        isCustom: true,
        isActive: template.isActive
      },
      message: 'Plantilla actualizada correctamente'
    });
  } catch (error) {
    logger.error('Error updating template:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar plantilla' });
  }
};

// DELETE /api/professional/whatsapp/templates/:type (Reset to default)
export const resetTemplate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const { type } = req.params;

    // Validate type
    const validTypes: MessageTemplateType[] = ['BOOKING_CONFIRMATION', 'REMINDER', 'CANCELLATION'];
    if (!validTypes.includes(type as MessageTemplateType)) {
      return res.status(400).json({ success: false, error: 'Tipo de plantilla inválido' });
    }

    // Delete the custom template to reset to default
    await prisma.messageTemplate.deleteMany({
      where: {
        professionalId: professional.id,
        type: type as MessageTemplateType
      }
    });

    const templates = await getMessageTemplates(professional.id);
    const resetedTemplate = templates.find(t => t.type === type);

    return res.json({
      success: true,
      data: resetedTemplate,
      message: 'Plantilla restablecida a valores por defecto'
    });
  } catch (error) {
    logger.error('Error resetting template:', error);
    return res.status(500).json({ success: false, error: 'Error al restablecer plantilla' });
  }
};

// ============================================
// TWILIO WEBHOOK (for incoming messages)
// ============================================

// POST /api/webhooks/whatsapp (Twilio webhook - no auth)
export const handleIncomingMessage = async (req: Request, res: Response) => {
  try {
    // Validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      const twilioSignature = req.headers['x-twilio-signature'] as string;
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN || '',
        twilioSignature,
        url,
        req.body
      );

      if (!isValid) {
        logger.error('Invalid Twilio signature');
        return res.status(403).send('Forbidden');
      }
    }

    const { From, Body } = req.body;

    if (!From || !Body) {
      return res.status(400).send('Bad Request');
    }

    logger.info(`Incoming WhatsApp message from ${From}: ${Body}`);

    // Process the message
    const result = await processIncomingMessage({
      from: From,
      body: Body
    });

    logger.info('Message processing result:', result);

    // Respond to Twilio (TwiML empty response)
    res.set('Content-Type', 'text/xml');
    return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    logger.error('Error handling incoming WhatsApp message:', error);
    res.set('Content-Type', 'text/xml');
    return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
};

// ============================================
// TEST ENDPOINT (Development only)
// ============================================

// POST /api/professional/whatsapp/test
export const sendTestMessage = async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: 'No disponible en producción' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const professional = await getProfessionalByUserId(userId);
    if (!professional) {
      return res.status(404).json({ success: false, error: 'Profesional no encontrado' });
    }

    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Número de teléfono requerido' });
    }

    // Import sendWhatsAppMessage
    const { sendWhatsAppMessage } = await import('../services/whatsapp.service');

    const sent = await sendWhatsAppMessage({
      to: phone,
      message: `Mensaje de prueba desde la plataforma. Profesional: ${professional.firstName} ${professional.lastName}`
    });

    if (sent) {
      return res.json({ success: true, message: 'Mensaje de prueba enviado' });
    } else {
      return res.status(500).json({ success: false, error: 'Error al enviar mensaje de prueba' });
    }
  } catch (error) {
    logger.error('Error sending test message:', error);
    return res.status(500).json({ success: false, error: 'Error al enviar mensaje de prueba' });
  }
};
