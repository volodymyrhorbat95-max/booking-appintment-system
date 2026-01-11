/**
 * Unit Tests for Statistics Controller
 * Tests professional statistics generation and calculations
 */

// Mock Prisma client
const mockPrisma: any = {
  appointment: {
    findMany: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true,
}));

// Mock logger
jest.mock('../../utils/logger');

// Import after mocks
import { Request, Response } from 'express';
import { getMyStatistics } from '../../controllers/statistics.controller';

describe('Statistics Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockRequest = {
      user: { id: 'prof_123', email: 'prof@example.com', role: 'PROFESSIONAL' as any },
      query: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe('getMyStatistics', () => {
    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
      });
    });

    it('should use default date range (last 12 months) if no dates provided', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          professionalId: 'prof_123',
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        select: {
          id: true,
          date: true,
          status: true,
        },
      });

      // Verify date range is approximately 12 months
      const callArgs = mockPrisma.appointment.findMany.mock.calls[0][0];
      const start = callArgs.where.date.gte;
      const end = callArgs.where.date.lte;

      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 +
                         (end.getMonth() - start.getMonth());

      expect(monthsDiff).toBeGreaterThanOrEqual(11);
      expect(monthsDiff).toBeLessThanOrEqual(12);
    });

    it('should use provided date range if specified', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';

      mockRequest.query = { startDate, endDate };
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      const callArgs = mockPrisma.appointment.findMany.mock.calls[0][0];
      const start = callArgs.where.date.gte;
      const end = callArgs.where.date.lte;

      expect(start).toEqual(new Date(startDate));
      expect(end).toEqual(new Date(endDate));
    });

    it('should correctly count appointments by status', async () => {
      const appointments = [
        { id: '1', date: new Date('2026-01-05'), status: 'PENDING' },
        { id: '2', date: new Date('2026-01-06'), status: 'PENDING_PAYMENT' },
        { id: '3', date: new Date('2026-01-07'), status: 'REMINDER_SENT' },
        { id: '4', date: new Date('2026-01-08'), status: 'CONFIRMED' },
        { id: '5', date: new Date('2026-01-09'), status: 'CONFIRMED' },
        { id: '6', date: new Date('2026-01-10'), status: 'COMPLETED' },
        { id: '7', date: new Date('2026-01-11'), status: 'COMPLETED' },
        { id: '8', date: new Date('2026-01-12'), status: 'COMPLETED' },
        { id: '9', date: new Date('2026-01-13'), status: 'CANCELLED' },
        { id: '10', date: new Date('2026-01-14'), status: 'NO_SHOW' },
      ];

      mockPrisma.appointment.findMany.mockResolvedValue(appointments);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        statistics: expect.objectContaining({
          appointments: {
            total: 10,
            pending: 3, // PENDING, PENDING_PAYMENT, REMINDER_SENT
            confirmed: 2,
            completed: 3,
            cancelled: 1,
            noShow: 1,
          },
        }),
      });
    });

    it('should calculate rates correctly', async () => {
      const appointments = [
        { id: '1', date: new Date('2026-01-05'), status: 'CONFIRMED' },
        { id: '2', date: new Date('2026-01-06'), status: 'CONFIRMED' },
        { id: '3', date: new Date('2026-01-07'), status: 'COMPLETED' },
        { id: '4', date: new Date('2026-01-08'), status: 'COMPLETED' },
        { id: '5', date: new Date('2026-01-09'), status: 'COMPLETED' },
        { id: '6', date: new Date('2026-01-10'), status: 'COMPLETED' },
        { id: '7', date: new Date('2026-01-11'), status: 'CANCELLED' },
        { id: '8', date: new Date('2026-01-12'), status: 'CANCELLED' },
        { id: '9', date: new Date('2026-01-13'), status: 'NO_SHOW' },
        { id: '10', date: new Date('2026-01-14'), status: 'PENDING' },
      ];

      mockPrisma.appointment.findMany.mockResolvedValue(appointments);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        statistics: expect.objectContaining({
          rates: {
            confirmationRate: 60, // (2 confirmed + 4 completed) / 10 = 60%
            cancellationRate: 20, // 2 / 10 = 20%
            noShowRate: 10,       // 1 / 10 = 10%
            completionRate: 40,   // 4 / 10 = 40%
          },
        }),
      });
    });

    it('should avoid division by zero with no appointments', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        statistics: expect.objectContaining({
          appointments: {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
          },
          rates: {
            confirmationRate: 0,
            cancellationRate: 0,
            noShowRate: 0,
            completionRate: 0,
          },
        }),
      });
    });

    it('should group appointments by month correctly', async () => {
      // Use mid-month dates to avoid timezone boundary issues
      const appointments = [
        { id: '1', date: new Date(2026, 2, 10), status: 'COMPLETED' }, // March 10
        { id: '2', date: new Date(2026, 2, 15), status: 'COMPLETED' }, // March 15
        { id: '3', date: new Date(2026, 2, 25), status: 'CANCELLED' }, // March 25
        { id: '4', date: new Date(2026, 3, 5), status: 'COMPLETED' },  // April 5
        { id: '5', date: new Date(2026, 3, 15), status: 'PENDING' },   // April 15
        { id: '6', date: new Date(2026, 4, 10), status: 'CANCELLED' }, // May 10
      ];

      mockRequest.query = {
        startDate: new Date(2026, 2, 1).toISOString(),  // March 1
        endDate: new Date(2026, 4, 31).toISOString(),   // May 31
      };

      mockPrisma.appointment.findMany.mockResolvedValue(appointments);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const byMonth = response.statistics.byMonth;

      // Verify we have the correct total counts
      const totalAppointments = byMonth.reduce((sum: number, m: any) => sum + m.total, 0);
      const totalCompleted = byMonth.reduce((sum: number, m: any) => sum + m.completed, 0);
      const totalCancelled = byMonth.reduce((sum: number, m: any) => sum + m.cancelled, 0);

      expect(totalAppointments).toBe(6);
      expect(totalCompleted).toBe(3);
      expect(totalCancelled).toBe(2);

      // Verify sorted chronologically
      for (let i = 1; i < byMonth.length; i++) {
        expect(byMonth[i].month >= byMonth[i - 1].month).toBe(true);
      }
    });

    it('should initialize all months in range even if no appointments', async () => {
      mockRequest.query = {
        startDate: new Date(2026, 2, 1).toISOString(),  // March 1
        endDate: new Date(2026, 4, 31).toISOString(),   // May 31
      };

      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const byMonth = response.statistics.byMonth;

      // Should have at least 3 months initialized
      expect(byMonth.length).toBeGreaterThanOrEqual(3);

      // All months should have 0 counts
      byMonth.forEach((month: any) => {
        expect(month.total).toBe(0);
        expect(month.completed).toBe(0);
        expect(month.cancelled).toBe(0);
      });

      // Verify sorted chronologically
      for (let i = 1; i < byMonth.length; i++) {
        expect(byMonth[i].month >= byMonth[i - 1].month).toBe(true);
      }
    });

    it('should return period information in response', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';

      mockRequest.query = { startDate, endDate };
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        statistics: expect.objectContaining({
          period: {
            start: new Date(startDate).toISOString(),
            end: new Date(endDate).toISOString(),
          },
        }),
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.appointment.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Error al obtener estadísticas',
      });
    });

    it('should sort months chronologically', async () => {
      const appointments = [
        { id: '1', date: new Date(2026, 4, 5), status: 'COMPLETED' },  // May 5
        { id: '2', date: new Date(2026, 2, 15), status: 'COMPLETED' }, // March 15
        { id: '3', date: new Date(2026, 3, 25), status: 'CANCELLED' }, // April 25
      ];

      mockRequest.query = {
        startDate: new Date(2026, 2, 1).toISOString(),  // March 1
        endDate: new Date(2026, 4, 31).toISOString(),   // May 31
      };

      mockPrisma.appointment.findMany.mockResolvedValue(appointments);

      await getMyStatistics(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const byMonth = response.statistics.byMonth;

      // Should be sorted by month key (chronological order)
      // Find indices of the months we care about
      const marIndex = byMonth.findIndex((m: any) => m.month === '2026-03');
      const aprIndex = byMonth.findIndex((m: any) => m.month === '2026-04');
      const mayIndex = byMonth.findIndex((m: any) => m.month === '2026-05');

      // Verify chronological order
      expect(marIndex).toBeGreaterThanOrEqual(0);
      expect(aprIndex).toBeGreaterThanOrEqual(0);
      expect(mayIndex).toBeGreaterThanOrEqual(0);
      expect(marIndex).toBeLessThan(aprIndex);
      expect(aprIndex).toBeLessThan(mayIndex);
    });
  });
});
