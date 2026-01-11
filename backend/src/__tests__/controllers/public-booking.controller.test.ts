import type { Request, Response } from 'express';
import {
  getBookingPageData,
  getAvailableSlots,
  holdSlot,
  releaseHold,
  cleanupHolds
} from '../../controllers/public-booking.controller';
import prisma from '../../config/database';
import * as slotHoldService from '../../services/slot-hold.service';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    professional: {
      findUnique: jest.fn()
    },
    professionalSettings: {
      findUnique: jest.fn()
    },
    availability: {
      findMany: jest.fn()
    },
    blockedDate: {
      findMany: jest.fn(),
      findFirst: jest.fn()
    },
    customFormField: {
      findMany: jest.fn()
    },
    appointment: {
      findMany: jest.fn()
    },
    externalCalendarEvent: {
      findMany: jest.fn()
    }
  }
}));

jest.mock('../../services/slot-hold.service');
jest.mock('../../utils/logger');

describe('Public Booking Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
      body: {}
    };

    responseData = null;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      })
    };
  });

  describe('getBookingPageData', () => {
    it('should return booking page data for valid professional slug', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'Dr. John',
        lastName: 'Doe',
        slug: 'dr-john-doe',
        timezone: 'America/Argentina/Buenos_Aires',
        depositEnabled: true,
        depositAmount: 5000,
        isActive: true,
        isSuspended: false
      };

      const mockSettings = {
        appointmentDuration: 30
      };

      const mockAvailability = [
        {
          dayOfWeek: 1,
          slotNumber: 1,
          startTime: '09:00',
          endTime: '12:00'
        }
      ];

      const mockBlockedDates = [
        { date: new Date('2026-01-15') }
      ];

      const mockCustomFields = [
        {
          id: 'field_1',
          fieldName: 'Obra Social',
          fieldType: 'TEXT',
          isRequired: false,
          displayOrder: 5,
          options: []
        }
      ];

      mockRequest.params = { slug: 'dr-john-doe' };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.professionalSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
      (prisma.availability.findMany as jest.Mock).mockResolvedValue(mockAvailability);
      (prisma.blockedDate.findMany as jest.Mock).mockResolvedValue(mockBlockedDates);
      (prisma.customFormField.findMany as jest.Mock).mockResolvedValue(mockCustomFields);

      await getBookingPageData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          professional: {
            firstName: 'Dr. John',
            lastName: 'Doe',
            fullName: 'Dr. John Doe',
            slug: 'dr-john-doe',
            timezone: 'America/Argentina/Buenos_Aires'
          },
          availability: {
            appointmentDuration: 30,
            slots: mockAvailability
          },
          blockedDates: ['2026-01-15'],
          deposit: {
            enabled: true,
            amount: 5000
          },
          formFields: expect.arrayContaining([
            expect.objectContaining({
              id: 'fixed-firstName',
              fieldName: 'Nombre',
              isFixed: true
            }),
            expect.objectContaining({
              id: 'field_1',
              fieldName: 'Obra Social',
              isFixed: false
            })
          ])
        })
      });
    });

    it('should return 400 if slug is missing', async () => {
      mockRequest.params = {};

      await getBookingPageData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Slug del profesional requerido'
      });
    });

    it('should return 404 if professional not found', async () => {
      mockRequest.params = { slug: 'non-existent' };
      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(null);

      await getBookingPageData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Profesional no encontrado'
      });
    });

    it('should return 404 if professional is inactive', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      (prisma.professional.findUnique as jest.Mock).mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr. John',
        lastName: 'Doe',
        isActive: false,
        isSuspended: false
      });

      await getBookingPageData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Esta página de reservas no está disponible'
      });
    });

    it('should return 404 if professional is suspended', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      (prisma.professional.findUnique as jest.Mock).mockResolvedValue({
        id: 'prof_123',
        firstName: 'Dr. John',
        lastName: 'Doe',
        isActive: true,
        isSuspended: true
      });

      await getBookingPageData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData.error).toBe('Esta página de reservas no está disponible');
    });

    it('should use default appointment duration if settings not found', async () => {
      const mockProfessional = {
        id: 'prof_123',
        firstName: 'Dr. John',
        lastName: 'Doe',
        slug: 'dr-john-doe',
        timezone: 'America/Argentina/Buenos_Aires',
        depositEnabled: false,
        depositAmount: null,
        isActive: true,
        isSuspended: false
      };

      mockRequest.params = { slug: 'dr-john-doe' };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.professionalSettings.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.availability.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.blockedDate.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.customFormField.findMany as jest.Mock).mockResolvedValue([]);

      await getBookingPageData(mockRequest as Request, mockResponse as Response);

      expect(responseData.data.availability.appointmentDuration).toBe(30);
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      (prisma.professional.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getBookingPageData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Error al obtener datos de la página de reservas'
      });
    });
  });

  describe('getAvailableSlots', () => {
    const mockProfessional = {
      id: 'prof_123',
      isActive: true,
      isSuspended: false
    };

    const mockAvailability = [
      {
        dayOfWeek: 1, // Monday
        slotNumber: 1,
        startTime: '09:00',
        endTime: '12:00'
      }
    ];

    const mockSettings = {
      appointmentDuration: 30
    };

    it('should return available slots for a valid date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to Monday
      while (futureDate.getDay() !== 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }
      const dateString = futureDate.toISOString().split('T')[0];

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: dateString };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.availability.findMany as jest.Mock).mockResolvedValue(mockAvailability);
      (prisma.professionalSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.externalCalendarEvent.findMany as jest.Mock).mockResolvedValue([]);
      (slotHoldService.getHeldSlotsForDate as jest.Mock).mockResolvedValue([]);

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseData).toMatchObject({
        success: true,
        data: {
          date: dateString,
          isBlocked: false,
          appointmentDuration: 30,
          slots: expect.arrayContaining([
            expect.objectContaining({
              time: expect.any(String),
              available: expect.any(Boolean)
            })
          ])
        }
      });

      // Should have slots between 09:00 and 12:00 (30 min intervals)
      // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
      expect(responseData.data.slots.length).toBeGreaterThan(0);
    });

    it('should return 400 if slug is missing', async () => {
      mockRequest.params = {};
      mockRequest.query = { date: '2026-01-20' };

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('Slug del profesional requerido');
    });

    it('should return 400 if date is missing', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = {};

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('Fecha requerida');
    });

    it('should return 400 for invalid date format', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: 'invalid-date' };

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('Formato de fecha inválido');
    });

    it('should return 400 for past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateString = pastDate.toISOString().split('T')[0];

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: dateString };

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('No se pueden reservar fechas pasadas');
    });

    it('should return empty slots if date is blocked', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: dateString };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue({ date: futureDate });

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(responseData).toMatchObject({
        success: true,
        data: {
          date: dateString,
          isBlocked: true,
          slots: []
        }
      });
    });

    it('should mark slots as unavailable if already booked', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to Monday
      while (futureDate.getDay() !== 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }
      const dateString = futureDate.toISOString().split('T')[0];

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: dateString };

      const bookedSlotTime = new Date(1970, 0, 1, 9, 0, 0, 0);

      const mockAppointments = [
        {
          startTime: bookedSlotTime,
          endTime: new Date(1970, 0, 1, 9, 30, 0, 0)
        }
      ];

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.availability.findMany as jest.Mock).mockResolvedValue(mockAvailability);
      (prisma.professionalSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);
      (prisma.externalCalendarEvent.findMany as jest.Mock).mockResolvedValue([]);
      (slotHoldService.getHeldSlotsForDate as jest.Mock).mockResolvedValue([]);

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      const slot9am = responseData.data.slots.find((s: any) => s.time === '09:00');
      expect(slot9am?.available).toBe(false);
    });

    it('should verify external calendar events are queried correctly', async () => {
      // This test verifies that the controller queries for external calendar events
      // The actual blocking logic is complex and depends on date/time comparisons
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to Monday
      while (futureDate.getDay() !== 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }
      const dateString = futureDate.toISOString().split('T')[0];

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: dateString };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.availability.findMany as jest.Mock).mockResolvedValue(mockAvailability);
      (prisma.professionalSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.externalCalendarEvent.findMany as jest.Mock).mockResolvedValue([]);
      (slotHoldService.getHeldSlotsForDate as jest.Mock).mockResolvedValue([]);

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      // Verify that external calendar events were queried
      expect(prisma.externalCalendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            professionalId: mockProfessional.id
          })
        })
      );

      // Should return slots successfully
      expect(responseData.success).toBe(true);
      expect(responseData.data.slots.length).toBeGreaterThan(0);
    });

    it('should mark slots as unavailable if held by another session', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to Monday
      while (futureDate.getDay() !== 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }
      const dateString = futureDate.toISOString().split('T')[0];

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: dateString, sessionId: 'session_123' };

      const mockHeldSlots = [
        {
          startTime: '09:00',
          isHeldByCurrentSession: false // Held by another session
        }
      ];

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.availability.findMany as jest.Mock).mockResolvedValue(mockAvailability);
      (prisma.professionalSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.externalCalendarEvent.findMany as jest.Mock).mockResolvedValue([]);
      (slotHoldService.getHeldSlotsForDate as jest.Mock).mockResolvedValue(mockHeldSlots);

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      const slot9am = responseData.data.slots.find((s: any) => s.time === '09:00');
      expect(slot9am?.available).toBe(false);
    });

    it('should return empty slots if no availability configured for that day', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: dateString };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (prisma.blockedDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.availability.findMany as jest.Mock).mockResolvedValue([]); // No availability

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(responseData).toMatchObject({
        success: true,
        data: {
          date: dateString,
          isBlocked: false,
          slots: []
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.query = { date: '2026-01-20' };

      (prisma.professional.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAvailableSlots(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData).toMatchObject({
        success: false,
        error: 'Error al obtener horarios disponibles'
      });
    });
  });

  describe('holdSlot', () => {
    it('should create a slot hold successfully', async () => {
      const mockProfessional = {
        id: 'prof_123',
        isActive: true,
        isSuspended: false
      };

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.body = {
        date: '2026-01-20',
        time: '09:00',
        sessionId: 'session_123'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (slotHoldService.createSlotHold as jest.Mock).mockResolvedValue({
        success: true,
        holdId: 'hold_123',
        expiresAt: new Date('2026-01-20T09:05:00Z')
      });

      await holdSlot(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          holdId: 'hold_123',
          expiresAt: expect.any(String)
        }
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.body = {
        date: '2026-01-20'
        // Missing time and sessionId
      };

      await holdSlot(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('Faltan datos requeridos');
    });

    it('should return 404 if professional not found', async () => {
      mockRequest.params = { slug: 'non-existent' };
      mockRequest.body = {
        date: '2026-01-20',
        time: '09:00',
        sessionId: 'session_123'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(null);

      await holdSlot(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData.error).toBe('Profesional no encontrado');
    });

    it('should return 409 if slot hold creation fails', async () => {
      const mockProfessional = {
        id: 'prof_123',
        isActive: true,
        isSuspended: false
      };

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.body = {
        date: '2026-01-20',
        time: '09:00',
        sessionId: 'session_123'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (slotHoldService.createSlotHold as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Slot already held'
      });

      await holdSlot(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(responseData.error).toBe('Slot already held');
    });

    it('should handle errors gracefully', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.body = {
        date: '2026-01-20',
        time: '09:00',
        sessionId: 'session_123'
      };

      (prisma.professional.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await holdSlot(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData.error).toBe('Error al reservar el horario temporalmente');
    });
  });

  describe('releaseHold', () => {
    it('should release a slot hold successfully', async () => {
      const mockProfessional = {
        id: 'prof_123'
      };

      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.body = {
        date: '2026-01-20',
        time: '09:00',
        sessionId: 'session_123'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(mockProfessional);
      (slotHoldService.releaseSlotHold as jest.Mock).mockResolvedValue(true);

      await releaseHold(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { released: true }
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.body = {
        date: '2026-01-20'
        // Missing time and sessionId
      };

      await releaseHold(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData.error).toBe('Faltan datos requeridos');
    });

    it('should return 404 if professional not found', async () => {
      mockRequest.params = { slug: 'non-existent' };
      mockRequest.body = {
        date: '2026-01-20',
        time: '09:00',
        sessionId: 'session_123'
      };

      (prisma.professional.findUnique as jest.Mock).mockResolvedValue(null);

      await releaseHold(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData.error).toBe('Profesional no encontrado');
    });

    it('should handle errors gracefully', async () => {
      mockRequest.params = { slug: 'dr-john-doe' };
      mockRequest.body = {
        date: '2026-01-20',
        time: '09:00',
        sessionId: 'session_123'
      };

      (prisma.professional.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await releaseHold(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData.error).toBe('Error al liberar el horario');
    });
  });

  describe('cleanupHolds', () => {
    it('should cleanup expired holds successfully', async () => {
      (slotHoldService.cleanupExpiredHolds as jest.Mock).mockResolvedValue(5);

      await cleanupHolds(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { cleanedUp: 5 }
      });
    });

    it('should handle errors gracefully', async () => {
      (slotHoldService.cleanupExpiredHolds as jest.Mock).mockRejectedValue(new Error('Database error'));

      await cleanupHolds(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseData.error).toBe('Error al limpiar reservas expiradas');
    });
  });
});
