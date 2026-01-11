/**
 * Unit Tests for Professional Appointments Controller
 * Tests critical appointment management logic for professionals
 */

// Mock all dependencies FIRST (before any imports)
const mockPrisma: any = {
  professional: {
    findUnique: jest.fn(),
  },
  appointment: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  scheduledReminder: {
    updateMany: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true,
}));

// Mock logger
jest.mock('../../utils/logger');

// Mock external services
jest.mock('../../services/google-calendar.service', () => ({
  updateCalendarEvent: jest.fn(),
}));

jest.mock('../../services/whatsapp.service', () => ({
  sendCancellationNotification: jest.fn(),
}));

jest.mock('../../services/email.service', () => ({
  sendCancellationEmail: jest.fn(),
}));

jest.mock('../../config/socket.config', () => ({
  emitToProfessional: jest.fn(),
  emitToAdmins: jest.fn(),
  WebSocketEvent: {
    APPOINTMENT_CANCELLED: 'appointment:cancelled',
  },
}));

// Import after mocks
import { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware';
import {
  getAppointments,
  cancelAppointmentByProfessional,
  updateAppointmentStatus,
} from '../../controllers/professional-appointments.controller';
import { sendCancellationNotification } from '../../services/whatsapp.service';
import { sendCancellationEmail } from '../../services/email.service';
import { updateCalendarEvent } from '../../services/google-calendar.service';
import { emitToProfessional, emitToAdmins } from '../../config/socket.config';

describe('Professional Appointments Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockRequest = {
      user: {
        id: 'user_123',
        email: 'prof@example.com',
        role: 'PROFESSIONAL' as any,
      },
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe('getAppointments', () => {
    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await getAppointments(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
      });
    });

    it('should return 404 if professional not found', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue(null);

      await getAppointments(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Profesional no encontrado',
      });
    });

    it('should return paginated appointments with patient data', async () => {
      const professional = {
        id: 'prof_123',
        userId: 'user_123',
      };

      const appointments = [
        {
          id: 'apt_1',
          bookingReference: 'ABC123',
          date: new Date('2026-02-15'),
          startTime: new Date('2026-02-15T10:00:00'),
          endTime: new Date('2026-02-15T10:30:00'),
          status: 'CONFIRMED',
          depositRequired: false,
          depositAmount: null,
          depositPaid: false,
          depositPaidAt: null,
          cancelledAt: null,
          cancellationReason: null,
          cancelledBy: null,
          createdAt: new Date('2026-01-10'),
          patient: {
            id: 'patient_1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            whatsappNumber: '1112345678',
            countryCode: '+54',
          },
        },
      ];

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.count.mockResolvedValue(1);
      mockPrisma.appointment.findMany.mockResolvedValue(appointments);

      await getAppointments(mockRequest as AuthRequest, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          appointments: [
            {
              id: 'apt_1',
              bookingReference: 'ABC123',
              date: '2026-02-15',
              startTime: '10:00',
              endTime: '10:30',
              status: 'CONFIRMED',
              patient: {
                id: 'patient_1',
                firstName: 'John',
                lastName: 'Doe',
                fullName: 'John Doe',
                email: 'john@example.com',
                whatsappNumber: '1112345678',
                countryCode: '+54',
              },
              deposit: {
                required: false,
                amount: null,
                paid: false,
                paidAt: null,
              },
              cancellation: null,
              createdAt: expect.any(Date),
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 50,
            totalPages: 1,
          },
        },
      });
    });

    it('should filter appointments by status', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };

      mockRequest.query = { status: 'CONFIRMED' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.count.mockResolvedValue(0);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getAppointments(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            professionalId: 'prof_123',
            status: 'CONFIRMED',
          },
        })
      );
    });

    it('should filter appointments by date range', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };

      mockRequest.query = {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.count.mockResolvedValue(0);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getAppointments(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            professionalId: 'prof_123',
            date: {
              gte: new Date('2026-02-01'),
              lte: new Date('2026-02-28'),
            },
          },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };

      mockRequest.query = { page: '2', limit: '10' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.count.mockResolvedValue(25);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getAppointments(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * limit 10 = 10
          take: 10,
        })
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          appointments: [],
          pagination: {
            total: 25,
            page: 2,
            limit: 10,
            totalPages: 3,
          },
        },
      });
    });
  });

  describe('cancelAppointmentByProfessional', () => {
    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await cancelAppointmentByProfessional(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
      });
    });

    it('should return 404 if professional not found', async () => {
      mockRequest.params = { id: 'apt_123' };
      mockPrisma.professional.findUnique.mockResolvedValue(null);

      await cancelAppointmentByProfessional(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Profesional no encontrado',
      });
    });

    it('should return 404 if appointment not found', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };

      mockRequest.params = { id: 'apt_123' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.findFirst.mockResolvedValue(null);

      await cancelAppointmentByProfessional(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cita no encontrada',
      });
    });

    it('should return 400 if appointment already cancelled', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };
      const appointment = {
        id: 'apt_123',
        status: 'CANCELLED',
        googleEventId: null,
      };

      mockRequest.params = { id: 'apt_123' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.findFirst.mockResolvedValue(appointment);

      await cancelAppointmentByProfessional(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Esta cita no puede ser cancelada',
      });
    });

    it('should successfully cancel appointment and send notifications', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };
      const appointment = {
        id: 'apt_123',
        status: 'CONFIRMED',
        googleEventId: 'google_event_123',
      };

      const updatedAppointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        status: 'CANCELLED',
        cancelledAt: new Date('2026-01-10T10:00:00Z'),
        cancellationReason: 'Test cancellation',
        cancelledBy: 'professional',
      };

      mockRequest.params = { id: 'apt_123' };
      mockRequest.body = { reason: 'Test cancellation' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.findFirst.mockResolvedValue(appointment);
      mockPrisma.appointment.update.mockResolvedValue(updatedAppointment);
      mockPrisma.scheduledReminder.updateMany.mockResolvedValue({ count: 2 });

      (sendCancellationNotification as jest.Mock).mockResolvedValue(undefined);
      (sendCancellationEmail as jest.Mock).mockResolvedValue(undefined);
      (updateCalendarEvent as jest.Mock).mockResolvedValue(undefined);

      await cancelAppointmentByProfessional(mockRequest as AuthRequest, mockResponse as Response);

      // Verify appointment was updated
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
          cancellationReason: 'Test cancellation',
          cancelledBy: 'professional',
        },
      });

      // Verify reminders were cancelled
      expect(mockPrisma.scheduledReminder.updateMany).toHaveBeenCalledWith({
        where: {
          appointmentId: 'apt_123',
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });

      // Verify notifications were sent
      expect(sendCancellationNotification).toHaveBeenCalledWith({
        appointmentId: 'apt_123',
      });
      expect(sendCancellationEmail).toHaveBeenCalledWith({
        appointmentId: 'apt_123',
      });

      // Verify WebSocket events were emitted
      expect(emitToProfessional).toHaveBeenCalled();
      expect(emitToAdmins).toHaveBeenCalled();

      // Verify success response
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'apt_123',
          bookingReference: 'ABC123',
          status: 'CANCELLED',
          message: 'Cita cancelada exitosamente',
        },
      });
    });

    it('should cancel appointment even if notifications fail', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };
      const appointment = {
        id: 'apt_123',
        status: 'CONFIRMED',
        googleEventId: null,
      };

      const updatedAppointment = {
        id: 'apt_123',
        bookingReference: 'ABC123',
        status: 'CANCELLED',
        cancelledAt: new Date('2026-01-10T10:00:00Z'),
        cancellationReason: 'Cancelado por el profesional',
        cancelledBy: 'professional',
      };

      mockRequest.params = { id: 'apt_123' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.findFirst.mockResolvedValue(appointment);
      mockPrisma.appointment.update.mockResolvedValue(updatedAppointment);
      mockPrisma.scheduledReminder.updateMany.mockResolvedValue({ count: 0 });

      // Simulate notification failures
      (sendCancellationNotification as jest.Mock).mockRejectedValue(
        new Error('WhatsApp API error')
      );
      (sendCancellationEmail as jest.Mock).mockRejectedValue(new Error('Email service error'));

      await cancelAppointmentByProfessional(mockRequest as AuthRequest, mockResponse as Response);

      // Should still return success because appointment is cancelled in database
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'apt_123',
          bookingReference: 'ABC123',
          status: 'CANCELLED',
          message: 'Cita cancelada exitosamente',
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.params = { id: 'apt_123' };
      mockPrisma.professional.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await cancelAppointmentByProfessional(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Error al cancelar la cita',
      });
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await updateAppointmentStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
      });
    });

    it('should return 400 for invalid status', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };

      mockRequest.params = { id: 'apt_123' };
      mockRequest.body = { status: 'INVALID_STATUS' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);

      await updateAppointmentStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Estado inválido',
      });
    });

    it('should return 404 if appointment not found', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };

      mockRequest.params = { id: 'apt_123' };
      mockRequest.body = { status: 'CONFIRMED' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.findFirst.mockResolvedValue(null);

      await updateAppointmentStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cita no encontrada',
      });
    });

    it('should successfully update appointment status to CONFIRMED', async () => {
      const professional = { id: 'prof_123', userId: 'user_123' };
      const appointment = {
        id: 'apt_123',
        status: 'PENDING',
        googleEventId: null,
      };

      const updatedAppointment = {
        ...appointment,
        bookingReference: 'ABC123',
        status: 'CONFIRMED',
      };

      mockRequest.params = { id: 'apt_123' };
      mockRequest.body = { status: 'CONFIRMED' };
      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.appointment.findFirst.mockResolvedValue(appointment);
      mockPrisma.appointment.update.mockResolvedValue(updatedAppointment);

      await updateAppointmentStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        data: { status: 'CONFIRMED' },
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'apt_123',
          bookingReference: 'ABC123',
          status: 'CONFIRMED',
        },
      });
    });
  });
});
