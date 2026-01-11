/**
 * Unit Tests for Appointment Controller
 * Tests critical appointment creation logic
 */

// Mock all dependencies FIRST
const mockPrisma: any = {
  professional: {
    findUnique: jest.fn(),
  },
  professionalSettings: {
    findUnique: jest.fn(),
  },
  appointment: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  patient: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  blockedDate: {
    findFirst: jest.fn(),
  },
  availability: {
    findFirst: jest.fn(),
  },
  customFormField: {
    findMany: jest.fn(),
  },
  customFieldValue: {
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true,
}));

// Mock logger
jest.mock('../../utils/logger');

// Mock external services
jest.mock('../../services/google-calendar.service', () => ({
  createCalendarEvent: jest.fn(),
  updateCalendarEvent: jest.fn(),
}));

jest.mock('../../services/whatsapp.service', () => ({
  sendBookingConfirmation: jest.fn(),
  sendCancellationNotification: jest.fn(),
  scheduleRemindersForAppointment: jest.fn(),
  cancelScheduledReminders: jest.fn(),
}));

jest.mock('../../services/email.service', () => ({
  sendBookingConfirmationEmail: jest.fn(),
  sendCancellationEmail: jest.fn(),
}));

jest.mock('../../services/mercadopago.service', () => ({
  createDepositPreference: jest.fn(),
}));

jest.mock('../../services/slot-hold.service', () => ({
  consumeSlotHold: jest.fn(),
  validateHoldForBooking: jest.fn(),
}));

jest.mock('../../config/socket.config', () => ({
  emitToProfessional: jest.fn(),
  emitToAdmins: jest.fn(),
  WebSocketEvent: {},
}));

// Import after mocks
import { Request, Response } from 'express';
import { createAppointment } from '../../controllers/appointment.controller';
import { validateHoldForBooking } from '../../services/slot-hold.service';
import { createDepositPreference } from '../../services/mercadopago.service';

describe('Appointment Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockRequest = {
      params: { slug: 'dr-smith' },
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        whatsappNumber: '5551234567',
        countryCode: '+1',
        date: '2026-02-15',
        time: '10:00',
      },
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe('createAppointment', () => {
    it('should return 404 if professional not found', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue(null);

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Profesional no encontrado',
      });
    });

    it('should return 404 if professional is not active', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: false,
        isSuspended: false,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      });

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Profesional no encontrado',
      });
    });

    it('should return 404 if professional is suspended', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: true,
        isSuspended: true,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      });

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Profesional no encontrado',
      });
    });

    it('should return 409 if slot hold validation fails', async () => {
      mockRequest.body.sessionId = 'session_123';

      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: true,
        isSuspended: false,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      });

      mockPrisma.professionalSettings.findUnique.mockResolvedValue({
        appointmentDuration: 30,
      });

      (validateHoldForBooking as jest.Mock).mockResolvedValue(false);

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Este horario está siendo reservado por otra persona. Por favor selecciona otro.',
      });
    });

    it('should return 409 if slot is already booked (double booking prevention)', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: true,
        isSuspended: false,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      });

      mockPrisma.professionalSettings.findUnique.mockResolvedValue({
        appointmentDuration: 30,
      });

      // Mock transaction to throw SLOT_NOT_AVAILABLE error
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Inside transaction, appointment already exists
        mockPrisma.appointment.findFirst.mockResolvedValue({
          id: 'existing_apt_123',
        });

        try {
          await callback(mockPrisma);
        } catch (error: any) {
          throw error;
        }
      });

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Este horario ya no está disponible. Por favor selecciona otro.',
      });
    });

    it('should return 409 if date is blocked', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: true,
        isSuspended: false,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      });

      mockPrisma.professionalSettings.findUnique.mockResolvedValue({
        appointmentDuration: 30,
      });

      // Mock transaction to throw DATE_BLOCKED error
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.appointment.findFirst.mockResolvedValue(null);
        mockPrisma.blockedDate.findFirst.mockResolvedValue({
          id: 'blocked_123',
        });

        try {
          await callback(mockPrisma);
        } catch (error: any) {
          throw error;
        }
      });

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Esta fecha no está disponible para reservas.',
      });
    });

    it('should return 409 if day has no availability', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: true,
        isSuspended: false,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      });

      mockPrisma.professionalSettings.findUnique.mockResolvedValue({
        appointmentDuration: 30,
      });

      // Mock transaction to throw NO_AVAILABILITY error
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.appointment.findFirst.mockResolvedValue(null);
        mockPrisma.blockedDate.findFirst.mockResolvedValue(null);
        mockPrisma.availability.findFirst.mockResolvedValue(null);

        try {
          await callback(mockPrisma);
        } catch (error: any) {
          throw error;
        }
      });

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No hay disponibilidad para este día.',
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.professional.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Error al crear la reserva. Por favor intenta nuevamente.',
      });
    });

    it('should create new patient if not exists', async () => {
      const professional = {
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: true,
        isSuspended: false,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      };

      const newPatient = {
        id: 'patient_123',
        professionalId: 'prof_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        whatsappNumber: '+15551234567',
        countryCode: '+1',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.professionalSettings.findUnique.mockResolvedValue({
        appointmentDuration: 30,
      });

      // Mock successful transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.appointment.findFirst.mockResolvedValue(null);
        mockPrisma.blockedDate.findFirst.mockResolvedValue(null);
        mockPrisma.availability.findFirst.mockResolvedValue({ id: 'avail_123' });
        mockPrisma.patient.findFirst.mockResolvedValue(null); // Patient doesn't exist
        mockPrisma.patient.create.mockResolvedValue(newPatient);
        mockPrisma.appointment.findUnique.mockResolvedValue(null); // Booking ref unique
        mockPrisma.appointment.create.mockResolvedValue({
          id: 'apt_123',
          bookingReference: 'ABC123',
        });
        mockPrisma.customFormField.findMany.mockResolvedValue([]);

        return await callback(mockPrisma);
      });

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.patient.create).toHaveBeenCalledWith({
        data: {
          professionalId: 'prof_123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          whatsappNumber: '+15551234567',
          countryCode: '+1',
        },
      });
    });

    it('should update existing patient info if patient exists', async () => {
      const professional = {
        id: 'prof_123',
        firstName: 'Dr',
        lastName: 'Smith',
        isActive: true,
        isSuspended: false,
        depositEnabled: false,
        depositAmount: null,
        timezone: 'America/New_York',
      };

      const existingPatient = {
        id: 'patient_123',
        professionalId: 'prof_123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'old@example.com',
        whatsappNumber: '+15551234567',
        countryCode: '+1',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockPrisma.professionalSettings.findUnique.mockResolvedValue({
        appointmentDuration: 30,
      });

      // Mock successful transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.appointment.findFirst.mockResolvedValue(null);
        mockPrisma.blockedDate.findFirst.mockResolvedValue(null);
        mockPrisma.availability.findFirst.mockResolvedValue({ id: 'avail_123' });
        mockPrisma.patient.findFirst.mockResolvedValue(existingPatient);
        mockPrisma.patient.update.mockResolvedValue({
          ...existingPatient,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        });
        mockPrisma.appointment.findUnique.mockResolvedValue(null);
        mockPrisma.appointment.create.mockResolvedValue({
          id: 'apt_123',
          bookingReference: 'ABC123',
        });
        mockPrisma.customFormField.findMany.mockResolvedValue([]);

        return await callback(mockPrisma);
      });

      await createAppointment(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient_123' },
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      });
    });
  });
});
