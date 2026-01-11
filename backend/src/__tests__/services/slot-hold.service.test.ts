// Mock Prisma client (must be before imports)
const mockSlotHold = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn()
};

const mockAppointment = {
  findFirst: jest.fn()
};

const mockTransaction = jest.fn();

const mockPrisma: any = {
  slotHold: mockSlotHold,
  appointment: mockAppointment,
  $transaction: mockTransaction
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true
}));

// NOW import the service (after mocks are defined)
import {
  createSlotHold,
  releaseSlotHold,
  checkSlotHold,
  getHeldSlotsForDate,
  cleanupExpiredHolds,
  validateHoldForBooking,
  consumeSlotHold
} from '../../services/slot-hold.service';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Slot Hold Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  const baseParams = {
    professionalId: 'prof_123',
    date: new Date('2026-02-15T00:00:00Z'),
    startTime: new Date('2026-02-15T10:00:00Z'),
    sessionId: 'session_abc'
  };

  // ============================================
  // CREATE SLOT HOLD
  // ============================================

  describe('createSlotHold', () => {
    it('should create a new slot hold successfully', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

      // Mock cleanup (no expired holds)
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Mock no existing hold
        mockPrisma.slotHold.findUnique.mockResolvedValue(null);

        // Mock no existing appointment
        mockPrisma.appointment.findFirst.mockResolvedValue(null);

        // Mock create hold
        mockPrisma.slotHold.create.mockResolvedValue({
          id: 'hold_123',
          ...baseParams,
          expiresAt,
          createdAt: now
        });

        return await callback(mockPrisma);
      });

      const result = await createSlotHold(baseParams);

      expect(result.success).toBe(true);
      expect(result.holdId).toBe('hold_123');
      expect(result.expiresAt).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should extend existing hold when same session ID', async () => {
      const now = new Date();
      const existingExpiresAt = new Date(now.getTime() + 2 * 60 * 1000);
      const newExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Mock existing hold with same session ID
        mockPrisma.slotHold.findUnique.mockResolvedValue({
          id: 'hold_123',
          ...baseParams,
          expiresAt: existingExpiresAt
        });

        // Mock update hold
        mockPrisma.slotHold.update.mockResolvedValue({
          id: 'hold_123',
          ...baseParams,
          expiresAt: newExpiresAt
        });

        return await callback(mockPrisma);
      });

      const result = await createSlotHold(baseParams);

      expect(result.success).toBe(true);
      expect(result.holdId).toBe('hold_123');
      expect(mockPrisma.slotHold.update).toHaveBeenCalledWith({
        where: { id: 'hold_123' },
        data: { expiresAt: expect.any(Date) }
      });
    });

    it('should reject when slot is held by another session', async () => {
      const now = new Date();
      const futureExpiry = new Date(now.getTime() + 3 * 60 * 1000);

      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Mock existing hold with DIFFERENT session ID
        mockPrisma.slotHold.findUnique.mockResolvedValue({
          id: 'hold_456',
          ...baseParams,
          sessionId: 'session_xyz', // Different session
          expiresAt: futureExpiry
        });

        return await callback(mockPrisma);
      });

      const result = await createSlotHold(baseParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Este horario está siendo reservado por otra persona');
      expect(mockPrisma.slotHold.create).not.toHaveBeenCalled();
    });

    it('should replace expired hold from another session', async () => {
      const now = new Date();
      const pastExpiry = new Date(now.getTime() - 1000); // Expired

      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Mock expired hold from different session
        mockPrisma.slotHold.findUnique.mockResolvedValue({
          id: 'hold_456',
          ...baseParams,
          sessionId: 'session_xyz',
          expiresAt: pastExpiry
        });

        mockPrisma.slotHold.delete.mockResolvedValue({ id: 'hold_456' });
        mockPrisma.appointment.findFirst.mockResolvedValue(null);
        mockPrisma.slotHold.create.mockResolvedValue({
          id: 'hold_789',
          ...baseParams,
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
        });

        return await callback(mockPrisma);
      });

      const result = await createSlotHold(baseParams);

      expect(result.success).toBe(true);
      expect(result.holdId).toBe('hold_789');
      expect(mockPrisma.slotHold.delete).toHaveBeenCalledWith({
        where: { id: 'hold_456' }
      });
      expect(mockPrisma.slotHold.create).toHaveBeenCalled();
    });

    it('should reject when slot is already booked', async () => {
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.slotHold.findUnique.mockResolvedValue(null);

        // Mock existing appointment
        mockPrisma.appointment.findFirst.mockResolvedValue({
          id: 'apt_123',
          ...baseParams,
          status: 'CONFIRMED'
        });

        return await callback(mockPrisma);
      });

      const result = await createSlotHold(baseParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Este horario ya no está disponible');
      expect(mockPrisma.slotHold.create).not.toHaveBeenCalled();
    });

    it('should allow hold when appointment is cancelled', async () => {
      const now = new Date();

      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.slotHold.findUnique.mockResolvedValue(null);

        // Mock cancelled appointment (should not block)
        mockPrisma.appointment.findFirst.mockResolvedValue(null); // notIn filter excludes CANCELLED

        mockPrisma.slotHold.create.mockResolvedValue({
          id: 'hold_123',
          ...baseParams,
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
        });

        return await callback(mockPrisma);
      });

      const result = await createSlotHold(baseParams);

      expect(result.success).toBe(true);
      expect(result.holdId).toBe('hold_123');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.slotHold.deleteMany.mockRejectedValue(new Error('DB connection error'));

      const result = await createSlotHold(baseParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al reservar el horario temporalmente');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should cleanup expired holds before creating new hold', async () => {
      const now = new Date();

      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 3 });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.slotHold.findUnique.mockResolvedValue(null);
        mockPrisma.appointment.findFirst.mockResolvedValue(null);
        mockPrisma.slotHold.create.mockResolvedValue({
          id: 'hold_123',
          ...baseParams,
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000)
        });

        return await callback(mockPrisma);
      });

      await createSlotHold(baseParams);

      expect(mockPrisma.slotHold.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lte: expect.any(Date) }
        }
      });
    });
  });

  // ============================================
  // RELEASE SLOT HOLD
  // ============================================

  describe('releaseSlotHold', () => {
    it('should release hold for matching session ID', async () => {
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 1 });

      const result = await releaseSlotHold(baseParams);

      expect(result).toBe(true);
      expect(mockPrisma.slotHold.deleteMany).toHaveBeenCalledWith({
        where: {
          professionalId: baseParams.professionalId,
          date: baseParams.date,
          startTime: baseParams.startTime,
          sessionId: baseParams.sessionId
        }
      });
    });

    it('should return false when no hold found', async () => {
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      const result = await releaseSlotHold(baseParams);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.slotHold.deleteMany.mockRejectedValue(new Error('DB error'));

      const result = await releaseSlotHold(baseParams);

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  // ============================================
  // CHECK SLOT HOLD
  // ============================================

  describe('checkSlotHold', () => {
    it('should return not held when no hold exists', async () => {
      mockPrisma.slotHold.findUnique.mockResolvedValue(null);

      const result = await checkSlotHold(baseParams);

      expect(result.isHeld).toBe(false);
      expect(result.isHeldByCurrentSession).toBe(false);
    });

    it('should return not held when hold is expired', async () => {
      const pastExpiry = new Date(Date.now() - 1000);

      mockPrisma.slotHold.findUnique.mockResolvedValue({
        id: 'hold_123',
        ...baseParams,
        expiresAt: pastExpiry
      });

      const result = await checkSlotHold(baseParams);

      expect(result.isHeld).toBe(false);
      expect(result.isHeldByCurrentSession).toBe(false);
    });

    it('should return held by current session when session ID matches', async () => {
      const futureExpiry = new Date(Date.now() + 3 * 60 * 1000);

      mockPrisma.slotHold.findUnique.mockResolvedValue({
        id: 'hold_123',
        ...baseParams,
        expiresAt: futureExpiry
      });

      const result = await checkSlotHold(baseParams);

      expect(result.isHeld).toBe(true);
      expect(result.isHeldByCurrentSession).toBe(true);
      expect(result.expiresAt).toEqual(futureExpiry);
    });

    it('should return held but not by current session when session ID differs', async () => {
      const futureExpiry = new Date(Date.now() + 3 * 60 * 1000);

      mockPrisma.slotHold.findUnique.mockResolvedValue({
        id: 'hold_123',
        ...baseParams,
        sessionId: 'session_xyz', // Different
        expiresAt: futureExpiry
      });

      const result = await checkSlotHold(baseParams);

      expect(result.isHeld).toBe(true);
      expect(result.isHeldByCurrentSession).toBe(false);
    });

    it('should return not held by current session when no session ID provided', async () => {
      const futureExpiry = new Date(Date.now() + 3 * 60 * 1000);

      mockPrisma.slotHold.findUnique.mockResolvedValue({
        id: 'hold_123',
        professionalId: baseParams.professionalId,
        date: baseParams.date,
        startTime: baseParams.startTime,
        sessionId: baseParams.sessionId,
        expiresAt: futureExpiry
      });

      const params = {
        professionalId: baseParams.professionalId,
        date: baseParams.date,
        startTime: baseParams.startTime
        // No sessionId
      };

      const result = await checkSlotHold(params);

      expect(result.isHeld).toBe(true);
      expect(result.isHeldByCurrentSession).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.slotHold.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await checkSlotHold(baseParams);

      expect(result.isHeld).toBe(false);
      expect(result.isHeldByCurrentSession).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  // ============================================
  // GET HELD SLOTS FOR DATE
  // ============================================

  describe('getHeldSlotsForDate', () => {
    it('should return all held slots for a date', async () => {
      const futureExpiry = new Date(Date.now() + 3 * 60 * 1000);

      mockPrisma.slotHold.findMany.mockResolvedValue([
        {
          id: 'hold_1',
          professionalId: baseParams.professionalId,
          date: baseParams.date,
          startTime: new Date('2026-02-15T10:00:00Z'),
          sessionId: 'session_abc',
          expiresAt: futureExpiry
        },
        {
          id: 'hold_2',
          professionalId: baseParams.professionalId,
          date: baseParams.date,
          startTime: new Date('2026-02-15T11:00:00Z'),
          sessionId: 'session_xyz',
          expiresAt: futureExpiry
        }
      ]);

      const result = await getHeldSlotsForDate({
        professionalId: baseParams.professionalId,
        date: baseParams.date,
        sessionId: 'session_abc'
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        startTime: '10:00',
        isHeldByCurrentSession: true
      });
      expect(result[1]).toEqual({
        startTime: '11:00',
        isHeldByCurrentSession: false
      });
    });

    it('should handle string startTime format', async () => {
      const futureExpiry = new Date(Date.now() + 3 * 60 * 1000);

      mockPrisma.slotHold.findMany.mockResolvedValue([
        {
          id: 'hold_1',
          professionalId: baseParams.professionalId,
          date: baseParams.date,
          startTime: '14:30:00', // String format
          sessionId: 'session_abc',
          expiresAt: futureExpiry
        }
      ]);

      const result = await getHeldSlotsForDate({
        professionalId: baseParams.professionalId,
        date: baseParams.date,
        sessionId: 'session_abc'
      });

      expect(result).toHaveLength(1);
      expect(result[0].startTime).toBe('14:30');
    });

    it('should return empty array when no holds exist', async () => {
      mockPrisma.slotHold.findMany.mockResolvedValue([]);

      const result = await getHeldSlotsForDate({
        professionalId: baseParams.professionalId,
        date: baseParams.date
      });

      expect(result).toEqual([]);
    });

    it('should only return non-expired holds', async () => {
      mockPrisma.slotHold.findMany.mockResolvedValue([]);

      await getHeldSlotsForDate({
        professionalId: baseParams.professionalId,
        date: baseParams.date
      });

      expect(mockPrisma.slotHold.findMany).toHaveBeenCalledWith({
        where: {
          professionalId: baseParams.professionalId,
          date: baseParams.date,
          expiresAt: { gt: expect.any(Date) }
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.slotHold.findMany.mockRejectedValue(new Error('DB error'));

      const result = await getHeldSlotsForDate({
        professionalId: baseParams.professionalId,
        date: baseParams.date
      });

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  // ============================================
  // CLEANUP EXPIRED HOLDS
  // ============================================

  describe('cleanupExpiredHolds', () => {
    it('should delete expired holds', async () => {
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 5 });

      const result = await cleanupExpiredHolds();

      expect(result).toBe(5);
      expect(mockPrisma.slotHold.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lte: expect.any(Date) }
        }
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('Cleaned up 5 expired slot holds');
    });

    it('should return 0 when no expired holds', async () => {
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      const result = await cleanupExpiredHolds();

      expect(result).toBe(0);
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.slotHold.deleteMany.mockRejectedValue(new Error('DB error'));

      const result = await cleanupExpiredHolds();

      expect(result).toBe(0);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  // ============================================
  // VALIDATE HOLD FOR BOOKING
  // ============================================

  describe('validateHoldForBooking', () => {
    it('should return true when no hold exists', async () => {
      mockPrisma.slotHold.findUnique.mockResolvedValue(null);

      const result = await validateHoldForBooking(baseParams);

      expect(result).toBe(true);
    });

    it('should return true when hold belongs to current session and is valid', async () => {
      const futureExpiry = new Date(Date.now() + 3 * 60 * 1000);

      mockPrisma.slotHold.findUnique.mockResolvedValue({
        id: 'hold_123',
        ...baseParams,
        expiresAt: futureExpiry
      });

      const result = await validateHoldForBooking(baseParams);

      expect(result).toBe(true);
    });

    it('should return false when hold belongs to another session and is valid', async () => {
      const futureExpiry = new Date(Date.now() + 3 * 60 * 1000);

      mockPrisma.slotHold.findUnique.mockResolvedValue({
        id: 'hold_123',
        ...baseParams,
        sessionId: 'session_xyz', // Different
        expiresAt: futureExpiry
      });

      const result = await validateHoldForBooking(baseParams);

      expect(result).toBe(false);
    });

    it('should cleanup expired hold and return true', async () => {
      const pastExpiry = new Date(Date.now() - 1000);

      mockPrisma.slotHold.findUnique.mockResolvedValue({
        id: 'hold_123',
        ...baseParams,
        sessionId: 'session_xyz',
        expiresAt: pastExpiry
      });

      mockPrisma.slotHold.delete.mockResolvedValue({ id: 'hold_123' });

      const result = await validateHoldForBooking(baseParams);

      expect(result).toBe(true);
      expect(mockPrisma.slotHold.delete).toHaveBeenCalledWith({
        where: { id: 'hold_123' }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.slotHold.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await validateHoldForBooking(baseParams);

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  // ============================================
  // CONSUME SLOT HOLD
  // ============================================

  describe('consumeSlotHold', () => {
    it('should delete hold for matching session ID', async () => {
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 1 });

      await consumeSlotHold(baseParams);

      expect(mockPrisma.slotHold.deleteMany).toHaveBeenCalledWith({
        where: {
          professionalId: baseParams.professionalId,
          date: baseParams.date,
          startTime: baseParams.startTime,
          sessionId: baseParams.sessionId
        }
      });
    });

    it('should handle database errors gracefully (non-critical)', async () => {
      mockPrisma.slotHold.deleteMany.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await expect(consumeSlotHold(baseParams)).resolves.toBeUndefined();

      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  // ============================================
  // CONCURRENT ACCESS SIMULATION
  // ============================================

  describe('Race Condition Scenarios', () => {
    it('should prevent two different sessions from holding same slot simultaneously', async () => {
      const session1Params = { ...baseParams, sessionId: 'session_1' };
      const session2Params = { ...baseParams, sessionId: 'session_2' };

      // Simulate session 1 creates hold
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      let holdCreated = false;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        if (!holdCreated) {
          // First call (session 1) - succeeds
          mockPrisma.slotHold.findUnique.mockResolvedValue(null);
          mockPrisma.appointment.findFirst.mockResolvedValue(null);
          mockPrisma.slotHold.create.mockResolvedValue({
            id: 'hold_1',
            ...session1Params,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
          });
          holdCreated = true;
        } else {
          // Second call (session 2) - finds existing hold
          mockPrisma.slotHold.findUnique.mockResolvedValue({
            id: 'hold_1',
            ...session1Params,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
          });
        }
        return await callback(mockPrisma);
      });

      // Session 1 creates hold
      const result1 = await createSlotHold(session1Params);
      expect(result1.success).toBe(true);

      // Session 2 tries to create hold for same slot
      const result2 = await createSlotHold(session2Params);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Este horario está siendo reservado por otra persona');
    });

    it('should allow same session to extend hold multiple times', async () => {
      mockPrisma.slotHold.deleteMany.mockResolvedValue({ count: 0 });

      const existingHold = {
        id: 'hold_123',
        ...baseParams,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000)
      };

      // First extension
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.slotHold.findUnique.mockResolvedValue(existingHold);
        mockPrisma.slotHold.update.mockResolvedValue({
          ...existingHold,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });
        return await callback(mockPrisma);
      });

      const result1 = await createSlotHold(baseParams);
      expect(result1.success).toBe(true);

      // Second extension
      const result2 = await createSlotHold(baseParams);
      expect(result2.success).toBe(true);

      expect(mockPrisma.slotHold.update).toHaveBeenCalledTimes(2);
    });
  });
});
