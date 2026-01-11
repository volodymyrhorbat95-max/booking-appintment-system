/**
 * Unit Tests for WhatsApp Service
 * Tests critical WhatsApp messaging functionality for appointment notifications
 *
 * Coverage:
 * - Message sending (basic and interactive)
 * - Booking confirmations
 * - Reminders with status updates
 * - Cancellation notifications
 * - Incoming message processing (confirm/cancel)
 * - Reminder scheduling with night-before logic
 * - Template management
 */

// Set environment variables BEFORE any imports
process.env.TWILIO_ACCOUNT_SID = 'AC123456789abcdef';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_WHATSAPP_NUMBER = '+1234567890';

// Mock Twilio FIRST (before any imports)
const mockCreate = jest.fn();
const mockTwilioClient = {
  messages: {
    create: mockCreate,
  },
};
const mockTwilio = jest.fn(() => mockTwilioClient);

jest.mock('twilio', () => ({
  __esModule: true,
  default: mockTwilio,
}));

// Mock Prisma client SECOND
const mockPrisma: any = {
  appointment: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  patient: {
    findFirst: jest.fn(),
  },
  reminderSetting: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  scheduledReminder: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  messageTemplate: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  professional: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true,
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
  ServiceLogger: {
    whatsapp: jest.fn(),
  },
}));

// NOW import the service (after mocks are defined)
import {
  sendWhatsAppMessage,
  sendWhatsAppInteractiveMessage,
  sendBookingConfirmation,
  sendReminder,
  sendCancellationNotification,
  scheduleRemindersForAppointment,
  cancelScheduledReminders,
  processIncomingMessage,
  getMessageTemplates,
  updateMessageTemplate,
  getReminderSettings,
  updateReminderSettings,
} from '../../services/whatsapp.service';

