// ============================================
// REMINDER WORKER SERVICE TESTS
// CRITICAL: This service handles automatic reminders (core value proposition)
// ============================================

// Mock dependencies BEFORE imports
const mockPrisma = {
  scheduledReminder: {
    findMany: jest.fn(),
    update: jest.fn()
  },
  appointment: {
    findMany: jest.fn(),
    update: jest.fn()
  }
};

const mockSendReminder = jest.fn();
const mockCancelScheduledReminders = jest.fn();
const mockSendReminderEmail = jest.fn();
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};
const mockServiceLogger = {
  reminder: jest.fn()
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true
}));

jest.mock('../../services/whatsapp.service', () => ({
  sendReminder: mockSendReminder,
  cancelScheduledReminders: mockCancelScheduledReminders
}));

jest.mock('../../services/email.service', () => ({
  sendReminderEmail: mockSendReminderEmail
}));

jest.mock('../../utils/logger', () => ({
  logger: mockLogger,
  ServiceLogger: mockServiceLogger
}));

// NOW import the service
import {
  startReminderScheduler,
  stopReminderScheduler,
  shutdownWorker,
  processScheduledReminders,
  releaseUnpaidDepositAppointments,
  processReminder
} from '../../services/reminder-worker.service';

describe('Reminder Worker Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopReminderScheduler(); // Ensure clean state
  });

  afterEach(() => {
    stopReminderScheduler();
  });

  describe('processReminder', () => {
    it('should process a single reminder successfully', async () => {
      const mockReminder = {
        id: 'reminder_1',
        appointmentId: 'apt_1',
        appointment: {
          id: 'apt_1',
          status: 'CONFIRMED',
          patient: {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@example.com'
          },
          professional: {
            firstName: 'Dr.',
            lastName: 'García'
          }
        }
      };

      mockSendReminder.mockResolvedValue(true);
      mockSendReminderEmail.mockResolvedValue(true);
      mockPrisma.scheduledReminder.update.mockResolvedValue({});

      const result = await processReminder(mockReminder);

      expect(result).toBe(true);
      expect(mockSendReminder).toHaveBeenCalledWith({ appointmentId: 'apt_1' });
      expect(mockSendReminderEmail).toHaveBeenCalledWith({ appointmentId: 'apt_1' });
      expect(mockPrisma.scheduledReminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder_1' },
        data: {
          status: 'sent',
          sentAt: expect.any(Date)
        }
      });
    });

    it('should cancel reminder for cancelled appointment', async () => {
      const mockReminder = {
        id: 'reminder_1',
        appointmentId: 'apt_1',
        appointment: {
          id: 'apt_1',
          status: 'CANCELLED',
          patient: { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
          professional: { firstName: 'Dr.', lastName: 'García' }
        }
      };

      mockPrisma.scheduledReminder.update.mockResolvedValue({});

      const result = await processReminder(mockReminder);

      expect(result).toBe(false);
      expect(mockSendReminder).not.toHaveBeenCalled();
      expect(mockPrisma.scheduledReminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder_1' },
        data: { status: 'cancelled' }
      });
    });

    it('should cancel reminder for completed appointment', async () => {
      const mockReminder = {
        id: 'reminder_1',
        appointmentId: 'apt_1',
        appointment: {
          id: 'apt_1',
          status: 'COMPLETED',
          patient: { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
          professional: { firstName: 'Dr.', lastName: 'García' }
        }
      };

      mockPrisma.scheduledReminder.update.mockResolvedValue({});

      const result = await processReminder(mockReminder);

      expect(result).toBe(false);
      expect(mockSendReminder).not.toHaveBeenCalled();
    });

    it('should cancel reminder for NO_SHOW appointment', async () => {
      const mockReminder = {
        id: 'reminder_1',
        appointmentId: 'apt_1',
        appointment: {
          id: 'apt_1',
          status: 'NO_SHOW',
          patient: { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
          professional: { firstName: 'Dr.', lastName: 'García' }
        }
      };

      mockPrisma.scheduledReminder.update.mockResolvedValue({});

      const result = await processReminder(mockReminder);

      expect(result).toBe(false);
      expect(mockSendReminder).not.toHaveBeenCalled();
    });

    it('should skip email reminder if patient has no email', async () => {
      const mockReminder = {
        id: 'reminder_1',
        appointmentId: 'apt_1',
        appointment: {
          id: 'apt_1',
          status: 'CONFIRMED',
          patient: {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: null // No email
          },
          professional: { firstName: 'Dr.', lastName: 'García' }
        }
      };

      mockSendReminder.mockResolvedValue(true);
      mockPrisma.scheduledReminder.update.mockResolvedValue({});

      const result = await processReminder(mockReminder);

      expect(result).toBe(true);
      expect(mockSendReminder).toHaveBeenCalled();
      expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('should continue if email fails but WhatsApp succeeds', async () => {
      const mockReminder = {
        id: 'reminder_1',
        appointmentId: 'apt_1',
        appointment: {
          id: 'apt_1',
          status: 'CONFIRMED',
          patient: { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
          professional: { firstName: 'Dr.', lastName: 'García' }
        }
      };

      mockSendReminder.mockResolvedValue(true);
      mockSendReminderEmail.mockRejectedValue(new Error('Email service unavailable'));
      mockPrisma.scheduledReminder.update.mockResolvedValue({});

      const result = await processReminder(mockReminder);

      expect(result).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send email reminder'),
        expect.any(Error)
      );
      expect(mockPrisma.scheduledReminder.update).toHaveBeenCalled();
    });

    it('should not mark as sent if WhatsApp fails', async () => {
      const mockReminder = {
        id: 'reminder_1',
        appointmentId: 'apt_1',
        appointment: {
          id: 'apt_1',
          status: 'CONFIRMED',
          patient: { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
          professional: { firstName: 'Dr.', lastName: 'García' }
        }
      };

      mockSendReminder.mockResolvedValue(false); // WhatsApp failed
      mockSendReminderEmail.mockResolvedValue(true);

      const result = await processReminder(mockReminder);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send WhatsApp reminder')
      );
      expect(mockPrisma.scheduledReminder.update).not.toHaveBeenCalled();
    });

    it('should process reminders with valid statuses (PENDING, PENDING_PAYMENT, REMINDER_SENT, CONFIRMED)', async () => {
      const statuses = ['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT', 'CONFIRMED'];

      for (const status of statuses) {
        jest.clearAllMocks();

        const mockReminder = {
          id: 'reminder_1',
          appointmentId: 'apt_1',
          appointment: {
            id: 'apt_1',
            status,
            patient: { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
            professional: { firstName: 'Dr.', lastName: 'García' }
          }
        };

        mockSendReminder.mockResolvedValue(true);
        mockSendReminderEmail.mockResolvedValue(true);
        mockPrisma.scheduledReminder.update.mockResolvedValue({});

        const result = await processReminder(mockReminder);

        expect(result).toBe(true);
        expect(mockSendReminder).toHaveBeenCalled();
      }
    });
  });

  describe('processScheduledReminders', () => {
    it('should process multiple due reminders', async () => {
      const mockReminders = [
        {
          id: 'reminder_1',
          appointmentId: 'apt_1',
          scheduledFor: new Date('2026-02-15T09:55:00Z'),
          status: 'pending',
          appointment: {
            id: 'apt_1',
            status: 'CONFIRMED',
            patient: { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
            professional: { firstName: 'Dr.', lastName: 'García' }
          }
        },
        {
          id: 'reminder_2',
          appointmentId: 'apt_2',
          scheduledFor: new Date('2026-02-15T09:50:00Z'),
          status: 'pending',
          appointment: {
            id: 'apt_2',
            status: 'PENDING',
            patient: { firstName: 'María', lastName: 'López', email: 'maria@example.com' },
            professional: { firstName: 'Dr.', lastName: 'García' }
          }
        }
      ];

      mockPrisma.scheduledReminder.findMany.mockResolvedValue(mockReminders);
      mockSendReminder.mockResolvedValue(true);
      mockSendReminderEmail.mockResolvedValue(true);
      mockPrisma.scheduledReminder.update.mockResolvedValue({});

      await processScheduledReminders();

      expect(mockPrisma.scheduledReminder.findMany).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          scheduledFor: {
            lte: expect.any(Date)
          }
        },
        include: {
          appointment: {
            include: {
              patient: {
                select: { firstName: true, lastName: true, email: true }
              },
              professional: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        },
        take: 50,
        orderBy: { scheduledFor: 'asc' }
      });

      expect(mockSendReminder).toHaveBeenCalledTimes(2);
      expect(mockPrisma.scheduledReminder.update).toHaveBeenCalledTimes(2);
    });

    it('should not process anything when no due reminders', async () => {
      mockPrisma.scheduledReminder.findMany.mockResolvedValue([]);

      await processScheduledReminders();

      expect(mockPrisma.scheduledReminder.findMany).toHaveBeenCalled();
      expect(mockSendReminder).not.toHaveBeenCalled();
    });

    it('should limit to 50 reminders per batch', async () => {
      mockPrisma.scheduledReminder.findMany.mockResolvedValue([]);

      await processScheduledReminders();

      expect(mockPrisma.scheduledReminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50
        })
      );
    });

    it('should order reminders by scheduledFor ascending', async () => {
      mockPrisma.scheduledReminder.findMany.mockResolvedValue([]);

      await processScheduledReminders();

      expect(mockPrisma.scheduledReminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { scheduledFor: 'asc' }
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.scheduledReminder.findMany.mockRejectedValue(new Error('Database error'));

      await processScheduledReminders();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in reminder scheduler:',
        expect.any(Error)
      );
    });
  });

  describe('releaseUnpaidDepositAppointments', () => {
    it('should cancel unpaid deposit appointments after time limit', async () => {
      const mockAppointments = [
        {
          id: 'apt_1',
          bookingReference: 'REF001',
          patient: { firstName: 'Juan', lastName: 'Pérez' }
        },
        {
          id: 'apt_2',
          bookingReference: 'REF002',
          patient: { firstName: 'María', lastName: 'López' }
        }
      ];

      mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);
      mockPrisma.appointment.update.mockResolvedValue({});
      mockCancelScheduledReminders.mockResolvedValue(undefined);

      await releaseUnpaidDepositAppointments();

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING_PAYMENT',
          depositRequired: true,
          depositPaid: false,
          createdAt: {
            lt: expect.any(Date)
          }
        },
        select: {
          id: true,
          bookingReference: true,
          patient: {
            select: { firstName: true, lastName: true }
          }
        },
        take: 50
      });

      expect(mockPrisma.appointment.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt_1' },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
          cancelledBy: 'system',
          cancellationReason: expect.stringContaining('Depósito no pagado')
        }
      });

      expect(mockCancelScheduledReminders).toHaveBeenCalledTimes(2);
      expect(mockCancelScheduledReminders).toHaveBeenCalledWith('apt_1');
      expect(mockCancelScheduledReminders).toHaveBeenCalledWith('apt_2');
    });

    it('should not cancel appointments when no expired deposits', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await releaseUnpaidDepositAppointments();

      expect(mockPrisma.appointment.findMany).toHaveBeenCalled();
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
      expect(mockCancelScheduledReminders).not.toHaveBeenCalled();
    });

    it('should limit to 50 appointments per batch', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await releaseUnpaidDepositAppointments();

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50
        })
      );
    });

    it('should continue if one cancellation fails', async () => {
      const mockAppointments = [
        {
          id: 'apt_1',
          bookingReference: 'REF001',
          patient: { firstName: 'Juan', lastName: 'Pérez' }
        },
        {
          id: 'apt_2',
          bookingReference: 'REF002',
          patient: { firstName: 'María', lastName: 'López' }
        }
      ];

      mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);
      mockPrisma.appointment.update
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({});
      mockCancelScheduledReminders.mockResolvedValue(undefined);

      await releaseUnpaidDepositAppointments();

      expect(mockPrisma.appointment.update).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error releasing appointment'),
        expect.any(Error)
      );
      expect(mockCancelScheduledReminders).toHaveBeenCalledWith('apt_2');
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.appointment.findMany.mockRejectedValue(new Error('Database error'));

      await releaseUnpaidDepositAppointments();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in deposit cleanup scheduler:',
        expect.any(Error)
      );
    });

    it('should use correct time limit from environment', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await releaseUnpaidDepositAppointments();

      const callArgs = mockPrisma.appointment.findMany.mock.calls[0][0];
      const cutoffTime = callArgs.where.createdAt.lt;
      const now = new Date();
      const expectedCutoff = new Date(now.getTime() - 30 * 60 * 1000);

      // Should be approximately 30 minutes ago (allow 1 second tolerance)
      expect(Math.abs(cutoffTime.getTime() - expectedCutoff.getTime())).toBeLessThan(1000);
    });
  });

  describe('Scheduler Management', () => {
    it('should start scheduler successfully', () => {
      startReminderScheduler();
      expect(mockServiceLogger.reminder).toHaveBeenCalledWith(
        expect.stringContaining('Reminder scheduler started')
      );
    });

    it('should not start scheduler twice', () => {
      startReminderScheduler();
      jest.clearAllMocks();
      startReminderScheduler(); // Second call

      expect(mockServiceLogger.reminder).toHaveBeenCalledWith(
        'Reminder scheduler already running'
      );
    });

    it('should stop scheduler successfully', () => {
      startReminderScheduler();
      stopReminderScheduler();

      expect(mockServiceLogger.reminder).toHaveBeenCalledWith(
        expect.stringContaining('stopped')
      );
    });

    it('should handle graceful shutdown', async () => {
      startReminderScheduler();
      await shutdownWorker();

      expect(mockServiceLogger.reminder).toHaveBeenCalledWith(
        'Reminder worker shut down'
      );
    });
  });
});
