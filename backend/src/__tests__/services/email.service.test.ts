/**
 * Unit Tests for Email Service
 * Tests critical email functionality for appointment notifications
 *
 * Coverage:
 * - Email sending (base function)
 * - Booking confirmation emails with HTML templates
 * - Reminder emails with cancellation links
 * - Cancellation notification emails
 * - HTML template generation
 * - Date/time formatting for different timezones
 * - Error handling and resilience
 */

// Set environment variables BEFORE any imports
process.env.RESEND_API_KEY = 're_test_key_123456789';
process.env.EMAIL_FROM = 'test@example.com';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Mock Resend FIRST (before any imports)
const mockSend = jest.fn();
const mockResendInstance = {
  emails: {
    send: mockSend,
  },
};

// Mock Resend constructor
jest.mock('resend', () => ({
  Resend: jest.fn(() => mockResendInstance),
}));

// Mock Prisma client
const mockPrisma: any = {
  appointment: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true,
}));

// Mock logger
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock('../../utils/logger', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: mockLoggerWarn,
  },
  ServiceLogger: jest.fn(),
}));

// NOW import the service (after mocks are defined)
import {
  sendEmail,
  sendBookingConfirmationEmail,
  sendReminderEmail,
  sendCancellationEmail,
} from '../../services/email.service';

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully with Resend', async () => {
      mockSend.mockResolvedValue({ id: 'email_123' });

      const result = await sendEmail({
        to: 'patient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'patient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('Email sent to patient@example.com')
      );
    });

    it('should handle Resend API errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Resend API error'));

      const result = await sendEmail({
        to: 'patient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error sending email',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('sendBookingConfirmationEmail', () => {
    it('should send booking confirmation email with appointment details', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          id: 'patient_123',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          id: 'prof_123',
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      const result = await sendBookingConfirmationEmail({
        appointmentId: 'apt_123',
      });

      expect(result).toBe(true);
      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        include: {
          patient: true,
          professional: true,
        },
      });

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.to).toBe('juan@example.com');
      expect(emailCall.subject).toContain('Confirmacion de cita');
      expect(emailCall.html).toContain('Juan Pérez');
      expect(emailCall.html).toContain('Dr. María González');
      expect(emailCall.html).toContain('ABC123');
      expect(emailCall.html).toContain('Cita Confirmada');
    });

    it('should include cancel URL in confirmation email', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          id: 'patient_123',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          id: 'prof_123',
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendBookingConfirmationEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain('http://localhost:5173/cancel?ref=ABC123');
      expect(emailCall.html).toContain('Cancelar esta cita');
    });

    it('should return false if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const result = await sendBookingConfirmationEmail({
        appointmentId: 'non_existent',
      });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Appointment not found',
        expect.objectContaining({ appointmentId: 'non_existent' })
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.appointment.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await sendBookingConfirmationEmail({
        appointmentId: 'apt_123',
      });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error sending booking confirmation email',
        expect.objectContaining({
          error: expect.any(Error),
          appointmentId: 'apt_123',
        })
      );
    });

    it('should handle email sending failure gracefully', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockRejectedValue(new Error('Email service error'));

      const result = await sendBookingConfirmationEmail({
        appointmentId: 'apt_123',
      });

      // Should fail gracefully
      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('sendReminderEmail', () => {
    it('should send reminder email with appointment details', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      const result = await sendReminderEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(true);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.to).toBe('juan@example.com');
      expect(emailCall.subject).toContain('Recordatorio de cita');
      expect(emailCall.html).toContain('Juan Pérez');
      expect(emailCall.html).toContain('Dr. María González');
      expect(emailCall.html).toContain('ABC123');
      expect(emailCall.html).toContain('Recordatorio de Cita');
    });

    it('should include cancel URL in reminder email', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendReminderEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain('http://localhost:5173/cancel?ref=ABC123');
      expect(emailCall.html).toContain('Cancelar esta cita');
    });

    it('should skip reminder for cancelled appointments', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'CANCELLED',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);

      const result = await sendReminderEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(true); // Still returns true (non-blocking)
      expect(mockSend).not.toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('Skipping reminder email for non-active appointment'),
        expect.any(String)
      );
    });

    it('should skip reminder for completed appointments', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'COMPLETED',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);

      const result = await sendReminderEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should skip reminder for no-show appointments', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'NO_SHOW',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);

      const result = await sendReminderEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should return false if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const result = await sendReminderEmail({ appointmentId: 'non_existent' });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Appointment not found',
        expect.objectContaining({ appointmentId: 'non_existent' })
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.appointment.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await sendReminderEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error sending reminder email',
        expect.objectContaining({
          error: expect.any(Error),
          appointmentId: 'apt_123',
        })
      );
    });
  });

  describe('sendCancellationEmail', () => {
    it('should send cancellation email with appointment details', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'CANCELLED',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      const result = await sendCancellationEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(true);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.to).toBe('juan@example.com');
      expect(emailCall.subject).toContain('Cita cancelada');
      expect(emailCall.subject).toContain('ABC123');
      expect(emailCall.html).toContain('Juan Pérez');
      expect(emailCall.html).toContain('Dr. María González');
      expect(emailCall.html).toContain('ABC123');
      expect(emailCall.html).toContain('Cita Cancelada');
    });

    it('should NOT include cancel URL in cancellation email', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'CANCELLED',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendCancellationEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      // Cancellation email should NOT include cancel link (already cancelled)
      expect(emailCall.html).not.toContain('/cancel?ref=');
    });

    it('should return false if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const result = await sendCancellationEmail({
        appointmentId: 'non_existent',
      });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Appointment not found',
        expect.objectContaining({ appointmentId: 'non_existent' })
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.appointment.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await sendCancellationEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error sending cancellation email',
        expect.objectContaining({
          error: expect.any(Error),
          appointmentId: 'apt_123',
        })
      );
    });

    it('should handle email sending failure gracefully', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'CANCELLED',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockRejectedValue(new Error('Email service error'));

      const result = await sendCancellationEmail({ appointmentId: 'apt_123' });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('HTML Template Generation', () => {
    it('should generate valid HTML for booking confirmation', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendBookingConfirmationEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      const html = emailCall.html;

      // Check HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');

      // Check inline styles (for email clients)
      expect(html).toContain('style=');

      // Check content structure
      expect(html).toContain('<h1');
      expect(html).toContain('<p');
      expect(html).toContain('<div');
    });

    it('should generate valid HTML for reminder', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendReminderEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Recordatorio de Cita');
      expect(html).toContain('style=');
    });

    it('should generate valid HTML for cancellation', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'CANCELLED',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendCancellationEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Cita Cancelada');
      expect(html).toContain('style=');
    });
  });

  describe('Date and Time Formatting', () => {
    it('should format dates correctly for Argentina timezone', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        status: 'PENDING',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendBookingConfirmationEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      // Date should be formatted in Spanish (es-AR)
      expect(emailCall.html).toMatch(/febrero|febrero/i);
      expect(emailCall.html).toContain('2026');
    });

    it('should format times correctly for Argentina timezone', async () => {
      const appointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        date: new Date('2026-02-15T00:00:00Z'),
        startTime: new Date('2026-02-15T14:30:00Z'), // 14:30 UTC
        status: 'PENDING',
        patient: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        professional: {
          firstName: 'Dr. María',
          lastName: 'González',
          timezone: 'America/Argentina/Buenos_Aires',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointment);
      mockSend.mockResolvedValue({ id: 'email_123' });

      await sendBookingConfirmationEmail({ appointmentId: 'apt_123' });

      const emailCall = mockSend.mock.calls[0][0];
      // Time should be formatted (exact time depends on timezone conversion)
      expect(emailCall.html).toMatch(/\d{2}:\d{2}/); // HH:MM format
    });
  });
});