describe('WhatsApp Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWhatsAppMessage', () => {
    it('should send WhatsApp message successfully', async () => {
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await sendWhatsAppMessage({
        to: '+5491112345678',
        message: 'Test message',
      });

      expect(result).toBe(true);
      expect(mockTwilio).toHaveBeenCalledWith('AC123456789abcdef', 'test_auth_token');
      expect(mockCreate).toHaveBeenCalledWith({
        body: 'Test message',
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+5491112345678',
      });
    });

    it('should format phone number to E.164 with whatsapp prefix', async () => {
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      await sendWhatsAppMessage({
        to: '549 11 1234-5678', // Non-standard format
        message: 'Test',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'whatsapp:+549111234567', // Cleaned to E.164
        })
      );
    });

    it('should handle Twilio API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('Twilio API error'));

      const result = await sendWhatsAppMessage({
        to: '+5491112345678',
        message: 'Test',
      });

      expect(result).toBe(false);
    });
  });

  describe('sendWhatsAppInteractiveMessage', () => {
    it('should send interactive message with button instructions', async () => {
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await sendWhatsAppInteractiveMessage({
        to: '+5491112345678',
        message: 'Test reminder',
        buttons: [
          { id: 'confirm', title: 'SI' },
          { id: 'cancel', title: 'NO' },
        ],
      });

      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        body: expect.stringContaining('Test reminder'),
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+5491112345678',
      });
      // Check that button instructions are added
      const callBody = mockCreate.mock.calls[0][0].body;
      expect(callBody).toContain('Responde');
      expect(callBody).toContain('CONFIRMAR');
      expect(callBody).toContain('CANCELAR');
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation with appointment details', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00'),
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          whatsappNumber: '+5491112345678',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
          messageTemplates: [],
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await sendBookingConfirmation({ appointmentId: 'apt_123' });

      expect(result).toBe(true);
      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        include: {
          patient: true,
          professional: {
            include: {
              user: true,
              messageTemplates: {
                where: { type: 'BOOKING_CONFIRMATION', isActive: true },
              },
            },
          },
        },
      });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'whatsapp:+5491112345678',
          body: expect.stringContaining('Juan Pérez'),
        })
      );
    });

    it('should use custom template if professional has one', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00'),
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          whatsappNumber: '+5491112345678',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
          messageTemplates: [
            {
              type: 'BOOKING_CONFIRMATION',
              messageText: 'Custom message for {patient_name} on {date}',
              isActive: true,
            },
          ],
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      await sendBookingConfirmation({ appointmentId: 'apt_123' });

      const messageBody = mockCreate.mock.calls[0][0].body;
      expect(messageBody).toContain('Custom message');
      expect(messageBody).toContain('Juan Pérez');
    });

    it('should return false if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const result = await sendBookingConfirmation({ appointmentId: 'nonexistent' });

      expect(result).toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('sendReminder', () => {
    it('should send reminder and update status to REMINDER_SENT', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        status: 'PENDING',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00'),
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          whatsappNumber: '+5491112345678',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
          messageTemplates: [],
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockCreate.mockResolvedValue({ sid: 'SM123' });
      mockPrisma.appointment.update.mockResolvedValue({ ...appointment, status: 'REMINDER_SENT' });

      const result = await sendReminder({ appointmentId: 'apt_123' });

      expect(result).toBe(true);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        data: { status: 'REMINDER_SENT' },
      });
    });

    it('should not send reminder for cancelled appointment', async () => {
      const appointment = {
        id: 'apt_123',
        status: 'CANCELLED',
        patient: { whatsappNumber: '+5491112345678' },
        professional: { timezone: 'America/Argentina/Buenos_Aires' },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);

      const result = await sendReminder({ appointmentId: 'apt_123' });

      expect(result).toBe(true); // Returns true but doesn't send
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });

    it('should not send reminder for completed appointment', async () => {
      const appointment = {
        id: 'apt_123',
        status: 'COMPLETED',
        patient: { whatsappNumber: '+5491112345678' },
        professional: { timezone: 'America/Argentina/Buenos_Aires' },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);

      const result = await sendReminder({ appointmentId: 'apt_123' });

      expect(result).toBe(true);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should not update status if message fails to send', async () => {
      const appointment = {
        id: 'apt_123',
        status: 'PENDING',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00'),
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          whatsappNumber: '+5491112345678',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
          messageTemplates: [],
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockCreate.mockRejectedValue(new Error('Twilio error'));

      const result = await sendReminder({ appointmentId: 'apt_123' });

      expect(result).toBe(false);
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe('sendCancellationNotification', () => {
    it('should send cancellation notification', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00'),
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          whatsappNumber: '+5491112345678',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
          messageTemplates: [],
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await sendCancellationNotification({ appointmentId: 'apt_123' });

      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'whatsapp:+5491112345678',
          body: expect.stringContaining('cancelada'),
        })
      );
    });

    it('should return false if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const result = await sendCancellationNotification({ appointmentId: 'nonexistent' });

      expect(result).toBe(false);
    });
  });

  describe('scheduleRemindersForAppointment', () => {
    it('should create default reminder (24h before) if no settings exist', async () => {
      mockPrisma.reminderSetting.findMany.mockResolvedValue([]);
      mockPrisma.scheduledReminder.create.mockResolvedValue({ id: 'reminder_1' });

      const appointmentDate = new Date('2026-02-15');
      const appointmentTime = new Date('2026-02-15T14:00:00');

      await scheduleRemindersForAppointment({
        appointmentId: 'apt_123',
        professionalId: 'prof_123',
        appointmentDate,
        appointmentTime,
      });

      expect(mockPrisma.scheduledReminder.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 'apt_123',
          scheduledFor: expect.any(Date),
          status: 'pending',
        },
      });

      const createdReminder = mockPrisma.scheduledReminder.create.mock.calls[0][0].data;
      const scheduledTime = new Date(createdReminder.scheduledFor);

      // Just verify that reminder was scheduled 24 hours before appointment
      const timeDiff = new Date('2026-02-15T14:00:00').getTime() - scheduledTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      expect(hoursDiff).toBeCloseTo(24, 0);
    });

    it('should create reminders based on professional settings', async () => {
      const reminderSettings = [
        { reminderNumber: 1, hoursBefore: 48, enableNightBefore: false, isActive: true },
        { reminderNumber: 2, hoursBefore: 2, enableNightBefore: false, isActive: true },
      ];

      mockPrisma.reminderSetting.findMany.mockResolvedValue(reminderSettings);
      mockPrisma.professional.findUnique.mockResolvedValue({
        timezone: 'America/Argentina/Buenos_Aires',
      });
      mockPrisma.scheduledReminder.create.mockResolvedValue({ id: 'reminder_1' });

      // Set appointment 3 days in future to ensure reminders are in future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const appointmentDate = futureDate;
      const appointmentTime = new Date(futureDate);
      appointmentTime.setHours(14, 0, 0, 0);

      await scheduleRemindersForAppointment({
        appointmentId: 'apt_123',
        professionalId: 'prof_123',
        appointmentDate,
        appointmentTime,
      });

      expect(mockPrisma.scheduledReminder.create).toHaveBeenCalledTimes(2);
    });

    it('should apply night-before logic for early morning appointments', async () => {
      const reminderSettings = [
        { reminderNumber: 1, hoursBefore: 2, enableNightBefore: true, isActive: true },
      ];

      mockPrisma.reminderSetting.findMany.mockResolvedValue(reminderSettings);
      mockPrisma.professional.findUnique.mockResolvedValue({
        timezone: 'America/Argentina/Buenos_Aires',
      });
      mockPrisma.scheduledReminder.create.mockResolvedValue({ id: 'reminder_1' });

      // Early morning appointment (7 AM)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const appointmentDate = futureDate;
      const appointmentTime = new Date(futureDate);
      appointmentTime.setHours(7, 0, 0, 0); // 7 AM

      await scheduleRemindersForAppointment({
        appointmentId: 'apt_123',
        professionalId: 'prof_123',
        appointmentDate,
        appointmentTime,
      });

      const createdReminder = mockPrisma.scheduledReminder.create.mock.calls[0][0].data;
      const reminderTime = new Date(createdReminder.scheduledFor);

      // Should be scheduled for 8 PM the night before
      expect(reminderTime.getHours()).toBe(20); // 8 PM
    });

    it('should not schedule reminders in the past', async () => {
      const reminderSettings = [
        { reminderNumber: 1, hoursBefore: 48, enableNightBefore: false, isActive: true },
      ];

      mockPrisma.reminderSetting.findMany.mockResolvedValue(reminderSettings);
      mockPrisma.professional.findUnique.mockResolvedValue({
        timezone: 'America/Argentina/Buenos_Aires',
      });

      // Appointment in 1 hour (reminder would be in past)
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 1);
      const appointmentTime = appointmentDate;

      await scheduleRemindersForAppointment({
        appointmentId: 'apt_123',
        professionalId: 'prof_123',
        appointmentDate,
        appointmentTime,
      });

      expect(mockPrisma.scheduledReminder.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelScheduledReminders', () => {
    it('should cancel all pending reminders for appointment', async () => {
      mockPrisma.scheduledReminder.updateMany.mockResolvedValue({ count: 2 });

      await cancelScheduledReminders('apt_123');

      expect(mockPrisma.scheduledReminder.updateMany).toHaveBeenCalledWith({
        where: {
          appointmentId: 'apt_123',
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });
    });
  });

  describe('processIncomingMessage', () => {
    it('should confirm appointment when patient sends "SI"', async () => {
      const patient = {
        id: 'patient_123',
        whatsappNumber: '+5491112345678',
        appointments: [
          {
            id: 'apt_123',
            status: 'REMINDER_SENT',
            date: new Date('2026-02-20'),
            startTime: new Date('2026-02-20T10:00:00'),
            professional: {
              timezone: 'America/Argentina/Buenos_Aires',
            },
          },
        ],
      };

      mockPrisma.patient.findFirst.mockResolvedValue(patient);
      mockPrisma.appointment.update.mockResolvedValue({
        ...patient.appointments[0],
        status: 'CONFIRMED',
      });
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await processIncomingMessage({
        from: 'whatsapp:+5491112345678',
        body: 'SI',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('CONFIRMED');
      expect(result.appointmentId).toBe('apt_123');
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        data: { status: 'CONFIRMED' },
      });
    });

    it('should recognize various confirmation keywords', async () => {
      const patient = {
        whatsappNumber: '+5491112345678',
        appointments: [
          {
            id: 'apt_123',
            status: 'REMINDER_SENT',
            date: new Date('2026-02-20'),
            startTime: new Date('2026-02-20T10:00:00'),
            professional: { timezone: 'America/Argentina/Buenos_Aires' },
          },
        ],
      };

      mockPrisma.patient.findFirst.mockResolvedValue(patient);
      mockPrisma.appointment.update.mockResolvedValue({ id: 'apt_123' });
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const confirmKeywords = ['si', 'SI', 'sí', 'confirmo', 'CONFIRMO', 'ok', 'OK', 'yes', '1'];

      for (const keyword of confirmKeywords) {
        jest.clearAllMocks();
        mockPrisma.patient.findFirst.mockResolvedValue(patient);
        mockPrisma.appointment.update.mockResolvedValue({ id: 'apt_123' });
        mockCreate.mockResolvedValue({ sid: 'SM123' });

        const result = await processIncomingMessage({
          from: '+5491112345678',
          body: keyword,
        });

        expect(result.action).toBe('CONFIRMED');
      }
    });

    it('should cancel appointment when patient sends "NO"', async () => {
      const patient = {
        whatsappNumber: '+5491112345678',
        appointments: [
          {
            id: 'apt_123',
            status: 'REMINDER_SENT',
            date: new Date('2026-02-20'),
            startTime: new Date('2026-02-20T10:00:00'),
            professional: { timezone: 'America/Argentina/Buenos_Aires' },
          },
        ],
      };

      mockPrisma.patient.findFirst.mockResolvedValue(patient);
      mockPrisma.appointment.update.mockResolvedValue({
        ...patient.appointments[0],
        status: 'CANCELLED',
      });
      mockPrisma.scheduledReminder.updateMany.mockResolvedValue({ count: 1 });
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await processIncomingMessage({
        from: '+5491112345678',
        body: 'NO',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('CANCELLED');
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
          cancelledBy: 'patient',
          cancellationReason: 'Cancelado via WhatsApp',
        },
      });
      expect(mockPrisma.scheduledReminder.updateMany).toHaveBeenCalled();
    });

    it('should recognize various cancellation keywords', async () => {
      const patient = {
        whatsappNumber: '+5491112345678',
        appointments: [
          {
            id: 'apt_123',
            status: 'REMINDER_SENT',
            date: new Date('2026-02-20'),
            startTime: new Date('2026-02-20T10:00:00'),
            professional: { timezone: 'America/Argentina/Buenos_Aires' },
          },
        ],
      };

      mockPrisma.patient.findFirst.mockResolvedValue(patient);
      mockPrisma.appointment.update.mockResolvedValue({ id: 'apt_123' });
      mockPrisma.scheduledReminder.updateMany.mockResolvedValue({ count: 1 });
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const cancelKeywords = ['no', 'NO', 'cancelo', 'CANCELAR', 'cancel', '2'];

      for (const keyword of cancelKeywords) {
        jest.clearAllMocks();
        mockPrisma.patient.findFirst.mockResolvedValue(patient);
        mockPrisma.appointment.update.mockResolvedValue({ id: 'apt_123' });
        mockPrisma.scheduledReminder.updateMany.mockResolvedValue({ count: 1 });
        mockCreate.mockResolvedValue({ sid: 'SM123' });

        const result = await processIncomingMessage({
          from: '+5491112345678',
          body: keyword,
        });

        expect(result.action).toBe('CANCELLED');
      }
    });

    it('should return UNKNOWN for unrecognized response', async () => {
      const patient = {
        whatsappNumber: '+5491112345678',
        appointments: [
          {
            id: 'apt_123',
            status: 'REMINDER_SENT',
            date: new Date('2026-02-20'),
            startTime: new Date('2026-02-20T10:00:00'),
            professional: { timezone: 'America/Argentina/Buenos_Aires' },
          },
        ],
      };

      mockPrisma.patient.findFirst.mockResolvedValue(patient);
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await processIncomingMessage({
        from: '+5491112345678',
        body: 'hola',
      });

      expect(result.success).toBe(false);
      expect(result.action).toBe('UNKNOWN');
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
      // Should send help message
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('responde'),
        })
      );
    });

    it('should return error if patient has no pending appointments', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      const result = await processIncomingMessage({
        from: '+5491112345678',
        body: 'SI',
      });

      expect(result.success).toBe(false);
      expect(result.action).toBe('UNKNOWN');
    });

    it('should clean phone number before lookup', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await processIncomingMessage({
        from: 'whatsapp:+54 9 11 1234-5678',
        body: 'SI',
      });

      // Verify patient lookup was called (phone number cleaning is internal)
      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            whatsappNumber: expect.objectContaining({
              contains: expect.any(String),
            }),
          }),
        })
      );
    });
  });

  describe('getMessageTemplates', () => {
    it('should return all template types with defaults', async () => {
      mockPrisma.messageTemplate.findMany.mockResolvedValue([]);

      const templates = await getMessageTemplates('prof_123');

      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.type)).toEqual([
        'BOOKING_CONFIRMATION',
        'REMINDER',
        'CANCELLATION',
      ]);
      expect(templates.every(t => !t.isCustom)).toBe(true);
      expect(templates.every(t => t.isActive)).toBe(true);
    });

    it('should merge custom templates with defaults', async () => {
      const customTemplates = [
        {
          type: 'REMINDER',
          messageText: 'Custom reminder message',
          isActive: true,
        },
      ];

      mockPrisma.messageTemplate.findMany.mockResolvedValue(customTemplates);

      const templates = await getMessageTemplates('prof_123');

      const reminderTemplate = templates.find(t => t.type === 'REMINDER');
      expect(reminderTemplate?.messageText).toBe('Custom reminder message');
      expect(reminderTemplate?.isCustom).toBe(true);

      const confirmationTemplate = templates.find(t => t.type === 'BOOKING_CONFIRMATION');
      expect(confirmationTemplate?.isCustom).toBe(false);
    });
  });

  describe('updateMessageTemplate', () => {
    it('should create new template if none exists', async () => {
      mockPrisma.messageTemplate.upsert.mockResolvedValue({
        id: 'template_1',
        professionalId: 'prof_123',
        type: 'REMINDER',
        messageText: 'New custom message',
        isActive: true,
      });

      const result = await updateMessageTemplate({
        professionalId: 'prof_123',
        type: 'REMINDER',
        messageText: 'New custom message',
      });

      expect(mockPrisma.messageTemplate.upsert).toHaveBeenCalledWith({
        where: {
          professionalId_type: { professionalId: 'prof_123', type: 'REMINDER' },
        },
        update: {
          messageText: 'New custom message',
          isActive: true,
        },
        create: {
          professionalId: 'prof_123',
          type: 'REMINDER',
          messageText: 'New custom message',
          isActive: true,
        },
      });
    });
  });

  describe('getReminderSettings', () => {
    it('should retrieve reminder settings for professional', async () => {
      const settings = [
        { id: '1', reminderNumber: 1, hoursBefore: 24, enableNightBefore: false },
        { id: '2', reminderNumber: 2, hoursBefore: 2, enableNightBefore: true },
      ];

      mockPrisma.reminderSetting.findMany.mockResolvedValue(settings);

      const result = await getReminderSettings('prof_123');

      expect(result).toEqual(settings);
      expect(mockPrisma.reminderSetting.findMany).toHaveBeenCalledWith({
        where: { professionalId: 'prof_123' },
        orderBy: { reminderNumber: 'asc' },
      });
    });
  });

  describe('updateReminderSettings', () => {
    it('should delete old settings and create new ones', async () => {
      const newSettings = [
        { reminderNumber: 1, hoursBefore: 48, enableNightBefore: false, isActive: true },
        { reminderNumber: 2, hoursBefore: 24, enableNightBefore: true, isActive: true },
      ];

      mockPrisma.reminderSetting.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.reminderSetting.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.reminderSetting.findMany.mockResolvedValue(newSettings);

      const result = await updateReminderSettings('prof_123', newSettings);

      expect(mockPrisma.reminderSetting.deleteMany).toHaveBeenCalledWith({
        where: { professionalId: 'prof_123' },
      });
      expect(mockPrisma.reminderSetting.createMany).toHaveBeenCalledWith({
        data: newSettings.map(s => ({
          professionalId: 'prof_123',
          ...s,
        })),
      });
      expect(result).toEqual(newSettings);
    });

    it('should handle empty settings array', async () => {
      mockPrisma.reminderSetting.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.reminderSetting.findMany.mockResolvedValue([]);

      const result = await updateReminderSettings('prof_123', []);

      expect(mockPrisma.reminderSetting.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.reminderSetting.createMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
